import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Secure storage for API tokens
export const SecureStorage = {
  async get(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  async remove(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

// Regular storage for app data
export const Storage = {
  async get(key) {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const KEYS = {
  OURA_TOKEN: 'oura_token',
  ANTHROPIC_KEY: 'anthropic_key',
  USER_PROFILE: 'user_profile',
  CYCLE_DATA: 'cycle_data',
  SAVED_ADVICE: 'saved_advice',
  LAST_ADVICE: 'last_advice',
};
