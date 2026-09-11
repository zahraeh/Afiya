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
    ? `- Stress: ${healthData.stress.day_summary || 'n/a'}, ${healthData.stress.stress_high_minutes}min high stress, ${healthData.stress.recovery_high_minutes}min high recovery`
    : '';
  const spo2Line = healthData.spo2
    ? `- SpO2 : ${healthData.spo2.average?.toFixed(1)}% moy, ${healthData.spo2.minimum?.toFixed(1)}% min`
    : '';
  const tempLine = healthData.temperature?.deviation != null
    ? `- Basal temperature: ${healthData.temperature.deviation >= 0 ? '+' : ''}${healthData.temperature.deviation?.toFixed(2)}°C (trend ${healthData.temperature.trend_deviation >= 0 ? '+' : ''}${healthData.temperature.trend_deviation?.toFixed(2)}°C)`
    : '';
  const workoutsLine = healthData.workouts?.length > 0
    ? `- Recent workouts: ${healthData.workouts.slice(0, 3).map((w) => `${w.activity} ${Math.round(w.duration / 60)}min (${w.intensity})`).join(', ')}`
    : '';

  const systemPrompt = `You are Afiya, a daily wellness coach specializing in women's and cycle-aware health.
Speak in English with a kind, warm, non-judgmental, adult tone.
Generate ONE personalized recommendation based on the user's real data.

Rules:
- One main recommendation (2-3 sentences maximum)
- Always connect the recommendation to the real data
- Never use medical jargon or make a diagnosis
- End with one concrete action (under 15 words)

Données aujourd'hui :
- Name: ${healthData.profile.name}
- Phase: ${phase.label} (Day ${healthData.cycle.day}/${healthData.cycle.cycleLength})
- Sleep: ${sleepH}h, efficiency ${healthData.sleep.efficiency}%, HRV ${healthData.sleep.average_hrv}ms
- Resting heart rate: ${healthData.sleep.average_heart_rate}bpm
- Oura readiness: ${healthData.sleep.readiness_score}/100
- Steps: ${healthData.activity.steps}, active calories: ${healthData.activity.active_calories}
${stressLine}
${spo2Line}
${tempLine}
${workoutsLine}
- Goals: ${(healthData.profile.goals || []).join(', ')}
- Hormonal profile: ${healthData.profile.hormonal_profile || 'standard'}

Respond ONLY with valid JSON, without backticks:
{"greeting":"Good morning ${healthData.profile.name} 🌿","insight":"one-sentence observation","conseil":"main recommendation in 2-3 sentences","action":"concrete action under 15 words","category":"sleep|cycle|sport|mood|nutrition","phase_tip":"one-sentence cycle phase tip","energy_level":"low|medium|high","mood_prediction":"one short mood prediction"}`;

  const userContent = userMessage
    ? `Question: "${userMessage}". Adapt the JSON recommendation to this question.`
    : "Generate today's advice.";

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
    greeting: `Good morning ${healthData.profile.name} 🌿`,
    insight: 'Your sleep data has been analyzed.',
    conseil: `During the ${phase.label.toLowerCase()} phase, your body benefits from a gentle pace. Your readiness score of ${healthData.sleep.readiness_score}/100 can guide your day.`,
    action: 'Take 5 minutes this morning to plan your day.',
    category: 'cycle',
    phase_tip: `${phase.emoji} ${phase.label}: ${phase.days}.`,
    energy_level: 'medium',
    mood_prediction: 'Stable energy and a positive mood are expected.',
  };
}
