import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: String,
    level: { type: String, enum: ["info", "warning", "critical"], default: "info" },
    title: String,
    to: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);
