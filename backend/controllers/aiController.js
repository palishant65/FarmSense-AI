import Recommendation from "../models/Recommendation.js";
import SoilReport from "../models/SoilReport.js";
import DiseaseReport from "../models/DiseaseReport.js";
import History from "../models/History.js";
import Chat from "../models/Chat.js";
import Farm from "../models/Farm.js";
import { cropRecommendation, soilAnalysis, diseaseDetection, copilotAnswer, yieldPredict } from "../services/ai.js";
import { profitSim, generateFarmRecommendation } from "../services/decision.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";

export const recommend = asyncHandler(async (req, res) => {
  const rec = await cropRecommendation(req.body || {});
  const saved = await Recommendation.create({ user: req.user._id, ...rec });
  await History.create({ user: req.user._id, kind: "recommendation", payload: rec });
  return ok(res, saved);
});

export const irrigation = asyncHandler(async (req, res) => {
  const rec = generateFarmRecommendation(req.body || {});
  return ok(res, rec);
});

export const soil = asyncHandler(async (req, res) => {
  const result = await soilAnalysis(req.body || {});
  const saved = await SoilReport.create({ user: req.user._id, ...result });
  await History.create({ user: req.user._id, kind: "soil", payload: result });
  return ok(res, saved);
});

export const disease = asyncHandler(async (req, res) => {
  const result = await diseaseDetection({ field: req.body.field, src: req.file?.filename });
  if (req.file) result.image = `/uploads/${req.file.filename}`;
  const saved = await DiseaseReport.create({ user: req.user._id, ...result });
  await History.create({ user: req.user._id, kind: "disease", payload: result });
  return ok(res, saved);
});

export const scans = asyncHandler(async (req, res) => {
  const list = await DiseaseReport.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
  return ok(res, list);
});

export const copilot = asyncHandler(async (req, res) => {
  const { question, rec } = req.body;
  if (!question) return fail(res, "question required", 422);
  const farm = await Farm.findOne({ user: req.user._id });
  const decision = rec || generateFarmRecommendation({ iot: farm?.sensors });
  const out = await copilotAnswer(question, decision);
  await Chat.create({ user: req.user._id, role: "me", text: question, lang: req.body.lang });
  await Chat.create({ user: req.user._id, role: "ai", text: out.text, lang: req.body.lang });
  return ok(res, out);
});

export const yieldCtl = asyncHandler(async (req, res) => ok(res, await yieldPredict(req.body || {})));

export const profit = asyncHandler(async (req, res) => ok(res, profitSim(req.body || {})));
