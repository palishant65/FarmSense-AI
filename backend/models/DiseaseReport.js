import mongoose from "mongoose";

const diseaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },
    name: String,
    crop: String,
    severity: String,
    conf: Number,
    symptoms: String,
    causes: String,
    actions: [String],
    field: String,
    image: String,
    disclaimer: String,
    at: { type: Number, default: () => Date.now() },
    favourite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("DiseaseReport", diseaseSchema);
