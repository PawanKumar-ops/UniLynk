import mongoose from "mongoose";

const hasTextOrImages = function hasTextOrImages() {
  const safeContent = typeof this.content === "string" ? this.content.trim() : "";
  return Boolean(safeContent || (Array.isArray(this.images) && this.images.length > 0));
};

const PostCommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: hasTextOrImages,
        message: "Comment content or image is required",
      },
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

const PostSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: hasTextOrImages,
        message: "Post content or image is required",
      },
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
    comments: {
      type: [PostCommentSchema],
      default: [],
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
