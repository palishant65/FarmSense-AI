import mongoose from "mongoose";

const recSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },
    recommendation: String,
    action: String,
    delayHours: Number,
    reason: String,
    factors: mongoose.Schema.Types.Mixed,
    impact: mongoose.Schema.Types.Mixed,
    crop: mongoose.Schema.Types.Mixed,
    weather: mongoose.Schema.Types.Mixed,
    soil: mongoose.Schema.Types.Mixed,
    iot: mongoose.Schema.Types.Mixed,
    market: mongoose.Schema.Types.Mixed,
    nextIrrigation: String,
    waterRequiredL: Number,
    favourite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Recommendation", recSchema);
