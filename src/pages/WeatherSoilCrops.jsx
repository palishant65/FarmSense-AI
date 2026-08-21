import { useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { useFarm } from "../context/FarmContext";
import { analyzeSoil, predictYield, fields } from "../services/decisionEngine";
import { cropKey, stageKey } from "../i18n";
import { aiApi, getToken } from "../services/api";
// USE YOUR LOCAL ASSETS - soil.jpg and potato.jpg from src/assets
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
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12}}>
        <div>
          <h2 style={{margin:0, fontSize:28, fontWeight:800}}>⛅ {t("wx.title")}</h2>
          <p className="muted">Live weather + irrigation advisory</p>
        </div>
        <span className="tag info">🌧️ {weather.rainProb}% rain chance</span>
      </div>
      <div className="grid g-4">
        {[
          [t("ui.temp"), `${weather.temp}°C`, "🌡️"],
          [t("ui.rainChance"), `${weather.rainProb}%`, "🌧️"],
          [t("ui.humid"), `${weather.humidity}%`, "💧"],
          [t("ui.wind"), `${weather.wind} km/h`, "💨"]
        ].map(([k, v, icon]) => (
          <div className="card" key={k} style={{padding:16}}>
            <div style={{display:'flex', justifyContent:'space-between'}}><span className="muted" style={{fontSize:11, fontWeight:700, textTransform:'uppercase'}}>{k}</span><span>{icon}</span></div>
            <div className="kpi" style={{fontSize:22, marginTop:8}}>{v}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{borderLeft:'4px solid var(--info)'}}>
        <h3 style={{marginTop:0}}>💡 {t("ui.action")}</h3>
        <p className="muted">{rec.reason}</p>
      </div>
      <div className="card" style={{ height: 300 }}>
        <h4 style={{margin:'0 0 12px'}}>📈 Rain Forecast</h4>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={chartData}>
            <XAxis dataKey="d" tick={{fontSize:11}} />
            <YAxis tick={{fontSize:11}} />
            <Tooltip />
            <Line dataKey="rain" stroke="#1b5e3b" strokeWidth={2.5} dot={{r:4, fill:'#1b5e3b'}} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Soil() {
  const { rec, setState, t = (k) => k } = useFarm();
  const s = analyzeSoil(rec.soil);
  return (
    <div className="grid">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{margin:0, fontSize:28, fontWeight:800}}>🌍 {t("soil.title")}</h2>
        <span className="tag ok">pH {s.ph} • Healthy</span>
      </div>
      <div className="card" style={{padding:0, overflow:'hidden', position:'relative'}}>
        <img className="photo lg" src={soilImg} alt="Soil - hands holding fertile soil" style={{borderRadius:'18px 18px 0 0', display:'block', width:'100%', height:260, objectFit:'cover'}} />
        <div style={{position:'absolute', top:16, left:16}}><span className="tag" style={{background:'rgba(0,0,0,0.65)', color:'white'}}>🧪 Soil Scan</span></div>
      </div>
      <div className="grid g-4">
        {[
          ["pH", s.ph, "🧪"],
          ["N", s.n, "N"],
          ["P", s.p, "P"],
          ["K", s.k, "K"],
          [t("ui.oc"), s.oc, "🌿"],
          [t("dash.moisture"), `${s.moisture}%`, "💧"],
          [t("ui.health"), s.health, "❤️"]
        ].map(([k, v, icon]) => (
          <div className="card" key={k} style={{padding:16, textAlign:'center'}}>
            <div style={{width:36, height:36, borderRadius:10, background:'var(--mint-soft)', display:'grid', placeItems:'center', margin:'0 auto 8px', fontWeight:800, color:'var(--forest)'}}>{icon}</div>
            <div className="muted" style={{fontSize:11, fontWeight:700, textTransform:'uppercase'}}>{k}</div>
            <div className="kpi" style={{fontSize:20}}>{v}</div>
          </div>
        ))}
      </div>
      <div className="grid g-2">
        <div className="card" style={{borderLeft:'4px solid var(--ok)'}}>
          <h3 style={{marginTop:0}}>🌱 {t("ui.fert")}</h3>
          <ul style={{marginTop:10, paddingLeft:18, lineHeight:1.7, fontSize:14}}>{s.recs.map((r) => <li key={r}>{t(r)}</li>)}</ul>
        </div>
        <div className="card" style={{ height: 280 }}>
          <h4 style={{margin:'0 0 12px'}}>📊 N-P-K Levels</h4>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={[{ n: s.n, p: s.p, k: s.k }]}>
              <XAxis dataKey="name" />
              <Tooltip />
              <Bar dataKey="n" fill="#1b5e3b" radius={[8,8,0,0]} name="Nitrogen" />
              <Bar dataKey="p" fill="#7dcea0" radius={[8,8,0,0]} name="Phosphorus" />
              <Bar dataKey="k" fill="#2d7a4f" radius={[8,8,0,0]} name="Potassium" />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{margin:0, fontSize:28, fontWeight:800}}>🌾 {t("crops.title")}</h2>
        <span className="tag ok">3 crops active</span>
      </div>
      <div className="grid g-3">
        {cards.map((c) => {
          const y = predictYield({ crop: c.name, health: c.health, moisture: c.moisture });
          return (
            <div className="card" key={c.name} style={{padding:0, overflow:'hidden'}}>
              <div style={{position:'relative'}}>
                <img className="photo" src={c.img} alt={c.name} style={{height:160, width:'100%', objectFit:'cover', display:'block', borderRadius:'18px 18px 0 0'}} />
                <div style={{position:'absolute', top:12, left:12, display:'flex', gap:6}}>
                  <span className="tag" style={{background:'white'}}>{c.health}% health</span>
                  <span className={`tag ${c.risk>30 ? 'warn' : 'ok'}`}>{c.risk}% risk</span>
                </div>
              </div>
              <div style={{padding:18}}>
                <h3 style={{margin:'0 0 6px'}}>{t(cropKey(c.name))}</h3>
                <p className="muted" style={{fontSize:12}}>Health {c.health} · Moisture {c.moisture}% · Risk {c.risk}%</p>
                <p className="muted" style={{fontSize:12}}>Stage: <b>{t(stageKey(c.stage))}</b></p>
                <div style={{marginTop:12, padding:12, background:'var(--cream)', borderRadius:12, border:'1px solid var(--line)'}}>
                  <small className="muted" style={{fontSize:10, fontWeight:700, textTransform:'uppercase'}}>Irrigation</small>
                  <p style={{margin:'4px 0 0', fontSize:13, fontWeight:600}}>{rec.recommendation}</p>
                  <small className="muted">Yield {y.tPerAcre} t/acre ({y.range.join("–")}) · {y.confidence}% conf</small>
                  <div className="progress" style={{marginTop:8, height:6}}><span style={{ width: `${c.stage === "Fruit set" ? 62 : 48}%` }} /></div>
                </div>
              </div>
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
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{margin:0, fontSize:28, fontWeight:800}}>🗺️ {t("map.title")}</h2>
        <span className="tag info">📡 {fields.length} plots mapped</span>
      </div>
      <div className="map" style={{ backgroundImage: `url(${hero})`, backgroundSize: "cover" }}>
        {fields.map((f) => (
          <div key={f.id} className="plot" style={{ left: f.x, top: f.y, width: f.w, height: f.h }} onClick={() => setSel(f)}>
            <b>{f.name}</b><br />{t(cropKey(f.crop))}<br/><small>{f.area} ac</small>
          </div>
        ))}
      </div>
      {sel && (
        <div className="card" style={{borderLeft:'4px solid var(--forest)'}}>
          <h3 style={{margin:'0 0 6px'}}>{sel.name} · {t(cropKey(sel.crop))} · {sel.area} ac</h3>
          <p className="muted">Health {sel.health} · Moisture {sel.moisture}% · Risk {sel.risk}%</p>
          <p style={{marginTop:10}}>Irrigation: <b>{rec.recommendation}</b></p>
          <button className="btn" onClick={() => addTask({ title: t("ui.scout", { name: sel.name }), due: new Date().toISOString().slice(0, 10), type: "crop" })}>➕ {t("btn.addTasks")}</button>
        </div>
      )}
    </div>
  );
}