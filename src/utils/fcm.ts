import connectToDatabase from '@/lib/db';
import { User } from '@/modules/user/user.model';
import { messaging } from '@/lib/firebaseAdmin';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send FCM push notification to a specific user's registered devices
 */
export async function sendPushNotification(userId: string, payload: PushPayload) {
  try {
    // Delegate to the multiple function to ensure consistent robust behavior
    // and take advantage of the same error handling and token cleanup.
    await sendPushNotificationToMultiple([userId], payload);
  } catch (err) {
    console.error("FCM Send Push Notification error:", err);
  }
}

/**
 * Send FCM push notification to multiple user IDs efficiently
 */
export async function sendPushNotificationToMultiple(userIds: string[], payload: PushPayload) {
  try {
    await connectToDatabase();
    const users = await User.find({ _id: { $in: userIds } }).select('fcmTokens');
    
    let activeMessaging: any;
    try {
      activeMessaging = messaging();
    } catch (e) {
      return;
    }

    if (!activeMessaging) return;

    // Collect all valid tokens
    const allTokens: string[] = [];
    users.forEach(user => {
      if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
        allTokens.push(...user.fcmTokens);
      }
    });

    if (allTokens.length === 0) return;

    // Firebase sendMulticast can process 500 tokens at a time
    const batchSize = 500;
    const invalidTokens: string[] = [];

    for (let i = 0; i < allTokens.length; i += batchSize) {
      const tokensBatch = allTokens.slice(i, i + batchSize);
      
      const message = {
        tokens: tokensBatch,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        android: {
          priority: 'high',
        },
        webpush: {
          headers: {
            Urgency: 'high'
          },
          notification: {
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            click_action: payload.data?.click_action || '/dashboard',
          }
        }
      };

      try {
        let response;
        if (typeof activeMessaging.sendEachForMulticast === 'function') {
           response = await activeMessaging.sendEachForMulticast(message);
        } else {
           response = await activeMessaging.sendMulticast(message);
        }
        
        if (response.failureCount > 0) {
          response.responses.forEach((resp: any, idx: number) => {
            if (!resp.success) {
              const errCode = resp.error?.code;
              if (
                errCode === 'messaging/invalid-registration-token' ||
                errCode === 'messaging/registration-token-not-registered' ||
                resp.error?.message?.includes('unregistered') ||
                resp.error?.message?.includes('invalid')
              ) {
                invalidTokens.push(tokensBatch[idx]);
              }
            }
          });
        }
      } catch (err) {
        console.error("FCM Multicast sending error:", err);
      }
    }

    // Clean invalid tokens across all users efficiently
    if (invalidTokens.length > 0) {
      await User.updateMany(
        { fcmTokens: { $in: invalidTokens } },
        { $pull: { fcmTokens: { $in: invalidTokens } } as any }
      );
    }
  } catch (err) {
    console.error("FCM Send Push Notification to Multiple error:", err);
  }
}

/**
 * Broadcast FCM push notification to all users with active tokens (e.g., brand adverts)
 */
export async function sendBroadcastPushNotification(payload: PushPayload) {
  try {
    await connectToDatabase();
    const users = await User.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } }).select('_id');
    const userIds = users.map(u => u._id.toString());
    if (userIds.length > 0) {
      await sendPushNotificationToMultiple(userIds, payload);
    }
  } catch (err) {
    console.error("FCM Broadcast Push Notification error:", err);
  }
}
