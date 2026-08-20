import Farm from "../models/Farm.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";

async function mine(userId) {
  let farm = await Farm.findOne({ user: userId });
  if (!farm) farm = await Farm.create({ user: userId });
  return farm;
}

export const getFarm = asyncHandler(async (req, res) => ok(res, await mine(req.user._id)));

export const updateFarm = asyncHandler(async (req, res) => {
  const farm = await mine(req.user._id);
  const allow = ["farmer", "location", "lat", "lon", "area", "crops", "soil", "irrigation", "waterSource", "language", "onboarded", "weatherOverride"];
  allow.forEach((k) => {
    if (req.body[k] !== undefined) farm[k] = req.body[k];
  });
  await farm.save();
  return ok(res, farm, "Farm saved");
});

export const updateSensors = asyncHandler(async (req, res) => {
  const farm = await mine(req.user._id);
  farm.sensors = { ...farm.sensors.toObject?.() || farm.sensors, ...req.body, lastSeen: new Date() };
  await farm.save();
  return ok(res, farm.sensors, "Sensors updated");
});

export const getState = asyncHandler(async (req, res) => {
  const farm = await mine(req.user._id);
  return ok(res, {
    farm: {
      farmer: farm.farmer, location: farm.location, area: farm.area, crops: farm.crops,
      soil: farm.soil, irrigation: farm.irrigation, waterSource: farm.waterSource,
      language: farm.language, onboarded: farm.onboarded,
    },
    sensors: farm.sensors,
    weatherOverride: farm.weatherOverride,
    theme: req.user.theme,
    units: req.user.units,
  });
});
