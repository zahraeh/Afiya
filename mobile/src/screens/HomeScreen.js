import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { T } from '../constants/theme';
import { Storage, SecureStorage, KEYS } from '../services/storage';
import { loadOuraData } from '../services/oura';
import { fetchAfiyaAdvice, computeCyclePhase } from '../services/claude';
import { getDemoData, getDemoAnswer } from '../services/demo';

const ENERGY_ICONS = { low: '🔋', medium: '⚡', high: '🚀' };
const CATEGORY_ICONS = { sleep: '🌙', cycle: '🌿', sport: '💪', mood: '☀️', nutrition: '🥗' };
const DEMO_QUESTION = 'Can I work out today?';

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

      if (Platform.OS === 'web' && (!ouraToken || !profile)) {
        const demo = getDemoData();
        setHealthData(demo.healthData);
        setAdvice(userMessage ? getDemoAnswer(userMessage, demo.healthData) : demo.advice);
        return;
      }

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

      if (userMessage && !anthropicKey) {
        setAdvice(getDemoAnswer(userMessage, { ...ouraData, cycle: cycleInfo, profile }));
        return;
      }

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

  const handleAsk = async (questionToAsk = question) => {
    const trimmedQuestion = questionToAsk.trim();
    if (!trimmedQuestion) return;

    const answerData = healthData || getDemoData().healthData;
    setAdvice(getDemoAnswer(trimmedQuestion, answerData));
    setQuestion('');
  };

  const saveAdvice = async () => {
    if (!advice) return;
    const saved = (await Storage.get(KEYS.SAVED_ADVICE)) || [];
    saved.unshift({ ...advice, date: new Date().toISOString() });
    await Storage.set(KEYS.SAVED_ADVICE, saved.slice(0, 50));
    Alert.alert('Saved ✓', 'This advice was added to your list.');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={T.terra} />
        <Text style={styles.loadingText}>Afiya is analyzing your data…</Text>
      </View>
    );
  }

  if (error === 'no_token') {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>🔑</Text>
        <Text style={styles.errorTitle}>Oura token missing</Text>
        <Text style={styles.errorText}>Go to Profile to add your Oura token.</Text>
      </View>
    );
  }

  if (error === 'no_profile') {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>👤</Text>
        <Text style={styles.errorTitle}>Incomplete profile</Text>
        <Text style={styles.errorText}>Go to Profile to complete your profile.</Text>
      </View>
    );
  }

  if (error === 'fetch_error') {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>📡</Text>
        <Text style={styles.errorTitle}>Connection error</Text>
        <Text style={styles.errorText}>Check your connection and Oura token.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadData().finally(() => setLoading(false)); }}>
          <Text style={styles.retryText}>Retry</Text>
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
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Good morning</Text>
            <Text style={styles.logo}>Afiya</Text>
          </View>
          <View style={styles.datePill}>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
          </View>
        </View>

        {healthData?.cycle && (
          <LinearGradient
            colors={[phaseInfo.bg, '#FFFDFB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.phaseBadge, T.shadow.sm]}
          >
            <Text style={styles.phaseEmoji}>{phaseInfo.emoji}</Text>
            <View style={styles.phaseCopy}>
              <Text style={[styles.phaseLabel, { color: phaseInfo.color }]}>{phaseInfo.label}</Text>
              <Text style={styles.phaseDay}>Day {healthData.cycle.day} · {phaseInfo.days}</Text>
            </View>
            {healthData.cycle.nextPeriod && (
              <Text style={styles.nextPeriod}>Next period: {healthData.cycle.nextPeriod}</Text>
            )}
          </LinearGradient>
        )}

        {advice ? (
          <View style={[styles.adviceCard, T.shadow.md]}>
            <View style={styles.adviceHeader}>
              <Text style={styles.greeting}>{advice.greeting}</Text>
              <View style={styles.badges}>
                <Text style={styles.badge}>{CATEGORY_ICONS[advice.category]} {advice.category}</Text>
                <Text style={styles.badge}>{ENERGY_ICONS[advice.energy_level]} {advice.energy_level} energy</Text>
              </View>
            </View>
            <Text style={styles.insight}>{advice.insight}</Text>
            <Text style={styles.conseil}>{advice.conseil}</Text>
            <View style={styles.actionBox}>
              <Text style={styles.actionLabel}>Today's action</Text>
              <Text style={styles.actionText}>→ {advice.action}</Text>
            </View>
            {advice.phase_tip && (
              <Text style={styles.phaseTip}>{advice.phase_tip}</Text>
            )}
            <TouchableOpacity style={styles.saveBtn} onPress={saveAdvice}>
              <Text style={styles.saveBtnText}>Save this advice</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.adviceCard, styles.noApiCard, T.shadow.sm]}>
            <Text style={styles.noApiText}>Add your Anthropic key in Profile to receive personalized advice.</Text>
          </View>
        )}

        {healthData && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, T.shadow.sm]}>
              <Text style={styles.statIcon}>🌙</Text>
              <Text style={styles.statValue}>{sleepH}h</Text>
              <Text style={styles.statLabel}>Sleep</Text>
            </View>
            <View style={[styles.statCard, T.shadow.sm]}>
              <Text style={styles.statIcon}>💚</Text>
              <Text style={styles.statValue}>{healthData.sleep.readiness_score}</Text>
              <Text style={styles.statLabel}>Recovery</Text>
            </View>
            <View style={[styles.statCard, T.shadow.sm]}>
              <Text style={styles.statIcon}>👟</Text>
              <Text style={styles.statValue}>{(healthData.activity.steps / 1000).toFixed(1)}k</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
            <View style={[styles.statCard, T.shadow.sm]}>
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={styles.statValue}>{healthData.sleep.average_hrv}</Text>
              <Text style={styles.statLabel}>HRV</Text>
            </View>
          </View>
        )}

        <View style={styles.askSection}>
          <Text style={styles.askTitle}>Ask Afiya a question</Text>
          <TouchableOpacity
            style={styles.demoQuestion}
            onPress={() => handleAsk(DEMO_QUESTION)}
            disabled={askingQuestion}
          >
            <Text style={styles.demoQuestionLabel}>Try a demo question</Text>
            <Text style={styles.demoQuestionText}>{DEMO_QUESTION}</Text>
          </TouchableOpacity>
          <View style={styles.askRow}>
            <TextInput
              style={styles.askInput}
              placeholder="e.g. Can I work out today?"
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
  content: { padding: 20, paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: T.bg },
  emoji: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: T.dark, marginBottom: 8 },
  errorText: { fontSize: 14, color: T.mid, textAlign: 'center', lineHeight: 22 },
  loadingText: { marginTop: 16, color: T.mid, fontSize: 14 },
  retryBtn: { marginTop: 20, backgroundColor: T.terra, paddingHorizontal: 24, paddingVertical: 12, borderRadius: T.radius.md },
  retryText: { color: T.white, fontWeight: '600' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  eyebrow: { fontSize: 12, color: T.mid, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  logo: { fontSize: 28, fontWeight: '800', color: T.dark },
  datePill: { backgroundColor: T.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: T.border },
  date: { fontSize: 12, color: T.mid, fontWeight: '600' },

  phaseBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: T.radius.lg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1E4DA' },
  phaseCopy: { flex: 1 },
  phaseEmoji: { fontSize: 34 },
  phaseLabel: { fontSize: 15, fontWeight: '700' },
  phaseDay: { fontSize: 12, color: T.mid, marginTop: 2 },
  nextPeriod: { marginLeft: 4, fontSize: 11, color: T.mid, maxWidth: 84, textAlign: 'right' },

  adviceCard: { backgroundColor: T.white, borderRadius: T.radius.lg, padding: 20, marginBottom: 16 },
  noApiCard: { alignItems: 'center', paddingVertical: 32 },
  noApiText: { color: T.mid, textAlign: 'center', fontSize: 14, lineHeight: 22 },
  adviceHeader: { marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  badge: { fontSize: 11, color: T.mid, backgroundColor: T.bg2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, overflow: 'hidden' },
  greeting: { fontSize: 22, fontWeight: '700', color: T.dark },
  insight: { fontSize: 13, color: T.terra, fontStyle: 'italic', marginBottom: 10 },
  conseil: { fontSize: 15, color: T.dark, lineHeight: 24, marginBottom: 16 },
  actionBox: { backgroundColor: T.bg2, borderRadius: T.radius.md, padding: 14, marginBottom: 12 },
  actionLabel: { fontSize: 11, color: T.mid, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionText: { fontSize: 14, color: T.dark, fontWeight: '600' },
  phaseTip: { fontSize: 13, color: T.mid, fontStyle: 'italic', marginBottom: 16 },
  saveBtn: { alignItems: 'center', paddingVertical: 11, borderRadius: T.radius.md, borderWidth: 1.5, borderColor: T.terra },
  saveBtnText: { color: T.terra, fontWeight: '600', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: T.white, borderRadius: T.radius.md, padding: 11, alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: T.dark },
  statLabel: { fontSize: 11, color: T.mid, marginTop: 2 },

  askSection: { marginTop: 4 },
  askTitle: { fontSize: 15, fontWeight: '700', color: T.dark, marginBottom: 10 },
  demoQuestion: { backgroundColor: T.peach, borderRadius: T.radius.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F4D8C4' },
  demoQuestionLabel: { fontSize: 11, color: T.terra, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  demoQuestionText: { fontSize: 13, color: T.dark, fontWeight: '600' },
  askRow: { flexDirection: 'row', gap: 8 },
  askInput: { flex: 1, backgroundColor: T.white, borderRadius: T.radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: T.dark, borderWidth: 1.5, borderColor: T.border },
  askBtn: { backgroundColor: T.terra, borderRadius: T.radius.md, paddingHorizontal: 18, justifyContent: 'center' },
  askBtnDisabled: { backgroundColor: T.light },
  askBtnText: { color: T.white, fontSize: 18, fontWeight: '700' },
});
