import Task from "../models/Task.js";
import Alert from "../models/Alert.js";
import History from "../models/History.js";
import Favourite from "../models/Favourite.js";
import Recommendation from "../models/Recommendation.js";
import SoilReport from "../models/SoilReport.js";
import { getWeather, getForecast } from "../services/weather.js";
import { getMandiPrices } from "../services/market.js";
import { schemes, generateFarmRecommendation } from "../services/decision.js";
import Farm from "../models/Farm.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";

export const listTasks = asyncHandler(async (req, res) => ok(res, await Task.find({ user: req.user._id }).sort({ createdAt: -1 })));
export const createTask = asyncHandler(async (req, res) => {
  if (!req.body.title) return fail(res, "title required", 422);
  return ok(res, await Task.create({ user: req.user._id, ...req.body }), "Task added", 201);
});
export const patchTask = asyncHandler(async (req, res) => {
  const t = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
  if (!t) return fail(res, "Task not found", 404);
  return ok(res, t);
});
export const deleteTask = asyncHandler(async (req, res) => {
  await Task.deleteOne({ _id: req.params.id, user: req.user._id });
  return ok(res, {}, "Deleted");
});

export const listAlerts = asyncHandler(async (req, res) => {
  let list = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 });
  if (!list.length) {
    const farm = await Farm.findOne({ user: req.user._id });
    const rec = generateFarmRecommendation({ iot: farm?.sensors });
    const seed = [
      { type: "irrigation", level: rec.action === "delay" ? "info" : "warning", title: rec.recommendation, to: "/irrigation" },
      { type: "rain", level: "warning", title: `Rain probability ${rec.weather.rainProb}%`, to: "/weather" },
      { type: "disease", level: "warning", title: "Tomato blight risk 34% on Field A", to: "/doctor" },
      { type: "market", level: "info", title: "Tomato +₹2 vs yesterday", to: "/market" },
    ];
    list = await Alert.insertMany(seed.map((a) => ({ ...a, user: req.user._id })));
  }
  return ok(res, list);
});
export const readAlert = asyncHandler(async (req, res) => {
  if (req.params.id === "all") {
    await Alert.updateMany({ user: req.user._id }, { read: true });
    return ok(res, {}, "All read");
  }
  const a = await Alert.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
  return ok(res, a);
});

export const history = asyncHandler(async (req, res) =>
  ok(res, await History.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50))
);

export const listFav = asyncHandler(async (req, res) => ok(res, await Favourite.find({ user: req.user._id })));
export const addFav = asyncHandler(async (req, res) =>
  ok(res, await Favourite.create({ user: req.user._id, ...req.body }), "Saved", 201)
);
export const delFav = asyncHandler(async (req, res) => {
  await Favourite.deleteOne({ _id: req.params.id, user: req.user._id });
  return ok(res, {}, "Removed");
});

export const weather = asyncHandler(async (req, res) => ok(res, await getWeather(req.query)));
export const forecast = asyncHandler(async (req, res) => ok(res, await getForecast(req.query)));
export const market = asyncHandler(async (_req, res) => ok(res, await getMandiPrices()));
export const schemeList = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const list = schemes.filter((s) => (s.name + s.cat + s.benefit).toLowerCase().includes(q));
  return ok(res, list);
});

export const analytics = asyncHandler(async (req, res) => {
  const n = req.query.range === "season" ? 16 : Number(req.query.range || 7);
  const data = Array.from({ length: n }, (_, i) => ({
    d: `D${i + 1}`, health: 70 + (i % 7), water: 400 - i * 4, soil: 36 + (i % 5),
    rain: 5 + (i % 9), yield: 18 + i * 0.1, price: 26 + (i % 4), exp: 1200, profit: 800 + i * 20,
  }));
  return ok(res, data);
});

export const reports = asyncHandler(async (req, res) => {
  const farm = await Farm.findOne({ user: req.user._id });
  const last = await Recommendation.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  const soils = await SoilReport.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5);
  return ok(res, { farm, last, soils, period: req.query.period || "weekly" });
});
