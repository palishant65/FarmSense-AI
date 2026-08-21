import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "../context/FarmContext";
import { analyzeCropImage, fields } from "../services/decisionEngine";
import { localizeScan } from "../i18n";
import { aiApi, getToken } from "../services/api";
const leaf = "https://images.unsplash.com/photo-1601055903647-ddf1ee9701b7?q=80&w=600&auto=format&fit=crop";

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
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12}}>
        <div>
          <h2 style={{margin:0, fontSize:28, fontWeight:800}}>🩺 {t("doc.title")}</h2>
          <p className="muted" style={{marginTop:4}}>AI crop disease detection from leaf images</p>
        </div>
        <span className="tag danger">🔬 AI Vision</span>
      </div>

      <div className="grid g-2">
        <div
          className="drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            run("drop");
          }}
        >
          <img className="photo" src={leaf} alt="Demo leaf" style={{ marginBottom: 16, height:120, width:120, borderRadius:'50%', margin:'0 auto 16px', objectFit:'cover', border:'4px solid white', boxShadow:'var(--shadow)' }} />
          {busy ? (
            <div>
              <div className="kpi" style={{fontSize:16}}>🔍 {t("ui.scanning")}</div>
              <div className="progress" style={{marginTop:12, maxWidth:200, margin:'12px auto 0'}}><span style={{width:'60%', animation:'progressMove 1.2s infinite'}}></span></div>
            </div>
          ) : (
            <div>
              <h3 style={{margin:'0 0 6px'}}>📸 {t("ui.drop")}</h3>
              <p className="muted" style={{fontSize:13}}>Drag & drop leaf image or use camera</p>
            </div>
          )}
          <div className="row" style={{ justifyContent: "center", marginTop: 18 }}>
            <button className="btn" onClick={() => inp.current.click()}>📁 {t("ui.upload")}</button>
            <label className="btn ghost" style={{cursor:'pointer'}}>
              📷 {t("ui.camera")}
              <input ref={inp} type="file" accept="image/*" capture="environment" hidden onChange={() => run("camera")} />
            </label>
            <button className="btn ghost" onClick={() => run("demo")}>✨ {t("ui.demo")}</button>
          </div>
        </div>

        <div className="card" style={{borderLeft: cur ? (cur.severityKey === "dis.high" || cur.severity === "High" ? '4px solid var(--danger)' : '4px solid var(--warn)') : '1px solid var(--line)'}}>
          {cur ? (
            <>
              <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                <span className={`tag ${cur.severityKey === "dis.high" || cur.severity === "High" ? "danger" : cur.severityKey === "dis.med" || cur.severity === "Medium" ? "warn" : "ok"}`}>{cur.severity}</span>
                <span className="tag info">{cur.conf}% confidence</span>
                <span className="muted" style={{fontSize:11}}>{cur.field}</span>
              </div>
              <h3 style={{margin:'12px 0 6px', fontSize:20}}>{cur.name}</h3>
              <div className="grid" style={{gap:10, marginTop:12}}>
                <div style={{padding:12, background:'var(--cream)', borderRadius:12}}>
                  <small className="muted" style={{fontWeight:700, textTransform:'uppercase', fontSize:10}}>Symptoms</small>
                  <p style={{margin:'4px 0 0', fontSize:13}}><b>{t("ui.symptoms")}:</b> {cur.symptoms}</p>
                </div>
                <div style={{padding:12, background:'var(--mint-ghost)', borderRadius:12}}>
                  <small className="muted" style={{fontWeight:700, textTransform:'uppercase', fontSize:10}}>Causes</small>
                  <p style={{margin:'4px 0 0', fontSize:13}}><b>{t("ui.causes")}:</b> {cur.causes}</p>
                </div>
                <div>
                  <small className="muted" style={{fontWeight:700, textTransform:'uppercase', fontSize:10}}>Treatment</small>
                  <ul style={{margin:'6px 0 0', paddingLeft:18, fontSize:13, lineHeight:1.6}}>{cur.actions.map((a) => <li key={a}>{a}</li>)}</ul>
                </div>
              </div>
              <p className="muted" style={{fontSize:11, marginTop:12, fontStyle:'italic'}}>{cur.disclaimer}</p>
              <div className="row" style={{marginTop:16}}>
                <button className="btn" onClick={() => addTask({ title: t("ui.treat", { name: cur.name }), due: new Date().toISOString().slice(0, 10), type: "crop" })}>➕ {t("btn.addTasks")}</button>
                <button className="btn ghost" onClick={() => nav("/map")}>🗺️ {t("ui.viewField")}</button>
              </div>
            </>
          ) : (
            <div style={{textAlign:'center', padding:20}}>
              <div style={{fontSize:40, opacity:0.3}}>🌿</div>
              <p className="muted" style={{marginTop:12}}>{t("ui.noScan")}</p>
              <small className="muted">Upload a leaf to see diagnosis</small>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3 style={{margin:0}}>🗺️ {t("ui.riskMap")}</h3>
          <span className="tag warn">Live Risk</span>
        </div>
        <div className="map" style={{ height: 240, marginTop:16 }}>
          {fields.map((f) => (
            <div key={f.id} className="plot" style={{ left: f.x, top: f.y, width: f.w, height: "44%" }}>
              <b>{f.name}</b><br/>{f.crop}<br/>{t("ui.riskPct")} {f.risk}%
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{marginTop:0}}>📜 {t("ui.history")}</h3>
        <div style={{overflowX:'auto'}}>
          <table className="table">
            <thead><tr><th>{t("ui.time")}</th><th>{t("ui.finding")}</th><th>{t("ui.conf")}</th></tr></thead>
            <tbody>
              {state.scans.map((s) => (
                <tr key={s.id}><td className="muted" style={{fontSize:12}}>{new Date(s.at).toLocaleString()}</td><td style={{fontWeight:600}}>{localizeScan(s, t).name}</td><td><span className="tag" style={{fontSize:11}}>{s.conf}%</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
