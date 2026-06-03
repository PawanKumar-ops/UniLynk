// models/Community.js  (save as .js in your project)
import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isAnnouncement: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const CommunitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    groups: [GroupSchema],
  },
  { timestamps: true }
);

CommunitySchema.index({ name: 1 });

export default mongoose.models.Community ||
  mongoose.model("Community", CommunitySchema);
