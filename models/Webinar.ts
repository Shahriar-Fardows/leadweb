import mongoose, { Schema, model, models } from "mongoose";

const WebinarSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

if (models.Webinar) {
  delete (mongoose.models as any).Webinar;
}

export const Webinar = model("Webinar", WebinarSchema);
