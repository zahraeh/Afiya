function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

const sleepHistory = [-6, -5, -4, -3, -2, -1, 0].map((offset, index) => ({
  day: dateOffset(offset),
  hours: [7.2, 6.8, 7.6, 7.1, 6.5, 7.8, 7.4][index],
  efficiency: [89, 86, 92, 88, 83, 94, 91][index],
  hrv: [48, 44, 53, 47, 39, 56, 51][index],
  deep: [1.6, 1.4, 1.8, 1.5, 1.2, 1.9, 1.7][index],
  rem: [1.8, 1.6, 2.0, 1.7, 1.5, 2.1, 1.9][index],
  readiness: [78, 72, 84, 76, 64, 89, 82][index],
  sleep_score: [82, 76, 88, 81, 70, 92, 86][index],
}));

const ouraData = {
  sleep: {
    total_sleep_duration: 26640,
    efficiency: 91,
    average_hrv: 51,
    average_heart_rate: 58,
    latency: 780,
    deep_sleep_duration: 6120,
    rem_sleep_duration: 6840,
    readiness_score: 82,
    readiness_contributors: { sleep_balance: 86, recovery_index: 79, temperature: 91, previous_day_activity: 76 },
    last_night: dateOffset(0),
    sleep_score: 86,
  },
  sleepHistory,
  activity: { steps: 6840, active_calories: 428, score: 76, training_load: 'moderate' },
  stress: { day_summary: 'normal', stress_high_minutes: 42, recovery_high_minutes: 128 },
  spo2: { average: 97.4, minimum: 95.8 },
  temperature: { deviation: 0.08, trend_deviation: 0.04 },
  workouts: [
    { day: dateOffset(-1), activity: 'yoga', duration: 2700, calories: 180, intensity: 'easy' },
    { day: dateOffset(-3), activity: 'walking', duration: 3300, calories: 245, intensity: 'moderate' },
  ],
};

const cycleData = {
  lastPeriodStart: dateOffset(-10),
  cycleLength: 28,
  logs: {},
};

const profile = {
  name: 'Camille',
  goals: ['Energy', 'Sleep'],
  hormonal_profile: 'Standard',
};

export function getDemoData() {
  const cycle = {
    day: 11,
    phase: 'follicular',
    cycleLength: 28,
    nextPeriod: dateOffset(18),
  };

  return {
    ouraData,
    cycleData,
    healthData: { ...ouraData, cycle, profile },
    advice: {
      greeting: 'Good morning Camille 🌿',
      insight: 'Your recovery is strong after a consistent night of sleep.',
      conseil: 'Your energy is trending well today. Use this follicular phase to make progress on an activity that gives you momentum, without trying to optimize everything.',
      action: 'Plan an activity that makes you feel good.',
      category: 'cycle',
      phase_tip: 'Follicular phase: your energy is gradually rising.',
      energy_level: 'high',
      mood_prediction: 'A curious and energetic mood is likely.',
    },
  };
}

export function getDemoAnswer(question, healthData) {
  const normalizedQuestion = question.toLowerCase();
  const sleepHours = (healthData.sleep.total_sleep_duration / 3600).toFixed(1);
  const readiness = healthData.sleep.readiness_score;
  const phase = healthData.cycle.phase;

  if (normalizedQuestion.includes('workout') || normalizedQuestion.includes('exercise') || normalizedQuestion.includes('sport')) {
    return {
      greeting: 'Here is your movement check 🌿',
      insight: `Your readiness is ${readiness}/100, so your body looks ready for movement today.`,
      conseil: 'Choose an activity that feels energizing rather than exhausting. A walk, yoga session, or moderate workout would all fit well with your current energy.',
      action: 'Take a 20-minute walk or do a gentle workout.',
      category: 'sport',
      phase_tip: `You are in your ${phase} phase, so notice how your energy changes while you move.`,
      energy_level: readiness >= 70 ? 'high' : 'medium',
      mood_prediction: 'Movement may help you feel clearer and more grounded.',
    };
  }

  if (normalizedQuestion.includes('sleep') || normalizedQuestion.includes('tired') || normalizedQuestion.includes('rest')) {
    return {
      greeting: 'Let us look at your recovery 🌙',
      insight: `You slept ${sleepHours} hours with a readiness score of ${readiness}/100.`,
      conseil: readiness >= 70
        ? 'Your recovery looks solid today. Keep your evening routine steady so you can protect this momentum.'
        : 'Your recovery could use extra care today. Keep the day lighter and give yourself an earlier wind-down tonight.',
      action: 'Keep your evening calm and protect your bedtime.',
      category: 'sleep',
      phase_tip: 'Small, consistent routines are especially useful when your energy is changing.',
      energy_level: readiness >= 70 ? 'high' : 'medium',
      mood_prediction: 'A calmer pace can support steadier focus today.',
    };
  }

  return {
    greeting: 'Afiya has a thought for you ✨',
    insight: `Your ${phase} phase and ${readiness}/100 readiness suggest a balanced day.`,
    conseil: 'Start with one priority and leave room to adjust based on how you feel. Your body signals are useful information, not a performance score.',
    action: 'Choose one supportive thing to do for yourself today.',
    category: 'mood',
    phase_tip: `In the ${phase} phase, check in with your energy before adding more to your day.`,
    energy_level: readiness >= 70 ? 'high' : 'medium',
    mood_prediction: 'A flexible plan can help you feel more at ease today.',
  };
}