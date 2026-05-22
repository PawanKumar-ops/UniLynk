import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ClubSchema = new mongoose.Schema(
  {
    banner: { type: String, default: "" },
    logo: { type: String, default: "" },
    clubName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    memberCount: { type: Number, required: true, min: 1 },
    foundedDate: { type: String, required: true },
    email: { type: String, required: true, trim: true },
    website: { type: String, default: "", trim: true },
    activities: { type: [ActivitySchema], default: [] },
  },
  { timestamps: true, strict: true }
);

export default mongoose.models.Club || mongoose.model("Club", ClubSchema, "clubs");
