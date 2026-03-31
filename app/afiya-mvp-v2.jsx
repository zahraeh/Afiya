import { useState, useEffect, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  terra: "#C4704F", terraLight: "#E8956D", terraDark: "#A05535",
  sage: "#7A9E7E", sageDark: "#5A7E5E", sageLight: "#A8C8AC",
  bg: "#FAF9F6", bg2: "#F2EFE9", dark: "#1C1C1E", mid: "#6E6E73",
  light: "#AEAEB2", border: "#E5E0D8", white: "#FFFFFF",
  purple: "#9B7EC8", gold: "#F5A623", red: "#E05C5C",
  phases: {
    menstrual:  { color: "#E05C5C", bg: "#FDF0F0", label: "Menstruelle",  emoji: "🩸", days: "J1–J5"  },
    follicular: { color: "#7A9E7E", bg: "#F0F5F1", label: "Folliculaire", emoji: "🌱", days: "J6–J13" },
    ovulation:  { color: "#F5A623", bg: "#FDF6ED", label: "Ovulatoire",   emoji: "✨", days: "J14–J16"},
    luteal:     { color: "#9B7EC8", bg: "#F5F0FB", label: "Lutéale",      emoji: "🌙", days: "J17–J28"},
  },
};

// ─── OURA API ─────────────────────────────────────────────────────────────────
const OURA_BASE = "https://api.ouraring.com/v2/usercollection";

async function fetchOura(endpoint, token, params = {}) {
  const url = new URL(`${OURA_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Oura ${endpoint}: ${r.status}`);
  return r.json();
}

function getDateRange(days = 7) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function parseSleepData(data) {
  // Filter only main sleep sessions (long_sleep or sleep type, highest total_sleep_duration per day)
  const byDay = {};
  (data.data || []).forEach((s) => {
    if (!byDay[s.day] || s.total_sleep_duration > byDay[s.day].total_sleep_duration) {
      byDay[s.day] = s;
    }
  });
  const sorted = Object.values(byDay).sort((a, b) => b.day.localeCompare(a.day));
  return sorted;
}

async function loadOuraData(token) {
  const { start, end } = getDateRange(14);
  const [sleepRaw, readinessRaw, activityRaw] = await Promise.all([
    fetchOura("sleep", token, { start_date: start, end_date: end }),
    fetchOura("daily_readiness", token, { start_date: start, end_date: end }),
    fetchOura("daily_activity", token, { start_date: start, end_date: end }),
  ]);

  const sleepSessions = parseSleepData(sleepRaw);
  const latest = sleepSessions[0] || {};
  const readiness = (readinessRaw.data || []).sort((a, b) => b.day.localeCompare(a.day))[0] || {};
  const activity = (activityRaw.data || []).sort((a, b) => b.day.localeCompare(a.day))[0] || {};

  return {
    sleep: {
      total_sleep_duration: latest.total_sleep_duration || 0,
      efficiency: latest.efficiency || 0,
      average_hrv: latest.average_hrv || 0,
      average_heart_rate: latest.average_heart_rate || 0,
      latency: latest.latency || 0,
      deep_sleep_duration: latest.deep_sleep_duration || 0,
      rem_sleep_duration: latest.rem_sleep_duration || 0,
      readiness_score: readiness.score || 0,
      readiness_contributors: readiness.contributors || {},
      last_night: latest.day || new Date().toISOString().split("T")[0],
    },
    sleepHistory: sleepSessions.slice(0, 7).map((s) => ({
      day: s.day,
      hours: +(s.total_sleep_duration / 3600).toFixed(1),
      efficiency: s.efficiency,
      hrv: s.average_hrv,
    })).reverse(),
    activity: {
      steps: activity.steps || 0,
      active_calories: activity.active_calories || 0,
      training_load: activity.score > 70 ? "high" : activity.score > 40 ? "moderate" : "low",
      score: activity.score || 0,
    },
    raw: { latest, readiness, activity },
  };
}

// ─── CYCLE HELPERS ────────────────────────────────────────────────────────────
function computeCyclePhase(lastPeriodStart, cycleLength = 28) {
  const start = new Date(lastPeriodStart);
  const today = new Date();
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const day = (diff % cycleLength) + 1;
  let phase = "luteal";
  if (day <= 5) phase = "menstrual";
  else if (day <= 13) phase = "follicular";
  else if (day <= 16) phase = "ovulation";
  const next = new Date(start);
  next.setDate(start.getDate() + cycleLength * Math.ceil((diff + 1) / cycleLength));
  return { day, phase, cycleLength, nextPeriod: next.toISOString().split("T")[0] };
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// ─── CLAUDE AI ────────────────────────────────────────────────────────────────
async function fetchAfiyaAdvice(healthData, userMessage = null) {
  const phase = T.phases[healthData.cycle.current_phase];
  const sleepH = (healthData.sleep.total_sleep_duration / 3600).toFixed(1);

  const systemPrompt = `Tu es Afiya, coach de bien-être quotidien, experte en santé féminine et cyclique.
Tu parles en français avec un ton bienveillant, chaleureux, non-culpabilisant et adulte.
Tu génères UN conseil personnalisé basé sur les données réelles de l'utilisatrice.

Règles :
- 1 conseil principal (2-3 phrases max)
- Lie toujours le conseil aux données réelles
- Jamais de jargon médical, jamais de diagnostic
- Termine par une action concrète (< 15 mots)

Données aujourd'hui :
- Prénom : ${healthData.profile.name}
- Phase : ${phase.label} (Jour ${healthData.cycle.cycle_day}/${healthData.cycle.cycleLength})
- Sommeil : ${sleepH}h, efficacité ${healthData.sleep.efficiency}%, HRV ${healthData.sleep.average_hrv}ms
- FC repos : ${healthData.sleep.average_heart_rate}bpm, latence ${Math.round(healthData.sleep.latency/60)}min
- Récupération Oura : ${healthData.sleep.readiness_score}/100
- Pas : ${healthData.activity.steps}, Cal actives : ${healthData.activity.active_calories}
- Objectifs : ${healthData.profile.goals.join(", ")}
- Profil hormonal : ${healthData.profile.hormonal_profile}

Réponds UNIQUEMENT en JSON valide sans backticks :
{"greeting":"Bonjour ${healthData.profile.name} 🌿","insight":"obs courte 1 phrase","conseil":"conseil principal 2-3 phrases","action":"action concrète < 15 mots","category":"sommeil|cycle|sport|humeur|nutrition","phase_tip":"conseil phase cycle 1 phrase","energy_level":"low|medium|high","mood_prediction":"prédiction humeur 1 phrase courte"}`;

  const userContent = userMessage
    ? `Question : "${userMessage}". Adapte le conseil JSON à cette question.`
    : "Génère le conseil du jour.";

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    const d = await r.json();
    const txt = d.content.map((i) => i.text || "").join("").replace(/```json|```/g, "").trim();
    return JSON.parse(txt);
  } catch {
    return {
      greeting: `Bonjour ${healthData.profile.name} 🌿`,
      insight: "Tes données de cette nuit sont analysées.",
      conseil: `En phase ${phase.label}, ton corps a besoin de douceur. Ton HRV de ${healthData.sleep.average_hrv}ms indique une bonne récupération. Profite de cette énergie pour avancer sur tes projets.`,
      action: "Prends 5 min ce matin pour planifier ta journée.",
      category: "cycle", phase_tip: `${phase.emoji} ${phase.label} : ${phase.days}.`,
      energy_level: "medium", mood_prediction: "Énergie stable et humeur positive prévues.",
    };
  }
}

