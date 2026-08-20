import mongoose from "mongoose";

const favSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, required: true },
    refId: String,
    payload: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("Favourite", favSchema);
