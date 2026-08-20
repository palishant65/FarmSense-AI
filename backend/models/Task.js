import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    due: String,
    done: { type: Boolean, default: false },
    type: { type: String, default: "general" },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
