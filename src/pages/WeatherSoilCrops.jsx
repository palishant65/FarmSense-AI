import { useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { useFarm } from "../context/FarmContext";
import { analyzeSoil, predictYield, fields } from "../services/decisionEngine";
import tomato from "../assets/tomato.jpg";
import wheat from "../assets/wheat.jpg";
import potato from "../assets/potato.jpg";
import soilImg from "../assets/soil.jpg";
import hero from "../assets/hero-farm.jpg";

const week = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ d: `D${d + 1}`, rain: 8 + d * 3, moist: 32 + d, health: 70 + d }));

export function Weather() {
  const { rec, weather, setState } = useFarm();
  return (
    <div className="grid">
      <h2>Weather → Farm actions</h2>
      <div className="grid g-4">
        {[["Temp", `${weather.temp}°C`], ["Rain chance", `${weather.rainProb}%`], ["Humidity", `${weather.humidity}%`], ["Wind", `${weather.wind} km/h`]].map(([k, v]) => (
          <div className="card" key={k}><div className="muted">{k}</div><div className="kpi">{v}</div></div>
        ))}
      </div>
      <div className="card">
        <h3>Action from Decision Engine</h3>
        <p>{rec.reason}</p>
        <label>Simulate rain probability
          <input type="range" min="0" max="100" value={weather.rainProb} onChange={(e) => setState((s) => ({ ...s, weatherOverride: { ...weather, rainProb: +e.target.value } }))} />
        </label>
      </div>
      <div className="card" style={{ height: 260 }}>
        <ResponsiveContainer><LineChart data={week}><XAxis dataKey="d" /><YAxis /><Tooltip /><Line dataKey="rain" stroke="#1b5e3b" /></LineChart></ResponsiveContainer>
      </div>
    </div>
  );
}

export function Soil() {
  const { rec, setState } = useFarm();
  const s = analyzeSoil(rec.soil);
  return (
    <div className="grid">
      <h2>Soil intelligence</h2>
      <img className="photo lg" src={soilImg} alt="Soil sample" />
      <div className="grid g-4">
        {[["pH", s.ph], ["N", s.n], ["P", s.p], ["K", s.k], ["OC %", s.oc], ["Moisture", `${s.moisture}%`], ["Health", s.health]].map(([k, v]) => (
          <div className="card" key={k}><div className="muted">{k}</div><div className="kpi">{v}</div></div>
        ))}
      </div>
      <div className="card">
        <h3>Fertilizer recommendation</h3>
        <ul>{s.recs.map((r) => <li key={r}>{r}</li>)}</ul>
        <button className="btn ghost" onClick={() => setState((st) => ({ ...st, sensors: { ...st.sensors, moisture: Math.max(15, st.sensors.moisture - 5) } }))}>Simulate drier soil</button>
      </div>
      <div className="card" style={{ height: 260 }}>
        <ResponsiveContainer><BarChart data={[{ n: s.n, p: s.p, k: s.k }]}><Tooltip /><Bar dataKey="n" fill="#1b5e3b" /><Bar dataKey="p" fill="#7dcea0" /><Bar dataKey="k" fill="#2d7a4f" /></BarChart></ResponsiveContainer>
      </div>
    </div>
  );
}

export function Crops() {
  const { rec } = useFarm();
  const cards = [
    { name: "Tomato", health: 78, moisture: rec.soil.moisture, risk: 34, stage: "Fruit set", img: tomato },
    { name: "Wheat", health: 84, moisture: 44, risk: 12, stage: "Tillering", img: wheat },
    { name: "Potato", health: 71, moisture: 41, risk: 22, stage: "Tuber bulking", img: potato },
  ];
  return (
    <div className="grid">
      <h2>Crops & yield</h2>
      <div className="grid g-3">
        {cards.map((c) => {
          const y = predictYield({ crop: c.name, health: c.health, moisture: c.moisture });
          return (
            <div className="card" key={c.name}>
              <img className="photo" src={c.img} alt={c.name} />
              <h3>{c.name}</h3>
              <p>Health {c.health} · Moisture {c.moisture}% · Risk {c.risk}%</p>
              <p>Stage: {c.stage}</p>
              <p>Irrigation: {rec.recommendation}</p>
              <p>Yield {y.tPerAcre} t/acre ({y.range.join("–")}) · {y.confidence}% conf</p>
              <div className="progress"><span style={{ width: `${c.stage === "Fruit set" ? 62 : 48}%` }} /></div>
              <p className="muted">Growth timeline: transplant → veg → flower → fruit → harvest</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FarmMap() {
  const { rec, addTask } = useFarm();
  const [sel, setSel] = useState(fields[0]);
  return (
    <div className="grid">
      <h2>Farm map</h2>
      <div className="map" style={{ backgroundImage: `url(${hero})`, backgroundSize: "cover" }}>
        {fields.map((f) => (
          <div key={f.id} className="plot" style={{ left: f.x, top: f.y, width: f.w, height: f.h }} onClick={() => setSel(f)}>
            <b>{f.name}</b><br />{f.crop}
          </div>
        ))}
      </div>
      {sel && (
        <div className="card">
          <h3>{sel.name} · {sel.crop} · {sel.area} ac</h3>
          <p>Health {sel.health} · Moisture {sel.moisture}% · Disease {sel.risk}%</p>
          <p>Irrigation action: {rec.recommendation}</p>
          <button className="btn" onClick={() => addTask({ title: `Scout ${sel.name}`, due: new Date().toISOString().slice(0, 10), type: "crop" })}>Add to Tasks</button>
        </div>
      )}
    </div>
  );
}