// ─── PERSISTENT STORAGE via window.storage ────────────────────────────────────
const DB = {
  async get(key) {
    try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  async set(key, val) {
    try { await window.storage.set(key, JSON.stringify(val)); } catch {}
  },
};

// ─── SHARED SMALL COMPONENTS ──────────────────────────────────────────────────
function Card({ children, style: s = {} }) {
  return (
    <div style={{ background: T.white, borderRadius: 20, padding: "18px 18px",
      border: `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(28,28,30,0.04)", ...s }}>
      {children}
    </div>
  );
}

function Tag({ label, color, bg }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: bg || `${color}18`,
      borderRadius: 20, padding: "3px 10px", display: "inline-block" }}>
      {label}
    </span>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "20px 0" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: T.terra,
          animation: `afiyaBounce 1.2s ${i*0.2}s ease-in-out infinite` }} />
      ))}
      <style>{`@keyframes afiyaBounce{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

function PhaseRing({ phase, day, total }) {
  const r = 36, circ = 2 * Math.PI * r;
  const color = T.phases[phase]?.color || T.terra;
  return (
    <div style={{ position: "relative", width: 88, height: 88 }}>
      <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke={T.border} strokeWidth="5" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${(day/total)*circ} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: T.dark, lineHeight: 1 }}>{day}</div>
        <div style={{ fontSize: 10, color: T.mid }}>J/{total}</div>
      </div>
    </div>
  );
}

function SleepBar({ label, value, pct, color }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: T.mid, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: T.dark, fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100,pct)}%`, borderRadius: 3,
          background: color || T.sage, transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

// ─── OURA CONNECT SCREEN ──────────────────────────────────────────────────────
function OuraConnectScreen({ onConnect }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    if (!token.trim()) return;
    setLoading(true); setError("");
    try {
      const data = await loadOuraData(token.trim());
      await DB.set("oura_token", token.trim());
      onConnect(token.trim(), data);
    } catch (e) {
      setError("Token invalide ou connexion impossible. Vérifie ton token Oura.");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💍</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700, color: T.dark, marginBottom: 8 }}>
          Connecte ta Oura Ring
        </div>
        <p style={{ fontSize: 14, color: T.mid, lineHeight: 1.6 }}>
          Afiya utilise tes données de sommeil, HRV et récupération pour personnaliser chaque conseil.
        </p>
      </div>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 6 }}>Ton Personal Access Token Oura</div>
        <div style={{ fontSize: 12, color: T.mid, marginBottom: 12, lineHeight: 1.5 }}>
          Obtiens ton token sur <span style={{ color: T.terra, fontWeight: 600 }}>cloud.ouraring.com → Personal Access Tokens</span>
        </div>
        <input value={token} onChange={e => setToken(e.target.value)}
          placeholder="OEBQYFKE…"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontFamily: "'DM Sans',sans-serif",
            border: `1.5px solid ${error ? T.red : T.border}`, fontSize: 13, outline: "none",
            color: T.dark, background: T.bg, marginBottom: 8 }} />
        {error && <div style={{ fontSize: 12, color: T.red, marginBottom: 8 }}>{error}</div>}
        <button onClick={handleConnect} disabled={loading || !token.trim()}
          style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: token.trim() ? T.terra : T.border, color: T.white,
            fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          {loading ? "Connexion…" : "Connecter Oura Ring 💍"}
        </button>
      </Card>

      <button onClick={() => onConnect("DEMO", null)}
        style={{ background: "none", border: `1.5px dashed ${T.border}`, borderRadius: 14,
          padding: "12px", color: T.mid, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
        Continuer sans Oura (données démo)
      </button>

      <Card style={{ background: `${T.sage}10`, border: `1px solid ${T.sage}30` }}>
        <div style={{ fontSize: 12, color: T.sageDark, lineHeight: 1.6 }}>
          🔒 Ton token reste sur ton appareil. Afiya ne stocke aucune donnée de santé.
        </div>
      </Card>
    </div>
  );
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
function HomeScreen({ health, advice, loading, mood, setMood, onAskQuestion, savedAdvice, onSave, onRate }) {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const phase = T.phases[health.cycle.current_phase];
  const sleepH = (health.sleep.total_sleep_duration / 3600).toFixed(1);
  const isSaved = savedAdvice.some(a => a.conseil === advice?.conseil);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    await onAskQuestion(question);
    setQuestion(""); setAsking(false);
  };

  const moods = [
    { emoji: "😴", label: "Fatiguée", val: "tired" },
    { emoji: "😐", label: "Neutre",   val: "neutral" },
    { emoji: "😊", label: "Bien",     val: "good" },
    { emoji: "⚡", label: "Énergique",val: "energized" },
    { emoji: "🌟", label: "Au top",   val: "great" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ textAlign: "center", paddingTop: 4 }}>
        <div style={{ fontSize: 12, color: T.mid, fontWeight: 500, marginBottom: 2 }}>
          {new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })}
        </div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700, color: T.dark, lineHeight: 1.15 }}>
          {advice?.greeting || `Bonjour ${health.profile.name} 🌿`}
        </div>
      </div>

      {/* Phase pill + ring */}
      <Card style={{ background: `linear-gradient(135deg,${phase.bg},${T.bg2})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <PhaseRing phase={health.cycle.current_phase} day={health.cycle.cycle_day} total={health.cycle.cycleLength} />
          <div style={{ flex: 1 }}>
            <Tag label={`${phase.emoji} Phase ${phase.label}`} color={phase.color} />
            {advice?.phase_tip && (
              <p style={{ fontSize: 13, color: T.mid, lineHeight: 1.45, margin: "6px 0 0" }}>{advice.phase_tip}</p>
            )}
            <div style={{ fontSize: 11, color: T.light, marginTop: 6 }}>
              Prochaines règles : {new Date(health.cycle.nextPeriod).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}
            </div>
          </div>
        </div>
      </Card>

      {/* AI Conseil */}
      <Card style={{ borderLeft: `4px solid ${T.terra}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -24, right: -24, width: 90, height: 90,
          borderRadius: "50%", background: `${T.terra}06` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.terra }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.terra, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Conseil du jour · IA
            </span>
          </div>
          {advice && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onRate(advice, true)}
                style={{ background: `${T.sage}15`, border: "none", borderRadius: 8, padding: "4px 10px",
                  fontSize: 14, cursor: "pointer" }}>👍</button>
              <button onClick={() => onRate(advice, false)}
                style={{ background: `${T.terra}12`, border: "none", borderRadius: 8, padding: "4px 10px",
                  fontSize: 14, cursor: "pointer" }}>👎</button>
              <button onClick={() => onSave(advice)}
                style={{ background: isSaved ? `${T.gold}20` : T.bg2, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: "4px 10px", fontSize: 14, cursor: "pointer" }}>
                {isSaved ? "★" : "☆"}
              </button>
            </div>
          )}
        </div>
        {loading ? <LoadingDots /> : (
          <>
            {advice?.insight && (
              <div style={{ fontSize: 12, color: T.mid, fontStyle: "italic", marginBottom: 8, lineHeight: 1.5 }}>
                {advice.insight}
              </div>
            )}
            <p style={{ fontFamily: "'Fraunces',serif", fontSize: 16, color: T.dark, lineHeight: 1.65, margin: "0 0 12px" }}>
              {advice?.conseil}
            </p>
            {advice?.action && (
              <div style={{ background: `${T.terra}10`, borderRadius: 12, padding: "10px 14px",
                display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 15 }}>✅</span>
                <span style={{ fontSize: 13, color: T.terraDark, fontWeight: 500, lineHeight: 1.4 }}>{advice.action}</span>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Ask Afiya */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 8 }}>💬 Demande à Afiya</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAsk()}
            placeholder="Pourquoi je suis si fatiguée ?"
            style={{ flex: 1, padding: "10px 13px", borderRadius: 12, fontFamily: "'DM Sans',sans-serif",
              border: `1.5px solid ${T.border}`, fontSize: 13, outline: "none",
              color: T.dark, background: T.bg }} />
          <button onClick={handleAsk} disabled={asking || !question.trim()}
            style={{ padding: "10px 16px", borderRadius: 12, border: "none",
              background: question.trim() ? T.terra : T.border,
              color: T.white, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            {asking ? "…" : "→"}
          </button>
        </div>
      </Card>

      {/* Sleep snapshot */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.dark }}>😴 Sommeil cette nuit</span>
          <span style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700,
            color: parseFloat(sleepH) >= 7 ? T.sage : T.terra }}>{sleepH}h</span>
        </div>
        <SleepBar label="Efficacité" value={`${health.sleep.efficiency}%`} pct={health.sleep.efficiency} color={health.sleep.efficiency>=85?T.sage:T.terra} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <SleepBar label="HRV" value={`${health.sleep.average_hrv}ms`} pct={(health.sleep.average_hrv/100)*100} color={T.sage} />
          <SleepBar label="FC repos" value={`${health.sleep.average_heart_rate}bpm`} pct={60} color={T.purple} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {[
            { l: "Récupération", v: `${health.sleep.readiness_score}/100`, ok: health.sleep.readiness_score >= 70 },
            { l: "Sommeil profond", v: `${Math.round(health.sleep.deep_sleep_duration/60)}min`, ok: health.sleep.deep_sleep_duration>3600 },
            { l: "Sommeil REM", v: `${Math.round(health.sleep.rem_sleep_duration/60)}min`, ok: health.sleep.rem_sleep_duration>4800 },
          ].map(s => (
            <div key={s.l} style={{ flex: "1 1 calc(33%-8px)", background: s.ok ? `${T.sage}12` : `${T.terra}10`,
              borderRadius: 10, padding: "8px", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.ok ? T.sageDark : T.terraDark }}>{s.v}</div>
              <div style={{ fontSize: 10, color: T.mid, marginTop: 1 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Mood */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 10 }}>🧠 Comment tu te sens ?</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {moods.map(m => (
            <button key={m.val} onClick={() => setMood(m.val)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "8px 10px", borderRadius: 14,
                border: `2px solid ${mood===m.val ? T.terra : T.border}`,
                background: mood===m.val ? `${T.terra}12` : T.white, cursor: "pointer" }}>
              <span style={{ fontSize: 20 }}>{m.emoji}</span>
              <span style={{ fontSize: 10, color: mood===m.val ? T.terra : T.mid, fontWeight: 600 }}>{m.label}</span>
            </button>
          ))}
        </div>
        {advice?.mood_prediction && (
          <div style={{ marginTop: 10, fontSize: 12, color: T.mid, textAlign: "center", fontStyle: "italic" }}>
            {advice.mood_prediction}
          </div>
        )}
      </Card>

      {/* Activity */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 10 }}>🏃‍♀️ Activité</div>
        <div style={{ display: "flex", gap: 12, textAlign: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: T.terra }}>
              {(health.activity.steps||0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: T.mid }}>pas</div>
          </div>
          <div style={{ width: 1, background: T.border }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: T.sage }}>
              {health.activity.active_calories}
            </div>
            <div style={{ fontSize: 11, color: T.mid }}>cal actives</div>
          </div>
          <div style={{ width: 1, background: T.border }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, marginBottom: 2 }}>
              {health.activity.training_load==="low"?"🟢":health.activity.training_load==="moderate"?"🟡":"🔴"}
            </div>
            <div style={{ fontSize: 11, color: T.mid }}>charge</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── CYCLE CALENDAR SCREEN ────────────────────────────────────────────────────
function CycleScreen({ health, periods, onLogPeriod }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [showLog, setShowLog] = useState(false);
  const [logDate, setLogDate] = useState(now.toISOString().split("T")[0]);
  const [symptoms, setSymptoms] = useState([]);

  const phase = T.phases[health.cycle.current_phase];
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const symptomList = [
    { id: "crampes", label: "Crampes", emoji: "🔥" },
    { id: "fatigue", label: "Fatigue", emoji: "😴" },
    { id: "humeur", label: "Humeur", emoji: "😤" },
    { id: "tete", label: "Maux de tête", emoji: "🤯" },
    { id: "ballonnements", label: "Ballonnements", emoji: "🫧" },
  ];

  function getDayInfo(d) {
    const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const period = periods.find(p => {
      const s = new Date(p.start), e = new Date(p.end || p.start);
      const dt = new Date(dateStr);
      return dt >= s && dt <= e;
    });
    const isToday = dateStr === now.toISOString().split("T")[0];
    return { dateStr, isPeriod: !!period, isToday, period };
  }

  const months = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const weekDays = ["L","M","M","J","V","S","D"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: T.dark }}>
          Cycle 🩸
        </div>
        <button onClick={() => setShowLog(true)}
          style={{ background: T.terra, border: "none", borderRadius: 20, padding: "8px 16px",
            color: T.white, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
          + Règles
        </button>
      </div>

      {/* Phase summary */}
      <Card style={{ background: `linear-gradient(135deg,${phase.bg},${T.bg})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <PhaseRing phase={health.cycle.current_phase} day={health.cycle.cycle_day} total={health.cycle.cycleLength} />
          <div>
            <Tag label={`${phase.emoji} Phase ${phase.label}`} color={phase.color} />
            <div style={{ fontSize: 13, color: T.mid, marginTop: 6 }}>Jour {health.cycle.cycle_day} sur {health.cycle.cycleLength}</div>
            <div style={{ fontSize: 11, color: T.light, marginTop: 3 }}>
              Prochaines règles : {new Date(health.cycle.nextPeriod).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={() => { let m=viewMonth-1,y=viewYear; if(m<0){m=11;y--;} setViewMonth(m);setViewYear(y); }}
            style={{ background: T.bg2, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 16 }}>‹</button>
          <div style={{ fontWeight: 700, color: T.dark, fontSize: 14 }}>{months[viewMonth]} {viewYear}</div>
          <button onClick={() => { let m=viewMonth+1,y=viewYear; if(m>11){m=0;y++;} setViewMonth(m);setViewYear(y); }}
            style={{ background: T.bg2, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 16 }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
          {weekDays.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: T.light, padding: "4px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {Array(offset).fill(null).map((_,i) => <div key={`e${i}`} />)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const d = i+1;
            const info = getDayInfo(d);
            return (
              <div key={d} style={{
                aspectRatio: "1", borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 12, fontWeight: info.isToday ? 700 : 400,
                background: info.isPeriod ? `${T.red}25` : info.isToday ? T.terra : "transparent",
                color: info.isToday ? T.white : info.isPeriod ? T.red : T.dark,
                border: info.isToday ? "none" : info.isPeriod ? `1.5px solid ${T.red}40` : "none",
                cursor: "pointer",
              }}>
                {info.isPeriod ? "🩸" : d}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.mid }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.terra }} />Aujourd'hui
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.mid }}>
            <span style={{ fontSize: 11 }}>🩸</span>Règles
          </div>
        </div>
      </Card>

      {/* Phase guide */}
      <div style={{ fontSize: 12, fontWeight: 700, color: T.mid, paddingLeft: 4 }}>GUIDE DES PHASES</div>
      {Object.entries(T.phases).map(([key, ph]) => {
        const isActive = key === health.cycle.current_phase;
        const tips = {
          menstrual: "Repos prioritaire. Alimentation riche en fer. Évite l'effort intense.",
          follicular: "Énergie montante ! Idéal pour de nouveaux projets et entraînements.",
          ovulation: "Pic de communication et d'énergie. Moments forts pour les défis.",
          luteal: "Ralentis doucement. Priorise la récupération et le calme.",
        };
        return (
          <Card key={key} style={{ borderLeft: `4px solid ${isActive ? ph.color : T.border}`,
            background: isActive ? ph.bg : T.white, opacity: isActive ? 1 : 0.75 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22 }}>{ph.emoji}</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, color: ph.color, fontSize: 14 }}>{ph.label}</span>
                  <span style={{ fontSize: 11, color: T.light }}>{ph.days}</span>
                  {isActive && <Tag label="Maintenant" color={T.white} bg={ph.color} />}
                </div>
                <p style={{ fontSize: 12, color: T.mid, margin: 0, lineHeight: 1.5 }}>{tips[key]}</p>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Log modal */}
      {showLog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100,
          display: "flex", alignItems: "flex-end" }} onClick={() => setShowLog(false)}>
          <div style={{ background: T.white, borderRadius: "20px 20px 0 0", padding: 24, width: "100%",
            maxWidth: 430, margin: "0 auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: T.dark, marginBottom: 16 }}>
              🩸 Enregistrer mes règles
            </div>
            <div style={{ fontSize: 13, color: T.mid, marginBottom: 6, fontWeight: 600 }}>Date de début</div>
            <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${T.border}`,
                fontFamily: "'DM Sans',sans-serif", fontSize: 14, marginBottom: 14, outline: "none" }} />
            <div style={{ fontSize: 13, color: T.mid, marginBottom: 8, fontWeight: 600 }}>Symptômes (optionnel)</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {symptomList.map(s => (
                <button key={s.id} onClick={() => setSymptoms(prev => prev.includes(s.id) ? prev.filter(x=>x!==s.id) : [...prev,s.id])}
                  style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${symptoms.includes(s.id) ? T.red : T.border}`,
                    background: symptoms.includes(s.id) ? `${T.red}15` : T.white,
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    color: symptoms.includes(s.id) ? T.red : T.mid }}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
            <button onClick={() => { onLogPeriod({ start: logDate, symptoms }); setShowLog(false); setSymptoms([]); }}
              style={{ width: "100%", padding: 14, borderRadius: 14, border: "none",
                background: T.terra, color: T.white, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROGRESS SCREEN ──────────────────────────────────────────────────────────
function ProgressScreen({ health, savedAdvice, onRemoveSaved }) {
  const [tab, setTab] = useState("sleep");
  const weekLabels = ["L","M","M","J","V","S","D"];

  // Build sleep history chart
  const sleepHistory = health.sleepHistory || [];
  const maxSleep = sleepHistory.length ? Math.max(...sleepHistory.map(s=>s.hours), 8) : 8;
  const avgSleep = sleepHistory.length ? (sleepHistory.reduce((a,s)=>a+s.hours,0)/sleepHistory.length).toFixed(1) : "–";
  const avgHrv = sleepHistory.length ? Math.round(sleepHistory.reduce((a,s)=>a+(s.hrv||0),0)/sleepHistory.length) : "–";

  const categoryEmoji = { sommeil:"😴", cycle:"🩸", sport:"🏃‍♀️", humeur:"🧠", nutrition:"🥗" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: T.dark, paddingTop: 4 }}>
        Mes progrès 📈
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, background: T.bg2, borderRadius: 14, padding: 4 }}>
        {[{k:"sleep",l:"Sommeil"},{k:"saved",l:"Mes conseils"}].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none", cursor: "pointer",
              background: tab===t.k ? T.white : "transparent",
              color: tab===t.k ? T.dark : T.mid,
              fontWeight: tab===t.k ? 700 : 500, fontSize: 13,
              boxShadow: tab===t.k ? "0 1px 6px rgba(0,0,0,0.08)" : "none" }}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "sleep" && (
        <>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { l:"Moy. sommeil", v:`${avgSleep}h`, ok: parseFloat(avgSleep)>=7, emoji:"😴" },
              { l:"Moy. HRV", v:`${avgHrv}ms`, ok: avgHrv>=40, emoji:"💚" },
              { l:"Récupération", v:`${health.sleep.readiness_score}/100`, ok: health.sleep.readiness_score>=70, emoji:"⚡" },
            ].map(s => (
              <Card key={s.l} style={{ textAlign: "center", padding: "14px 10px" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700,
                  color: s.ok ? T.sageDark : T.terraDark }}>{s.v}</div>
                <div style={{ fontSize: 10, color: T.light, marginTop: 2 }}>{s.l}</div>
              </Card>
            ))}
          </div>

          {/* Sleep chart */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 14 }}>Sommeil — 7 derniers jours</div>
            {sleepHistory.length > 0 ? (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 90 }}>
                {sleepHistory.map((s, i) => {
                  const pct = (s.hours / maxSleep) * 100;
                  const isGood = s.hours >= 7;
                  const label = weekLabels[new Date(s.day).getDay() === 0 ? 6 : new Date(s.day).getDay()-1];
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{ fontSize: 10, color: T.mid, fontWeight: 600 }}>{s.hours}h</div>
                      <div style={{ width: "100%", height: `${pct}%`, borderRadius: "4px 4px 2px 2px",
                        background: isGood ? T.sage : `${T.terra}70`, transition: "height 1s ease" }} />
                      <div style={{ fontSize: 10, color: T.light }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: T.light, fontSize: 13, padding: "20px 0" }}>
                Données insuffisantes — connecte ton Oura pour voir l'historique
              </div>
            )}
            <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
              <div style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.mid }}>
                <div style={{ width:10,height:10,borderRadius:2,background:T.sage }} />≥7h ✓
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.mid }}>
                <div style={{ width:10,height:10,borderRadius:2,background:`${T.terra}70` }} />&lt;7h
              </div>
            </div>
          </Card>

          {/* HRV trend */}
          {sleepHistory.some(s=>s.hrv) && (
            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 12 }}>HRV — Tendance</div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 60 }}>
                {sleepHistory.map((s,i) => {
                  const maxHrv = Math.max(...sleepHistory.map(x=>x.hrv||0),100);
                  const pct = ((s.hrv||0)/maxHrv)*100;
                  return (
                    <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                      <div style={{ width:"100%",height:`${pct}%`,borderRadius:"3px 3px 1px 1px",
                        background: (s.hrv||0)>=40 ? T.purple : `${T.purple}40` }} />
                      <div style={{ fontSize:9,color:T.light }}>
                        {weekLabels[new Date(s.day).getDay()===0?6:new Date(s.day).getDay()-1]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Correlation insight */}
          <Card style={{ background: `${T.sage}08`, border: `1px solid ${T.sage}30` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.sageDark, marginBottom: 6 }}>🔬 Corrélation cycle × sommeil</div>
            <p style={{ fontSize: 13, color: T.mid, margin: 0, lineHeight: 1.6 }}>
              En phase <strong>{T.phases[health.cycle.current_phase].label}</strong>, ton sommeil tend à être{" "}
              {health.cycle.current_phase === "luteal" ? "plus agité (bouffées de chaleur, réveils nocturnes)." :
               health.cycle.current_phase === "menstrual" ? "plus lourd mais moins réparateur." :
               "plus léger et plus réparateur. ✨"}
            </p>
          </Card>
        </>
      )}

      {tab === "saved" && (
        <>
          {savedAdvice.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "32px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>☆</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: T.dark, marginBottom: 6 }}>Aucun conseil sauvegardé</div>
              <div style={{ fontSize: 13, color: T.mid }}>Appuie sur ☆ sur un conseil pour le retrouver ici.</div>
            </Card>
          ) : (
            savedAdvice.map((a, i) => (
              <Card key={i} style={{ borderLeft: `4px solid ${T.gold}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 16 }}>{categoryEmoji[a.category] || "🌿"}</span>
                    <Tag label={a.category || "conseil"} color={T.terra} />
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {a.rating === true && <span style={{ fontSize: 12 }}>👍</span>}
                    {a.rating === false && <span style={{ fontSize: 12 }}>👎</span>}
                    <button onClick={() => onRemoveSaved(i)}
                      style={{ background: "none", border: "none", color: T.light, fontSize: 16, cursor: "pointer", lineHeight: 1 }}>×</button>
                  </div>
                </div>
                <p style={{ fontFamily: "'Fraunces',serif", fontSize: 14, color: T.dark, lineHeight: 1.6, margin: "0 0 8px" }}>
                  {a.conseil}
                </p>
                {a.action && (
                  <div style={{ fontSize: 12, color: T.terraDark, background: `${T.terra}08`, borderRadius: 8, padding: "6px 10px" }}>
                    ✅ {a.action}
                  </div>
                )}
                {a.savedAt && (
                  <div style={{ fontSize: 11, color: T.light, marginTop: 6 }}>
                    Sauvegardé le {new Date(a.savedAt).toLocaleDateString("fr-FR")}
                  </div>
                )}
              </Card>
            ))
          )}
        </>
      )}
    </div>
  );
}

// ─── NOTIFICATIONS SCREEN ─────────────────────────────────────────────────────
function NotifScreen({ notifSettings, onUpdate }) {
  const [settings, setSettings] = useState(notifSettings);
  const [saved, setSaved] = useState(false);

  const update = (key, val) => setSettings(p => ({ ...p, [key]: val }));

  const save = async () => {
    await DB.set("notif_settings", settings);
    onUpdate(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Request browser notification permission
    if (settings.enabled && "Notification" in window) {
      Notification.requestPermission().then(perm => {
        if (perm === "granted") {
          scheduleNotif(settings);
        }
      });
    }
  };

  function scheduleNotif(s) {
    // Demo: send a test notification immediately
    if (Notification.permission === "granted") {
      new Notification("🌿 Afiya — Conseil du jour", {
        body: `Bonjour ! Ton conseil du ${new Date().toLocaleDateString("fr-FR")} est prêt.`,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌿</text></svg>",
      });
    }
  }

  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)}
      style={{ width: 48, height: 26, borderRadius: 13, background: value ? T.terra : T.border,
        position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 25 : 3, width: 20, height: 20,
        borderRadius: "50%", background: T.white, transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: T.dark, paddingTop: 4 }}>
        Notifications 🔔
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0 14px",
          borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.dark }}>Activer les rappels</div>
            <div style={{ fontSize: 12, color: T.mid }}>Conseil quotidien personnalisé</div>
          </div>
          <Toggle value={settings.enabled} onChange={v => update("enabled", v)} />
        </div>

        <div style={{ padding: "14px 0", borderBottom: `1px solid ${T.border}`, opacity: settings.enabled ? 1 : 0.4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 8 }}>Heure du rappel</div>
          <input type="time" value={settings.time} onChange={e => update("time", e.target.value)}
            disabled={!settings.enabled}
            style={{ padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${T.border}`,
              fontFamily: "'DM Sans',sans-serif", fontSize: 15, outline: "none", width: "100%" }} />
        </div>

        <div style={{ paddingTop: 14, opacity: settings.enabled ? 1 : 0.4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 10 }}>Types de rappels</div>
          {[
            { key: "morning", label: "Conseil du matin", emoji: "🌅", desc: "Ton insight quotidien basé sur ta nuit" },
            { key: "cycle", label: "Alerte de phase", emoji: "🩸", desc: "Quand ta phase du cycle change" },
            { key: "sleep", label: "Bilan de sommeil", emoji: "😴", desc: "Résumé de ta nuit chaque matin" },
          ].map(n => (
            <div key={n.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18 }}>{n.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.dark }}>{n.label}</div>
                  <div style={{ fontSize: 11, color: T.mid }}>{n.desc}</div>
                </div>
              </div>
              <Toggle value={settings[n.key] ?? true} onChange={v => update(n.key, v)} />
            </div>
          ))}
        </div>
      </Card>

      <button onClick={save}
        style={{ padding: "14px", borderRadius: 16, border: "none", background: T.terra,
          color: T.white, fontWeight: 700, fontSize: 15, cursor: "pointer",
          transition: "all 0.2s", boxShadow: `0 4px 14px ${T.terra}40` }}>
        {saved ? "✓ Sauvegardé !" : "Sauvegarder les préférences"}
      </button>

      <Card style={{ background: `${T.gold}10`, border: `1px solid ${T.gold}30` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#A07010", marginBottom: 4 }}>💡 Comment ça marche</div>
        <p style={{ fontSize: 12, color: T.mid, margin: 0, lineHeight: 1.6 }}>
          Afiya génère ton conseil chaque matin en analysant tes données Oura de la nuit précédente et ta phase du cycle.
          Tu reçois un message personnalisé — jamais générique.
        </p>
      </Card>

      <button onClick={() => {
        if ("Notification" in window) {
          Notification.requestPermission().then(p => {
            if (p === "granted") {
              new Notification("🌿 Afiya — Test", { body: "Les notifications Afiya fonctionnent !" });
            } else alert("Autorise les notifications dans ton navigateur.");
          });
        } else alert("Notifications non supportées dans ce navigateur.");
      }}
        style={{ padding: "12px", borderRadius: 14, border: `1.5px dashed ${T.border}`,
          background: "none", color: T.mid, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
        Tester une notification →
      </button>
    </div>
  );
}

// ─── PROFILE SCREEN ───────────────────────────────────────────────────────────
function ProfileScreen({ health, ouraConnected, onReconnect }) {
  const goals = {
    mieux_dormir: { l: "Mieux dormir", e: "😴" },
    comprendre_cycle: { l: "Comprendre mon cycle", e: "🩸" },
    reduire_stress: { l: "Réduire le stress", e: "🧘" },
    sport: { l: "Optimiser mon sport", e: "🏃‍♀️" },
    hormones: { l: "Gérer mes hormones", e: "🔬" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: T.dark, paddingTop: 4 }}>
        Mon profil 🌿
      </div>

      <Card style={{ textAlign: "center", background: `linear-gradient(135deg,${T.bg2},${T.white})` }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%",
          background: `linear-gradient(135deg,${T.terra},${T.terraLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, margin: "0 auto 12px", boxShadow: `0 4px 18px ${T.terra}40` }}>🌸</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: T.dark }}>{health.profile.name}</div>
        <div style={{ fontSize: 13, color: T.mid }}>{health.profile.age} ans</div>
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.mid, marginBottom: 10 }}>MES OBJECTIFS</div>
        {health.profile.goals.map(g => {
          const goal = goals[g];
          return goal ? (
            <div key={g} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0",
              borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 18 }}>{goal.e}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.dark }}>{goal.l}</span>
              <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: T.sage }} />
            </div>
          ) : null;
        })}
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.mid, marginBottom: 10 }}>DONNÉES CONNECTÉES</div>
        {[
          { n: "Oura Ring", t: "Sommeil · HRV · Récupération", connected: ouraConnected, icon: "💍" },
          { n: "Apple Health", t: "Cycle · Activité", connected: false, icon: "🍎" },
          { n: "Google Fit", t: "Android", connected: false, icon: "🤖" },
        ].map(s => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0",
            borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.dark }}>{s.n}</div>
              <div style={{ fontSize: 11, color: T.light }}>{s.t}</div>
            </div>
            {s.connected ? (
              <Tag label="Connecté ✓" color={T.sageDark} bg={`${T.sage}18`} />
            ) : (
              <button onClick={s.n==="Oura Ring" ? onReconnect : undefined}
                style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 10, border: "none",
                  background: `${T.terra}15`, color: T.terra, cursor: "pointer" }}>
                {s.n==="Oura Ring" ? "Connecter" : "Bientôt"}
              </button>
            )}
          </div>
        ))}
      </Card>

      <Card style={{ background: `${T.sage}08`, border: `1px solid ${T.sage}30` }}>
        <div style={{ fontSize: 12, color: T.sageDark, lineHeight: 1.7, textAlign: "center" }}>
          🔒 Tes données restent sur ton appareil.<br />
          Afiya ne vend ni ne partage aucune donnée personnelle.
        </div>
      </Card>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const DEFAULT_HEALTH = {
  sleep: { total_sleep_duration: 22140, efficiency: 82, average_hrv: 52,
    average_heart_rate: 61, latency: 900, deep_sleep_duration: 4800,
    rem_sleep_duration: 5400, readiness_score: 68, last_night: "2026-03-07" },
  sleepHistory: [],
  activity: { steps: 7240, active_calories: 320, training_load: "moderate", score: 55 },
  raw: {},
};

const DEFAULT_PROFILE = {
  name: "Yasmine", age: 24,
  hormonal_profile: "normal",
  goals: ["mieux_dormir", "comprendre_cycle"],
  lastPeriodStart: "2026-02-28",
  cycleLength: 28,
};

const DEFAULT_NOTIF = { enabled: false, time: "08:00", morning: true, cycle: true, sleep: true };

export default function App() {
  const [screen, setScreen] = useState("home");
  const [phase, setPhase] = useState("connect"); // connect | app
  const [ouraToken, setOuraToken] = useState(null);
  const [health, setHealth] = useState(DEFAULT_HEALTH);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [cycleData, setCycleData] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [mood, setMood] = useState(null);
  const [savedAdvice, setSavedAdvice] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [notifSettings, setNotifSettings] = useState(DEFAULT_NOTIF);

  // Load persisted data on mount
  useEffect(() => {
    (async () => {
      const token = await DB.get("oura_token");
      const saved = await DB.get("saved_advice");
      const periods_ = await DB.get("periods");
      const notif = await DB.get("notif_settings");
      const prof = await DB.get("profile");

      if (saved) setSavedAdvice(saved);
      if (periods_) setPeriods(periods_);
      if (notif) setNotifSettings(notif);
      if (prof) setProfile(prof);

      if (token) {
        try {
          const data = await loadOuraData(token);
          setOuraToken(token);
          setHealth({ ...DEFAULT_HEALTH, ...data });
          setPhase("app");
        } catch {
          setPhase("connect");
        }
      } else {
        setPhase("connect");
      }
    })();
  }, []);

  // Compute cycle whenever profile changes
  useEffect(() => {
    const c = computeCyclePhase(profile.lastPeriodStart, profile.cycleLength);
    setCycleData(c);
  }, [profile]);

  // Fetch AI advice when data is ready
  useEffect(() => {
    if (phase !== "app" || !cycleData) return;
    generateAdvice();
  }, [phase, cycleData]);

  const fullHealth = {
    ...health,
    cycle: cycleData ? {
      current_phase: cycleData.phase,
      cycle_day: cycleData.day,
      cycleLength: cycleData.cycleLength,
      nextPeriod: cycleData.nextPeriod,
    } : { current_phase: "follicular", cycle_day: 8, cycleLength: 28, nextPeriod: "2026-03-27" },
    profile,
  };

  async function generateAdvice(question = null) {
    setLoadingAdvice(true);
    const a = await fetchAfiyaAdvice(fullHealth, question);
    setAdvice(a);
    setLoadingAdvice(false);
    setScreen("home");
  }

  async function handleConnect(token, data) {
    setOuraToken(token);
    if (data) setHealth({ ...DEFAULT_HEALTH, ...data });
    setPhase("app");
    // small delay for cycle to compute
    setTimeout(() => generateAdvice(), 300);
  }

  async function handleSave(a) {
    const already = savedAdvice.some(x => x.conseil === a.conseil);
    if (already) return;
    const updated = [{ ...a, savedAt: new Date().toISOString() }, ...savedAdvice];
    setSavedAdvice(updated);
    await DB.set("saved_advice", updated);
  }

  async function handleRate(a, positive) {
    const updated = savedAdvice.map(x =>
      x.conseil === a.conseil ? { ...x, rating: positive } : x
    );
    // If not saved yet, save with rating
    if (!savedAdvice.some(x => x.conseil === a.conseil)) {
      const withRating = [{ ...a, savedAt: new Date().toISOString(), rating: positive }, ...savedAdvice];
      setSavedAdvice(withRating);
      await DB.set("saved_advice", withRating);
    } else {
      setSavedAdvice(updated);
      await DB.set("saved_advice", updated);
    }
  }

  async function handleRemoveSaved(idx) {
    const updated = savedAdvice.filter((_, i) => i !== idx);
    setSavedAdvice(updated);
    await DB.set("saved_advice", updated);
  }

  async function handleLogPeriod(p) {
    const updated = [p, ...periods];
    setPeriods(updated);
    await DB.set("periods", updated);
    // Update last period start in profile
    const newProfile = { ...profile, lastPeriodStart: p.start };
    setProfile(newProfile);
    await DB.set("profile", newProfile);
  }

  const navItems = [
    { key: "home", icon: "🌿", label: "Accueil" },
    { key: "cycle", icon: "🩸", label: "Cycle" },
    { key: "progress", icon: "📈", label: "Progrès" },
    { key: "notif", icon: "🔔", label: "Rappels" },
    { key: "profile", icon: "👤", label: "Profil" },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#E8E4DC;font-family:'DM Sans',sans-serif;}
        ::-webkit-scrollbar{display:none;}
        input{font-family:'DM Sans',sans-serif;}
        button{font-family:'DM Sans',sans-serif;}
        input[type=time],input[type=date]{color:#1C1C1E;}
      `}</style>

      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh",
        background: T.bg, display: "flex", flexDirection: "column",
        boxShadow: "0 0 80px rgba(0,0,0,0.15)", position: "relative" }}>

        {phase === "connect" ? (
          <div style={{ flex: 1, padding: "24px 20px 40px" }}>
            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 700,
                color: T.terra, letterSpacing: "-1px" }}>Afiya</div>
              <div style={{ fontSize: 13, color: T.mid }}>Ton bien-être, compris. Tes habitudes, guidées.</div>
            </div>
            <OuraConnectScreen onConnect={handleConnect} />
          </div>
        ) : (
          <>
            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 110px" }}>
              {screen === "home" && (
                <HomeScreen health={fullHealth} advice={advice} loading={loadingAdvice}
                  mood={mood} setMood={setMood} onAskQuestion={generateAdvice}
                  savedAdvice={savedAdvice} onSave={handleSave} onRate={handleRate} />
              )}
              {screen === "cycle" && (
                <CycleScreen health={fullHealth} periods={periods} onLogPeriod={handleLogPeriod} />
              )}
              {screen === "progress" && (
                <ProgressScreen health={fullHealth} savedAdvice={savedAdvice} onRemoveSaved={handleRemoveSaved} />
              )}
              {screen === "notif" && (
                <NotifScreen notifSettings={notifSettings} onUpdate={setNotifSettings} />
              )}
              {screen === "profile" && (
                <ProfileScreen health={fullHealth} ouraConnected={!!ouraToken && ouraToken !== "DEMO"}
                  onReconnect={() => setPhase("connect")} />
              )}
            </div>

            {/* Bottom Nav */}
            <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
              width: "100%", maxWidth: 430,
              background: "rgba(250,249,246,0.96)", backdropFilter: "blur(20px)",
              borderTop: `1px solid ${T.border}`, display: "flex", padding: "8px 4px 18px" }}>
              {navItems.map(n => (
                <button key={n.key} onClick={() => setScreen(n.key)}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    background: "none", border: "none", cursor: "pointer", padding: "6px 4px" }}>
                  <div style={{ fontSize: 20,
                    filter: screen===n.key ? "none" : "grayscale(90%) opacity(0.45)",
                    transform: screen===n.key ? "scale(1.18)" : "scale(1)",
                    transition: "all 0.2s" }}>{n.icon}</div>
                  <span style={{ fontSize: 10, fontWeight: 700,
                    color: screen===n.key ? T.terra : T.light,
                    transition: "color 0.2s" }}>{n.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
