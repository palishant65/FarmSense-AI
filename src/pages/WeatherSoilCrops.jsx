import { useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { useFarm } from "../context/FarmContext";
import { analyzeSoil, predictYield, fields } from "../services/decisionEngine";
import { cropKey, stageKey } from "../i18n";
import { aiApi, getToken } from "../services/api";
import tomato from "../assets/tomato.jpg";
import wheat from "../assets/wheat.jpg";
import potato from "../assets/potato.jpg";
import soilImg from "../assets/soil.jpg";
import hero from "../assets/hero-farm.jpg";

const week = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ d: `D${d + 1}`, rain: 8 + d * 3, moist: 32 + d, health: 70 + d }));

export function Weather() {
  const { rec, weather, setState, forecast, t = (k) => k } = useFarm();
  const chartData = Array.isArray(forecast) && forecast.length ? forecast : week;
  return (
    <div className="grid">
      <h2>{t("wx.title")}</h2>
      <div className="grid g-4">
        {[[t("ui.temp"), `${weather.temp}°C`], [t("ui.rainChance"), `${weather.rainProb}%`], [t("ui.humid"), `${weather.humidity}%`], [t("ui.wind"), `${weather.wind} km/h`]].map(([k, v]) => (
          <div className="card" key={k}><div className="muted">{k}</div><div className="kpi">{v}</div></div>
        ))}
      </div>
      <div className="card">
        <h3>{t("ui.action")}</h3>
        <p>{rec.reason}</p>
        <label>{t("ui.simRain")}
          <input type="range" min="0" max="100" value={weather.rainProb} onChange={(e) => setState((s) => ({ ...s, weatherOverride: { ...weather, rainProb: +e.target.value } }))} />
        </label>
      </div>
      <div className="card" style={{ height: 260 }}>
        <ResponsiveContainer><LineChart data={chartData}><XAxis dataKey="d" /><YAxis /><Tooltip /><Line dataKey="rain" stroke="#1b5e3b" /></LineChart></ResponsiveContainer>
      </div>
    </div>
  );
}

export function Soil() {
  const { rec, setState, t = (k) => k } = useFarm();
  const s = analyzeSoil(rec.soil);
  return (
    <div className="grid">
      <h2>{t("soil.title")}</h2>
      <img className="photo lg" src={soilImg} alt="" />
      <div className="grid g-4">
        {[["pH", s.ph], ["N", s.n], ["P", s.p], ["K", s.k], [t("ui.oc"), s.oc], [t("dash.moisture"), `${s.moisture}%`], [t("ui.health"), s.health]].map(([k, v]) => (
          <div className="card" key={k}><div className="muted">{k}</div><div className="kpi">{v}</div></div>
        ))}
      </div>
      <div className="card">
        <h3>{t("ui.fert")}</h3>
        <ul>{s.recs.map((r) => <li key={r}>{t(r)}</li>)}</ul>
        <button className="btn ghost" onClick={() => {
          setState((st) => {
            const moisture = Math.max(15, st.sensors.moisture - 5);
            const next = { ...st, sensors: { ...st.sensors, moisture } };
            if (getToken()) aiApi.soil({ ...rec.soil, moisture }).catch(() => {});
            return next;
          });
        }}>{t("ui.dry")}</button>
      </div>
      <div className="card" style={{ height: 260 }}>
        <ResponsiveContainer><BarChart data={[{ n: s.n, p: s.p, k: s.k }]}><Tooltip /><Bar dataKey="n" fill="#1b5e3b" /><Bar dataKey="p" fill="#7dcea0" /><Bar dataKey="k" fill="#2d7a4f" /></BarChart></ResponsiveContainer>
      </div>
    </div>
  );
}

export function Crops() {
  const { rec, t = (k) => k } = useFarm();
  const cards = [
    { name: "Tomato", health: 78, moisture: rec.soil.moisture, risk: 34, stage: "Fruit set", img: tomato },
    { name: "Wheat", health: 84, moisture: 44, risk: 12, stage: "Tillering", img: wheat },
    { name: "Potato", health: 71, moisture: 41, risk: 22, stage: "Tuber bulking", img: potato },
  ];
  return (
    <div className="grid">
      <h2>{t("crops.title")}</h2>
      <div className="grid g-3">
        {cards.map((c) => {
          const y = predictYield({ crop: c.name, health: c.health, moisture: c.moisture });
          return (
            <div className="card" key={c.name}>
              <img className="photo" src={c.img} alt={c.name} />
              <h3>{t(cropKey(c.name))}</h3>
              <p>{t("ui.health")} {c.health} · {t("dash.moisture")} {c.moisture}% · {t("ui.risk")} {c.risk}%</p>
              <p>{t("ui.stage")}: {t(stageKey(c.stage))}</p>
              <p>{t("nav.irrigation")}: {rec.recommendation}</p>
              <p>{t("ui.yield")} {y.tPerAcre} t/acre ({y.range.join("–")}) · {y.confidence}% {t("ui.conf")}</p>
              <div className="progress"><span style={{ width: `${c.stage === "Fruit set" ? 62 : 48}%` }} /></div>
              <p className="muted">{t("ui.timeline")}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FarmMap() {
  const { rec, addTask, t = (k) => k } = useFarm();
  const [sel, setSel] = useState(fields[0]);
  return (
    <div className="grid">
      <h2>{t("map.title")}</h2>
      <div className="map" style={{ backgroundImage: `url(${hero})`, backgroundSize: "cover" }}>
        {fields.map((f) => (
          <div key={f.id} className="plot" style={{ left: f.x, top: f.y, width: f.w, height: f.h }} onClick={() => setSel(f)}>
            <b>{f.name}</b><br />{t(cropKey(f.crop))}
          </div>
        ))}
      </div>
      {sel && (
        <div className="card">
          <h3>{sel.name} · {t(cropKey(sel.crop))} · {sel.area} ac</h3>
          <p>{t("ui.health")} {sel.health} · {t("dash.moisture")} {sel.moisture}% · {t("ui.risk")} {sel.risk}%</p>
          <p>{t("nav.irrigation")}: {rec.recommendation}</p>
          <button className="btn" onClick={() => addTask({ title: t("ui.scout", { name: sel.name }), due: new Date().toISOString().slice(0, 10), type: "crop" })}>{t("btn.addTasks")}</button>
        </div>
      )}
    </div>
  );
}