import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, required: true },
    payload: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("History", historySchema);
