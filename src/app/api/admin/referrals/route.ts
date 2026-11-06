import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Referral } from "@/modules/referral/referral.model";
import { Wallet } from "@/modules/wallet/wallet.model";
import { Transaction, TransactionType, TransactionCategory } from "@/modules/wallet/transaction.model";
import { User } from "@/modules/user/user.model";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUBADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "ALL";

    // 1. Calculate Aggregate Metrics
    const totalReferrals = await Referral.countDocuments();
    const amazonQualified = await Referral.countDocuments({ hasAmazonOrder: true });
    const fullyCompleted = await Referral.countDocuments({ status: "FULLY_COMPLETED" });
    const flaggedCount = await Referral.countDocuments({ "riskFlags.0": { $exists: true } });

    // Wallets financial aggregate
    const walletAgg = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalAvailable: { $sum: "$availableBalance" },
          totalPending: { $sum: "$pendingBalance" },
          totalLifetimeEarned: { $sum: "$lifetimeEarned" },
          totalLifetimeWithdrawn: { $sum: "$lifetimeWithdrawn" },
        },
      },
    ]);

    const financialStats = walletAgg[0] || {
      totalAvailable: 0,
      totalPending: 0,
      totalLifetimeEarned: 0,
      totalLifetimeWithdrawn: 0,
    };

    // 2. Build Query
    let query: any = {};
    if (filter === "AMAZON_QUALIFIED") query.hasAmazonOrder = true;
    if (filter === "FLAGGED") query["riskFlags.0"] = { $exists: true };
    if (filter === "COMPLETED") query.status = "FULLY_COMPLETED";

    const referrals = await Referral.find(query)
      .populate("referrer", "name email mobile aspireMintId paymentDetails")
      .populate("referee", "name email mobile aspireMintId paymentDetails")
      .sort({ createdAt: -1 })
      .limit(100);

    // Filter by search term if provided
    const filteredReferrals = search
      ? referrals.filter((r: any) => {
          const s = search.toLowerCase();
          return (
            r.referralCode?.toLowerCase().includes(s) ||
            r.referrer?.name?.toLowerCase().includes(s) ||
            r.referrer?.aspireMintId?.toLowerCase().includes(s) ||
            r.referee?.name?.toLowerCase().includes(s) ||
            r.referee?.aspireMintId?.toLowerCase().includes(s)
          );
        })
      : referrals;

    // 3. Fetch Pending Withdrawal Requests
    const pendingWithdrawals = await Transaction.find({
      category: TransactionCategory.WITHDRAWAL_REQUEST,
      status: "PENDING",
    })
      .populate("sender", "name email mobile aspireMintId paymentDetails")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalReferrals,
          amazonQualified,
          fullyCompleted,
          flaggedCount,
          conversionRate: totalReferrals > 0 ? Math.round((amazonQualified / totalReferrals) * 100) : 0,
          ...financialStats,
        },
        referrals: filteredReferrals,
        pendingWithdrawals,
      },
    });
  } catch (error: any) {
    console.error("Admin Referrals GET Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch referrals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUBADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action, transactionId, utr, rejectionReason, referralId } = body;

    await connectToDatabase();

    // ACTION A: APPROVE WITHDRAWAL
    if (action === "APPROVE_WITHDRAWAL") {
      const tx = await Transaction.findById(transactionId);
      if (!tx || tx.status !== "PENDING") {
        return NextResponse.json({ success: false, message: "Transaction not pending or not found" }, { status: 404 });
      }

      tx.status = "COMPLETED";
      tx.note = `${tx.note} | Approved by ${session.user.name}. UTR: ${utr || "N/A"}`;
      tx.referenceId = utr || tx.referenceId;
      await tx.save();

      return NextResponse.json({ success: true, message: "Withdrawal marked as disbursed and completed" });
    }

    // ACTION B: REJECT WITHDRAWAL (REFUND BACK TO WALLET)
    if (action === "REJECT_WITHDRAWAL") {
      const tx = await Transaction.findById(transactionId);
      if (!tx || tx.status !== "PENDING") {
        return NextResponse.json({ success: false, message: "Transaction not pending or not found" }, { status: 404 });
      }

      // Restore wallet available balance
      const wallet = await Wallet.findById(tx.walletId);
      if (wallet) {
        wallet.availableBalance += tx.amount;
        wallet.balance = wallet.availableBalance;
        wallet.lifetimeWithdrawn = Math.max(0, (wallet.lifetimeWithdrawn || 0) - tx.amount);
        await wallet.save();
      }

      tx.status = "FAILED";
      tx.note = `${tx.note} | Rejected: ${rejectionReason || "Details invalid"}. Balance refunded.`;
      await tx.save();

      return NextResponse.json({ success: true, message: "Withdrawal rejected and balance restored to buyer" });
    }

    // ACTION C: DISMISS FRAUD RISK FLAG
    if (action === "DISMISS_FLAG") {
      await Referral.findByIdAndUpdate(referralId, { $set: { riskFlags: [] } });
      return NextResponse.json({ success: true, message: "Risk flags cleared" });
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin Referrals POST Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Action failed" }, { status: 500 });
  }
}
