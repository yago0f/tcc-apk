import axios from 'axios';
import { NativeModules, Platform } from 'react-native';

function getDevelopmentHost() {
  if (!__DEV__) return null;
  if (Platform.OS === 'web') return 'localhost';
  try {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (typeof scriptURL !== 'string') return null;
    return scriptURL.match(/^https?:\/\/([^/:]+)/i)?.[1] || null;
  } catch {
    return null;
  }
}

function normalizeBaseURL(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

const configuredURL = normalizeBaseURL(process.env.EXPO_PUBLIC_API_URL);
const developmentHost = configuredURL ? null : getDevelopmentHost();
export const API_BASE_URL = configuredURL ||
  (developmentHost ? `http://${developmentHost}/rebirth-api` : '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

// Configuration errors are reported when logging in, never while importing App.
api.interceptors.request.use((config) => {
  if (!/^https?:\/\//i.test(API_BASE_URL)) {
    throw new Error('Configure EXPO_PUBLIC_API_URL no arquivo .env e gere o APK novamente. Use o IP do computador com Laragon, nao localhost.');
  }
  return config;
});
