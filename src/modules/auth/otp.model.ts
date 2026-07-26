import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOtp extends Document {
  key: string;
  value: string;
  expiresAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index auto-deletes expired OTPs & rate limits
  },
  { timestamps: true }
);

// Prevent OverwriteModelError in Next.js development
if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Otp;
}

export const Otp: Model<IOtp> = mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
