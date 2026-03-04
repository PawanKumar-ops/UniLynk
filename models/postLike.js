import mongoose from "mongoose";

const PostLikeSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

PostLikeSchema.index({ postId: 1, userId: 1 }, { unique: true, name: "uniq_post_user_like" });

export default mongoose.models.PostLike || mongoose.model("PostLike", PostLikeSchema);
