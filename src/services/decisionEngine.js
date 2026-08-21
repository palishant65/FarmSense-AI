export const weatherBase = {
  temp: 29,
  humidity: 71,
  rainProb: 65,
  rainMm: 12,
  wind: 9,
  condition: "Cloudy, rain likely",
};

export const soilBase = {
  ph: 6.4,
  n: 42,
  p: 28,
  k: 36,
  oc: 0.72,
  moisture: 38,
  texture: "Loam",
};

export const cropBase = {
  name: "Tomato",
  stage: "Fruit set",
  health: 78,
  diseaseRisk: 34,
  waterNeedMm: 4.2,
};

export const marketBase = {
  tomato: 28,
  wheat: 24,
  potato: 18,
  trend: "up",
};

export function generateFarmRecommendation({ weather, soil, crop, iot, market } = {}) {
  const w = { ...weatherBase, ...weather };
  const s = { ...soilBase, ...soil };
  const c = { ...cropBase, ...crop };
  const i = { moisture: s.moisture, pump: false, ...iot };
  const moisture = i.moisture ?? s.moisture;
  const rain = w.rainProb;

  let action = "irrigate";
  let delayHours = 0;
  let rec = "Irrigate now";
  let waterL = Math.round(c.waterNeedMm * 1000 * 0.45);
  let savedL = 0;

  if (rain >= 55 && moisture >= 32) {
    action = "delay";
    delayHours = rain >= 75 ? 24 : 18;
    rec = `Delay irrigation ${delayHours} hours`;
    savedL = Math.round(waterL * 0.85);
    waterL = 0;
  } else if (moisture >= 55) {
    action = "skip";
    rec = "Skip irrigation today";
    savedL = Math.round(c.waterNeedMm * 1000 * 0.4);
    waterL = 0;
  } else if (moisture < 25 && rain < 30) {
    action = "irrigate";
    rec = "Irrigate now — moisture is critically low";
    waterL = Math.round(c.waterNeedMm * 1000 * 0.55);
  } else if (w.temp >= 36) {
    action = "optimize";
    rec = "AI optimize: irrigate at 5:30 AM to cut evaporation";
    savedL = 180;
  }

  const traditionalL = Math.round(c.waterNeedMm * 1000 * 0.55);
  const aiL = waterL;
  const moneySaved = Math.round(savedL * 0.04);

  const factors = [
    { key: "Rain probability", value: `${rain}%`, weight: rain },
    { key: "Soil moisture", value: `${moisture}%`, weight: moisture },
    { key: "Crop", value: c.name, weight: 50 },
    { key: "Growth stage", value: c.stage, weight: 40 },
    { key: "Temperature", value: `${w.temp}°C`, weight: w.temp },
    { key: "Market signal", value: `₹${market?.tomato ?? marketBase.tomato}/kg`, weight: 20 },
  ];

  const reason = `Rain probability ${rain}% + soil moisture ${moisture}% + ${c.name} → ${rec}${savedL ? ` → ${savedL}L water saved` : ""}.`;

  const impact = {
    waterSavedL: savedL,
    moneySaved,
    yieldLiftPct: action === "delay" ? 3.2 : 1.4,
    co2Kg: +(savedL * 0.0004).toFixed(2),
    traditionalL,
    aiL,
  };

  return {
    id: `rec-${Date.now()}`,
    recommendation: rec,
    action,
    delayHours,
    reason,
    factors,
    impact,
    crop: c,
    weather: w,
    soil: { ...s, moisture },
    iot: { ...i, moisture, pump: action === "irrigate" },
    market: { ...marketBase, ...market },
    nextIrrigation: action === "delay" ? `${delayHours}h` : action === "irrigate" ? "Now" : "48h",
    waterRequiredL: aiL,
  };
}

export function getIrrigationRecommendation(ctx) {
  return generateFarmRecommendation(ctx);
}

export function analyzeSoil(soil = {}) {
  const s = { ...soilBase, ...soil };
  const health = Math.round(
    Math.max(20, Math.min(98, 100 - Math.abs(s.ph - 6.5) * 12 + s.oc * 18 + (s.n + s.p + s.k) / 8 - Math.abs(s.moisture - 40) * 0.4))
  );
  const recs = [];
  if (s.n < 40) recs.push("soil.urea");
  if (s.p < 25) recs.push("soil.dap");
  if (s.k < 30) recs.push("soil.mop");
  if (s.ph < 6) recs.push("soil.lime");
  if (s.ph > 7.5) recs.push("soil.gypsum");
  if (!recs.length) recs.push("soil.ok");
  return { ...s, health, recs };
}

