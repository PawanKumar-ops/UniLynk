import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
      required: true,
    },
    audience: {
      type: String,
      enum: ["for-you", "clubs"],
      default: "for-you",
    },
    authorName: {
      type: String,
      trim: true,
      default: "UniLynk User",
    },
    authorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      default: "",
    },
    authorImage: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);

