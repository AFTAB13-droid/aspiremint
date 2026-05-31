import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { User } from '@/modules/user/user.model';
import connectToDatabase from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const count = parseInt(searchParams.get('count') || '0');

    await connectToDatabase();
    
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { totalCompletedOrders: count },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Order count updated to ${count}. Please refresh your page or re-login to see the new badge.`,
      currentCount: user.totalCompletedOrders 
    });
  } catch (error) {
    console.error('Test API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
