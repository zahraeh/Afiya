import { useState, useEffect, useRef } from "react";

// ─── DESIGN TOKENS (from wireframes) ───────────────────────────────────────
const T = {
  terra: "#C4704F",
  terraLight: "#E8956D",
  terraDark: "#A05535",
  sage: "#7A9E7E",
  sageDark: "#5A7E5E",
  bg: "#FAF9F6",
  bg2: "#F2EFE9",
  dark: "#1C1C1E",
  mid: "#6E6E73",
  light: "#AEAEB2",
  border: "#E5E0D8",
  white: "#FFFFFF",
  phases: {
    menstrual: { color: "#E05C5C", bg: "#FDF0F0", label: "Menstruelle", emoji: "🩸" },
    follicular: { color: "#7A9E7E", bg: "#F0F5F1", label: "Folliculaire", emoji: "🌱" },
    ovulation: { color: "#F5A623", bg: "#FDF6ED", label: "Ovulatoire", emoji: "✨" },
    luteal: { color: "#9B7EC8", bg: "#F5F0FB", label: "Lutéale", emoji: "🌙" },
  },
};

// ─── MOCK OURA DATA (based on real CSV structure) ───────────────────────────
const mockHealthData = {
  sleep: {
    total_sleep_duration: 22140, // seconds → 6.15h
    efficiency: 82,
    average_hrv: 52,
    average_heart_rate: 61,
    latency: 900, // 15 min
    deep_sleep_duration: 4800,
    rem_sleep_duration: 5400,
    readiness_score: 68,
    last_night: "2026-03-07",
  },
  cycle: {
    current_phase: "follicular",
    cycle_day: 8,
    cycle_length: 28,
    last_period_start: "2026-02-28",
    next_period_predicted: "2026-03-27",
  },
  activity: {
    steps: 7240,
    active_calories: 320,
    training_load: "moderate",
  },
  mood: null,
  profile: {
    name: "Yasmine",
    age: 24,
    hormonal_profile: "normal",
    goals: ["mieux_dormir", "comprendre_cycle"],
  },
};

// ─── CLAUDE API CALL ────────────────────────────────────────────────────────
async function fetchAfiyaAdvice(healthData, userMessage = null) {
  const phase = T.phases[healthData.cycle.current_phase];
  const sleepHours = (healthData.sleep.total_sleep_duration / 3600).toFixed(1);

  const systemPrompt = `Tu es Afiya, un coach de bien-être quotidien bienveillant, expert en santé féminine et cyclique. 
Tu parles directement à l'utilisatrice, en français, avec un ton chaleureux, adulte et non-culpabilisant.
Tu connais ses données de santé en temps réel et tu génères UN conseil quotidien personnalisé, clair et actionnable.

Règles absolues :
- UN seul conseil principal, en 2-3 phrases maximum
- Toujours lier le conseil à ses données réelles (sommeil, cycle, HRV)
- Ton bienveillant, jamais culpabilisant
- Pas de jargon médical
- Jamais de diagnostic médical
- Termine par une micro-action concrète (< 30 secondes à lire)

Données de l'utilisatrice aujourd'hui :
- Prénom : ${healthData.profile.name}
- Phase du cycle : ${phase.label} (Jour ${healthData.cycle.cycle_day})
- Sommeil cette nuit : ${sleepHours}h, efficacité ${healthData.sleep.efficiency}%
- HRV moyen : ${healthData.sleep.average_hrv} ms
- Fréquence cardiaque au repos : ${healthData.sleep.average_heart_rate} bpm
- Score de récupération Oura : ${healthData.sleep.readiness_score}/100
- Latence d'endormissement : ${Math.round(healthData.sleep.latency / 60)} min
- Pas aujourd'hui : ${healthData.activity.steps}
- Profil hormonal : ${healthData.profile.hormonal_profile}
- Objectifs : ${healthData.profile.goals.join(", ")}

Réponds UNIQUEMENT en JSON valide, sans backticks ni markdown, avec ce format exact :
{
  "greeting": "Bonjour [prénom] 🌿",
  "insight": "Une observation courte sur ses données (1 phrase)",
  "conseil": "Le conseil principal personnalisé (2-3 phrases max)",
  "action": "L'action concrète à faire aujourd'hui (1 phrase, < 15 mots)",
  "category": "sommeil|cycle|sport|humeur|nutrition",
  "phase_tip": "Un mini-conseil lié spécifiquement à la phase du cycle (1 phrase)",
  "energy_level": "low|medium|high",
  "mood_prediction": "Une prédiction d'humeur pour aujourd'hui (1 phrase courte)"
}`;

  const userContent = userMessage
    ? `L'utilisatrice pose cette question : "${userMessage}". Réponds en gardant le même format JSON mais adapte le conseil à sa question.`
    : "Génère le conseil du jour pour cette utilisatrice.";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    const data = await response.json();
    const text = data.content.map((i) => i.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    return {
      greeting: `Bonjour ${healthData.profile.name} 🌿`,
      insight: "Tes données de cette nuit montrent une belle récupération.",
      conseil: "Ta phase folliculaire est le moment idéal pour recharger ton énergie créative. Ton HRV de 52 ms indique que ton corps récupère bien. Profite de cette fenêtre pour planifier ta semaine.",
      action: "Prends 5 minutes ce matin pour écrire 3 intentions pour la semaine.",
      category: "cycle",
      phase_tip: "En phase folliculaire, ton énergie monte naturellement — c'est le bon moment pour initier de nouveaux projets.",
      energy_level: "medium",
      mood_prediction: "Tu devrais te sentir progressivement plus énergique aujourd'hui.",
    };
  }
}

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

