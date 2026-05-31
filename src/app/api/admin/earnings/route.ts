import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Order, OrderStatus } from '@/modules/order/order.model';
import connectToDatabase from '@/lib/db';
import { CACHE_KEYS, getCache, setCache } from '@/lib/redis';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month'; 
    const selectedMonth = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth();
    const selectedYear = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    // --- Dynamic Cache-Aside Pattern ---
    const cacheKey = `${CACHE_KEYS.ADMIN_EARNINGS_PREFIX}${period}_${selectedMonth}_${selectedYear}`;
    const cachedEarnings = await getCache<any>(cacheKey);
    if (cachedEarnings) {
      console.log(`Redis Cache Hit - Admin Earnings loaded for ${cacheKey}`);
      return NextResponse.json({ success: true, data: cachedEarnings });
    }

    await connectToDatabase();

    // 1. Calculate Time Ranges
    const now = new Date();
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const startOfWeek = new Date(new Date().setDate(now.getDate() - now.getDay()));
    
    // Explicit month range for specific selection
    const explicitStart = new Date(selectedYear, selectedMonth, 1);
    const explicitEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

    let filterDateStart = explicitStart;
    let filterDateEnd = explicitEnd;

    if (period === 'day') {
      filterDateStart = today;
      filterDateEnd = new Date(new Date().setHours(23, 59, 59, 999));
    } else if (period === 'week') {
      filterDateStart = startOfWeek;
      filterDateEnd = new Date(now.setHours(23, 59, 59, 999));
    } else if (period === 'all') {
      filterDateStart = new Date(0);
      filterDateEnd = new Date();
    }

    // 2. Fetch Orders with Profit (Lean for high-speed lazy-loading)
    const orders = await Order.find({ 
      status: { $nin: [OrderStatus.CANCELLED, OrderStatus.INVALIDATED] },
      adminProfit: { $exists: true }
    }).select('adminProfit brandName updatedAt createdAt aspireOrderId productCode').lean();

    // 3. Aggregate Stats
    let dailyEarnings = 0;
    let weeklyEarnings = 0;
    let monthlyEarnings = 0;
    let totalEarnings = 0;
    let periodTotal = 0;

    const brandData: Record<string, { profit: number, count: number, orders: any[] }> = {};
    const dailyChart: Record<string, number> = {};

    orders.forEach(order => {
      const profit = order.adminProfit || 0;
      const date = new Date(order.updatedAt || order.createdAt);
      const dateKey = date.toISOString().split('T')[0];

      totalEarnings += profit;
      
      if (date >= today) dailyEarnings += profit;
      if (date >= startOfWeek) weeklyEarnings += profit;
      if (date >= explicitStart && date <= explicitEnd) monthlyEarnings += profit;

      // Filtered stats for the requested period
      if (date >= filterDateStart && date <= filterDateEnd) {
        periodTotal += profit;
        
        if (!brandData[order.brandName]) {
          brandData[order.brandName] = { profit: 0, count: 0, orders: [] };
        }
        brandData[order.brandName].profit += profit;
        brandData[order.brandName].count += 1;
        brandData[order.brandName].orders.push({
          id: order.aspireOrderId || order._id,
          productCode: order.productCode,
          profit,
          date: order.createdAt
        });
      }

      // Daily Chart
      if (period === 'month') {
        if (date >= explicitStart && date <= explicitEnd) {
          dailyChart[dateKey] = (dailyChart[dateKey] || 0) + profit;
        }
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (date >= thirtyDaysAgo) {
          dailyChart[dateKey] = (dailyChart[dateKey] || 0) + profit;
        }
      }
    });

    // Ensure all days of the month are in the chart if period is 'month'
    if (period === 'month') {
      const days = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      for (let i = 1; i <= days; i++) {
        const d = new Date(selectedYear, selectedMonth, i);
        const dk = d.toISOString().split('T')[0];
        if (!dailyChart[dk]) dailyChart[dk] = 0;
      }
    }

    // Format brand-wise for table
    const brandTable = Object.entries(brandData).map(([name, data]) => ({
      name,
      profit: data.profit,
      count: data.count,
      orders: data.orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })).sort((a, b) => b.profit - a.profit);

    // Format chart data
    const chartData = Object.entries(dailyChart).map(([date, value]) => ({
      date,
      value
    })).sort((a, b) => a.date.localeCompare(b.date));

    const earningsData = {
      summary: {
        daily: dailyEarnings,
        weekly: weeklyEarnings,
        monthly: monthlyEarnings,
        total: totalEarnings,
        periodTotal // New field for the UI
      },
      brandEarnings: brandTable,
      chartData,
      activePeriod: period
    };

    // Cache the calculated earnings payload in Upstash Redis (TTL 5 minutes)
    setCache(cacheKey, earningsData, 300);

    return NextResponse.json({
      success: true,
      data: earningsData
    });
  } catch (error) {
    console.error('Earnings API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
