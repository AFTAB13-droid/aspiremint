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

    const { orderIds, transactionId, note, paidBy } = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ success: false, message: 'No orders specified' }, { status: 400 });
    }

    await connectToDatabase();

    // Verification Logic:
    // 1. Orders must be REFUND_APPROVED.
    // 2. If user is a MEDIATOR, they must be assigned to the order.
    const query: any = {
      _id: { $in: orderIds },
      status: OrderStatus.REFUND_APPROVED
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

    // Fetch orders to know the buyers before updating
    const ordersToComplete = await Order.find(query).select('buyer');
    
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
      const { User } = await import('@/modules/user/user.model');
      const buyerIds = Array.from(new Set(ordersToComplete.map(o => o.buyer.toString())));
      if (buyerIds.length > 0) {
        await User.updateMany(
          { _id: { $in: buyerIds } },
          { $inc: { totalCompletedOrders: 1 } }
        );
      }
    } catch (countError) {
      console.error('Failed to update buyer counts:', countError);
    }

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
