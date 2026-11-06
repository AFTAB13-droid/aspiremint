import mongoose, { Document, Model, Schema } from "mongoose";

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  walletId?: string;
  balance: number; // Available Balance
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  totalDeposited: number;
  totalDisbursed: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lifetimeWithdrawn: number;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    walletId: { type: String, unique: true, sparse: true },
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    lifetimeEarned: { type: Number, default: 0 },
    lifetimeSpent: { type: Number, default: 0 },
    lifetimeWithdrawn: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    totalDeposited: { type: Number, default: 0 },
    totalDisbursed: { type: Number, default: 0 },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export const Wallet: Model<IWallet> = mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", WalletSchema);
