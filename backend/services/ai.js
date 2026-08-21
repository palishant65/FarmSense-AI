import { analyzeSoil, analyzeCropImage, generateFarmRecommendation, answerFarmQuestion, predictYield } from "./decision.js";

const provider = () => process.env.AI_PROVIDER || "local";

async function openaiChat(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], temperature: 0.3 }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.choices?.[0]?.message?.content || null;
}

export async function soilAnalysis(input) {
  const local = analyzeSoil(input);
  if (provider() !== "openai") return { ...local, provider: "local" };
  const extra = await openaiChat(`Soil NPK advisory JSON for ${JSON.stringify(input)}`);
  return { ...local, provider: "openai", extra };
}

export async function cropRecommendation(ctx) {
  return { ...generateFarmRecommendation(ctx), provider: provider() };
}

export async function diseaseDetection(meta) {
  return { ...analyzeCropImage(meta), provider: provider() };
}

export async function copilotAnswer(question, rec) {
  const hit = answerFarmQuestion(question, rec || {});
  if (provider() === "openai") {
    const text = await openaiChat(`Farm copilot. Intent: ${hit.kind}. Use only given farm data. Decision: ${rec?.reason || "n/a"}. Question: ${question}. Answer this intent only; never give an irrigation answer unless intent is irrigate.`);
    if (text) return { ...hit, text, provider: "openai" };
  }
  return { ...hit, provider: "local" };
}

export async function yieldPredict(input) {
  return { ...predictYield(input), provider: provider() };
}
