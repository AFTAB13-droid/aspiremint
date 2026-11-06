import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";
import { Order, OrderStatus } from "@/modules/order/order.model";
import { Wallet } from "@/modules/wallet/wallet.model";
import { Transaction, TransactionType, TransactionCategory } from "@/modules/wallet/transaction.model";
import { Referral, IReferral } from "@/modules/referral/referral.model";

export const REFERRAL_CONSTANTS = {
  BASE_AMAZON_REWARD: 50,
  FOLLOWON_REWARD: 10,
  MAX_FOLLOWON_ORDERS: 4,
  MAX_REWARD_PER_REFEREE: 90,
  MINIMUM_WITHDRAWAL_THRESHOLD: 100, // ₹100 minimum withdrawal
  RETURN_WINDOW_DAYS: 7, // 7 days return shield
  MILESTONE_BUYERS_COUNT: 10,
  MILESTONE_BONUS_AMOUNT: 100,
};

export class ReferralService {
  /**
   * Helper: Ensure a buyer wallet exists with standard WLT-AMXXXX ID
   */
  static async ensureWallet(userId: string | mongoose.Types.ObjectId): Promise<any> {
    await connectToDatabase();
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      const user = await User.findById(userId).select("aspireMintId");
      const walletId = user?.aspireMintId ? `WLT-${user.aspireMintId}` : `WLT-${userId.toString().slice(-6).toUpperCase()}`;
      wallet = await Wallet.create({
        userId,
        walletId,
        balance: 0,
        availableBalance: 0,
        pendingBalance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lifetimeWithdrawn: 0,
        status: "ACTIVE",
      });
    } else if (!wallet.walletId) {
      const user = await User.findById(userId).select("aspireMintId");
      wallet.walletId = user?.aspireMintId ? `WLT-${user.aspireMintId}` : `WLT-${userId.toString().slice(-6).toUpperCase()}`;
      await wallet.save();
    }
    return wallet;
  }

  /**
   * 1. Attribute new referee signup to a referrer
   */
  static async attributeReferral(refereeId: string | mongoose.Types.ObjectId, referralCode: string) {
    await connectToDatabase();
    if (!referralCode || !referralCode.trim()) return null;

    const cleanCode = referralCode.trim().toUpperCase();

    // Find referrer by referralId or aspireMintId
    const referrer = await User.findOne({
      $or: [
        { referralId: cleanCode },
        { aspireMintId: cleanCode }
      ],
      isActive: true,
    });

    if (!referrer) {
      console.warn(`Referral attribution failed: Invalid code "${cleanCode}"`);
      return null;
    }

    // Prevent self-referral
    if (referrer._id.toString() === refereeId.toString()) {
      console.warn("Self-referral attempt blocked.");
      return null;
    }

    // Check if referee already has a referrer
    const existingReferral = await Referral.findOne({ referee: refereeId });
    if (existingReferral) {
      return existingReferral;
    }

    // Create referral record
    const referral = await Referral.create({
      referrer: referrer._id,
      referee: refereeId,
      referralCode: cleanCode,
      status: "PENDING",
      hasAmazonOrder: false,
      baseRewardEarned: false,
      followOnCount: 0,
      totalEarned: 0,
      orders: [],
      riskFlags: [],
    });

    // Update referee record
    await User.findByIdAndUpdate(refereeId, {
      referredBy: {
        referrerId: referrer._id,
        referralCode: cleanCode,
        referredAt: new Date(),
      },
    });

    // Increment referrer's stats
    await User.findByIdAndUpdate(referrer._id, {
      $inc: { "referralStats.totalReferredUsers": 1 },
    });

    // Ensure wallets exist for both
    await this.ensureWallet(referrer._id);
    await this.ensureWallet(refereeId);

    return referral;
  }

  /**
   * 2. Process an order when it completes/refunds
   */
  static async processOrderCompletion(orderId: string | mongoose.Types.ObjectId) {
    await connectToDatabase();
    const order = await Order.findById(orderId).populate("buyer", "name email paymentDetails");
    if (!order || !order.buyer) return;

    const buyerId = (order.buyer as any)._id || order.buyer;
    const referral = await Referral.findOne({ referee: buyerId });
    if (!referral || referral.status === "FRAUD_BLOCKED") return;

    // Check maximum cap
    if (referral.totalEarned >= REFERRAL_CONSTANTS.MAX_REWARD_PER_REFEREE) {
      return;
    }

    // Check if this order has already been logged in referral
    const alreadyProcessed = referral.orders.some(
      (o) => o.orderId.toString() === order._id.toString()
    );
    if (alreadyProcessed) return;

    // Check platform
    const marketplaceRaw = (order.marketplace || "").toLowerCase();
    const isAmazon = marketplaceRaw.includes("amazon") || (order.brandName || "").toLowerCase().includes("amazon");

    // Anti-Fraud Checks
    const referrer = await User.findById(referral.referrer).select("paymentDetails name email");
    const riskFlags: string[] = [];

    if (referrer && referrer.paymentDetails && (order.buyer as any).paymentDetails) {
      const bUpi = (order.buyer as any).paymentDetails.upiId?.trim()?.toLowerCase();
      const rUpi = referrer.paymentDetails.upiId?.trim()?.toLowerCase();
      if (bUpi && rUpi && bUpi === rUpi) {
        riskFlags.push("IDENTICAL_UPI_ID_DETECTED");
      }
      const bAcc = (order.buyer as any).paymentDetails.accountNumber?.trim();
      const rAcc = referrer.paymentDetails.accountNumber?.trim();
      if (bAcc && rAcc && bAcc === rAcc) {
        riskFlags.push("IDENTICAL_BANK_ACCOUNT_DETECTED");
      }
    }

    if (riskFlags.length > 0) {
      referral.riskFlags = Array.from(new Set([...referral.riskFlags, ...riskFlags]));
      await referral.save();
    }

    const returnWindowExpiresAt = new Date(
      Date.now() + REFERRAL_CONSTANTS.RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );

    const referrerWallet = await this.ensureWallet(referral.referrer);

    // LOGIC A: Amazon Order & Base Reward not yet earned
    if (isAmazon && !referral.baseRewardEarned) {
      const rewardAmount = REFERRAL_CONSTANTS.BASE_AMAZON_REWARD; // ₹50

      referral.hasAmazonOrder = true;
      referral.baseRewardEarned = true;
      referral.totalEarned += rewardAmount;
      referral.status = "AMAZON_QUALIFIED";

      referral.orders.push({
        orderId: order._id,
        marketplace: "AMAZON",
        orderSequence: 1,
        rewardAmount,
        status: "PENDING_VERIFICATION",
        returnWindowExpiresAt,
        verifiedAt: new Date(),
        note: "Amazon Qualifying Base Reward (+₹50)",
      });

      // Update referrer wallet pending balance
      referrerWallet.pendingBalance = (referrerWallet.pendingBalance || 0) + rewardAmount;
      await referrerWallet.save();

      // Create Ledger Entry
      await Transaction.create({
        walletId: referrerWallet._id,
        type: TransactionType.CREDIT,
        category: TransactionCategory.REFERRAL_BASE_REWARD,
        amount: rewardAmount,
        balanceAfter: referrerWallet.availableBalance || 0,
        status: "PENDING",
        referenceId: order.aspireOrderId || order.userOrderId || order._id.toString(),
        note: `Referral Base Reward: Amazon order verified for friend ${(order.buyer as any).name || "Buyer"}`,
        sender: buyerId,
        receiver: referral.referrer,
      });

      // Unfreeze any previously held non-Amazon orders in LOCKED_AWAITING_AMAZON
      for (const ord of referral.orders) {
        if (ord.status === "LOCKED_AWAITING_AMAZON") {
          ord.status = "PENDING_VERIFICATION";
          ord.returnWindowExpiresAt = returnWindowExpiresAt;
          referrerWallet.pendingBalance += ord.rewardAmount;
          await Transaction.create({
            walletId: referrerWallet._id,
            type: TransactionType.CREDIT,
            category: TransactionCategory.REFERRAL_FOLLOWON_REWARD,
            amount: ord.rewardAmount,
            balanceAfter: referrerWallet.availableBalance || 0,
            status: "PENDING",
            referenceId: ord.orderId.toString(),
            note: "Unfrozen Follow-on Reward released by Amazon qualification",
            sender: buyerId,
            receiver: referral.referrer,
          });
        }
      }
      await referrerWallet.save();
    }
    // LOGIC B: Follow-on eligible orders (up to 4 follow-ons)
    else if (referral.followOnCount < REFERRAL_CONSTANTS.MAX_FOLLOWON_ORDERS) {
      const rewardAmount = REFERRAL_CONSTANTS.FOLLOWON_REWARD; // ₹10
      const currentSeq = referral.orders.length + 1;

      if (referral.hasAmazonOrder) {
        // Amazon anchor already satisfied -> directly enter PENDING_VERIFICATION
        referral.followOnCount += 1;
        referral.totalEarned += rewardAmount;

        referral.orders.push({
          orderId: order._id,
          marketplace: isAmazon ? "AMAZON" : "OTHER",
          orderSequence: currentSeq,
          rewardAmount,
          status: "PENDING_VERIFICATION",
          returnWindowExpiresAt,
          verifiedAt: new Date(),
          note: `Follow-on Reward #${referral.followOnCount} (+₹10)`,
        });

        referrerWallet.pendingBalance = (referrerWallet.pendingBalance || 0) + rewardAmount;
        await referrerWallet.save();

        await Transaction.create({
          walletId: referrerWallet._id,
          type: TransactionType.CREDIT,
          category: TransactionCategory.REFERRAL_FOLLOWON_REWARD,
          amount: rewardAmount,
          balanceAfter: referrerWallet.availableBalance || 0,
          status: "PENDING",
          referenceId: order.aspireOrderId || order.userOrderId || order._id.toString(),
          note: `Referral Follow-on Reward #${referral.followOnCount} for friend ${(order.buyer as any).name || "Buyer"}`,
          sender: buyerId,
          receiver: referral.referrer,
        });
      } else {
        // Amazon anchor not yet satisfied -> hold in escrow
        referral.followOnCount += 1;
        referral.totalEarned += rewardAmount;

        referral.orders.push({
          orderId: order._id,
          marketplace: "OTHER",
          orderSequence: currentSeq,
          rewardAmount,
          status: "LOCKED_AWAITING_AMAZON",
          note: `Follow-on Reward #${referral.followOnCount} held in escrow awaiting Amazon order`,
        });
      }
    }

    if (referral.followOnCount >= REFERRAL_CONSTANTS.MAX_FOLLOWON_ORDERS && referral.baseRewardEarned) {
      referral.status = "FULLY_COMPLETED";
    }

    await referral.save();

    // Auto-mature any already eligible pending rewards
    await this.maturePendingRewards(referral.referrer);
  }

  /**
   * 3. Mature pending rewards whose return window has safely expired
   */
  static async maturePendingRewards(referrerId?: string | mongoose.Types.ObjectId) {
    await connectToDatabase();
    const query: any = {};
    if (referrerId) query.referrer = referrerId;

    const referrals = await Referral.find(query);
    const now = new Date();

    for (const ref of referrals) {
      let walletModified = false;
      const wallet = await this.ensureWallet(ref.referrer);

      for (const ord of ref.orders) {
        if (ord.status === "PENDING_VERIFICATION" && ord.returnWindowExpiresAt && ord.returnWindowExpiresAt <= now) {
          // Check order is still in good standing
          const actualOrder = await Order.findById(ord.orderId).select("status");
          if (actualOrder && actualOrder.status !== OrderStatus.CANCELLED && actualOrder.status !== OrderStatus.REFUND_REJECTED) {
            ord.status = "AVAILABLE";

            // Move from pending to available in wallet
            wallet.pendingBalance = Math.max(0, (wallet.pendingBalance || 0) - ord.rewardAmount);
            wallet.availableBalance = (wallet.availableBalance || 0) + ord.rewardAmount;
            wallet.balance = wallet.availableBalance;
            wallet.lifetimeEarned = (wallet.lifetimeEarned || 0) + ord.rewardAmount;
            walletModified = true;

            // Mark transaction completed
            await Transaction.findOneAndUpdate(
              {
                walletId: wallet._id,
                referenceId: { $in: [ord.orderId.toString(), ord.orderId] },
                status: "PENDING",
              },
              {
                status: "COMPLETED",
                balanceAfter: wallet.availableBalance,
              }
            );
          } else {
            // Cancelled or returned
            ord.status = "CANCELLED";
            wallet.pendingBalance = Math.max(0, (wallet.pendingBalance || 0) - ord.rewardAmount);
            walletModified = true;

            await Transaction.findOneAndUpdate(
              {
                walletId: wallet._id,
                referenceId: { $in: [ord.orderId.toString(), ord.orderId] },
                status: "PENDING",
              },
              {
                status: "FAILED",
                note: "Voided due to order cancellation or return",
              }
            );
          }
        }
      }

      if (walletModified) {
        await wallet.save();
        await ref.save();

        // Check 10-buyer milestone for referrer
        await this.checkMilestoneBonus(ref.referrer);
      }
    }
  }

  /**
   * 4. Check and credit 10-buyer milestone bonus (₹100)
   */
  static async checkMilestoneBonus(referrerId: string | mongoose.Types.ObjectId) {
    const qualifiedCount = await Referral.countDocuments({
      referrer: referrerId,
      baseRewardEarned: true,
      "orders.status": "AVAILABLE",
    });

    const user = await User.findById(referrerId);
    if (!user) return;

    const milestonesClaimed = user.referralStats?.milestonesClaimed || 0;
    if (qualifiedCount >= REFERRAL_CONSTANTS.MILESTONE_BUYERS_COUNT && milestonesClaimed === 0) {
      const wallet = await this.ensureWallet(referrerId);
      const bonus = REFERRAL_CONSTANTS.MILESTONE_BONUS_AMOUNT; // ₹100

      wallet.availableBalance += bonus;
      wallet.balance = wallet.availableBalance;
      wallet.lifetimeEarned += bonus;
      await wallet.save();

      await Transaction.create({
        walletId: wallet._id,
        type: TransactionType.CREDIT,
        category: TransactionCategory.REFERRAL_MILESTONE_BONUS,
        amount: bonus,
        balanceAfter: wallet.availableBalance,
        status: "COMPLETED",
        referenceId: `MILESTONE-10-${Date.now()}`,
        note: `🎉 10-Buyer Referral Milestone Achieved (+₹${bonus} Bonus)`,
      });

      await User.findByIdAndUpdate(referrerId, {
        $set: { "referralStats.qualifiedBuyersCount": qualifiedCount },
        $inc: { "referralStats.milestonesClaimed": 1 },
      });
    }
  }

  /**
   * 5. Get complete Referral & Wallet summary for a buyer
   */
  static async getBuyerReferralHub(userId: string | mongoose.Types.ObjectId) {
    await connectToDatabase();
    await this.maturePendingRewards(userId);

    const user = await User.findById(userId).select("name email aspireMintId referralId referralStats");
    const wallet = await this.ensureWallet(userId);

    const referrals = await Referral.find({ referrer: userId })
      .populate("referee", "name email aspireMintId avatar createdAt")
      .sort({ createdAt: -1 });

    const transactions = await Transaction.find({ walletId: wallet._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const formattedReferrals = referrals.map((r) => {
      const refUser = r.referee as any;
      return {
        _id: r._id,
        refereeName: refUser?.name || "Member",
        refereeMintId: refUser?.aspireMintId || "AM-USER",
        joinedAt: r.createdAt,
        status: r.status,
        hasAmazonOrder: r.hasAmazonOrder,
        baseRewardEarned: r.baseRewardEarned,
        followOnCount: r.followOnCount,
        totalEarned: r.totalEarned,
        maxPotential: REFERRAL_CONSTANTS.MAX_REWARD_PER_REFEREE,
        orders: r.orders,
      };
    });

    const isWithdrawalEligible = (wallet.availableBalance || 0) >= REFERRAL_CONSTANTS.MINIMUM_WITHDRAWAL_THRESHOLD;

    return {
      referralCode: user?.referralId || user?.aspireMintId || "",
      aspireMintId: user?.aspireMintId || "",
      wallet: {
        walletId: wallet.walletId,
        availableBalance: wallet.availableBalance || 0,
        pendingBalance: wallet.pendingBalance || 0,
        lifetimeEarned: wallet.lifetimeEarned || 0,
        lifetimeSpent: wallet.lifetimeSpent || 0,
        lifetimeWithdrawn: wallet.lifetimeWithdrawn || 0,
        minWithdrawalThreshold: REFERRAL_CONSTANTS.MINIMUM_WITHDRAWAL_THRESHOLD,
        isWithdrawalEligible,
      },
      stats: {
        totalReferred: referrals.length,
        amazonQualified: referrals.filter((r) => r.hasAmazonOrder).length,
        fullyCompleted: referrals.filter((r) => r.status === "FULLY_COMPLETED").length,
        totalEarned: wallet.lifetimeEarned || 0,
      },
      friends: formattedReferrals,
      transactions,
    };
  }

  /**
   * 6. Request a withdrawal to UPI or Bank Account
   */
  static async requestWithdrawal(
    userId: string | mongoose.Types.ObjectId,
    amount: number,
    paymentMethod: "UPI" | "BANK",
    details: { upiId?: string; bankName?: string; accountNumber?: string; ifscCode?: string; accountHolder?: string }
  ) {
    await connectToDatabase();
    const wallet = await this.ensureWallet(userId);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < REFERRAL_CONSTANTS.MINIMUM_WITHDRAWAL_THRESHOLD) {
      throw new Error(`Minimum withdrawal amount is ₹${REFERRAL_CONSTANTS.MINIMUM_WITHDRAWAL_THRESHOLD}`);
    }

    if ((wallet.availableBalance || 0) < numAmount) {
      throw new Error("Insufficient available wallet balance");
    }

    // Deduct immediately to prevent double spending
    wallet.availableBalance -= numAmount;
    wallet.balance = wallet.availableBalance;
    wallet.lifetimeWithdrawn = (wallet.lifetimeWithdrawn || 0) + numAmount;
    await wallet.save();

    // Create withdrawal transaction record
    const tx = await Transaction.create({
      walletId: wallet._id,
      type: TransactionType.DEBIT,
      category: TransactionCategory.WITHDRAWAL_REQUEST,
      amount: numAmount,
      balanceAfter: wallet.availableBalance,
      status: "PENDING",
      paymentMethod: "ONLINE",
      referenceId: `WTH-${Date.now()}`,
      note: paymentMethod === "UPI" ? `Payout to UPI: ${details.upiId}` : `Payout to Bank: ${details.bankName} (${details.accountNumber})`,
      bankName: details.bankName,
      accountNumber: details.accountNumber,
      ifscCode: details.ifscCode,
      sender: userId,
    });

    return { success: true, transactionId: tx._id, remainingBalance: wallet.availableBalance };
  }
}
