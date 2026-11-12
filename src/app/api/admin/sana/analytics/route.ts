import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { AiChatLog } from "@/modules/ai/aiChatLog.model";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session?.user?.id || (role !== "ADMIN" && role !== "SUBADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "7d";
    const search = searchParams.get("search")?.trim() || "";

    // Calculate date threshold
    const now = new Date();
    let startDate: Date | null = new Date();

    if (timeframe === "24h") {
      startDate.setHours(startDate.getHours() - 24);
    } else if (timeframe === "7d") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === "30d") {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === "90d") {
      startDate.setDate(startDate.getDate() - 90);
    } else {
      startDate = null; // All time
    }

    const baseFilter: Record<string, any> = {};
    if (startDate) {
      baseFilter.createdAt = { $gte: startDate };
    }

    // 1. Overall Totals Aggregation
    const totalsAgg = await AiChatLog.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalQueries: { $sum: 1 },
          totalTokens: { $sum: "$tokens.totalTokens" },
          totalPromptTokens: { $sum: "$tokens.promptTokens" },
          totalCompletionTokens: { $sum: "$tokens.completionTokens" },
          totalSpendUsd: { $sum: "$estimatedCostUsd" },
          totalSpendInr: { $sum: "$estimatedCostInr" },
          uniqueUsers: { $addToSet: "$userId" },
        },
      },
    ]);

    const totals = totalsAgg[0] || {
      totalQueries: 0,
      totalTokens: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalSpendUsd: 0,
      totalSpendInr: 0,
      uniqueUsers: [],
    };

    const distinctUsersCount = totals.uniqueUsers ? totals.uniqueUsers.length : 0;
    const avgTokensPerQuery = totals.totalQueries > 0 ? Math.round(totals.totalTokens / totals.totalQueries) : 0;

    // 2. Intent Distribution Breakdown
    const intentAgg = await AiChatLog.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$intentCategory",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const intentBreakdown = intentAgg.map((item) => ({
      category: item._id || "GENERAL",
      count: item.count,
      percentage: totals.totalQueries > 0 ? Math.round((item.count / totals.totalQueries) * 100) : 0,
    }));

    // 3. User Engagement Leaderboard
    const usersAgg = await AiChatLog.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$userId",
          userName: { $last: "$userName" },
          userEmail: { $last: "$userEmail" },
          aspireMintId: { $last: "$aspireMintId" },
          userRole: { $last: "$userRole" },
          totalMessages: { $sum: 1 },
          totalTokens: { $sum: "$tokens.totalTokens" },
          totalCostInr: { $sum: "$estimatedCostInr" },
          lastActive: { $max: "$createdAt" },
          lastMessage: { $last: "$userMessage" },
          ordersInquired: { $addToSet: "$ordersInquired" },
        },
      },
      { $sort: { totalMessages: -1 } },
      { $limit: 50 },
    ]);

    const topUsers = usersAgg.map((u) => ({
      userId: u._id,
      name: u.userName || "Shopper",
      email: u.userEmail || "N/A",
      aspireMintId: u.aspireMintId || "",
      role: u.userRole || "USER",
      totalMessages: u.totalMessages,
      totalTokens: u.totalTokens,
      totalCostInr: Math.round(u.totalCostInr * 100) / 100,
      lastActive: u.lastActive,
      lastMessage: u.lastMessage || "",
      ordersInquired: Array.from(new Set((u.ordersInquired || []).flat().filter(Boolean))),
    }));

    // 4. Daily Usage Trend (for chart)
    const dailyAgg = await AiChatLog.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
          queries: { $sum: 1 },
          tokens: { $sum: "$tokens.totalTokens" },
          costInr: { $sum: "$estimatedCostInr" },
          users: { $addToSet: "$userId" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyTrend = dailyAgg.map((d) => ({
      date: d._id,
      queries: d.queries,
      tokens: d.tokens,
      costInr: Math.round(d.costInr * 100) / 100,
      distinctUsers: d.users.length,
    }));

    // 5. Recent Logs Filter
    const logsFilter: Record<string, any> = { ...baseFilter };
    if (search) {
      logsFilter.$or = [
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
        { userMessage: { $regex: search, $options: "i" } },
        { sanaReply: { $regex: search, $options: "i" } },
        { aspireMintId: { $regex: search, $options: "i" } },
      ];
    }

    const recentLogs = await AiChatLog.find(logsFilter)
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          distinctUsersCount,
          totalQueries: totals.totalQueries,
          totalTokens: totals.totalTokens,
          totalSpendInr: Math.round(totals.totalSpendInr * 100) / 100,
          totalSpendUsd: Math.round(totals.totalSpendUsd * 1000) / 1000,
          avgTokensPerQuery,
        },
        intentBreakdown,
        dailyTrend,
        topUsers,
        recentLogs: recentLogs.map((log: any) => ({
          id: log._id.toString(),
          userId: log.userId?.toString(),
          userName: log.userName,
          userEmail: log.userEmail,
          aspireMintId: log.aspireMintId,
          userMessage: log.userMessage,
          sanaReply: log.sanaReply,
          intentCategory: log.intentCategory,
          toolsUsed: log.toolsUsed || [],
          tokens: log.tokens,
          costInr: Math.round(log.estimatedCostInr * 100) / 100,
          ordersInquired: log.ordersInquired || [],
          createdAt: log.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error("Sana Admin Analytics API Error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
