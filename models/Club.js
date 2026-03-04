import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: String,
    date: String,
    startTime: String,
    endTime: String,
    location: String,
    description: String,
    seats: Number,
    seatsAvailable: Number,
  },
  { _id: false }
);

const LeaderSchema = new mongoose.Schema(
  {
    name: String,
    position: String,
    image: String,
  },
  { _id: false }
);

const ClubSchema = new mongoose.Schema(
  {
    clubName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    logo: String,
    banner: String,
    memberCount: { type: Number, default: 0 },
    foundedDate: String,
    email: String,
    phone: String,
    website: String,
    instagram: String,
    twitter: String,
    linkedin: String,
    activities: { type: [String], default: [] },
    leaders: { type: [LeaderSchema], default: [] },
    pastEvents: { type: [EventSchema], default: [] },
    upcomingEvents: { type: [EventSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Club || mongoose.model("Club", ClubSchema, "clubs");
