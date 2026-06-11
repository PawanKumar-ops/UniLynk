import mongoose from "mongoose";

function hasTextOrImagesOrPoll(content) {
  const safeContent = typeof content === "string" ? content.trim() : "";
  const safeImages = Array.isArray(this?.images)
    ? this.images.filter((image) => typeof image === "string" && image.trim())
    : [];
  const safePollOptions = Array.isArray(this?.poll?.options)
    ? this.poll.options.filter((option) => typeof option?.text === "string" && option.text.trim())
    : [];

  return Boolean(safeContent) || safeImages.length > 0 || safePollOptions.length >= 2;
}

const PollOptionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    votes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const PollVoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    optionId: {
      type: String,
      required: true,
      trim: true,
    },
    votedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const PollSchema = new mongoose.Schema(
  {
    options: {
      type: [PollOptionSchema],
      default: undefined,
      validate: {
        validator(options) {
          return Array.isArray(options) && options.length >= 2 && options.length <= 4;
        },
        message: "Poll must have between 2 and 4 options",
      },
    },
    totalVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    endsAt: {
      type: Date,
      required: true,
      index: true,
    },
    votes: {
      type: [PollVoteSchema],
      default: [],
    },
  },
  { _id: false }
);

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
        validator: hasTextOrImagesOrPoll,
        message: "Post content, image, or poll is required",
      },
    },
    audience: {
      type: String,
      enum: ["for-you", "clubs"],
      default: "for-you",
    },
    visibility: {
      type: [String],
      enum: ["for-you", "clubs"],
      default: function () {
        return [this.audience === "clubs" ? "clubs" : "for-you"];
      },
    },
    postAs: {
      type: String,
      enum: ["user", "club"],
      default: "user",
    },
    clubId: {
      type: String,
      default: "",
      index: true,
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
    poll: {
      type: PollSchema,
      default: undefined,
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
