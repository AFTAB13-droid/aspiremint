import connectToDatabase from "@/lib/db";
import { ActiveDeal } from "@/modules/brand/deal.model";
import { NotificationType } from "@/modules/notification/notification.model";
import { NotificationService } from "@/services/notification.service";

/**
 * Dispatches both in-app and web push notifications (FCM) to all users
 * who subscribed to be notified when this deal is back in stock / live again.
 */
export async function notifyDealSubscribers(dealIdOrDoc: any) {
  try {
    await connectToDatabase();
    let deal = dealIdOrDoc;
    if (!deal || !deal.notifySubscribers) {
      deal = await ActiveDeal.findById(dealIdOrDoc);
    }
    if (!deal) return;

    const subscribers = deal.notifySubscribers || [];
    if (!Array.isArray(subscribers) || subscribers.length === 0) return;

    const subscriberIds = subscribers
      .map((s: any) => (s?._id ? s._id.toString() : s?.toString()))
      .filter(Boolean);

    if (subscriberIds.length === 0) return;

    // Dispatch bulk notification
    // Automatically creates DB records, triggers real-time Pusher events, and dispatches FCM mobile/web push
    await NotificationService.createBulk({
      recipients: subscriberIds,
      type: NotificationType.DEAL_RESTOCKED,
      title: `⚡ Back in Stock: ${deal.brandName} (${deal.productCode})!`,
      message: `Great news! "${deal.productDetails || deal.brandName}" is now live again with fresh stock. Claim yours before slots run out! 🔥📦`,
      actionUrl: `/app/activedeals/${deal.productCode || deal._id}`,
      mediaUrl: deal.productImage || undefined,
      metadata: {
        dealId: deal._id.toString(),
        productCode: deal.productCode,
        brandName: deal.brandName,
      },
    });

    // Clear subscribers array atomically so we don't spam users in future updates
    await ActiveDeal.findByIdAndUpdate(deal._id, {
      $set: { notifySubscribers: [] },
    });

    console.log(`[DealNotification] Successfully notified ${subscriberIds.length} subscribers for deal ${deal.productCode}`);
  } catch (error) {
    console.error("[DealNotification] Error notifying subscribers:", error);
  }
}
