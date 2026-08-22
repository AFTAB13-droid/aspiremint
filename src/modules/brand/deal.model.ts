import mongoose, { Document, Model, Schema } from "mongoose";

export interface IActiveDeal extends Document {
  brandName: string;
  productDetails: string;
  productCode: string;
  productLink?: string;
  marketplace: string;
  totalSlots: number;
  remainingSlots: number;
  
  // Granular Slots
  reviewSlots: number;
  remainingReview: number;
  
  ratingSlots: number;
  remainingRating: number;
  
  onlyOrderSlots: number;
  remainingOnly: number;

  submittedSlots: number;
  remainingSubmitted: number;

  dealType: "Original" | "Empty Box" | "Exchange";
  reviewType: string;
  assignedMediators: {
    mediatorId: mongoose.Types.ObjectId;
    commission: number;
    isAll?: boolean; // If true, applies to all
  }[];
  juhiCommission: number | string; // Specific commission for Juhi
  productImage?: string; // Optional image URL
  userRemarks?: string; // Notes for users
  mediatorRemarks?: string; // Notes for mediators
  remarks?: string; // Legacy/General notes
  originalCommission: number | string; // Baseline commission/less for profit calculation
  commission: number | string; // Standard Rate for other mediators
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActiveDealSchema = new Schema<IActiveDeal>(
  {
    brandName: { type: String, required: true },
    productDetails: { type: String, required: true },
    productCode: { type: String, required: true, unique: true },
    productLink: { type: String, default: "" },
    marketplace: { type: String, required: true },
    totalSlots: { type: Number, required: true },
    remainingSlots: { type: Number, required: true },
    
    // Granular Slots
    reviewSlots: { type: Number, default: 0 },
    remainingReview: { type: Number, default: 0 },
    
    ratingSlots: { type: Number, default: 0 },
    remainingRating: { type: Number, default: 0 },
    
    onlyOrderSlots: { type: Number, default: 0 },
    remainingOnly: { type: Number, default: 0 },

    submittedSlots: { type: Number, default: 0 },
    remainingSubmitted: { type: Number, default: 0 },

    dealType: { type: String, enum: ["Original", "Empty Box", "Exchange"], required: true },
    reviewType: { type: String, required: true },
    assignedMediators: [
      {
        mediatorId: { type: Schema.Types.ObjectId, ref: "User" },
        commission: { type: Schema.Types.Mixed, default: "N/A" },
      }
    ],
    juhiCommission: { type: Schema.Types.Mixed, default: "N/A" },
    productImage: { type: String },
    userRemarks: { type: String, default: "" },
    mediatorRemarks: { type: String, default: "" },
    remarks: { type: String, default: "" },
    originalCommission: { type: Schema.Types.Mixed, default: "N/A" },
    commission: { type: Schema.Types.Mixed, default: "N/A" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Database Indexes for query optimization
ActiveDealSchema.index({ isActive: 1, createdAt: -1 });
ActiveDealSchema.index({ "assignedMediators.mediatorId": 1 });

export const ActiveDeal: Model<IActiveDeal> = mongoose.models.ActiveDeal || mongoose.model<IActiveDeal>("ActiveDeal", ActiveDealSchema);
