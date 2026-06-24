import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    content: {
      type: String,
      trim: true,
      default: "",
    },
    authorName: {
      type: String,
      trim: true,
      default: "UniLynk User",
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    authorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
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

CommentSchema.index({ postId: 1, createdAt: 1, _id: 1 });

export default mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
