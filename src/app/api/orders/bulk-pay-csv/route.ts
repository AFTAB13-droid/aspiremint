import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Order, OrderStatus } from '@/modules/order/order.model';

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

      // Find the order that is REFUND_APPROVED
      const query: any = {
        _id: orderId,
        status: OrderStatus.REFUND_APPROVED
      };

      if (role === 'MEDIATOR') {
        query.mediator = session.user.id;
      }

      const order = await Order.findOne(query);
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

      completedBuyers.add(order.buyer.toString());
      successCount++;
    }

    // Update buyers completed orders stats
    if (completedBuyers.size > 0) {
      try {
        const { User } = await import('@/modules/user/user.model');
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
