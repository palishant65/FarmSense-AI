import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["me", "ai"], required: true },
    text: String,
    lang: String,
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
