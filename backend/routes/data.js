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
r.get("/tts", async (req, res) => {
  const q = String(req.query.q || "").slice(0, 180);
  const lang = String(req.query.lang || "en").slice(0, 8);
  const tl = { en: "en", hi: "hi", bn: "bn", mr: "mr", te: "te" }[lang] || lang || "en";
  if (!q) return res.status(400).end();
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(q)}`;
  try {
    const r2 = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    });
    if (!r2.ok) return res.status(502).end();
    const buf = Buffer.from(await r2.arrayBuffer());
    res.setHeader("Content-Type", r2.headers.get("content-type") || "audio/mpeg");
    res.send(buf);
  } catch {
    res.status(502).end();
  }
});
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
