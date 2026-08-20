const BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN = "farmsense-token";

export const getToken = () => localStorage.getItem(TOKEN);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN, t) : localStorage.removeItem(TOKEN));

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = { method, headers, body: form };
  else {
    if (body) headers["Content-Type"] = "application/json";
    payload = { method, headers, body: body ? JSON.stringify(body) : undefined };
  }
  const res = await fetch(`${BASE}${path}`, payload);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || res.statusText);
  return json.data;
}

export const authApi = {
  register: (b) => api("/auth/register", { method: "POST", body: b }),
  login: (b) => api("/auth/login", { method: "POST", body: b }),
  logout: () => api("/auth/logout", { method: "POST" }),
  me: () => api("/auth/me"),
  updateMe: (b) => api("/auth/me", { method: "PATCH", body: b }),
};

export const farmApi = {
  get: () => api("/farms"),
  state: () => api("/farms/state"),
  save: (b) => api("/farms", { method: "PATCH", body: b }),
  sensors: (b) => api("/farms/sensors", { method: "PATCH", body: b }),
};

export const aiApi = {
  recommend: (b) => api("/ai/recommend", { method: "POST", body: b }),
  irrigation: (b) => api("/ai/irrigation", { method: "POST", body: b }),
  soil: (b) => api("/ai/soil", { method: "POST", body: b }),
  disease: (form) => api("/ai/disease", { method: "POST", form }),
  scans: () => api("/ai/scans"),
  copilot: (b) => api("/ai/copilot", { method: "POST", body: b }),
  yield: (b) => api("/ai/yield", { method: "POST", body: b }),
  profit: (b) => api("/ai/profit", { method: "POST", body: b }),
};

export const dataApi = {
  weather: (q = "") => api(`/weather${q}`),
  forecast: () => api("/forecast"),
  market: () => api("/market"),
  schemes: (q = "") => api(`/schemes?q=${encodeURIComponent(q)}`),
  tasks: () => api("/tasks"),
  addTask: (b) => api("/tasks", { method: "POST", body: b }),
  patchTask: (id, b) => api(`/tasks/${id}`, { method: "PATCH", body: b }),
  delTask: (id) => api(`/tasks/${id}`, { method: "DELETE" }),
  alerts: () => api("/alerts"),
  readAlert: (id) => api(`/alerts/${id}`, { method: "PATCH" }),
  history: () => api("/history"),
  favs: () => api("/favourites"),
  addFav: (b) => api("/favourites", { method: "POST", body: b }),
  analytics: (range) => api(`/analytics?range=${range}`),
  reports: () => api("/reports"),
};