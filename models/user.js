import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
 email: { type: String, unique: true },
   password: {
      type: String,
      required: function () {
        return this.provider === "credentials";
      },
      default: null
    },
   image: String,



  name: String,
  year: String,
  branch: String,
  skill: String,
});

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);
