import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Order } from '@/modules/order/order.model';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Exact match for userOrderId, case-insensitive
    const existingOrder = await Order.findOne({ 
      userOrderId: { $regex: new RegExp(`^${orderId}$`, 'i') } 
    }).select('userOrderId');

    return NextResponse.json({
      success: true,
      exists: !!existingOrder
    });
  } catch (error) {
    console.error('Check Order ID error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
