import mongoose from "mongoose";

const TeamConfigSchema = new mongoose.Schema(
  {
    minSize: { type: Number, default: 2 },
    maxSize: { type: Number, default: 5 },
    memberFields: { type: [String], default: ["name", "email"] },
    customFields: { type: [String], default: [] },
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema({
  id: String,
  type: String,
  question: String,
  description: String,
  required: Boolean,
  options: [String],
  teamConfig: { type: TeamConfigSchema, default: undefined },
});

const FormSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    genre: String,
    seats: Number,
    date: String,
    time: String,
    location: String,
    image: String,
    questions: [QuestionSchema],
    isTeamEvent: {
      type: Boolean,
      default: false,
    },
    teamConfig: {
      type: TeamConfigSchema,
      default: () => ({
        minSize: 2,
        maxSize: 5,
        memberFields: ["name", "email"],
        customFields: [],
      }),
    },

    createdBy: String,

    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },

    visibility: {
      type: String,
      enum: ["everyone", "members"],
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

const cachedFormModel = mongoose.models.Form;

if (
  cachedFormModel &&
  (
    !cachedFormModel.schema.path("isTeamEvent") ||
    !cachedFormModel.schema.path("teamConfig") ||
    !cachedFormModel.schema.path("questions.teamConfig")
  )
) {
  delete mongoose.models.Form;
  delete mongoose.connection.models.Form;
}

// 🔥 FORCE collection name to avoid mismatch
export default mongoose.models.Form ||
  mongoose.model("Form", FormSchema, "forms");
