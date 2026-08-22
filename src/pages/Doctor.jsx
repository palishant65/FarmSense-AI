import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "../context/FarmContext";
import { analyzeCropImage, imageSeed, fields } from "../services/decisionEngine";
import { localizeScan } from "../i18n";
import { aiApi, getToken } from "../services/api";
import leaf from "../assets/leaf.jpg";

async function seedFromFile(file) {
  const buf = await file.slice(0, 16384).arrayBuffer();
  const u8 = new Uint8Array(buf);
  let h = (file.size || 0) >>> 0;
  for (let i = 0; i < u8.length; i++) h = Math.imul(h ^ u8[i], 16777619) >>> 0;
  const name = file.name || "";
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}

export default function Doctor() {
  const { state, setState, addTask, toast, t = (k) => k } = useFarm();
  const [busy, setBusy] = useState(false);
  const [cur, setCur] = useState(null);
  const [preview, setPreview] = useState("");
  const inp = useRef();
  const cam = useRef();
  const nav = useNavigate();

  const run = async (file, srcTag) => {
    setBusy(true);
    setCur(null);
    toast(t("ui.scanning"));
    try {
      let seed;
      if (file) seed = await seedFromFile(file);
      else seed = imageSeed(srcTag || "demo");
      let r = analyzeCropImage({ field: "Field A — Tomato", src: file?.name || srcTag, seed });
      if (getToken() && file) {
        const form = new FormData();
        form.append("field", "Field A — Tomato");
        form.append("seed", String(seed));
        form.append("image", file);
        r = await aiApi.disease(form);
        r.at = r.at || Date.now();
        r.id = r._id || r.id;
      }
      setCur(localizeScan(r, t));
      setState((s) => ({ ...s, scans: [r, ...s.scans].slice(0, 20) }));
    } catch (e) {
      setCur(null);
      toast(e.message || t("ui.authFail"));
    }
    setBusy(false);
  };

  const takeFile = (file) => {
    if (!file || !String(file.type || "").startsWith("image/")) return;
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setCur(null);
    run(file, "upload");
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
            takeFile(e.dataTransfer.files?.[0]);
          }}
        >
          <img className="photo" src={preview || leaf} alt={t("ui.demoLeaf")} style={{ marginBottom: 12 }} />
          {busy ? <p>{t("ui.scanning")}</p> : <p>{t("ui.drop")}</p>}
          <div className="row" style={{ justifyContent: "center", marginTop: 10 }}>
            <button className="btn" type="button" onClick={() => inp.current.click()}>{t("ui.upload")}</button>
            <input ref={inp} type="file" accept="image/*" hidden onChange={(e) => { takeFile(e.target.files?.[0]); e.target.value = ""; }} />
            <label className="btn ghost">
              {t("ui.camera")}
              <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { takeFile(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            <button className="btn ghost" type="button" onClick={() => { if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview); setPreview(leaf); setCur(null); run(null, "demo"); }}>{t("ui.demo")}</button>
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
            <p className="muted">{busy ? t("ui.scanning") : t("ui.noScan")}</p>
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
              <tr key={s.id}><td>{new Date(s.at).toLocaleString()}</td><td>{s.name}</td><td>{s.conf}%</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
