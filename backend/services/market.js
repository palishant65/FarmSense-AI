import { marketBase } from "./decision.js";

export async function getMandiPrices() {
  const url = process.env.MARKET_API_URL;
  const key = process.env.MARKET_API_KEY;
  if (url) {
    try {
      const res = await fetch(url, { headers: key ? { Authorization: `Bearer ${key}` } : {} });
      if (res.ok) return { ...(await res.json()), source: "external" };
    } catch {
      /* fall through */
    }
  }
  return { ...marketBase, source: "fallback" };
}
