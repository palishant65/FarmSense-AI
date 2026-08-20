import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip, BarChart, Bar, Legend } from "recharts";
import { useFarm } from "../context/FarmContext";
import { answerFarmQuestion, schemes, profitSim, predictYield } from "../services/decisionEngine";
import { authApi, farmApi, aiApi, dataApi, getToken, setToken } from "../services/api";

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
  const [range, setRange] = useState(7);
  const data = chart(range === "season" ? 16 : +range);
  return (
    <div className="grid">
      <h2>Analytics</h2>
      <div className="row">
        {[7, 30, "season"].map((r) => (
          <button key={r} className={range === r ? "btn" : "btn ghost"} onClick={() => setRange(r)}>
            {r === "season" ? "Season" : `${r} days`}
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
  const { rec } = useFarm();
  const [area, setArea] = useState(4.5);
  const [cost, setCost] = useState(38000);
  const [price, setPrice] = useState(rec.market.tomato);
  const sim = profitSim({ area, crop: rec.crop.name, cost, price });
  return (
    <div className="grid">
      <h2>Market & profit</h2>
      <div className="grid g-3">
        {[["Tomato", rec.market.tomato], ["Wheat", rec.market.wheat], ["Potato", rec.market.potato]].map(([k, v]) => (
          <div className="card" key={k}><div className="muted">{k} mandi</div><div className="kpi">₹{v}/kg</div><p className="muted">Trend {rec.market.trend}</p></div>
        ))}
      </div>
      <div className="card">
        <h3>AI selling recommendation</h3>
        <p>Hold grade-A {rec.crop.name} 3–4 days. Nearby mandi spread ₹2–4. Decision Engine sees healthy fruit set + rising price.</p>
      </div>
      <div className="card">
        <h3>Farm Profit Simulator</h3>
        <div className="grid g-3">
          <label>Area acres<input className="input" type="number" value={area} onChange={(e) => setArea(+e.target.value)} /></label>
          <label>Cost / acre<input className="input" type="number" value={cost} onChange={(e) => setCost(+e.target.value)} /></label>
          <label>Price ₹/kg<input className="input" type="number" value={price} onChange={(e) => setPrice(+e.target.value)} /></label>
        </div>
        <table className="table">
          <thead><tr><th></th><th>Traditional</th><th>FarmSense</th></tr></thead>
          <tbody>
            {["cost", "revenue", "profit", "perAcre"].map((k) => (
              <tr key={k}>
                <td>{k}</td>
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
  const [q, setQ] = useState("");
  const list = schemes.filter((s) => (s.name + s.cat + s.benefit).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="grid">
      <h2>Government schemes</h2>
      <input className="input" placeholder="Search irrigation, insurance…" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.map((s) => (
        <div className="card" key={s.id}>
          <span className="tag">{s.cat}</span>
          <h3>{s.name}</h3>
          <p><b>Benefit:</b> {s.benefit}</p>
          <p><b>Eligibility:</b> {s.eligibility}</p>
          <p><b>Documents:</b> {s.docs}</p>
        </div>
      ))}
    </div>
  );
}

export function Assistant() {
  const { rec } = useFarm();
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
    if (getToken()) {
      try {
        const out = await aiApi.copilot({ question: text, rec, lang });
        a = out.text || a;
      } catch { /* local */ }
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
      <h2>Farm Copilot</h2>
      <p className="muted">Answers use the same Decision Engine as the dashboard.</p>
      <div className="row">
        {[["en-IN", "English"], ["hi-IN", "Hindi"], ["ta-IN", "Tamil"]].map(([v, l]) => (
          <button key={v} className={lang === v ? "btn" : "btn ghost"} onClick={() => setLang(v)}>{l}</button>
        ))}
      </div>
      <div className="card" style={{ minHeight: 240 }}>
        {log.map((m, i) => (
          <p key={i}><b>{m.role === "ai" ? "FarmSense" : "You"}:</b> {m.text}</p>
        ))}
      </div>
      <div className="row">
        <input className="input" style={{ flex: 1 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kal paani dena chahiye?" />
        <button className="btn" onClick={() => ask()}>Ask</button>
        <button className="btn ghost" onClick={listen}>Voice</button>
      </div>
    </div>
  );
}

export function Tasks() {
  const { state, setState, addTask } = useFarm();
  const [title, setTitle] = useState("");
  const tasks = state?.tasks || [];
  const done = tasks.filter((t) => t.done).length;
  return (
    <div className="grid">
      <h2>Tasks & calendar</h2>
      <div className="progress"><span style={{ width: `${(done / Math.max(1, tasks.length)) * 100}%` }} /></div>
      <p>{done}/{tasks.length} complete</p>
      <div className="row">
        <input className="input" style={{ flex: 1 }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task" />
        <button className="btn" onClick={() => { addTask({ title, due: new Date().toISOString().slice(0, 10), type: "general" }); setTitle(""); }}>Add</button>
      </div>
      {tasks.map((t) => (
        <div className="card row" key={t.id} style={{ justifyContent: "space-between" }}>
          <label><input type="checkbox" checked={t.done} onChange={() => {
            const done = !t.done;
            setState((s) => ({ ...s, tasks: (s.tasks || []).map((x) => x.id === t.id ? { ...x, done } : x) }));
            if (getToken() && (t._id || t.id)) dataApi.patchTask(t._id || t.id, { done }).catch(() => {});
          }} /> {t.title}</label>
          <span className="muted">{t.due}</span>
          <button className="btn ghost" onClick={() => {
            setState((s) => ({ ...s, tasks: (s.tasks || []).filter((x) => x.id !== t.id) }));
            if (getToken() && (t._id || t.id)) dataApi.delTask(t._id || t.id).catch(() => {});
          }}>Delete</button>
        </div>
      ))}
    </div>
  );
}


export function Alerts() {
  const { alerts, rec, weather } = useFarm();
  const nav = useNavigate();
  const fallback = [
    { id: "a1", level: "warning", title: rec?.recommendation || "Check irrigation today", to: "/irrigation" },
    { id: "a2", level: "warning", title: "Rain probability 65%", to: "/weather" },
    { id: "a3", level: "warning", title: "Tomato blight risk 34% on Field A", to: "/doctor" },
    { id: "a4", level: "info", title: "Canopy heat 29°C", to: "/weather" },
    { id: "a5", level: "info", title: "Tomato mandi price update", to: "/market" },
    { id: "a6", level: "info", title: "Field B soil test due", to: "/soil" },
    { id: "a7", level: "info", title: "Open farm tasks", to: "/tasks" },
  ];
  const list = alerts && alerts.length ? alerts : fallback;
  return (
    <div className="grid">
      <h2>Alerts</h2>
      {list.map((a) => (
        <div className="card row" key={a.id} style={{ justifyContent: "space-between" }}>
          <div>
            <span className="tag">{a.level}</span>
            <b> {a.title}</b>
          </div>
          <div className="row">
            <button type="button" className="btn ghost" onClick={() => nav(a.to || "/")}>Open</button>
            <button type="button" className="btn" onClick={() => nav(a.to || "/")}>Read</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Iot() {
  const { rec, state, setState } = useFarm();
  const s = state.sensors;
  return (
    <div className="grid">
      <h2>IoT · ESP32</h2>
      <p>{s.online ? "Online" : "Offline"} · last seen {new Date(s.lastSeen).toLocaleTimeString()}</p>
      <div className="grid g-4">
        {[["Moisture", `${s.moisture}%`], ["Temp", `${s.temperature}°C`], ["Humidity", `${s.humidity}%`], ["Rain sensor", s.rain ? "Wet" : "Dry"], ["Pump", rec.iot.pump ? "ON" : "OFF"]].map(([k, v]) => (
          <div className="card iot-node" key={k}><div className="muted">{k}</div><div className="kpi">{v}</div></div>
        ))}
      </div>
      <div className="card">
        <h3>Flow</h3>
        <p>Sensor ({s.moisture}%) → ESP32 → AI → <b>{rec.action.toUpperCase()}</b> → Pump {rec.iot.pump ? "ON" : "OFF"} → {rec.impact.waterSavedL}L saved</p>
        <label>Moisture
          <input type="range" min="10" max="80" value={s.moisture} onChange={(e) => setState((st) => ({ ...st, sensors: { ...st.sensors, moisture: +e.target.value, lastSeen: Date.now() } }))} />
        </label>
      </div>
    </div>
  );
}

export function Impact() {
  const { rec } = useFarm();
  const data = [
    { n: "Water L", v: rec.impact.waterSavedL },
    { n: "₹", v: rec.impact.moneySaved },
    { n: "Health", v: rec.crop.health },
    { n: "Yield %", v: rec.impact.yieldLiftPct },
    { n: "CO₂ kg", v: rec.impact.co2Kg },
  ];
  return (
    <div className="grid">
      <h2>Impact</h2>
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
  const { rec, state } = useFarm();
  return (
    <div className="grid">
      <h2>Reports</h2>
      <div className="card" id="print-area">
        <h3>FarmSense weekly brief — {state.farm.location}</h3>
        <p>Farmer {state.farm.farmer} · {state.farm.area} acres</p>
        <p><b>Decision:</b> {rec.recommendation}</p>
        <p>{rec.reason}</p>
        <p>Water saved {rec.impact.waterSavedL}L · ₹{rec.impact.moneySaved} · Yield lift {rec.impact.yieldLiftPct}%</p>
        <p>Yield outlook {predictYield({ crop: rec.crop.name }).totalT} t total</p>
      </div>
      <button className="btn" onClick={() => window.print()}>Print / download</button>
    </div>
  );
}

export function FarmPage() {
  const { state, setState, toast } = useFarm();
  const f = state.farm;
  const set = (k, v) => setState((s) => ({ ...s, farm: { ...s.farm, [k]: v } }));
  return (
    <div className="grid">
      <h2>Farm profile</h2>
      <div className="card grid">
        {[["farmer", "Farmer"], ["location", "Location"], ["soil", "Soil"], ["irrigation", "Irrigation"], ["waterSource", "Water source"]].map(([k, l]) => (
          <label key={k}>{l}<input className="input" value={f[k]} onChange={(e) => set(k, e.target.value)} /></label>
        ))}
        <label>Area acres<input className="input" type="number" value={f.area} onChange={(e) => set("area", +e.target.value)} /></label>
        <button className="btn" onClick={() => { toast("Farm saved"); if (getToken()) farmApi.save(f).catch(() => {}); }}>Save</button>
      </div>
    </div>
  );
}

export function Settings() {
  const { state, setState, setTheme, toast, user, setUser } = useFarm();
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
      toast(mode === "login" ? "Logged in" : "Registered");
    } catch (e) {
      toast(e.message);
    }
  };
  return (
    <div className="grid">
      <h2>Settings</h2>
      <div className="card grid">
        <h3>Account</h3>
        {user ? <p>Signed in as {user.name} ({user.email})</p> : (
          <>
            <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="row">
              <button className="btn" onClick={() => doAuth("login")}>Login</button>
              <button className="btn ghost" onClick={() => doAuth("register")}>Register</button>
            </div>
          </>
        )}
        {user && <button className="btn ghost" onClick={() => { setToken(null); setUser(null); toast("Logged out"); }}>Logout</button>}
        <label>Language
          <select className="input" value={state.farm.language} onChange={(e) => setState((s) => ({ ...s, farm: { ...s.farm, language: e.target.value } }))}>
            <option value="en">English</option><option value="hi">Hindi</option><option value="ta">Tamil</option>
          </select>
        </label>
        <div className="row">
          <button className="btn" onClick={() => { setTheme("light"); document.documentElement.dataset.theme = "light"; }}>Light</button>
          <button className="btn ghost" onClick={() => { setTheme("dark"); document.documentElement.dataset.theme = "dark"; }}>Dark</button>
        </div>
        <label><input type="checkbox" checked={state.offline} onChange={(e) => setState((s) => ({ ...s, offline: e.target.checked }))} /> Force offline / queued sync</label>
        <p className="muted">Notifications, metric units, device pairing and privacy stay on-device.</p>
        <button className="btn" onClick={() => { localStorage.clear(); toast("Local data cleared"); location.reload(); }}>Clear local data</button>
      </div>
    </div>
  );
}