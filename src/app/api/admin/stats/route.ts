import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Order, OrderStatus } from '@/modules/order/order.model';
import connectToDatabase from '@/lib/db';
import { CACHE_KEYS, getCache, setCache } from '@/lib/redis';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // --- Resilient Cache GET ---
    const cachedStats = await getCache<any>(CACHE_KEYS.ADMIN_STATS);
    if (cachedStats) {
      console.log("Redis Cache Hit - Admin Stats loaded successfully");
      return NextResponse.json({ success: true, data: cachedStats });
    }

    await connectToDatabase();

    // 1. Total in Escrow (Active Escrow status) using Database Aggregate
    const escrowAgg = await Order.aggregate([
      { $match: { status: OrderStatus.ACTIVE_ESCROW } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalEscrow = escrowAgg[0]?.total || 0;

    // 2. Active Managed Deals count
    const activeDeals = await Order.countDocuments({ 
      status: { $in: [OrderStatus.ACTIVE_ESCROW, OrderStatus.ESCROW_PAYMENT_PENDING] } 
    });

    // 3. Pending Verifications count
    const pendingVerifications = await Order.countDocuments({ 
      status: OrderStatus.ESCROW_PAYMENT_PENDING 
    });

    // 4. Completed Value (Total successfully released) using Database Aggregate
    const completedAgg = await Order.aggregate([
      { $match: { status: OrderStatus.COMPLETED } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const completedValue = completedAgg[0]?.total || 0;

    const statsData = {
      totalEscrow,
      activeDeals,
      pendingVerifications,
      completedValue
    };

    // Populate Redis Cache asynchronously (TTL 5 minutes)
    setCache(CACHE_KEYS.ADMIN_STATS, statsData, 300);

    return NextResponse.json({ 
      success: true, 
      data: statsData
    });
  } catch (error) {
    console.error('Admin Stats fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
