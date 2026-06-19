import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { User, UserRole } from '@/modules/user/user.model';
import connectToDatabase from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Only fetch ID and Name for the dropdown, only for approved specialists
    const mediators = await User.find({ 
      role: UserRole.MEDIATOR, 
      isActive: true,
      isApproved: { $ne: false } // Backward compatibility: undefined or true = approved
    })
      .select("_id name systemDisplayName email")
      .sort({ name: 1 });

    return NextResponse.json({ success: true, data: mediators });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch mediators' }, { status: 500 });
  }
}
