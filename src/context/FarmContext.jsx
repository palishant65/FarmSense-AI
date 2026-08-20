import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { loadState, saveState } from "../services/storage";
import { generateFarmRecommendation, weatherBase, soilBase, marketBase } from "../services/decisionEngine";
import { getToken, setToken, authApi, farmApi, dataApi, aiApi } from "../services/api";

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
  const rec = useMemo(
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

  useEffect(() => {
    if (!getToken() || !user || synced.current) return;
    synced.current = true;
    aiApi.recommend({ weather, soil, crop: rec.crop, iot: state.sensors, market }).catch(() => {});
  }, [user]);

  const alerts = useMemo(() => {
    const list = [
      { id: "a1", type: "irrigation", level: rec.action === "delay" ? "info" : "warning", title: rec.recommendation, to: "/irrigation" },
      { id: "a2", type: "rain", level: weather.rainProb > 60 ? "warning" : "info", title: `Rain probability ${weather.rainProb}%`, to: "/weather" },
      { id: "a3", type: "disease", level: "warning", title: "Tomato blight risk 34% on Field A", to: "/doctor" },
      { id: "a4", type: "heat", level: weather.temp >= 35 ? "critical" : "info", title: `Canopy heat ${weather.temp}°C`, to: "/weather" },
      { id: "a5", type: "market", level: "info", title: `Tomato ₹${market.tomato}/kg`, to: "/market" },
      { id: "a6", type: "soil", level: "info", title: "Field B soil test due", to: "/soil" },
      { id: "a7", type: "task", level: "info", title: "2 open farm tasks", to: "/tasks" },
    ];
    return list.map((a) => ({ ...a, read: state.alertsRead.includes(a.id) }));
  }, [rec, weather, state.alertsRead, market.tomato]);

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
    user,
    setUser,
    addTask: (task) => {
      setState((s) => ({ ...s, tasks: [{ id: `t${Date.now()}`, done: false, ...task }, ...s.tasks] }));
      toast("Added to tasks");
      if (getToken()) dataApi.addTask(task).catch(() => {});
    },
    saveFav: (payload) => {
      if (getToken()) dataApi.addFav({ kind: "recommendation", payload }).catch(() => {});
      toast("Saved");
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}