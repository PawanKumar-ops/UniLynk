import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipientEmail: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    senderEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    senderName: String,
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["team-finder-request", "team-finder-accepted", "team-finder-declined"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: String,
    message: String,
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      default: null,
    },
    formTitle: String,
    targetKind: {
      type: String,
      enum: ["users", "team"],
    },
    teamName: String,
    targetResponseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Response",
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

NotificationSchema.index({ recipientEmail: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
