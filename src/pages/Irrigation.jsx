import { useFarm } from "../context/FarmContext";
import drip from "../assets/drip.jpg";
import { farmApi, getToken } from "../services/api";

export default function Irrigation() {
  const { rec, addTask, setState, toast, t = (k) => k } = useFarm();
  const setMode = (mode) => {
    if (mode === "now") {
      setState((s) => {
        const sensors = { ...s.sensors, pump: true, moisture: Math.min(70, s.sensors.moisture + 8) };
        if (getToken()) farmApi.sensors(sensors).catch(() => {});
        return { ...s, sensors };
      });
      toast(t("ui.pumpOn"));
    } else if (mode === "delay") {
      setState((s) => {
        const sensors = { ...s.sensors, pump: false };
        if (getToken()) farmApi.sensors(sensors).catch(() => {});
        return { ...s, sensors };
      });
      toast(t("ui.pumpDelay"));
    } else {
      toast(t("ui.pumpAi"));
    }
  };
  return (
    <div className="grid">
      <h2>{t("irr.title")}</h2>
      <img className="photo lg" src={drip} alt="Drip lines" />
      <div className="grid g-4">
        {[
          [t("irr.moist"), `${rec.soil.moisture}%`],
          [t("irr.rain"), `${rec.weather.rainProb}%`],
          [t("irr.temp"), `${rec.weather.temp}°C`],
          [t("irr.need"), `${rec.crop.waterNeedMm} mm`],
          [t("irr.next"), rec.nextIrrigation],
          [t("irr.needL"), `${rec.waterRequiredL} L`],
        ].map(([k, v]) => (
          <div className="card" key={k}><div className="muted">{k}</div><div className="kpi">{v}</div></div>
        ))}
      </div>
      <div className="card">
        <h3>{t("ui.decision")}: {rec.recommendation}</h3>
        <p>{rec.reason}</p>
        <div className="row">
          <button className="btn" onClick={() => setMode("now")}>{t("irr.now")}</button>
          <button className="btn ghost" onClick={() => setMode("delay")}>{t("irr.delay")}</button>
          <button className="btn ghost" onClick={() => setMode("ai")}>{t("irr.ai")}</button>
          <button className="btn ghost" onClick={() => addTask({ title: rec.recommendation, due: new Date().toISOString().slice(0, 10), type: "irrigation" })}>{t("btn.addTasks")}</button>
        </div>
      </div>
      <div className="grid g-3">
        <div className="card"><div className="muted">{t("ui.trad")}</div><div className="kpi">{rec.impact.traditionalL} L</div></div>
        <div className="card"><div className="muted">{t("ui.fsWater")}</div><div className="kpi">{rec.impact.aiL} L</div></div>
        <div className="card"><div className="muted">{t("ui.saved")}</div><div className="kpi">{rec.impact.waterSavedL} L · ₹{rec.impact.moneySaved}</div></div>
      </div>
    </div>
  );
}