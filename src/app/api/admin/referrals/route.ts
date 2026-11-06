import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import mongoose from "mongoose";
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

    const hasTestData = Boolean(
      (await Transaction.exists({ referenceId: { $regex: /TEST/i } })) ||
      (await Referral.exists({ referralCode: "TEST-AM-SEED" }))
    );

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
        hasTestData,
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

    // ACTION D: SEED SIMULATION TEST DATA (FOR ADMIN TESTING)
    if (action === "SEED_TEST_REFERRAL") {
      // 1. Create or find test referrer user
      let testReferrer = await User.findOne({ email: "rohit.test@aspiremint.local" });
      if (!testReferrer) {
        testReferrer = await User.create({
          name: "Rohit Sharma (Test Buyer)",
          email: "rohit.test@aspiremint.local",
          mobile: "9876543210",
          role: "USER",
          aspireMintId: "TEST-AM9921",
          referralId: "TEST-AM-SEED",
          isProfileComplete: true,
          isActive: true,
          isApproved: true,
          totalCompletedOrders: 5,
          paymentDetails: {
            upiId: "rohit.test@okhdfcbank",
            bankName: "HDFC Bank",
            accountHolder: "Rohit Sharma",
          },
        });
      }

      // 2. Create or find test referee user
      let testReferee = await User.findOne({ email: "ananya.test@aspiremint.local" });
      if (!testReferee) {
        testReferee = await User.create({
          name: "Ananya Verma (Test Referee)",
          email: "ananya.test@aspiremint.local",
          mobile: "9876543211",
          role: "USER",
          aspireMintId: "TEST-AM9922",
          referralId: "ANANYA-REF-TEST",
          isProfileComplete: true,
          isActive: true,
          isApproved: true,
          totalCompletedOrders: 5,
        });
      }

      // 3. Create or update test referral
      let referral = await Referral.findOne({ referee: testReferee._id });
      if (!referral) {
        referral = await Referral.create({
          referrer: testReferrer._id,
          referee: testReferee._id,
          referralCode: "TEST-AM-SEED",
          status: "FULLY_COMPLETED",
          hasAmazonOrder: true,
          baseRewardEarned: true,
          followOnCount: 4,
          totalEarned: 90,
          orders: [
            {
              orderId: new mongoose.Types.ObjectId(),
              marketplace: "Amazon",
              orderSequence: 1,
              rewardAmount: 50,
              status: "AVAILABLE",
              note: "Amazon Anchor Order (Verified)",
            },
            {
              orderId: new mongoose.Types.ObjectId(),
              marketplace: "Flipkart",
              orderSequence: 2,
              rewardAmount: 10,
              status: "AVAILABLE",
              note: "Follow-on Order 1",
            },
            {
              orderId: new mongoose.Types.ObjectId(),
              marketplace: "Amazon",
              orderSequence: 3,
              rewardAmount: 10,
              status: "AVAILABLE",
              note: "Follow-on Order 2",
            },
            {
              orderId: new mongoose.Types.ObjectId(),
              marketplace: "Myntra",
              orderSequence: 4,
              rewardAmount: 10,
              status: "AVAILABLE",
              note: "Follow-on Order 3",
            },
            {
              orderId: new mongoose.Types.ObjectId(),
              marketplace: "Flipkart",
              orderSequence: 5,
              rewardAmount: 10,
              status: "AVAILABLE",
              note: "Follow-on Order 4",
            },
          ],
        });
      }

      // 4. Create or update test wallet
      let wallet = await Wallet.findOne({ userId: testReferrer._id });
      if (!wallet) {
        wallet = await Wallet.create({
          userId: testReferrer._id,
          walletId: "WLT-TEST-AM9921",
          balance: 0,
          availableBalance: 0,
          pendingBalance: 0,
          lifetimeEarned: 90,
          lifetimeSpent: 0,
          lifetimeWithdrawn: 0,
        });
      }

      // 5. Create pending withdrawal transaction
      const existingPending = await Transaction.findOne({
        walletId: wallet._id,
        category: TransactionCategory.WITHDRAWAL_REQUEST,
        status: "PENDING",
      });

      if (!existingPending) {
        await Transaction.create({
          walletId: wallet._id,
          sender: testReferrer._id,
          type: TransactionType.DEBIT,
          category: TransactionCategory.WITHDRAWAL_REQUEST,
          amount: 90,
          balanceAfter: 0,
          status: "PENDING",
          referenceId: `TEST-WITHDRAW-${Date.now()}`,
          note: "🧪 TEST Payout Request: ₹90 to rohit.test@okhdfcbank",
        });
      }

      return NextResponse.json({
        success: true,
        message: "🧪 Test referral and ₹90 withdrawal request created! Check the queue above.",
      });
    }

    // ACTION E: CLEANUP SIMULATION TEST DATA
    if (action === "CLEAN_TEST_REFERRAL") {
      const testEmails = ["rohit.test@aspiremint.local", "ananya.test@aspiremint.local"];
      const testUsers = await User.find({ email: { $in: testEmails } });
      const testUserIds = testUsers.map((u) => u._id);

      // 1. Delete test transactions
      await Transaction.deleteMany({
        $or: [
          { referenceId: { $regex: /TEST/i } },
          { sender: { $in: testUserIds } },
        ],
      });

      // 2. Delete test referrals
      await Referral.deleteMany({
        $or: [
          { referralCode: "TEST-AM-SEED" },
          { referrer: { $in: testUserIds } },
          { referee: { $in: testUserIds } },
        ],
      });

      // 3. Delete test wallets
      await Wallet.deleteMany({
        $or: [
          { walletId: { $regex: /TEST/i } },
          { userId: { $in: testUserIds } },
        ],
      });

      // 4. Delete test users
      await User.deleteMany({ email: { $in: testEmails } });

      return NextResponse.json({
        success: true,
        message: "🧹 All simulation test records cleaned up from database!",
      });
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin Referrals POST Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Action failed" }, { status: 500 });
  }
}
