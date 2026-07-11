import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Order, OrderStatus } from '@/modules/order/order.model';
import connectToDatabase from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { invalidateDealsCache } from '@/lib/redis';
import { NotificationService } from '@/services/notification.service';
import { NotificationType } from '@/modules/notification/notification.model';
import { sendOrderCreationEmail } from '@/services/emailService';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { 
      brandName, 
      productCode, 
      userOrderId, 
      reviewName, 
      amount, 
      reviewType, // New field from form
      dealType, 
      exchangeProduct, // New field from form
      lessAmount, 
      mediatorId, 
      screenshot,
      // Optional: Explicitly provided refund details (from popup)
      upiId: explicitUpi,
      accountHolder: explicitHolder,
      accountNumber: explicitAccount,
      ifscCode: explicitIfsc,
      bankName: explicitBank
    } = await req.json();

    // Server-Side Input Validation
    if (!brandName || typeof brandName !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid or missing brand name.' }, { status: 400 });
    }
    if (!productCode || typeof productCode !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid or missing product code.' }, { status: 400 });
    }
    if (!userOrderId || typeof userOrderId !== 'string' || userOrderId.trim() === '') {
      return NextResponse.json({ success: false, message: 'Invalid or missing Order ID.' }, { status: 400 });
    }
    const parsedAmount = Number(amount);
    if (amount === undefined || amount === null || isNaN(parsedAmount)) {
      return NextResponse.json({ success: false, message: 'Invalid amount.' }, { status: 400 });
    }
    const validReviewTypes = ['REVIEW', 'RATING', 'ORDER', 'SUBMITTED', 'FEEDBACK'];
    if (reviewType && !validReviewTypes.includes(reviewType)) {
       return NextResponse.json({ success: false, message: 'Invalid review type.' }, { status: 400 });
    }

    await connectToDatabase();
    const mongoose = (await import('mongoose')).default;
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      // Fetch user details for pre-filled data
      const { User } = await import('@/modules/user/user.model');
      
      let finalMediatorId = mediatorId;

      if (!finalMediatorId) {
        throw new Error('Mediator assignment is mandatory. Please select a specialist.');
      }

      // Fetch the assigned mediator's details for commission calculation
      const assignedMediator = await User.findById(finalMediatorId).session(mongoSession);
      if (!assignedMediator) throw new Error('Commission Routing Error: Specialist not found.');

      const user = await User.findById(session.user.id).session(mongoSession);
      if (!user) throw new Error('User not found');

      const currentUpi = explicitUpi || user.paymentDetails?.upiId;
      if (!currentUpi) throw new Error('Payment Compliance Error: Please add a UPI ID to initialize a deal.');

      const { Brand } = await import('@/modules/brand/brand.model');
      const { ActiveDeal } = await import('@/modules/brand/deal.model');
      
      const stockField = reviewType === "RATING" ? "stockRating" : 
                         reviewType === "ORDER" ? "stockOnly" : 
                         reviewType === "SUBMITTED" ? "stockSubmitted" : "stockReview";

      const slotField = reviewType === "RATING" ? "remainingRating" : 
                        reviewType === "ORDER" ? "remainingOnly" : 
                        reviewType === "SUBMITTED" ? "remainingSubmitted" : "remainingReview";

      const brandUpdate = await Brand.findOneAndUpdate(
        { 
          name: brandName, 
          "productCodes.code": productCode,
          [`productCodes.${stockField}`]: { $gt: 0 } 
        },
        { $inc: { "productCodes.$.stock": -1, [`productCodes.$.${stockField}`]: -1 } },
        { session: mongoSession, new: true }
      );

      if (!brandUpdate) throw new Error(`Insufficient master stock for ${reviewType} protocol.`);

      const dealUpdate = await ActiveDeal.findOneAndUpdate(
        { 
          productCode, 
          isActive: true, // CRITICAL: Only allow orders on active deals
          [slotField]: { $gt: 0 } 
        },
        { $inc: { remainingSlots: -1, [slotField]: -1 } },
        { session: mongoSession, new: true }
      );
      
      if (!dealUpdate) {
          // Check if it's inactive or insufficient slots
          const dealCheck = await ActiveDeal.findOne({ productCode }).session(mongoSession);
          if (!dealCheck) throw new Error("Registry Error: This deal has been removed from the platform.");
          if (!dealCheck.isActive) throw new Error("Operational Notice: This deal has been archived by administration and is no longer accepting new orders.");
          throw new Error(`Inventory Constraint: No more ${reviewType} slots available for this specific deal.`);
      }

      // Handle both Document and ModifyResult types
      const dealDoc = (dealUpdate as any).value || dealUpdate;

      const newOrder = new Order({
        buyer: session.user.id,
        buyerEmail: user.email,
        aspireMintId: user.aspireMintId,
        brandName,
        productCode,
        userOrderId,
        reviewName,
        amount: parsedAmount,
        reviewType,
        dealType,
        exchangeProduct,
        lessAmount: lessAmount !== undefined && lessAmount !== "" ? Number(lessAmount) : 0,
        mediator: finalMediatorId,
        assignmentType: isAutoAssign ? "AUTO" : "MANUAL",
        screenshot,
        productLink: dealDoc.productLink || "",
        status: OrderStatus.REFUND_FORM_PENDING,
        refundDetails: {
          upiId: explicitUpi || user.paymentDetails?.upiId,
          accountNumber: explicitAccount || user.paymentDetails?.accountNumber,
          ifscCode: explicitIfsc || user.paymentDetails?.ifscCode,
          bankName: explicitBank || user.paymentDetails?.bankName,
          accountHolderName: explicitHolder || user.paymentDetails?.accountHolder,
          ...(explicitUpi && { submittedAt: new Date() })
        },
        userRemarks: dealDoc.userRemarks || "",
        mediatorRemarks: dealDoc.mediatorRemarks || "",
        // --- CALCULATION OF PROFIT & COMMISSION ---
        mediatorCommission: (() => {
           const medName = assignedMediator.name?.toLowerCase() || "";
           const isJuhi = medName.includes("juhi");
           const originalRate = dealDoc.originalCommission || 0;
           let profit = 0;

           if (isJuhi) {
              const juhiRate = dealDoc.juhiCommission || 0;
              return Math.abs(juhiRate);
           } else {
              const mediatorRate = (() => {
                 const config = dealDoc.assignedMediators?.find((m: any) => m.mediatorId?.toString() === finalMediatorId.toString());
                 if (config) return config.commission;
                 return dealDoc.commission || 0;
              })();
              
              const userLess = Number(lessAmount || 0);
              // Ensure profit is the absolute difference between user input and mediator rate
              profit = Math.abs(Math.abs(userLess) - Math.abs(mediatorRate));
           }
           return profit;
        })(),
        adminProfit: (() => {
            const originalRate = dealDoc.originalCommission || 0;
            const medName = assignedMediator.name?.toLowerCase() || "";
            const isJuhi = medName.includes("juhi");
            
            const mediatorRate = isJuhi 
               ? (dealDoc.juhiCommission || 0)
               : (() => {
                  const config = dealDoc.assignedMediators?.find((m: any) => m.mediatorId?.toString() === finalMediatorId.toString());
                  return config ? config.commission : (dealDoc.commission || 0);
               })();

            // SUM ONLY if originalRate is positive and mediatorRate is negative
            if (originalRate > 0 && mediatorRate < 0) {
               return Math.abs(originalRate) + Math.abs(mediatorRate);
            } else {
               return Math.abs(Math.abs(originalRate) - Math.abs(mediatorRate));
            }
        })(),
        activities: [{
          action: "ORDER_CREATED",
          message: "Order form filled and deal initialized.",
          performedBy: session.user.id,
          performedByName: user.name,
          timestamp: new Date()
        }]
      });

      await newOrder.save({ session: mongoSession });
      await mongoSession.commitTransaction();

      // Run all external post-transaction tasks concurrently to speed up API response
      const externalTasks = [];

      // 1. Google Sheets Push
      externalTasks.push(
        import('@/utils/googleSheets').then(({ pushToGoogleSheet }) => 
          pushToGoogleSheet("ORDER", {
            "Brand Name": brandName,
            "Product Code": productCode,
            "Order Id": userOrderId || "",
            "Reviewer Name": reviewName || "",
            "Mobile Number": user.mobile || "",
            "order Amount": amount,
            "order ss": screenshot || "",
            "Mediator Name": assignedMediator?.name || "Unassigned",
          })
        ).catch(err => console.error("Google sheets push error:", err))
      );

      // 2. Notifications
      externalTasks.push(
        NotificationService.create({
          recipient: finalMediatorId,
          type: NotificationType.NEW_ORDER_ASSIGNED,
          title: "New Order Assigned",
          message: `${user.name} has submitted a new order (${brandName}) and assigned it to you.`,
          metadata: { orderId: newOrder._id },
          actionUrl: `/app/orders/${newOrder._id}`,
          mediaUrl: dealDoc.productImage || undefined
        }).catch(err => console.error("Failed to notify mediator:", err))
      );

      // 3. Email
      const orderDataForEmail = {
        ...newOrder.toObject(),
        mediatorName: assignedMediator?.name || "System Specialist"
      };
      externalTasks.push(
        sendOrderCreationEmail(user.email, user.name, orderDataForEmail, dealDoc.productImage)
          .catch(err => console.error("Order Creation Email Error:", err))
      );

      // 4. Cache Invalidation
      externalTasks.push(
        invalidateDealsCache().catch(err => console.error("Cache invalidation error:", err))
      );

      // 5. Pusher Events
      externalTasks.push(
        import("@/lib/pusher").then(({ triggerRealtimeEvent }) => {
          return Promise.all([
            triggerRealtimeEvent("public-deals", "inventory-updated", {
              productCode: newOrder.productCode,
              remainingSlots: (dealDoc.remainingSlots || 0)
            }),
            triggerRealtimeEvent("private-admin", "order-created", newOrder)
          ]);
        }).catch(err => console.warn("Pusher events bypassed:", err))
      );

      // Await all background tasks concurrently
      await Promise.allSettled(externalTasks);

      return NextResponse.json({ 
        success: true, 
        message: 'Order created! Please fill the refund form to proceed.',
        data: newOrder 
      });
    } catch (transactionError: any) {
      if (mongoSession.inTransaction()) {
        await mongoSession.abortTransaction();
      }
      return NextResponse.json({ success: false, message: transactionError.message || 'Operation failed' }, { status: 400 });
    } finally {
      mongoSession.endSession();
    }
  } catch (error) {
    console.error('Order Creation error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = (session.user as any).role || "USER";
    
    await connectToDatabase();

    const mediatorId = searchParams.get("mediatorId");
    const buyerId = searchParams.get("buyerId");
    const aspireOrderId = searchParams.get("aspireOrderId");
    
    let query: any = {};
    if (role === "USER") {
      query.buyer = session.user.id;
    } else if (role === "MEDIATOR") {
      query.mediator = session.user.id;
    }

    const trackId = aspireOrderId?.trim();
    if (trackId) {
      query.$or = [
        { aspireOrderId: trackId },
        { userOrderId: trackId },
        { userOrderId: { $regex: trackId, $options: 'i' } }
      ];
    } else if (role === "ADMIN") {
      if (mediatorId) {
        query.mediator = mediatorId;
      } else if (buyerId) {
        query.buyer = buyerId;
      }
    }

    const rawOrders = await Order.find(query)
      .populate("buyer", "name email mobile")
      .populate("mediator", "name systemDisplayName email")
      .populate("paymentDetails.paidBy", "name")
      .select("-activities -internalNotes")
      .sort({ createdAt: -1 })
      .lean();

    // Patch orders with productLink from ActiveDeal in a single optimized batch query (Resolves N+1 problem)
    const { ActiveDeal } = await import('@/modules/brand/deal.model');
    const productCodes = rawOrders.map(o => o.productCode).filter(Boolean);
    
    const deals = await ActiveDeal.find({ productCode: { $in: productCodes } })
      .select("productCode productLink")
      .lean();
      
    const dealMap = new Map(deals.map(d => [d.productCode, d.productLink]));

    const orders = rawOrders.map((order: any) => {
      if (!order.productLink || order.productLink === "") {
        order.productLink = dealMap.get(order.productCode) || "";
      }
      return order;
    });

    return NextResponse.json({ 
      success: true, 
      data: orders 
    });
  } catch (error) {
    console.error('Orders Fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
