import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Order, OrderStatus } from '@/modules/order/order.model';
import { User } from '@/modules/user/user.model';
import { sendOrderPaymentEmail, dispatchInBatches } from '@/services/emailService';
import { NotificationService } from '@/services/notification.service';
import { NotificationType } from '@/modules/notification/notification.model';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

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

    const { orderIds, transactionId, note, paidBy } = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ success: false, message: 'No orders specified' }, { status: 400 });
    }

    await connectToDatabase();

    // Verification Logic:
    // 1. Orders must be REFUND_APPROVED or APPROVED.
    // 2. If user is a MEDIATOR, they must be assigned to the order.
    const query: any = {
      _id: { $in: orderIds },
      status: { $in: [OrderStatus.REFUND_APPROVED, OrderStatus.APPROVED] }
    };

    if (role === 'MEDIATOR') {
      query.mediator = session.user.id;
    }

    const actorName = role === 'SUBADMIN' ? `SubAdmin ${session.user.name}` : session.user.name;

    const updateData: any = {
      status: OrderStatus.COMPLETED,
      'paymentDetails.transactionId': transactionId || `BULK-${Date.now()}`,
      'paymentDetails.paidAt': new Date(),
      'paymentDetails.paidBy': session.user.id,
      'paymentDetails.paidByName': paidBy || actorName,
      mediatorNote: note || "Bulk payment processed."
    };

    const activity = {
      action: "ORDER_COMPLETED",
      message: `Bulk payment processed by ${role === 'SUBADMIN' ? 'SubAdmin' : role.toLowerCase()}.`,
      performedBy: session.user.id,
      performedByName: actorName,
      timestamp: new Date()
    };

    // Fetch orders with buyer and mediator info before updating
    const ordersToComplete = await Order.find(query)
      .populate('buyer', 'name email')
      .populate('mediator', 'name systemDisplayName');
    
    if (ordersToComplete.length === 0) {
      return NextResponse.json({ success: false, message: 'No eligible orders found' }, { status: 404 });
    }

    const result = await Order.updateMany(
      query, 
      { 
        $set: updateData,
        $push: { activities: activity }
      }
    );

    // Update Badge Counts efficiently
    try {
      const buyerIds = Array.from(new Set(ordersToComplete.map(o => (o.buyer as any)?._id?.toString() || o.buyer?.toString()).filter(Boolean)));
      if (buyerIds.length > 0) {
        await User.updateMany(
          { _id: { $in: buyerIds } },
          { $inc: { totalCompletedOrders: 1 } }
        );
      }
    } catch (countError) {
      console.error('Failed to update buyer counts:', countError);
    }

    // Trigger in-app notifications and refund paid emails in controlled concurrent batches
    const finalPayerName = paidBy || actorName;
    const finalTxId = updateData['paymentDetails.transactionId'];

    await dispatchInBatches(ordersToComplete, 15, async (ord) => {
      const buyer: any = ord.buyer;
      const buyerId = buyer?._id?.toString() || buyer?.toString() || ord.buyer?.toString();
      const refundAmt = ord.refundDetails?.expectedPayout || ord.amount;

      if (buyerId) {
        try {
          await NotificationService.create({
            recipient: buyerId,
            type: NotificationType.REFUND_COMPLETED,
            title: "Refund Paid",
            message: `Your refund of ₹${refundAmt} has been successfully paid by ${finalPayerName}.`,
            metadata: { orderId: ord._id },
            actionUrl: `/app/orders/${ord._id}`
          });
        } catch (notifErr) {
          console.error("Bulk-pay notification error:", notifErr);
        }
      }

      const recipientEmail = buyer?.email || ord.buyerEmail;
      const recipientName = buyer?.name || ord.reviewName || "Customer";
      if (recipientEmail) {
        try {
          await sendOrderPaymentEmail(
            recipientEmail,
            recipientName,
            ord.userOrderId || ord.aspireOrderId,
            {
              userOrderId: ord.userOrderId,
              transactionId: finalTxId,
              paidAmount: refundAmt,
              paidAt: new Date(),
              paidByName: finalPayerName,
              brandName: ord.brandName,
              productCode: ord.productCode
            }
          );
        } catch (emailErr) {
          console.error(`Bulk-pay email error for order ${ord.userOrderId || ord.aspireOrderId}:`, emailErr);
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} orders processed successfully.`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk Payment API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
