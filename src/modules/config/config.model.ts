import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISystemConfig extends Document {
  key: string; // e.g., "order_form_settings"
  value: any;
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const SystemConfig: Model<ISystemConfig> = mongoose.models.SystemConfig || mongoose.model<ISystemConfig>("SystemConfig", SystemConfigSchema);
