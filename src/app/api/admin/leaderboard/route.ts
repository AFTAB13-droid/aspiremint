import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Order, OrderStatus } from '@/modules/order/order.model';
import { User } from '@/modules/user/user.model';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month'); // e.g. "2026-08"
    
    let startDate: Date;
    let endDate: Date;

    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    await connectToDatabase();

    // Aggregation pipeline to rank buyers by total orders in month
    const leaderboardRaw = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$buyer",
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: {
              $cond: [{ $in: ["$status", [OrderStatus.COMPLETED, OrderStatus.REFUNDED]] }, 1, 0]
            }
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $in: ["$status", [OrderStatus.CANCELLED, OrderStatus.INVALIDATED]] }, 1, 0]
            }
          },
          totalSpend: { $sum: "$amount" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "buyerInfo"
        }
      },
      { $unwind: "$buyerInfo" },
      {
        $project: {
          _id: 1,
          totalOrders: 1,
          completedOrders: 1,
          cancelledOrders: 1,
          totalSpend: 1,
          name: "$buyerInfo.name",
          email: "$buyerInfo.email",
          aspireMintId: "$buyerInfo.aspireMintId",
          leaderboardBadge: "$buyerInfo.leaderboardBadge",
          isActive: "$buyerInfo.isActive"
        }
      },
      { $sort: { totalOrders: -1 } }
    ]);

    // Gather overall analysis parameters
    const totalOrdersCount = await Order.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
    const totalCancelledCount = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: [OrderStatus.CANCELLED, OrderStatus.INVALIDATED] }
    });
    const totalCompletedCount = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: [OrderStatus.COMPLETED, OrderStatus.REFUNDED] }
    });

    // Brand share analysis
    const brandShare = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$brandName", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: leaderboardRaw,
        stats: {
          totalOrders: totalOrdersCount,
          totalCancelled: totalCancelledCount,
          totalCompleted: totalCompletedCount,
          brandShare: brandShare.map(b => ({ brand: b._id || 'Unknown', count: b.count }))
        }
      }
    });

  } catch (error) {
    console.error('Leaderboard API GET Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
