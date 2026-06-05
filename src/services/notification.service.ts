import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import { Notification, NotificationType, INotification } from "@/modules/notification/notification.model";

export class NotificationService {
  /**
   * Create a single notification
   */
  static async create(data: {
    recipient: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: any;
    actionUrl?: string;
    mediaUrl?: string;
  }) {
    await connectToDatabase();
    const notification = await Notification.create(data);

    // Trigger real-time Pusher event (fail-safe)
    try {
      const { triggerRealtimeEvent } = await import("@/lib/pusher");
      await triggerRealtimeEvent(
        `private-user-${data.recipient}`,
        "notification-created",
        notification
      );
    } catch (err) {
      console.warn("Pusher notification trigger bypassed gracefully:", err);
    }

    // Dispatch FCM Push Notification in the background (fail-safe)
    try {
      const { sendPushNotification } = await import("@/utils/fcm");
      sendPushNotification(data.recipient, {
        title: data.title,
        body: data.message,
        data: {
          click_action: data.actionUrl || "/dashboard",
          type: data.type,
        },
      }).catch((e) => console.error("FCM single send error in NotificationService:", e));
    } catch (fcmErr) {
      console.warn("FCM dynamic load failed in NotificationService:", fcmErr);
    }

    return notification;
  }

  /**
   * Create notifications for multiple recipients (e.g., Broadcasts)
   */
  static async createBulk(data: {
    recipients: string[];
    type: NotificationType;
    title: string;
    message: string;
    metadata?: any;
    actionUrl?: string;
    mediaUrl?: string;
  }) {
    await connectToDatabase();
    const payload = data.recipients.map(recipient => ({
      recipient,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
      actionUrl: data.actionUrl,
      mediaUrl: data.mediaUrl,
    }));
    
    const notifications = await Notification.insertMany(payload);

    // Trigger real-time Pusher event (fail-safe)
    try {
      const { triggerRealtimeEvent } = await import("@/lib/pusher");
      
      // If it is a platform-wide broadcast, emit a single event on public-broadcasts to save Pusher limits
      if (data.type === NotificationType.BROADCAST_MESSAGE) {
        await triggerRealtimeEvent(
          "public-broadcasts",
          "broadcast-created",
          {
            title: data.title,
            message: data.message,
            actionUrl: data.actionUrl,
            mediaUrl: data.mediaUrl,
            createdAt: new Date(),
          }
        );
      } else {
        // Otherwise emit individual notifications
        notifications.forEach(notif => {
          triggerRealtimeEvent(
            `private-user-${notif.recipient.toString()}`,
            "notification-created",
            notif
          );
        });
      }
    } catch (err) {
      console.warn("Pusher bulk notification trigger bypassed gracefully:", err);
    }

    // Dispatch FCM Bulk Push Notification (awaiting to prevent Vercel termination)
    try {
      const { sendPushNotificationToMultiple } = await import("@/utils/fcm");
      await sendPushNotificationToMultiple(data.recipients, {
        title: data.title,
        body: data.message,
        data: {
          click_action: data.actionUrl || "/dashboard",
          type: data.type,
        },
      });
    } catch (fcmErr) {
      console.warn("FCM dynamic load failed in NotificationService:", fcmErr);
    }

    return notifications;
  }

  /**
   * Get unread notifications count for a user
   */
  static async getUnreadCount(userId: string) {
    await connectToDatabase();
    return await Notification.countDocuments({ recipient: userId, isRead: false });
  }

  /**
   * Get paginated notifications for a user
   */
  static async getUserNotifications(userId: string, limit = 50, skip = 0, since?: Date) {
    await connectToDatabase();
    const query: any = { recipient: userId };
    if (since) {
      query.createdAt = { $gt: since };
    }
    return await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    await connectToDatabase();
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    await connectToDatabase();
    return await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    await connectToDatabase();
    return await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAll(userId: string) {
    await connectToDatabase();
    return await Notification.deleteMany({ recipient: userId });
  }

  /**
   * Get notifications that haven't been toasted yet
   */
  static async getPendingToasts(userId: string) {
    await connectToDatabase();
    return await Notification.find({ 
      recipient: userId, 
      isToastShown: false,
      isRead: false 
    }).sort({ createdAt: -1 }).limit(5).lean();
  }

  /**
   * Mark multiple notifications as toasted
   */
  static async markToasted(notificationIds: string[], userId: string) {
    await connectToDatabase();
    return await Notification.updateMany(
      { _id: { $in: notificationIds }, recipient: userId },
      { isToastShown: true }
    );
  }
}
