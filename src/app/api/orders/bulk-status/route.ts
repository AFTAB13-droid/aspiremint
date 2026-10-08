import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Order, OrderStatus } from '@/modules/order/order.model';
import { User } from '@/modules/user/user.model';
import { sendOrderStatusEmail, dispatchInBatches } from '@/services/emailService';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'SUBADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { orderIds, action, note } = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ success: false, message: 'No orders specified' }, { status: 400 });
    }

    if (!['APPROVE', 'REJECT', 'INVALIDATE'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    await connectToDatabase();
    const { Notification, NotificationType } = await import('@/modules/notification/notification.model');

    let newStatus;
    if (action === 'APPROVE') newStatus = OrderStatus.REFUND_APPROVED;
    else if (action === 'REJECT') newStatus = OrderStatus.REFUND_REJECTED;
    else newStatus = OrderStatus.INVALIDATED;
    
    const updatePayload: any = { status: newStatus };

    if (action === 'APPROVE') {
      updatePayload['refundDetails.authorizedAt'] = new Date();
    } else {
      updatePayload['refundDetails.rejectedAt'] = new Date();
      updatePayload['refundDetails.rejectionNote'] = note || (action === 'INVALIDATE' ? "Order invalidated by Admin." : "Bulk rejection processed by Admin.");
    }

    const actorTitle = userRole === 'SUBADMIN' ? 'SubAdmin' : 'admin';

    const activity = {
      action: action === 'APPROVE' ? "REFUND_AUTHORIZED" : action === 'REJECT' ? "REFUND_REJECTED" : "ORDER_INVALIDATED",
      message: action === 'APPROVE' 
        ? `Refund request authorized in bulk by ${actorTitle}.` 
        : action === 'REJECT'
        ? `Refund request rejected in bulk. Reason: ${note || "Not specified"}`
        : `Order invalidated by ${actorTitle}. Reason: ${note || "Not specified"}`,
      performedBy: session.user.id,
      performedByName: userRole === 'SUBADMIN' ? `SubAdmin ${session.user.name}` : session.user.name,
      timestamp: new Date()
    };

    const queryFilter: any = { _id: { $in: orderIds } };
    if (action === 'INVALIDATE') {
      queryFilter.status = { $in: [OrderStatus.REFUND_FORM_PENDING, OrderStatus.UNDER_VERIFICATION] };
    } else {
      queryFilter.status = OrderStatus.UNDER_VERIFICATION;
    }

    // Fetch orders first to get buyer information for notifications and emails
    const affectedOrders = await Order.find(queryFilter).populate('buyer', 'name email');
    
    if (affectedOrders.length === 0) {
      return NextResponse.json({ success: false, message: 'No eligible orders found' }, { status: 404 });
    }

    const result = await Order.updateMany(
      queryFilter,
      { 
        $set: updatePayload,
        $push: { activities: activity } 
      }
    );

    // Send notifications to all affected users
    try {
      const reason = note || (action === 'INVALIDATE' ? "Order invalidated by Admin." : "Bulk rejection processed by Admin.");
      const notifications = affectedOrders.map(order => ({
        recipient: (order.buyer as any)?._id || order.buyer,
        type: action === 'APPROVE' ? NotificationType.ORDER_APPROVED : (action === 'REJECT' ? NotificationType.ORDER_REJECTED : NotificationType.ORDER_INVALIDATED),
        title: action === 'APPROVE' ? "Refund Authorized" : (action === 'REJECT' ? "Refund Rejected" : "Order Invalidation Notice"),
        message: action === 'APPROVE' 
          ? `Your refund for ${order.brandName} has been authorized by administration.`
          : action === 'REJECT'
          ? `Your refund for ${order.brandName} was rejected. Reason: ${reason}`
          : `Your order for ${order.brandName} (${order.productCode}) has been invalidated. Reason: ${reason}`,
        metadata: { orderId: order._id, brand: order.brandName }
      }));

      await Notification.insertMany(notifications);
    } catch (notifError) {
      console.error('Failed to send bulk notifications:', notifError);
    }

    // Send email notifications to buyers on Approval or Rejection (in robust concurrent batches)
    if (action === 'APPROVE' || action === 'REJECT') {
      await dispatchInBatches(affectedOrders, 15, async (order) => {
        const buyer: any = order.buyer;
        const recipientEmail = buyer?.email || order.buyerEmail;
        const recipientName = buyer?.name || order.reviewName || "Customer";
        const refundAmt = order.refundDetails?.expectedPayout || order.amount;

        if (recipientEmail) {
          try {
            if (action === 'APPROVE') {
              await sendOrderStatusEmail(
                recipientEmail,
                recipientName,
                order.userOrderId || order.aspireOrderId,
                OrderStatus.REFUND_APPROVED,
                refundAmt
              );
            } else if (action === 'REJECT') {
              await sendOrderStatusEmail(
                recipientEmail,
                recipientName,
                order.userOrderId || order.aspireOrderId,
                OrderStatus.REFUND_REJECTED,
                refundAmt,
                note || "Bulk rejection processed by Admin."
              );
            }
          } catch (emailErr) {
            console.error(`Failed to send status update email for order ${order.aspireOrderId || order.userOrderId}:`, emailErr);
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} orders ${action.toLowerCase()}d successfully.`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk Status API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
