import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Wallet } from '@/modules/wallet/wallet.model';
import { Transaction, TransactionType, TransactionCategory } from '@/modules/wallet/transaction.model';
import { User } from '@/modules/user/user.model';
import { Order, OrderStatus } from '@/modules/order/order.model';
import connectToDatabase from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mediatorIdParam = searchParams.get("mediatorId");
    const timeframe = searchParams.get("timeframe") || "all";
    const userRole = (session.user as any).role || "USER";

    await connectToDatabase();

    const isAdminOrSub = userRole === 'ADMIN' || userRole === 'SUBADMIN';

    // Build timeframe date query filter
    let dateFilter: any = {};
    if (timeframe === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: oneWeekAgo } };
    } else if (timeframe === "month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      dateFilter = { createdAt: { $gte: oneMonthAgo } };
    } else if (timeframe === "year") {
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);
      dateFilter = { createdAt: { $gte: oneYearAgo } };
    }

    // 1. If Admin requested master view (no specific mediator ID)
    if (isAdminOrSub && !mediatorIdParam) {
      const mediators = await User.find({ role: 'MEDIATOR', isActive: true }).select('name email aspireMintId paymentDetails');
      
      const summary = await Promise.all(mediators.map(async (med) => {
        const activeApprovedOrders = await Order.find({
          mediator: med._id,
          status: { $in: [OrderStatus.APPROVED, OrderStatus.REFUND_APPROVED] },
          ...dateFilter
        });

        let activeOrdersLiability = 0;
        activeApprovedOrders.forEach(order => {
          // Payable = only the refund amount owed to the buyer (not mediator commission)
          const refundAmount = order.amount || 0;
          activeOrdersLiability += refundAmount;
        });

        // Find or create wallet to fetch manual transaction history
        let wallet = await Wallet.findOne({ userId: med._id });
        if (!wallet) {
          wallet = await Wallet.create({ userId: med._id, balance: 0 });
        }

        const payments = await Transaction.find({
          walletId: wallet._id,
          type: TransactionType.CREDIT,
          status: 'COMPLETED',
          ...dateFilter
        });

        const totalPaidByAdmin = payments.reduce((sum, tx) => sum + tx.amount, 0);
        const netBalance = totalPaidByAdmin - activeOrdersLiability; // Will be negative if liability exceeds payments

        return {
          _id: med._id,
          name: med.name,
          email: med.email,
          aspireMintId: med.aspireMintId || 'N/A',
          paymentDetails: med.paymentDetails || {},
          activeOrdersCount: activeApprovedOrders.length,
          activeOrdersLiability,
          totalPaidByAdmin,
          netBalance
        };
      }));

      return NextResponse.json({ success: true, data: { summary } });
    }

    // 2. Specific passbook view (either a mediator viewing their own or admin viewing a specific mediator)
    let targetUserId = session.user.id;
    if (isAdminOrSub && mediatorIdParam) {
      targetUserId = mediatorIdParam;
    }

    const targetUser = await User.findById(targetUserId).select('name email mobile aspireMintId paymentDetails');
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'Mediator not found' }, { status: 404 });
    }

    // Find or Initialize Wallet
    let wallet = await Wallet.findOne({ userId: targetUserId });
    if (!wallet) {
      wallet = await Wallet.create({ userId: targetUserId, balance: 0 });
    }

    const activeApprovedOrders = await Order.find({
      mediator: targetUserId,
      status: { $in: [OrderStatus.APPROVED, OrderStatus.REFUND_APPROVED] },
      ...dateFilter
    });

    let activeOrdersLiability = 0;
    const ordersList = activeApprovedOrders.map(order => {
      // Payable = only the refund amount owed (order.amount), no mediator commission
      const refundAmount = order.amount || 0;
      activeOrdersLiability += refundAmount;

      return {
        _id: order._id,
        aspireOrderId: order.aspireOrderId,
        brandName: order.brandName,
        productCode: order.productCode,
        amount: order.amount,
        refundAmount,
        status: order.status,
        createdAt: order.createdAt
      };
    });

    const transactions = await Transaction.find({ walletId: wallet._id, ...dateFilter })
      .populate("sender", "name email aspireMintId role")
      .populate("receiver", "name email aspireMintId role")
      .sort({ createdAt: -1 });

    const totalPaidByAdmin = transactions
      .filter(tx => tx.type === TransactionType.CREDIT && tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const netBalance = totalPaidByAdmin - activeOrdersLiability;

    return NextResponse.json({
      success: true,
      data: {
        wallet: {
          _id: wallet._id,
          userId: targetUserId,
          name: targetUser.name,
          email: targetUser.email,
          mobile: targetUser.mobile || 'N/A',
          aspireMintId: targetUser.aspireMintId || 'N/A',
          paymentDetails: targetUser.paymentDetails || {},
          activeOrdersLiability,
          totalPaidByAdmin,
          netBalance
        },
        activeOrders: ordersList,
        transactions
      }
    });

  } catch (error) {
    console.error('Wallet Fetch Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mediatorId, amount, note, paymentMethod, bankName, accountNumber, ifscCode, referenceId, transactionDate } = body;
    const userRole = (session.user as any).role || "USER";

    if (userRole !== "ADMIN" && userRole !== "SUBADMIN") {
      return NextResponse.json({ success: false, message: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    if (!mediatorId) {
      return NextResponse.json({ success: false, message: 'Mediator ID is required' }, { status: 400 });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return NextResponse.json({ success: false, message: 'Valid amount is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Verify mediator exists
    const mediator = await User.findById(mediatorId);
    if (!mediator) {
      return NextResponse.json({ success: false, message: 'Mediator not found' }, { status: 404 });
    }

    // Find or Initialize Wallet
    let wallet = await Wallet.findOne({ userId: mediatorId });
    if (!wallet) {
      wallet = await Wallet.create({ userId: mediatorId, balance: 0 });
    }

    // Calculate active approved orders liability for live snapshot
    const activeApprovedOrders = await Order.find({
      mediator: mediatorId,
      status: { $in: [OrderStatus.APPROVED, OrderStatus.REFUND_APPROVED] }
    });

    // Payable = only the sum of refund amounts of REFUND_APPROVED orders (no mediator commission)
    const activeOrdersLiability = activeApprovedOrders.reduce((sum, order) => {
      return sum + (order.amount || 0);
    }, 0);

    // Get previous completed payments
    const previousPayments = await Transaction.find({
      walletId: wallet._id,
      type: TransactionType.CREDIT,
      status: 'COMPLETED'
    });
    const totalPreviousPayments = previousPayments.reduce((sum, tx) => sum + tx.amount, 0);

    const balanceBefore = totalPreviousPayments - activeOrdersLiability;
    const balanceAfter = balanceBefore + numericAmount;

    // Create Transfer Transaction (CREDIT to Mediator's Passbook)
    const transaction = new Transaction({
      walletId: wallet._id,
      type: TransactionType.CREDIT,
      category: TransactionCategory.REFILL,
      amount: numericAmount,
      balanceAfter,
      status: "COMPLETED",
      paymentMethod: paymentMethod || "OFFLINE",
      referenceId: referenceId || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      note: note || `Disbursement from Administration`,
      bankName: bankName || 'N/A',
      accountNumber: accountNumber || 'N/A',
      ifscCode: ifscCode || 'N/A',
      sender: session.user.id,
      receiver: mediatorId,
      createdAt: transactionDate ? new Date(transactionDate) : new Date()
    });

    // Update wallet balance for historical stored balance (optional sync)
    wallet.balance = balanceAfter;
    wallet.totalDeposited += numericAmount;

    await Promise.all([wallet.save(), transaction.save()]);

    return NextResponse.json({
      success: true,
      message: 'Transaction authorized and ledger entry saved.',
      data: transaction
    });

  } catch (error) {
    console.error('Wallet Transaction Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
