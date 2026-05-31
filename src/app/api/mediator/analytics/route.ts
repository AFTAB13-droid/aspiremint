import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Order, OrderStatus } from "@/modules/order/order.model";
import { SupportTicket, TicketStatus } from "@/modules/support/support.model";
import { ActiveDeal } from "@/modules/brand/deal.model";
import dbConnect from "@/lib/db";
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'MEDIATOR') {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const selectedMonth = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth();
    const selectedYear = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    const mediatorId = (session.user as any).id;
    await dbConnect();

    // 1. Fetch All Relevant Data
    const [orders, tickets, assignedDeals, allOrders, allTickets] = await Promise.all([
      Order.find({ mediator: mediatorId }),
      SupportTicket.find({ mediator: mediatorId, status: TicketStatus.CLOSED }),
      ActiveDeal.find({ isActive: true, "assignedMediators.mediatorId": mediatorId }),
      Order.find().select('mediator status amount'), 
      SupportTicket.find({ status: TicketStatus.CLOSED }).select('mediator')
    ]);
    
    // 2. Personal Overview Stats & Earnings
    const todayStart = startOfDay(new Date());
    const weekStart = subDays(todayStart, 7);

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED).length;
    
    // Profit Calculation Logic: Sum commission for all orders that have it calculated (filled forms)
    // Filter out CANCELLED/INVALIDATED orders for accurate earnings reporting
    const activeOrders = orders.filter(o => ![OrderStatus.CANCELLED, OrderStatus.INVALIDATED].includes(o.status));

    const dailyEarnings = activeOrders
      .filter(o => (o.updatedAt || o.createdAt) >= todayStart)
      .reduce((sum, o) => sum + (o.mediatorCommission || 0), 0);

    const weeklyEarnings = activeOrders
      .filter(o => (o.updatedAt || o.createdAt) >= weekStart)
      .reduce((sum, o) => sum + (o.mediatorCommission || 0), 0);

    const totalCommissions = activeOrders
      .reduce((sum, o) => sum + (o.mediatorCommission || 0), 0);

    // 3. Order Status Breakdown
    const orderStats = {
      verification: orders.filter(o => o.status === OrderStatus.UNDER_VERIFICATION).length,
      refundApproved: orders.filter(o => o.status === OrderStatus.REFUND_APPROVED).length,
      rejected: orders.filter(o => o.status === OrderStatus.REFUND_REJECTED || o.status === OrderStatus.CANCELLED).length,
      completed: orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.REFUNDED).length,
      pending: orders.filter(o => o.status === OrderStatus.REFUND_FORM_PENDING || o.status === OrderStatus.PENDING_APPROVAL).length
    };

    // 4. Performance Chart Data (Per Month)
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth));
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const monthlyPerformanceData = daysInMonth.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayOrders = orders.filter(o => o.createdAt >= dayStart && o.createdAt <= dayEnd);
      const dayCompleted = dayOrders.filter(o => o.status === OrderStatus.COMPLETED);

      return { 
        date: format(day, 'MMM dd'),
        day: format(day, 'd'),
        total: dayOrders.length,
        completed: dayCompleted.length,
        earnings: dayCompleted.reduce((sum, o) => sum + (o.mediatorCommission || 0), 0)
      };
    });

    // 5. Brand Distribution
    const brandMap: Record<string, number> = {};
    orders.forEach(o => {
      const brand = o.brandName || 'Unknown';
      brandMap[brand] = (brandMap[brand] || 0) + 1;
    });
    const brandDistribution = Object.entries(brandMap).map(([name, value]) => ({ name, value }));

    // 6. Inventory Data
    const inventoryData = assignedDeals.map(d => ({
      brand: d.brandName,
      productCode: d.productCode,
      productName: d.productDetails,
      total: d.totalSlots,
      remaining: d.remainingSlots,
      completed: d.totalSlots - d.remainingSlots,
      fillRate: ((d.totalSlots - d.remainingSlots) / d.totalSlots) * 100
    }));

    // 7. Global Leaderboard Calculation
    const mediatorStatsMap: Record<string, any> = {};
    allOrders.forEach(o => {
      const medId = o.mediator?.toString();
      if (!medId) return;
      if (!mediatorStatsMap[medId]) {
        mediatorStatsMap[medId] = { successfulTransactions: 0, queriesResolved: 0, score: 0 };
      }
      if (o.status === OrderStatus.COMPLETED) mediatorStatsMap[medId].successfulTransactions++;
    });

    allTickets.forEach(t => {
      const medId = t.mediator?.toString();
      if (medId && mediatorStatsMap[medId]) mediatorStatsMap[medId].queriesResolved++;
    });

    const leaderboard = Object.entries(mediatorStatsMap).map(([id, stats]: [string, any]) => ({
      _id: id,
      score: (stats.successfulTransactions * 10) + (stats.queriesResolved * 5),
      ...stats
    })).sort((a, b) => b.score - a.score);

    const myIndex = leaderboard.findIndex(m => m._id === mediatorId);
    const myStats = myIndex !== -1 ? leaderboard[myIndex] : { score: 0, successfulTransactions: 0, queriesResolved: 0 };
    const myRank = myIndex !== -1 ? myIndex + 1 : leaderboard.length + 1;

    // 8. Brand Earnings Breakdown (New)
    const brandData: Record<string, { earnings: number, count: number, orders: any[] }> = {};
    activeOrders.forEach(order => {
      const profit = order.mediatorCommission || 0;
      if (!brandData[order.brandName]) {
        brandData[order.brandName] = { earnings: 0, count: 0, orders: [] };
      }
      brandData[order.brandName].earnings += profit;
      brandData[order.brandName].count += 1;
      brandData[order.brandName].orders.push({
        id: order.aspireOrderId || order._id,
        productCode: order.productCode,
        profit,
        date: order.createdAt
      });
    });

    const brandEarnings = Object.entries(brandData).map(([name, data]) => ({
      name,
      earnings: data.earnings,
      count: data.count,
      orders: data.orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })).sort((a, b) => b.earnings - a.earnings);

    return NextResponse.json({
      success: true,
      data: {
        personal: {
          totalOrders,
          completedOrders,
          totalCommissions,
          dailyEarnings,
          weeklyEarnings,
          queriesResolved: tickets.length,
          _id: mediatorId
        },
        orderStats,
        ranking: {
          rank: myRank,
          score: myStats.score,
          totalMediators: leaderboard.length,
          percentile: leaderboard.length > 0 ? ((leaderboard.length - myIndex) / leaderboard.length) * 100 : 0
        },
        performanceChartData: monthlyPerformanceData,
        brandDistribution,
        inventoryData,
        brandEarnings
      }
    });

  } catch (error: any) {
    console.error("Mediator Analytics Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
