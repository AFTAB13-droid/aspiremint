import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Order, OrderStatus } from '@/modules/order/order.model';

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Verify ownership and status
    const order = await Order.findOne({ 
      _id: orderId, 
      buyer: session.user.id,
      status: OrderStatus.INVALIDATED 
    });

    if (!order) {
      return NextResponse.json({ 
        success: false, 
        message: 'Order not found or not eligible for deletion. Only INVALIDATED orders can be purged.' 
      }, { status: 404 });
    }

    await Order.deleteOne({ _id: orderId });

    return NextResponse.json({
      success: true,
      message: 'Order purged from database successfully.'
    });

  } catch (error) {
    console.error('Order Purge API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
