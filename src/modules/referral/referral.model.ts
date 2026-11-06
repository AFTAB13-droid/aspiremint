import mongoose, { Document, Model, Schema } from "mongoose";

export interface IReferralOrderRef {
  orderId: mongoose.Types.ObjectId;
  marketplace: string;
  orderSequence: number; // 1 for base, 2-5 for follow-ons
  rewardAmount: number;  // 50 or 10
  status: "LOCKED_AWAITING_AMAZON" | "PENDING_VERIFICATION" | "AVAILABLE" | "CANCELLED";
  returnWindowExpiresAt?: Date;
  verifiedAt?: Date;
  note?: string;
}

export interface IReferral extends Document {
  referrer: mongoose.Types.ObjectId;
  referee: mongoose.Types.ObjectId;
  referralCode: string;
  status: "PENDING" | "AMAZON_QUALIFIED" | "FULLY_COMPLETED" | "FRAUD_BLOCKED";
  hasAmazonOrder: boolean;
  baseRewardEarned: boolean; // True once ₹50 base reward verified
  followOnCount: number;     // 0 to 4
  totalEarned: number;       // Max 90
  orders: IReferralOrderRef[];
  riskFlags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ReferralOrderSchema = new Schema<IReferralOrderRef>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    marketplace: { type: String, default: "OTHER" },
    orderSequence: { type: Number, required: true },
    rewardAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["LOCKED_AWAITING_AMAZON", "PENDING_VERIFICATION", "AVAILABLE", "CANCELLED"],
      default: "PENDING_VERIFICATION",
    },
    returnWindowExpiresAt: { type: Date },
    verifiedAt: { type: Date },
    note: { type: String },
  },
  { _id: false }
);

const ReferralSchema = new Schema<IReferral>(
  {
    referrer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referee: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    referralCode: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "AMAZON_QUALIFIED", "FULLY_COMPLETED", "FRAUD_BLOCKED"],
      default: "PENDING",
    },
    hasAmazonOrder: { type: Boolean, default: false },
    baseRewardEarned: { type: Boolean, default: false },
    followOnCount: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    orders: [ReferralOrderSchema],
    riskFlags: { type: [String], default: [] },
  },
  { timestamps: true }
);

ReferralSchema.index({ referrer: 1, createdAt: -1 });

export const Referral: Model<IReferral> =
  mongoose.models.Referral || mongoose.model<IReferral>("Referral", ReferralSchema);
