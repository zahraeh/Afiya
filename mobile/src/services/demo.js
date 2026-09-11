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
  goals: ['Energie', 'Sommeil'],
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
      greeting: 'Bonjour Camille 🌿',
      insight: 'Ta récupération est solide après une nuit régulière.',
      conseil: 'Ton énergie est bien orientée aujourd’hui. Profite de cette phase folliculaire pour avancer sur une activité qui te donne de l’élan, sans chercher à tout optimiser.',
      action: 'Planifie une activité qui te fait du bien.',
      category: 'cycle',
      phase_tip: 'Phase folliculaire : ton énergie remonte progressivement.',
      energy_level: 'high',
      mood_prediction: 'Une humeur curieuse et dynamique est probable.',
    },
  };
}