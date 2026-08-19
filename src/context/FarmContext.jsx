import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadState, saveState } from "../services/storage";
import { generateFarmRecommendation, weatherBase, soilBase } from "../services/decisionEngine";

const Ctx = createContext(null);
export const useFarm = () => useContext(Ctx);

export function FarmProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [toasts, setToasts] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => saveState(state), [state]);
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

  const toast = (msg) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  };

  const weather = { ...weatherBase, ...(state.weatherOverride || {}) };
  const soil = { ...soilBase, moisture: state.sensors.moisture };
  const rec = useMemo(
    () =>
      generateFarmRecommendation({
        weather,
        soil,
        crop: { name: state.farm.crops[0] || "Tomato" },
        iot: state.sensors,
      }),
    [weather.rainProb, weather.temp, soil.moisture, state.farm.crops, state.sensors]
  );

  const alerts = useMemo(() => {
    const list = [
      { id: "a1", type: "irrigation", level: rec.action === "delay" ? "info" : "warning", title: rec.recommendation, to: "/irrigation" },
      { id: "a2", type: "rain", level: weather.rainProb > 60 ? "warning" : "info", title: `Rain probability ${weather.rainProb}%`, to: "/weather" },
      { id: "a3", type: "disease", level: "warning", title: "Tomato blight risk 34% on Field A", to: "/doctor" },
      { id: "a4", type: "heat", level: weather.temp >= 35 ? "critical" : "info", title: `Canopy heat ${weather.temp}°C`, to: "/weather" },
      { id: "a5", type: "market", level: "info", title: "Tomato +₹2 vs yesterday", to: "/market" },
      { id: "a6", type: "soil", level: "info", title: "Field B soil test due", to: "/soil" },
      { id: "a7", type: "task", level: "info", title: "2 open farm tasks", to: "/tasks" },
    ];
    return list.map((a) => ({ ...a, read: state.alertsRead.includes(a.id) }));
  }, [rec, weather, state.alertsRead]);

  const value = {
    state,
    setState,
    rec,
    weather,
    soil,
    alerts,
    toast,
    toasts,
    online: online && !state.offline,
    setTheme: (theme) => setState((s) => ({ ...s, theme })),
    addTask: (task) => {
      setState((s) => ({ ...s, tasks: [{ id: `t${Date.now()}`, done: false, ...task }, ...s.tasks] }));
      toast("Added to tasks");
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
