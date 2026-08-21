import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip, BarChart, Bar, Legend, YAxis } from "recharts";
import { useFarm } from "../context/FarmContext";
import { answerFarmQuestion, schemes, profitSim, predictYield } from "../services/decisionEngine";
import { authApi, farmApi, aiApi, dataApi, getToken, setToken } from "../services/api";
import { LANGS, cropKey } from "../i18n";

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
  const { t = (k) => k } = useFarm();
  const [range, setRange] = useState(7);
  const data = chart(range === "season" ? 16 : +range);
  return (
    <div className="grid">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12}}>
        <div>
          <h2 style={{margin:0, fontSize:28, fontWeight:800}}>📊 {t("an.title")}</h2>
          <p className="muted">Crop health, water, soil and profit trends</p>
        </div>
        <span className="premium-badge">Live Analytics</span>
      </div>
      <div className="row">
        {[7, 30, "season"].map((r) => (
          <button key={r} className={range === r ? "btn" : "btn ghost"} onClick={() => setRange(r)}>
            {r === "season" ? t("ui.season") : `${r} ${t("ui.days")}`}
          </button>
        ))}
      </div>
      <div className="card" style={{ height: 360, padding:20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="d" tick={{fontSize:11}} />
            <YAxis tick={{fontSize:11}} />
            <Tooltip contentStyle={{borderRadius:12, border:'1px solid var(--line)', background:'var(--white)'}} />
            <Legend />
            <Line dataKey="health" stroke="#1b5e3b" strokeWidth={2.5} dot={false} name="Health" />
            <Line dataKey="water" stroke="#7dcea0" strokeWidth={2} dot={false} name="Water" />
            <Line dataKey="soil" stroke="#2d7a4f" strokeWidth={2} dot={false} name="Soil" />
            <Line dataKey="rain" stroke="#2563eb" strokeWidth={2} dot={false} name="Rain" />
            <Line dataKey="yield" stroke="#d97706" strokeWidth={2} dot={false} name="Yield" />
            <Line dataKey="profit" stroke="#15803d" strokeWidth={2.5} dot={false} name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid g-4">
        {[
          ["Avg Health", "78/100", "❤️"],
          ["Water Saved", "1607L", "💧"],
          ["Profit", "₹24k", "💰"],
          ["Rain", "65%", "🌧️"]
        ].map(([k,v,icon]) => (
          <div key={k} className="card" style={{textAlign:'center', padding:16}}>
            <div style={{fontSize:20}}>{icon}</div>
            <div className="muted" style={{fontSize:11, fontWeight:700, textTransform:'uppercase', marginTop:6}}>{k}</div>
            <div className="kpi" style={{fontSize:20}}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Market() {
  const { rec, t = (k) => k } = useFarm();
  const [area, setArea] = useState(4.5);
  const [cost, setCost] = useState(38000);
  const [price, setPrice] = useState(rec.market.tomato);
  const sim = profitSim({ area, crop: rec.crop.name, cost, price });
  return (
    <div className="grid">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{margin:0, fontSize:28, fontWeight:800}}>🏪 {t("mkt.title")}</h2>
        <span className="tag ok">💹 e-NAM Live</span>
      </div>
      <div className="grid g-3">
        {[["Tomato", rec.market.tomato], ["Wheat", rec.market.wheat], ["Potato", rec.market.potato]].map(([k, v]) => (
          <div className="card" key={k} style={{padding:16, textAlign:'center'}}>
            <div className="muted" style={{fontSize:11, fontWeight:700, textTransform:'uppercase'}}>{t(cropKey(k))} {t("ui.mandi")}</div>
            <div className="kpi" style={{fontSize:24}}>₹{v}/kg</div>
            <p className="muted" style={{fontSize:12, marginTop:4}}>{t("ui.trend")} {rec.market.trendLabel || rec.market.trend} {rec.market.trend==='up'?'📈':'📉'}</p>
            <div className="progress" style={{marginTop:10, height:4}}><span style={{width:'70%'}}></span></div>
          </div>
        ))}
      </div>
      <div className="card" style={{borderLeft:'4px solid var(--ok)'}}>
        <h3 style={{marginTop:0}}>💡 {t("ui.sell")}</h3>
        <p className="muted">{t("ui.sellBody")} {rec.crop.label || rec.crop.name}.</p>
        <div className="tag" style={{marginTop:10}}>Recommendation: {rec.crop.label} at {rec.market.trend} market</div>
      </div>
      <div className="card">
        <h3 style={{marginTop:0}}>🧮 {t("ui.sim")}</h3>
        <div className="grid g-3" style={{marginTop:12}}>
          <label className="field" style={{margin:0}}><span className="muted" style={{fontSize:12}}>{t("ui.area")} (ac)</span><input className="input" type="number" value={area} onChange={(e) => setArea(+e.target.value)} /></label>
          <label className="field" style={{margin:0}}><span className="muted" style={{fontSize:12}}>{t("ui.cost")} (₹)</span><input className="input" type="number" value={cost} onChange={(e) => setCost(+e.target.value)} /></label>
          <label className="field" style={{margin:0}}><span className="muted" style={{fontSize:12}}>{t("ui.price")} (₹/kg)</span><input className="input" type="number" value={price} onChange={(e) => setPrice(+e.target.value)} /></label>
        </div>
        <div style={{overflowX:'auto', marginTop:16}}>
          <table className="table">
            <thead><tr><th></th><th>{t("ui.traditional")}</th><th style={{color:'var(--forest)', fontWeight:800}}>FarmSense AI</th></tr></thead>
            <tbody>
              {[["cost", t("ui.costRow")], ["revenue", t("ui.revenue")], ["profit", t("ui.profit")], ["perAcre", t("ui.perAcre")]].map(([k, lab]) => (
                <tr key={k}>
                  <td style={{fontWeight:600}}>{lab}</td>
                  <td className="muted">₹{Math.round(sim.traditional[k]).toLocaleString("en-IN")}</td>
                  <td style={{fontWeight:800, color:'var(--forest)'}}>₹{Math.round(sim.farmsense[k]).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function Schemes() {
  const { t = (k) => k } = useFarm();
  const [q, setQ] = useState("");
  const list = schemes.filter((s) => (s.name + s.cat + s.benefit).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="grid">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{margin:0, fontSize:28, fontWeight:800}}>📜 {t("sch.title")}</h2>
        <span className="tag info">{list.length} schemes</span>
      </div>
      <div className="card" style={{padding:12}}>
        <input className="input" placeholder={`🔍 ${t("menu.search")} schemes...`} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid g-2">
        {list.map((s) => (
          <div className="card" key={s.id} style={{padding:18}}>
            <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
              <span className="tag">{t(`cat.${s.cat}`)}</span>
              <span className="tag ok">₹ Benefit</span>
            </div>
            <h3 style={{margin:'10px 0 8px', fontSize:16}}>{t(`sch.${s.id === "uk-soil" ? "uk" : s.id}`)}</h3>
            <div style={{display:'grid', gap:8, fontSize:13, lineHeight:1.5}}>
              <p><b>🎁 {t("ui.benefit")}:</b> <span className="muted">{t(`sch.${s.id === "uk-soil" ? "uk" : s.id}B`)}</span></p>
              <p><b>✅ {t("ui.elig")}:</b> <span className="muted">{t(`sch.${s.id === "uk-soil" ? "uk" : s.id}E`)}</span></p>
              <p><b>📄 {t("ui.docs")}:</b> <span className="muted">{t(`sch.${s.id === "uk-soil" ? "uk" : s.id}D`)}</span></p>
            </div>
            <button className="btn ghost" style={{marginTop:12, width:'100%'}}>📋 View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const SPEECH = { en: "en-IN", hi: "hi-IN", bn: "bn-IN", mr: "mr-IN", te: "te-IN", ta: "ta-IN" };
const SPEECH_FALLBACK = {
  en: ["en-IN", "en-GB", "en-US", "en"],
  hi: ["hi-IN", "hi"],
  bn: ["bn-IN", "bn-BD", "bn"],
  mr: ["mr-IN", "mr", "hi-IN", "hi"],
  te: ["te-IN", "te"],
  ta: ["ta-IN", "ta"],
};

let ttsAudio = null;

function pickVoice(lang) {
  const synth = window.speechSynthesis;
  if (!synth) return null;
  const voices = synth.getVoices() || [];
  const tags = SPEECH_FALLBACK[lang] || SPEECH_FALLBACK.en;
  const norm = (s) => String(s || "").toLowerCase().replace(/_/g, "-");
  for (const tag of tags) {
    const want = norm(tag);
    const exact = voices.find((v) => norm(v.lang) === want || norm(v.lang).startsWith(want));
    if (exact) return exact;
  }
  const nameHint = {
    en: /english/i, hi: /hindi|हिन्दी/i, bn: /bengali|bangla|বাংলা/i,
    mr: /marathi|मराठी/i, te: /telugu|తెలుగు/i, ta: /tamil|தமிழ்/i,
  }[lang];
  if (nameHint) {
    const byName = voices.find((v) => nameHint.test(v.name) || nameHint.test(v.lang));
    if (byName) return byName;
  }
  return null;
}

function ttsChunks(text) {
  const s = String(text || "").trim();
  const parts = s.split(/(?<=[।.!?।])\s+/).filter(Boolean);
  const out = [];
  let buf = "";
  for (const p of parts) {
    if ((buf + " " + p).length > 160) {
      if (buf) out.push(buf);
      buf = p;
    } else buf = buf ? `${buf} ${p}` : p;
  }
  if (buf) out.push(buf);
  return out.length ? out : [s.slice(0, 160)];
}

function playTtsUrl(src) {
  return new Promise((resolve, reject) => {
    if (ttsAudio) { ttsAudio.pause(); ttsAudio = null; }
    const audio = new Audio(src);
    ttsAudio = audio;
    audio.onended = () => resolve(true);
    audio.onerror = () => reject(new Error("tts"));
    audio.play().catch(reject);
  });
}

async function speakCloud(text, lang) {
  const tl = { en: "en", hi: "hi", bn: "bn", mr: "mr", te: "te", ta: "ta" }[lang] || "en";
  const chunks = ttsChunks(text);
  for (const chunk of chunks) {
    const q = encodeURIComponent(chunk);
    const urls = [
      `/gtts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${q}`,
      `/api/tts?lang=${tl}&q=${q}`,
    ];
    let ok = false;
    for (const src of urls) {
      try {
        await playTtsUrl(src);
        ok = true;
        break;
      } catch { /* try next */ }
    }
    if (!ok) throw new Error("cloud tts failed");
  }
}

const COP_FB = {
  en: {
    pestAsk: "Pest", fertAsk: "Fertilizer", harvAsk: "Harvest", sowAsk: "Sowing",
    qIrr: "Should I irrigate today?", qSoil: "How is my soil health and moisture?",
    qWx: "What is the weather and rain chance?", qPest: "Any pest or disease on my crop?",
    qDoc: "What is the crop disease risk?", qFert: "Which fertilizer or NPK should I apply?",
    qHarv: "When should I harvest?", qSow: "How should I sow or plant?",
    irrigate: "Irrigation: {rec}. Soil moisture {moist}%, rain chance {rain}%, next window {next}.",
    pest: "Pest watch on {crop}: risk {n}%. Scout leaves. Use Crop Doctor if spots appear.",
    soilFull: "Soil health {n}/100, pH {ph}, moisture {moist}%. {rec}",
    fertilizer: "Fertilizer from NPK: N {n}, P {p}, K {k}. {rec}",
    weather: "Farm weather: {temp}°C, rain {rain}%, humidity {humid}%, soil moisture {moist}%.",
    harvest: "{crop} is at stage {stage}. Harvest by colour and firmness.",
    sow: "For {crop}, use treated seed and a light first irrigation.",
    generalHelp: "Ask about irrigation, soil, weather, pests, fertilizer, harvest or sowing. Now also ask about seeds, mandi, machinery, schemes, organic, livestock!",
    hello: "Hello! I'm FarmSense AI Copilot. Ask about irrigation, soil, weather, pests, fertilizer, harvest, or any farming question - seeds, mandi prices, machinery, government schemes!",
  },
  hi: {
    pestAsk: "कीट", fertAsk: "खाद", harvAsk: "कटाई", sowAsk: "बुवाई",
    qIrr: "क्या आज सिंचाई करूँ?", qSoil: "मिट्टी की सेहत और नमी कैसी है?",
    qWx: "मौसम और बारिश की संभावना क्या है?", qPest: "फसल पर कीट या रोग तो नहीं?",
    qDoc: "फसल रोग का जोखिम कितना है?", qFert: "कौन सी खाद या NPK दूँ?",
    qHarv: "कटाई कब करूँ?", qSow: "बुवाई या रोपण कैसे करूँ?",
    irrigate: "सिंचाई: {rec}। नमी {moist}%, बारिश {rain}%, अगली खिड़की {next}।",
    pest: "{crop} पर कीट/रोग जोखिम {n}%. पत्ते जाँचें।",
    soilFull: "मिट्टी स्वास्थ्य {n}/100, pH {ph}, नमी {moist}%. {rec}",
    fertilizer: "खाद NPK: N {n}, P {p}, K {k}। {rec}",
    weather: "मौसम: {temp}°C, बारिश {rain}%, आर्द्रता {humid}%, नमी {moist}%.",
    harvest: "{crop} अवस्था {stage}। रंग और मजबूती देखकर काटें।",
    sow: "{crop} के लिए उपचारित बीज, पहली सिंचाई हल्की।",
    generalHelp: "सिंचाई, मिट्टी, मौसम, कीट, खाद, कटाई या बुवाई पूछें। अब बीज, मंडी, मशीनरी, योजनाएं, जैविक, पशुपालन भी पूछ सकते हैं!",
    hello: "नमस्ते! मैं FarmSense AI सहायक हूं। सिंचाई, मिट्टी, मौसम, कीट, खाद, कटाई या कोई भी खेती का सवाल पूछें - बीज, मंडी भाव, मशीनरी, सरकारी योजनाएं!",
  },
  bn: {
    pestAsk: "পোকা", fertAsk: "সার", harvAsk: "কাটা", sowAsk: "বপন",
    qIrr: "আজ কি সেচ দেব?", qSoil: "মাটির স্বাস্থ্য ও রস কেমন?",
    qWx: "আবহাওয়া ও বৃষ্টির সম্ভাবনা কত?", qPest: "ফসলে পোকা বা রোগ আছে?",
    qDoc: "ফসলের রোগের ঝুঁকি কত?", qFert: "কোন সার বা NPK দেব?",
    qHarv: "কখন কাটব?", qSow: "কীভাবে বপন করব?",
    irrigate: "সেচ: {rec}। রস {moist}%, বৃষ্টি {rain}%, পরের সময় {next}।",
    pest: "{crop}-এ পোকা/রোগ ঝুঁকি {n}%. পাতা দেখুন।",
    soilFull: "মাটির স্বাস্থ্য {n}/100, pH {ph}, রস {moist}%. {rec}",
    fertilizer: "সার NPK: N {n}, P {p}, K {k}। {rec}",
    weather: "আবহাওয়া: {temp}°C, বৃষ্টি {rain}%, আর্দ্রতা {humid}%, রস {moist}%.",
    harvest: "{crop} অবস্থা {stage}। রং দেখে কাটুন।",
    sow: "{crop}-এর জন্য শোধিত বীজ, প্রথম সেচ হালকা।",
    generalHelp: "সেচ, মাটি, আবহাওয়া, পোকা, সার, কাটা বা বপন জিজ্ঞাসা করুন। এখন বীজ, মাণ্ডি, যন্ত্রপাতি, প্রকল্প, জৈব, পশুপালনও জিজ্ঞাসা করুন!",
    hello: "হ্যালো! আমি FarmSense AI সহকারী। সেচ, মাটি, আবহাওয়া, পোকা, সার, কাটা বা যে কোনো চাষের প্রশ্ন করুন!",
  },
  mr: {
    pestAsk: "कीड", fertAsk: "खत", harvAsk: "कापणी", sowAsk: "पेरणी",
    qIrr: "आज सिंचन करू का?", qSoil: "मातीचे आरोग्य आणि ओलसर कसे आहे?",
    qWx: "हवामान आणि पावसाची शक्यता काय?", qPest: "पिकावर कीड किंवा रोग आहे का?",
    qDoc: "पीक रोगाचा धोका किती?", qFert: "कोणते खत किंवा NPK द्यावे?",
    qHarv: "कापणी केव्हा करावी?", qSow: "पेरणी कशी करावी?",
    irrigate: "सिंचन: {rec}. ओलसर {moist}%, पाऊस {rain}%, पुढची वेळ {next}.",
    pest: "{crop} वर कीड/रोग धोका {n}%. पाने तपासा.",
    soilFull: "माती आरोग्य {n}/100, pH {ph}, ओलसर {moist}%. {rec}",
    fertilizer: "खत NPK: N {n}, P {p}, K {k}. {rec}",
    weather: "हवामान: {temp}°C, पाऊस {rain}%, आर्द्रता {humid}%, ओलसर {moist}%.",
    harvest: "{crop} टप्पा {stage}. रंग पाहून कापा.",
    sow: "{crop} साठी प्रक्रिया बी, पहिले पाणी हलके.",
    generalHelp: "सिंचन, माती, हवामान, कीड, खत, कापणी किंवा पेरणी विचारा. आता बियाणे, मंडी, यंत्रसामग्री, योजना, सेंद्रिय, पशुपालन विचारा!",
    hello: "नमस्कार! मी FarmSense AI सहाय्यक आहे. सिंचन, माती, हवामान, कीड, खत किंवा कोणताही शेती प्रश्न विचारा!",
  },
  te: {
    pestAsk: "తెగులు", fertAsk: "ఎరువు", harvAsk: "కోత", sowAsk: "విత్తనం",
    qIrr: "ఈరోజు నీరు పెట్టాలా?", qSoil: "నేల ఆరోగ్యం, తేమ ఎలా ఉన్నాయి?",
    qWx: "వాతావరణం, వర్షం అవకాశం ఎంత?", qPest: "పంటపై తెగులు లేదా రోగం ఉందా?",
    qDoc: "పంట రోగ ప్రమాదం ఎంత?", qFert: "ఏ ఎరువు లేదా NPK వేయాలి?",
    qHarv: "కోత ఎప్పుడు చేయాలి?", qSow: "విత్తనం ఎలా వేయాలి?",
    irrigate: "నీటిపారుదల: {rec}. తేమ {moist}%, వర్షం {rain}%, తర్వాత {next}.",
    pest: "{crop}పై తెగులు ప్రమాదం {n}%. ఆకులు చూడండి.",
    soilFull: "నేల ఆరోగ్యం {n}/100, pH {ph}, తేమ {moist}%. {rec}",
    fertilizer: "ఎరువు NPK: N {n}, P {p}, K {k}. {rec}",
    weather: "వాతావరణం: {temp}°C, వర్షం {rain}%, తేమ {humid}%, నేల {moist}%.",
    harvest: "{crop} దశ {stage}. రంగు చూసి కోయండి.",
    sow: "{crop}కి శుద్ధి విత్తనం, మొదటి నీరు తక్కువ.",
    generalHelp: "నీరు, నేల, వాతావరణం, తెగులు, ఎరువు, కోత లేదా విత్తనం అడగండి. ఇప్పుడు విత్తనాలు, మండి, యంత్రాలు, పథకాలు, సేంద్రీయ, పశుపోషణ కూడా అడగండి!",
    hello: "హలో! నేను FarmSense AI సహాయకుడు. నీరు, నేల, వాతావరణం, తెగులు, ఎరువు లేదా ఏదైనా వ్యవసాయ ప్రశ్న అడగండి!",
  },
  ta: {
    pestAsk: "பூச்சி", fertAsk: "உரம்", harvAsk: "அறுவடை", sowAsk: "விதை",
    qIrr: "இன்று நீர் பாய்ச்ச வேண்டுமா?", qSoil: "மண் ஆரோக்கியம் எப்படி?",
    qWx: "வானிலை என்ன?", qPest: "பயிரில் பூச்சி உள்ளதா?",
    qDoc: "பயிர் நோய் ஆபத்து எவ்வளவு?", qFert: "எந்த உரம்?",
    qHarv: "எப்போது அறுவடை?", qSow: "எப்படி விதைப்பது?",
    irrigate: "நீர்ப்பாசனம்: {rec}. ஈரம் {moist}%, மழை {rain}%, அடுத்து {next}.",
    pest: "{crop} பூச்சி ஆபத்து {n}%.",
    soilFull: "மண் ஆரோக்கியம் {n}/100, pH {ph}, ஈரம் {moist}%.",
    fertilizer: "உரம் NPK: N {n}, P {p}, K {k}.",
    weather: "வானிலை: {temp}°C, மழை {rain}%, ஈரம் {moist}%.",
    harvest: "{crop} நிலை {stage}.",
    sow: "{crop} விதைப்பு.",
    generalHelp: "நீர், மண், வானிலை, பூச்சி, உரம், அறுவடை கேளுங்கள். இப்போது விதைகள், மண்டி, இயந்திரங்கள், திட்டங்களும் கேட்கலாம்!",
    hello: "வணக்கம்! நான் FarmSense AI உதவியாளர். எந்த விவசாய கேள்வியும் கேளுங்கள்!",
  }
};

function fillVars(s, vars) {
  if (!vars) return s;
  return String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? `{${k}}` : vars[k]));
}

function tt(t, lang, key, vars) {
  const got = t(key, vars);
  if (got && got !== key && !String(got).startsWith("cop.")) return got;
  const short = String(key).replace(/^cop\./, "");
  const pack = COP_FB[lang] || COP_FB.en;
  return fillVars(pack[short] || COP_FB.en[short] || key, vars);
}

function copilotReply(raw, rec, t, lang) {
  const kind = (raw && typeof raw === "object" && raw.kind) || "general";
  const crop = t(cropKey(rec?.crop?.name));
  const w = rec?.weather || {};
  const s = rec?.soil || {};
  if (kind === "irrigate") {
    return tt(t, lang, "cop.irrigate", {
      rec: rec?.recommendation || "—",
      moist: s.moisture ?? "—",
      rain: w.rainProb ?? "—",
      next: rec?.nextIrrigation || "—",
    });
  }
  if (kind === "disease") return t("ai.disease", { crop, n: raw.n ?? rec?.crop?.diseaseRisk ?? "—" });
  if (kind === "pest") return tt(t, lang, "cop.pest", { crop, n: raw.n ?? rec?.crop?.diseaseRisk ?? "—" });
  if (kind === "sell") return t("ai.sell", { n: raw.n ?? rec?.market?.tomato ?? "—", trend: t((raw.trend || rec?.market?.trend) === "up" ? "ui.trendUp" : "ui.trendDown") });
  if (kind === "soil") return tt(t, lang, "cop.soilFull", { n: raw.n ?? "—", ph: raw.ph ?? s.ph ?? "—", moist: raw.moisture ?? s.moisture ?? "—", rec: raw.rec ? t(raw.rec) : t("soil.ok") });
  if (kind === "fertilizer") return tt(t, lang, "cop.fertilizer", { n: raw.nVal ?? s.n ?? "—", p: raw.pVal ?? s.p ?? "—", k: raw.kVal ?? s.k ?? "—", rec: raw.rec ? t(raw.rec) : t("soil.ok") });
  if (kind === "weather") return tt(t, lang, "cop.weather", { temp: w.temp ?? "—", rain: w.rainProb ?? "—", humid: w.humidity ?? "—", moist: s.moisture ?? "—" });
  if (kind === "crop") return t("cop.crop", { crop, rec: rec?.recommendation || "" });
  if (kind === "harvest") return tt(t, lang, "cop.harvest", { crop, stage: rec?.crop?.stageLabel || rec?.crop?.stage || "—" });
  if (kind === "sow") return tt(t, lang, "cop.sow", { crop });
  if (kind === "yield") return t("cop.yield", { crop, n: rec?.impact?.yieldLiftPct ?? "—" });
  if (kind === "care") return t("cop.care", { crop, health: rec?.crop?.health ?? "—" });
  if (kind === "manage") return t("cop.manage");
  if (kind === "schemes" || kind === "mandi" || kind === "machinery" || kind === "organic" || kind === "livestock" || kind === "seeds" || kind === "doctor") {
    return tt(t, lang, `cop.${kind === 'doctor' ? 'qDoc' : kind}`, {}) + " " + (t(`ai.${kind}`) || tt(t, lang, "cop.generalHelp"));
  }
  return tt(t, lang, "cop.generalHelp");
}

const COP_TOPICS = [
  ["nav.irrigation", "cop.qIrr", "irrigate"],
  ["nav.soil", "cop.qSoil", "soil"],
  ["nav.weather", "cop.qWx", "weather"],
  ["cop.pestAsk", "cop.qPest", "pest"],
  ["nav.doctor", "cop.qDoc", "disease"],
  ["cop.fertAsk", "cop.qFert", "fertilizer"],
  ["cop.harvAsk", "cop.qHarv", "harvest"],
  ["cop.sowAsk", "cop.qSow", "sow"],
];

const KIND_PROBE = {
  irrigate: "irrigate today water",
  soil: "soil health moisture",
  weather: "weather rain temperature",
  pest: "pest insect on crop",
  disease: "crop disease blight",
  fertilizer: "fertilizer npk urea",
  harvest: "when to harvest",
  sow: "how to sow plant seed",
};

export function Assistant() {
  const { rec, t = (k) => k, state } = useFarm();
  const appLang = state?.farm?.language || "en";
  const speechLang = { en: "en-IN", hi: "hi-IN", bn: "bn-IN", mr: "mr-IN", te: "te-IN", ta: "ta-IN" }[appLang] || "en-IN";
  const [log, setLog] = useState([]);
  const [q, setQ] = useState("");
  const [listening, setListening] = useState(false);
  const [prevKind, setPrevKind] = useState(null);

  useEffect(() => {
    setLog([{ role: "ai", text: tt(t, appLang, "cop.hello") }]);
    setPrevKind(null);
  }, [appLang]);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    const load = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const speak = (a) => {
    if (!a) return;
    if (ttsAudio) { try { ttsAudio.pause(); } catch { /* */ } ttsAudio = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    const voice = pickVoice(appLang);
    const vLang = String(voice?.lang || "").toLowerCase().replace(/_/g, "-");
    const code = (appLang || "en").slice(0, 2);
    const nativeOk = voice && (vLang.startsWith(code) || (appLang === "mr" && vLang.startsWith("hi")));
    if (nativeOk) {
      const u = new SpeechSynthesisUtterance(a);
      u.voice = voice;
      u.lang = voice.lang || speechLang;
      window.speechSynthesis.speak(u);
      return;
    }
    const tl = { en: "en", hi: "hi", bn: "bn", mr: "mr", te: "te", ta: "ta" }[appLang] || "en";
    const src = `/gtts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(String(a).slice(0, 180))}`;
    ttsAudio = new Audio(src);
    ttsAudio.play().catch(() => {
      if (!window.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(a);
      u.lang = speechLang;
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    });
  };

  const ask = (text = q, kindHint) => {
    let question = String(text || "").trim();
    if (!question) return;
    const keyKind = {
      "cop.qIrr": "irrigate", "cop.qSoil": "soil", "cop.qWx": "weather", "cop.qPest": "pest",
      "cop.qDoc": "disease", "cop.qFert": "fertilizer", "cop.qHarv": "harvest", "cop.qSow": "sow",
    };
    const kind = kindHint || keyKind[question];
    if (kind && (question.startsWith("cop.") || keyKind[question])) {
      question = tt(t, appLang, Object.keys(keyKind).find((k) => keyKind[k] === kind) || question);
    }
    const probe = kind ? KIND_PROBE[kind] : question;
    let hit;
    try {
      hit = answerFarmQuestion(probe || question, rec, { prevKind });
    } catch {
      hit = { kind: kind || "general" };
    }
    if (!hit || typeof hit !== "object") hit = { kind: kind || "general" };
    if (kind) hit = { ...hit, kind };
    const a = copilotReply(hit, rec, t, appLang);
    const shown = String(a).startsWith("cop.") ? tt(t, appLang, a) : a;
    setPrevKind(hit.kind === "general" ? prevKind : hit.kind);
    setLog((l) => [...l, { role: "me", text: question }, { role: "ai", text: shown }]);
    setQ("");
    speak(shown);
  };

  const listen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setLog((l) => [...l, { role: "ai", text: t("cop.noVoice") }]);
      return;
    }
    const r = new SR();
    r.lang = speechLang;
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e) => ask(e.results[0][0].transcript);
    r.start();
  };

  return (
    <div className="grid">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12}}>
        <div>
          <h2 style={{margin:0, fontSize:26, fontWeight:800, display:'flex', gap:10, alignItems:'center'}}>🤖 {t("cop.title")} <span className="tag ok">v4 • Free-Form</span></h2>
          <p className="muted" style={{marginTop:6}}>{t("ui.copHint")} — Now ask ANY farming question: seeds, mandi, machinery, schemes, organic, livestock!</p>
        </div>
        <span className="premium-badge">Multilingual Voice</span>
      </div>

      <div className="card" style={{background:'linear-gradient(135deg, var(--mint-soft), var(--white))', borderColor:'var(--mint)'}}>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          {COP_TOPICS.map(([k, qk, kind]) => (
            <button type="button" key={k} className="btn ghost" style={{borderRadius:999, fontSize:13}} onClick={() => ask(tt(t, appLang, qk), kind)}>
              {k.startsWith("cop.") ? tt(t, appLang, k) : t(k)}
            </button>
          ))}
        </div>
        <div className="row" style={{marginTop:12}}>
          <span className="tag">🌱 Seeds</span>
          <span className="tag">🏪 Mandi</span>
          <span className="tag">🚜 Machinery</span>
          <span className="tag">📜 Schemes</span>
          <span className="tag">🌿 Organic</span>
          <span className="tag">🐄 Livestock</span>
        </div>
      </div>

      <div className="card" style={{ minHeight: 320, display:'flex', flexDirection:'column', padding:0, overflow:'hidden' }}>
        <div style={{flex:1, overflowY:'auto', padding:18, display:'flex', flexDirection:'column', gap:12}}>
          {log.map((m, i) => (
            <div key={i} style={{
              maxWidth:'82%', padding:'12px 16px', borderRadius:16, fontSize:14, lineHeight:1.5,
              alignSelf: m.role==='ai' ? 'flex-start' : 'flex-end',
              background: m.role==='ai' ? 'var(--mint-ghost)' : 'var(--forest)',
              color: m.role==='ai' ? 'var(--ink)' : 'white',
              border: m.role==='ai' ? '1px solid var(--line)' : 'none',
              boxShadow: m.role==='ai' ? 'var(--shadow-soft)' : '0 4px 12px rgba(27,94,59,0.2)'
            }}>
              <b style={{fontSize:11, opacity:0.7, display:'block', marginBottom:4}}>{m.role === "ai" ? "🌿 FarmSense" : "👤 You"}:</b>
              {m.text}
            </div>
          ))}
        </div>
        <div style={{padding:14, borderTop:'1px solid var(--line)', background:'var(--cream)', display:'flex', gap:10}}>
          <input
            className="input"
            style={{ flex: 1, borderRadius:999 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
            placeholder={t("cop.placeholder") + " - Try: seeds, mandi prices, PM-KISAN..."}
          />
          <button className="btn" type="button" style={{borderRadius:999}} onClick={() => ask()}>➤ {t("ui.ask")}</button>
          <button className="btn ghost" type="button" style={{borderRadius:999}} onClick={listen}>{listening ? '🔴 ' + t("cop.listening") : '🎤 ' + t("ui.voice")}</button>
        </div>
      </div>
    </div>
  );
}

export function Tasks() {
  const { state, setState, addTask, t = (k) => k } = useFarm();
  const [title, setTitle] = useState("");
  const tasks = state?.tasks || [];
  const done = tasks.filter((x) => x.done).length;
  const pct = (done / Math.max(1, tasks.length)) * 100;
  return (
    <div className="grid">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{margin:0, fontSize:26, fontWeight:800}}>✅ {t("tsk.title")}</h2>
        <span className="tag ok">{done}/{tasks.length} done</span>
      </div>
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}><span className="muted" style={{fontSize:12, fontWeight:600}}>Progress</span><span style={{fontWeight:700}}>{Math.round(pct)}%</span></div>
        <div className="progress"><span style={{ width: `${pct}%` }} /></div>
        <p className="muted" style={{marginTop:10, fontSize:13}}>{done} of {tasks.length} {t("ui.complete")}</p>
      </div>
      <div className="card" style={{padding:12}}>
        <div className="row">
          <input className="input" style={{ flex: 1, borderRadius:999 }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`➕ ${t("ui.newTask")}`} />
          <button className="btn" style={{borderRadius:999}} onClick={() => { if(!title.trim()) return; addTask({ title, due: new Date().toISOString().slice(0, 10), type: "general" }); setTitle(""); }}>➕ {t("ui.add")}</button>
        </div>
      </div>
      <div className="grid">
        {tasks.map((task) => (
          <div className="card row" key={task.id} style={{ justifyContent: "space-between", padding:'14px 16px', borderLeft: task.done ? '4px solid var(--ok)' : '4px solid var(--line)' }}>
            <label style={{display:'flex', gap:10, alignItems:'center', cursor:'pointer'}}><input type="checkbox" checked={task.done} onChange={() => {
              const done = !task.done;
              setState((s) => ({ ...s, tasks: s.tasks.map((x) => x.id === task.id ? { ...x, done } : x) }));
              if (getToken() && (task._id || task.id)) dataApi.patchTask(task._id || task.id, { done }).catch(() => {});
            }} /> <span style={{textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.6 : 1}}>{task.title}</span></label>
            <div className="row">
              <span className="tag" style={{fontSize:11}}>{task.due}</span>
              <button className="btn ghost" style={{padding:'6px 10px', fontSize:12}} onClick={() => {
                setState((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== task.id) }));
                if (getToken() && (task._id || task.id)) dataApi.delTask(task._id || task.id).catch(() => {});
              }}>🗑️ {t("ui.delete")}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Alerts() {
  const { alerts, rec, weather, t = (k) => k } = useFarm();
  const nav = useNavigate();
  const fallback = [
    { id: "a1", level: rec?.action === "delay" ? "info" : "warning", title: rec?.recommendation || t("dash.openIrr"), to: "/irrigation" },
    { id: "a2", level: "warning", title: `${t("ui.rainChance")} ${weather?.rainProb ?? 65}%`, to: "/weather" },
    { id: "a3", level: "warning", title: t("alert.blight"), to: "/doctor" },
    { id: "a4", level: (weather?.temp || 0) >= 35 ? "critical" : "info", title: t("alert.heat", { n: weather?.temp ?? 29 }), to: "/weather" },
    { id: "a5", level: "info", title: t("alert.price", { n: rec?.market?.tomato ?? "" }), to: "/market" },
    { id: "a6", level: "info", title: t("alert.soil"), to: "/soil" },
    { id: "a7", level: "info", title: t("tsk.title"), to: "/tasks" },
  ];
  const list = alerts && alerts.length ? alerts : fallback;
  return (
    <div className="grid">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{margin:0, fontSize:26, fontWeight:800}}>🔔 {t("al.title")}</h2>
        <span className="tag danger">{list.length} alerts</span>
      </div>
      <div className="grid">
        {list.map((a) => (
          <div className="card row" key={a.id} style={{ justifyContent: "space-between", padding:'16px 18px', borderLeft: `4px solid ${a.level==='critical'?'var(--danger)':a.level==='warning'?'var(--warn)':'var(--info)'}`, animation:'pageIn .3s ease' }}>
            <div style={{display:'flex', gap:12, alignItems:'center'}}>
              <span style={{width:36, height:36, borderRadius:12, background: a.level==='critical'?'#fee2e2':a.level==='warning'?'#fef3c7':'#dbeafe', display:'grid', placeItems:'center', fontSize:16}}>
                {a.level==='critical'?'🔥':a.level==='warning'?'⚠️':'ℹ️'}
              </span>
              <div>
                <span className={`tag ${a.level === "critical" ? "danger" : a.level === "warning" ? "warn" : "info"}`} style={{fontSize:10}}>{t(`lvl.${a.level}`)}</span>
                <div style={{fontWeight:600, marginTop:4}}>{a.title}</div>
              </div>
            </div>
            <div className="row">
              <button type="button" className="btn ghost" style={{fontSize:12}} onClick={() => nav(a.to || "/dashboard")}>{t("btn.open")}</button>
              <button type="button" className="btn" style={{fontSize:12}} onClick={() => nav(a.to || "/dashboard")}>{t("btn.read")} →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Iot() {
  const { rec, state, setState, t = (k) => k } = useFarm();
  const s = state.sensors;
  return (
    <div className="grid">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{margin:0, fontSize:26, fontWeight:800}}>📡 {t("iot.title")}</h2>
        <span className={`tag ${s.online ? 'ok' : 'danger'}`}>{s.online ? '● ' + t("ui.online") : '● ' + t("ui.offline")}</span>
      </div>
      <p className="muted">{s.online ? t("ui.online") : t("ui.offline")} · {t("ui.lastSeen")} {new Date(s.lastSeen).toLocaleTimeString()}</p>
      <div className="grid g-4">
        {[
          [t("dash.moisture"), `${s.moisture}%`, "💧"],
          [t("ui.temp"), `${s.temperature}°C`, "🌡️"],
          [t("ui.humid"), `${s.humidity}%`, "💧"],
          [t("ui.rainSensor"), s.rain ? t("ui.wet") : t("ui.drySoil"), "🌧️"],
          [t("dash.pump"), rec.iot.pump ? t("ui.on") : t("ui.off"), "⚡"]
        ].map(([k, v, icon]) => (
          <div className="card iot-node" key={k} style={{padding:16}}>
            <div style={{display:'flex', justifyContent:'space-between'}}><span className="muted" style={{fontSize:11, fontWeight:700, textTransform:'uppercase'}}>{k}</span><span>{icon}</span></div>
            <div className="kpi" style={{fontSize:22, marginTop:8}}>{v}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{borderLeft:'4px solid var(--forest)'}}>
        <h3 style={{marginTop:0}}>🔄 {t("ui.flow")}</h3>
        <p className="muted" style={{fontSize:13, lineHeight:1.6}}>Sensor ({s.moisture}%) → ESP32 → AI → <b style={{color:'var(--forest)'}}>{rec.recommendation}</b> → {t("dash.pump")} {rec.iot.pump ? t("ui.on") : t("ui.off")} → {rec.impact.waterSavedL}L {t("dash.saved")}</p>
        <label style={{display:'block', marginTop:16}}><span className="muted" style={{fontSize:12, fontWeight:600}}>{t("dash.moisture")} Simulation: {s.moisture}%</span>
          <input type="range" min="10" max="80" value={s.moisture} onChange={(e) => setState((st) => ({ ...st, sensors: { ...st.sensors, moisture: +e.target.value, lastSeen: Date.now() } }))} style={{width:'100%', marginTop:8}} />
        </label>
      </div>
    </div>
  );
}

export function Impact() {
  const { rec, t = (k) => k } = useFarm();
  const data = [
    { n: t("dash.waterSaved"), v: rec.impact.waterSavedL },
    { n: "₹", v: rec.impact.moneySaved },
    { n: t("ui.health"), v: rec.crop.health },
    { n: t("ui.yield"), v: rec.impact.yieldLiftPct },
    { n: "CO₂ kg", v: rec.impact.co2Kg },
  ];
  return (
    <div className="grid">
      <h2 style={{margin:0, fontSize:26, fontWeight:800}}>🌍 {t("imp.title")}</h2>
      <div className="grid g-3">
        {data.map((d) => (
          <div className="card" key={d.n} style={{textAlign:'center', padding:18}}>
            <div className="muted" style={{fontSize:11, fontWeight:700, textTransform:'uppercase'}}>{d.n}</div>
            <div className="kpi" style={{color:'var(--forest)'}}>{d.v}</div>
            <div className="progress" style={{marginTop:10, height:4}}><span style={{width:'75%'}}></span></div>
          </div>
        ))}
      </div>
      <div className="card" style={{ height: 320, padding:20 }}>
        <h4 style={{margin:'0 0 16px'}}>📊 Environmental Impact</h4>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data}><XAxis dataKey="n" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} /><Tooltip contentStyle={{borderRadius:12}} /><Bar dataKey="v" fill="url(#forestGrad)" radius={[10,10,0,0]} /></BarChart>
        </ResponsiveContainer>
        <svg width="0" height="0"><defs><linearGradient id="forestGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1b5e3b" /><stop offset="100%" stopColor="#7dcea0" /></linearGradient></defs></svg>
      </div>
    </div>
  );
}

export function Reports() {
  const { rec, state, t = (k) => k } = useFarm();
  return (
    <div className="grid">
      <h2 style={{margin:0, fontSize:26, fontWeight:800}}>📄 {t("rep.title")}</h2>
      <div className="card" id="print-area" style={{padding:24}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--line)', paddingBottom:16, marginBottom:16}}>
          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <div className="brand-mark">FS</div>
            <div><h3 style={{margin:0}}>FarmSense AI {t("ui.brief")}</h3><small className="muted">{state.farm.location}</small></div>
          </div>
          <span className="tag ok">Official Report</span>
        </div>
        <p><b>👨‍🌾 {t("ui.farmer")}</b> {state.farm.farmer} · {state.farm.area} {t("ui.acres")}</p>
        <p style={{marginTop:8}}><b>💡 {t("ui.decision")}:</b> <span style={{color:'var(--forest)', fontWeight:700}}>{rec.recommendation}</span></p>
        <p className="muted" style={{marginTop:8}}>{rec.reason}</p>
        <div className="grid g-3" style={{marginTop:16}}>
          <div className="card" style={{background:'var(--mint-ghost)', boxShadow:'none'}}><div className="muted" style={{fontSize:11}}>Water Saved</div><div className="kpi" style={{fontSize:20}}>{rec.impact.waterSavedL}L</div></div>
          <div className="card" style={{background:'#fef3c7', boxShadow:'none'}}><div className="muted" style={{fontSize:11}}>Money Saved</div><div className="kpi" style={{fontSize:20}}>₹{rec.impact.moneySaved}</div></div>
          <div className="card" style={{background:'#dbeafe', boxShadow:'none'}}><div className="muted" style={{fontSize:11}}>Yield Lift</div><div className="kpi" style={{fontSize:20}}>{rec.impact.yieldLiftPct}%</div></div>
        </div>
        <p style={{marginTop:16}}>{t("ui.outlook")} <b>{predictYield({ crop: rec.crop.name }).totalT} t {t("ui.total")}</b></p>
      </div>
      <button className="btn" onClick={() => window.print()}>🖨️ {t("ui.print")}</button>
    </div>
  );
}

export function FarmPage() {
  const { state, setState, toast, t = (k) => k } = useFarm();
  const f = state.farm;
  const set = (k, v) => setState((s) => ({ ...s, farm: { ...s.farm, [k]: v } }));
  return (
    <div className="grid">
      <h2 style={{margin:0, fontSize:26, fontWeight:800}}>🚜 {t("ui.farmProfile")}</h2>
      <div className="card grid" style={{gap:16}}>
        <div className="grid g-2">
          {[["farmer", t("ui.farmer")], ["location", t("ui.location")], ["soil", t("nav.soil")], ["irrigation", t("nav.irrigation")], ["waterSource", t("ui.waterSrc")]].map(([k, l]) => (
            <label key={k} className="field" style={{margin:0}}><span className="muted" style={{fontSize:12, fontWeight:600}}>{l}</span><input className="input" value={f[k]} onChange={(e) => set(k, e.target.value)} /></label>
          ))}
          <label className="field" style={{margin:0}}><span className="muted" style={{fontSize:12, fontWeight:600}}>{t("ui.acres")}</span><input className="input" type="number" value={f.area} onChange={(e) => set("area", +e.target.value)} /></label>
        </div>
        <button className="btn" onClick={() => { toast(t("btn.save")); if (getToken()) farmApi.save(f).catch(() => {}); }}>💾 {t("btn.save")}</button>
      </div>
    </div>
  );
}

export function Settings() {
  const { state, setState, setTheme, toast, user, setUser, t = (k) => k, setLanguage } = useFarm();
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
      toast(mode === "login" ? t("ui.loggedIn") : t("ui.registered"));
    } catch (e) {
      toast(e.message);
    }
  };
  return (
    <div className="grid">
      <h2 style={{margin:0, fontSize:26, fontWeight:800}}>⚙️ {t("set.title")}</h2>
      <div className="card grid" style={{gap:18}}>
        <h3 style={{margin:0}}>👤 {t("set.account")}</h3>
        {user ? (
          <div className="card" style={{background:'var(--mint-ghost)', borderColor:'var(--mint)', display:'flex', gap:12, alignItems:'center'}}>
            <span className="avatar" style={{width:48, height:48}}>{user.name?.[0]}</span>
            <div><b>{t("ui.signedIn")} {user.name}</b><br/><small className="muted">{user.email}</small></div>
            <span className="tag ok" style={{marginLeft:'auto'}}>Active</span>
          </div>
        ) : (
          <>
            <input className="input" placeholder={t("ui.name")} value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder={t("ui.email")} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" type="password" placeholder={t("ui.password")} value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="row">
              <button className="btn" onClick={() => doAuth("login")}>{t("btn.login")}</button>
              <button className="btn ghost" onClick={() => doAuth("register")}>{t("btn.register")}</button>
            </div>
          </>
        )}
        {user && <button className="btn ghost" onClick={() => { setToken(null); setUser(null); toast(t("ui.logout")); }}>↪️ {t("ui.logout")}</button>}
        <div className="card" style={{background:'var(--cream)', boxShadow:'none'}}>
          <label><span className="muted" style={{fontSize:12, fontWeight:600}}>🌐 {t("set.lang")}</span>
            <select className="input" style={{marginTop:6}} value={state.farm.language || "en"} onChange={(e) => setLanguage ? setLanguage(e.target.value) : setState((s) => ({ ...s, farm: { ...s.farm, language: e.target.value } }))}>
              {LANGS.map((L) => (
                <option key={L.id} value={L.id}>{L.name}</option>
              ))}
            </select>
          </label>
          <div className="row" style={{marginTop:12}}>
            <button className="btn" onClick={() => { setTheme("light"); document.documentElement.dataset.theme = "light"; }}>☀️ {t("ui.light")}</button>
            <button className="btn ghost" onClick={() => { setTheme("dark"); document.documentElement.dataset.theme = "dark"; }}>🌙 {t("ui.dark")}</button>
          </div>
          <label style={{display:'flex', gap:8, alignItems:'center', marginTop:12, cursor:'pointer'}}><input type="checkbox" checked={state.offline} onChange={(e) => setState((s) => ({ ...s, offline: e.target.checked }))} /> <span style={{fontSize:13}}>{t("ui.forceOff")}</span></label>
          <button className="btn warn" style={{marginTop:12, width:'100%'}} onClick={() => { localStorage.clear(); toast(t("ui.clear")); location.reload(); }}>🗑️ {t("ui.clear")}</button>
        </div>
      </div>
    </div>
  );
}
