import { T } from '../constants/theme';

export function computeCyclePhase(lastPeriodStart, cycleLength = 28) {
  const start = new Date(lastPeriodStart);
  const today = new Date();
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const day = (diff % cycleLength) + 1;

  let phase = 'luteal';
  if (day <= 5) phase = 'menstrual';
  else if (day <= 13) phase = 'follicular';
  else if (day <= 16) phase = 'ovulation';

  const next = new Date(start);
  next.setDate(start.getDate() + cycleLength * Math.ceil((diff + 1) / cycleLength));

  return {
    day,
    phase,
    cycleLength,
    nextPeriod: next.toISOString().split('T')[0],
  };
}

export async function fetchAfiyaAdvice(apiKey, healthData, userMessage = null) {
  const phase = T.phases[healthData.cycle.phase];
  const sleepH = (healthData.sleep.total_sleep_duration / 3600).toFixed(1);

  const stressLine = healthData.stress
    ? `- Stress : ${healthData.stress.day_summary || 'n/a'}, ${healthData.stress.stress_high_minutes}min stress élevé, ${healthData.stress.recovery_high_minutes}min récupération élevée`
    : '';
  const spo2Line = healthData.spo2
    ? `- SpO2 : ${healthData.spo2.average?.toFixed(1)}% moy, ${healthData.spo2.minimum?.toFixed(1)}% min`
    : '';
  const tempLine = healthData.temperature?.deviation != null
    ? `- Température basale : ${healthData.temperature.deviation >= 0 ? '+' : ''}${healthData.temperature.deviation?.toFixed(2)}°C (tendance ${healthData.temperature.trend_deviation >= 0 ? '+' : ''}${healthData.temperature.trend_deviation?.toFixed(2)}°C)`
    : '';
  const workoutsLine = healthData.workouts?.length > 0
    ? `- Entraînements récents : ${healthData.workouts.slice(0, 3).map((w) => `${w.activity} ${Math.round(w.duration / 60)}min (${w.intensity})`).join(', ')}`
    : '';

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
- Phase : ${phase.label} (Jour ${healthData.cycle.day}/${healthData.cycle.cycleLength})
- Sommeil : ${sleepH}h, efficacité ${healthData.sleep.efficiency}%, HRV ${healthData.sleep.average_hrv}ms
- FC repos : ${healthData.sleep.average_heart_rate}bpm
- Récupération Oura : ${healthData.sleep.readiness_score}/100
- Pas : ${healthData.activity.steps}, Cal actives : ${healthData.activity.active_calories}
${stressLine}
${spo2Line}
${tempLine}
${workoutsLine}
- Objectifs : ${(healthData.profile.goals || []).join(', ')}
- Profil hormonal : ${healthData.profile.hormonal_profile || 'standard'}

Réponds UNIQUEMENT en JSON valide sans backticks :
{"greeting":"Bonjour ${healthData.profile.name} 🌿","insight":"obs courte 1 phrase","conseil":"conseil principal 2-3 phrases","action":"action concrète < 15 mots","category":"sommeil|cycle|sport|humeur|nutrition","phase_tip":"conseil phase cycle 1 phrase","energy_level":"low|medium|high","mood_prediction":"prédiction humeur 1 phrase courte"}`;

  const userContent = userMessage
    ? `Question : "${userMessage}". Adapte le conseil JSON à cette question.`
    : 'Génère le conseil du jour.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    const data = await response.json();
    const text = (data.content || []).map((i) => i.text || '').join('').replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return fallbackAdvice(healthData);
  }
}

function fallbackAdvice(healthData) {
  const phase = T.phases[healthData.cycle.phase];
  return {
    greeting: `Bonjour ${healthData.profile.name} 🌿`,
    insight: 'Tes données de cette nuit sont analysées.',
    conseil: `En phase ${phase.label}, ton corps a besoin de douceur. Ton score de récupération de ${healthData.sleep.readiness_score}/100 indique comment orienter ta journée.`,
    action: 'Prends 5 min ce matin pour planifier ta journée.',
    category: 'cycle',
    phase_tip: `${phase.emoji} ${phase.label} : ${phase.days}.`,
    energy_level: 'medium',
    mood_prediction: 'Énergie stable et humeur positive prévues.',
  };
}
