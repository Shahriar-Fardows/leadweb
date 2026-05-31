import mongoose, { Schema, model, models } from "mongoose";

const LeadSchema = new Schema({
  guardianName: {
    type: String,
    default: "N/A",
  },
  studentName: {
    type: String,
    default: "N/A",
  },
  studentAge: {
    type: String,
    default: "",
  },
  studentClass: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "N/A",
  },
  firstCall: {
    type: String,
    default: "",
  },
  secondCall: {
    type: String,
    default: "",
  },
  thirdCall: {
    type: String,
    default: "",
  },
  fourthCall: {
    type: String,
    default: "",
  },
  callLogs: {
    type: [{
      connected: { type: Boolean, default: true },
      duration: { type: String, default: "" },
      timeCalled: { type: String, default: "" },
      comment: { type: String, default: "" }
    }],
    default: [],
  },
  status: {
    type: String,
    enum: ["New", "Contacted", "Qualified", "Lost", "Sales"],
    default: "New",
  },
  webinar: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Always delete the cached model to prevent stale schema from old sessions
// being reused across Next.js HMR hot reloads.
if (models.Lead) {
  delete (mongoose.models as any).Lead;
}

export const Lead = model("Lead", LeadSchema);
