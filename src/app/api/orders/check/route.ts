import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Order, OrderStatus } from '@/modules/order/order.model';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawOrderId = searchParams.get('orderId');

    if (!rawOrderId || !rawOrderId.trim()) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    const orderId = rawOrderId.trim();

    await connectToDatabase();

    const escaped = escapeRegExp(orderId);

    // Exact match for userOrderId, case-insensitive, excluding cancelled orders
    const existingOrder = await Order.findOne({ 
      userOrderId: { $regex: new RegExp(`^${escaped}$`, 'i') },
      status: { $ne: OrderStatus.CANCELLED }
    }).select('userOrderId status');

    return NextResponse.json(
      {
        success: true,
        exists: !!existingOrder
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('Check Order ID error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

