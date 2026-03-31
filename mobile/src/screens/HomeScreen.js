import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { T } from '../constants/theme';
import { Storage, SecureStorage, KEYS } from '../services/storage';
import { loadOuraData } from '../services/oura';
import { fetchAfiyaAdvice, computeCyclePhase } from '../services/claude';

const ENERGY_ICONS = { low: '🔋', medium: '⚡', high: '🚀' };
const CATEGORY_ICONS = { sommeil: '🌙', cycle: '🌿', sport: '💪', humeur: '☀️', nutrition: '🥗' };

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [question, setQuestion] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (userMessage = null) => {
    try {
      setError(null);
      const [ouraToken, anthropicKey, profile, cycleData] = await Promise.all([
        SecureStorage.get(KEYS.OURA_TOKEN),
        SecureStorage.get(KEYS.ANTHROPIC_KEY),
        Storage.get(KEYS.USER_PROFILE),
        Storage.get(KEYS.CYCLE_DATA),
      ]);

      if (!ouraToken) {
        setError('no_token');
        return;
      }
      if (!profile) {
        setError('no_profile');
        return;
      }

      const ouraData = await loadOuraData(ouraToken);

      const cycleInfo = cycleData?.lastPeriodStart
        ? computeCyclePhase(cycleData.lastPeriodStart, cycleData.cycleLength || 28)
        : { day: 1, phase: 'follicular', cycleLength: 28, nextPeriod: null };

      const combined = {
        sleep: ouraData.sleep,
        activity: ouraData.activity,
        cycle: cycleInfo,
        profile,
      };

      setHealthData({ ...ouraData, cycle: cycleInfo });

      if (anthropicKey && !userMessage) {
        const cached = await Storage.get(KEYS.LAST_ADVICE);
        const today = new Date().toISOString().split('T')[0];
        if (cached?.date === today && !userMessage) {
          setAdvice(cached.advice);
          return;
        }
      }

      if (anthropicKey) {
        const result = await fetchAfiyaAdvice(anthropicKey, combined, userMessage);
        setAdvice(result);
        if (!userMessage) {
          await Storage.set(KEYS.LAST_ADVICE, {
            date: new Date().toISOString().split('T')[0],
            advice: result,
          });
        }
      }
    } catch (e) {
      setError('fetch_error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData().finally(() => setLoading(false));
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Storage.remove(KEYS.LAST_ADVICE);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAskingQuestion(true);
    await loadData(question.trim());
    setQuestion('');
    setAskingQuestion(false);
  };

  const saveAdvice = async () => {
    if (!advice) return;
    const saved = (await Storage.get(KEYS.SAVED_ADVICE)) || [];
    saved.unshift({ ...advice, date: new Date().toISOString() });
    await Storage.set(KEYS.SAVED_ADVICE, saved.slice(0, 50));
    Alert.alert('Sauvegardé ✓', 'Ce conseil a été ajouté à ta liste.');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={T.terra} />
        <Text style={styles.loadingText}>Afiya analyse tes données…</Text>
      </View>
    );
  }

  if (error === 'no_token') {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>🔑</Text>
        <Text style={styles.errorTitle}>Token Oura manquant</Text>
        <Text style={styles.errorText}>Va dans Profil pour ajouter ton token Oura.</Text>
      </View>
    );
  }

  if (error === 'no_profile') {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>👤</Text>
        <Text style={styles.errorTitle}>Profil incomplet</Text>
        <Text style={styles.errorText}>Va dans Profil pour compléter ton profil.</Text>
      </View>
    );
  }

  if (error === 'fetch_error') {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>📡</Text>
        <Text style={styles.errorTitle}>Erreur de connexion</Text>
        <Text style={styles.errorText}>Vérifie ta connexion et ton token Oura.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadData().finally(() => setLoading(false)); }}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const phaseInfo = healthData?.cycle?.phase ? T.phases[healthData.cycle.phase] : T.phases.follicular;
  const sleepH = healthData ? (healthData.sleep.total_sleep_duration / 3600).toFixed(1) : '–';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.terra} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🌿 Afiya</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>

        {/* Phase badge */}
        {healthData?.cycle && (
          <View style={[styles.phaseBadge, { backgroundColor: phaseInfo.bg }]}>
            <Text style={styles.phaseEmoji}>{phaseInfo.emoji}</Text>
            <View>
              <Text style={[styles.phaseLabel, { color: phaseInfo.color }]}>{phaseInfo.label}</Text>
              <Text style={styles.phaseDay}>Jour {healthData.cycle.day} · {phaseInfo.days}</Text>
            </View>
            {healthData.cycle.nextPeriod && (
              <Text style={styles.nextPeriod}>Prochaines règles : {healthData.cycle.nextPeriod}</Text>
            )}
          </View>
        )}

        {/* Advice card */}
        {advice ? (
          <View style={[styles.adviceCard, T.shadow.md]}>
            <View style={styles.adviceHeader}>
              <Text style={styles.greeting}>{advice.greeting}</Text>
              <View style={styles.badges}>
                <Text style={styles.badge}>{CATEGORY_ICONS[advice.category]} {advice.category}</Text>
                <Text style={styles.badge}>{ENERGY_ICONS[advice.energy_level]} énergie {advice.energy_level}</Text>
              </View>
            </View>
            <Text style={styles.insight}>{advice.insight}</Text>
            <Text style={styles.conseil}>{advice.conseil}</Text>
            <View style={styles.actionBox}>
              <Text style={styles.actionLabel}>Action du jour</Text>
              <Text style={styles.actionText}>→ {advice.action}</Text>
            </View>
            {advice.phase_tip && (
              <Text style={styles.phaseTip}>{advice.phase_tip}</Text>
            )}
            <TouchableOpacity style={styles.saveBtn} onPress={saveAdvice}>
              <Text style={styles.saveBtnText}>Sauvegarder ce conseil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.adviceCard, styles.noApiCard, T.shadow.sm]}>
            <Text style={styles.noApiText}>Ajoute ta clé Anthropic dans le Profil pour recevoir des conseils personnalisés.</Text>
          </View>
        )}

        {/* Quick stats */}
        {healthData && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, T.shadow.sm]}>
              <Text style={styles.statIcon}>🌙</Text>
              <Text style={styles.statValue}>{sleepH}h</Text>
              <Text style={styles.statLabel}>Sommeil</Text>
            </View>
            <View style={[styles.statCard, T.shadow.sm]}>
              <Text style={styles.statIcon}>💚</Text>
              <Text style={styles.statValue}>{healthData.sleep.readiness_score}</Text>
              <Text style={styles.statLabel}>Récup.</Text>
            </View>
            <View style={[styles.statCard, T.shadow.sm]}>
              <Text style={styles.statIcon}>👟</Text>
              <Text style={styles.statValue}>{(healthData.activity.steps / 1000).toFixed(1)}k</Text>
              <Text style={styles.statLabel}>Pas</Text>
            </View>
            <View style={[styles.statCard, T.shadow.sm]}>
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={styles.statValue}>{healthData.sleep.average_hrv}</Text>
              <Text style={styles.statLabel}>HRV</Text>
            </View>
          </View>
        )}

        {/* Ask Afiya */}
        <View style={styles.askSection}>
          <Text style={styles.askTitle}>Pose une question à Afiya</Text>
          <View style={styles.askRow}>
            <TextInput
              style={styles.askInput}
              placeholder="Ex. : Puis-je faire du sport aujourd'hui ?"
              placeholderTextColor={T.light}
              value={question}
              onChangeText={setQuestion}
              returnKeyType="send"
              onSubmitEditing={handleAsk}
            />
            <TouchableOpacity
              style={[styles.askBtn, (!question.trim() || askingQuestion) && styles.askBtnDisabled]}
              onPress={handleAsk}
              disabled={!question.trim() || askingQuestion}
            >
              {askingQuestion ? (
                <ActivityIndicator size="small" color={T.white} />
              ) : (
                <Text style={styles.askBtnText}>→</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: T.bg },
  emoji: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: T.dark, marginBottom: 8 },
  errorText: { fontSize: 14, color: T.mid, textAlign: 'center', lineHeight: 22 },
  loadingText: { marginTop: 16, color: T.mid, fontSize: 14 },
  retryBtn: { marginTop: 20, backgroundColor: T.terra, paddingHorizontal: 24, paddingVertical: 12, borderRadius: T.radius.md },
  retryText: { color: T.white, fontWeight: '600' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logo: { fontSize: 22, fontWeight: '700', color: T.dark },
  date: { fontSize: 13, color: T.mid, textTransform: 'capitalize' },

  phaseBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: T.radius.lg, padding: 16, marginBottom: 16 },
  phaseEmoji: { fontSize: 28 },
  phaseLabel: { fontSize: 15, fontWeight: '700' },
  phaseDay: { fontSize: 12, color: T.mid, marginTop: 2 },
  nextPeriod: { marginLeft: 'auto', fontSize: 11, color: T.mid },

  adviceCard: { backgroundColor: T.white, borderRadius: T.radius.lg, padding: 20, marginBottom: 16 },
  noApiCard: { alignItems: 'center', paddingVertical: 32 },
  noApiText: { color: T.mid, textAlign: 'center', fontSize: 14, lineHeight: 22 },
  adviceHeader: { marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 6 },
  badge: { fontSize: 11, color: T.mid, backgroundColor: T.bg2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  greeting: { fontSize: 20, fontWeight: '700', color: T.dark },
  insight: { fontSize: 13, color: T.terra, fontStyle: 'italic', marginBottom: 10 },
  conseil: { fontSize: 15, color: T.dark, lineHeight: 24, marginBottom: 16 },
  actionBox: { backgroundColor: T.bg2, borderRadius: T.radius.md, padding: 14, marginBottom: 12 },
  actionLabel: { fontSize: 11, color: T.mid, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionText: { fontSize: 14, color: T.dark, fontWeight: '600' },
  phaseTip: { fontSize: 13, color: T.mid, fontStyle: 'italic', marginBottom: 16 },
  saveBtn: { alignItems: 'center', paddingVertical: 10, borderRadius: T.radius.md, borderWidth: 1.5, borderColor: T.terra },
  saveBtnText: { color: T.terra, fontWeight: '600', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: T.white, borderRadius: T.radius.md, padding: 12, alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: T.dark },
  statLabel: { fontSize: 11, color: T.mid, marginTop: 2 },

  askSection: { marginTop: 4 },
  askTitle: { fontSize: 15, fontWeight: '600', color: T.dark, marginBottom: 10 },
  askRow: { flexDirection: 'row', gap: 8 },
  askInput: { flex: 1, backgroundColor: T.white, borderRadius: T.radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: T.dark, borderWidth: 1.5, borderColor: T.border },
  askBtn: { backgroundColor: T.terra, borderRadius: T.radius.md, paddingHorizontal: 18, justifyContent: 'center' },
  askBtnDisabled: { backgroundColor: T.light },
  askBtnText: { color: T.white, fontSize: 18, fontWeight: '700' },
});
