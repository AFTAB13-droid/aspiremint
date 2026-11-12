import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAiChatLog extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  userRole: string;
  aspireMintId?: string;
  userMessage: string;
  sanaReply: string;
  intentCategory: "ORDER_TRACKING" | "REFUND_STATUS" | "DEAL_DISCOVERY" | "RULES_FAQ" | "OFF_TOPIC" | "GENERAL";
  toolsUsed: string[];
  tokens: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  estimatedCostUsd: number;
  estimatedCostInr: number;
  ordersInquired?: string[];
  clientIp?: string;
  userAgent?: string;
  createdAt: Date;
}

const AiChatLogSchema = new Schema<IAiChatLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userName: { type: String, default: "Shopper" },
    userEmail: { type: String, default: "" },
    userRole: { type: String, default: "USER" },
    aspireMintId: { type: String, default: "" },
    userMessage: { type: String, required: true },
    sanaReply: { type: String, required: true },
    intentCategory: {
      type: String,
      enum: ["ORDER_TRACKING", "REFUND_STATUS", "DEAL_DISCOVERY", "RULES_FAQ", "OFF_TOPIC", "GENERAL"],
      default: "GENERAL",
      index: true,
    },
    toolsUsed: [{ type: String }],
    tokens: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    estimatedCostUsd: { type: Number, default: 0 },
    estimatedCostInr: { type: Number, default: 0 },
    ordersInquired: [{ type: String }],
    clientIp: { type: String },
    userAgent: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast analytics queries
AiChatLogSchema.index({ createdAt: -1 });
AiChatLogSchema.index({ userId: 1, createdAt: -1 });
AiChatLogSchema.index({ intentCategory: 1, createdAt: -1 });

export const AiChatLog: Model<IAiChatLog> =
  mongoose.models.AiChatLog || mongoose.model<IAiChatLog>("AiChatLog", AiChatLogSchema);
