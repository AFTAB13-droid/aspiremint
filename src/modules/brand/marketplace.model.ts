import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMarketplace extends Document {
  name: string;
  isActive: boolean;
}

const MarketplaceSchema = new Schema<IMarketplace>(
  {
    name: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Marketplace: Model<IMarketplace> = 
  mongoose.models.Marketplace || mongoose.model<IMarketplace>("Marketplace", MarketplaceSchema);
