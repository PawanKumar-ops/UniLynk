import mongoose from "mongoose";

const CommunityMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "", trim: true, maxlength: 4000 },
    messageType: {
      type: String,
      enum: ["text", "emoji", "gif", "document", "media", "shared_post"],
      default: "text",
    },
    attachment: {
      url: { type: String, default: "" },
      fileName: { type: String, default: "" },
      mimeType: { type: String, default: "" },
      size: { type: Number, default: 0 },
    },
    attachments: [
      {
        url: { type: String, default: "" },
        fileName: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },
    ],
    sharedPost: {
      id: { type: String, default: "" },
      content: { type: String, default: "" },
      authorName: { type: String, default: "UniLynk User" },
      authorImage: { type: String, default: "" },
      images: { type: [String], default: [] },
      audience: { type: String, default: "for-you" },
      createdAt: { type: Date, default: null },
      url: { type: String, default: "" },
    },
    seenBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        seenAt: { type: Date, default: Date.now },
      },
    ],
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        emoji: { type: String, required: true, maxlength: 16 },
      },
    ],
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Keeps community message subdocuments for audit/history while showing a placeholder.
    deletedForEveryone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    image: { type: String, default: "" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isAnnouncement: { type: Boolean, default: false },
    messages: { type: [CommunityMessageSchema], default: [] },
  },
  { timestamps: true }
);

const CommunitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    image: { type: String, default: "" },
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    groups: { type: [GroupSchema], default: [] },
  },
  { timestamps: true }
);

CommunitySchema.index({ name: 1 });
CommunitySchema.index({ clubId: 1 });
CommunitySchema.index({ members: 1 });

export default mongoose.models.Community || mongoose.model("Community", CommunitySchema);