export function predictYield({ crop = "Tomato", area = 4.5, health = 78, moisture = 38 } = {}) {
  const base = { Tomato: 22, Wheat: 18, Potato: 26 }[crop] || 20;
  const adj = (health - 70) * 0.08 + (40 - Math.abs(moisture - 40)) * 0.03;
  const mid = +(base + adj).toFixed(1);
  return {
    crop,
    area,
    tPerAcre: mid,
    totalT: +(mid * area).toFixed(1),
    range: [+(mid * 0.9).toFixed(1), +(mid * 1.08).toFixed(1)],
    confidence: Math.min(92, 70 + Math.round(health / 8)),
  };
}

const diseases = [
  { nameKey: "dis.early", crop: "Tomato", severityKey: "dis.med", conf: 86, symptomsKey: "dis.earlyS", causesKey: "dis.earlyC", actionKeys: ["dis.a1", "dis.a2", "dis.a3"] },
  { nameKey: "dis.late", crop: "Tomato", severityKey: "dis.high", conf: 81, symptomsKey: "dis.lateS", causesKey: "dis.lateC", actionKeys: ["dis.a4", "dis.a5"] },
  { nameKey: "dis.healthy", crop: "Tomato", severityKey: "dis.low", conf: 91, symptomsKey: "dis.healthyS", causesKey: "dis.healthyC", actionKeys: ["dis.a6"] },
];

export function analyzeCropImage(meta = {}) {
  const pick = diseases[Math.floor(Math.random() * diseases.length)];
  return {
    id: `scan-${Date.now()}`,
    at: Date.now(),
    ...pick,
    fieldKey: "ui.field",
    crop: pick.crop || "Tomato",
    disclaimerKey: "dis.note",
  };
}

export function answerFarmQuestion(q, rec) {
  const t = (q || "").toLowerCase();
  if (/pani|paani|irrigat|water|सिंचाई/.test(t)) {
    return rec.reason;
  }
  if (/bimaar|disease|doctor|blight/.test(t)) {
    return { kind: "disease", n: rec.crop.diseaseRisk, crop: rec.crop.name };
  }
  if (/bech|sell|mandi|price|bhav/.test(t)) {
    return { kind: "sell", n: rec.market.tomato, trend: rec.market.trend };
  }
  if (/khad|fertil|npk|soil/.test(t)) {
    const s = analyzeSoil(rec.soil);
    return { kind: "soil", n: s.health, rec: s.recs[0] };
  }
  return rec.reason;
}

export function profitSim({ area = 4.5, crop = "Tomato", cost = 38000, yieldT, price = 28 } = {}) {
  const y = yieldT || predictYield({ crop, area }).totalT;
  const revenue = y * 1000 * price;
  const totalCost = cost * area;
  const profit = revenue - totalCost;
  const optCost = totalCost * 0.91;
  const optYield = y * 1.06;
  const optRev = optYield * 1000 * (price + 1);
  return {
    traditional: { cost: totalCost, revenue, profit, perAcre: profit / area },
    farmsense: { cost: optCost, revenue: optRev, profit: optRev - optCost, perAcre: (optRev - optCost) / area },
    y,
  };
}

export const schemes = [
  { id: "pmksy", name: "PMKSY — Per Drop More Crop", benefit: "55% drip subsidy", eligibility: "Small/marginal farmers", docs: "Aadhaar, land record, bank", cat: "irrigation" },
  { id: "pmfby", name: "PM Fasal Bima Yojana", benefit: "Crop insurance at low premium", eligibility: "Notified crops", docs: "Sowing certificate", cat: "insurance" },
  { id: "kcc", name: "Kisan Credit Card", benefit: "Short-term credit @ concessional rate", eligibility: "Land owning / tenant", docs: "KYC, land papers", cat: "credit" },
  { id: "smam", name: "Sub-Mission on Agri Mechanisation", benefit: "40–50% machinery subsidy", eligibility: "FPOs / farmers", docs: "Invoice, Aadhaar", cat: "machines" },
  { id: "uk-soil", name: "Uttarakhand Soil Health Card", benefit: "Free soil test + advisory", eligibility: "State farmers", docs: "Aadhaar", cat: "soil" },
];

export const fields = [
  { id: "a", name: "Field A", crop: "Tomato", area: 1.8, health: 78, moisture: 38, risk: 34, x: "12%", y: "18%", w: "34%", h: "28%" },
  { id: "b", name: "Field B", crop: "Wheat", area: 1.6, health: 84, moisture: 44, risk: 12, x: "50%", y: "22%", w: "36%", h: "30%" },
  { id: "c", name: "Field C", crop: "Potato", area: 1.1, health: 71, moisture: 41, risk: 22, x: "22%", y: "56%", w: "40%", h: "26%" },
];
