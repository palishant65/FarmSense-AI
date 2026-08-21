import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "../context/FarmContext";
import { analyzeCropImage, fields } from "../services/decisionEngine";
import { localizeScan } from "../i18n";
import { aiApi, getToken } from "../services/api";
import leaf from "../assets/leaf.jpg";

export default function Doctor() {
  const { state, setState, addTask, toast, t = (k) => k } = useFarm();
  const [busy, setBusy] = useState(false);
  const [cur, setCur] = useState(state.scans[0] ? localizeScan(state.scans[0], t) : null);
  const inp = useRef();
  const nav = useNavigate();

  const run = async (src = "upload") => {
    setBusy(true);
    toast(t("ui.scanning"));
    let r = analyzeCropImage({ field: "Field A — Tomato", src });
    if (getToken()) {
      try {
        const form = new FormData();
        form.append("field", "Field A — Tomato");
        r = await aiApi.disease(form);
        r.at = r.at || Date.now();
        r.id = r._id || r.id;
      } catch { /* local */ }
    }
    setCur(localizeScan(r, t));
    setState((s) => ({ ...s, scans: [r, ...s.scans].slice(0, 20) }));
    setBusy(false);
  };

  return (
    <div className="grid">
      <h2>{t("doc.title")}</h2>
      <div className="grid g-2">
        <div
          className="drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            run("drop");
          }}
        >
          <img className="photo" src={leaf} alt="Demo leaf" style={{ marginBottom: 12 }} />
          {busy ? <p>{t("ui.scanning")}</p> : <p>{t("ui.drop")}</p>}
          <div className="row" style={{ justifyContent: "center", marginTop: 10 }}>
            <button className="btn" onClick={() => inp.current.click()}>{t("ui.upload")}</button>
            <label className="btn ghost">
              {t("ui.camera")}
              <input ref={inp} type="file" accept="image/*" capture="environment" hidden onChange={() => run("camera")} />
            </label>
            <button className="btn ghost" onClick={() => run("demo")}>{t("ui.demo")}</button>
          </div>
        </div>
        <div className="card">
          {cur ? (
            <>
              <span className={`tag ${cur.severityKey === "dis.high" || cur.severity === "High" ? "danger" : cur.severityKey === "dis.med" || cur.severity === "Medium" ? "warn" : ""}`}>{cur.severity}</span>
              <h3>{cur.name}</h3>
              <p>{t("ui.confLabel")} {cur.conf}% · {cur.field}</p>
              <p><b>{t("ui.symptoms")}:</b> {cur.symptoms}</p>
              <p><b>{t("ui.causes")}:</b> {cur.causes}</p>
              <ul>{cur.actions.map((a) => <li key={a}>{a}</li>)}</ul>
              <p className="muted">{cur.disclaimer}</p>
              <div className="row">
                <button className="btn" onClick={() => addTask({ title: t("ui.treat", { name: cur.name }), due: new Date().toISOString().slice(0, 10), type: "crop" })}>{t("btn.addTasks")}</button>
                <button className="btn ghost" onClick={() => nav("/map")}>{t("ui.viewField")}</button>
              </div>
            </>
          ) : (
            <p className="muted">{t("ui.noScan")}</p>
          )}
        </div>
      </div>
      <div className="card">
        <h3>{t("ui.riskMap")}</h3>
        <div className="map" style={{ height: 220 }}>
          {fields.map((f) => (
            <div key={f.id} className="plot" style={{ left: f.x, top: f.y, width: f.w, height: "40%" }}>
              {f.name} · {t("ui.riskPct")} {f.risk}%
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>{t("ui.history")}</h3>
        <table className="table">
          <thead><tr><th>{t("ui.time")}</th><th>{t("ui.finding")}</th><th>{t("ui.conf")}</th></tr></thead>
          <tbody>
            {state.scans.map((s) => (
              <tr key={s.id}><td>{new Date(s.at).toLocaleString()}</td><td>{localizeScan(s, t).name}</td><td>{s.conf}%</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}