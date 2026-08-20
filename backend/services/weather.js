import { weatherBase } from "./decision.js";

export async function getWeather({ lat = 30.3165, lon = 78.0322, q } = {}) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return { ...weatherBase, source: "fallback", lat, lon };
  const url = q
    ? `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&appid=${key}`
    : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
  const res = await fetch(url);
  if (!res.ok) return { ...weatherBase, source: "fallback", lat, lon };
  const d = await res.json();
  return {
    temp: Math.round(d.main.temp),
    humidity: d.main.humidity,
    rainProb: Math.min(100, Math.round((d.clouds?.all || 40) * 0.9)),
    rainMm: d.rain?.["1h"] || 0,
    wind: Math.round(d.wind?.speed || 0),
    condition: d.weather?.[0]?.description || weatherBase.condition,
    source: "openweather",
    lat: d.coord?.lat ?? lat,
    lon: d.coord?.lon ?? lon,
    location: d.name,
  };
}

export async function getForecast({ lat = 30.3165, lon = 78.0322 } = {}) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    return Array.from({ length: 7 }, (_, i) => ({ d: `D${i + 1}`, rain: 8 + i * 3, temp: 28 + (i % 3), humidity: 65 + i }));
  }
  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`);
  if (!res.ok) return [];
  const d = await res.json();
  return (d.list || []).slice(0, 16).map((x, i) => ({
    d: `T${i + 1}`,
    rain: x.pop ? Math.round(x.pop * 100) : 0,
    temp: Math.round(x.main.temp),
    humidity: x.main.humidity,
  }));
}
