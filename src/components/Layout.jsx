import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useFarm } from "../context/FarmContext";
import { schemes } from "../services/decisionEngine";

const primary = [
  ["/", "Dashboard", "⌂"],
  ["/farm", "Farm", "▣"],
  ["/map", "Farm Map", "◎"],
  ["/analytics", "Analytics", "▦"],
  ["/weather", "Weather", "☁"],
  ["/soil", "Soil", "⬡"],
  ["/iot", "IoT", "◉"],
  ["/crops", "Crops", "❀"],
];

const more = [
  ["/doctor", "Crop Doctor"],
  ["/irrigation", "Irrigation"],
  ["/assistant", "Copilot"],
  ["/market", "Market"],
  ["/tasks", "Tasks"],
  ["/alerts", "Alerts"],
  ["/schemes", "Schemes"],
  ["/impact", "Impact"],
  ["/reports", "Reports"],
  ["/settings", "Settings"],
];

export default function Layout() {
  const farm = useFarm() || {};
  const { rec, toast, toasts, online, state, alerts, weather } = farm;
  const [pal, setPal] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [menu, setMenu] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const nav = useNavigate();
  const unread = (alerts || []).filter((a) => !a.read).length;
  const name = state?.farm?.farmer || "Farmer";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

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

  const go = (to) => {
    nav(to);
    setOpen(false);
    setMenu(false);
  };

  const items = [
    ...primary.map(([to, label]) => ({ to, label, group: "Pages" })),
    ...more.map(([to, label]) => ({ to, label, group: "More" })),
    ...(state?.tasks || []).map((t) => ({ to: "/tasks", label: t.title, group: "Tasks" })),
    ...(schemes || []).map((s) => ({ to: "/schemes", label: s.name, group: "Schemes" })),
    ...(alerts || []).map((a) => ({ to: a.to, label: a.title, group: "Alerts" })),
    { to: "/", label: rec?.recommendation || "Dashboard", group: "Recommendation" },
  ].filter((i) => (i.label || "").toLowerCase().includes(q.toLowerCase()));

  const SidebarInner = (
    <>
      <div className="brand">
        <div className="brand-mark">FS</div>
        <div>
          <h1>FarmSense AI</h1>
          <p>Sense → Decide → Act</p>
        </div>
      </div>
      <nav className="nav-scroll" aria-label="Main">
        {primary.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            <span className="nav-ico">{icon}</span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
        <button type="button" className="nav-link nav-more-btn" onClick={() => setMoreOpen((v) => !v)}>
          <span className="nav-ico">▾</span>
          <span className="nav-label">More</span>
        </button>
        {moreOpen && more.map(([to, label]) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => "nav-link nav-sub" + (isActive ? " active" : "")}>
            <span className="nav-label">{label}</span>
            {to === "/alerts" && unread ? <span className="nav-badge">{unread}</span> : null}
          </NavLink>
        ))}
      </nav>
      <div className="side-foot">
        <button type="button" className="nav-link" onClick={() => { setHelp(true); setOpen(false); }}>
          <span className="nav-ico">?</span>
          <span className="nav-label">Help & Support</span>
        </button>
        <button type="button" className="side-profile" onClick={() => go("/farm")}>
          <span className="avatar">{initials}</span>
          <span>
            <strong>{name}</strong>
            <small>{state?.farm?.location}</small>
          </span>
        </button>
      </div>
    </>
  );

  return (
    <div className={"app-shell" + (open ? " nav-open" : "")}>
      <aside className="sidebar">{SidebarInner}</aside>
      {open && <div className="nav-scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        {!online && <div className="offline">Offline mode — using cached farm data. Changes are queued locally.</div>}
        <header className="topbar">
          <button type="button" className="hamburger" aria-label="Menu" onClick={() => setOpen((v) => !v)}>☰</button>
          <div className="top-brand">
            <span className="brand-mark sm">FS</span>
            <strong>FarmSense AI</strong>
          </div>
          <button className="search-btn" onClick={() => setPal(true)}>Search farm, tasks, schemes…  ⌘K</button>
          <span className="tag hide-sm">{state?.farm?.location}</span>
          <span className="tag">{weather?.temp ?? "--"}°C</span>
          <div className="head-user">
            <button type="button" className="user-chip" onClick={() => setMenu((v) => !v)}>
              <span className="avatar">{initials}</span>
              <span className="hide-sm">{name}</span>
            </button>
            {menu && (
              <div className="user-menu">
                <button type="button" onClick={() => go("/farm")}>Profile / Farm</button>
                <button type="button" onClick={() => go("/settings")}>Settings</button>
                <button type="button" onClick={() => go("/assistant")}>Copilot</button>
              </div>
            )}
          </div>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </div>
      <div className="toast-wrap">
        {(toasts || []).map((t) => (
          <div className="toast" key={t.id}>{t.msg}</div>
        ))}
      </div>
      {help && (
        <div className="modal-bg" onClick={() => setHelp(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Help & Support</h3>
            <p>FarmSense AI uses the Decision Engine on every page. Demo path: Dashboard → Irrigation → Doctor → Weather → Soil → Market → Copilot → Impact.</p>
            <p className="muted">Search with ⌘/Ctrl+K. Advisory only — confirm sprays with a local agri officer.</p>
            <button className="btn" onClick={() => setHelp(false)}>Close</button>
          </div>
        </div>
      )}
      {pal && (
        <div className="modal-bg" onClick={() => setPal(false)}>
          <div className="palette" onClick={(e) => e.stopPropagation()}>
            <input autoFocus className="input" style={{ border: 0, borderRadius: 0 }} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div style={{ maxHeight: 360, overflow: "auto" }}>
              {items.slice(0, 16).map((i, n) => (
                <div
                  key={n}
                  className="nav-link pal-item"
                  onClick={() => {
                    nav(i.to);
                    setPal(false);
                    toast?.(`Opened ${i.label}`);
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