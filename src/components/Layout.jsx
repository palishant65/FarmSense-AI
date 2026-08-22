import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useFarm } from "../context/FarmContext";
import { schemes } from "../services/decisionEngine";
import { LANGS } from "../i18n";

const primaryKeys = [
  ["/dashboard", "nav.dashboard", "⌂"],
  ["/farm", "nav.farm", "▣"],
  ["/map", "nav.map", "◎"],
  ["/analytics", "nav.analytics", "▦"],
  ["/weather", "nav.weather", "☁"],
  ["/soil", "nav.soil", "⬡"],
  ["/iot", "nav.iot", "◉"],
  ["/crops", "nav.crops", "❀"],
];

const moreKeys = [
  ["/doctor", "nav.doctor"],
  ["/irrigation", "nav.irrigation"],
  ["/assistant", "nav.copilot"],
  ["/market", "nav.market"],
  ["/tasks", "nav.tasks"],
  ["/alerts", "nav.alerts"],
  ["/schemes", "nav.schemes"],
  ["/impact", "nav.impact"],
  ["/reports", "nav.reports"],
  ["/settings", "nav.settings"],
];

export default function Layout() {
  const { rec, toast, toasts, online, state, alerts, weather, t = (k) => k, setLanguage, user } = useFarm() || {};
  const [pal, setPal] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [menu, setMenu] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const primary = primaryKeys.map(([to, k, icon]) => [to, t(k), icon]);
  const more = moreKeys.map(([to, k]) => [to, t(k)]);
  const nav = useNavigate();
  const unread = (alerts || []).filter((a) => !a.read).length;
  const name = user?.name || state?.farm?.farmer || t("ui.farmer");
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
    ...primary.map(([to, label]) => ({ to, label, group: t("menu.pages") })),
    ...more.map(([to, label]) => ({ to, label, group: t("menu.more") })),
    ...(state?.tasks || []).map((task) => ({ to: "/tasks", label: task.title, group: t("nav.tasks") })),
    ...schemes.map((s) => ({ to: "/schemes", label: t(`sch.${s.id === "uk-soil" ? "uk" : s.id}`), group: t("nav.schemes") })),
    ...(alerts || []).map((a) => ({ to: a.to, label: a.title, group: t("nav.alerts") })),
    { to: "/dashboard", label: rec?.recommendation || t("nav.dashboard"), group: t("menu.recommendation") },
  ].filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));

  const SidebarInner = (
    <>
      <div className="brand">
        <div className="brand-mark">FS</div>
        <div>
          <h1>FarmSense AI</h1>
          <p>{t("tagline")}</p>
        </div>
      </div>
      <nav className="nav-scroll" aria-label="Main">
        {primary.map(([to, label, icon]) => (
            <NavLink key={to} to={to} end={to === "/dashboard"} onClick={() => setOpen(false)} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            <span className="nav-ico">{icon}</span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
        <button type="button" className="nav-link nav-more-btn" onClick={() => setMoreOpen((v) => !v)}>
          <span className="nav-ico">▾</span>
          <span className="nav-label">{t("nav.more")}</span>
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
          <span className="nav-label">{t("nav.help")}</span>
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
        {!online && <div className="offline">{t("offline")}</div>}
        <header className="topbar">
          <button type="button" className="hamburger" aria-label="Menu" onClick={() => setOpen((v) => !v)}>☰</button>
          <div className="top-brand">
            <span className="brand-mark sm">FS</span>
            <strong>FarmSense AI</strong>
          </div>
          <button className="search-btn" onClick={() => setPal(true)}>{t("menu.search")}  ⌘K</button>
          <span className="tag hide-sm">{state.farm.location}</span>
          <span className="tag">{weather?.temp ?? "--"}°C</span>
          <div className="head-user">
            <button type="button" className="user-chip" onClick={() => setMenu((v) => !v)}>
              <span className="avatar">{initials}</span>
              <span className="hide-sm">{name}</span>
            </button>
            {menu && (
              <div className="user-menu">
                <button type="button" onClick={() => go("/farm")}>{t("menu.profile")}</button>
                <button type="button" onClick={() => go("/settings")}>{t("nav.settings")}</button>
                <button type="button" onClick={() => go("/assistant")}>{t("nav.copilot")}</button>
                <button type="button" onClick={() => setLangOpen((v) => !v)}>{t("menu.language")} ▾</button>
                {langOpen && LANGS.map((L) => (
                  <button type="button" key={L.id} onClick={() => { setLanguage?.(L.id); setLangOpen(false); setMenu(false); }}>
                    {L.name}
                  </button>
                ))}
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
            <h3>{t("nav.help")}</h3>
            <p>{t("help.body")}</p>
            <button className="btn" onClick={() => setHelp(false)}>{t("btn.close")}</button>
          </div>
        </div>
      )}
      {pal && (
        <div className="modal-bg" onClick={() => setPal(false)}>
          <div className="palette" onClick={(e) => e.stopPropagation()}>
            <input autoFocus className="input" style={{ border: 0, borderRadius: 0 }} placeholder={t("ui.search")} value={q} onChange={(e) => setQ(e.target.value)} />
            <div style={{ maxHeight: 360, overflow: "auto" }}>
              {items.slice(0, 16).map((i, n) => (
                <div
                  key={n}
                  className="nav-link pal-item"
                  onClick={() => {
                    nav(i.to);
                    setPal(false);
                    toast(t("ui.opened", { label: i.label }));
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
