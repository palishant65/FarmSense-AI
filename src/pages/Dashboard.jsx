import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "../context/FarmContext";
import hero from "../assets/hero-farm.jpg";
import tomato from "../assets/tomato.jpg";
import drip from "../assets/drip.jpg";
import leaf from "../assets/leaf.jpg";

export default function Dashboard() {
  const { rec, addTask, state } = useFarm();
  const [why, setWhy] = useState(true);
  const nav = useNavigate();
  return (
    <div className="grid">
      <div className="hero">
        <img className="hero-bg" src={hero} alt="" />
        <div className="hero-inner">
          <div className="tag">Today’s Farm Decision</div>
          <h2 style={{ margin: "10px 0 6px", fontSize: 30 }}>{rec.recommendation}</h2>
          <p style={{ opacity: 0.95, maxWidth: 720 }}>{rec.reason}</p>
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
          <img className="photo" src={drip} alt="Drip irrigation" />
          <h3>Smart irrigation</h3>
          <p className="muted">Judge path starts here after the decision card.</p>
          <button className="btn" onClick={() => nav("/irrigation")}>Open</button>
        </div>
        <div className="card">
          <img className="photo" src={tomato} alt="Tomato crop" />
          <h3>{state.farm.farmer}</h3>
          <p>{state.farm.area} acres · {state.farm.crops.join(", ")}</p>
          <button className="btn ghost" onClick={() => nav("/farm")}>Profile</button>
        </div>
        <div className="card">
          <img className="photo" src={leaf} alt="Leaf scan" />
          <h3>Crop Doctor</h3>
          <p className="muted">Scan a leaf or use the demo image.</p>
          <button className="btn ghost" onClick={() => nav("/doctor")}>Scan</button>
        </div>
      </div>
    </div>
  );
}