const style = {
  fontImport: `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');`,
};

function PhaseRing({ phase, day, total }) {
  const pct = day / total;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = T.phases[phase]?.color || T.terra;
  return (
    <div style={{ position: "relative", width: 88, height: 88 }}>
      <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke={T.border} strokeWidth="5" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", textAlign: "center",
      }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: T.dark, lineHeight: 1 }}>{day}</div>
        <div style={{ fontSize: 10, color: T.mid, fontWeight: 500 }}>J/{total}</div>
      </div>
    </div>
  );
}

function SleepBar({ label, value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: T.mid, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: T.dark, fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 3,
          background: color || T.sage,
          transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
}

function MoodPicker({ selected, onChange }) {
  const moods = [
    { emoji: "😴", label: "Fatiguée", value: "tired" },
    { emoji: "😐", label: "Neutre", value: "neutral" },
    { emoji: "😊", label: "Bien", value: "good" },
    { emoji: "⚡", label: "Énergique", value: "energized" },
    { emoji: "🌟", label: "Au top", value: "great" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
      {moods.map((m) => (
        <button key={m.value} onClick={() => onChange(m.value)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "10px 14px", borderRadius: 16,
            border: `2px solid ${selected === m.value ? T.terra : T.border}`,
            background: selected === m.value ? `${T.terra}15` : T.white,
            cursor: "pointer", transition: "all 0.2s",
          }}>
          <span style={{ fontSize: 24 }}>{m.emoji}</span>
          <span style={{ fontSize: 11, color: selected === m.value ? T.terra : T.mid, fontWeight: 600 }}>{m.label}</span>
        </button>
      ))}
    </div>
  );
}

function Card({ children, style: s = {} }) {
  return (
    <div style={{
      background: T.white, borderRadius: 20, padding: "20px 20px",
      border: `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(28,28,30,0.04)",
      ...s,
    }}>
      {children}
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center", padding: "24px 0" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%", background: T.terra,
          animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
        }} />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}

// ─── SCREENS ────────────────────────────────────────────────────────────────

function HomeScreen({ health, advice, loading, mood, setMood, onAskQuestion }) {
  const phase = T.phases[health.cycle.current_phase];
  const sleepH = (health.sleep.total_sleep_duration / 3600).toFixed(1);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    await onAskQuestion(question);
    setQuestion("");
    setAsking(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <div style={{ fontSize: 13, color: T.mid, fontWeight: 500, marginBottom: 2 }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: T.dark, lineHeight: 1.1 }}>
          {advice?.greeting || `Bonjour ${health.profile.name} 🌿`}
        </div>
      </div>

      {/* Phase + Cycle ring */}
      <Card style={{ background: `linear-gradient(135deg, ${phase.bg} 0%, ${T.bg2} 100%)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <PhaseRing phase={health.cycle.current_phase} day={health.cycle.cycle_day} total={health.cycle.cycle_length} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${phase.color}20`, borderRadius: 20, padding: "4px 12px", marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>{phase.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: phase.color }}>Phase {phase.label}</span>
            </div>
            {advice?.phase_tip && (
              <p style={{ fontSize: 13, color: T.mid, lineHeight: 1.4, margin: 0 }}>{advice.phase_tip}</p>
            )}
            <div style={{ fontSize: 12, color: T.light, marginTop: 6 }}>
              Prochaines règles : {new Date(health.cycle.next_period_predicted).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            </div>
          </div>
        </div>
      </Card>

      {/* AI Conseil du jour */}
      <Card style={{ borderLeft: `4px solid ${T.terra}`, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -20, right: -20, width: 80, height: 80,
          borderRadius: "50%", background: `${T.terra}08`,
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.terra }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.terra, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Conseil du jour · IA
          </span>
        </div>

        {loading ? <LoadingDots /> : (
          <>
            {advice?.insight && (
              <div style={{ fontSize: 13, color: T.mid, fontStyle: "italic", marginBottom: 10, lineHeight: 1.5 }}>
                {advice.insight}
              </div>
            )}
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 17, color: T.dark, lineHeight: 1.6, margin: "0 0 14px" }}>
              {advice?.conseil || "Chargement de ton conseil personnalisé…"}
            </p>
            {advice?.action && (
              <div style={{
                background: `${T.terra}10`, borderRadius: 12, padding: "10px 14px",
                display: "flex", alignItems: "flex-start", gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <span style={{ fontSize: 13, color: T.terraDark, fontWeight: 500, lineHeight: 1.4 }}>{advice.action}</span>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Ask Afiya */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 10 }}>💬 Demande à Afiya</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Ex : Pourquoi je suis si fatiguée en ce moment ?"
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 12,
              border: `1.5px solid ${T.border}`, fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, outline: "none", color: T.dark, background: T.bg,
            }}
          />
          <button onClick={handleAsk} disabled={asking || !question.trim()}
            style={{
              padding: "10px 16px", borderRadius: 12, border: "none",
              background: question.trim() ? T.terra : T.border,
              color: T.white, fontWeight: 600, fontSize: 13, cursor: "pointer",
              transition: "all 0.2s",
            }}>
            {asking ? "…" : "→"}
          </button>
        </div>
      </Card>

      {/* Sleep snapshot */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.dark }}>😴 Sommeil cette nuit</span>
          <div style={{
            fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 700,
            color: parseFloat(sleepH) >= 7 ? T.sage : T.terra,
          }}>
            {sleepH}h
          </div>
        </div>
        <SleepBar label="Efficacité" value={`${health.sleep.efficiency}%`} max={1} value_raw={health.sleep.efficiency} color={health.sleep.efficiency >= 85 ? T.sage : T.terra} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
          <SleepBar label="HRV" value={`${health.sleep.average_hrv} ms`} max={1} value_raw={health.sleep.average_hrv / 100} color={T.sage} />
          <SleepBar label="FC repos" value={`${health.sleep.average_heart_rate} bpm`} max={1} value_raw={0.6} color="#9B7EC8" />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {[
            { label: "Sommeil profond", val: `${Math.round(health.sleep.deep_sleep_duration / 60)} min`, good: health.sleep.deep_sleep_duration > 3600 },
            { label: "Sommeil paradoxal", val: `${Math.round(health.sleep.rem_sleep_duration / 60)} min`, good: health.sleep.rem_sleep_duration > 4800 },
            { label: "Récupération", val: `${health.sleep.readiness_score}/100`, good: health.sleep.readiness_score >= 70 },
          ].map((s) => (
            <div key={s.label} style={{
              flex: "1 1 calc(33% - 8px)", background: s.good ? `${T.sage}12` : `${T.terra}12`,
              borderRadius: 10, padding: "8px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.good ? T.sageDark : T.terraDark }}>{s.val}</div>
              <div style={{ fontSize: 10, color: T.mid, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Mood check-in */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 12 }}>🧠 Comment tu te sens ce matin ?</div>
        <MoodPicker selected={mood} onChange={setMood} />
        {advice?.mood_prediction && (
          <div style={{ marginTop: 12, fontSize: 12, color: T.mid, textAlign: "center", fontStyle: "italic" }}>
            Afiya prédit : {advice.mood_prediction}
          </div>
        )}
      </Card>

      {/* Activity */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 12 }}>🏃‍♀️ Activité aujourd'hui</div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: T.terra }}>{health.activity.steps.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: T.mid }}>pas</div>
          </div>
          <div style={{ width: 1, background: T.border }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: T.sage }}>{health.activity.active_calories}</div>
            <div style={{ fontSize: 11, color: T.mid }}>cal actives</div>
          </div>
          <div style={{ width: 1, background: T.border }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 2 }}>
              {health.activity.training_load === "low" ? "🟢" : health.activity.training_load === "moderate" ? "🟡" : "🔴"}
            </div>
            <div style={{ fontSize: 11, color: T.mid }}>charge</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CycleScreen({ health }) {
  const phase = T.phases[health.cycle.current_phase];
  const phases = [
    { key: "menstrual", days: "J1–J5", desc: "Repos & introspection. Énergie basse, écoute ton corps.", icon: "🩸" },
    { key: "follicular", days: "J6–J13", desc: "Énergie montante. Parfait pour créer et initier de nouveaux projets.", icon: "🌱" },
    { key: "ovulation", days: "J14–J16", desc: "Pic d'énergie et de sociabilité. Moments forts pour communiquer.", icon: "✨" },
    { key: "luteal", days: "J17–J28", desc: "Énergie descend doucement. Finir les projets, ralentir.", icon: "🌙" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: T.dark, paddingTop: 8 }}>
        Ton cycle 🩸
      </div>

      <Card style={{ background: `linear-gradient(135deg, ${phase.bg} 0%, ${T.bg} 100%)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <PhaseRing phase={health.cycle.current_phase} day={health.cycle.cycle_day} total={health.cycle.cycle_length} />
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: T.dark, marginBottom: 4 }}>
              {phase.emoji} Phase {phase.label}
            </div>
            <div style={{ fontSize: 13, color: T.mid }}>Jour {health.cycle.cycle_day} sur {health.cycle.cycle_length}</div>
            <div style={{ fontSize: 12, color: T.light, marginTop: 4 }}>
              Prochaines règles le {new Date(health.cycle.next_period_predicted).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ fontWeight: 600, fontSize: 13, color: T.mid, paddingLeft: 4 }}>LES 4 PHASES</div>
      {phases.map((p) => {
        const ph = T.phases[p.key];
        const isActive = p.key === health.cycle.current_phase;
        return (
          <Card key={p.key} style={{
            borderLeft: `4px solid ${isActive ? ph.color : T.border}`,
            background: isActive ? `${ph.bg}` : T.white,
            opacity: isActive ? 1 : 0.8,
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24 }}>{p.icon}</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: ph.color, fontSize: 14 }}>{ph.label}</span>
                  <span style={{ fontSize: 11, color: T.light }}>{p.days}</span>
                  {isActive && (
                    <span style={{ background: ph.color, color: T.white, fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "2px 8px" }}>
                      Maintenant
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: T.mid, margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function SleepScreen({ health }) {
  const sleepH = (health.sleep.total_sleep_duration / 3600).toFixed(1);
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const mockWeek = [6.2, 7.1, 5.8, 7.4, 6.9, 8.1, parseFloat(sleepH)];
  const maxH = Math.max(...mockWeek);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: T.dark, paddingTop: 8 }}>
        Sommeil 😴
      </div>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.mid, marginBottom: 14 }}>7 DERNIERS JOURS</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 80 }}>
          {mockWeek.map((h, i) => {
            const pct = (h / maxH) * 100;
            const isToday = i === 6;
            const isGood = h >= 7;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 10, color: T.mid, fontWeight: 600 }}>{h}h</div>
                <div style={{
                  width: "100%", height: `${pct}%`, borderRadius: "4px 4px 2px 2px",
                  background: isToday ? T.terra : isGood ? T.sage : `${T.terra}60`,
                  transition: "height 1s ease",
                }} />
                <div style={{ fontSize: 10, color: isToday ? T.terra : T.light, fontWeight: isToday ? 700 : 400 }}>{days[i]}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 14 }}>Cette nuit</div>
        {[
          { label: "Durée totale", value: `${sleepH}h`, target: "7h+", good: parseFloat(sleepH) >= 7 },
          { label: "Efficacité", value: `${health.sleep.efficiency}%`, target: "85%+", good: health.sleep.efficiency >= 85 },
          { label: "HRV moyen", value: `${health.sleep.average_hrv} ms`, target: "40+ ms", good: health.sleep.average_hrv >= 40 },
          { label: "FC au repos", value: `${health.sleep.average_heart_rate} bpm`, target: "< 70 bpm", good: health.sleep.average_heart_rate < 70 },
          { label: "Latence", value: `${Math.round(health.sleep.latency / 60)} min`, target: "< 20 min", good: health.sleep.latency / 60 < 20 },
        ].map((m) => (
          <div key={m.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: `1px solid ${T.border}`,
          }}>
            <div>
              <div style={{ fontSize: 13, color: T.dark, fontWeight: 500 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: T.light }}>Cible : {m.target}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: m.good ? T.sage : T.terra }}>{m.value}</span>
              <span style={{ fontSize: 14 }}>{m.good ? "✅" : "⚠️"}</span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function ProfileScreen({ health }) {
  const goals = {
    mieux_dormir: { label: "Mieux dormir", emoji: "😴" },
    comprendre_cycle: { label: "Comprendre mon cycle", emoji: "🩸" },
    reduire_stress: { label: "Réduire le stress", emoji: "🧘" },
    sport: { label: "Optimiser mon sport", emoji: "🏃‍♀️" },
    hormones: { label: "Gérer mes hormones", emoji: "🔬" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: T.dark, paddingTop: 8 }}>
        Mon profil 🌿
      </div>

      <Card style={{ textAlign: "center", background: `linear-gradient(135deg, ${T.bg2} 0%, ${T.white} 100%)` }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${T.terra} 0%, ${T.terraLight} 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, margin: "0 auto 12px", boxShadow: `0 4px 16px ${T.terra}40`,
        }}>
          🌸
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: T.dark }}>{health.profile.name}</div>
        <div style={{ fontSize: 13, color: T.mid }}>{health.profile.age} ans · Profil hormonal : {health.profile.hormonal_profile}</div>
      </Card>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.mid, marginBottom: 12 }}>MES OBJECTIFS</div>
        {health.profile.goals.map((g) => {
          const goal = goals[g];
          return goal ? (
            <div key={g} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
              borderBottom: `1px solid ${T.border}`,
            }}>
              <span style={{ fontSize: 20 }}>{goal.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: T.dark }}>{goal.label}</span>
              <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: T.sage }} />
            </div>
          ) : null;
        })}
      </Card>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.mid, marginBottom: 12 }}>DONNÉES CONNECTÉES</div>
        {[
          { name: "Oura Ring", type: "Sommeil · HRV · Récupération", connected: true, icon: "💍" },
          { name: "Apple Health", type: "Cycle · Activité", connected: true, icon: "🍎" },
          { name: "Google Fit", type: "Android", connected: false, icon: "🤖" },
        ].map((s) => (
          <div key={s.name} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
            borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.dark }}>{s.name}</div>
              <div style={{ fontSize: 11, color: T.light }}>{s.type}</div>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10,
              background: s.connected ? `${T.sage}20` : `${T.light}20`,
              color: s.connected ? T.sageDark : T.light,
            }}>
              {s.connected ? "Connecté" : "Non connecté"}
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ fontSize: 12, color: T.light, textAlign: "center", lineHeight: 1.6 }}>
          🔒 Tes données restent sur ton appareil. Afiya ne vend ni ne partage aucune donnée personnelle.
        </div>
      </Card>
    </div>
  );
}

