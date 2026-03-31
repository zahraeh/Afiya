const OURA_BASE = 'https://api.ouraring.com/v2/usercollection';

function getDateRange(days = 14) {
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

function parseSleepData(data) {
  const byDay = {};
  (data.data || []).forEach((s) => {
    if (!byDay[s.day] || s.total_sleep_duration > byDay[s.day].total_sleep_duration) {
      byDay[s.day] = s;
    }
  });
  return Object.values(byDay).sort((a, b) => b.day.localeCompare(a.day));
}

export async function loadOuraData(token) {
  const { start, end } = getDateRange(14);

  const [sleepRaw, readinessRaw, activityRaw] = await Promise.all([
    fetchOura('sleep', token, { start_date: start, end_date: end }),
    fetchOura('daily_readiness', token, { start_date: start, end_date: end }),
    fetchOura('daily_activity', token, { start_date: start, end_date: end }),
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
      last_night: latest.day || new Date().toISOString().split('T')[0],
    },
    sleepHistory: sleepSessions.slice(0, 7).map((s) => ({
      day: s.day,
      hours: +(s.total_sleep_duration / 3600).toFixed(1),
      efficiency: s.efficiency,
      hrv: s.average_hrv,
      deep: +(s.deep_sleep_duration / 3600).toFixed(1),
      rem: +(s.rem_sleep_duration / 3600).toFixed(1),
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
    const { end } = getDateRange(1);
    const start = end;
    await fetchOura('daily_readiness', token, { start_date: start, end_date: end });
    return true;
  } catch {
    return false;
  }
}
