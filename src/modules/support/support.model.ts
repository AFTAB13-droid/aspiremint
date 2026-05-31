import mongoose, { Schema, Document, Model } from 'mongoose';

export enum TicketStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum TicketType {
  ORDER_DISPUTE = 'ORDER_DISPUTE',
  GENERAL_QUERY = 'GENERAL_QUERY'
}

export interface ISupportMessage {
  sender: mongoose.Types.ObjectId | string;
  senderRole: 'USER' | 'MEDIATOR' | 'ADMIN' | 'SUBADMIN';
  senderName?: string;
  text: string;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  user: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  mediator?: mongoose.Types.ObjectId;
  type: TicketType;
  subject: string;
  query: string;
  screenshot?: string;
  status: TicketStatus;
  messages: ISupportMessage[];
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: false },
    mediator: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    type: { 
      type: String, 
      enum: Object.values(TicketType), 
      default: TicketType.ORDER_DISPUTE 
    },
    subject: { type: String, required: true },
    query: { type: String, required: true },
    screenshot: { type: String },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN
    },
    messages: [
      {
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        senderRole: { type: String, enum: ['USER', 'MEDIATOR', 'ADMIN', 'SUBADMIN'], required: true },
        senderName: { type: String },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

// Prevent OverwriteModelError
if (process.env.NODE_ENV === "development") {
  delete mongoose.models.SupportTicket;
}

export const SupportTicket: Model<ISupportTicket> =
  mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
