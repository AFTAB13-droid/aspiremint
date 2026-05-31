import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Order, OrderStatus } from '@/modules/order/order.model';
import connectToDatabase from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role || "USER";
    await connectToDatabase();

    let query: any = {};
    if (userRole === "USER") query.buyer = session.user.id;
    else if (userRole === "MEDIATOR") query.mediator = session.user.id;
    else if (userRole === "ADMIN") query = {};

    const [active, pending, completed] = await Promise.all([
      Order.countDocuments({ 
        ...query, 
        status: { $in: [
          OrderStatus.ACTIVE_ESCROW, 
          OrderStatus.REFUND_APPROVED, 
          OrderStatus.APPROVED, 
          OrderStatus.DISPUTE_RAISED, 
          OrderStatus.REFUND_PROCESSING
        ] } 
      }),
      Order.countDocuments({ 
        ...query, 
        status: { $in: [
          OrderStatus.ESCROW_PAYMENT_PENDING, 
          OrderStatus.REFUND_FORM_PENDING, 
          OrderStatus.UNDER_VERIFICATION, 
          OrderStatus.REFUND_FORM_SUBMITTED, 
          OrderStatus.PENDING_APPROVAL, 
          OrderStatus.REFUND_REJECTED
        ] } 
      }),
      Order.countDocuments({ 
        ...query, 
        status: { $in: [
          OrderStatus.COMPLETED, 
          OrderStatus.REFUNDED, 
          OrderStatus.CANCELLED
        ] } 
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { active, pending, completed }
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
