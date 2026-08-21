import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { loadState, saveState } from "../services/storage";
import { generateFarmRecommendation, weatherBase, soilBase, marketBase } from "../services/decisionEngine";
import { getToken, setToken, authApi, farmApi, dataApi, aiApi } from "../services/api";
import { t as tr, RTL, applyI18nToRec } from "../i18n";

const Ctx = createContext(null);
export const useFarm = () => useContext(Ctx);

export function FarmProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [toasts, setToasts] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [user, setUser] = useState(null);
  const [liveWeather, setLiveWeather] = useState(null);
  const [liveMarket, setLiveMarket] = useState(null);
  const [forecast, setForecast] = useState(null);
  const synced = useRef(false);

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    const language = state.farm?.language || localStorage.getItem("farmsense-lang") || "en";
    document.documentElement.lang = language;
    document.documentElement.dir = RTL.has(language) ? "rtl" : "ltr";
  }, [state.farm?.language]);

  useEffect(() => {
    const loadWx = (q = "") => {
      dataApi.weather(q).then(setLiveWeather).catch(() => {});
      dataApi.forecast().then(setForecast).catch(() => {});
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => loadWx(`?lat=${p.coords.latitude}&lon=${p.coords.longitude}`),
        () => loadWx()
      );
    } else loadWx();
    dataApi.market().then(setLiveMarket).catch(() => {});
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    authApi.me().then((d) => setUser(d.user)).catch(() => setToken(null));
    farmApi.state().then((d) => {
      setState((s) => ({
        ...s,
        farm: { ...s.farm, ...d.farm },
        sensors: { ...s.sensors, ...d.sensors },
        weatherOverride: d.weatherOverride || s.weatherOverride,
        theme: d.theme || s.theme,
      }));
    }).catch(() => {});
    dataApi.tasks().then((tasks) => {
      if (Array.isArray(tasks) && tasks.length) {
        setState((s) => ({ ...s, tasks: tasks.map((t) => ({ ...t, id: t._id || t.id })) }));
      }
    }).catch(() => {});
    aiApi.scans().then((scans) => {
      if (Array.isArray(scans) && scans.length) {
        setState((s) => ({ ...s, scans: scans.map((x) => ({ ...x, id: x._id || x.id, at: x.at || Date.parse(x.createdAt) || Date.now() })) }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!getToken() || !user) return;
    const t = setTimeout(() => farmApi.sensors(state.sensors).catch(() => {}), 800);
    return () => clearTimeout(t);
  }, [state.sensors, user]);

  const toast = (msg) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  };

  const weather = { ...weatherBase, ...liveWeather, ...(state.weatherOverride || {}) };
  const soil = { ...soilBase, moisture: state.sensors.moisture };
  const market = { ...marketBase, ...liveMarket };
  const lang = state.farm?.language || (typeof localStorage !== "undefined" && localStorage.getItem("farmsense-lang")) || "en";
  const tFn = (key, vars) => tr(lang, key, vars);

  const recRaw = useMemo(
    () =>
      generateFarmRecommendation({
        weather,
        soil,
        crop: { name: state.farm.crops[0] || "Tomato" },
        iot: state.sensors,
        market,
      }),
    [weather.rainProb, weather.temp, soil.moisture, state.farm.crops, state.sensors, market.tomato]
  );
  const rec = useMemo(() => applyI18nToRec(recRaw, tFn), [recRaw, lang]);

  useEffect(() => {
    if (!getToken() || !user || synced.current) return;
    synced.current = true;
    aiApi.recommend({ weather, soil, crop: rec.crop, iot: state.sensors, market }).catch(() => {});
  }, [user]);

  const alerts = useMemo(() => {
    const list = [
      { id: "a1", type: "irrigation", level: rec.action === "delay" ? "info" : "warning", title: rec.recommendation, to: "/irrigation" },
      { id: "a2", type: "rain", level: weather.rainProb > 60 ? "warning" : "info", title: tFn("alert.rain", { n: weather.rainProb }), to: "/weather" },
      { id: "a3", type: "disease", level: "warning", title: tFn("alert.blight"), to: "/doctor" },
      { id: "a4", type: "heat", level: weather.temp >= 35 ? "critical" : "info", title: tFn("alert.heat", { n: weather.temp }), to: "/weather" },
      { id: "a5", type: "market", level: "info", title: tFn("alert.price", { n: market.tomato }), to: "/market" },
      { id: "a6", type: "soil", level: "info", title: tFn("alert.soil"), to: "/soil" },
      { id: "a7", type: "task", level: "info", title: tFn("alert.tasks"), to: "/tasks" },
    ];
    return list.map((a) => ({ ...a, read: (state.alertsRead || []).includes(a.id) }));
  }, [rec, weather, state.alertsRead, market.tomato, lang]);

  const value = {
    state,
    setState,
    rec,
    weather,
    soil,
    market,
    forecast,
    toast,
    toasts,
    online: online && !state.offline,
    setTheme: (theme) => setState((s) => ({ ...s, theme })),
    t: tFn,
    setLanguage: (language) => {
      localStorage.setItem("farmsense-lang", language);
      document.documentElement.lang = language;
      document.documentElement.dir = RTL.has(language) ? "rtl" : "ltr";
      setState((s) => ({ ...s, farm: { ...s.farm, language } }));
    },
    user,
    setUser,
    addTask: (task) => {
      setState((s) => ({ ...s, tasks: [{ id: `t${Date.now()}`, done: false, ...task }, ...s.tasks] }));
      toast(tFn("ui.addedTasks"));
      if (getToken()) dataApi.addTask(task).catch(() => {});
    },
    saveFav: (payload) => {
      if (getToken()) dataApi.addFav({ kind: "recommendation", payload }).catch(() => {});
      toast(tFn("ui.savedToast"));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}