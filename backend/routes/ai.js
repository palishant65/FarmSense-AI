import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { recommend, irrigation, soil, disease, scans, copilot, yieldCtl, profit } from "../controllers/aiController.js";

const r = Router();
r.use(protect);
r.post("/recommend", recommend);
r.post("/irrigation", irrigation);
r.post("/soil", soil);
r.post("/disease", upload.single("image"), disease);
r.get("/scans", scans);
r.post("/copilot", copilot);
r.post("/yield", yieldCtl);
r.post("/profit", profit);
export default r;
