import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { SupportTicket } from '@/modules/support/support.model';
import redis from '@/lib/redis';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role || 'USER';
    await connectToDatabase();
    
    const query = await SupportTicket.findById(params.id)
      .populate('user', 'name aspireMintId mobile')
      .populate('order', 'aspireOrderId brandName status');
    
    if (!query) {
      return NextResponse.json({ success: false, message: 'Query not found' }, { status: 404 });
    }

    // Role-based access: 
    // Admin sees all. 
    // User sees their own. 
    // Mediator sees assigned tickets.
    const isOwner = query.user?._id.toString() === session.user.id;
    const isAssignedMediator = query.mediator?.toString() === session.user.id;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAssignedMediator && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: query });
  } catch (error) {
    console.error('Support Query Fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { status, message, text, senderRole: requestedRole } = await req.json();
    const messageText = message || text; 
    
    await connectToDatabase();
    
    const ticket = await SupportTicket.findById(params.id);
    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Query not found' }, { status: 404 });
    }

    const userRole = (session.user as any).role || 'USER';
    const isOwner = ticket.user.toString() === session.user.id;
    const isMediator = userRole === 'MEDIATOR' && ticket.mediator?.toString() === session.user.id;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isMediator && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const updatePayload: any = {};
    if (status) updatePayload.status = status;
    if (status === 'CLOSED') updatePayload.resolvedAt = new Date();

    // Append message if provided
    if (messageText) {
      const senderRole = userRole === 'ADMIN' ? 'ADMIN' : userRole === 'SUBADMIN' ? 'SUBADMIN' : isMediator ? 'MEDIATOR' : 'USER';
      
      const newMessage = {
        sender: session.user.id,
        senderRole,
        senderName: session.user.name,
        text: messageText,
        createdAt: new Date()
      };
      
      await SupportTicket.findByIdAndUpdate(params.id, {
        $set: updatePayload,
        $push: { messages: newMessage }
      });

      // Signal update in Redis for "real-time" tracking (non-blocking)
      redis.set(`support:update:${params.id}`, Date.now()).catch(e => console.error("Support Redis Signal Error:", e));
    } else if (Object.keys(updatePayload).length > 0) {
      await SupportTicket.findByIdAndUpdate(params.id, { $set: updatePayload });
      redis.set(`support:update:${params.id}`, Date.now()).catch(e => console.error("Support Redis Signal Error:", e));
    }

    const updatedTicket = await SupportTicket.findById(params.id)
      .populate('user', 'name aspireMintId mobile')
      .populate('order', 'aspireOrderId brandName');

    return NextResponse.json({ 
      success: true, 
      message: 'Query updated successfully',
      data: updatedTicket 
    });
  } catch (error) {
    console.error('Support Query Update error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const ticket = await SupportTicket.findById(params.id);
    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Query not found' }, { status: 404 });
    }

    const userRole = (session.user as any).role || 'USER';
    const isOwner = ticket.user.toString() === session.user.id;
    const isMediator = userRole === 'MEDIATOR' && ticket.mediator?.toString() === session.user.id;
    const isAdmin = userRole === 'ADMIN';

    // Mediators can delete their assigned threads if we want, or limit to Owner/Admin
    if (!isOwner && !isMediator && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await SupportTicket.findByIdAndDelete(params.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Query deleted successfully' 
    });
  } catch (error) {
    console.error('Support Query Deletion error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
