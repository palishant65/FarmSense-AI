import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  listTasks, createTask, patchTask, deleteTask,
  listAlerts, readAlert, history, listFav, addFav, delFav,
  weather, forecast, market, schemeList, analytics, reports,
} from "../controllers/dataController.js";

const r = Router();
r.get("/weather", weather);
r.get("/forecast", forecast);
r.get("/market", market);
r.get("/schemes", schemeList);
r.use(protect);
r.get("/tasks", listTasks);
r.post("/tasks", createTask);
r.patch("/tasks/:id", patchTask);
r.delete("/tasks/:id", deleteTask);
r.get("/alerts", listAlerts);
r.patch("/alerts/:id", readAlert);
r.get("/history", history);
r.get("/favourites", listFav);
r.post("/favourites", addFav);
r.delete("/favourites/:id", delFav);
r.get("/analytics", analytics);
r.get("/reports", reports);
export default r;
