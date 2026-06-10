import mongoose from "mongoose";

const NewsletterSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
      index: true,
    },
    clubName: {
      type: String,
      required: true,
      trim: true,
    },
    clubLogo: {
      type: String,
      default: "/Defaultclublogo.svg",
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    coverImage: {
      type: String,
      required: true,
    },
    coverPublicId: {
      type: String,
      default: "",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

NewsletterSchema.index({ expiresAt: 1, createdAt: -1 });

export default mongoose.models.Newsletter ||
  mongoose.model("Newsletter", NewsletterSchema, "newsletter");
