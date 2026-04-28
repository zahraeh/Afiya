import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { T } from '../constants/theme';
import { SecureStorage, KEYS } from '../services/storage';
import { loadOuraData } from '../services/oura';

const STRESS_LABELS = {
  restored: 'Reposée',
  normal: 'Normal',
  stressful: 'Stressant',
  very_stressful: 'Très stressant',
};

const STRESS_COLORS = {
  restored: { bg: '#F0F5F1', text: '#7A9E7E' },
  normal: { bg: '#F5F5F5', text: '#888' },
  stressful: { bg: '#FDF6ED', text: '#F5A623' },
  very_stressful: { bg: '#FDF0F0', text: '#E05C5C' },
};

const WORKOUT_ICONS = {
  running: '🏃', cycling: '🚴', swimming: '🏊', walking: '🚶',
  yoga: '🧘', strength_training: '🏋️', hiit: '⚡', pilates: '🤸',
  dancing: '💃', hiking: '🥾',
};

function SleepBar({ hours, maxHours = 10 }) {
  const pct = Math.min(hours / maxHours, 1);
  const color = hours >= 7 ? T.sage : hours >= 6 ? T.gold : T.red;
  return (
    <View style={bar.wrap}>
      <View style={[bar.fill, { height: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const bar = StyleSheet.create({
  wrap: { width: 28, height: 80, backgroundColor: T.bg2, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  fill: { borderRadius: 6 },
});

function ReadinessRing({ score }) {
  const color = score >= 70 ? T.sage : score >= 50 ? T.gold : T.red;
  const label = score >= 70 ? 'Optimal' : score >= 50 ? 'Correct' : 'Repos conseillé';
  return (
    <View style={ring.wrap}>
      <View style={[ring.circle, { borderColor: color }]}>
        <Text style={[ring.score, { color }]}>{score}</Text>
        <Text style={ring.max}>/100</Text>
      </View>
      <Text style={[ring.label, { color }]}>{label}</Text>
    </View>
  );
}

const ring = StyleSheet.create({
  wrap: { alignItems: 'center' },
  circle: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 28, fontWeight: '800' },
  max: { fontSize: 11, color: T.mid },
  label: { marginTop: 8, fontSize: 13, fontWeight: '600' },
});

function MetricRow({ icon, label, value, sub }) {
  return (
    <View style={metric.row}>
      <Text style={metric.icon}>{icon}</Text>
      <View style={metric.info}>
        <Text style={metric.label}>{label}</Text>
        {sub && <Text style={metric.sub}>{sub}</Text>}
      </View>
      <Text style={metric.value}>{value}</Text>
    </View>
  );
}

const metric = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border },
  icon: { fontSize: 22, width: 36 },
  info: { flex: 1 },
  label: { fontSize: 14, color: T.dark, fontWeight: '500' },
  sub: { fontSize: 12, color: T.mid, marginTop: 2 },
  value: { fontSize: 15, fontWeight: '700', color: T.dark },
});

export default function SleepScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await SecureStorage.get(KEYS.OURA_TOKEN);
      if (!token) { setError('no_token'); return; }
      const oura = await loadOuraData(token);
      setData(oura);
    } catch {
      setError('fetch_error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={T.terra} />
    </View>
  );

  if (error) return (
    <View style={s.center}>
      <Text style={s.errorEmoji}>{error === 'no_token' ? '🔑' : '📡'}</Text>
      <Text style={s.errorTitle}>{error === 'no_token' ? 'Token Oura manquant' : 'Erreur de connexion'}</Text>
      <Text style={s.errorText}>{error === 'no_token' ? 'Ajoute ton token dans Profil.' : 'Vérifie ta connexion.'}</Text>
      {error !== 'no_token' && (
        <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }}>
          <Text style={s.retryText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const { sleep, sleepHistory, stress, spo2, temperature, workouts } = data;
  const sleepH = (sleep.total_sleep_duration / 3600).toFixed(1);
  const deepH = (sleep.deep_sleep_duration / 3600).toFixed(1);
  const remH = (sleep.rem_sleep_duration / 3600).toFixed(1);
  const latencyMin = Math.round(sleep.latency / 60);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.terra} />}
      >
        <Text style={s.title}>Sommeil</Text>
        <Text style={s.sub}>Dernière nuit · {sleep.last_night}</Text>

        {/* Readiness + main stat */}
        <View style={s.heroRow}>
          <ReadinessRing score={sleep.readiness_score} />
          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <Text style={s.heroValue}>{sleepH}h</Text>
              <Text style={s.heroLabel}>Durée totale</Text>
            </View>
            <View style={s.heroStat}>
              <Text style={s.heroValue}>{sleep.efficiency}%</Text>
              <Text style={s.heroLabel}>Efficacité</Text>
            </View>
          </View>
        </View>

        {/* 7-day history chart */}
        {sleepHistory.length > 0 && (
          <View style={[s.card, T.shadow.sm]}>
            <Text style={s.cardTitle}>7 dernières nuits</Text>
            <View style={s.chartRow}>
              {sleepHistory.map((d) => (
                <View key={d.day} style={s.chartCol}>
                  <Text style={s.chartVal}>{d.hours}h</Text>
                  <SleepBar hours={d.hours} />
                  <Text style={s.chartDay}>{d.day.slice(5)}</Text>
                </View>
              ))}
            </View>
            <View style={s.legend}>
              <View style={s.legendItem}><View style={[s.dot, { backgroundColor: T.sage }]} /><Text style={s.legendText}>≥ 7h</Text></View>
              <View style={s.legendItem}><View style={[s.dot, { backgroundColor: T.gold }]} /><Text style={s.legendText}>6–7h</Text></View>
              <View style={s.legendItem}><View style={[s.dot, { backgroundColor: T.red }]} /><Text style={s.legendText}>{'< 6h'}</Text></View>
            </View>
          </View>
        )}

        {/* Detailed metrics */}
        <View style={[s.card, T.shadow.sm]}>
          <Text style={s.cardTitle}>Détails de la nuit</Text>
          <MetricRow icon="🌊" label="Sommeil profond" sub="Récupération physique" value={`${deepH}h`} />
          <MetricRow icon="💭" label="Sommeil REM" sub="Récupération mentale" value={`${remH}h`} />
          <MetricRow icon="❤️" label="HRV moyen" sub="Variabilité cardiaque" value={`${sleep.average_hrv} ms`} />
          <MetricRow icon="💓" label="FC repos" sub="Fréquence cardiaque" value={`${sleep.average_heart_rate} bpm`} />
          <MetricRow icon="⏱️" label="Latence" sub="Temps pour s'endormir" value={`${latencyMin} min`} />
          {spo2 && (
            <MetricRow icon="🫁" label="SpO2 moyen" sub="Saturation en oxygène" value={`${spo2.average?.toFixed(1)}%`} />
          )}
          {temperature?.deviation != null && (
            <MetricRow
              icon="🌡️"
              label="Température basale"
              sub="Déviation par rapport à la normale"
              value={`${temperature.deviation >= 0 ? '+' : ''}${temperature.deviation?.toFixed(2)}°C`}
            />
          )}
        </View>

        {/* Readiness contributors */}
        {Object.keys(sleep.readiness_contributors).length > 0 && (
          <View style={[s.card, T.shadow.sm]}>
            <Text style={s.cardTitle}>Facteurs de récupération</Text>
            {Object.entries(sleep.readiness_contributors).map(([key, val]) => {
              if (typeof val !== 'number') return null;
              const label = key.replace(/_/g, ' ');
              const color = val >= 70 ? T.sage : val >= 50 ? T.gold : T.red;
              return (
                <View key={key} style={s.contributorRow}>
                  <Text style={s.contributorLabel}>{label}</Text>
                  <View style={s.contributorBarWrap}>
                    <View style={[s.contributorBar, { width: `${val}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={[s.contributorVal, { color }]}>{val}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Stress */}
        {stress && (
          <View style={[s.card, T.shadow.sm]}>
            <Text style={s.cardTitle}>Stress & récupération</Text>
            <View style={s.stressRow}>
              <View style={s.stressStat}>
                <Text style={s.stressValue}>{stress.stress_high_minutes}<Text style={s.stressUnit}> min</Text></Text>
                <Text style={s.stressLabel}>Stress élevé</Text>
              </View>
              <View style={s.stressDivider} />
              <View style={s.stressStat}>
                <Text style={[s.stressValue, { color: T.sage }]}>{stress.recovery_high_minutes}<Text style={s.stressUnit}> min</Text></Text>
                <Text style={s.stressLabel}>Récupération</Text>
              </View>
              {stress.day_summary && (
                <>
                  <View style={s.stressDivider} />
                  <View style={s.stressStat}>
                    <Text style={[s.stressBadge, { backgroundColor: STRESS_COLORS[stress.day_summary]?.bg || T.bg2, color: STRESS_COLORS[stress.day_summary]?.text || T.mid }]}>
                      {STRESS_LABELS[stress.day_summary] || stress.day_summary}
                    </Text>
                    <Text style={s.stressLabel}>Journée</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Workouts */}
        {workouts?.length > 0 && (
          <View style={[s.card, T.shadow.sm]}>
            <Text style={s.cardTitle}>Activité physique récente</Text>
            {workouts.map((w, i) => (
              <View key={i} style={s.workoutRow}>
                <Text style={s.workoutIcon}>{WORKOUT_ICONS[w.activity] || '🏃'}</Text>
                <View style={s.workoutInfo}>
                  <Text style={s.workoutName}>{w.activity?.replace(/_/g, ' ')}</Text>
                  <Text style={s.workoutSub}>{w.day} · {w.intensity}</Text>
                </View>
                <View style={s.workoutStats}>
                  <Text style={s.workoutDuration}>{Math.round(w.duration / 60)} min</Text>
                  {w.calories > 0 && <Text style={s.workoutCal}>{w.calories} kcal</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: T.bg },
  errorEmoji: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: T.dark, marginBottom: 8 },
  errorText: { fontSize: 14, color: T.mid, textAlign: 'center' },
  retryBtn: { marginTop: 20, backgroundColor: T.terra, paddingHorizontal: 24, paddingVertical: 12, borderRadius: T.radius.md },
  retryText: { color: T.white, fontWeight: '600' },

  title: { fontSize: 28, fontWeight: '800', color: T.dark, marginBottom: 4 },
  sub: { fontSize: 13, color: T.mid, marginBottom: 20 },

  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 20 },
  heroStats: { flex: 1, gap: 12 },
  heroStat: {},
  heroValue: { fontSize: 28, fontWeight: '800', color: T.dark },
  heroLabel: { fontSize: 12, color: T.mid, marginTop: 2 },

  card: { backgroundColor: T.white, borderRadius: T.radius.lg, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: T.dark, marginBottom: 14 },

  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  chartCol: { alignItems: 'center', gap: 4 },
  chartVal: { fontSize: 10, color: T.mid },
  chartDay: { fontSize: 10, color: T.mid },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: T.mid },

  contributorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  contributorLabel: { width: 130, fontSize: 12, color: T.mid, textTransform: 'capitalize' },
  contributorBarWrap: { flex: 1, height: 6, backgroundColor: T.bg2, borderRadius: 3, overflow: 'hidden' },
  contributorBar: { height: 6, borderRadius: 3 },
  contributorVal: { width: 28, fontSize: 12, fontWeight: '700', textAlign: 'right' },

  stressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  stressStat: { alignItems: 'center', flex: 1 },
  stressDivider: { width: 1, height: 40, backgroundColor: T.border },
  stressValue: { fontSize: 22, fontWeight: '800', color: T.red },
  stressUnit: { fontSize: 13, fontWeight: '400', color: T.mid },
  stressLabel: { fontSize: 11, color: T.mid, marginTop: 4 },
  stressBadge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  workoutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border },
  workoutIcon: { fontSize: 24, width: 36 },
  workoutInfo: { flex: 1 },
  workoutName: { fontSize: 14, fontWeight: '600', color: T.dark, textTransform: 'capitalize' },
  workoutSub: { fontSize: 12, color: T.mid, marginTop: 2 },
  workoutStats: { alignItems: 'flex-end' },
  workoutDuration: { fontSize: 14, fontWeight: '700', color: T.dark },
  workoutCal: { fontSize: 11, color: T.mid, marginTop: 2 },
});
