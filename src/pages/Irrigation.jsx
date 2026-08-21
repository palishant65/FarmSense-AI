import { useFarm } from "../context/FarmContext";
const drip = "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop";
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
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12}}>
        <div>
          <h2 style={{margin:0, fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>💧 {t("irr.title")}</h2>
          <p className="muted" style={{marginTop:4}}>Smart irrigation based on soil, weather and crop stage</p>
        </div>
        <span className="premium-badge">IoT Connected</span>
      </div>

      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <img className="photo lg" src={drip} alt="Drip lines" style={{borderRadius:'18px 18px 0 0'}} />
        <div style={{position:'absolute', top:16, left:16, display:'flex', gap:8}}>
          <span className="tag" style={{background:'rgba(0,0,0,0.6)', color:'white', backdropFilter:'blur(8px)', borderColor:'rgba(255,255,255,0.2)'}}>📡 Live Sensor</span>
          <span className="tag ok">Drip Active</span>
        </div>
      </div>

      <div className="grid g-4">
        {[
          [t("irr.moist"), `${rec.soil.moisture}%`, "💧", "Moisture"],
          [t("irr.rain"), `${rec.weather.rainProb}%`, "🌧️", "Rain"],
          [t("irr.temp"), `${rec.weather.temp}°C`, "🌡️", "Temp"],
          [t("irr.need"), `${rec.crop.waterNeedMm} mm`, "📏", "Need"],
          [t("irr.next"), rec.nextIrrigation, "⏰", "Next"],
          [t("irr.needL"), `${rec.waterRequiredL} L`, "💾", "Volume"],
        ].map(([k, v, icon, sub]) => (
          <div className="card" key={k} style={{padding:16}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <span className="muted" style={{fontSize:11, fontWeight:700, textTransform:'uppercase'}}>{k}</span>
              <span style={{fontSize:16}}>{icon}</span>
            </div>
            <div className="kpi" style={{fontSize:22, marginTop:8}}>{v}</div>
            <small className="muted">{sub}</small>
            <div className="progress" style={{marginTop:10, height:4}}><span style={{width: `${rec.soil.moisture}%`}}></span></div>
          </div>
        ))}
      </div>

      <div className="card" style={{borderLeft:'4px solid var(--forest)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap'}}>
          <div>
            <span className="tag info">AI Decision</span>
            <h3 style={{margin:'10px 0 6px'}}>{t("ui.decision")}: {rec.recommendation}</h3>
            <p className="muted" style={{maxWidth:700}}>{rec.reason}</p>
          </div>
          <span className="tag ok">✓ Optimized</span>
        </div>
        <div className="row" style={{marginTop:18}}>
          <button className="btn" onClick={() => setMode("now")}>▶️ {t("irr.now")}</button>
          <button className="btn ghost" onClick={() => setMode("delay")}>⏸️ {t("irr.delay")}</button>
          <button className="btn ghost" onClick={() => setMode("ai")}>🤖 {t("irr.ai")}</button>
          <button className="btn ghost" onClick={() => addTask({ title: rec.recommendation, due: new Date().toISOString().slice(0, 10), type: "irrigation" })}>➕ {t("btn.addTasks")}</button>
        </div>
      </div>

      <div className="grid g-3">
        <div className="card" style={{textAlign:'center', background:'linear-gradient(180deg, var(--white), var(--cream))'}}>
          <div style={{width:48, height:48, borderRadius:14, background:'var(--line)', display:'grid', placeItems:'center', margin:'0 auto 10px', fontSize:20}}>📊</div>
          <div className="muted" style={{fontSize:11, fontWeight:700, textTransform:'uppercase'}}>{t("ui.trad")}</div>
          <div className="kpi" style={{color:'var(--muted)'}}>{rec.impact.traditionalL} L</div>
          <small className="muted">Traditional usage</small>
        </div>
        <div className="card" style={{textAlign:'center', borderColor:'var(--mint)', background:'linear-gradient(180deg, var(--mint-soft), var(--white))'}}>
          <div style={{width:48, height:48, borderRadius:14, background:'var(--forest)', color:'white', display:'grid', placeItems:'center', margin:'0 auto 10px', fontSize:20}}>🌿</div>
          <div className="muted" style={{fontSize:11, fontWeight:700, textTransform:'uppercase', color:'var(--forest)'}}>{t("ui.fsWater")}</div>
          <div className="kpi" style={{color:'var(--forest)'}}>{rec.impact.aiL} L</div>
          <small className="muted">FarmSense AI optimized</small>
        </div>
        <div className="card" style={{textAlign:'center', background:'linear-gradient(135deg, #dcfce7, #bbf7d0)', borderColor:'#86efac'}}>
          <div style={{width:48, height:48, borderRadius:14, background:'var(--ok)', color:'white', display:'grid', placeItems:'center', margin:'0 auto 10px', fontSize:20}}>💾</div>
          <div className="muted" style={{fontSize:11, fontWeight:700, textTransform:'uppercase', color:'var(--ok)'}}>{t("ui.saved")}</div>
          <div className="kpi" style={{color:'var(--ok)'}}>{rec.impact.waterSavedL} L · ₹{rec.impact.moneySaved}</div>
          <small className="muted">Water & money saved</small>
        </div>
      </div>
    </div>
  );
}
