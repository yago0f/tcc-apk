import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import * as SystemUI from 'expo-system-ui';

import { translate } from '../i18n/translations';
import { createNavigationTheme, THEMES } from '../theme/themes';

const STORAGE_KEY = '@rebirth-prosthetics/settings-v2';
const VALID_LANGUAGES = ['pt', 'en', 'es'];
const VALID_THEMES = ['system', 'light', 'dark'];

const AppSettingsContext = createContext(null);

function getInitialLanguage() {
  try {
    const languageCode = getLocales()?.[0]?.languageCode;
    return VALID_LANGUAGES.includes(languageCode) ? languageCode : 'pt';
  } catch {
    return 'pt';
  }
}

export function AppSettingsProvider({ children }) {
  const systemScheme = useColorScheme();
  const [language, setLanguageState] = useState(getInitialLanguage);
  const [themePreference, setThemePreferenceState] = useState('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPreferences() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored || !mounted) return;

        const parsed = JSON.parse(stored);
        if (VALID_LANGUAGES.includes(parsed.language)) {
          setLanguageState(parsed.language);
        }
        if (VALID_THEMES.includes(parsed.themePreference)) {
          setThemePreferenceState(parsed.themePreference);
        }
      } catch (error) {
        console.warn('Não foi possível carregar as preferências:', error);
      } finally {
        if (mounted) setIsReady(true);
      }
    }

    loadPreferences();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ language, themePreference }),
    ).catch((error) => {
      console.warn('Não foi possível salvar as preferências:', error);
    });
  }, [isReady, language, themePreference]);

  const resolvedTheme =
    themePreference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : themePreference;

  const theme = THEMES[resolvedTheme];
  const navigationTheme = useMemo(() => createNavigationTheme(theme), [theme]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.background).catch(() => {});

    try {
      if (Platform.OS === 'web') {
        if (typeof document !== 'undefined') {
          document.documentElement.style.colorScheme = resolvedTheme;
        }
      } else {
        Appearance.setColorScheme(
          themePreference === 'system' ? null : themePreference,
        );
      }
    } catch {
      // Alguns ambientes antigos do Expo Go não permitem forçar o esquema nativo.
    }
  }, [resolvedTheme, theme.background, themePreference]);

  const setLanguage = useCallback((nextLanguage) => {
    if (VALID_LANGUAGES.includes(nextLanguage)) {
      setLanguageState(nextLanguage);
    }
  }, []);

  const setThemePreference = useCallback((nextTheme) => {
    if (VALID_THEMES.includes(nextTheme)) {
      setThemePreferenceState(nextTheme);
    }
  }, []);

  const t = useCallback(
    (key, params) => translate(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      themePreference,
      setThemePreference,
      resolvedTheme,
      theme,
      navigationTheme,
      isReady,
      t,
    }),
    [
      isReady,
      language,
      navigationTheme,
      resolvedTheme,
      setLanguage,
      setThemePreference,
      t,
      theme,
      themePreference,
    ],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings precisa estar dentro de AppSettingsProvider.');
  }
  return context;
}
