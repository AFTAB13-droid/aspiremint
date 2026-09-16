import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Order, OrderStatus } from '@/modules/order/order.model';
import { User } from '@/modules/user/user.model';
import { sendOrderPaymentEmail } from '@/services/emailService';
import { NotificationService } from '@/services/notification.service';
import { NotificationType } from '@/modules/notification/notification.model';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'MEDIATOR' && role !== 'ADMIN' && role !== 'SUBADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { payments } = await req.json();

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ success: false, message: 'No payments specified' }, { status: 400 });
    }

    await connectToDatabase();

    let successCount = 0;
    const completedBuyers = new Set<string>();

    for (const payment of payments) {
      const { orderId, transactionId, paidByName, paidAmount, paidAt } = payment;

      if (!orderId) continue;

      // Find the order that is REFUND_APPROVED or APPROVED
      const query: any = {
        _id: orderId,
        status: { $in: [OrderStatus.REFUND_APPROVED, OrderStatus.APPROVED] }
      };

      if (role === 'MEDIATOR') {
        query.mediator = session.user.id;
      }

      const order = await Order.findOne(query).populate('buyer', 'name email');
      if (!order) continue;

      const actorName = role === 'SUBADMIN' ? `SubAdmin ${session.user.name}` : session.user.name;
      let finalPayerName = paidByName || actorName;
      if (typeof paidByName === 'string' && paidByName.trim().toLowerCase() === 'me') {
        finalPayerName = actorName;
      }
      const finalTransactionId = transactionId || `CSV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const finalPaidAt = paidAt ? new Date(paidAt) : new Date();

      const updateData: any = {
        status: OrderStatus.COMPLETED,
        'paymentDetails.transactionId': finalTransactionId,
        'paymentDetails.paidAt': finalPaidAt,
        'paymentDetails.paidBy': session.user.id,
        'paymentDetails.paidByName': finalPayerName,
        mediatorNote: `CSV bulk payment processed. Payer: ${finalPayerName}`
      };

      if (typeof paidAmount === 'number' && !isNaN(paidAmount)) {
        updateData['refundDetails.expectedPayout'] = paidAmount;
      }

      const activity = {
        action: "ORDER_COMPLETED",
        message: `CSV Payout processed by ${role.toLowerCase()}. Payer: ${finalPayerName}. Amount: ₹${paidAmount ?? (order.refundDetails?.expectedPayout || order.amount)}.`,
        performedBy: session.user.id,
        performedByName: actorName,
        timestamp: new Date()
      };

      await Order.updateOne(
        { _id: order._id },
        {
          $set: updateData,
          $push: { activities: activity }
        }
      );

      const buyer: any = order.buyer;
      if (buyer || order.buyerEmail) {
        const buyerId = (buyer?._id || buyer)?.toString() || order.buyer?.toString();
        if (buyerId) completedBuyers.add(buyerId);
        const finalAmt = typeof paidAmount === 'number' && !isNaN(paidAmount) ? paidAmount : (order.refundDetails?.expectedPayout || order.amount);

        if (buyerId) {
          try {
            await NotificationService.create({
              recipient: buyerId,
              type: NotificationType.REFUND_COMPLETED,
              title: "Refund Paid",
              message: `Your refund of ₹${finalAmt} has been successfully paid by ${finalPayerName}.`,
              metadata: { orderId: order._id },
              actionUrl: `/app/orders/${order._id}`
            });
          } catch (nErr) {
            console.error('CSV Bulk pay notif error:', nErr);
          }
        }

        const recipientEmail = buyer?.email || order.buyerEmail;
        const recipientName = buyer?.name || order.reviewName || "Customer";
        if (recipientEmail) {
          try {
            await sendOrderPaymentEmail(
              recipientEmail,
              recipientName,
              order.aspireOrderId || order.userOrderId,
              {
                transactionId: finalTransactionId,
                paidAmount: finalAmt,
                paidAt: finalPaidAt,
                paidByName: finalPayerName,
                brandName: order.brandName,
                productName: order.reviewName
              }
            );
          } catch (eErr) {
            console.error('CSV Bulk pay email error:', eErr);
          }
        }
      }

      successCount++;
    }

    // Update buyers completed orders stats
    if (completedBuyers.size > 0) {
      try {
        await User.updateMany(
          { _id: { $in: Array.from(completedBuyers) } },
          { $inc: { totalCompletedOrders: 1 } }
        );
      } catch (countError) {
        console.error('Failed to increment buyer counts in CSV payout:', countError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${successCount} payments processed successfully.`,
      count: successCount
    });
  } catch (error) {
    console.error('CSV Bulk Payment API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
