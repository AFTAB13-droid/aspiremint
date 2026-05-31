import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { NotificationService } from '@/services/notification.service';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const url = new URL(req.url);
    const sinceParam = url.searchParams.get('since');
    const sinceDate = sinceParam ? new Date(sinceParam) : undefined;

    const notifications = await NotificationService.getUserNotifications(session.user.id, 50, 0, sinceDate);

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id, all } = await req.json();

    await connectToDatabase();

    if (all) {
      await NotificationService.markAllAsRead(session.user.id);
    } else if (id) {
      await NotificationService.markAsRead(id, session.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    await connectToDatabase();

    if (all === "true") {
      await NotificationService.deleteAll(session.user.id);
    } else {
      if (!id) return NextResponse.json({ success: false, message: 'ID or all flag required' }, { status: 400 });
      await NotificationService.deleteNotification(id, session.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
