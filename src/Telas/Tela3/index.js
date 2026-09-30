import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppSettings } from '../../context/AppSettingsContext';
import { useAuth } from '../../context/AuthContext';

const PROJECT_URL = 'https://projetodotccteste.vercel.app/duvidas.html';

export default function Tela3() {
  const {
    language,
    setLanguage,
    themePreference,
    setThemePreference,
    resolvedTheme,
    theme,
    t,
  } = useAppSettings();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const fullName = user?.nome_usuario || t('profile.defaultUser');
  const email = user?.email_usuario || t('profile.notInformed');
  const userId = `${t('profile.userIdPrefix')} #USR${String(user?.id_usuario || 0).padStart(6, '0')}`;
  const [page, setPage] = useState('main');
  const [openFaq, setOpenFaq] = useState(0);

  const languageName = {
    pt: t('settings.portuguese'),
    en: t('settings.english'),
    es: t('settings.spanish'),
  }[language];

  const themeName = {
    system: t('settings.system'),
    light: t('settings.light'),
    dark: t('settings.dark'),
  }[themePreference];

  function showComingSoon() {
    Alert.alert(t('common.comingSoonTitle'), t('common.comingSoonMessage'));
  }

  async function openWebsite() {
    try {
      const supported = await Linking.canOpenURL(PROJECT_URL);
      if (!supported) throw new Error('unsupported');
      await Linking.openURL(PROJECT_URL);
    } catch {
      Alert.alert(t('common.error'), t('common.comingSoonMessage'));
    }
  }

  const mainItems = [
    {
      key: 'account',
      icon: 'person-outline',
      title: t('settings.account'),
      description: t('settings.accountDescription'),
      value: fullName,
    },
    {
      key: 'appearance',
      icon: 'color-palette-outline',
      title: t('settings.appearance'),
      description: t('settings.appearanceDescription'),
      value: themeName,
    },
    {
      key: 'language',
      icon: 'language-outline',
      title: t('settings.language'),
      description: t('settings.languageDescription'),
      value: languageName,
    },
    {
      key: 'faq',
      icon: 'help-circle-outline',
      title: t('settings.faq'),
      description: t('settings.faqDescription'),
    },
    {
      key: 'about',
      icon: 'information-circle-outline',
      title: t('settings.about'),
      description: t('settings.aboutDescription'),
    },
    {
      key: 'prosthesis',
      icon: 'hand-left-outline',
      title: t('settings.prosthesis'),
      description: t('settings.prosthesisDescription'),
      value: '1',
    },
  ];

  function renderMain() {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('settings.title')}</Text>
            <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="settings" size={24} color={theme.textOnPrimary} />
          </View>
        </View>

        <View style={styles.profileCard}>
          <Image
            source={require('../../../assets/icone.png')}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={styles.profileCopy}>
            <Text style={styles.profileName}>{fullName}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <Text style={styles.profileId}>{userId}</Text>
          </View>
          <View style={styles.profileStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.profileStatusText}>{t('common.active')}</Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          {mainItems.map((item, index) => (
            <SettingsRow
              key={item.key}
              icon={item.icon}
              title={item.title}
              description={item.description}
              value={item.value}
              onPress={() => setPage(item.key)}
              isLast={index === mainItems.length - 1}
              theme={theme}
              styles={styles}
            />
          ))}
        </View>

        <View style={styles.savedNote}>
          <Ionicons name="cloud-done-outline" size={21} color={theme.success} />
          <Text style={styles.savedNoteText}>{t('settings.storedPreferences')}</Text>
        </View>
      </ScrollView>
    );
  }

  function renderAccount() {
    const actions = [
      ['person-outline', t('settings.editName')],
      ['mail-outline', t('settings.editEmail')],
      ['camera-outline', t('settings.changePhoto')],
      ['lock-closed-outline', t('settings.changePassword')],
    ];

    return (
      <PageLayout title={t('settings.accountTitle')} onBack={() => setPage('main')} theme={theme} styles={styles}>
        <View style={styles.accountHero}>
          <View style={styles.accountAvatarWrap}>
            <Image source={require('../../../assets/icone.png')} style={styles.accountAvatar} />
            <Pressable onPress={showComingSoon} style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={styles.accountName}>{fullName}</Text>
          <Text style={styles.accountEmail}>{email}</Text>
          <View style={styles.accountIdPill}>
            <Text style={styles.accountIdText}>{userId}</Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          {actions.map(([icon, label], index) => (
            <SettingsRow
              key={label}
              icon={icon}
              title={label}
              onPress={showComingSoon}
              isLast={index === actions.length - 1}
              theme={theme}
              styles={styles}
            />
          ))}
        </View>

        <Pressable onPress={showComingSoon} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>{t('settings.editProfile')}</Text>
        </Pressable>

        <Pressable
          onPress={() => Alert.alert(t('settings.deleteTitle'), t('settings.deleteMessage'))}
          style={({ pressed }) => [styles.dangerAction, pressed && styles.pressed]}
        >
          <Ionicons name="trash-outline" size={20} color={theme.danger} />
          <Text style={styles.dangerActionText}>{t('settings.deleteProfile')}</Text>
        </Pressable>
      </PageLayout>
    );
  }

  function renderAppearance() {
    const options = [
      {
        key: 'system',
        icon: 'phone-portrait-outline',
        title: t('settings.system'),
        description: t('settings.systemDescription'),
      },
      {
        key: 'light',
        icon: 'sunny-outline',
        title: t('settings.light'),
        description: t('settings.lightDescription'),
      },
      {
        key: 'dark',
        icon: 'moon-outline',
        title: t('settings.dark'),
        description: t('settings.darkDescription'),
      },
    ];

    return (
      <PageLayout title={t('settings.appearanceTitle')} onBack={() => setPage('main')} theme={theme} styles={styles}>
        <Text style={styles.pageLead}>{t('settings.themeLabel')}</Text>
        <View style={styles.themePreview}>
          <View style={[styles.previewPhone, resolvedTheme === 'dark' && styles.previewPhoneDark]}>
            <View style={[styles.previewTop, resolvedTheme === 'dark' && styles.previewBlockDark]} />
            <View style={styles.previewRow}>
              <View style={[styles.previewSquare, resolvedTheme === 'dark' && styles.previewBlockDark]} />
              <View style={styles.previewLines}>
                <View style={[styles.previewLineLong, resolvedTheme === 'dark' && styles.previewBlockDark]} />
                <View style={[styles.previewLineShort, resolvedTheme === 'dark' && styles.previewBlockDark]} />
              </View>
            </View>
            <View style={[styles.previewButton, { backgroundColor: theme.accent }]} />
          </View>
          <View style={styles.themePreviewCopy}>
            <Text style={styles.themePreviewTitle}>{themeName}</Text>
            <Text style={styles.themePreviewText}>
              {themePreference === 'system'
                ? t('settings.systemDescription')
                : resolvedTheme === 'dark'
                  ? t('settings.darkDescription')
                  : t('settings.lightDescription')}
            </Text>
          </View>
        </View>

        <View style={styles.optionList}>
          {options.map((option) => (
            <ChoiceRow
              key={option.key}
              selected={themePreference === option.key}
              icon={option.icon}
              title={option.title}
              description={option.description}
              onPress={() => setThemePreference(option.key)}
              theme={theme}
              styles={styles}
            />
          ))}
        </View>
      </PageLayout>
    );
  }

  function renderLanguage() {
    const options = [
      { key: 'pt', code: 'BR', title: t('settings.portuguese'), subtitle: 'Português' },
      { key: 'en', code: 'US', title: t('settings.english'), subtitle: 'English' },
      { key: 'es', code: 'ES', title: t('settings.spanish'), subtitle: 'Español' },
    ];

    return (
      <PageLayout title={t('settings.languageTitle')} onBack={() => setPage('main')} theme={theme} styles={styles}>
        <View style={styles.infoBanner}>
          <Ionicons name="flash-outline" size={21} color={theme.accent} />
          <Text style={styles.infoBannerText}>{t('settings.languageHint')}</Text>
        </View>

        <View style={styles.optionList}>
          {options.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setLanguage(option.key)}
              style={({ pressed }) => [
                styles.languageOption,
                language === option.key && styles.choiceSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.languageCodeBox}>
                <Text style={styles.languageCodeText}>{option.code}</Text>
              </View>
              <View style={styles.choiceCopy}>
                <Text style={styles.choiceTitle}>{option.title}</Text>
                <Text style={styles.choiceDescription}>{option.subtitle}</Text>
              </View>
              <SelectionIndicator selected={language === option.key} theme={theme} styles={styles} />
            </Pressable>
          ))}
        </View>
      </PageLayout>
    );
  }

  function renderFaq() {
    const questions = [
      [t('settings.faqQ1'), t('settings.faqA1')],
      [t('settings.faqQ2'), t('settings.faqA2')],
      [t('settings.faqQ3'), t('settings.faqA3')],
      [t('settings.faqQ4'), t('settings.faqA4')],
    ];

    return (
      <PageLayout title={t('settings.faqTitle')} onBack={() => setPage('main')} theme={theme} styles={styles}>
        <View style={styles.faqHero}>
          <View style={styles.faqHeroIcon}>
            <Ionicons name="help-buoy-outline" size={29} color={theme.accent} />
          </View>
          <View style={styles.faqHeroCopy}>
            <Text style={styles.faqHeroTitle}>{t('settings.faq')}</Text>
            <Text style={styles.faqHeroText}>{t('settings.faqDescription')}</Text>
          </View>
        </View>

        <View style={styles.faqList}>
          {questions.map(([question, answer], index) => {
            const opened = openFaq === index;
            return (
              <Pressable
                key={question}
                onPress={() => setOpenFaq(opened ? -1 : index)}
                style={({ pressed }) => [styles.faqItem, opened && styles.faqItemOpen, pressed && styles.pressed]}
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={styles.faqQuestion}>{question}</Text>
                  <Ionicons
                    name={opened ? 'remove-circle-outline' : 'add-circle-outline'}
                    size={23}
                    color={theme.accent}
                  />
                </View>
                {opened ? <Text style={styles.faqAnswer}>{answer}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </PageLayout>
    );
  }

  function renderAbout() {
    return (
      <PageLayout title={t('settings.aboutTitle')} onBack={() => setPage('main')} theme={theme} styles={styles}>
        <View style={styles.aboutCard}>
          <View style={styles.aboutLogoWrap}>
            <Image source={require('../../../assets/logo.png')} style={styles.aboutLogo} resizeMode="contain" />
          </View>
          <Text style={styles.aboutTitle}>{t('settings.aboutApp')}</Text>
          <Text style={styles.aboutVersion}>{t('settings.aboutVersion')}</Text>
          <View style={styles.aboutDivider} />
          <Text style={styles.aboutText}>{t('settings.aboutDescriptionText')}</Text>

          <View style={styles.aboutFeatures}>
            <FeaturePill icon="accessibility-outline" text={t('settings.accessibility')} theme={theme} styles={styles} />
            <FeaturePill icon="hardware-chip-outline" text="HC-05" theme={theme} styles={styles} />
            <FeaturePill icon="phone-portrait-outline" text="React Native" theme={theme} styles={styles} />
          </View>

          <Pressable onPress={openWebsite} style={({ pressed }) => [styles.websiteButton, pressed && styles.pressed]}>
            <Ionicons name="open-outline" size={20} color="#FFFFFF" />
            <Text style={styles.websiteButtonText}>{t('settings.visitWebsite')}</Text>
          </Pressable>
          <Text style={styles.rightsText}>{t('settings.rights')}</Text>
        </View>
      </PageLayout>
    );
  }

  function renderProsthesis() {
    return (
      <PageLayout title={t('settings.prosthesisTitle')} onBack={() => setPage('main')} theme={theme} styles={styles}>
        <ProsthesisOption
          active
          title={t('settings.prosthesis1')}
          model={t('settings.prosthesis1Model')}
          status={t('common.connected')}
          theme={theme}
          styles={styles}
          onPress={showComingSoon}
        />
        <ProsthesisOption
          title={t('settings.prosthesis2')}
          model={t('settings.prosthesis2Model')}
          status={t('common.inactive')}
          theme={theme}
          styles={styles}
          onPress={showComingSoon}
        />

        <Pressable onPress={showComingSoon} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <View style={styles.addIcon}>
            <Ionicons name="add" size={23} color="#FFFFFF" />
          </View>
          <Text style={styles.addButtonText}>{t('settings.addProsthesis')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </Pressable>
      </PageLayout>
    );
  }

  const pages = {
    main: renderMain,
    account: renderAccount,
    appearance: renderAppearance,
    language: renderLanguage,
    faq: renderFaq,
    about: renderAbout,
    prosthesis: renderProsthesis,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {pages[page]?.() || renderMain()}
    </SafeAreaView>
  );
}

function PageLayout({ title, onBack, children, theme, styles }) {
  return (
    <View style={styles.pageContainer}>
      <View style={styles.pageHeader}>
        <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={styles.pageTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

function SettingsRow({ icon, title, description, value, onPress, isLast, theme, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, isLast && styles.settingsRowLast, pressed && styles.pressed]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={21} color={theme.accent} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
      ) : null}
      <Ionicons name="chevron-forward" size={19} color={theme.textMuted} />
    </Pressable>
  );
}

function ChoiceRow({ selected, icon, title, description, onPress, theme, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.choiceRow, selected && styles.choiceSelected, pressed && styles.pressed]}
    >
      <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
        <Ionicons name={icon} size={22} color={selected ? theme.accent : theme.textMuted} />
      </View>
      <View style={styles.choiceCopy}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceDescription}>{description}</Text>
      </View>
      <SelectionIndicator selected={selected} theme={theme} styles={styles} />
    </Pressable>
  );
}

function SelectionIndicator({ selected, theme, styles }) {
  return (
    <View style={[styles.selectionOuter, selected && { borderColor: theme.accent }]}>
      {selected ? <View style={styles.selectionInner} /> : null}
    </View>
  );
}

function FeaturePill({ icon, text, theme, styles }) {
  return (
    <View style={styles.featurePill}>
      <Ionicons name={icon} size={16} color={theme.accent} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function ProsthesisOption({ active, title, model, status, onPress, theme, styles }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.prosthesisOption, active && styles.prosthesisOptionActive, pressed && styles.pressed]}>
      <View style={[styles.prosthesisIcon, active && styles.prosthesisIconActive]}>
        <Ionicons name="hand-left-outline" size={25} color={active ? '#FFFFFF' : theme.textMuted} />
      </View>
      <View style={styles.prosthesisCopy}>
        <Text style={styles.prosthesisTitle}>{title}</Text>
        <Text style={styles.prosthesisModel}>{model}</Text>
        <View style={styles.prosthesisStatusRow}>
          <View style={[styles.prosthesisDot, { backgroundColor: active ? theme.success : theme.textMuted }]} />
          <Text style={[styles.prosthesisStatus, active && { color: theme.success }]}>{status}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
    </Pressable>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 30,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 18,
    },
    headerCopy: {
      flex: 1,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    subtitle: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 19,
      marginTop: 4,
    },
    headerIcon: {
      width: 50,
      height: 50,
      borderRadius: 17,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 4,
    },
    profileCard: {
      backgroundColor: theme.primaryDeep,
      borderRadius: 23,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      shadowColor: theme.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 19,
      marginRight: 12,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.18)',
    },
    profileCopy: {
      flex: 1,
    },
    profileName: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '900',
    },
    profileEmail: {
      color: '#B8C4E5',
      fontSize: 13,
      marginTop: 3,
    },
    profileId: {
      color: '#DCE7FF',
      fontSize: 11,
      fontWeight: '700',
      marginTop: 7,
    },
    profileStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(95,210,154,0.12)',
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 7,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#7BE0AA',
    },
    profileStatusText: {
      color: '#BDF5D3',
      fontSize: 11,
      fontWeight: '800',
    },
    menuCard: {
      borderRadius: 22,
      paddingHorizontal: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    settingsRow: {
      minHeight: 76,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      paddingVertical: 10,
    },
    settingsRowLast: {
      borderBottomWidth: 0,
    },
    rowIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowCopy: {
      flex: 1,
    },
    rowTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '800',
    },
    rowDescription: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 15,
      marginTop: 3,
    },
    rowValue: {
      maxWidth: 90,
      color: theme.accent,
      fontSize: 12,
      fontWeight: '800',
      textAlign: 'right',
    },
    savedNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 15,
      paddingVertical: 11,
    },
    savedNoteText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    pageContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    pageHeader: {
      minHeight: 62,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pageTitle: {
      flex: 1,
      textAlign: 'center',
      color: theme.text,
      fontSize: 17,
      fontWeight: '900',
      paddingHorizontal: 12,
    },
    headerSpacer: {
      width: 40,
    },
    pageContent: {
      padding: 18,
      paddingBottom: 32,
    },
    accountHero: {
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 22,
      marginBottom: 14,
    },
    accountAvatarWrap: {
      position: 'relative',
    },
    accountAvatar: {
      width: 92,
      height: 92,
      borderRadius: 30,
      borderWidth: 3,
      borderColor: theme.accentSoft,
    },
    cameraButton: {
      position: 'absolute',
      right: -4,
      bottom: -4,
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: theme.surface,
    },
    accountName: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '900',
      marginTop: 13,
    },
    accountEmail: {
      color: theme.textMuted,
      fontSize: 14,
      marginTop: 4,
    },
    accountIdPill: {
      marginTop: 10,
      backgroundColor: theme.accentSoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    accountIdText: {
      color: theme.accent,
      fontSize: 11,
      fontWeight: '800',
    },
    primaryAction: {
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: theme.accent,
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
    },
    primaryActionText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
    },
    dangerAction: {
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: theme.dangerSoft,
      borderWidth: 1,
      borderColor: theme.danger,
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
    },
    dangerActionText: {
      color: theme.danger,
      fontSize: 14,
      fontWeight: '900',
    },
    pageLead: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '900',
      marginBottom: 12,
    },
    themePreview: {
      minHeight: 170,
      borderRadius: 23,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 17,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
      marginBottom: 14,
    },
    previewPhone: {
      width: 88,
      height: 138,
      borderRadius: 20,
      backgroundColor: '#F2F4F8',
      borderWidth: 4,
      borderColor: '#1E2F6D',
      padding: 9,
      justifyContent: 'space-between',
    },
    previewPhoneDark: {
      backgroundColor: '#0B0F2A',
      borderColor: '#7C8CFF',
    },
    previewTop: {
      height: 25,
      borderRadius: 8,
      backgroundColor: '#D9E1ED',
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    previewSquare: {
      width: 25,
      height: 25,
      borderRadius: 8,
      backgroundColor: '#D9E1ED',
    },
    previewLines: {
      flex: 1,
      gap: 5,
    },
    previewLineLong: {
      height: 6,
      borderRadius: 3,
      backgroundColor: '#D9E1ED',
    },
    previewLineShort: {
      width: '65%',
      height: 6,
      borderRadius: 3,
      backgroundColor: '#D9E1ED',
    },
    previewBlockDark: {
      backgroundColor: '#29335F',
    },
    previewButton: {
      height: 18,
      borderRadius: 7,
    },
    themePreviewCopy: {
      flex: 1,
    },
    themePreviewTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '900',
    },
    themePreviewText: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 17,
      marginTop: 5,
    },
    optionList: {
      gap: 10,
    },
    choiceRow: {
      minHeight: 78,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    choiceSelected: {
      borderColor: theme.accent,
      backgroundColor: theme.accentSoft,
    },
    choiceIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    choiceIconSelected: {
      backgroundColor: theme.surface,
    },
    choiceCopy: {
      flex: 1,
    },
    choiceTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '900',
    },
    choiceDescription: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 15,
      marginTop: 3,
    },
    selectionOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectionInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.accent,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      borderRadius: 17,
      padding: 14,
      marginBottom: 14,
      backgroundColor: theme.accentSoft,
    },
    infoBannerText: {
      flex: 1,
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 17,
    },
    languageOption: {
      minHeight: 76,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    languageCodeBox: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    languageCodeText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 0.7,
    },
    faqHero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      borderRadius: 21,
      backgroundColor: theme.primary,
      padding: 16,
      marginBottom: 14,
    },
    faqHeroIcon: {
      width: 52,
      height: 52,
      borderRadius: 17,
      backgroundColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    faqHeroCopy: {
      flex: 1,
    },
    faqHeroTitle: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
    },
    faqHeroText: {
      color: '#DCE6FF',
      fontSize: 12,
      marginTop: 3,
    },
    faqList: {
      gap: 10,
    },
    faqItem: {
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 15,
    },
    faqItemOpen: {
      borderColor: theme.accent,
    },
    faqQuestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    faqQuestion: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '800',
    },
    faqAnswer: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    aboutCard: {
      alignItems: 'center',
      borderRadius: 25,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 22,
    },
    aboutLogoWrap: {
      width: 82,
      height: 82,
      borderRadius: 26,
      backgroundColor: theme.primaryDeep,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 4,
    },
    aboutLogo: {
      width: 55,
      height: 55,
    },
    aboutTitle: {
      color: theme.text,
      fontSize: 21,
      fontWeight: '900',
      marginTop: 15,
    },
    aboutVersion: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: '800',
      marginTop: 5,
    },
    aboutDivider: {
      width: 54,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.accent,
      marginVertical: 16,
    },
    aboutText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 19,
      textAlign: 'center',
    },
    aboutFeatures: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginTop: 17,
    },
    featurePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      backgroundColor: theme.accentSoft,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    featureText: {
      color: theme.text,
      fontSize: 11,
      fontWeight: '800',
    },
    websiteButton: {
      width: '100%',
      minHeight: 51,
      borderRadius: 16,
      backgroundColor: theme.accent,
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
    },
    websiteButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
    },
    rightsText: {
      color: theme.textMuted,
      fontSize: 11,
      lineHeight: 14,
      textAlign: 'center',
      marginTop: 16,
    },
    prosthesisOption: {
      minHeight: 104,
      borderRadius: 21,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 11,
    },
    prosthesisOptionActive: {
      borderColor: theme.accent,
    },
    prosthesisIcon: {
      width: 58,
      height: 58,
      borderRadius: 19,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    prosthesisIconActive: {
      backgroundColor: theme.primary,
    },
    prosthesisCopy: {
      flex: 1,
    },
    prosthesisTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '900',
    },
    prosthesisModel: {
      color: theme.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
    prosthesisStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
    },
    prosthesisDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    prosthesisStatus: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '800',
    },
    addButton: {
      minHeight: 58,
      borderRadius: 18,
      backgroundColor: theme.accent,
      paddingHorizontal: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      marginTop: 3,
    },
    addIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.994 }],
    },
  });
