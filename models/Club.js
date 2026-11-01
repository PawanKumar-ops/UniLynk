import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: String, default: "" },
    location: { type: String, default: "" },
    participants: { type: Number, default: 0 },
    images: { type: [String], default: [] },
    formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", default: null },
    addedBy: { type: String, default: "" },
    addedAt: { type: Date, default: null },
  },
  { _id: false }
);

const LeadershipMemberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    position: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    joiningYear: { type: String, default: "" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ClubMemberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    profilePicture: { type: String, default: "" },
    position: { type: String, default: "Member", trim: true },
    joiningYear: { type: String, default: "" },
    joinedAt: { type: Date, default: Date.now },
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
    memberCount: { type: Number, default: 1 },
    foundedDate: { type: String, default: "" },
    email: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    activities: { type: [ActivitySchema], default: [] },
    leaders: { type: [LeadershipMemberSchema], default: [] },
    members: { type: [ClubMemberSchema], default: [] },
  },
  { timestamps: true, strict: true }
);

// Clear model cache in dev mode so updated schema takes effect immediately
// Speeds up "clubs this user belongs to" lookups.
ClubSchema.index({ "leaders.email": 1 });
ClubSchema.index({ "members.email": 1 });
// Case-insensitive club-name prefix search (used by Explore search).
ClubSchema.index({ clubName: 1 }, { collation: { locale: "en", strength: 2 } });

if (mongoose.models && mongoose.models.Club) {
  delete mongoose.models.Club;
}

export default mongoose.model("Club", ClubSchema, "clubs");
