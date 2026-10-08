import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Order, OrderStatus } from '@/modules/order/order.model';
import { sendOrderStatusEmail, dispatchInBatches } from '@/services/emailService';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allows up to 5 minutes on serverless for high-volume batches (300-400 orders)

interface VerificationItem {
  orderId: string;       // Can be _id or aspireOrderId
  refId?: string;        // Database _id
  action: 'APPROVE' | 'REJECT';
  reason?: string;       // Mandatory if action is REJECT
}

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

    const body = await req.json();
    const items: VerificationItem[] = body.items;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'No verification items provided' }, { status: 400 });
    }

    // Pre-validate all items: if REJECT is chosen, reason must be non-empty
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!['APPROVE', 'REJECT'].includes(item.action)) {
        return NextResponse.json({ 
          success: false, 
          message: `Invalid action "${item.action}" for order ${item.orderId || item.refId}` 
        }, { status: 400 });
      }

      if (item.action === 'REJECT') {
        const trimmedReason = (item.reason || '').trim();
        if (!trimmedReason) {
          return NextResponse.json({ 
            success: false, 
            message: `Rejection reason is mandatory for rejected order ${item.orderId || item.refId}` 
          }, { status: 400 });
        }
      }
    }

    await connectToDatabase();
    const { Notification, NotificationType } = await import('@/modules/notification/notification.model');

    // Collect all candidate target IDs (_id or aspireOrderId)
    const targetRefIds: string[] = [];
    const targetAspireIds: string[] = [];

    items.forEach(it => {
      if (it.refId && it.refId.length === 24) targetRefIds.push(it.refId);
      if (it.orderId) {
        if (it.orderId.length === 24) targetRefIds.push(it.orderId);
        else targetAspireIds.push(it.orderId);
      }
    });

    const queryFilter = {
      $or: [
        ...(targetRefIds.length > 0 ? [{ _id: { $in: targetRefIds } }] : []),
        ...(targetAspireIds.length > 0 ? [{ aspireOrderId: { $in: targetAspireIds } }] : [])
      ],
      status: { $in: [OrderStatus.UNDER_VERIFICATION, OrderStatus.REFUND_FORM_SUBMITTED] }
    };

    const eligibleOrders = await Order.find(queryFilter).populate('buyer', 'name email mobile');

    if (eligibleOrders.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No eligible orders in Under Verification status were found matching the submitted sheet.' 
      }, { status: 404 });
    }

    // Map eligible orders by both _id and aspireOrderId for fast O(1) lookup
    const orderMap = new Map<string, any>();
    eligibleOrders.forEach(ord => {
      orderMap.set(ord._id.toString(), ord);
      if (ord.aspireOrderId) orderMap.set(ord.aspireOrderId, ord);
    });

    const actorTitle = userRole === 'SUBADMIN' ? 'SubAdmin' : 'Admin';
    const actorName = session.user.name || actorTitle;
    const now = new Date();

    const approvedOrderIds: string[] = [];
    const rejectedUpdates: Array<{ orderDoc: any; reason: string }> = [];

    // Separate into approvals and rejections
    items.forEach(item => {
      const matched = (item.refId && orderMap.get(item.refId)) || (item.orderId && orderMap.get(item.orderId));
      if (!matched) return;

      const docId = matched._id.toString();

      if (item.action === 'APPROVE') {
        if (!approvedOrderIds.includes(docId)) {
          approvedOrderIds.push(docId);
        }
      } else if (item.action === 'REJECT') {
        const reason = (item.reason || '').trim();
        if (!rejectedUpdates.some(r => r.orderDoc._id.toString() === docId)) {
          rejectedUpdates.push({ orderDoc: matched, reason });
        }
      }
    });

    // 1. Process Approvals in Batch
    if (approvedOrderIds.length > 0) {
      const approveActivity = {
        action: 'REFUND_AUTHORIZED',
        message: `Refund request authorized in bulk via CSV verification by ${actorName}.`,
        performedBy: session.user.id,
        performedByName: actorName,
        timestamp: now
      };

      await Order.updateMany(
        { _id: { $in: approvedOrderIds } },
        {
          $set: {
            status: OrderStatus.REFUND_APPROVED,
            'refundDetails.authorizedAt': now
          },
          $push: { activities: approveActivity }
        }
      );
    }

    // 2. Process Rejections (individualized for specific rejection reasons)
    if (rejectedUpdates.length > 0) {
      const rejectOperations = rejectedUpdates.map(({ orderDoc, reason }) => {
        const rejectActivity = {
          action: 'REFUND_REJECTED',
          message: `Refund request rejected in bulk via CSV verification. Reason: ${reason}`,
          performedBy: session.user.id,
          performedByName: actorName,
          timestamp: now
        };

        return Order.updateOne(
          { _id: orderDoc._id },
          {
            $set: {
              status: OrderStatus.REFUND_REJECTED,
              'refundDetails.rejectedAt': now,
              'refundDetails.rejectionNote': reason
            },
            $push: { activities: rejectActivity }
          }
        );
      });

      await Promise.all(rejectOperations);
    }

    // 3. Dispatch In-App Notifications
    const notificationsToInsert: any[] = [];

    approvedOrderIds.forEach(id => {
      const order = orderMap.get(id);
      if (order?.buyer) {
        notificationsToInsert.push({
          recipient: (order.buyer as any)?._id || order.buyer,
          type: NotificationType.ORDER_APPROVED,
          title: 'Refund Authorized',
          message: `Your refund for ${order.brandName || 'Order'} has been authorized by administration.`,
          metadata: { orderId: order._id, brand: order.brandName }
        });
      }
    });

    rejectedUpdates.forEach(({ orderDoc, reason }) => {
      if (orderDoc?.buyer) {
        notificationsToInsert.push({
          recipient: (orderDoc.buyer as any)?._id || orderDoc.buyer,
          type: NotificationType.ORDER_REJECTED,
          title: 'Refund Rejected',
          message: `Your refund for ${orderDoc.brandName || 'Order'} was rejected. Reason: ${reason}`,
          metadata: { orderId: orderDoc._id, brand: orderDoc.brandName }
        });
      }
    });

    if (notificationsToInsert.length > 0) {
      try {
        await Notification.insertMany(notificationsToInsert);
      } catch (notifErr) {
        console.error('[Bulk Verify CSV] In-app notification creation error:', notifErr);
      }
    }

    // 4. Dispatch Email Notifications in Concurrent Batches of 15
    const emailTasks: Array<{
      email: string;
      name: string;
      displayOrderId: string;
      status: OrderStatus;
      amount: number;
      reason?: string;
    }> = [];

    approvedOrderIds.forEach(id => {
      const order = orderMap.get(id);
      if (order) {
        const buyer = order.buyer as any;
        const recipientEmail = buyer?.email || order.buyerEmail;
        const recipientName = buyer?.name || order.reviewName || 'Customer';
        const refundAmt = order.refundDetails?.expectedPayout || order.amount || 0;
        const displayOrderId = order.userOrderId || order.aspireOrderId;

        if (recipientEmail) {
          emailTasks.push({
            email: recipientEmail,
            name: recipientName,
            displayOrderId,
            status: OrderStatus.REFUND_APPROVED,
            amount: refundAmt
          });
        }
      }
    });

    rejectedUpdates.forEach(({ orderDoc, reason }) => {
      const buyer = orderDoc.buyer as any;
      const recipientEmail = buyer?.email || orderDoc.buyerEmail;
      const recipientName = buyer?.name || orderDoc.reviewName || 'Customer';
      const refundAmt = orderDoc.refundDetails?.expectedPayout || orderDoc.amount || 0;
      const displayOrderId = orderDoc.userOrderId || orderDoc.aspireOrderId;

      if (recipientEmail) {
        emailTasks.push({
          email: recipientEmail,
          name: recipientName,
          displayOrderId,
          status: OrderStatus.REFUND_REJECTED,
          amount: refundAmt,
          reason
        });
      }
    });

    // Run batch dispatch with delay to ensure smooth ZeptoMail throughput
    if (emailTasks.length > 0) {
      try {
        await dispatchInBatches(emailTasks, 15, async (task) => {
          try {
            await sendOrderStatusEmail(
              task.email,
              task.name,
              task.displayOrderId,
              task.status,
              task.amount,
              task.reason
            );
          } catch (mailErr) {
            console.error(`[Bulk Verify CSV] Email dispatch failed for order ${task.displayOrderId}:`, mailErr);
          }
        }, 50);
      } catch (batchErr) {
        console.error('[Bulk Verify CSV] Batch email dispatch encountered errors:', batchErr);
      }
    }

    const totalProcessed = approvedOrderIds.length + rejectedUpdates.length;

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${totalProcessed} orders (${approvedOrderIds.length} approved, ${rejectedUpdates.length} rejected).`,
      approvedCount: approvedOrderIds.length,
      rejectedCount: rejectedUpdates.length,
      totalProcessed
    });
  } catch (error: any) {
    console.error('[Bulk Verify CSV API Error]:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal server error processing bulk verifications'
    }, { status: 500 });
  }
}
