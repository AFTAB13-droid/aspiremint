import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  try {
    // 1. Authenticate with Next-Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = (session.user as any).role;

    // 2. Parse request body (Pusher sends socket_id and channel_name)
    let socketId = '';
    let channelName = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      socketId = formData.get('socket_id') as string;
      channelName = formData.get('channel_name') as string;
    } else {
      const body = await req.json().catch(() => ({}));
      socketId = body.socket_id;
      channelName = body.channel_name;
    }

    if (!socketId || !channelName) {
      return NextResponse.json({ success: false, message: 'Missing socket_id or channel_name' }, { status: 400 });
    }

    // 3. Security Guard Validation
    // A. Private User Channels: private-user-{userId}
    if (channelName.startsWith('private-user-')) {
      const targetUserId = channelName.substring('private-user-'.length);
      if (targetUserId !== userId) {
        console.warn(`[Pusher Auth Refused] User ${userId} tried to subscribe to private channel of user ${targetUserId}`);
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    }
    // B. Private Admin Channel: private-admin
    else if (channelName.startsWith('private-admin')) {
      if (userRole !== 'ADMIN' && userRole !== 'SUBADMIN') {
        console.warn(`[Pusher Auth Refused] Non-admin user ${userId} tried to subscribe to private-admin`);
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    }
    // C. Catch-all for other private channels
    else if (channelName.startsWith('private-')) {
      // General private channel security check
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // 4. Authenticate Channel Subscriptions
    if (!pusherServer) {
      // If Pusher credentials aren't set up yet or free tier runs out, return a mock success
      // to let the frontend connection initialize silently in mock state
      return NextResponse.json({ 
        auth: `mock-auth-token-disabled`, 
        channel_data: JSON.stringify({ user_id: userId }) 
      });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error: any) {
    console.error('Pusher authentication error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
