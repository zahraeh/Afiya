const OURA_BASE = 'https://api.ouraring.com/v2/usercollection';

function getDateRange(days = 30) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

async function fetchOura(endpoint, token, params = {}) {
  const url = new URL(`${OURA_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Oura API error on ${endpoint}: ${response.status}`);
  }
  return response.json();
}

// Some endpoints require Gen3 ring — fail gracefully
async function tryFetchOura(endpoint, token, params = {}) {
  try {
    return await fetchOura(endpoint, token, params);
  } catch {
    return null;
  }
}

// Keep only the main sleep session per day (long_sleep preferred, else longest)
function parseSleepData(data) {
  const byDay = {};
  (data.data || []).forEach((s) => {
    const existing = byDay[s.day];
    if (!existing) {
      byDay[s.day] = s;
    } else {
      const existingIsLong = existing.type === 'long_sleep';
      const newIsLong = s.type === 'long_sleep';
      if (newIsLong && !existingIsLong) {
        byDay[s.day] = s;
      } else if (newIsLong === existingIsLong) {
        if ((s.total_sleep_duration || 0) > (existing.total_sleep_duration || 0)) {
          byDay[s.day] = s;
        }
      }
    }
  });
  return Object.values(byDay).sort((a, b) => b.day.localeCompare(a.day));
}

export async function loadOuraData(token) {
  const { start, end } = getDateRange(30);

  const [
    sleepRaw, readinessRaw, activityRaw, dailySleepRaw,
    stressRaw, spo2Raw, tempRaw, workoutRaw,
  ] = await Promise.all([
    fetchOura('sleep', token, { start_date: start, end_date: end }),
    fetchOura('daily_readiness', token, { start_date: start, end_date: end }),
    fetchOura('daily_activity', token, { start_date: start, end_date: end }),
    fetchOura('daily_sleep', token, { start_date: start, end_date: end }),
    tryFetchOura('daily_stress', token, { start_date: start, end_date: end }),
    tryFetchOura('daily_spo2', token, { start_date: start, end_date: end }),
    tryFetchOura('daily_temperature', token, { start_date: start, end_date: end }),
    tryFetchOura('workout', token, { start_date: start, end_date: end }),
  ]);

  const sleepSessions = parseSleepData(sleepRaw);
  const latest = sleepSessions[0] || {};

  const readinessByDay = {};
  (readinessRaw.data || []).forEach((r) => { readinessByDay[r.day] = r; });

  const activitySorted = (activityRaw.data || []).sort((a, b) => b.day.localeCompare(a.day));
  const activity = activitySorted[0] || {};

  const dailySleepByDay = {};
  (dailySleepRaw.data || []).forEach((d) => { dailySleepByDay[d.day] = d; });

  const readiness = readinessByDay[latest.day]
    || Object.values(readinessByDay).sort((a, b) => b.day.localeCompare(a.day))[0]
    || {};

  // Stress — latest day
  const latestStress = (stressRaw?.data || []).sort((a, b) => b.day.localeCompare(a.day))[0] || null;

  // SpO2 — latest day
  const latestSpo2 = (spo2Raw?.data || []).sort((a, b) => b.day.localeCompare(a.day))[0] || null;

  // Temperature — latest day
  const latestTemp = (tempRaw?.data || []).sort((a, b) => b.day.localeCompare(a.day))[0] || null;

  // Workouts — last 7 days
  const workouts = (workoutRaw?.data || [])
    .sort((a, b) => b.day.localeCompare(a.day))
    .slice(0, 7)
    .map((w) => ({
      day: w.day,
      activity: w.activity,
      duration: w.duration || 0,
      calories: w.calories || 0,
      distance: w.distance || 0,
      intensity: w.intensity || 'moderate',
    }));

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
      last_night: latest.day || new Date().toISOString().split('T')[0],
      sleep_score: dailySleepByDay[latest.day]?.score || 0,
    },
    sleepHistory: sleepSessions.slice(0, 7).map((s) => ({
      day: s.day,
      hours: s.total_sleep_duration ? +(s.total_sleep_duration / 3600).toFixed(1) : 0,
      efficiency: s.efficiency || 0,
      hrv: s.average_hrv || 0,
      deep: s.deep_sleep_duration ? +(s.deep_sleep_duration / 3600).toFixed(1) : 0,
      rem: s.rem_sleep_duration ? +(s.rem_sleep_duration / 3600).toFixed(1) : 0,
      readiness: readinessByDay[s.day]?.score || 0,
      sleep_score: dailySleepByDay[s.day]?.score || 0,
    })).reverse(),
    activity: {
      steps: activity.steps || 0,
      active_calories: activity.active_calories || 0,
      score: activity.score || 0,
      training_load: activity.score > 70 ? 'high' : activity.score > 40 ? 'moderate' : 'low',
    },
    stress: latestStress ? {
      day_summary: latestStress.day_summary || null,
      stress_high_minutes: Math.round((latestStress.stress_high || 0) / 60),
      recovery_high_minutes: Math.round((latestStress.recovery_high || 0) / 60),
    } : null,
    spo2: latestSpo2?.spo2_percentage ? {
      average: latestSpo2.spo2_percentage.average || 0,
      minimum: latestSpo2.spo2_percentage.minimum || 0,
    } : null,
    temperature: latestTemp ? {
      deviation: latestTemp.temperature_deviation ?? null,
      trend_deviation: latestTemp.temperature_trend_deviation ?? null,
    } : null,
    workouts,
  };
}

export async function validateToken(token) {
  try {
    const { start, end } = getDateRange(7);
    await fetchOura('daily_readiness', token, { start_date: start, end_date: end });
    return true;
  } catch {
    return false;
  }
}
