import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip, BarChart, Bar, Legend } from "recharts";
import { useFarm } from "../context/FarmContext";
import { answerFarmQuestion, schemes, profitSim, predictYield } from "../services/decisionEngine";
import { authApi, farmApi, aiApi, dataApi, getToken, setToken } from "../services/api";
import { LANGS, cropKey } from "../i18n";

const chart = (n) =>
  Array.from({ length: n }, (_, i) => ({
    d: `D${i + 1}`,
    health: 70 + (i % 7),
    water: 400 - i * 4,
    soil: 36 + (i % 5),
    rain: 5 + (i % 9),
    yield: 18 + i * 0.1,
    price: 26 + (i % 4),
    exp: 1200,
    profit: 800 + i * 20,
  }));

export function Analytics() {
  const { t = (k) => k } = useFarm();
  const [range, setRange] = useState(7);
  const data = chart(range === "season" ? 16 : +range);
  return (
    <div className="grid">
      <h2>{t("an.title")}</h2>
      <div className="row">
        {[7, 30, "season"].map((r) => (
          <button key={r} className={range === r ? "btn" : "btn ghost"} onClick={() => setRange(r)}>
            {r === "season" ? t("ui.season") : `${r} ${t("ui.days")}`}
          </button>
        ))}
      </div>
      <div className="card" style={{ height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="d" />
            <Tooltip />
            <Legend />
            <Line dataKey="health" stroke="#1b5e3b" />
            <Line dataKey="water" stroke="#7dcea0" />
            <Line dataKey="soil" stroke="#2d7a4f" />
            <Line dataKey="rain" stroke="#2563eb" />
            <Line dataKey="yield" stroke="#d97706" />
            <Line dataKey="price" stroke="#7c3aed" />
            <Line dataKey="exp" stroke="#c0392b" />
            <Line dataKey="profit" stroke="#15803d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Market() {
  const { rec, t = (k) => k } = useFarm();
  const [area, setArea] = useState(4.5);
  const [cost, setCost] = useState(38000);
  const [price, setPrice] = useState(rec.market.tomato);
  const sim = profitSim({ area, crop: rec.crop.name, cost, price });
  return (
    <div className="grid">
      <h2>{t("mkt.title")}</h2>
      <div className="grid g-3">
        {[["Tomato", rec.market.tomato], ["Wheat", rec.market.wheat], ["Potato", rec.market.potato]].map(([k, v]) => (
          <div className="card" key={k}><div className="muted">{t(cropKey(k))} {t("ui.mandi")}</div><div className="kpi">₹{v}/kg</div><p className="muted">{t("ui.trend")} {rec.market.trendLabel || rec.market.trend}</p></div>
        ))}
      </div>
      <div className="card">
        <h3>{t("ui.sell")}</h3>
        <p>{t("ui.sellBody")} {rec.crop.label || rec.crop.name}.</p>
      </div>
      <div className="card">
        <h3>{t("ui.sim")}</h3>
        <div className="grid g-3">
          <label>{t("ui.area")}<input className="input" type="number" value={area} onChange={(e) => setArea(+e.target.value)} /></label>
          <label>{t("ui.cost")}<input className="input" type="number" value={cost} onChange={(e) => setCost(+e.target.value)} /></label>
          <label>{t("ui.price")}<input className="input" type="number" value={price} onChange={(e) => setPrice(+e.target.value)} /></label>
        </div>
        <table className="table">
          <thead><tr><th></th><th>{t("ui.traditional")}</th><th>FarmSense AI</th></tr></thead>
          <tbody>
            {[["cost", t("ui.costRow")], ["revenue", t("ui.revenue")], ["profit", t("ui.profit")], ["perAcre", t("ui.perAcre")]].map(([k, lab]) => (
              <tr key={k}>
                <td>{lab}</td>
                <td>₹{Math.round(sim.traditional[k]).toLocaleString("en-IN")}</td>
                <td>₹{Math.round(sim.farmsense[k]).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Schemes() {
  const { t = (k) => k } = useFarm();
  const [q, setQ] = useState("");
  const list = schemes.filter((s) => (s.name + s.cat + s.benefit).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="grid">
      <h2>{t("sch.title")}</h2>
      <input className="input" placeholder={t("menu.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      {list.map((s) => (
        <div className="card" key={s.id}>
          <span className="tag">{t(`cat.${s.cat}`)}</span>
          <h3>{t(`sch.${s.id === "uk-soil" ? "uk" : s.id}`)}</h3>
          <p><b>{t("ui.benefit")}:</b> {t(`sch.${s.id === "uk-soil" ? "uk" : s.id}B`)}</p>
          <p><b>{t("ui.elig")}:</b> {t(`sch.${s.id === "uk-soil" ? "uk" : s.id}E`)}</p>
          <p><b>{t("ui.docs")}:</b> {t(`sch.${s.id === "uk-soil" ? "uk" : s.id}D`)}</p>
        </div>
      ))}
    </div>
  );
}

export function Assistant() {
  const { rec, t = (k) => k } = useFarm();
  const [lang, setLang] = useState("en-IN");
  const [log, setLog] = useState([{ role: "ai", text: rec.reason }]);
  const [q, setQ] = useState("");
  const speak = (a) => {
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(a);
      u.lang = lang;
      window.speechSynthesis.speak(u);
    }
  };
  const ask = async (text = q) => {
    let a = answerFarmQuestion(text, rec);
    if (a && typeof a === "object") {
      if (a.kind === "disease") a = t("ai.disease", { crop: t(cropKey(a.crop)), n: a.n });
      else if (a.kind === "sell") a = t("ai.sell", { n: a.n, trend: t(a.trend === "up" ? "ui.trendUp" : "ui.trendDown") });
      else if (a.kind === "soil") a = t("ai.soil", { n: a.n, rec: t(a.rec) });
      else a = rec.reason;
    }
    if (getToken()) {
      try {
        const out = await aiApi.copilot({ question: text, rec, lang });
        a = out.text || a;
      } catch { /* local fallback */ }
    }
    setLog((l) => [...l, { role: "me", text }, { role: "ai", text: a }]);
    setQ("");
    speak(a);
  };
  const listen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      ask("Kal paani dena chahiye?");
      return;
    }
    const r = new SR();
    r.lang = lang;
    r.onresult = (e) => ask(e.results[0][0].transcript);
    r.start();
  };
  return (
    <div className="grid">
      <h2>{t("cop.title")}</h2>
      <p className="muted">{t("ui.copHint")}</p>
      <div className="row">
        {[["en-IN", "English"], ["hi-IN", "Hindi"], ["ta-IN", "Tamil"]].map(([v, l]) => (
          <button key={v} className={lang === v ? "btn" : "btn ghost"} onClick={() => setLang(v)}>{l}</button>
        ))}
      </div>
      <div className="card" style={{ minHeight: 240 }}>
        {log.map((m, i) => (
          <p key={i}><b>{m.role === "ai" ? "FarmSense" : t("ui.you")}:</b> {m.text}</p>
        ))}
      </div>
      <div className="row">
        <input className="input" style={{ flex: 1 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("menu.search")} />
        <button className="btn" onClick={() => ask()}>{t("ui.ask")}</button>
        <button className="btn ghost" onClick={listen}>{t("ui.voice")}</button>
      </div>
    </div>
  );
}

export function Tasks() {
  const { state, setState, addTask, t = (k) => k } = useFarm();
  const [title, setTitle] = useState("");
  const tasks = state?.tasks || [];
  const done = tasks.filter((x) => x.done).length;
  return (
    <div className="grid">
      <h2>{t("tsk.title")}</h2>
      <div className="progress"><span style={{ width: `${(done / Math.max(1, tasks.length)) * 100}%` }} /></div>
      <p>{done}/{tasks.length} {t("ui.complete")}</p>
      <div className="row">
        <input className="input" style={{ flex: 1 }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("ui.newTask")} />
        <button className="btn" onClick={() => { addTask({ title, due: new Date().toISOString().slice(0, 10), type: "general" }); setTitle(""); }}>{t("ui.add")}</button>
      </div>
      {tasks.map((task) => (
        <div className="card row" key={task.id} style={{ justifyContent: "space-between" }}>
          <label><input type="checkbox" checked={task.done} onChange={() => {
            const done = !task.done;
            setState((s) => ({ ...s, tasks: s.tasks.map((x) => x.id === task.id ? { ...x, done } : x) }));
            if (getToken() && (task._id || task.id)) dataApi.patchTask(task._id || task.id, { done }).catch(() => {});
          }} /> {task.title}</label>
          <span className="muted">{task.due}</span>
          <button className="btn ghost" onClick={() => {
            setState((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== task.id) }));
            if (getToken() && (task._id || task.id)) dataApi.delTask(task._id || task.id).catch(() => {});
          }}>{t("ui.delete")}</button>
        </div>
      ))}
    </div>
  );
}

export function Alerts() {
  const { alerts, rec, weather, t = (k) => k } = useFarm();
  const nav = useNavigate();
  const fallback = [
    { id: "a1", level: rec?.action === "delay" ? "info" : "warning", title: rec?.recommendation || t("dash.openIrr"), to: "/irrigation" },
    { id: "a2", level: "warning", title: `${t("ui.rainChance")} ${weather?.rainProb ?? 65}%`, to: "/weather" },
    { id: "a3", level: "warning", title: t("alert.blight"), to: "/doctor" },
    { id: "a4", level: (weather?.temp || 0) >= 35 ? "critical" : "info", title: t("alert.heat", { n: weather?.temp ?? 29 }), to: "/weather" },
    { id: "a5", level: "info", title: t("alert.price", { n: rec?.market?.tomato ?? "" }), to: "/market" },
    { id: "a6", level: "info", title: t("alert.soil"), to: "/soil" },
    { id: "a7", level: "info", title: t("tsk.title"), to: "/tasks" },
  ];
  const list = alerts && alerts.length ? alerts : fallback;
  return (
    <div className="grid">
      <h2>{t("al.title")}</h2>
      {list.map((a) => (
        <div className="card row" key={a.id} style={{ justifyContent: "space-between", opacity: 1 }}>
          <div>
            <span className={`tag ${a.level === "critical" ? "danger" : a.level === "warning" ? "warn" : "info"}`}>{t(`lvl.${a.level}`)}</span>
            <b> {a.title}</b>
          </div>
          <div className="row">
            <button type="button" className="btn ghost" onClick={() => nav(a.to || "/dashboard")}>{t("btn.open")}</button>
            <button type="button" className="btn" onClick={() => nav(a.to || "/dashboard")}>{t("btn.read")}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Iot() {
  const { rec, state, setState, t = (k) => k } = useFarm();
  const s = state.sensors;
  return (
    <div className="grid">
      <h2>{t("iot.title")}</h2>
      <p>{s.online ? t("ui.online") : t("ui.offline")} · {t("ui.lastSeen")} {new Date(s.lastSeen).toLocaleTimeString()}</p>
      <div className="grid g-4">
        {[[t("dash.moisture"), `${s.moisture}%`], [t("ui.temp"), `${s.temperature}°C`], [t("ui.humid"), `${s.humidity}%`], [t("ui.rainSensor"), s.rain ? t("ui.wet") : t("ui.drySoil")], [t("dash.pump"), rec.iot.pump ? t("ui.on") : t("ui.off")]].map(([k, v]) => (
          <div className="card iot-node" key={k}><div className="muted">{k}</div><div className="kpi">{v}</div></div>
        ))}
      </div>
      <div className="card">
        <h3>{t("ui.flow")}</h3>
        <p>Sensor ({s.moisture}%) → ESP32 → AI → <b>{rec.recommendation}</b> → {t("dash.pump")} {rec.iot.pump ? t("ui.on") : t("ui.off")} → {rec.impact.waterSavedL}L {t("dash.saved")}</p>
        <label>{t("dash.moisture")}
          <input type="range" min="10" max="80" value={s.moisture} onChange={(e) => setState((st) => ({ ...st, sensors: { ...st.sensors, moisture: +e.target.value, lastSeen: Date.now() } }))} />
        </label>
      </div>
    </div>
  );
}

export function Impact() {
  const { rec, t = (k) => k } = useFarm();
  const data = [
    { n: t("dash.waterSaved"), v: rec.impact.waterSavedL },
    { n: "₹", v: rec.impact.moneySaved },
    { n: t("ui.health"), v: rec.crop.health },
    { n: t("ui.yield"), v: rec.impact.yieldLiftPct },
    { n: "CO₂ kg", v: rec.impact.co2Kg },
  ];
  return (
    <div className="grid">
      <h2>{t("imp.title")}</h2>
      <div className="grid g-3">
        {data.map((d) => (
          <div className="card" key={d.n}><div className="muted">{d.n}</div><div className="kpi">{d.v}</div></div>
        ))}
      </div>
      <div className="card" style={{ height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data}><XAxis dataKey="n" /><Tooltip /><Bar dataKey="v" fill="#1b5e3b" /></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Reports() {
  const { rec, state, t = (k) => k } = useFarm();
  return (
    <div className="grid">
      <h2>{t("rep.title")}</h2>
      <div className="card" id="print-area">
        <h3>FarmSense AI {t("ui.brief")} — {state.farm.location}</h3>
        <p>{t("ui.farmer")} {state.farm.farmer} · {state.farm.area} {t("ui.acres")}</p>
        <p><b>{t("ui.decision")}:</b> {rec.recommendation}</p>
        <p>{rec.reason}</p>
        <p>{t("dash.waterSaved")} {rec.impact.waterSavedL}L · ₹{rec.impact.moneySaved} · {t("ui.yieldLift")} {rec.impact.yieldLiftPct}%</p>
        <p>{t("ui.outlook")} {predictYield({ crop: rec.crop.name }).totalT} t {t("ui.total")}</p>
      </div>
      <button className="btn" onClick={() => window.print()}>{t("ui.print")}</button>
    </div>
  );
}

export function FarmPage() {
  const { state, setState, toast, t = (k) => k } = useFarm();
  const f = state.farm;
  const set = (k, v) => setState((s) => ({ ...s, farm: { ...s.farm, [k]: v } }));
  return (
    <div className="grid">
      <h2>{t("ui.farmProfile")}</h2>
      <div className="card grid">
        {[["farmer", t("ui.farmer")], ["location", t("ui.location")], ["soil", t("nav.soil")], ["irrigation", t("nav.irrigation")], ["waterSource", t("ui.waterSrc")]].map(([k, l]) => (
          <label key={k}>{l}<input className="input" value={f[k]} onChange={(e) => set(k, e.target.value)} /></label>
        ))}
        <label>{t("ui.acres")}<input className="input" type="number" value={f.area} onChange={(e) => set("area", +e.target.value)} /></label>
        <button className="btn" onClick={() => { toast(t("btn.save")); if (getToken()) farmApi.save(f).catch(() => {}); }}>{t("btn.save")}</button>
      </div>
    </div>
  );
}

export function Settings() {
  const { state, setState, setTheme, toast, user, setUser, t = (k) => k, setLanguage } = useFarm();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const doAuth = async (mode) => {
    try {
      const d = mode === "login"
        ? await authApi.login({ email, password })
        : await authApi.register({ name: name || "Farmer", email, password });
      setToken(d.token);
      setUser(d.user);
      toast(mode === "login" ? t("ui.loggedIn") : t("ui.registered"));
    } catch (e) {
      toast(e.message);
    }
  };
  return (
    <div className="grid">
      <h2>{t("set.title")}</h2>
      <div className="card grid">
        <h3>{t("set.account")}</h3>
        {user ? <p>{t("ui.signedIn")} {user.name} ({user.email})</p> : (
          <>
            <input className="input" placeholder={t("ui.name")} value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder={t("ui.email")} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" type="password" placeholder={t("ui.password")} value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="row">
              <button className="btn" onClick={() => doAuth("login")}>{t("btn.login")}</button>
              <button className="btn ghost" onClick={() => doAuth("register")}>{t("btn.register")}</button>
            </div>
          </>
        )}
        {user && <button className="btn ghost" onClick={() => { setToken(null); setUser(null); toast(t("ui.logout")); }}>{t("ui.logout")}</button>}
        <label>{t("set.lang")}
          <select className="input" value={state.farm.language || "en"} onChange={(e) => setLanguage ? setLanguage(e.target.value) : setState((s) => ({ ...s, farm: { ...s.farm, language: e.target.value } }))}>
            {LANGS.map((L) => (
              <option key={L.id} value={L.id}>{L.name}</option>
            ))}
          </select>
        </label>
        <div className="row">
          <button className="btn" onClick={() => { setTheme("light"); document.documentElement.dataset.theme = "light"; }}>{t("ui.light")}</button>
          <button className="btn ghost" onClick={() => { setTheme("dark"); document.documentElement.dataset.theme = "dark"; }}>{t("ui.dark")}</button>
        </div>
        <label><input type="checkbox" checked={state.offline} onChange={(e) => setState((s) => ({ ...s, offline: e.target.checked }))} /> {t("ui.forceOff")}</label>
        <p className="muted">{t("ui.privacy")}</p>
        <button className="btn" onClick={() => { localStorage.clear(); toast(t("ui.clear")); location.reload(); }}>{t("ui.clear")}</button>
      </div>
    </div>
  );
}