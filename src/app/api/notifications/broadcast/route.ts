import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { User } from '@/modules/user/user.model';
import { NotificationService } from '@/services/notification.service';
import { NotificationType } from '@/modules/notification/notification.model';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { target, specificUserId, title, message } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ success: false, message: 'Title and message are required' }, { status: 400 });
    }

    await connectToDatabase();

    let recipients: string[] = [];

    if (target === 'ALL_USERS') {
      const users = await User.find({ role: 'USER' }, '_id');
      recipients = users.map(u => u._id.toString());
    } else if (target === 'ALL_MEDIATORS') {
      const mediators = await User.find({ role: 'MEDIATOR' }, '_id');
      recipients = mediators.map(m => m._id.toString());
    } else if (target === 'SPECIFIC_USER' && specificUserId) {
      recipients = [specificUserId];
    } else {
      return NextResponse.json({ success: false, message: 'Invalid target configuration' }, { status: 400 });
    }

    if (recipients.length === 0) {
      return NextResponse.json({ success: false, message: 'No recipients found for this target' }, { status: 404 });
    }

    await NotificationService.createBulk({
      recipients,
      type: NotificationType.BROADCAST_MESSAGE,
      title,
      message,
      metadata: { sentBy: session.user.id }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Broadcast sent to ${recipients.length} user(s)` 
    });

  } catch (error) {
    console.error('Broadcast API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
