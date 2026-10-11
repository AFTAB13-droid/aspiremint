import connectToDatabase from "@/lib/db";
import { Order, OrderStatus } from "@/modules/order/order.model";
import { sendRefundReminderEmail } from "@/services/emailService";
import { NotificationService } from "@/services/notification.service";
import { NotificationType } from "@/modules/notification/notification.model";

let lastRunTimestamp = 0;

/**
 * Checks for orders with status 'REFUND_FORM_PENDING' and sends automated reminders:
 * - Milestone 25 Days: 25+ days passed (Final notice before expiration)
 * - Milestone 20 Days: 20+ days passed (Urgent reminder, 5-10 days remaining)
 * - Milestone 15 Days: 15+ days passed (Friendly first reminder)
 */
export async function checkAndSendRefundReminders(force = false) {
  // Throttle to run at most once every 15 minutes unless forced
  const now = Date.now();
  if (!force && now - lastRunTimestamp < 15 * 60 * 1000) {
    return { skipped: true, reason: "Throttled (last run < 15m ago)" };
  }
  lastRunTimestamp = now;

  await connectToDatabase();

  const twentyFiveDaysAgo = new Date(now - 25 * 24 * 60 * 60 * 1000);
  const twentyDaysAgo = new Date(now - 20 * 24 * 60 * 60 * 1000);
  const fifteenDaysAgo = new Date(now - 15 * 24 * 60 * 60 * 1000);

  const results = {
    checked: 0,
    sent: 0,
    sent15: 0,
    sent20: 0,
    sent25: 0,
    errors: 0,
    ordersProcessed: [] as string[]
  };

  // Helper to send milestone notification and update order
  const processMilestone = async (order: any, milestone: 15 | 20 | 25) => {
    const buyer: any = order.buyer;
    const recipientEmail = buyer?.email || order.buyerEmail;
    const recipientName = buyer?.name || "Customer";
    const orderIdDisplay = order.userOrderId || order.aspireOrderId || "Order";

    if (!recipientEmail) {
      console.warn(`[Refund Reminder] Skipping order ${order.aspireOrderId} - no recipient email.`);
      return;
    }

    try {
      // 1. Send Milestone Reminder Email
      await sendRefundReminderEmail(recipientEmail, recipientName, order, milestone);

      // 2. Dispatch In-App Notification
      const buyerId = buyer?._id?.toString() || buyer?.toString() || order.buyer?.toString();
      if (buyerId) {
        try {
          let notifTitle = "";
          let notifMessage = "";

          if (milestone === 25) {
            notifTitle = "🚨 Final Notice: Submit Refund Form";
            notifMessage = `Final Notice: 25 days have passed since order #${orderIdDisplay} was placed (${order.brandName || "Product"}). Please submit your refund form immediately to prevent claim cancellation.`;
          } else if (milestone === 20) {
            notifTitle = "⏳ Urgent: Submit Refund Form (20 Days Passed)";
            notifMessage = `Urgent: It has been 20 days since order #${orderIdDisplay} (${order.brandName || "Product"}). Please submit your refund form soon to secure your cashback.`;
          } else {
            notifTitle = "ℹ️ Friendly Reminder: Submit Refund Form";
            notifMessage = `Reminder: It has been 15 days since order #${orderIdDisplay} (${order.brandName || "Product"}). Don't forget to submit your refund form to claim your cashback payout.`;
          }

          await NotificationService.create({
            recipient: buyerId,
            type: NotificationType.ORDER_STATUS_CHANGED,
            title: notifTitle,
            message: notifMessage,
            metadata: { orderId: order._id },
            actionUrl: `/app/refunds/fill/${order._id}`
          });
        } catch (notifErr) {
          console.error(`[Refund Reminder Notification Error] for order ${order.aspireOrderId}:`, notifErr);
        }
      }

      // 3. Mark milestone as sent on the order
      const updateFields: any = {};
      const activityAction = `REFUND_REMINDER_${milestone}_SENT`;
      let activityMessage = "";

      if (milestone === 25) {
        updateFields.refundReminder25Sent = true;
        updateFields.refundReminder25SentAt = new Date();
        updateFields.refundReminder20Sent = true;
        updateFields.refundReminder15Sent = true;
        updateFields.refundReminderSent = true;
        activityMessage = `Automated 25-day final notice refund reminder email sent to ${recipientEmail}.`;
        results.sent25++;
      } else if (milestone === 20) {
        updateFields.refundReminder20Sent = true;
        updateFields.refundReminder20SentAt = new Date();
        updateFields.refundReminder15Sent = true;
        updateFields.refundReminderSent = true;
        updateFields.refundReminderSentAt = new Date();
        activityMessage = `Automated 20-day urgent refund reminder email sent to ${recipientEmail} (5 days remaining).`;
        results.sent20++;
      } else {
        updateFields.refundReminder15Sent = true;
        updateFields.refundReminder15SentAt = new Date();
        activityMessage = `Automated 15-day refund reminder email sent to ${recipientEmail}.`;
        results.sent15++;
      }

      await Order.updateOne(
        { _id: order._id },
        {
          $set: updateFields,
          $push: {
            activities: {
              action: activityAction,
              message: activityMessage,
              performedByName: "System Scheduler",
              timestamp: new Date()
            }
          }
        }
      );

      results.sent++;
      results.ordersProcessed.push(`${order.aspireOrderId || order._id} (Day ${milestone})`);
    } catch (err: any) {
      console.error(`[Refund Reminder Email Error (Day ${milestone})] for order ${order.aspireOrderId}:`, err);
      results.errors++;
    }
  };

  // 1. Process 25-Day Milestone (Orders created >= 25 days ago and haven't received 25-day reminder)
  const pending25 = await Order.find({
    status: OrderStatus.REFUND_FORM_PENDING,
    createdAt: { $lte: twentyFiveDaysAgo },
    refundReminder25Sent: { $ne: true }
  })
    .populate("buyer", "name email")
    .limit(30);

  results.checked += pending25.length;
  for (const order of pending25) {
    await processMilestone(order, 25);
  }

  // 2. Process 20-Day Milestone (Orders created >= 20 days ago and haven't received 20-day reminder)
  const pending20 = await Order.find({
    status: OrderStatus.REFUND_FORM_PENDING,
    createdAt: { $lte: twentyDaysAgo },
    refundReminder20Sent: { $ne: true },
    refundReminder25Sent: { $ne: true }
  })
    .populate("buyer", "name email")
    .limit(30);

  results.checked += pending20.length;
  for (const order of pending20) {
    await processMilestone(order, 20);
  }

  // 3. Process 15-Day Milestone (Orders created >= 15 days ago and haven't received 15-day reminder)
  const pending15 = await Order.find({
    status: OrderStatus.REFUND_FORM_PENDING,
    createdAt: { $lte: fifteenDaysAgo },
    refundReminder15Sent: { $ne: true },
    refundReminder20Sent: { $ne: true },
    refundReminder25Sent: { $ne: true }
  })
    .populate("buyer", "name email")
    .limit(30);

  results.checked += pending15.length;
  for (const order of pending15) {
    await processMilestone(order, 15);
  }

  return results;
}
