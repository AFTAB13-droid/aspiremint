import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export enum UserRole {
  USER = "USER",
  MEDIATOR = "MEDIATOR",
  ADMIN = "ADMIN",
  SUBADMIN = "SUBADMIN",
}

export interface IUser extends Document {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  role: UserRole;
  aspireMintId: string;
  referralId: string;
  isProfileComplete: boolean;
  profileImage?: string;
  paymentDetails?: {
    upiId?: string;
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    bankDetails?: string; // Legacy/Backup
  };
  isActive: boolean;
  isApproved: boolean;
  isTerminated: boolean;
  terminatedAt?: Date;
  refundPayers: {
    name: string;
    detail?: string;
  }[];
  lastLogin?: Date;
  isEmailVerified?: boolean;
  isKycVerified?: boolean;
  totalCompletedOrders: number;
  resetPasswordOTP?: string;
  resetPasswordExpires?: Date;
  passwordResetCount?: number;
  lastResetRequestDate?: Date;
  securitySettings?: {
    twoFactorEnabled: boolean;
    loginHistory: {
      ip: string;
      device: string;
      location: string;
      timestamp: Date;
    }[];
    lastPasswordChange?: Date;
  };
  fcmTokens?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    mobile: { type: String, required: true },
    password: { type: String }, // Optional for OAuth if added later
    role: { 
      type: String, 
      enum: Object.values(UserRole), 
      default: UserRole.USER,
      required: true
    },
    aspireMintId: { type: String, required: true, unique: true },
    referralId: { type: String, required: true, unique: true },
    paymentDetails: {
      upiId: { type: String },
      bankName: { type: String },
      accountHolder: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      branchName: { type: String },
      bankDetails: { type: String },
    },
    isProfileComplete: { type: Boolean, default: false },
    profileImage: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: true },
    isTerminated: { type: Boolean, default: false },
    terminatedAt: { type: Date },
    refundPayers: [
      {
        name: { type: String, required: true },
        detail: { type: String },
      },
    ],
    lastLogin: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    isKycVerified: { type: Boolean, default: false },
    totalCompletedOrders: { type: Number, default: 0 },
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },
    passwordResetCount: { type: Number, default: 0 },
    lastResetRequestDate: { type: Date },
    securitySettings: {
      twoFactorEnabled: { type: Boolean, default: false },
      loginHistory: [
        {
          ip: { type: String },
          device: { type: String },
          location: { type: String },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      lastPasswordChange: { type: Date },
    },
    fcmTokens: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Database Indexes for query optimization
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(8);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Auto-generate IDs before validation if not present
UserSchema.pre("validate", async function (next) {
  try {
    if (!this.aspireMintId) {
      const { Counter } = await import("../system/counter.model");
      
      let prefix = "AM";
      let counterId = "buyer_id";
      let startSeq = 4999;
      
      if (this.role === UserRole.MEDIATOR) {
        prefix = "AMM";
        counterId = "mediator_id";
        startSeq = 1;
      } else if (this.role === UserRole.ADMIN) {
        prefix = "ADM";
        counterId = "admin_id";
        startSeq = 0;
      }
      
      const counter = await Counter.findOneAndUpdate(
        { id: counterId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      
      // If it was just created (upserted), it might start from 1. 
      // We want to ensure it honors our startSeq.
      if (counter.seq <= startSeq) {
        counter.seq = startSeq + 1;
        await counter.save();
      }

      const paddedSeq = counter.seq < 10 && prefix === "AMM" ? `0${counter.seq}` : counter.seq;
      this.aspireMintId = `${prefix}${paddedSeq}`;
    }
    
    if (!this.referralId) {
      this.referralId = Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if model exists to prevent OverwriteModelError in Next.js development
// Force refresh the model in development to pick up schema changes (like paymentDetails expansion)
if (process.env.NODE_ENV === "development") {
  delete mongoose.models.User;
}

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
