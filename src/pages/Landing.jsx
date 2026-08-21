import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "../context/FarmContext";
import { authApi, getToken, setToken } from "../services/api";
import farmBg from "../assets/landing-bg.jpg";
import { LANGS } from "../i18n";

const nodes = [
  { k: "land.soil", x: "8%", y: "28%", icon: "leaf" },
  { k: "land.weather", x: "78%", y: "22%", icon: "cloud" },
  { k: "land.irrig", x: "6%", y: "58%", icon: "drop" },
  { k: "land.crop", x: "86%", y: "58%", icon: "plant" },
];

const pills = [
  { tk: "land.rc", dk: "land.rcd", icon: "leaf" },
  { tk: "land.rw", dk: "land.rwd", icon: "drop" },
  { tk: "land.rwe", dk: "land.rwed", icon: "cloud" },
  { tk: "land.by", dk: "land.byd", icon: "bars" },
];

function Ico({ name }) {
  const p = { width: 28, height: 28, fill: "none", stroke: "#9fe3b0", strokeWidth: 1.6 };
  if (name === "cloud") return <svg {...p} viewBox="0 0 24 24"><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11-1 4 4 0 0 0 1 9z" /></svg>;
  if (name === "drop") return <svg {...p} viewBox="0 0 24 24"><path d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z" /></svg>;
  if (name === "plant") return <svg {...p} viewBox="0 0 24 24"><path d="M12 21V11M12 11c-4-1-7-4-7-8 5 0 7 4 7 8zm0 0c4-1 7-4 7-8-5 0-7 4-7 8z" /></svg>;
  if (name === "bars") return <svg {...p} viewBox="0 0 24 24"><path d="M5 20V10M12 20V4M19 20v-7" /></svg>;
  return <svg {...p} viewBox="0 0 24 24"><path d="M5 19c4-9 6-13 7-16 1 3 3 7 7 16-5-2-9-2-14 0z" /></svg>;
}

export default function Landing() {
  const nav = useNavigate();
  const ctx = useFarm() || {};
  const t = ctx.t || ((k) => k);
  const setLanguage = ctx.setLanguage;
  const setUser = ctx.setUser || (() => {});
  const toast = ctx.toast || (() => {});
  const lang = ctx.state?.farm?.language || "en";
  const [mode, setMode] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = mode === "login"
        ? await authApi.login({ email, password })
        : await authApi.register({ name: name || "Farmer", email, password });
      setToken(d.token);
      setUser(d.user);
      toast(mode === "login" ? t("ui.loggedIn") : t("ui.registered"));
      nav("/dashboard");
    } catch (err) {
      toast(err.message || t("ui.authFail"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hero-land">
      <img className="hero-land-bg" src={farmBg} alt="" />
      <div className="hero-land-shade" />
      {nodes.map((n) => (
        <div key={n.k} className="hero-node" style={{ left: n.x, top: n.y }}>
          <span className="hero-orb"><Ico name={n.icon} /></span>
          <small>{t(n.k)}</small>
        </div>
      ))}
      <div className="hero-land-mid">
        <div className="hero-leaf">🌿</div>
        <h1>FarmSense <span>AI</span></h1>
        <p className="hero-tag">{t("land.tag")}</p>
        <p className="hero-lead">{t("land.lead")}</p>
        <div className="hero-btns">
          <button type="button" className="hero-login" onClick={() => setMode("login")}>{t("btn.login")}</button>
          <button type="button" className="hero-reg" onClick={() => setMode("register")}>{t("btn.register")}</button>
        </div>
        {getToken() && (
          <button type="button" className="hero-skip" onClick={() => nav("/dashboard")}>{t("land.continue")}</button>
        )}
        <div className="hero-pills">
          {pills.map((p) => (
            <div key={p.tk} className="hero-pill">
              <Ico name={p.icon} />
              <b>{t(p.tk)}</b>
              <span>{t(p.dk)}</span>
            </div>
          ))}
        </div>
        <div className="hero-langs">
          {LANGS.map((L) => (
            <button type="button" key={L.id} className={lang === L.id ? "on" : ""} onClick={() => setLanguage?.(L.id)}>{L.name}</button>
          ))}
        </div>
        <p className="hero-copy">{t("land.copy")}</p>
      </div>
      {mode && (
        <div className="modal-bg" onClick={() => setMode(null)}>
          <form className="modal landing-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3>{mode === "login" ? t("btn.login") : t("btn.register")}</h3>
            {mode === "register" && <input className="input" placeholder={t("ui.name")} value={name} onChange={(e) => setName(e.target.value)} />}
            <input className="input" type="email" required placeholder={t("ui.email")} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" type="password" required minLength={6} placeholder={t("ui.password")} value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="row">
              <button className="btn" type="submit" disabled={busy}>{busy ? t("btn.wait") : mode === "login" ? t("btn.login") : t("ui.create")}</button>
              <button className="btn ghost" type="button" onClick={() => setMode(null)}>{t("btn.cancel")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}