import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const LeadershipMemberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    position: { type: String, required: true, trim: true },
    image: { type: String, default: "/Profilepic.png" },
  },
  { _id: false }
);

const ClubMemberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    profilePicture: { type: String, default: "/Profilepic.png" },
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
    leaders: { type: [LeadershipMemberSchema], default: [] },
    members: { type: [ClubMemberSchema], default: [] },
  },
  { timestamps: true, strict: true }
);

export default mongoose.models.Club || mongoose.model("Club", ClubSchema, "clubs");
