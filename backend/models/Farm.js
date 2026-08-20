import mongoose from "mongoose";

const farmSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farmer: { type: String, default: "Farmer" },
    location: { type: String, default: "Dehradun, Uttarakhand" },
    lat: Number,
    lon: Number,
    area: { type: Number, default: 4.5 },
    crops: { type: [String], default: ["Tomato", "Wheat", "Potato"] },
    soil: { type: String, default: "Loam" },
    irrigation: { type: String, default: "Drip" },
    waterSource: { type: String, default: "Borewell" },
    language: { type: String, default: "en" },
    onboarded: { type: Boolean, default: true },
    sensors: {
      moisture: { type: Number, default: 38 },
      temperature: { type: Number, default: 29 },
      humidity: { type: Number, default: 71 },
      rain: { type: Number, default: 0 },
      pump: { type: Boolean, default: false },
      online: { type: Boolean, default: true },
      lastSeen: { type: Date, default: Date.now },
    },
    weatherOverride: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("Farm", farmSchema);
