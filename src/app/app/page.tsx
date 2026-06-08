import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Order, OrderStatus } from "@/modules/order/order.model";
import connectToDatabase from "@/lib/db";
import { Brand } from "@/modules/brand/brand.model";
import { User } from "@/modules/user/user.model";
import { SupportTicket, TicketStatus } from "@/modules/support/support.model";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  await connectToDatabase();
  const role = (session.user as any).role || "USER";

  let query: any = {};
  if (role === "USER") query.buyer = session.user.id;
  else if (role === "MEDIATOR") query.mediator = session.user.id;
  else if (role === "ADMIN") query = {};

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [activeCount, inProcessCount, completedCount, totalOrdersCount, recentOrders, dailyActivityRaw, statusDistributionRaw, totalRefundRaw, brands, topBrandRaw, totalUsers, openQueriesCount, refundFormPending, pendingReview, underVerificationCount, approvedOrdersCount, approvedRefundsSum, mediatorStatsRaw, brandOrderStatsRaw] = await Promise.all([
    Order.countDocuments({ ...query, status: OrderStatus.ACTIVE_ESCROW }),
    Order.countDocuments({ ...query, status: { $in: [OrderStatus.PENDING_APPROVAL, OrderStatus.APPROVED, OrderStatus.ESCROW_PAYMENT_PENDING, OrderStatus.ACTIVE_ESCROW] } }),
    Order.countDocuments({ ...query, status: OrderStatus.COMPLETED }),
    Order.countDocuments(query),
    Order.find(query).sort({ updatedAt: -1 }).limit(4).lean(),
    Order.aggregate([
      { $match: { ...query, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate([
      { $match: query },
      {
        $project: {
          category: {
            $switch: {
              branches: [
                { case: { $in: ["$status", [OrderStatus.REFUND_FORM_PENDING]] }, then: "Form Pending" },
                { case: { $in: ["$status", [OrderStatus.UNDER_VERIFICATION, OrderStatus.REFUND_FORM_SUBMITTED, OrderStatus.PENDING_APPROVAL]] }, then: "Under Verification" },
                { case: { $in: ["$status", [OrderStatus.REFUND_APPROVED, OrderStatus.APPROVED, OrderStatus.ACTIVE_ESCROW, OrderStatus.ESCROW_PAYMENT_PENDING]] }, then: "Approved" },
                { case: { $in: ["$status", [OrderStatus.COMPLETED, OrderStatus.REFUNDED]] }, then: "Completed" },
                { case: { $in: ["$status", [OrderStatus.REFUND_REJECTED]] }, then: "Rejected" },
                { case: { $in: ["$status", [OrderStatus.CANCELLED, OrderStatus.INVALIDATED]] }, then: "Cancelled" }
              ],
              default: "Pending"
            }
          }
        }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]),
    Order.aggregate([
      { $match: { ...query, status: OrderStatus.COMPLETED } },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$refundDetails.expectedPayout", { $add: ["$amount", { $ifNull: ["$lessAmount", 0] }] }] } },
          commission: { $sum: "$mediatorCommission" }
        }
      }
    ]),
    Brand.find({ isActive: true }).lean(),
    Order.aggregate([
      { $match: { ...query, status: { $nin: [OrderStatus.CANCELLED, OrderStatus.INVALIDATED] } } },
      { $group: { _id: "$brandName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]),
    User.countDocuments({ role: "USER" }),
    SupportTicket.countDocuments({ ...query, status: TicketStatus.OPEN, user: session.user.id }),
    Order.countDocuments({ status: OrderStatus.REFUND_FORM_PENDING }),
    Order.countDocuments({ status: OrderStatus.PENDING_APPROVAL }),
    Order.countDocuments({ status: { $in: [OrderStatus.UNDER_VERIFICATION, OrderStatus.REFUND_FORM_SUBMITTED] } }),
    Order.countDocuments({ status: { $in: [OrderStatus.APPROVED, OrderStatus.REFUND_APPROVED] } }),
    Order.aggregate([
      { $match: { status: { $in: [OrderStatus.APPROVED, OrderStatus.REFUND_APPROVED] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$refundDetails.expectedPayout", { $add: ["$amount", { $ifNull: ["$lessAmount", 0] }] }] } } } }
    ]),
    Order.aggregate([
      { $group: { _id: "$mediator", count: { $sum: 1 } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { name: "$user.name", count: 1 } },
      { $sort: { count: -1 } }
    ]),
    Order.aggregate([
      { $group: { _id: "$brandName", completed: { $sum: { $cond: [{ $ne: ["$status", OrderStatus.CANCELLED] }, 1, 0] } } } }
    ])
  ]);

  let globalRank = 0;
  let mediatorTotalEarnings = 0;
  if (role === "MEDIATOR") {
    const [allMediators, activeOrders] = await Promise.all([
      Order.aggregate([
        { $match: { status: OrderStatus.COMPLETED } },
        { $group: { _id: "$mediator", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Order.find({ 
        mediator: session.user.id, 
        status: { $nin: [OrderStatus.CANCELLED, OrderStatus.INVALIDATED] } 
      }).lean()
    ]);

    globalRank = allMediators.findIndex(m => m._id?.toString() === session.user.id) + 1;
    if (globalRank === 0) globalRank = allMediators.length + 1; // Not yet in leaderboard
    
    mediatorTotalEarnings = activeOrders.reduce((sum: number, o: any) => sum + (o.mediatorCommission || 0), 0);
  }

  const totalRefundAmount = totalRefundRaw[0]?.total || 0;
  const totalMediatorCommission = role === "MEDIATOR" ? mediatorTotalEarnings : (totalRefundRaw[0]?.commission || 0);
  const refundToBePaid = approvedRefundsSum[0]?.total || 0;

  // Format daily activity
  const dailyActivity = dailyActivityRaw.map(d => ({ name: d._id, value: d.count }));

  // Format status distribution
  const statusDistribution = statusDistributionRaw.map(s => ({ name: s._id, value: s.count }));

  // Calculate brand stats including stock and completed orders
  const brandStats = (brands as any[]).map(brand => {
    const statsForBrand = brandOrderStatsRaw.find((s: any) => s._id === brand.name);
    let stock = 0;
    brand.productCodes?.forEach((pc: any) => {
      stock += (pc.stock || 0);
    });
    return {
      name: brand.name,
      stock,
      completed: statsForBrand?.completed || 0
    };
  });

  // Calculate total available stock
  let totalAvailableStock = 0;
  brandStats.forEach(b => totalAvailableStock += b.stock);

  const topBrand = topBrandRaw[0]?._id || "None";

  // --- ADMIN FINANCIAL ANALYTICS ---
  let todayProfit = 0;
  let todayTotalOrdersCount = 0;
  let todayBrandWiseProfit: any[] = [];
  let historicalBrandProfit: any[] = [];

  if (role === "ADMIN") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayRaw, todayOrdersRaw, todayBrandRaw, historicalRaw] = await Promise.all([
       Order.aggregate([
          { $match: { createdAt: { $gte: today }, status: { $nin: [OrderStatus.CANCELLED, OrderStatus.INVALIDATED] } } },
          { $group: { _id: null, total: { $sum: "$adminProfit" } } }
       ]),
       Order.countDocuments({ createdAt: { $gte: today }, status: { $nin: [OrderStatus.CANCELLED, OrderStatus.INVALIDATED] } }),
       Order.aggregate([
          { $match: { createdAt: { $gte: today }, status: { $nin: [OrderStatus.CANCELLED, OrderStatus.INVALIDATED] } } },
          { $group: { 
             _id: { brand: "$brandName", product: "$productCode" }, 
             profit: { $sum: "$adminProfit" },
             count: { $sum: 1 }
          } },
          { $sort: { profit: -1 } }
       ]),
       Order.aggregate([
          { $match: { status: OrderStatus.COMPLETED } },
          { $group: { _id: "$brandName", totalProfit: { $sum: "$adminProfit" } } },
          { $sort: { totalProfit: -1 } },
          { $limit: 8 }
       ])
    ]);

    todayProfit = todayRaw[0]?.total || 0;
    todayTotalOrdersCount = todayOrdersRaw;
    todayBrandWiseProfit = todayBrandRaw.map(b => ({ 
       name: b._id.brand, 
       product: b._id.product, 
       profit: b.profit,
       count: b.count 
    }));
    historicalBrandProfit = historicalRaw.map(b => ({ name: b._id, profit: b.totalProfit }));
  }

  const stats = { 
    active: activeCount, 
    pending: inProcessCount - activeCount,
    completed: completedCount, 
    totalOrders: totalOrdersCount,
    totalAvailableStock,
    totalRefundAmount,
    totalMediatorCommission,
    dailyActivity,
    statusDistribution,
    totalUsers,
    topBrand,
    openQueries: openQueriesCount,
    refundFormPending,
    pendingReview,
    // New stats for improved dashboard
    underVerificationCount,
    approvedOrdersCount,
    refundToBePaid,
    brandStats,
    mediatorStats: mediatorStatsRaw.map((m: any, idx: number) => ({ ...m, rank: idx + 1 })),
    // Admin specific
    todayProfit,
    todayTotalOrders: todayTotalOrdersCount,
    todayBrandWiseProfit,
    historicalBrandProfit
  };

  return (
    <DashboardClient 
      user={{ name: session.user.name, role, totalCompletedOrders: completedCount, globalRank }} 
      stats={JSON.parse(JSON.stringify(stats))} 
      recentOrders={JSON.parse(JSON.stringify(recentOrders))} 
    />
  );
}
