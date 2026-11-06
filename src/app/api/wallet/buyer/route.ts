import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Wallet } from "@/modules/wallet/wallet.model";
import { Transaction } from "@/modules/wallet/transaction.model";
import { ReferralService, REFERRAL_CONSTANTS } from "@/services/referral.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    await ReferralService.maturePendingRewards(session.user.id);

    const wallet = await ReferralService.ensureWallet(session.user.id);
    const transactions = await Transaction.find({ walletId: wallet._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const isWithdrawalEligible = (wallet.availableBalance || 0) >= REFERRAL_CONSTANTS.MINIMUM_WITHDRAWAL_THRESHOLD;

    return NextResponse.json({
      success: true,
      data: {
        wallet: {
          walletId: wallet.walletId,
          balance: wallet.availableBalance || 0,
          availableBalance: wallet.availableBalance || 0,
          pendingBalance: wallet.pendingBalance || 0,
          lifetimeEarned: wallet.lifetimeEarned || 0,
          lifetimeSpent: wallet.lifetimeSpent || 0,
          lifetimeWithdrawn: wallet.lifetimeWithdrawn || 0,
          minWithdrawalThreshold: REFERRAL_CONSTANTS.MINIMUM_WITHDRAWAL_THRESHOLD,
          isWithdrawalEligible,
          progressPercentage: Math.min(
            100,
            Math.round(((wallet.availableBalance || 0) / REFERRAL_CONSTANTS.MINIMUM_WITHDRAWAL_THRESHOLD) * 100)
          ),
        },
        transactions,
      },
    });
  } catch (error: any) {
    console.error("Buyer Wallet GET Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to load wallet" }, { status: 500 });
  }
}
