import mongoose from "mongoose";

const ResponseSchema = new mongoose.Schema({

  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Form",
    required: true
  },

  userEmail: {
    type: String,
    required: true
  },

  answers: {
    type: Object,
    default: {}
  },

  isSubmitted: {
    type: Boolean,
    default: false
  },

  teamFinder: {
    type: {
      type: String,
      enum: ["solo", "team"]
    },
    profile: {
      name: String,
      email: String
    },
    team: {
      name: String,
      lead: String,
      members: {
        type: [Object],
        default: []
      },
      needed: Number,
      total: Number,
      lookingFor: {
        type: [String],
        default: []
      }
    },
    addedAt: Date
  },

  teamFinderRequest: {
    kind: {
      type: String,
      enum: ["team"]
    },
    targetId: String,
    sentAt: Date,
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"]
    },
    decidedAt: Date
  },

  submittedAt: {
    type: Date,
    default: null
  }

});

// ⭐ Prevent duplicate submissions
ResponseSchema.index(
  { formId: 1, userEmail: 1 },
  { unique: true }
);

export default mongoose.models.Response ||
mongoose.model("Response", ResponseSchema);