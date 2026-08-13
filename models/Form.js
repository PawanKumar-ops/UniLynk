import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  id: String,
  type: String,
  title: String,
  question: String, // fallback mapping
  required: { type: Boolean, default: false },
  options: { type: [String], default: [] },
});

const FormSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    name: { type: String, default: "" },
    description: { type: String, default: "" },
    points: { type: [String], default: [] },
    moreInformation: { type: [String], default: [] },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    venue: { type: String, default: "" },
    location: { type: String, default: "" },
    banner: { type: String, default: "" },
    image: { type: String, default: "" },
    isTeam: { type: Boolean, default: false },
    isTeamEvent: { type: Boolean, default: false },
    teamSize: { type: Number, default: 4 },

    questions: [QuestionSchema],

    createdBy: String,

    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },

    visibility: {
      type: String,
      enum: ["everyone", "members", "public"],
      default: "everyone",
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    publishedAt: Date,
  },
  { timestamps: true }
);

delete mongoose.models.Form;
delete mongoose.connection?.models?.Form;

export default mongoose.models.Form ||
  mongoose.model("Form", FormSchema, "forms");

