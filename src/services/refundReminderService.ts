import connectToDatabase from "@/lib/db";
import { Order, OrderStatus } from "@/modules/order/order.model";
import { sendRefundReminderEmail } from "@/services/emailService";
import { NotificationService } from "@/services/notification.service";
import { NotificationType } from "@/modules/notification/notification.model";

let lastRunTimestamp = 0;

/**
 * Checks for orders that were created >= 20 days ago and still have status 'REFUND_FORM_PENDING'.
 * Sends an urgent notification and reminder email to the buyer stating only 5 days remain,
 * with direct links to the refund form and order details.
 */
export async function checkAndSendRefundReminders(force = false) {
  // Throttle to run at most once every 15 minutes unless forced
  const now = Date.now();
  if (!force && now - lastRunTimestamp < 15 * 60 * 1000) {
    return { skipped: true, reason: "Throttled (last run < 15m ago)" };
  }
  lastRunTimestamp = now;

  await connectToDatabase();

  // 20 days ago cutoff
  const twentyDaysAgo = new Date(now - 20 * 24 * 60 * 60 * 1000);

  // Find orders created 20+ days ago that are still pending refund form submission
  const pendingOrders = await Order.find({
    status: OrderStatus.REFUND_FORM_PENDING,
    createdAt: { $lte: twentyDaysAgo },
    refundReminderSent: { $ne: true }
  })
    .populate("buyer", "name email")
    .limit(50); // Process in batches to maintain healthy SMTP throughput

  const results = {
    checked: pendingOrders.length,
    sent: 0,
    errors: 0,
    ordersProcessed: [] as string[]
  };

  for (const order of pendingOrders) {
    const buyer: any = order.buyer;
    const recipientEmail = buyer?.email || order.buyerEmail;
    const recipientName = buyer?.name || "Customer";

    if (!recipientEmail) {
      console.warn(`[Refund Reminder] Skipping order ${order.aspireOrderId} - no recipient email.`);
      continue;
    }

    try {
      // 1. Send 20-Day Urgent Reminder Email
      await sendRefundReminderEmail(recipientEmail, recipientName, order);

      // 2. Dispatch In-App Notification
      const buyerId = buyer?._id?.toString() || buyer?.toString() || order.buyer?.toString();
      if (buyerId) {
        try {
          await NotificationService.create({
            recipient: buyerId,
            type: NotificationType.ORDER_STATUS_CHANGED,
            title: "⏳ Only 5 Days Left: Fill Refund Form",
            message: `Urgent: You have only 5 days left to submit your refund form for order #${order.userOrderId || order.aspireOrderId} (${order.brandName || "Product"}). Please fill it now to secure your cashback.`,
            metadata: { orderId: order._id },
            actionUrl: `/app/refunds/fill/${order._id}`
          });
        } catch (notifErr) {
          console.error(`[Refund Reminder Notification Error] for order ${order.aspireOrderId}:`, notifErr);
        }
      }

      // 3. Mark reminder as sent on the order to prevent duplicates
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            refundReminderSent: true,
            refundReminderSentAt: new Date()
          },
          $push: {
            activities: {
              action: "REFUND_REMINDER_SENT",
              message: `Automated 20-day refund reminder email sent to ${recipientEmail} (5 days remaining).`,
              performedByName: "System Scheduler",
              timestamp: new Date()
            }
          }
        }
      );

      results.sent++;
      results.ordersProcessed.push(order.aspireOrderId || order._id.toString());
    } catch (err: any) {
      console.error(`[Refund Reminder Email Error] for order ${order.aspireOrderId}:`, err);
      results.errors++;
    }
  }

  return results;
}
