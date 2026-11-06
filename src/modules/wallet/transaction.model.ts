import mongoose, { Document, Model, Schema } from "mongoose";

export enum TransactionType {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
}

export enum TransactionCategory {
  REFILL = "REFILL",                     // Admin to Mediator
  ORDER_PAYOUT = "ORDER_PAYOUT",         // Mediator to User
  ADJUSTMENT = "ADJUSTMENT",             // Manual Admin Correction
  REVERSAL = "REVERSAL",                 // Order Cancelled
  REFERRAL_BASE_REWARD = "REFERRAL_BASE_REWARD",         // +₹50 on Amazon qualification
  REFERRAL_FOLLOWON_REWARD = "REFERRAL_FOLLOWON_REWARD", // +₹10 on next 4 eligible orders
  REFERRAL_MILESTONE_BONUS = "REFERRAL_MILESTONE_BONUS", // +₹100 on 10 qualified referrals
  DEAL_CHECKOUT_DEBIT = "DEAL_CHECKOUT_DEBIT",           // -₹X applied on deal checkout
  WITHDRAWAL_REQUEST = "WITHDRAWAL_REQUEST",             // -₹X payout requested to UPI/Bank
  WITHDRAWAL_PAYOUT = "WITHDRAWAL_PAYOUT",               // Disbursed successfully
  WITHDRAWAL_REVERSAL = "WITHDRAWAL_REVERSAL",           // Returned to balance if failed
}

export interface ITransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  balanceAfter: number; // Balance snapshot after transaction
  status: "PENDING" | "COMPLETED" | "FAILED";
  paymentMethod: "ONLINE" | "OFFLINE";
  proof?: string;       // Screenshot for offline transfers
  referenceId?: string; // Order ID or external transaction ID
  note?: string;
  bankName?: string;    // Bank Name
  accountNumber?: string; // Account Number
  ifscCode?: string;    // IFSC Code
  sender?: mongoose.Types.ObjectId; // User ID who initiated (Admin or Mediator)
  receiver?: mongoose.Types.ObjectId; // Target User ID
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    category: { type: String, enum: Object.values(TransactionCategory), required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "COMPLETED" },
    paymentMethod: { type: String, enum: ["ONLINE", "OFFLINE"], default: "ONLINE" },
    proof: { type: String },
    referenceId: { type: String },
    note: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    receiver: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Database Indexes for query optimization
TransactionSchema.index({ walletId: 1, createdAt: -1 });

export const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
