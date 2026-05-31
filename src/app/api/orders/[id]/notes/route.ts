import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Order } from '@/modules/order/order.model';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'SUBADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { content } = await req.json();
    if (!content) {
      return NextResponse.json({ success: false, message: 'Note content is required' }, { status: 400 });
    }

    await connectToDatabase();

    const note = {
      content,
      authorName: session.user.name,
      authorRole: userRole,
      createdAt: new Date()
    };

    const order = await Order.findByIdAndUpdate(
      params.id,
      { 
        $push: { internalNotes: note },
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Update the viewer's timestamp for the author only
    await Order.updateOne(
      { _id: params.id },
      {
        $set: {
          "lastViewedNotes": [
            ...(order.lastViewedNotes?.filter(v => v.userId.toString() !== session.user.id) || []),
            { userId: session.user.id, viewedAt: new Date() }
          ]
        }
      }
    );

    return NextResponse.json({ success: true, data: order.internalNotes });
  } catch (error) {
    console.error('Add Note Error:', error);
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

    await connectToDatabase();

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Update or add the viewed entry for this user
    const viewerIndex = (order.lastViewedNotes || []).findIndex(v => v.userId.toString() === session.user.id);
    
    if (viewerIndex > -1) {
      order.lastViewedNotes![viewerIndex].viewedAt = new Date();
    } else {
      if (!order.lastViewedNotes) order.lastViewedNotes = [];
      order.lastViewedNotes.push({
        userId: session.user.id,
        viewedAt: new Date()
      });
    }

    await order.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update Note View Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
