import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "../context/FarmContext";
import { analyzeCropImage, fields } from "../services/decisionEngine";
import { aiApi, getToken } from "../services/api";
import leaf from "../assets/leaf.jpg";

export default function Doctor() {
  const { state, setState, addTask, toast } = useFarm();
  const [busy, setBusy] = useState(false);
  const [cur, setCur] = useState(state.scans[0] || null);
  const inp = useRef();
  const nav = useNavigate();

  const run = async (src = "upload") => {
    setBusy(true);
    toast("Scanning canopy…");
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
    setCur(r);
    setState((s) => ({ ...s, scans: [r, ...s.scans].slice(0, 20) }));
    setBusy(false);
  };

  return (
    <div className="grid">
      <h2>AI Crop Doctor</h2>
      <div className="grid g-2">
        <div className="drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); run("drop"); }}>
          <img className="photo" src={leaf} alt="Demo leaf" style={{ marginBottom: 12 }} />
          {busy ? <p>Scanning leaf veins & lesions…</p> : <p>Drag & drop a leaf photo, or use camera</p>}
          <div className="row" style={{ justifyContent: "center", marginTop: 10 }}>
            <button className="btn" onClick={() => inp.current.click()}>Upload</button>
            <label className="btn ghost">
              Camera
              <input ref={inp} type="file" accept="image/*" capture="environment" hidden onChange={() => run("camera")} />
            </label>
            <button className="btn ghost" onClick={() => run("demo")}>Demo image</button>
          </div>
        </div>
        <div className="card">
          {cur ? (
            <>
              <span className={`tag ${cur.severity === "High" ? "danger" : cur.severity === "Medium" ? "warn" : ""}`}>{cur.severity}</span>
              <h3>{cur.name}</h3>
              <p>Confidence {cur.conf}% · {cur.field}</p>
              <p><b>Symptoms:</b> {cur.symptoms}</p>
              <p><b>Causes:</b> {cur.causes}</p>
              <ul>{cur.actions.map((a) => <li key={a}>{a}</li>)}</ul>
              <p className="muted">{cur.disclaimer}</p>
              <div className="row">
                <button className="btn" onClick={() => addTask({ title: `Treat ${cur.name}`, due: new Date().toISOString().slice(0, 10), type: "crop" })}>Add to Tasks</button>
                <button className="btn ghost" onClick={() => nav("/map")}>View Field</button>
              </div>
            </>
          ) : (
            <p className="muted">No scan yet. Use a demo image for judges.</p>
          )}
        </div>
      </div>
      <div className="card">
        <h3>Disease-risk map</h3>
        <div className="map" style={{ height: 220 }}>
          {fields.map((f) => (
            <div key={f.id} className="plot" style={{ left: f.x, top: f.y, width: f.w, height: "40%" }}>
              {f.name} · risk {f.risk}%
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Scan history</h3>
        <table className="table">
          <thead><tr><th>Time</th><th>Finding</th><th>Conf</th></tr></thead>
          <tbody>
            {state.scans.map((s) => (
              <tr key={s.id}><td>{new Date(s.at).toLocaleString()}</td><td>{s.name}</td><td>{s.conf}%</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}