import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "../context/FarmContext";
import { cropKey } from "../i18n";
import hero from "../assets/hero-farm.jpg";
import tomato from "../assets/tomato.jpg";
import drip from "../assets/drip.jpg";
import leaf from "../assets/leaf.jpg";

export default function Dashboard() {
  const { rec, addTask, state, t = (k) => k } = useFarm();
  const [why, setWhy] = useState(true);
  const nav = useNavigate();
  return (
    <div className="grid">
      <div className="hero">
        <img className="hero-bg" src={hero} alt="" />
        <div className="hero-inner">
          <div className="tag">{t("dash.today")}</div>
          <h2 style={{ margin: "10px 0 6px", fontSize: 30 }}>{rec.recommendation}</h2>
          <p style={{ opacity: 0.95, maxWidth: 720 }}>{rec.reason}</p>
          <div className="row" style={{ marginTop: 16 }}>
            <span className="tag">{rec.crop.label || rec.crop.name}</span>
            <span className="tag">{t("dash.rain")} {rec.weather.rainProb}%</span>
            <span className="tag">{t("dash.moisture")} {rec.soil.moisture}%</span>
            <span className="tag">{rec.impact.waterSavedL}L {t("dash.saved")}</span>
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn" onClick={() => nav("/irrigation")}>{t("dash.openIrr")}</button>
            <button className="btn ghost" onClick={() => addTask({ title: rec.recommendation, due: new Date().toISOString().slice(0, 10), type: "irrigation" })}>
              {t("btn.addTasks")}
            </button>
            <button className="btn ghost" onClick={() => setWhy((w) => !w)}>{t("btn.why")}</button>
          </div>
        </div>
      </div>
      {why && (
        <div className="card">
          <h3>{t("dash.whyTitle")}</h3>
          <p className="muted">{t("dash.whyBody")}</p>
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
          [t("dash.waterSaved"), `${rec.impact.waterSavedL} L`],
          [t("dash.rsaved"), `₹${rec.impact.moneySaved}`],
          [t("dash.next"), rec.nextIrrigation],
          [t("dash.pump"), rec.iot.pump ? t("ui.on") : t("ui.wait")],
        ].map(([k, v]) => (
          <div className="card" key={k}>
            <div className="muted">{k}</div>
            <div className="kpi">{v}</div>
          </div>
        ))}
      </div>
      <div className="grid g-3">
        <div className="card">
          <img className="photo" src={drip} alt="" />
          <h3>{t("dash.smart")}</h3>
          <p className="muted">{t("ui.judge")}</p>
          <button className="btn" onClick={() => nav("/irrigation")}>{t("btn.open")}</button>
        </div>
        <div className="card">
          <img className="photo" src={tomato} alt="" />
          <h3>{state.farm.farmer}</h3>
          <p>{state.farm.area} {t("ui.acres")} · {(state.farm.crops || []).map((c) => t(cropKey(c))).join(", ")}</p>
          <button className="btn ghost" onClick={() => nav("/farm")}>{t("ui.profile")}</button>
        </div>
        <div className="card">
          <img className="photo" src={leaf} alt="" />
          <h3>{t("dash.doctor")}</h3>
          <p className="muted">{t("dash.scanHint")}</p>
          <button className="btn ghost" onClick={() => nav("/doctor")}>{t("btn.scan")}</button>
        </div>
      </div>
    </div>
  );
}