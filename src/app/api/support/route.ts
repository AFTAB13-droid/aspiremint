import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { SupportTicket, TicketStatus } from '@/modules/support/support.model';
import { Order } from '@/modules/order/order.model';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { subject, query, screenshot, orderId, type } = await req.json();

    if (!subject || !query) {
      return NextResponse.json({ success: false, message: 'Subject and query are required' }, { status: 400 });
    }

    await connectToDatabase();

    let ticketData: any = {
      user: session.user.id,
      subject,
      query,
      screenshot,
      type: type || 'ORDER_DISPUTE',
      status: TicketStatus.OPEN,
      messages: [
        {
          sender: session.user.id,
          senderRole: 'USER',
          text: query,
          createdAt: new Date()
        }
      ]
    };

    if (ticketData.type === 'ORDER_DISPUTE') {
      if (!orderId) {
        return NextResponse.json({ success: false, message: 'Order ID is required for disputes' }, { status: 400 });
      }
      const order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
      }
      if (!order.mediator) {
        return NextResponse.json({ success: false, message: 'No mediator assigned to this order' }, { status: 400 });
      }
      ticketData.order = orderId;
      ticketData.mediator = order.mediator;
    }

    const newTicket = new SupportTicket(ticketData);
    await newTicket.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Ticket created successfully',
      data: newTicket 
    });
  } catch (error) {
    console.error('Support Ticket Creation error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role || 'USER';
    await connectToDatabase();

    let dbQuery = {};
    if (userRole === 'USER') {
      dbQuery = { user: session.user.id };
    } else if (userRole === 'MEDIATOR') {
      dbQuery = { mediator: session.user.id, type: 'ORDER_DISPUTE' };
    } else if (userRole === 'ADMIN') {
      // Admins see General Queries + monitoring capability
      dbQuery = { $or: [{ type: 'GENERAL_QUERY' }, { type: 'ORDER_DISPUTE' }] };
    } else {
      return NextResponse.json({ success: false, message: 'Access Denied' }, { status: 403 });
    }

    const tickets = await SupportTicket.find(dbQuery)
      .populate('user', 'name email mobile aspireMintId')
      .populate('order', 'aspireOrderId userOrderId brandName status reviewType dealType')
      .populate('mediator', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      data: tickets 
    });
  } catch (error) {
    console.error('Support Tickets Fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
