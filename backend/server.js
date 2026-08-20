import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import farmRoutes from "./routes/farms.js";
import aiRoutes from "./routes/ai.js";
import dataRoutes from "./routes/data.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();
const origin = process.env.CLIENT_ORIGIN || true;
app.use(cors({ origin, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 400 }));

app.get("/api/health", (_req, res) => res.json({ success: true, service: "FarmSense API", time: new Date().toISOString() }));
app.use("/api/auth", authRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", dataRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);
await connectDB();
app.listen(port, "0.0.0.0", () => console.log(`FarmSense API on :${port}`));
