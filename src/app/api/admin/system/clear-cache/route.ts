import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invalidateDealsCache } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Invalidate main deals cache (Blocking/Awaited)
    await invalidateDealsCache();
    
    // You could also add other cache invalidations here if you have more keys
    // e.g. await redis.del(CACHE_KEYS.ANALYTICS_SUMMARY);

    return NextResponse.json({ 
      success: true, 
      message: 'System cache synchronized successfully. Live data refreshed.' 
    });
  } catch (error: any) {
    console.error('Cache Clear Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to clear cache' }, { status: 500 });
  }
}
