import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },

    messageType: {
      type: String,
      enum: ["text", "emoji", "gif", "document", "media"],
      default: "text",
    },
    attachment: {
      url: {
        type: String,
        default: "",
      },
      fileName: {
        type: String,
        default: "",
      },
      mimeType: {
        type: String,
        default: "",
      },
      size: {
        type: Number,
        default: 0,
      },
    },
    attachments: [
      {
        url: {
          type: String,
          default: "",
        },
        fileName: {
          type: String,
          default: "",
        },
        mimeType: {
          type: String,
          default: "",
        },
        size: {
          type: Number,
          default: 0,
        },
      },
    ],
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

  },
  { timestamps: true }
);

ChatMessageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

export default mongoose.models.ChatMessage ||
  mongoose.model("ChatMessage", ChatMessageSchema);
