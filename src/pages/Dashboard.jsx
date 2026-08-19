import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "../context/FarmContext";

export default function Dashboard() {
  const { rec, addTask, state } = useFarm();
  const [why, setWhy] = useState(true);
  const nav = useNavigate();
  return (
    <div className="grid">
      <div className="hero">
        <div className="tag">Today’s Farm Decision</div>
        <h2 style={{ margin: "10px 0 6px", fontSize: 30 }}>{rec.recommendation}</h2>
        <p style={{ opacity: 0.9, maxWidth: 720 }}>{rec.reason}</p>
        <div className="row" style={{ marginTop: 16 }}>
          <span className="tag">{rec.crop.name}</span>
          <span className="tag">Rain {rec.weather.rainProb}%</span>
          <span className="tag">Moisture {rec.soil.moisture}%</span>
          <span className="tag">{rec.impact.waterSavedL}L saved</span>
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn" onClick={() => nav("/irrigation")}>Open irrigation</button>
          <button className="btn ghost" onClick={() => addTask({ title: rec.recommendation, due: new Date().toISOString().slice(0, 10), type: "irrigation" })}>
            Add to Tasks
          </button>
          <button className="btn ghost" onClick={() => setWhy((w) => !w)}>Why?</button>
        </div>
      </div>
      {why && (
        <div className="card">
          <h3>Why this decision?</h3>
          <p className="muted">FarmSense Decision Engine fused weather, soil, crop, IoT and market signals.</p>
          <div className="grid g-3">
            {rec.factors.map((f) => (
              <div key={f.key} className="card" style={{ boxShadow: "none" }}>
                <div className="muted">{f.key}</div>
                <div className="kpi" style={{ fontSize: 22 }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid g-4">
        {[
          ["Water saved", `${rec.impact.waterSavedL} L`],
          ["₹ saved", `₹${rec.impact.moneySaved}`],
          ["Next irrigation", rec.nextIrrigation],
          ["Pump", rec.iot.pump ? "ON" : "WAIT / OFF"],
        ].map(([k, v]) => (
          <div className="card" key={k}>
            <div className="muted">{k}</div>
            <div className="kpi">{v}</div>
          </div>
        ))}
      </div>
      <div className="grid g-3">
        <div className="card">
          <h3>Demo walkthrough</h3>
          <p className="muted">Judge path: Dashboard → Irrigation → Doctor → Weather → Soil → Market → Copilot → Impact</p>
          <button className="btn" onClick={() => nav("/irrigation")}>Start demo</button>
        </div>
        <div className="card">
          <h3>Farm</h3>
          <p>{state.farm.farmer} · {state.farm.area} acres · {state.farm.crops.join(", ")}</p>
          <button className="btn ghost" onClick={() => nav("/farm")}>Profile</button>
        </div>
        <div className="card">
          <h3>Copilot preview</h3>
          <p>“Kal paani dena chahiye?”</p>
          <p><b>{rec.reason}</b></p>
        </div>
      </div>
    </div>
  );
}
