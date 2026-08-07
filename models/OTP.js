import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["register", "login", "reset"],
      required: true,
    },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

OtpSchema.index({ email: 1, purpose: 1 });

export default mongoose.models.OTP || mongoose.model("OTP", OtpSchema);
