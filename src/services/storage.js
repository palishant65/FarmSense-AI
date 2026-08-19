const KEY = "farmsense-v1";

const defaults = {
  farm: {
    farmer: "Ramesh Singh",
    location: "Dehradun, Uttarakhand",
    area: 4.5,
    crops: ["Tomato", "Wheat", "Potato"],
    soil: "Loam",
    irrigation: "Drip",
    waterSource: "Borewell",
    language: "en",
    onboarded: true,
  },
  theme: "light",
  units: "metric",
  offline: false,
  demo: false,
  tasks: [
    { id: "t1", title: "Scout tomato field for blight", due: "2026-08-20", done: false, type: "crop" },
    { id: "t2", title: "Delay irrigation (AI)", due: "2026-08-20", done: false, type: "irrigation" },
    { id: "t3", title: "Collect soil sample — Field B", due: "2026-08-22", done: true, type: "soil" },
  ],
  alertsRead: [],
  scans: [],
  queue: [],
  sensors: {
    moisture: 38,
    temperature: 29,
    humidity: 71,
    rain: 0,
    pump: false,
    online: true,
    lastSeen: Date.now(),
  },
  weatherOverride: null,
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
