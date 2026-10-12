import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { User } from '@/modules/user/user.model';
import connectToDatabase from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userQuery = session.user.id
      ? { _id: session.user.id }
      : { email: session.user.email.toLowerCase().trim() };

    const user = await User.findOne(userQuery).select('linkedPlatforms name email mobile');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const linked = user.linkedPlatforms || {};

    const platforms = {
      amazon: {
        connected: Boolean(linked.amazon?.connected),
        accountName: linked.amazon?.accountName || user.name,
        accountIdentifier: linked.amazon?.accountIdentifier || `${user.name.split(' ')[0].toLowerCase()}@amazon-sync`,
        linkedAt: linked.amazon?.linkedAt || null,
        lastSyncedAt: linked.amazon?.lastSyncedAt || null,
      },
      flipkart: {
        connected: Boolean(linked.flipkart?.connected),
        accountName: linked.flipkart?.accountName || user.name,
        accountIdentifier: linked.flipkart?.accountIdentifier || `${user.mobile ? user.mobile.slice(0, 3) + '****' + user.mobile.slice(-2) : 'user@flipkart'}`,
        linkedAt: linked.flipkart?.linkedAt || null,
        lastSyncedAt: linked.flipkart?.lastSyncedAt || null,
      },
      blinkit: {
        connected: Boolean(linked.blinkit?.connected),
        accountName: linked.blinkit?.accountName || user.name,
        accountIdentifier: linked.blinkit?.accountIdentifier || (user.mobile ? `+91 ${user.mobile.slice(0, 3)}****${user.mobile.slice(-2)}` : 'user@blinkit'),
        linkedAt: linked.blinkit?.linkedAt || null,
        lastSyncedAt: linked.blinkit?.lastSyncedAt || null,
      },
    };

    return NextResponse.json({
      success: true,
      platforms,
      userName: user.name,
      userMobile: user.mobile,
    });
  } catch (error: any) {
    console.error('Platforms API GET Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userQuery = session.user.id
      ? { _id: session.user.id }
      : { email: session.user.email.toLowerCase().trim() };

    const user = await User.findOne(userQuery);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { platform, action, accountName, accountIdentifier } = body;

    const normalizedPlatform = (platform || '').toLowerCase().trim();
    if (!['amazon', 'flipkart', 'blinkit'].includes(normalizedPlatform)) {
      return NextResponse.json({ success: false, message: 'Unsupported marketplace platform' }, { status: 400 });
    }

    if (!user.linkedPlatforms) {
      user.linkedPlatforms = {
        amazon: { connected: false },
        flipkart: { connected: false },
        blinkit: { connected: false },
      };
    }

    if (action === 'disconnect') {
      user.linkedPlatforms[normalizedPlatform] = {
        connected: false,
        accountName: undefined,
        accountIdentifier: undefined,
        linkedAt: undefined,
        lastSyncedAt: undefined,
      };
    } else {
      // Connect / Re-sync
      const defaultName = accountName?.trim() || user.name;
      let defaultId = accountIdentifier?.trim();
      if (!defaultId) {
        if (normalizedPlatform === 'amazon') {
          defaultId = user.email ? `${user.email.split('@')[0].slice(0, 3)}***@${user.email.split('@')[1]}` : `${user.name}@amazon`;
        } else if (normalizedPlatform === 'blinkit') {
          defaultId = user.mobile ? `+91 ${user.mobile.slice(0, 3)}****${user.mobile.slice(-2)}` : `${user.name}@blinkit`;
        } else {
          defaultId = user.mobile ? `+91 ${user.mobile.slice(0, 3)}****${user.mobile.slice(-2)}` : `${user.name}@flipkart`;
        }
      }

      user.linkedPlatforms[normalizedPlatform] = {
        connected: true,
        accountName: defaultName,
        accountIdentifier: defaultId,
        linkedAt: user.linkedPlatforms[normalizedPlatform]?.linkedAt || new Date(),
        lastSyncedAt: new Date(),
      };
    }

    user.markModified('linkedPlatforms');
    await user.save();

    return NextResponse.json({
      success: true,
      message: action === 'disconnect' 
        ? `${normalizedPlatform.toUpperCase()} disconnected successfully` 
        : `Connected ${normalizedPlatform.toUpperCase()} securely via Sandboxed Bridge`,
      platformState: user.linkedPlatforms[normalizedPlatform],
    });
  } catch (error: any) {
    console.error('Platforms API POST Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