// ─── APP ────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("home");
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState(null);
  const health = mockHealthData;

  useEffect(() => {
    fetchAfiyaAdvice(health).then((a) => {
      setAdvice(a);
      setLoading(false);
    });
  }, []);

  const handleQuestion = async (q) => {
    setLoading(true);
    const a = await fetchAfiyaAdvice(health, q);
    setAdvice(a);
    setLoading(false);
    setScreen("home");
  };

  const navItems = [
    { key: "home", icon: "🌿", label: "Accueil" },
    { key: "cycle", icon: "🩸", label: "Cycle" },
    { key: "sleep", icon: "😴", label: "Sommeil" },
    { key: "profile", icon: "👤", label: "Profil" },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F0EDE6; font-family: 'DM Sans', sans-serif; }
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        ::-webkit-scrollbar { display: none; }
        input:focus { border-color: #C4704F !important; box-shadow: 0 0 0 3px rgba(196,112,79,0.15); }
        button:active { transform: scale(0.97); }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div style={{
        maxWidth: 430, margin: "0 auto", minHeight: "100vh",
        background: T.bg, display: "flex", flexDirection: "column",
        boxShadow: "0 0 60px rgba(0,0,0,0.12)",
      }}>
        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px" }}>
          {screen === "home" && <HomeScreen health={health} advice={advice} loading={loading} mood={mood} setMood={setMood} onAskQuestion={handleQuestion} />}
          {screen === "cycle" && <CycleScreen health={health} />}
          {screen === "sleep" && <SleepScreen health={health} />}
          {screen === "profile" && <ProfileScreen health={health} />}
        </div>

        {/* Bottom Nav */}
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430,
          background: "rgba(250,249,246,0.95)", backdropFilter: "blur(16px)",
          borderTop: `1px solid ${T.border}`,
          display: "flex", padding: "8px 8px 16px",
        }}>
          {navItems.map((n) => (
            <button key={n.key} onClick={() => setScreen(n.key)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                background: "none", border: "none", cursor: "pointer", padding: "6px 4px",
                transition: "all 0.2s",
              }}>
              <div style={{
                fontSize: 22,
                filter: screen === n.key ? "none" : "grayscale(80%) opacity(0.5)",
                transform: screen === n.key ? "scale(1.15)" : "scale(1)",
                transition: "all 0.2s",
              }}>{n.icon}</div>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: screen === n.key ? T.terra : T.light,
                transition: "color 0.2s",
              }}>{n.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
