import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Order, OrderStatus } from "@/modules/order/order.model";
import { User, UserRole } from "@/modules/user/user.model";
import { SupportTicket, TicketStatus } from "@/modules/support/support.model";
import { ActiveDeal } from "@/modules/brand/deal.model";
import dbConnect from "@/lib/db";
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format, startOfMonth, subMonths, endOfMonth, getDay, getHours } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const selectedMonth = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth();
    const selectedYear = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    await dbConnect();

    // Calculate Date Range
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth));

    // 1. Fetch Relevant Data (Filtered by Month/Year)
    const [orders, tickets, deals] = await Promise.all([
      Order.find({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      })
        .populate('buyer', 'name email mobile isActive isTerminated')
        .populate('mediator', 'name profileImage')
        .sort({ createdAt: -1 }),
      SupportTicket.find({ status: TicketStatus.CLOSED }).select('mediator'),
      ActiveDeal.find({ isActive: true }).select('brandName totalSlots remainingSlots productCode productDetails')
    ]);
    
    // 2. High Level Stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => (o.status === OrderStatus.COMPLETED || o.status === OrderStatus.APPROVED || o.status === OrderStatus.ACTIVE_ESCROW) ? sum + o.amount : sum, 0);
    const totalRefunds = orders.filter(o => o.status === OrderStatus.REFUNDED).reduce((sum, o) => sum + (o.refundDetails?.expectedPayout || o.amount), 0);
    const totalCancellations = orders.filter(o => o.status === OrderStatus.CANCELLED).length;

    // 3. Time Series Data (Selected Month)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const chartData = daysInMonth.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayOrders = orders.filter(o => o.createdAt >= dayStart && o.createdAt <= dayEnd);
      
      const newOrders = dayOrders.length;
      const completedOrders = dayOrders.filter(o => o.status === OrderStatus.COMPLETED).length;
      const revenue = dayOrders.reduce((sum, o) => (o.status === OrderStatus.COMPLETED || o.status === OrderStatus.APPROVED) ? sum + o.amount : sum, 0);
      
      return {
        date: format(day, 'MMM dd'),
        day: format(day, 'd'),
        newOrders,
        completedOrders,
        revenue,
        refunds: dayOrders.filter(o => o.status === OrderStatus.REFUNDED).reduce((sum, o) => sum + (o.refundDetails?.expectedPayout || o.amount), 0),
      };
    });

    // 4. Financial Flow Split (Payout vs Net)
    const totalPayouts = orders.reduce((sum, o) => (o.status === OrderStatus.COMPLETED) ? sum + (o.mediatorCommission || 0) : sum, 0);
    const financialFlow = [
      { name: 'Mediator Payouts', value: totalPayouts, color: '#6366f1' },
      { name: 'Platform Net', value: totalRevenue - totalPayouts, color: '#10b981' }
    ];

    // 5. Activity Heatmap (Monthly View - Grid of days)
    const heatmap = chartData.map(d => ({
      day: d.day,
      intensity: d.newOrders,
      revenue: d.revenue,
      date: d.date
    }));

    // 6. Brand Profitability Matrix
    const brandProfitMap: Record<string, any> = {};
    orders.forEach((o: any) => {
      if (!o.brandName) return;
      const brand = o.brandName.toLowerCase();
      if (!brandProfitMap[brand]) {
        brandProfitMap[brand] = { name: o.brandName, revenue: 0, payouts: 0, refunds: 0, orders: 0 };
      }
      brandProfitMap[brand].orders++;
      if (o.status === OrderStatus.COMPLETED || o.status === OrderStatus.APPROVED) {
        brandProfitMap[brand].revenue += o.amount;
        brandProfitMap[brand].payouts += (o.mediatorCommission || 0);
      }
      if (o.status === OrderStatus.REFUNDED) {
        brandProfitMap[brand].refunds += o.amount;
      }
    });

    const brandMatrix = Object.values(brandProfitMap).map((b: any) => ({
      ...b,
      netProfit: b.revenue - b.payouts,
      profitMargin: b.revenue > 0 ? ((b.revenue - b.payouts) / b.revenue) * 100 : 0
    })).sort((a, b) => b.netProfit - a.netProfit);

    // 7. Recent Transactions (Stream)
    const recentTransactions = orders.slice(0, 10).map((o: any) => ({
      _id: o._id,
      type: o.status === OrderStatus.REFUNDED ? 'REFUND' : o.status === OrderStatus.COMPLETED ? 'COMPLETED' : 'ORDER',
      amount: o.amount,
      user: (o.buyer as any)?.name || 'Guest',
      brand: o.brandName,
      createdAt: o.createdAt,
      status: o.status
    }));

    // 8. Stock & Inventory Insights
    const stockStatsMap: Record<string, any> = {};
    deals.forEach(d => {
      const brand = d.brandName.toLowerCase();
      if (!stockStatsMap[brand]) {
        stockStatsMap[brand] = {
          brand: d.brandName,
          totalInventory: 0,
          remainingInventory: 0,
          completedInventory: 0,
          products: []
        };
      }
      stockStatsMap[brand].totalInventory += d.totalSlots;
      stockStatsMap[brand].remainingInventory += d.remainingSlots;
      stockStatsMap[brand].completedInventory += (d.totalSlots - d.remainingSlots);
      stockStatsMap[brand].products.push({
        code: d.productCode,
        name: d.productDetails,
        total: d.totalSlots,
        remaining: d.remainingSlots,
        completed: d.totalSlots - d.remainingSlots
      });
    });

    // 9. User Risk Indicator
    const userStatsMap: Record<string, any> = {};
    orders.forEach(o => {
      const userId = o.buyer?._id?.toString();
      if (!userId) return;
      if (!userStatsMap[userId]) {
        userStatsMap[userId] = {
          _id: userId,
          name: (o.buyer as any).name,
          email: (o.buyer as any).email,
          mobile: (o.buyer as any).mobile,
          totalOrders: 0,
          cancelledOrders: 0,
          isTerminated: (o.buyer as any).isTerminated
        };
      }
      userStatsMap[userId].totalOrders++;
      if (o.status === OrderStatus.CANCELLED) userStatsMap[userId].cancelledOrders++;
    });

    const userRiskData = Object.values(userStatsMap).map(u => {
      const cancelRate = u.totalOrders > 0 ? (u.cancelledOrders / u.totalOrders) * 100 : 0;
      let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (cancelRate > 50) risk = 'HIGH';
      else if (cancelRate > 20) risk = 'MEDIUM';
      return { ...u, cancelRate, risk };
    }).sort((a, b) => b.cancelRate - a.cancelRate);

    // 10. Mediator Leaderboard
    const mediatorStatsMap: Record<string, any> = {};
    orders.forEach(o => {
      const medId = o.mediator?._id?.toString();
      if (!medId) return;
      if (!mediatorStatsMap[medId]) {
        mediatorStatsMap[medId] = {
          _id: medId,
          name: (o.mediator as any).name,
          profileImage: (o.mediator as any).profileImage,
          ordersHandled: 0,
          successfulTransactions: 0,
          queriesResolved: 0,
          revenueContribution: 0,
          score: 0
        };
      }
      mediatorStatsMap[medId].ordersHandled++;
      if (o.status === OrderStatus.COMPLETED) {
        mediatorStatsMap[medId].successfulTransactions++;
        mediatorStatsMap[medId].revenueContribution += o.amount;
      }
    });

    tickets.forEach(t => {
      const medId = t.mediator?.toString();
      if (medId && mediatorStatsMap[medId]) mediatorStatsMap[medId].queriesResolved++;
    });

    const leaderboard = Object.values(mediatorStatsMap).map(med => {
      med.score = (med.successfulTransactions * 10) + (med.queriesResolved * 5);
      return med;
    }).sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      data: {
        summary: { totalOrders, totalRevenue, totalRefunds, totalCancellations, netRevenue: totalRevenue - totalRefunds, totalPayouts },
        chartData,
        financialFlow,
        heatmap,
        brandMatrix,
        recentTransactions,
        stockData: Object.values(stockStatsMap),
        userRiskData,
        mediatorLeaderboard: leaderboard,
        revenueBreakdown: [
          { name: 'Completed', value: orders.filter(o => o.status === OrderStatus.COMPLETED).reduce((sum, o) => sum + o.amount, 0), color: '#10b981' },
          { name: 'Approved', value: orders.filter(o => o.status === OrderStatus.APPROVED).reduce((sum, o) => sum + o.amount, 0), color: '#3b82f6' },
          { name: 'Active Escrow', value: orders.filter(o => o.status === OrderStatus.ACTIVE_ESCROW).reduce((sum, o) => sum + o.amount, 0), color: '#6366f1' },
          { name: 'Pending', value: orders.filter((o: any) => o.status === OrderStatus.PENDING_APPROVAL).reduce((sum: number, o: any) => sum + o.amount, 0), color: '#f59e0b' },
        ]
      }
    });

  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
