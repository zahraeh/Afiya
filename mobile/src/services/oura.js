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

// Keep only the main sleep session per day (long_sleep preferred, else longest)
function parseSleepData(data) {
  const byDay = {};
  (data.data || []).forEach((s) => {
    const existing = byDay[s.day];
    if (!existing) {
      byDay[s.day] = s;
    } else {
      // Prefer long_sleep type over others
      const existingIsLong = existing.type === 'long_sleep';
      const newIsLong = s.type === 'long_sleep';
      if (newIsLong && !existingIsLong) {
        byDay[s.day] = s;
      } else if (newIsLong === existingIsLong) {
        // Same type — keep the longer one
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

  const [sleepRaw, readinessRaw, activityRaw, dailySleepRaw] = await Promise.all([
    fetchOura('sleep', token, { start_date: start, end_date: end }),
    fetchOura('daily_readiness', token, { start_date: start, end_date: end }),
    fetchOura('daily_activity', token, { start_date: start, end_date: end }),
    fetchOura('daily_sleep', token, { start_date: start, end_date: end }),
  ]);

  const sleepSessions = parseSleepData(sleepRaw);
  const latest = sleepSessions[0] || {};

  const readinessByDay = {};
  (readinessRaw.data || []).forEach((r) => { readinessByDay[r.day] = r; });

  const activitySorted = (activityRaw.data || []).sort((a, b) => b.day.localeCompare(a.day));
  const activity = activitySorted[0] || {};

  // Build daily sleep score map for the history
  const dailySleepByDay = {};
  (dailySleepRaw.data || []).forEach((d) => { dailySleepByDay[d.day] = d; });

  // Most recent readiness (same day as latest sleep or the day after)
  const readiness = readinessByDay[latest.day]
    || Object.values(readinessByDay).sort((a, b) => b.day.localeCompare(a.day))[0]
    || {};

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
