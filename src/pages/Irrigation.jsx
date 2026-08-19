import { useFarm } from "../context/FarmContext";
import drip from "../assets/drip.jpg";

export default function Irrigation() {
  const { rec, addTask, setState, toast } = useFarm();
  const setMode = (mode) => {
    if (mode === "now") {
      setState((s) => ({ ...s, sensors: { ...s.sensors, pump: true, moisture: Math.min(70, s.sensors.moisture + 8) } }));
      toast("Pump ON — irrigating now");
    } else if (mode === "delay") {
      setState((s) => ({ ...s, sensors: { ...s.sensors, pump: false } }));
      toast("Irrigation delayed per AI");
    } else {
      toast("AI optimize scheduled for 5:30 AM");
    }
  };
  return (
    <div className="grid">
      <h2>Smart Irrigation</h2>
      <img className="photo lg" src={drip} alt="Drip lines" />
      <div className="grid g-4">
        {[
          ["Soil moisture", `${rec.soil.moisture}%`],
          ["Rain probability", `${rec.weather.rainProb}%`],
          ["Temperature", `${rec.weather.temp}°C`],
          ["Crop need", `${rec.crop.waterNeedMm} mm`],
          ["Next irrigation", rec.nextIrrigation],
          ["Water required", `${rec.waterRequiredL} L`],
        ].map(([k, v]) => (
          <div className="card" key={k}><div className="muted">{k}</div><div className="kpi">{v}</div></div>
        ))}
      </div>
      <div className="card">
        <h3>Decision: {rec.recommendation}</h3>
        <p>{rec.reason}</p>
        <div className="row">
          <button className="btn" onClick={() => setMode("now")}>Irrigate Now</button>
          <button className="btn ghost" onClick={() => setMode("delay")}>Delay</button>
          <button className="btn ghost" onClick={() => setMode("ai")}>AI Optimize</button>
          <button className="btn ghost" onClick={() => addTask({ title: rec.recommendation, due: new Date().toISOString().slice(0, 10), type: "irrigation" })}>Add to Tasks</button>
        </div>
      </div>
      <div className="grid g-3">
        <div className="card"><div className="muted">Traditional water</div><div className="kpi">{rec.impact.traditionalL} L</div></div>
        <div className="card"><div className="muted">FarmSense water</div><div className="kpi">{rec.impact.aiL} L</div></div>
        <div className="card"><div className="muted">Saved</div><div className="kpi">{rec.impact.waterSavedL} L · ₹{rec.impact.moneySaved}</div></div>
      </div>
    </div>
  );
}