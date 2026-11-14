import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Order, OrderStatus } from "@/modules/order/order.model";
import { User } from "@/modules/user/user.model";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session?.user?.id || (role !== "ADMIN" && role !== "SUBADMIN")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin role required." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const mediatorId = searchParams.get("mediatorId") || "ALL";
    const marketplace = searchParams.get("marketplace") || "ALL";
    const daysRange = searchParams.get("daysRange") || "ALL"; // ALL, 30_45, 45_60, 60_PLUS
    const sortBy = searchParams.get("sortBy") || "oldest_stuck";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "15"));
    const skip = (page - 1) * limit;

    const now = new Date();
    // 30 days threshold strictly from REFUND FORM SUBMISSION
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. Base Query: Only UNDER_VERIFICATION and REFUND_FORM_SUBMITTED orders
    const baseQuery: any = {
      status: { $in: [OrderStatus.UNDER_VERIFICATION, OrderStatus.REFUND_FORM_SUBMITTED] },
    };

    // Strict 30-Day Logic: Form submitted date (refundDetails.submittedAt)
    // Fallback only to updatedAt (when status switched to UNDER_VERIFICATION) if submittedAt is missing, NEVER createdAt
    if (daysRange === "30_45") {
      baseQuery.$or = [
        { "refundDetails.submittedAt": { $lte: thirtyDaysAgo, $gt: fortyFiveDaysAgo } },
        {
          $and: [
            { "refundDetails.submittedAt": { $exists: false } },
            { updatedAt: { $lte: thirtyDaysAgo, $gt: fortyFiveDaysAgo } },
          ],
        },
      ];
    } else if (daysRange === "45_60") {
      baseQuery.$or = [
        { "refundDetails.submittedAt": { $lte: fortyFiveDaysAgo, $gt: sixtyDaysAgo } },
        {
          $and: [
            { "refundDetails.submittedAt": { $exists: false } },
            { updatedAt: { $lte: fortyFiveDaysAgo, $gt: sixtyDaysAgo } },
          ],
        },
      ];
    } else if (daysRange === "60_PLUS") {
      baseQuery.$or = [
        { "refundDetails.submittedAt": { $lte: sixtyDaysAgo } },
        {
          $and: [
            { "refundDetails.submittedAt": { $exists: false } },
            { updatedAt: { $lte: sixtyDaysAgo } },
          ],
        },
      ];
    } else {
      // Default: ALL that have passed 30 days after refund form submitted
      baseQuery.$or = [
        { "refundDetails.submittedAt": { $lte: thirtyDaysAgo } },
        {
          $and: [
            { "refundDetails.submittedAt": { $exists: false } },
            { updatedAt: { $lte: thirtyDaysAgo } },
          ],
        },
      ];
    }

    // Mediator Filter
    if (mediatorId !== "ALL") {
      baseQuery.mediator = mediatorId;
    }

    // Marketplace Filter
    if (marketplace !== "ALL") {
      baseQuery.marketplace = { $regex: new RegExp(`^${marketplace}$`, "i") };
    }

    // Search Filter (Order IDs, Product Code, or Brand)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      const userMatches = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { mobile: searchRegex },
          { aspireMintId: searchRegex },
        ],
      }).select("_id");

      const userIds = userMatches.map((u) => u._id);

      baseQuery.$and = [
        {
          $or: [
            { aspireOrderId: searchRegex },
            { userOrderId: searchRegex },
            { productCode: searchRegex },
            { brandName: searchRegex },
            { buyer: { $in: userIds } },
            { mediator: { $in: userIds } },
          ],
        },
      ];
    }

    // Sorting
    let sortObj: any = { "refundDetails.submittedAt": 1 }; // Default: oldest stuck first
    if (sortBy === "newest_stuck") {
      sortObj = { "refundDetails.submittedAt": -1 };
    } else if (sortBy === "amount_high") {
      sortObj = { amount: -1 };
    } else if (sortBy === "amount_low") {
      sortObj = { amount: 1 };
    }

    // Fetch Paginated Orders with population
    const [orders, totalCount] = await Promise.all([
      Order.find(baseQuery)
        .populate("buyer", "name email mobile aspireMintId avatar profileImage")
        .populate("mediator", "name systemDisplayName email mobile aspireMintId")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(baseQuery),
    ]);

    // Format orders with computed Days Stuck and Severity Tier
    const enrichedOrders = orders.map((ord: any) => {
      const submittedDate = ord.refundDetails?.submittedAt || ord.updatedAt || ord.createdAt;
      const diffMs = now.getTime() - new Date(submittedDate).getTime();
      const daysStuck = Math.max(30, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      let severity: "WARNING" | "HIGH" | "CRITICAL" = "WARNING";
      if (daysStuck >= 60) severity = "CRITICAL";
      else if (daysStuck >= 45) severity = "HIGH";

      const payout =
        ord.refundDetails?.expectedPayout ??
        (ord.dealType === "Empty Box"
          ? (Number(ord.amount) || 0) + (Number(ord.lessAmount) || 0)
          : (Number(ord.amount) || 0) - (Number(ord.lessAmount) || 0));

      return {
        ...ord,
        refundFormSubmittedAt: ord.refundDetails?.submittedAt || ord.updatedAt,
        daysStuck,
        severity,
        calculatedPayout: payout,
      };
    });

    // 2. Aggregate Overall High-Level Stats for the Header Cards
    const statsQuery = {
      status: { $in: [OrderStatus.UNDER_VERIFICATION, OrderStatus.REFUND_FORM_SUBMITTED] },
      $or: [
        { "refundDetails.submittedAt": { $lte: thirtyDaysAgo } },
        {
          $and: [
            { "refundDetails.submittedAt": { $exists: false } },
            { updatedAt: { $lte: thirtyDaysAgo } },
          ],
        },
      ],
    };

    const allStuckOrders = await Order.find(statsQuery)
      .populate("mediator", "name systemDisplayName email mobile")
      .select("refundDetails.submittedAt refundDetails.expectedPayout amount lessAmount dealType mediator updatedAt")
      .lean();

    let totalStuckOrdersCount = allStuckOrders.length;
    let totalPayoutLiability = 0;
    let maxDaysStuck = 0;
    const mediatorMap = new Map<string, { id: string; name: string; mobile?: string; email?: string; count: number; liability: number }>();
    let tierWarningCount = 0; // 30-44
    let tierHighCount = 0;    // 45-59
    let tierCriticalCount = 0;// 60+

    allStuckOrders.forEach((o: any) => {
      const subDate = o.refundDetails?.submittedAt || o.updatedAt;
      const days = Math.max(30, Math.floor((now.getTime() - new Date(subDate).getTime()) / (1000 * 60 * 60 * 24)));
      if (days > maxDaysStuck) maxDaysStuck = days;

      if (days >= 60) tierCriticalCount++;
      else if (days >= 45) tierHighCount++;
      else tierWarningCount++;

      const payout =
        o.refundDetails?.expectedPayout ??
        (o.dealType === "Empty Box"
          ? (Number(o.amount) || 0) + (Number(o.lessAmount) || 0)
          : (Number(o.amount) || 0) - (Number(o.lessAmount) || 0));

      totalPayoutLiability += payout;

      // Group by mediator
      const medId = o.mediator?._id?.toString() || "UNASSIGNED";
      const medName = o.mediator?.systemDisplayName || o.mediator?.name || "Unassigned";
      const medMobile = o.mediator?.mobile || "";
      const medEmail = o.mediator?.email || "";

      if (!mediatorMap.has(medId)) {
        mediatorMap.set(medId, { id: medId, name: medName, mobile: medMobile, email: medEmail, count: 0, liability: 0 });
      }
      const entry = mediatorMap.get(medId)!;
      entry.count += 1;
      entry.liability += payout;
    });

    const mediatorBreakdown = Array.from(mediatorMap.values()).sort((a, b) => b.count - a.count);

    // Fetch active mediators list for reassignment & filter dropdowns
    const activeMediators = await User.find({ role: "MEDIATOR", isActive: true })
      .select("name systemDisplayName email mobile")
      .lean();

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalStuckOrders: totalStuckOrdersCount,
        totalPayoutLiability: Math.round(totalPayoutLiability),
        maxDaysStuck,
        tierWarningCount,
        tierHighCount,
        tierCriticalCount,
        mediatorBreakdown,
      },
      activeMediators,
    });
  } catch (error: any) {
    console.error("GET /api/admin/stuck-verifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
