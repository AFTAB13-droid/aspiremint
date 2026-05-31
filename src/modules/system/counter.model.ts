import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICounter extends Document {
  id: string; // counter name/type (e.g., 'user_id', 'mediator_id')
  seq: number; // last used sequence number
}

const CounterSchema = new Schema<ICounter>({
  id: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

export const Counter: Model<ICounter> = mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);
