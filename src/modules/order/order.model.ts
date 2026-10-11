import mongoose, { Document, Model, Schema } from "mongoose";

export enum OrderStatus {
  REFUND_FORM_PENDING = "REFUND_FORM_PENDING",
  UNDER_VERIFICATION = "UNDER_VERIFICATION",
  REFUND_APPROVED = "REFUND_APPROVED",
  REFUND_REJECTED = "REFUND_REJECTED",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  ESCROW_PAYMENT_PENDING = "ESCROW_PAYMENT_PENDING",
  ACTIVE_ESCROW = "ACTIVE_ESCROW",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DISPUTE_RAISED = "DISPUTE_RAISED",
  REFUND_FORM_SUBMITTED = "REFUND_FORM_SUBMITTED",
  REFUND_PROCESSING = "REFUND_PROCESSING",
  REFUNDED = "REFUNDED",
  INVALIDATED = "INVALIDATED",
}

export interface IOrder extends Document {
  aspireOrderId: string; // Internal Reference
  userOrderId: string;   // User provided Order ID
  buyer: mongoose.Types.ObjectId;
  buyerEmail: string;
  aspireMintId: string;
  brandName: string;
  marketplace?: string;
  productCode: string;
  reviewName: string;
  amount: number;
  reviewType: string; // New: Review, Rating, Order
  dealType: string;   // Original, Empty Box, Exchange
  exchangeProduct?: {
    name: string;
    image: string;
  }; // Updated: Rich object for Exchange Details
  lessAmount: number;
  mediator: mongoose.Types.ObjectId;
  assignmentType: "AUTO" | "MANUAL";
  screenshot?: string;
  status: OrderStatus;
  refundDetails?: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    accountHolderName?: string;
    expectedPayout?: number;
    invoiceOrderId?: string;
    rejectionNote?: string;
    submittedAt?: Date;
    authorizedAt?: Date;
    rejectedAt?: Date;
  };
  invoiceOrderId?: string;
  refundReminderSent?: boolean;
  refundReminderSentAt?: Date;
  refundReminder15Sent?: boolean;
  refundReminder15SentAt?: Date;
  refundReminder20Sent?: boolean;
  refundReminder20SentAt?: Date;
  refundReminder25Sent?: boolean;
  refundReminder25SentAt?: Date;
  refundProof?: {
    reviewLink?: string;
    reviewScreenshot?: string;
    returnPeriodScreenshot?: string;
    deliveryScreenshot?: string;
  };
  paymentDetails?: {
    transactionId?: string;
    paymentScreenshot?: string;
    paidAt?: Date;
    paidBy?: mongoose.Types.ObjectId;
    paidByName?: string;
  };
  adminNote?: string;
  mediatorNote?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  userRemarks?: string;
  mediatorRemarks?: string;
  activities: {
    action: string;
    message: string;
    performedBy: mongoose.Types.ObjectId;
    performedByName: string;
    timestamp: Date;
  }[];
  internalNotes: {
    content: string;
    authorName: string;
    authorRole: string;
    createdAt: Date;
  }[];
  lastViewedNotes?: {
    userId: string;
    viewedAt: Date;
  }[];
  mediatorCommission?: number;
  adminProfit?: number; // Calculated profit for administration
  productLink?: string; // New: Product link from deal
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    aspireOrderId: { type: String, required: true, unique: true },
    userOrderId: { type: String },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyerEmail: { type: String, required: true },
    aspireMintId: { type: String, required: true },
    brandName: { type: String },
    marketplace: { type: String },
    productCode: { type: String },
    reviewName: { type: String },
    amount: { type: Number, required: true },
    reviewType: { type: String },
    dealType: { type: String },
    exchangeProduct: {
      name: { type: String },
      image: { type: String }
    }, // Updated: Rich object
    lessAmount: { type: Number, default: 0 },
    mediatorCommission: { type: Number, default: 0 },
    adminProfit: { type: Number, default: 0 },
    mediator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignmentType: { type: String, enum: ["AUTO", "MANUAL"], default: "MANUAL" },
    screenshot: { type: String },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.REFUND_FORM_PENDING,
    },
    invoiceOrderId: { type: String },
    refundReminderSent: { type: Boolean, default: false },
    refundReminderSentAt: { type: Date },
    refundReminder15Sent: { type: Boolean, default: false },
    refundReminder15SentAt: { type: Date },
    refundReminder20Sent: { type: Boolean, default: false },
    refundReminder20SentAt: { type: Date },
    refundReminder25Sent: { type: Boolean, default: false },
    refundReminder25SentAt: { type: Date },
    refundDetails: {
      upiId: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolderName: String,
      expectedPayout: Number,
      invoiceOrderId: String,
      rejectionNote: String,
      submittedAt: Date,
      authorizedAt: Date,
      rejectedAt: Date,
    },
    refundProof: {
      reviewLink: String,
      reviewScreenshot: String,
      returnPeriodScreenshot: String,
      deliveryScreenshot: String,
    },
    paymentDetails: {
      transactionId: String,
      paymentScreenshot: String,
      paidAt: Date,
      paidBy: { type: Schema.Types.ObjectId, ref: "User" },
      paidByName: String,
    },
    adminNote: { type: String },
    mediatorNote: { type: String },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    userRemarks: { type: String, default: "" },
    mediatorRemarks: { type: String, default: "" },
    activities: [{
      action: String,
      message: String,
      performedBy: { type: Schema.Types.ObjectId, ref: "User" },
      performedByName: String,
      timestamp: { type: Date, default: Date.now }
    }],
    internalNotes: [{
      content: String,
      authorName: String,
      authorRole: String,
      createdAt: { type: Date, default: Date.now }
    }],
    lastViewedNotes: [{
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      viewedAt: { type: Date, default: Date.now }
    }],
    productLink: { type: String },
  },
  { timestamps: true }
);

// Compound Indexes for query optimization
OrderSchema.index({ buyer: 1, status: 1 });
OrderSchema.index({ mediator: 1, status: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ userOrderId: 1 });
OrderSchema.index({ productCode: 1 });

// Auto-generate internal aspireOrderId
OrderSchema.pre("validate", function (next) {
  if (!this.aspireOrderId) {
    this.aspireOrderId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  next();
});

// Force refresh the model in development to pick up schema changes
if (process.env.NODE_ENV === "development" || !((mongoose.models.Order?.schema as any)?.paths?.exchangeProduct)) {
  delete (mongoose.connection.models as any).Order;
  delete (mongoose.models as any).Order;
}

export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
