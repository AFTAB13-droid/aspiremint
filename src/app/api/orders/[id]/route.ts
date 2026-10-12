import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Order, OrderStatus } from '@/modules/order/order.model';
import { User } from '@/modules/user/user.model';
import { Wallet } from '@/modules/wallet/wallet.model';
import { Transaction, TransactionType, TransactionCategory } from '@/modules/wallet/transaction.model';
import { Notification, NotificationType } from '@/modules/notification/notification.model';
import { NotificationService } from '@/services/notification.service';
import { Brand } from '@/modules/brand/brand.model';
import { ActiveDeal } from '@/modules/brand/deal.model';
import connectToDatabase from '@/lib/db';
import { invalidateDealsCache } from '@/lib/redis';
import { sendOrderStatusEmail, sendOrderPaymentEmail, sendRefundSubmittedEmail } from '@/services/emailService';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch order with populated user details
    const order = await Order.findById(params.id)
      .populate("buyer", "name email mobile aspireMintId")
      .populate("mediator", "name systemDisplayName email mobile aspireMintId paymentDetails")
      .populate("paymentDetails.paidBy", "name email aspireMintId");

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Order Details GE error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, adminNote, mediatorNote, transactionId, paymentScreenshot, refundDetails, mediatorId, cancellationReason } = body;
    const role = (session.user as any).role;

    await connectToDatabase();
    const mongoose = (await import('mongoose')).default;
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      const order = await Order.findById(params.id).populate("buyer", "name email").populate("mediator", "name systemDisplayName").session(mongoSession);
      if (!order) throw new Error('Order not found');

      // 1. State Guard Verification
      if (order.status === OrderStatus.CANCELLED) {
        throw new Error('Crucial: Cancelled orders cannot be modified.');
      }
      if (status === order.status && !mediatorId && !adminNote && !mediatorNote && !refundDetails) {
        // No actual change requested
        await mongoSession.abortTransaction();
        return NextResponse.json({ success: true, message: 'No changes required' });
      }

      let updatePayload: any = {};

      if (role === "ADMIN" || role === "SUBADMIN") {
        if (status) updatePayload.status = status;
        if (adminNote) updatePayload.adminNote = adminNote;
        if (refundDetails) updatePayload.refundDetails = refundDetails;
        if (body["refundDetails.rejectionNote"]) {
           updatePayload["refundDetails.rejectionNote"] = body["refundDetails.rejectionNote"];
        }
        
        if (status === OrderStatus.REFUND_APPROVED || status === OrderStatus.APPROVED) {
           updatePayload["refundDetails.authorizedAt"] = new Date();
        } else if (status === OrderStatus.REFUND_REJECTED) {
           updatePayload["refundDetails.rejectedAt"] = new Date();
        }

        // --- NEW INVALIDATION WORKFLOW (HARD DELETE) ---
        if (status === OrderStatus.INVALIDATED) {
           const reason = body["refundDetails.rejectionNote"] || "No reason specified";
           
           // 1. Restore Stock registry
           const brandUpdate = await Brand.findOneAndUpdate(
             { name: order.brandName, "productCodes.code": order.productCode },
             { $inc: { "productCodes.$.stock": 1 } },
             { session: mongoSession, new: true }
           );
           
           if (!brandUpdate) throw new Error("Registry Error: Failed to restore brand inventory");

           // 2. Transmit Notification to User
           await Notification.create([{
              recipient: order.buyer,
              type: NotificationType.ORDER_INVALIDATED,
              title: "Order Invalidation Notice",
              message: `Your order for ${order.brandName} (${order.productCode}) has been invalidated by administration. Reason: ${reason}`,
              metadata: { orderId: order.aspireOrderId, brand: order.brandName }
           }], { session: mongoSession });

           // 3. Hard Delete from Ledger
           await Order.findByIdAndDelete(order._id).session(mongoSession);
           
           await mongoSession.commitTransaction();
           mongoSession.endSession();

           return NextResponse.json({ 
              success: true, 
              message: 'Order invalidated and purged from system. Stock restored.',
              data: { status: 'DELETED' }
           });
        }
        // ----------------------------------------------

        if (mediatorId) {
          updatePayload.mediator = mediatorId;
          updatePayload.assignmentType = "MANUAL";
          
          const activity = {
             action: "MEDIATOR_REASSIGNED",
             message: `Order reassigned to a new specialist.`,
             performedBy: session.user.id,
             performedByName: role === "SUBADMIN" ? `SubAdmin ${session.user.name}` : session.user.name,
             timestamp: new Date()
          };
          if (!updatePayload.$push) updatePayload.$push = {};
          updatePayload.$push.activities = activity;
        }

        if (status && status !== order.status) {
           const actorTitle = role === "SUBADMIN" ? "SubAdmin" : "admin";
           let message = `Order status updated to ${status.replace(/_/g, " ")}.`;
           const isApproved = status === OrderStatus.REFUND_APPROVED || status === OrderStatus.APPROVED;
           if (isApproved) message = `Refund request authorized by ${actorTitle}.`;
           if (status === OrderStatus.REFUND_REJECTED) message = `Refund request rejected. Reason: ${body["refundDetails.rejectionNote"] || "Not specified"}`;
           if (status === OrderStatus.COMPLETED) {
              message = `Refund processed by ${actorTitle}. Amount: ₹${order.amount}.`;
              updatePayload['paymentDetails.paidAt'] = new Date();
              updatePayload['paymentDetails.paidBy'] = session.user.id;
              updatePayload['paymentDetails.paidByName'] = role === "SUBADMIN" ? `SubAdmin ${session.user.name}` : session.user.name;
              if (transactionId) {
                 updatePayload['paymentDetails.transactionId'] = transactionId;
              }
           }
           
           const activity = {
              action: isApproved ? "REFUND_AUTHORIZED" : (status === OrderStatus.REFUND_REJECTED ? "REFUND_REJECTED" : (status === OrderStatus.COMPLETED ? "REFUND_PROCESSED" : "STATUS_UPDATED")),
              message: isApproved 
                 ? `Refund request authorized by ${actorTitle} on ${new Date().toLocaleDateString('en-GB')}.` 
                 : (status === OrderStatus.REFUND_REJECTED ? `Refund request rejected by ${actorTitle}. Reason: ${body["refundDetails.rejectionNote"] || "Not specified"}` : message),
              performedBy: session.user.id,
              performedByName: role === "SUBADMIN" ? `SubAdmin ${session.user.name}` : session.user.name,
              timestamp: new Date()
           };
           if (!updatePayload.$push) updatePayload.$push = {};
          updatePayload.$push.activities = activity;
        }
      } 
      else if (role === "MEDIATOR") {
        const orderMediatorId = order.mediator?._id?.toString() || order.mediator?.toString();
        if (orderMediatorId !== session.user.id) {
          throw new Error('Not authorized for this order');
        }
        
        if (status && [OrderStatus.ACTIVE_ESCROW, OrderStatus.COMPLETED, OrderStatus.DISPUTE_RAISED].includes(status as OrderStatus)) {
          updatePayload.status = status;
          if (status === OrderStatus.COMPLETED) {
             updatePayload['paymentDetails.paidAt'] = new Date();
             updatePayload['paymentDetails.paidBy'] = session.user.id;
             updatePayload['paymentDetails.paidByName'] = session.user.name;
             if (transactionId) {
                updatePayload['paymentDetails.transactionId'] = transactionId;
             }

             const activity = {
                action: "REFUND_PROCESSED",
                message: `Refund processed by ${session.user.name}. Amount: ₹${order.amount}.`,
                performedBy: session.user.id,
                performedByName: session.user.name,
                timestamp: new Date()
             };
             if (!updatePayload.$push) updatePayload.$push = {};
             updatePayload.$push.activities = activity;
          }
        }
        if (mediatorNote) updatePayload.mediatorNote = mediatorNote;
      }

      // --- GLOBAL EDIT AMOUNT WORKFLOW (ADMIN & MEDIATOR) ---
      if (body.newLessAmount !== undefined) {
          // Authorization Check
          const isAssignedMediator = role === "MEDIATOR" && (order.mediator?._id?.toString() || order.mediator?.toString()) === session.user.id;
          const isAdmin = role === "ADMIN" || role === "SUBADMIN";
          
          if (!isAdmin && !isAssignedMediator) {
              throw new Error("Unauthorized: Only administrators or the assigned specialist can modify financial parameters.");
          }

          if (order.status === OrderStatus.COMPLETED) {
              throw new Error("Registry Lock: Financial parameters cannot be modified for completed transactions.");
          }
          
          const newLess = Number(body.newLessAmount);
          updatePayload.lessAmount = newLess;
          
          // Update expected payout globally
          const baseAmount = order.amount || 0;
          updatePayload["refundDetails.expectedPayout"] = baseAmount + newLess;

          // Recalculate Profit & Commission using standardized protocol
          const dealDoc = await ActiveDeal.findOne({ productCode: order.productCode }).session(mongoSession);
          if (dealDoc) {
              const mediator = await (await import('@/modules/user/user.model')).User.findById(order.mediator).session(mongoSession);
              const assignedMediator = mediator || { name: "Specialist" };
              
              const medName = assignedMediator.name?.toLowerCase() || "";
              const isJuhi = medName.includes("juhi");
              const originalRate = dealDoc.originalCommission === "N/A" || dealDoc.originalCommission === undefined || dealDoc.originalCommission === null ? 0 : Number(dealDoc.originalCommission);
              
              const mediatorRate = (() => {
                 const rawComm = isJuhi 
                   ? dealDoc.juhiCommission
                   : (() => {
                      const config = dealDoc.assignedMediators?.find((m: any) => m.mediatorId?.toString() === order.mediator?.toString());
                      return config ? config.commission : dealDoc.commission;
                   })();
                 return rawComm === "N/A" || rawComm === undefined || rawComm === null ? 0 : Number(rawComm);
              })();

              // Admin Profit Recalculation
              if (originalRate > 0 && mediatorRate < 0) {
                 updatePayload.adminProfit = Math.abs(originalRate) + Math.abs(mediatorRate);
              } else {
                 updatePayload.adminProfit = Math.abs(Math.abs(originalRate) - Math.abs(mediatorRate));
              }

              // Mediator Commission Recalculation
              if (isJuhi) {
                 updatePayload.mediatorCommission = Math.abs(mediatorRate);
              } else {
                 // Standard Mediator: user input vs mediator rate
                 updatePayload.mediatorCommission = Math.abs(Math.abs(newLess) - Math.abs(mediatorRate));
              }
          }

          const activity = {
             action: "AMOUNT_UPDATED",
             message: `Specialist adjustment updated to ₹${newLess}. Refund amount synchronized to ₹${baseAmount + newLess}.`,
             performedBy: session.user.id,
             performedByName: session.user.name,
             timestamp: new Date()
          };
          if (!updatePayload.$push) updatePayload.$push = {};
          updatePayload.$push.activities = activity;
      }
      // ------------------------------------------------------

      // --- ADMIN GLOBAL ORDER EDIT WORKFLOW ---
      if ((role === "ADMIN" || role === "SUBADMIN") && body.isGlobalEdit) {
         const changes: string[] = [];
         
         if (body.userOrderId !== undefined && body.userOrderId !== order.userOrderId) {
            changes.push(`Order ID: "${order.userOrderId || 'N/A'}" ➔ "${body.userOrderId}"`);
            updatePayload.userOrderId = body.userOrderId;
         }
         if (body.reviewName !== undefined && body.reviewName !== order.reviewName) {
            changes.push(`Reviewer Name: "${order.reviewName || 'N/A'}" ➔ "${body.reviewName}"`);
            updatePayload.reviewName = body.reviewName;
         }
         if (body.amount !== undefined && Number(body.amount) !== order.amount) {
            changes.push(`Amount: ₹${order.amount || 0} ➔ ₹${body.amount}`);
            updatePayload.amount = Number(body.amount);
         }
         if (body.lessAmount !== undefined && Number(body.lessAmount) !== order.lessAmount) {
            changes.push(`Less Amount: -₹${order.lessAmount || 0} ➔ -₹${body.lessAmount}`);
            updatePayload.lessAmount = Number(body.lessAmount);
         }
         if (body.productCode !== undefined && body.productCode !== order.productCode) {
            changes.push(`Product Code: "${order.productCode || 'N/A'}" ➔ "${body.productCode}"`);
            updatePayload.productCode = body.productCode;
         }
         if (body.brandName !== undefined && body.brandName !== order.brandName) {
            changes.push(`Brand Name: "${order.brandName || 'N/A'}" ➔ "${body.brandName}"`);
            updatePayload.brandName = body.brandName;
         }

         if (changes.length > 0) {
            // Update expected payout
            const finalAmount = body.amount !== undefined ? Number(body.amount) : (order.amount || 0);
            const finalLess = body.lessAmount !== undefined ? Number(body.lessAmount) : (order.lessAmount || 0);
            updatePayload["refundDetails.expectedPayout"] = finalAmount + finalLess;

            // Recalculate Profit & Commission using active deal rates
            const finalProductCode = body.productCode !== undefined ? body.productCode : order.productCode;
            const dealDoc = await ActiveDeal.findOne({ productCode: finalProductCode }).session(mongoSession);
            if (dealDoc) {
                const mediator = await (await import('@/modules/user/user.model')).User.findById(order.mediator).session(mongoSession);
                const assignedMediator = mediator || { name: "Specialist" };
                const medName = assignedMediator.name?.toLowerCase() || "";
                const isJuhi = medName.includes("juhi");
                const originalRate = dealDoc.originalCommission === "N/A" || dealDoc.originalCommission === undefined || dealDoc.originalCommission === null ? 0 : Number(dealDoc.originalCommission);
                
                const mediatorRate = (() => {
                   const rawComm = isJuhi 
                      ? dealDoc.juhiCommission
                      : (() => {
                         const config = dealDoc.assignedMediators?.find((m: any) => m.mediatorId?.toString() === order.mediator?.toString());
                         return config ? config.commission : dealDoc.commission;
                      })();
                   return rawComm === "N/A" || rawComm === undefined || rawComm === null ? 0 : Number(rawComm);
                })();

                let calculatedAdminProfit = 0;
                if (originalRate > 0 && mediatorRate < 0) {
                   calculatedAdminProfit = Math.abs(originalRate) + Math.abs(mediatorRate);
                } else {
                   calculatedAdminProfit = Math.abs(Math.abs(originalRate) - Math.abs(mediatorRate));
                }
                updatePayload.adminProfit = calculatedAdminProfit;

                if (isJuhi) {
                   updatePayload.mediatorCommission = Math.abs(mediatorRate);
                } else {
                   updatePayload.mediatorCommission = Math.abs(Math.abs(finalLess) - Math.abs(mediatorRate));
                }
            }

            // Create notification for the buyer
            await Notification.create([{
               recipient: order.buyer,
               type: NotificationType.ORDER_STATUS_CHANGED,
               title: "Order Details Updated",
               message: `Your order details for ${order.aspireOrderId} (${updatePayload.brandName || order.brandName}) have been updated: ${changes.join("; ")}.`,
               metadata: { orderId: order.aspireOrderId, brand: updatePayload.brandName || order.brandName }
            }], { session: mongoSession });

            // Create activity item
            const activity = {
               action: "ORDER_DETAILS_EDITED",
               message: `Order details updated by administration: ${changes.join("; ")}.`,
               performedBy: session.user.id,
               performedByName: role === "SUBADMIN" ? `SubAdmin ${session.user.name}` : session.user.name,
               timestamp: new Date()
            };
            if (!updatePayload.$push) updatePayload.$push = {};
            updatePayload.$push.activities = activity;
         }
      }

      else if (role === "USER") {
        const orderBuyerId = order.buyer?._id?.toString() || order.buyer?.toString();
        if (orderBuyerId !== session.user.id) {
          throw new Error('Not authorized');
        }
        
        if (status === OrderStatus.UNDER_VERIFICATION || status === OrderStatus.REFUND_FORM_SUBMITTED) {
           const isResubmission = [OrderStatus.UNDER_VERIFICATION, OrderStatus.REFUND_FORM_SUBMITTED, OrderStatus.REFUND_REJECTED].includes(order.status as OrderStatus);
           updatePayload.status = OrderStatus.UNDER_VERIFICATION;
           const currentRefundDetails = order.refundDetails ? JSON.parse(JSON.stringify(order.refundDetails)) : {};
           const currentRefundProof = order.refundProof ? JSON.parse(JSON.stringify(order.refundProof)) : {};
           
           const isBlinkit = Boolean(
              order.marketplace?.toLowerCase().includes("blinkit") || 
              order.brandName?.toLowerCase().includes("blinkit")
           );

           if (isBlinkit && (!refundDetails?.invoiceOrderId || String(refundDetails.invoiceOrderId).trim() === "")) {
              throw new Error("Invoice Order ID is mandatory for Blinkit orders.");
           }

           const newRefundDetails = {
              ...currentRefundDetails,
              ...refundDetails,
              submittedAt: new Date()
           };
           updatePayload.refundDetails = newRefundDetails;
           if (newRefundDetails.invoiceOrderId) {
              updatePayload.invoiceOrderId = newRefundDetails.invoiceOrderId;
           }

           if (body.refundProof) {
              updatePayload.refundProof = {
                 ...currentRefundProof,
                 ...body.refundProof
              };
           }

           // --- CALCULATE MEDIATOR PROFIT (COMMISSION) ---
           try {
              const dealDoc = await ActiveDeal.findOne({ productCode: order.productCode }).session(mongoSession);
              if (dealDoc) {
                  const userLess = Number(newRefundDetails.lessAmount || order.lessAmount || 0);
                  const mediator = await (await import('@/modules/user/user.model')).User.findById(order.mediator).session(mongoSession);
                  
                  const medName = mediator?.name?.toLowerCase() || "";
                  const isJuhi = medName.includes("juhi");
                  const originalRate = dealDoc.originalCommission === "N/A" || dealDoc.originalCommission === undefined || dealDoc.originalCommission === null ? 0 : Number(dealDoc.originalCommission);
                  
                  const mediatorRate = (() => {
                     const rawComm = isJuhi 
                        ? dealDoc.juhiCommission
                        : (() => {
                         const config = dealDoc.assignedMediators?.find((m: any) => {
                            const mId = m.mediatorId?._id?.toString() || m.mediatorId?.toString();
                            const oMedId = order.mediator?._id?.toString() || order.mediator?.toString();
                            return mId === oMedId;
                         });
                         return config ? config.commission : dealDoc.commission;
                        })();
                     return rawComm === "N/A" || rawComm === undefined || rawComm === null ? 0 : Number(rawComm);
                  })();

                  // NEW UNIFIED ADMIN PROFIT LOGIC
                  let calculatedAdminProfit = 0;
                  if (originalRate > 0 && mediatorRate < 0) {
                     calculatedAdminProfit = Math.abs(originalRate) + Math.abs(mediatorRate);
                  } else {
                     calculatedAdminProfit = Math.abs(Math.abs(originalRate) - Math.abs(mediatorRate));
                  }

                  updatePayload.adminProfit = calculatedAdminProfit;

                  if (isJuhi) {
                     updatePayload.mediatorCommission = Math.abs(mediatorRate);
                  } else {
                     // STANDARD MEDIATOR LOGIC: User Form Less vs Mediator Rate
                     updatePayload.mediatorCommission = Math.abs(Math.abs(userLess) - Math.abs(mediatorRate));
                  }
              }
           } catch (err) {
              console.error("Mediator Profit Calc Error:", err);
           }
           // ----------------------------------------------

           const activity = {
              action: isResubmission ? "REFUND_FORM_RESUBMITTED" : "REFUND_FORM_SUBMITTED",
              message: order.status === OrderStatus.REFUND_REJECTED 
                 ? `User refilled refund form after admin rejected his claim.`
                 : (isResubmission 
                    ? `User resubmitted the refund form for verification.` 
                    : `User applied for refund.`),
              performedBy: session.user.id,
              performedByName: session.user.name,
              timestamp: new Date()
           };
           if (!updatePayload.$push) updatePayload.$push = {};
           updatePayload.$push.activities = activity;
        }
        
        if (status === OrderStatus.ESCROW_PAYMENT_PENDING) {
          updatePayload.status = OrderStatus.ESCROW_PAYMENT_PENDING;
          updatePayload.paymentDetails = {
            transactionId,
            paymentScreenshot,
            paidAt: new Date()
          };
        }

        if (status === OrderStatus.CANCELLED) {
          // ATOMIC STOCK RESTORATION VIA TRANSACTION
          const { Brand } = await import('@/modules/brand/brand.model');
          const brandUpdate = await Brand.findOneAndUpdate(
            { name: order.brandName, "productCodes.code": order.productCode },
            { $inc: { "productCodes.$.stock": 1 } },
            { session: mongoSession, new: true }
          );

          if (!brandUpdate) throw new Error("Critical: Failed to restore stock registry.");

          updatePayload.status = OrderStatus.CANCELLED;
          updatePayload.cancellationReason = cancellationReason;
          updatePayload.cancelledAt = new Date();
          
          // --- ZERO OUT EARNINGS ON CANCELLATION ---
          updatePayload.mediatorCommission = 0;
          updatePayload.adminProfit = 0;
          // -----------------------------------------

          const activity = {
            action: "ORDER_CANCELLED",
            message: `Order cancelled by user. Reason: ${cancellationReason || "Not specified"}`,
            performedBy: session.user.id,
            performedByName: session.user.name,
            timestamp: new Date()
          };
          if (!updatePayload.$push) updatePayload.$push = {};
          updatePayload.$push.activities = activity;
        }
      }

      // Separate $push from $set to avoid MongoDB conflicts
      const { $push, ...setFields } = updatePayload;
      
      const updatedOrder = await Order.findByIdAndUpdate(
        params.id,
        $push ? { $set: setFields, $push } : { $set: setFields },
        { session: mongoSession, new: true }
      );
      
      if (!updatedOrder) throw new Error('Failed to retrieve updated order registry.');
      
      await mongoSession.commitTransaction();

      // Push to Google Sheets (Refund Sheet)
      if (status === OrderStatus.UNDER_VERIFICATION || status === OrderStatus.REFUND_FORM_SUBMITTED) {
        try {
          const buyer = await (await import('@/modules/user/user.model')).User.findById(updatedOrder.buyer).lean();
          const { pushToGoogleSheet } = await import('@/utils/googleSheets');
          const istTimestamp = new Date().toLocaleString("en-IN", { 
            timeZone: "Asia/Kolkata",
            dateStyle: "medium", 
            timeStyle: "medium" 
          });

          await pushToGoogleSheet("REFUND", {
            "Timestamp": istTimestamp,
            "Order Id": updatedOrder.userOrderId || updatedOrder._id,
            "Mobile Number": buyer?.mobile || "",
            "Review Ss": updatedOrder.refundProof?.reviewScreenshot || "",
            "Feedback Ss": updatedOrder.refundProof?.returnPeriodScreenshot || "",
            "Refund Amount": updatedOrder.refundDetails?.expectedPayout ?? updatedOrder.amount,
          });
        } catch (err) {
          console.error("Google sheets push error:", err);
        }
      }

      // Trigger Notifications
      try {
        const dealDoc = await ActiveDeal.findOne({ productCode: updatedOrder.productCode });
        const mediaUrl = dealDoc?.productImage || undefined;

        if (status === OrderStatus.REFUND_APPROVED || status === OrderStatus.APPROVED) {
          const actorName = role === "SUBADMIN" ? `SubAdmin ${session.user.name}` : "Admin";
          
          await NotificationService.create({
            recipient: updatedOrder.buyer.toString(),
            type: NotificationType.ORDER_APPROVED,
            title: "Refund Approved",
            message: `Your refund request has been authorized by ${actorName}. It will be processed soon.`,
            metadata: { orderId: updatedOrder._id },
            actionUrl: `/app/orders/${updatedOrder._id}`,
            mediaUrl
          });
          
          if (updatedOrder.mediator) {
            await NotificationService.create({
              recipient: updatedOrder.mediator.toString(),
              type: NotificationType.ORDER_STATUS_CHANGED,
              title: "Order Approved",
              message: `An order assigned to you (${updatedOrder.brandName}) was approved by ${actorName}.`,
              metadata: { orderId: updatedOrder._id },
              actionUrl: `/app/orders/${updatedOrder._id}`,
              mediaUrl
            });
          }
        }

        if (status === OrderStatus.REFUND_REJECTED) {
          await NotificationService.create({
            recipient: updatedOrder.buyer.toString(),
            type: NotificationType.ORDER_REJECTED,
            title: "Refund Rejected",
            message: `Your refund request for ${updatedOrder.brandName} was rejected. Reason: ${body["refundDetails.rejectionNote"] || "Not specified"}`,
            metadata: { orderId: updatedOrder._id },
            actionUrl: `/app/orders/${updatedOrder._id}`,
            mediaUrl
          });
        }
 
      // --- EMAIL NOTIFICATIONS & DEPENDENCIES ---
      const buyer: any = order.buyer;
      const mediator: any = order.mediator;
      const recipientEmail = buyer?.email || order.buyerEmail || updatedOrder.buyerEmail;
      const recipientName = buyer?.name || order.reviewName || updatedOrder.reviewName || "Customer";

      if (status === OrderStatus.COMPLETED) {
          const payerName = role === "MEDIATOR" 
             ? (mediator?.systemDisplayName || mediator?.name || session.user.name)
             : (role === "SUBADMIN" ? `SubAdmin ${session.user.name}` : (session.user.name || "Admin"));
          const refundAmt = updatedOrder.refundDetails?.expectedPayout || updatedOrder.amount;

          await NotificationService.create({
            recipient: (updatedOrder.buyer as any)?._id?.toString() || updatedOrder.buyer?.toString(),
            type: NotificationType.REFUND_COMPLETED,
            title: "Refund Paid",
            message: `Your refund of ₹${refundAmt} has been successfully paid by ${payerName}.`,
            metadata: { orderId: updatedOrder._id },
            actionUrl: `/app/orders/${updatedOrder._id}`,
            mediaUrl
          });
        }

      if (status === OrderStatus.UNDER_VERIFICATION || status === OrderStatus.REFUND_FORM_SUBMITTED) {
         if (recipientEmail) {
           try {
              await sendRefundSubmittedEmail(recipientEmail, recipientName, updatedOrder);
           } catch (mailErr) {
              console.error("Refund Submitted Email Error:", mailErr);
           }
         }
      }
      
      if (status === OrderStatus.REFUND_APPROVED || status === OrderStatus.APPROVED || status === OrderStatus.REFUND_REJECTED) {
         if (recipientEmail) {
           try {
              await sendOrderStatusEmail(
                recipientEmail, 
                recipientName, 
                updatedOrder.userOrderId || order.userOrderId || order.aspireOrderId, 
                status, 
                updatedOrder.refundDetails?.expectedPayout || order.amount, 
                status === OrderStatus.REFUND_REJECTED ? (body["refundDetails.rejectionNote"] || "Verification failed") : undefined
              );
           } catch (mailErr) {
              console.error("Status Update Email Error:", mailErr);
           }
         }
      }

      if (status === OrderStatus.COMPLETED) {
         const payerName = role === "MEDIATOR" 
            ? (mediator?.systemDisplayName || mediator?.name || session.user.name)
            : (role === "SUBADMIN" ? `SubAdmin ${session.user.name}` : (session.user.name || "Admin Desk"));
         const refundAmt = updatedOrder.refundDetails?.expectedPayout || updatedOrder.amount;

         if (recipientEmail) {
            try {
               await sendOrderPaymentEmail(
                  recipientEmail,
                  recipientName,
                  updatedOrder.userOrderId || order.userOrderId || order.aspireOrderId,
                  {
                     userOrderId: updatedOrder.userOrderId || order.userOrderId,
                     transactionId: updatedOrder.paymentDetails?.transactionId,
                     paidAmount: refundAmt,
                     paidAt: updatedOrder.paymentDetails?.paidAt || new Date(),
                     paidByName: payerName,
                     brandName: updatedOrder.brandName || order.brandName,
                     productCode: updatedOrder.productCode || order.productCode
                  }
               );
            } catch (mailErr) {
               console.error("Payment Receipt Email Error:", mailErr);
            }
         }
      }

      } catch (err) {
        console.error("Failed to send order update notifications:", err);
      }

      if (status === OrderStatus.CANCELLED) {
        await invalidateDealsCache();
      }

      // Trigger real-time Pusher events (fail-safe)
      try {
        const { triggerRealtimeEvent } = await import("@/lib/pusher");
        
        // 1. Notify buyer private channel
        if (updatedOrder.buyer) {
          triggerRealtimeEvent(
            `private-user-${updatedOrder.buyer.toString()}`,
            "order-updated",
            updatedOrder
          );
        }
        
        // 2. Notify mediator private channel
        if (updatedOrder.mediator) {
          triggerRealtimeEvent(
            `private-user-${updatedOrder.mediator.toString()}`,
            "order-updated",
            updatedOrder
          );
        }
        
        // 3. Notify admin channel
        triggerRealtimeEvent("private-admin", "order-updated", updatedOrder);
      } catch (err) {
        console.warn("Pusher order update event bypassed gracefully:", err);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Order updated successfully',
        data: updatedOrder 
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
    console.error('Order Update error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    
    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (order.status !== OrderStatus.CANCELLED) {
      return NextResponse.json({ 
        success: false, 
        message: 'Only cancelled orders can be permanently deleted' 
      }, { status: 400 });
    }

    await Order.findByIdAndDelete(params.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Order permanently deleted from system' 
    });
  } catch (error) {
    console.error('Order Deletion error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
