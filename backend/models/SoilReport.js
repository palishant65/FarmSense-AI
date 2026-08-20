import mongoose from "mongoose";

const soilSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },
    ph: Number,
    n: Number,
    p: Number,
    k: Number,
    oc: Number,
    moisture: Number,
    texture: String,
    health: Number,
    recs: [String],
  },
  { timestamps: true }
);

export default mongoose.model("SoilReport", soilSchema);
