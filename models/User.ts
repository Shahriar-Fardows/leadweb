import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

if (models.User) {
  delete (mongoose.models as any).User;
}

export const User = model("User", UserSchema);
