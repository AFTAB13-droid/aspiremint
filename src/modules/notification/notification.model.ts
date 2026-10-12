import mongoose, { Document, Model, Schema } from "mongoose";

export enum NotificationType {
  ORDER_INVALIDATED = "ORDER_INVALIDATED",
  ORDER_APPROVED = "ORDER_APPROVED",
  ORDER_REJECTED = "ORDER_REJECTED",
  ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED",
  REFUND_COMPLETED = "REFUND_COMPLETED",
  NEW_ORDER_ASSIGNED = "NEW_ORDER_ASSIGNED",
  BROADCAST_MESSAGE = "BROADCAST_MESSAGE",
  ADMIN_ALERT = "ADMIN_ALERT",
  SYSTEM = "SYSTEM",
  SUPPORT_TICKET_CREATED = "SUPPORT_TICKET_CREATED",
  SUPPORT_TICKET_REPLY = "SUPPORT_TICKET_REPLY",
  SUPPORT_TICKET_RESOLVED = "SUPPORT_TICKET_RESOLVED",
  DEAL_RESTOCKED = "DEAL_RESTOCKED",
}

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: any;
  actionUrl?: string;
  mediaUrl?: string;
  isRead: boolean;
  isToastShown: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    actionUrl: { type: String },
    mediaUrl: { type: String },
    isRead: { type: Boolean, default: false },
    isToastShown: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Optimize database queries for user feeds
NotificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification: Model<INotification> = 
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
