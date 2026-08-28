import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { User } from '@/modules/user/user.model';
import { Notification, NotificationType } from '@/modules/notification/notification.model';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, rank, month, isTest } = body;

    if (!userId || !rank || !month) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Set user's leaderboardBadge details
    user.leaderboardBadge = {
      rank: Number(rank),
      month: String(month),
      active: true
    };
    await user.save();

    // Create golden animated system notification
    const rankTitle = rank === 1 ? '🥇 Champion (#1)' : rank === 2 ? '🥈 Runner-up (#2)' : '🥉 Bronze Medalist (#3)';
    const textMsg = isTest
      ? `[TEST MODE] Congratulations! You have received a Leaderboard Badge (${rankTitle}) to test the reward feature!`
      : `🏆 Congratulations! You have been officially crowned as the ${rankTitle} Buyer for ${month}. A special reward badge has been unlocked in your profile and dashboard!`;

    await Notification.create({
      recipient: user._id,
      type: NotificationType.SYSTEM,
      title: "🏆 Leaderboard Champion Alert!",
      message: textMsg,
      metadata: {
        isGoldLeaderboardReward: true,
        rank: Number(rank),
        month: String(month),
        isTest: !!isTest
      }
    });

    return NextResponse.json({
      success: true,
      message: isTest ? 'Test reward sent successfully' : 'Leaderboard reward issued successfully',
      data: user.leaderboardBadge
    });

  } catch (error) {
    console.error('Leaderboard Reward API POST Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
