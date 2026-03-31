import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { T } from '../constants/theme';
import { Storage, KEYS } from '../services/storage';
import { computeCyclePhase } from '../services/claude';

const SYMPTOMS = ['Crampes', 'Ballonnements', 'Fatigue', 'Migraines', 'Humeur variable', 'Acné', 'Sensibilité', 'Insomnies'];
const MOODS = ['😊', '😐', '😔', '😤', '😴', '🤩', '😰', '🥰'];

function PhaseCard({ phase, active }) {
  const info = T.phases[phase];
  return (
    <View style={[pc.card, active && { borderColor: info.color, borderWidth: 2 }, { backgroundColor: active ? info.bg : T.white }]}>
      <Text style={pc.emoji}>{info.emoji}</Text>
      <Text style={[pc.label, { color: active ? info.color : T.mid }]}>{info.label}</Text>
      <Text style={pc.days}>{info.days}</Text>
    </View>
  );
}
const pc = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', padding: 10, borderRadius: T.radius.md, borderWidth: 1, borderColor: T.border },
  emoji: { fontSize: 22, marginBottom: 4 },
  label: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  days: { fontSize: 10, color: T.light, marginTop: 2 },
});

function CalendarStrip({ cycleData }) {
  if (!cycleData?.lastPeriodStart) return null;
  const today = new Date();
  const days = [];
  for (let i = -3; i <= 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const diff = Math.floor((d - new Date(cycleData.lastPeriodStart)) / 86400000);
    const day = (diff % cycleData.cycleLength) + 1;
    let phase = 'luteal';
    if (day <= 5) phase = 'menstrual';
    else if (day <= 13) phase = 'follicular';
    else if (day <= 16) phase = 'ovulation';
    days.push({ date: d, day, phase, isToday: i === 0 });
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cal.strip}>
      {days.map((d, i) => {
        const info = T.phases[d.phase];
        return (
          <View key={i} style={[cal.cell, d.isToday && { borderColor: T.terra, borderWidth: 2 }]}>
            <Text style={cal.dayName}>{d.date.toLocaleDateString('fr-FR', { weekday: 'narrow' })}</Text>
            <View style={[cal.dot, { backgroundColor: info.color }]} />
            <Text style={[cal.dateNum, d.isToday && { color: T.terra, fontWeight: '700' }]}>
              {d.date.getDate()}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
const cal = StyleSheet.create({
  strip: { paddingVertical: 8, paddingHorizontal: 4, gap: 6 },
  cell: { width: 44, alignItems: 'center', paddingVertical: 8, borderRadius: T.radius.md, backgroundColor: T.white, borderWidth: 1, borderColor: T.border },
  dayName: { fontSize: 10, color: T.mid, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  dateNum: { fontSize: 13, color: T.dark },
});

export default function CycleScreen() {
  const [cycleData, setCycleData] = useState(null);
  const [cycleInfo, setCycleInfo] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [lastPeriodInput, setLastPeriodInput] = useState('');
  const [cycleLengthInput, setCycleLengthInput] = useState('28');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [todayLog, setTodayLog] = useState(null);

  const load = useCallback(async () => {
    const data = await Storage.get(KEYS.CYCLE_DATA);
    if (data) {
      setCycleData(data);
      setCycleInfo(computeCyclePhase(data.lastPeriodStart, data.cycleLength));
      setLastPeriodInput(data.lastPeriodStart);
      setCycleLengthInput(String(data.cycleLength));
      const today = new Date().toISOString().split('T')[0];
      const log = (data.logs || {})[today];
      if (log) {
        setSelectedSymptoms(log.symptoms || []);
        setSelectedMood(log.mood || null);
        setTodayLog(log);
      }
    } else {
      setEditMode(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveCycleData = async () => {
    if (!lastPeriodInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Format invalide', 'Utilise le format AAAA-MM-JJ (ex: 2026-03-15)');
      return;
    }
    const length = parseInt(cycleLengthInput, 10);
    if (isNaN(length) || length < 20 || length > 45) {
      Alert.alert('Durée invalide', 'La durée doit être entre 20 et 45 jours.');
      return;
    }
    const updated = { ...cycleData, lastPeriodStart: lastPeriodInput, cycleLength: length, logs: cycleData?.logs || {} };
    await Storage.set(KEYS.CYCLE_DATA, updated);
    setCycleData(updated);
    setCycleInfo(computeCyclePhase(lastPeriodInput, length));
    setEditMode(false);
  };

  const toggleSymptom = (s) => {
    setSelectedSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const saveLog = async () => {
    const today = new Date().toISOString().split('T')[0];
    const updated = {
      ...cycleData,
      logs: { ...(cycleData?.logs || {}), [today]: { symptoms: selectedSymptoms, mood: selectedMood, date: today } },
    };
    await Storage.set(KEYS.CYCLE_DATA, updated);
    setCycleData(updated);
    setTodayLog({ symptoms: selectedSymptoms, mood: selectedMood });
    Alert.alert('Sauvegardé ✓', 'Ton journal du jour est enregistré.');
  };

  const phaseInfo = cycleInfo ? T.phases[cycleInfo.phase] : null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Cycle</Text>

        {/* Phase summary */}
        {cycleInfo && phaseInfo && (
          <View style={[s.phaseHero, { backgroundColor: phaseInfo.bg }, T.shadow.sm]}>
            <Text style={s.phaseEmoji}>{phaseInfo.emoji}</Text>
            <View style={s.phaseInfo}>
              <Text style={[s.phaseName, { color: phaseInfo.color }]}>{phaseInfo.label}</Text>
              <Text style={s.phaseDay}>Jour {cycleInfo.day} sur {cycleInfo.cycleLength}</Text>
              {cycleInfo.nextPeriod && (
                <Text style={s.nextPeriod}>Prochaines règles : {cycleInfo.nextPeriod}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setEditMode(true)} style={s.editBtn}>
              <Text style={s.editBtnText}>Modifier</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Calendar strip */}
        {cycleData && (
          <View style={[s.card, T.shadow.sm]}>
            <Text style={s.cardTitle}>Calendrier du cycle</Text>
            <CalendarStrip cycleData={cycleData} />
          </View>
        )}

        {/* Phase overview */}
        {cycleInfo && (
          <View style={[s.card, T.shadow.sm]}>
            <Text style={s.cardTitle}>Phases du cycle</Text>
            <View style={s.phasesRow}>
              {['menstrual', 'follicular', 'ovulation', 'luteal'].map((p) => (
                <PhaseCard key={p} phase={p} active={cycleInfo.phase === p} />
              ))}
            </View>
          </View>
        )}

        {/* Edit form */}
        {editMode && (
          <View style={[s.card, T.shadow.sm]}>
            <Text style={s.cardTitle}>Configurer ton cycle</Text>
            <Text style={s.fieldLabel}>Date de tes dernières règles (AAAA-MM-JJ)</Text>
            <TextInput
              style={s.input}
              value={lastPeriodInput}
              onChangeText={setLastPeriodInput}
              placeholder="2026-03-15"
              placeholderTextColor={T.light}
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            />
            <Text style={s.fieldLabel}>Durée de ton cycle (jours)</Text>
            <TextInput
              style={s.input}
              value={cycleLengthInput}
              onChangeText={setCycleLengthInput}
              keyboardType="numeric"
              placeholder="28"
              placeholderTextColor={T.light}
            />
            <TouchableOpacity style={s.saveBtn} onPress={saveCycleData}>
              <Text style={s.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Daily journal */}
        {cycleData && (
          <View style={[s.card, T.shadow.sm]}>
            <Text style={s.cardTitle}>Journal du jour</Text>
            <Text style={s.fieldLabel}>Humeur</Text>
            <View style={s.moodRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[s.moodBtn, selectedMood === m && s.moodSelected]}
                  onPress={() => setSelectedMood(m === selectedMood ? null : m)}
                >
                  <Text style={s.moodEmoji}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>Symptômes</Text>
            <View style={s.symptomsGrid}>
              {SYMPTOMS.map((sym) => (
                <TouchableOpacity
                  key={sym}
                  style={[s.symptomBtn, selectedSymptoms.includes(sym) && s.symptomSelected]}
                  onPress={() => toggleSymptom(sym)}
                >
                  <Text style={[s.symptomText, selectedSymptoms.includes(sym) && s.symptomTextSelected]}>
                    {sym}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={saveLog}>
              <Text style={s.saveBtnText}>Sauvegarder le journal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: T.dark, marginBottom: 16 },

  phaseHero: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: T.radius.lg, padding: 16, marginBottom: 14 },
  phaseEmoji: { fontSize: 40 },
  phaseInfo: { flex: 1 },
  phaseName: { fontSize: 18, fontWeight: '700' },
  phaseDay: { fontSize: 13, color: T.mid, marginTop: 2 },
  nextPeriod: { fontSize: 12, color: T.mid, marginTop: 4 },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: T.radius.md, borderWidth: 1, borderColor: T.terra },
  editBtnText: { fontSize: 12, color: T.terra, fontWeight: '600' },

  card: { backgroundColor: T.white, borderRadius: T.radius.lg, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: T.dark, marginBottom: 12 },

  phasesRow: { flexDirection: 'row', gap: 8 },

  fieldLabel: { fontSize: 12, color: T.mid, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: T.bg2, borderRadius: T.radius.md, padding: 12, fontSize: 15, color: T.dark, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  saveBtn: { backgroundColor: T.terra, borderRadius: T.radius.md, padding: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: T.white, fontWeight: '700', fontSize: 15 },

  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  moodBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  moodSelected: { borderColor: T.terra, borderWidth: 2, backgroundColor: '#FDF2EC' },
  moodEmoji: { fontSize: 22 },

  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  symptomBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: T.bg2, borderWidth: 1, borderColor: T.border },
  symptomSelected: { backgroundColor: '#FDF2EC', borderColor: T.terra },
  symptomText: { fontSize: 13, color: T.mid },
  symptomTextSelected: { color: T.terra, fontWeight: '600' },
});
