import { Router } from "express";
import { getFarm, updateFarm, updateSensors, getState } from "../controllers/farmController.js";
import { protect } from "../middleware/auth.js";

const r = Router();
r.use(protect);
r.get("/", getFarm);
r.patch("/", updateFarm);
r.get("/state", getState);
r.patch("/sensors", updateSensors);
export default r;
