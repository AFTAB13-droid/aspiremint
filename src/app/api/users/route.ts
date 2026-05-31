import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { User } from '@/modules/user/user.model';
import { Order, OrderStatus } from '@/modules/order/order.model';
import connectToDatabase from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUBADMIN") {
      return NextResponse.json({ success: false, message: 'Forbidden. Admin or SubAdmin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "8");
    const skip = (page - 1) * limit;
    const roleFilter = searchParams.get("role");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "newest";
    const isApproved = searchParams.get("isApproved");

    await connectToDatabase();

    let query: any = { role: { $ne: "ADMIN" } };
    if (roleFilter && roleFilter !== "ALL") {
      query.role = roleFilter.toUpperCase();
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { aspireMintId: { $regex: search, $options: "i" } }
      ];
    }
    if (isApproved !== null) {
      if (isApproved === "true") {
        query.isApproved = { $ne: false };
      } else {
        query.isApproved = false;
      }
    }

    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const users = await User.find(query)
      .select("-password")
      .sort(sortBy === "oldest" ? { createdAt: 1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Enhance Mediator data with real-time metrics
    const enhancedUsers = await Promise.all(users.map(async (u) => {
      const userObj = u.toObject() as any;
      if (userObj.role === 'MEDIATOR') {
        const totalDeals = await Order.countDocuments({ mediator: u._id });
        const activeDeals = await Order.countDocuments({ 
          mediator: u._id, 
          status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUND_REJECTED, OrderStatus.REFUNDED] } 
        });
        const completedDeals = await Order.countDocuments({ 
          mediator: u._id, 
          status: OrderStatus.COMPLETED 
        });
        
        userObj.activeDealsCount = activeDeals;
        userObj.totalDealsCount = totalDeals;
        userObj.successRate = totalDeals > 0 ? ((completedDeals / totalDeals) * 100).toFixed(1) : "0.0";
      }
      return userObj;
    }));

    // Get separate counts for analytic cards
    const totalUsersCount = await User.countDocuments({ role: { $ne: 'ADMIN' } });
    const totalMediatorsCount = await User.countDocuments({ role: 'MEDIATOR' });
    const newThisMonth = await User.countDocuments({
       role: { $ne: 'ADMIN' },
       createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    return NextResponse.json({ 
      success: true, 
      data: enhancedUsers,
      pagination: {
         totalCount,
         totalPages,
         currentPage: page,
         limit
      },
      stats: {
         totalUsers: totalUsersCount,
         totalMediators: totalMediatorsCount,
         newThisMonth
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
