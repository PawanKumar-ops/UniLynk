import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: {
    type: String,
    required: function () {
      return this.provider === "credentials";
    },
    default: null
  },
  rollNumber: String,
  img: String,
  provider: String,
  name: String,
  year: String,
  branch: String,
  skills: {
    type: [String],
    default: [],
    index: true
  },
  socials: {
    type: [
      {
        platform: String,
        url: String,
      },
    ],
    default: [],
  },
  savedPosts: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    default: [],
  },

  profileCompleted: {
    type: Boolean,
    default: false,
  },
  blockedUsers: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  },

});

UserSchema.index({ savedPosts: 1 });

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);
