import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useFarm } from "../context/FarmContext";
import { schemes } from "../services/decisionEngine";

const links = [
  ["Overview", [
    ["/", "Dashboard"],
    ["/farm", "Farm"],
    ["/map", "Farm Map"],
    ["/analytics", "Analytics"],
  ]],
  ["Sense", [
    ["/weather", "Weather"],
    ["/soil", "Soil"],
    ["/iot", "IoT"],
    ["/crops", "Crops"],
  ]],
  ["Decide", [
    ["/doctor", "Crop Doctor"],
    ["/irrigation", "Irrigation"],
    ["/assistant", "Copilot"],
    ["/market", "Market"],
  ]],
  ["Act", [
    ["/tasks", "Tasks"],
    ["/alerts", "Alerts"],
    ["/schemes", "Schemes"],
  ]],
  ["Impact", [
    ["/impact", "Impact"],
    ["/reports", "Reports"],
    ["/settings", "Settings"],
  ]],
];

export default function Layout() {
  const { rec, toast, toasts, online, state, alerts } = useFarm();
  const [pal, setPal] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const unread = alerts.filter((a) => !a.read).length;

  useEffect(() => {
    const k = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPal(true);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const items = [
    ...links.flatMap(([, xs]) => xs.map(([to, label]) => ({ to, label, group: "Pages" }))),
    ...state.tasks.map((t) => ({ to: "/tasks", label: t.title, group: "Tasks" })),
    ...schemes.map((s) => ({ to: "/schemes", label: s.name, group: "Schemes" })),
    ...alerts.map((a) => ({ to: a.to, label: a.title, group: "Alerts" })),
    { to: "/", label: rec.recommendation, group: "Recommendation" },
  ].filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">FS</div>
          <div>
            <h1>FarmSense AI</h1>
            <p>Sense → Decide → Act</p>
          </div>
        </div>
        <div className="nav-scroll">
          {links.map(([g, xs]) => (
            <div key={g}>
              <div className="nav-group">{g}</div>
              {xs.map(([to, label]) => (
                <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                  {label}
                  {to === "/alerts" && unread ? ` (${unread})` : ""}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </aside>
      <div className="main">
        {!online && <div className="offline">Offline mode — using cached farm data. Changes are queued locally.</div>}
        <header className="topbar">
          <button className="search-btn" onClick={() => setPal(true)}>Search farm, tasks, schemes…  ⌘K</button>
          <span className="tag">{state.farm.location}</span>
          <button className="btn ghost" onClick={() => nav("/assistant")}>Copilot</button>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </div>
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>{t.msg}</div>
        ))}
      </div>
      {pal && (
        <div className="modal-bg" onClick={() => setPal(false)}>
          <div className="palette" onClick={(e) => e.stopPropagation()}>
            <input autoFocus className="input" style={{ border: 0, borderRadius: 0 }} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div style={{ maxHeight: 360, overflow: "auto" }}>
              {items.slice(0, 16).map((i, n) => (
                <div
                  key={n}
                  className="nav-link"
                  style={{ color: "var(--ink)" }}
                  onClick={() => {
                    nav(i.to);
                    setPal(false);
                    toast(`Opened ${i.label}`);
                  }}
                >
                  <span className="muted" style={{ width: 110 }}>{i.group}</span>
                  {i.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
