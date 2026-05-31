import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Order } from '@/modules/order/order.model';
import connectToDatabase from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUBADMIN") {
      return NextResponse.json({ success: false, message: 'Forbidden. Admin or SubAdmin access required.' }, { status: 403 });
    }

    await connectToDatabase();

    // Fetch the 20 most recently updated orders to simulate an activity feed
    const activity = await Order.find({})
      .populate("mediator", "name")
      .sort({ updatedAt: -1 })
      .limit(20);

    return NextResponse.json({ 
      success: true, 
      count: activity.length,
      data: activity 
    });
  } catch (error) {
    console.error('Admin Activity fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
