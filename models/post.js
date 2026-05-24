import mongoose from "mongoose";

function hasPostBody(content) {
  const safeContent = typeof content === "string" ? content.trim() : "";
  const safeImages = Array.isArray(this?.images)
    ? this.images.filter((image) => typeof image === "string" && image.trim())
    : [];

  const hasPollOptions = Array.isArray(this?.poll?.options)
    ? this.poll.options.filter((option) => typeof option?.text === "string" && option.text.trim()).length >= 2
    : false;

  return Boolean(safeContent) || safeImages.length > 0 || hasPollOptions;
}

const PostCommentSchema = new mongoose.Schema(
  {
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
        validator: hasPostBody,
        message: "Post content, image, or poll is required",
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
    poll: {
      question: {
        type: String,
        trim: true,
        default: "",
      },
      options: {
        type: [
          {
            text: { type: String, trim: true, required: true },
            voteCount: { type: Number, default: 0, min: 0 },
          },
        ],
        default: [],
      },
      votes: {
        type: [
          {
            voterEmail: { type: String, trim: true, lowercase: true, required: true },
            optionIndex: { type: Number, required: true, min: 0 },
          },
        ],
        default: [],
      },
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
