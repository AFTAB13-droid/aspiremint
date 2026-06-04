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
    await connectToDatabase();
    const user = await User.findById(userId).select('fcmTokens');
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return;
    }

    let activeMessaging;
    try {
      activeMessaging = messaging();
    } catch (e) {
      // Graceful fallback if Firebase Admin is not initialized
      return;
    }

    if (!activeMessaging) return;

    const invalidTokens: string[] = [];
    const tokens = user.fcmTokens;

    const sendPromises = tokens.map(async (token) => {
      try {
        await activeMessaging.send({
          token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data || {},
          webpush: {
            notification: {
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              click_action: payload.data?.click_action || '/dashboard',
            }
          }
        });
      } catch (err: any) {
        console.error(`FCM token sending error (${token}):`, err.message);
        // Identify expired or invalid registration tokens to prune from DB
        if (
          err.code === 'messaging/invalid-registration-token' ||
          err.code === 'messaging/registration-token-not-registered' ||
          err.message?.includes('unregistered') ||
          err.message?.includes('invalid')
        ) {
          invalidTokens.push(token);
        }
      }
    });

    await Promise.all(sendPromises);

    // Prune invalid tokens to keep database clean
    if (invalidTokens.length > 0) {
      await User.updateOne(
        { _id: userId },
        { $pull: { fcmTokens: { $in: invalidTokens } } }
      );
    }
  } catch (err) {
    console.error("FCM Send Push Notification error:", err);
  }
}

/**
 * Send FCM push notification to multiple user IDs
 */
export async function sendPushNotificationToMultiple(userIds: string[], payload: PushPayload) {
  try {
    await connectToDatabase();
    const users = await User.find({ _id: { $in: userIds } }).select('fcmTokens');
    
    let activeMessaging;
    try {
      activeMessaging = messaging();
    } catch (e) {
      return;
    }

    if (!activeMessaging) return;

    const sendPromises = users.map(async (user) => {
      if (!user.fcmTokens || user.fcmTokens.length === 0) return;
      const invalidTokens: string[] = [];

      const tokenPromises = user.fcmTokens.map(async (token) => {
        try {
          await activeMessaging.send({
            token,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: payload.data || {},
            webpush: {
              notification: {
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                click_action: payload.data?.click_action || '/dashboard',
              }
            }
          });
        } catch (err: any) {
          console.error(`FCM token sending error (${token}) for user ${user._id}:`, err.message);
          if (
            err.code === 'messaging/invalid-registration-token' ||
            err.code === 'messaging/registration-token-not-registered' ||
            err.message?.includes('unregistered') ||
            err.message?.includes('invalid')
          ) {
            invalidTokens.push(token);
          }
        }
      });

      await Promise.all(tokenPromises);

      // Clean invalid tokens for this user
      if (invalidTokens.length > 0) {
        await User.updateOne(
          { _id: user._id },
          { $pull: { fcmTokens: { $in: invalidTokens } } }
        );
      }
    });

    await Promise.all(sendPromises);
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
