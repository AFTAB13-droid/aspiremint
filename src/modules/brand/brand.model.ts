import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBrand extends Document {
  name: string;
  productCodes: { 
    code: string; 
    stock: number;
    stockReview?: number;
    stockRating?: number;
    stockOnly?: number;
    stockSubmitted?: number;
  }[];
  exchangeProducts: { name: string; image: string }[];
  isActive: boolean;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, unique: true },
    productCodes: [
      {
        code: { type: String, required: true },
        stock: { type: Number, required: true, default: 0 },
        stockReview: { type: Number, default: 0 },
        stockRating: { type: Number, default: 0 },
        stockOnly: { type: Number, default: 0 },
        stockSubmitted: { type: Number, default: 0 }
      }
    ],
    exchangeProducts: [
      {
        name: { type: String },
        image: { type: String }
      }
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Middleware to calculate total stock and migrate codes
BrandSchema.pre("save", function (next) {
  if (this.productCodes && this.productCodes.length > 0) {
    this.productCodes = this.productCodes.map((pc: any) => {
      // Logic for legacy migration
      if (typeof pc === "string") {
        return { code: pc, stock: 99, stockReview: 99, stockRating: 0, stockOnly: 0, stockSubmitted: 0 };
      }
      
      // Ensure specific fields exist
      const r = pc.stockReview || 0;
      const rt = pc.stockRating || 0;
      const o = pc.stockOnly || 0;
      const sub = pc.stockSubmitted || 0;
      
      // Update total stock
      pc.stock = r + rt + o + sub;
      pc.stockReview = r;
      pc.stockRating = rt;
      pc.stockOnly = o;
      pc.stockSubmitted = sub;
      
      return pc;
    });
  }
  next();
});

// Force refresh model if schema changed in development
if (mongoose.models.Brand && !(mongoose.models.Brand.schema as any).paths["productCodes.stock"]) {
  delete (mongoose.connection.models as any).Brand;
  delete (mongoose.models as any).Brand;
}

export const Brand: Model<IBrand> = mongoose.models.Brand || mongoose.model<IBrand>("Brand", BrandSchema);
