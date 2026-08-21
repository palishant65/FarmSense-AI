import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "../context/FarmContext";
import { cropKey } from "../i18n";
const hero = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop";
const tomato = "https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=600&auto=format&fit=crop";
const drip = "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop";
const leaf = "https://images.unsplash.com/photo-1601055903647-ddf1ee9701b7?q=80&w=600&auto=format&fit=crop";

export default function Dashboard() {
  const { rec, addTask, state, t = (k) => k } = useFarm();
  const [why, setWhy] = useState(true);
  const nav = useNavigate();
  return (
    <div className="grid">
      <div className="hero">
        <img className="hero-bg" src={hero} alt="" />
        <div className="hero-inner">
          <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
            <span className="tag" style={{background:'rgba(255,255,255,0.18)', color:'white', borderColor:'rgba(255,255,255,0.25)', backdropFilter:'blur(6px)'}}>🌱 {t("dash.today")}</span>
            <span className="premium-badge">AI DECISION</span>
          </div>
          <h2 style={{ margin: "14px 0 8px", fontSize: 'clamp(26px, 4vw, 36px)', fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.15 }}>{rec.recommendation}</h2>
          <p style={{ opacity: 0.92, maxWidth: 720, fontSize:15, lineHeight:1.6 }}>{rec.reason}</p>
          <div className="row" style={{ marginTop: 18 }}>
            <span className="tag" style={{background:'white', color:'var(--forest-dark)'}}>🍅 {rec.crop.label || rec.crop.name}</span>
            <span className="tag warn">🌧️ {t("dash.rain")} {rec.weather.rainProb}%</span>
            <span className="tag" style={{background:'rgba(255,255,255,0.15)', color:'white', borderColor:'rgba(255,255,255,0.2)'}}>💧 {t("dash.moisture")} {rec.soil.moisture}%</span>
            <span className="tag ok" style={{background:'var(--mint)', color:'var(--forest-dark)'}}>💾 {rec.impact.waterSavedL}L {t("dash.saved")}</span>
          </div>
          <div className="row" style={{ marginTop: 20 }}>
            <button className="btn" style={{background:'white', color:'var(--forest-dark)', boxShadow:'0 4px 16px rgba(0,0,0,0.15)'}} onClick={() => nav("/irrigation")}>💧 {t("dash.openIrr")}</button>
            <button className="btn ghost" style={{background:'rgba(255,255,255,0.14)', color:'white', borderColor:'rgba(255,255,255,0.25)', backdropFilter:'blur(8px)'}} onClick={() => addTask({ title: rec.recommendation, due: new Date().toISOString().slice(0, 10), type: "irrigation" })}>
              ➕ {t("btn.addTasks")}
            </button>
            <button className="btn ghost" style={{background:'rgba(255,255,255,0.1)', color:'white', borderColor:'rgba(255,255,255,0.2)'}} onClick={() => setWhy((w) => !w)}>❓ {t("btn.why")}</button>
          </div>
        </div>
      </div>
      {why && (
        <div className="card" style={{borderLeft:'4px solid var(--mint)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3 style={{margin:0}}>🔍 {t("dash.whyTitle")}</h3>
            <span className="tag info">Fused Signals</span>
          </div>
          <p className="muted" style={{marginTop:8}}>{t("dash.whyBody")}</p>
          <div className="grid g-3" style={{marginTop:16}}>
            {rec.factors.map((f) => (
              <div key={f.key} className="card" style={{ boxShadow: "none", background:'var(--mint-ghost)', borderColor:'var(--line)', padding:16 }}>
                <div className="muted" style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700}}>{f.key}</div>
                <div className="kpi" style={{ fontSize: 24, marginTop:6 }}>{f.value}</div>
                <div className="progress" style={{marginTop:10}}><span style={{width:'72%'}}></span></div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid g-4">
        {[
          [t("dash.waterSaved"), `${rec.impact.waterSavedL} L`, "💧", "var(--mint-soft)"],
          [t("dash.rsaved"), `₹${rec.impact.moneySaved}`, "💰", "#fef3c7"],
          [t("dash.next"), rec.nextIrrigation, "⏰", "#dbeafe"],
          [t("dash.pump"), rec.iot.pump ? t("ui.on") : t("ui.wait"), "⚡", rec.iot.pump ? "#dcfce7" : "#fee2e2"],
        ].map(([k, v, icon, bg]) => (
          <div className="card" key={k} style={{padding:18}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div className="muted" style={{fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em'}}>{k}</div>
              <span style={{width:32, height:32, borderRadius:10, background:bg, display:'grid', placeItems:'center', fontSize:16}}>{icon}</span>
            </div>
            <div className="kpi" style={{marginTop:8}}>{v}</div>
            <div className="progress" style={{marginTop:12, height:4}}><span style={{width:'68%'}}></span></div>
          </div>
        ))}
      </div>
      <div className="grid g-3">
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <img className="photo" src={drip} alt="" style={{height:160, borderRadius:'18px 18px 0 0'}} />
          <div style={{padding:18}}>
            <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
              <span style={{width:28, height:28, borderRadius:8, background:'var(--mint-soft)', display:'grid', placeItems:'center'}}>💧</span>
              <h3 style={{margin:0}}>{t("dash.smart")}</h3>
            </div>
            <p className="muted" style={{fontSize:13, lineHeight:1.5}}>{t("ui.judge")}</p>
            <button className="btn" style={{marginTop:14, width:'100%'}} onClick={() => nav("/irrigation")}>{t("btn.open")} →</button>
          </div>
        </div>
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <img className="photo" src={tomato} alt="" style={{height:160, borderRadius:'18px 18px 0 0'}} />
          <div style={{padding:18}}>
            <div style={{display:'flex', gap:10, alignItems:'center', marginBottom:8}}>
              <span className="avatar" style={{width:36, height:36}}>{(state.farm.farmer||'F')[0]}</span>
              <div><h3 style={{margin:0, fontSize:16}}>{state.farm.farmer}</h3><small className="muted">{state.farm.area} {t("ui.acres")}</small></div>
            </div>
            <p className="muted" style={{fontSize:12}}>{(state.farm.crops || []).map((c) => t(cropKey(c))).join(", ")}</p>
            <div className="row" style={{marginTop:12}}>
              <span className="tag">{state.farm.area} acres</span>
              <span className="tag ok">Active</span>
            </div>
            <button className="btn ghost" style={{marginTop:14, width:'100%'}} onClick={() => nav("/farm")}>{t("ui.profile")}</button>
          </div>
        </div>
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <img className="photo" src={leaf} alt="" style={{height:160, borderRadius:'18px 18px 0 0'}} />
          <div style={{padding:18}}>
            <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
              <span style={{width:28, height:28, borderRadius:8, background:'#fee2e2', display:'grid', placeItems:'center'}}>🩺</span>
              <h3 style={{margin:0}}>{t("dash.doctor")}</h3>
            </div>
            <p className="muted" style={{fontSize:13}}>{t("dash.scanHint")}</p>
            <div style={{marginTop:12, padding:10, background:'var(--mint-ghost)', borderRadius:10, border:'1px dashed var(--mint)'}}>
              <small className="muted">📸 Upload leaf photo for instant diagnosis</small>
            </div>
            <button className="btn ghost" style={{marginTop:14, width:'100%'}} onClick={() => nav("/doctor")}>🔍 {t("btn.scan")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
