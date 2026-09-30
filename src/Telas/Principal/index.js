import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppSettings } from '../../context/AppSettingsContext';
import { useAuth } from '../../context/AuthContext';
import { api, API_BASE_URL } from '../../services/api';

const LANGUAGE_ORDER = ['pt', 'en', 'es'];

function formatCpf(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatBirthDate(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function birthDateToSql(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const today = new Date();

  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!isRealDate || year < 1900 || date > today) return null;

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function Principal({ navigation }) {
  const {
    language,
    setLanguage,
    themePreference,
    setThemePreference,
    resolvedTheme,
    theme,
    t,
  } = useAppSettings();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { signIn } = useAuth();

  const [activeTab, setActiveTab] = useState('login');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState(null);

  function resetForm(nextTab) {
    setActiveTab(nextTab);
    setCpf('');
    setEmail('');
    setName('');
    setBirthDate('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setIsSubmitting(false);
    setFormFeedback(null);
  }

  function cycleLanguage() {
    const currentIndex = LANGUAGE_ORDER.indexOf(language);
    setLanguage(LANGUAGE_ORDER[(currentIndex + 1) % LANGUAGE_ORDER.length]);
  }

  function toggleTheme() {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemePreference(nextTheme);
  }

  function showFormError(message) {
    setFormFeedback({ type: 'error', message });

    // No navegador, Alert.alert pode variar conforme o ambiente do React Native Web.
    // A mensagem inline acima do botão é a fonte principal de feedback.
    if (Platform.OS !== 'web') {
      Alert.alert(t('common.error'), message);
    }
  }

  function getBaseValidationError() {
    const normalizedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail || !password.trim()) {
      return t('auth.fillRequired');
    }
    if (!emailRegex.test(normalizedEmail)) {
      return t('auth.invalidEmail');
    }
    if (password.length < 6) {
      return t('auth.shortPassword');
    }
    return null;
  }

  function getSignupValidation() {
    const baseError = getBaseValidationError();
    if (baseError) return { error: baseError };

    const cpfDigits = cpf.replace(/\D/g, '');
    const phoneDigits = phone.replace(/\D/g, '');
    const birthDateSql = birthDateToSql(birthDate);

    if (!name.trim() || !cpfDigits || !birthDate.trim() || !phoneDigits || !confirmPassword.trim()) {
      return { error: t('auth.fillRequired') };
    }
    if (name.trim().length < 3) {
      return { error: 'Digite seu nome completo.' };
    }
    if (cpfDigits.length !== 11) {
      return { error: t('auth.invalidCpf') };
    }
    if (!birthDateSql) {
      return { error: t('auth.invalidBirthDate') };
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      return { error: t('auth.invalidPhone') };
    }
    if (password !== confirmPassword) {
      return { error: t('auth.passwordMismatch') };
    }

    return {
      error: null,
      payload: {
        cpf_usuario: cpfDigits,
        email_usuario: email.trim().toLowerCase(),
        nome_usuario: name.trim(),
        data_nascimento: birthDateSql,
        telefone_usuario: formatPhone(phone),
        senha_usuario: password,
      },
    };
  }

  async function handleLogin() {
    if (isSubmitting) return;

    Keyboard.dismiss();
    setFormFeedback(null);

    const validationError = getBaseValidationError();
    if (validationError) {
      showFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormFeedback({ type: 'info', message: 'Entrando...' });

    try {
      const response = await api.post('/login.php', {
        email_usuario: email.trim().toLowerCase(),
        senha_usuario: password,
      });

      if (!response?.data?.sucesso || !response?.data?.usuario) {
        throw new Error(response?.data?.mensagem || 'Não foi possível entrar.');
      }

      await signIn(response.data.usuario);
      setFormFeedback({
        type: 'success',
        message: response.data.mensagem || 'Login realizado com sucesso.',
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      const message =
        error?.response?.data?.mensagem ||
        (error?.request
          ? `Não foi possível acessar a API em ${API_BASE_URL}. Verifique se Apache e MySQL estão ligados.`
          : error?.message) ||
        'Falha ao realizar o login.';

      showFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignup() {
    if (isSubmitting) return;

    Keyboard.dismiss();
    setFormFeedback({ type: 'info', message: 'Validando os dados do cadastro...' });

    const { error: validationError, payload } = getSignupValidation();
    if (validationError) {
      showFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormFeedback({ type: 'info', message: 'Enviando cadastro para o servidor...' });

    try {
      // Mantém exatamente o mesmo caminho de rede que o login usa.
      // A primeira versão funcional do projeto usava api.post() diretamente.
      const response = await api.post('/cadastrar.php', payload);

      if (!response?.data?.sucesso) {
        throw new Error(response?.data?.mensagem || 'Falha ao salvar cadastro.');
      }

      const successMessage = response.data.mensagem || t('auth.signupSuccess');

      setActiveTab('login');
      setCpf('');
      setName('');
      setBirthDate('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setEmail(payload.email_usuario);
      setFormFeedback({ type: 'success', message: successMessage });

      if (Platform.OS !== 'web') {
        Alert.alert(t('common.success'), successMessage);
      }
    } catch (error) {
      const message =
        error?.response?.data?.mensagem ||
        (error?.request
          ? `Não foi possível acessar a API em ${API_BASE_URL}. Verifique Apache, MySQL e o caminho C:\\laragon\\www\\rebirth-api.`
          : error?.message) ||
        'Falha ao realizar o cadastro.';

      showFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function showSocialMessage() {
    Alert.alert(t('common.comingSoonTitle'), t('auth.socialMessage'));
  }

  const currentThemeLabel =
    themePreference === 'system'
      ? 'AUTO'
      : resolvedTheme === 'dark'
        ? 'DARK'
        : 'LIGHT';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.brandTextWrap}>
                  <Text style={styles.brandName}>{t('common.appName')}</Text>
                  <Text style={styles.prototype}>{t('common.prototype')}</Text>
                </View>
              </View>

              <View style={styles.quickActions}>
                <Pressable
                  onPress={cycleLanguage}
                  style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.currentLanguage')}
                >
                  <Text style={styles.languageCode}>{language.toUpperCase()}</Text>
                </Pressable>
                <Pressable
                  onPress={toggleTheme}
                  style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.currentTheme')}
                >
                  <Ionicons
                    name={resolvedTheme === 'dark' ? 'moon' : 'sunny'}
                    size={18}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.heroCopy}>
              <View style={styles.heroIcon}>
                <Ionicons name="hand-left-outline" size={28} color={theme.sky} />
              </View>
              <Text style={styles.title}>{t('auth.welcome')}</Text>
              <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
            </View>

            <View style={styles.preferencePills}>
              <View style={styles.preferencePill}>
                <Ionicons name="language-outline" size={14} color={theme.sky} />
                <Text style={styles.preferencePillText}>{language.toUpperCase()}</Text>
              </View>
              <View style={styles.preferencePill}>
                <Ionicons name="color-palette-outline" size={14} color={theme.sky} />
                <Text style={styles.preferencePillText}>{currentThemeLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.tabs}>
              {['login', 'signup'].map((tab) => {
                const selected = activeTab === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => resetForm(tab)}
                    style={({ pressed }) => [
                      styles.tab,
                      selected && styles.tabSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                      {tab === 'login' ? t('auth.loginTab') : t('auth.signupTab')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {activeTab === 'signup' && (
              <>
                <FieldLabel text={t('auth.cpf')} theme={theme} />
                <InputShell theme={theme} icon="card-outline">
                  <TextInput
                    value={cpf}
                    onChangeText={(value) => setCpf(formatCpf(value))}
                    placeholder={t('auth.cpfPlaceholder')}
                    placeholderTextColor={theme.textMuted}
                    keyboardType="number-pad"
                    style={styles.input}
                    maxLength={14}
                  />
                </InputShell>

                <FieldLabel text={t('auth.name')} theme={theme} />
                <InputShell theme={theme} icon="person-outline">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t('auth.namePlaceholder')}
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="words"
                    autoComplete="name"
                    style={styles.input}
                  />
                </InputShell>

                <FieldLabel text={t('auth.birthDate')} theme={theme} />
                <InputShell theme={theme} icon="calendar-outline">
                  <TextInput
                    value={birthDate}
                    onChangeText={(value) => setBirthDate(formatBirthDate(value))}
                    placeholder={t('auth.birthDatePlaceholder')}
                    placeholderTextColor={theme.textMuted}
                    keyboardType="number-pad"
                    style={styles.input}
                    maxLength={10}
                  />
                </InputShell>

                <FieldLabel text={t('auth.phone')} theme={theme} />
                <InputShell theme={theme} icon="call-outline">
                  <TextInput
                    value={phone}
                    onChangeText={(value) => setPhone(formatPhone(value))}
                    placeholder={t('auth.phonePlaceholder')}
                    placeholderTextColor={theme.textMuted}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    style={styles.input}
                    maxLength={15}
                  />
                </InputShell>
              </>
            )}

            <FieldLabel text={t('auth.email')} theme={theme} />
            <InputShell theme={theme} icon="mail-outline">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                style={styles.input}
              />
            </InputShell>

            <FieldLabel text={t('auth.password')} theme={theme} />
            <InputShell theme={theme} icon="lock-closed-outline">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                style={styles.input}
              />
              <Pressable
                onPress={() => setShowPassword((current) => !current)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={21}
                  color={theme.textMuted}
                />
              </Pressable>
            </InputShell>

            {activeTab === 'signup' && (
              <>
                <FieldLabel text={t('auth.confirmPassword')} theme={theme} />
                <InputShell theme={theme} icon="shield-checkmark-outline">
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    style={styles.input}
                  />
                </InputShell>
              </>
            )}

            {formFeedback ? (
              <View
                style={[
                  styles.feedbackCard,
                  formFeedback.type === 'error' && styles.feedbackCardError,
                  formFeedback.type === 'success' && styles.feedbackCardSuccess,
                ]}
              >
                <Ionicons
                  name={
                    formFeedback.type === 'error'
                      ? 'alert-circle-outline'
                      : formFeedback.type === 'success'
                        ? 'checkmark-circle-outline'
                        : 'information-circle-outline'
                  }
                  size={20}
                  color={
                    formFeedback.type === 'error'
                      ? theme.danger
                      : formFeedback.type === 'success'
                        ? theme.success
                        : theme.accent
                  }
                />
                <Text style={styles.feedbackText}>{formFeedback.message}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={activeTab === 'login' ? handleLogin : handleSignup}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel={activeTab === 'login' ? t('auth.loginButton') : t('auth.signupButton')}
              style={[
                styles.primaryButton,
                isSubmitting && styles.primaryButtonPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : null}
              <Text style={styles.primaryButtonText}>
                {isSubmitting
                  ? activeTab === 'signup'
                    ? 'Cadastrando...'
                    : 'Entrando...'
                  : activeTab === 'login'
                    ? t('auth.loginButton')
                    : t('auth.signupButton')}
              </Text>
              {!isSubmitting ? (
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              ) : null}
            </Pressable>

            {activeTab === 'login' && (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>{t('auth.orContinue')}</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialRow}>
                  <Pressable
                    onPress={showSocialMessage}
                    style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
                  >
                    <Image
                      source={require('../../../assets/google.png')}
                      style={styles.socialIcon}
                    />
                    <Text style={styles.socialText}>{t('auth.google')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={showSocialMessage}
                    style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
                  >
                    <Image
                      source={require('../../../assets/facebook.png')}
                      style={styles.socialIcon}
                    />
                    <Text style={styles.socialText}>{t('auth.facebook')}</Text>
                  </Pressable>
                </View>
              </>
            )}

            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark" size={18} color={theme.success} />
              <Text style={styles.securityText}>{t('auth.security')}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ text, theme }) {
  return <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 7 }}>{text}</Text>;
}

function InputShell({ children, icon, theme }) {
  return (
    <View
      style={{
        minHeight: 52,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.input,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
      }}
    >
      <Ionicons name={icon} size={20} color={theme.accent} style={{ marginRight: 10 }} />
      {children}
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.hero,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      backgroundColor: theme.background,
    },
    hero: {
      backgroundColor: theme.hero,
      paddingHorizontal: 22,
      paddingTop: 14,
      paddingBottom: 34,
      borderBottomLeftRadius: 34,
      borderBottomRightRadius: 34,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    brandRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoContainer: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor: 'rgba(255,255,255,0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 11,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    logo: {
      width: 31,
      height: 31,
    },
    brandTextWrap: {
      flex: 1,
    },
    brandName: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    prototype: {
      color: '#AEB8D3',
      fontSize: 13,
      marginTop: 2,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 8,
    },
    quickButton: {
      minWidth: 38,
      height: 38,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    languageCode: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '900',
    },
    heroCopy: {
      marginTop: 34,
    },
    heroIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: 'rgba(149, 211, 255, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '900',
      letterSpacing: -0.6,
    },
    subtitle: {
      color: '#C8D0E6',
      fontSize: 14,
      lineHeight: 21,
      marginTop: 9,
      maxWidth: 520,
    },
    preferencePills: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 20,
    },
    preferencePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    preferencePillText: {
      color: '#DDE7FF',
      fontSize: 12,
      fontWeight: '800',
    },
    card: {
      width: '100%',
      maxWidth: 620,
      alignSelf: 'center',
      backgroundColor: theme.surface,
      marginTop: -14,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 28,
      shadowColor: theme.shadow,
      shadowOpacity: theme.mode === 'dark' ? 0.26 : 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    tabs: {
      flexDirection: 'row',
      padding: 4,
      borderRadius: 15,
      backgroundColor: theme.surfaceStrong,
      marginBottom: 22,
    },
    tab: {
      flex: 1,
      minHeight: 43,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    tabSelected: {
      backgroundColor: theme.surface,
      shadowColor: theme.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    tabText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },
    tabTextSelected: {
      color: theme.accent,
    },
    input: {
      flex: 1,
      minHeight: 50,
      color: theme.text,
      fontSize: 14,
      paddingVertical: 0,
    },
    feedbackCard: {
      minHeight: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.accentSoft,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    feedbackCardError: {
      backgroundColor: theme.dangerSoft,
      borderColor: theme.danger,
    },
    feedbackCardSuccess: {
      backgroundColor: theme.successSoft,
      borderColor: theme.success,
    },
    feedbackText: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      lineHeight: 17,
      fontWeight: '600',
    },
    primaryButton: {
      minHeight: 54,
      borderRadius: 16,
      backgroundColor: theme.accent,
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      shadowColor: theme.accent,
      shadowOpacity: 0.28,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    primaryButtonPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.992 }],
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginVertical: 20,
    },
    divider: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
    },
    dividerText: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    socialRow: {
      flexDirection: 'row',
      gap: 10,
    },
    socialButton: {
      flex: 1,
      minHeight: 50,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 9,
    },
    socialIcon: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
    },
    socialText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '700',
    },
    securityNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      marginTop: 22,
      backgroundColor: theme.successSoft,
      borderRadius: 14,
      padding: 12,
    },
    securityText: {
      flex: 1,
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 16,
    },
    pressed: {
      opacity: 0.72,
    },
  });
