import mongoose from "mongoose";

const MessageRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted"], default: "pending" },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

MessageRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });
MessageRequestSchema.index({ recipient: 1, status: 1, deletedFor: 1, updatedAt: -1 });

export default mongoose.models.MessageRequest || mongoose.model("MessageRequest", MessageRequestSchema);
