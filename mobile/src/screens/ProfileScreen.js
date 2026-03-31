import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { T } from '../constants/theme';
import { Storage, SecureStorage, KEYS } from '../services/storage';
import { validateToken } from '../services/oura';

const GOALS = ['Mieux dormir', 'Gérer le stress', 'Performer au sport', 'Équilibrer mon énergie', 'Comprendre mon cycle', 'Mieux récupérer'];
const HORMONAL_PROFILES = ['Standard', 'SOPK', 'Péri-ménopause', 'Ménopause', 'Post-partum', 'Pilule'];

function Section({ title, children }) {
  return (
    <View style={sec.wrap}>
      <Text style={sec.title}>{title}</Text>
      <View style={sec.card}>{children}</View>
    </View>
  );
}
const sec = StyleSheet.create({
  wrap: { marginBottom: 20 },
  title: { fontSize: 12, color: T.mid, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 4 },
  card: { backgroundColor: T.white, borderRadius: T.radius.lg, overflow: 'hidden', ...T.shadow.sm },
});

function SettingRow({ label, sub, children, last }) {
  return (
    <View style={[row.wrap, !last && row.border]}>
      <View style={row.info}>
        <Text style={row.label}>{label}</Text>
        {sub && <Text style={row.sub}>{sub}</Text>}
      </View>
      {children}
    </View>
  );
}
const row = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: T.border },
  info: { flex: 1 },
  label: { fontSize: 14, color: T.dark, fontWeight: '500' },
  sub: { fontSize: 12, color: T.mid, marginTop: 2 },
});

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [ouraToken, setOuraToken] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [goals, setGoals] = useState([]);
  const [hormonalProfile, setHormonalProfile] = useState('Standard');
  const [notifications, setNotifications] = useState(true);
  const [tokenStatus, setTokenStatus] = useState(null); // null | 'valid' | 'invalid'
  const [validating, setValidating] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const [profile, token, apiKey] = await Promise.all([
      Storage.get(KEYS.USER_PROFILE),
      SecureStorage.get(KEYS.OURA_TOKEN),
      SecureStorage.get(KEYS.ANTHROPIC_KEY),
    ]);
    if (profile) {
      setName(profile.name || '');
      setGoals(profile.goals || []);
      setHormonalProfile(profile.hormonal_profile || 'Standard');
      setNotifications(profile.notifications !== false);
    }
    if (token) setOuraToken(token);
    if (apiKey) setAnthropicKey(apiKey);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleGoal = (g) => {
    setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const checkToken = async () => {
    if (!ouraToken.trim()) return;
    setValidating(true);
    setTokenStatus(null);
    const valid = await validateToken(ouraToken.trim());
    setTokenStatus(valid ? 'valid' : 'invalid');
    setValidating(false);
  };

  const saveAll = async () => {
    if (!name.trim()) {
      Alert.alert('Prénom manquant', 'Entre ton prénom pour continuer.');
      return;
    }
    const profile = {
      name: name.trim(),
      goals,
      hormonal_profile: hormonalProfile,
      notifications,
    };
    await Promise.all([
      Storage.set(KEYS.USER_PROFILE, profile),
      ouraToken.trim() ? SecureStorage.set(KEYS.OURA_TOKEN, ouraToken.trim()) : Promise.resolve(),
      anthropicKey.trim() ? SecureStorage.set(KEYS.ANTHROPIC_KEY, anthropicKey.trim()) : Promise.resolve(),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteAllData = () => {
    Alert.alert(
      'Supprimer toutes les données',
      'Cette action est irréversible. Toutes tes données locales seront effacées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            await Promise.all([
              Storage.remove(KEYS.USER_PROFILE),
              Storage.remove(KEYS.CYCLE_DATA),
              Storage.remove(KEYS.SAVED_ADVICE),
              Storage.remove(KEYS.LAST_ADVICE),
              SecureStorage.remove(KEYS.OURA_TOKEN),
              SecureStorage.remove(KEYS.ANTHROPIC_KEY),
            ]);
            setName(''); setOuraToken(''); setAnthropicKey('');
            setGoals([]); setHormonalProfile('Standard');
            Alert.alert('Données supprimées', 'Toutes tes données ont été effacées.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Profil</Text>

        {/* Identity */}
        <Section title="Identité">
          <SettingRow label="Prénom" last>
            <TextInput
              style={s.inlineInput}
              value={name}
              onChangeText={setName}
              placeholder="Ton prénom"
              placeholderTextColor={T.light}
            />
          </SettingRow>
        </Section>

        {/* Connections */}
        <Section title="Connexions">
          <View style={s.tokenField}>
            <Text style={s.fieldLabel}>Token Oura Ring</Text>
            <Text style={s.fieldHint}>Obtiens-le sur cloud.ouraring.com → Personal Access Tokens</Text>
            <View style={s.tokenRow}>
              <TextInput
                style={[s.tokenInput, tokenStatus === 'valid' && s.tokenValid, tokenStatus === 'invalid' && s.tokenInvalid]}
                value={ouraToken}
                onChangeText={(t) => { setOuraToken(t); setTokenStatus(null); }}
                placeholder="eyJ…"
                placeholderTextColor={T.light}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[s.verifyBtn, validating && { opacity: 0.5 }]}
                onPress={checkToken}
                disabled={validating || !ouraToken.trim()}
              >
                <Text style={s.verifyText}>{validating ? '…' : 'Vérifier'}</Text>
              </TouchableOpacity>
            </View>
            {tokenStatus === 'valid' && <Text style={s.tokenOk}>✓ Token valide</Text>}
            {tokenStatus === 'invalid' && <Text style={s.tokenErr}>✗ Token invalide ou expiré</Text>}
          </View>

          <View style={[s.tokenField, { borderTopWidth: 1, borderTopColor: T.border }]}>
            <Text style={s.fieldLabel}>Clé API Anthropic</Text>
            <Text style={s.fieldHint}>Nécessaire pour le conseil IA quotidien (console.anthropic.com)</Text>
            <TextInput
              style={s.tokenInput}
              value={anthropicKey}
              onChangeText={setAnthropicKey}
              placeholder="sk-ant-…"
              placeholderTextColor={T.light}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </Section>

        {/* Hormonal profile */}
        <Section title="Profil hormonal">
          <View style={s.chipsWrap}>
            {HORMONAL_PROFILES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[s.chip, hormonalProfile === p && s.chipSelected]}
                onPress={() => setHormonalProfile(p)}
              >
                <Text style={[s.chipText, hormonalProfile === p && s.chipTextSelected]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Goals */}
        <Section title="Mes objectifs">
          <View style={s.chipsWrap}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[s.chip, goals.includes(g) && s.chipSelected]}
                onPress={() => toggleGoal(g)}
              >
                <Text style={[s.chipText, goals.includes(g) && s.chipTextSelected]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Preferences */}
        <Section title="Préférences">
          <SettingRow label="Notification matinale" sub="Reçois ton conseil chaque matin" last>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: T.border, true: T.terra }}
              thumbColor={T.white}
            />
          </SettingRow>
        </Section>

        {/* Save button */}
        <TouchableOpacity style={[s.saveBtn, saved && s.saveBtnDone]} onPress={saveAll}>
          <Text style={s.saveBtnText}>{saved ? '✓ Sauvegardé' : 'Sauvegarder le profil'}</Text>
        </TouchableOpacity>

        {/* RGPD */}
        <TouchableOpacity style={s.deleteBtn} onPress={deleteAllData}>
          <Text style={s.deleteText}>Supprimer toutes mes données</Text>
        </TouchableOpacity>

        <Text style={s.privacy}>🔒 Toutes tes données restent sur ton appareil. Afiya ne collecte rien.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: T.dark, marginBottom: 20 },

  inlineInput: { flex: 1, fontSize: 14, color: T.dark, textAlign: 'right' },

  tokenField: { padding: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: T.dark, marginBottom: 4 },
  fieldHint: { fontSize: 11, color: T.mid, marginBottom: 10, lineHeight: 16 },
  tokenRow: { flexDirection: 'row', gap: 8 },
  tokenInput: { flex: 1, backgroundColor: T.bg2, borderRadius: T.radius.md, padding: 10, fontSize: 13, color: T.dark, borderWidth: 1, borderColor: T.border },
  tokenValid: { borderColor: T.sage },
  tokenInvalid: { borderColor: T.red },
  verifyBtn: { backgroundColor: T.terra, borderRadius: T.radius.md, paddingHorizontal: 14, justifyContent: 'center' },
  verifyText: { color: T.white, fontWeight: '700', fontSize: 13 },
  tokenOk: { fontSize: 12, color: T.sage, marginTop: 6, fontWeight: '600' },
  tokenErr: { fontSize: 12, color: T.red, marginTop: 6, fontWeight: '600' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: T.bg2, borderWidth: 1, borderColor: T.border },
  chipSelected: { backgroundColor: '#FDF2EC', borderColor: T.terra },
  chipText: { fontSize: 13, color: T.mid },
  chipTextSelected: { color: T.terra, fontWeight: '600' },

  saveBtn: { backgroundColor: T.terra, borderRadius: T.radius.lg, padding: 16, alignItems: 'center', marginBottom: 12 },
  saveBtnDone: { backgroundColor: T.sage },
  saveBtnText: { color: T.white, fontWeight: '700', fontSize: 16 },

  deleteBtn: { alignItems: 'center', paddingVertical: 14 },
  deleteText: { color: T.red, fontSize: 14 },

  privacy: { textAlign: 'center', fontSize: 12, color: T.light, marginTop: 8, lineHeight: 18 },
});
