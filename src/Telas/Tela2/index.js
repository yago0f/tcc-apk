import React, { useMemo } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppSettings } from '../../context/AppSettingsContext';
import { useAuth } from '../../context/AuthContext';

const COPY = {
  pt: {
    hello: 'Olá',
    subtitle: 'Acompanhe o status da sua prótese.',
    qr: 'Meu QR Code',
    prosthesis: 'SUA PRÓTESE',
    connected: 'Conectada',
    disconnected: 'Desconectada',
    model: 'Modelo',
    batteryCharge: 'Carga da bateria',
    charge: 'Coloque para carregar!',
    batteryOk: 'Carga em bom nível',
    details: 'Ver detalhes da prótese',
    dailyUse: 'Uso diário',
    lastUse: 'Último uso',
    connections: 'Conexões',
    personalInfo: 'INFORMAÇÕES PESSOAIS',
    fullName: 'Nome completo',
    birthDate: 'Data de nascimento',
    phone: 'Telefone',
    email: 'E-mail',
    quickActions: 'AÇÕES RÁPIDAS',
    settings: 'Configurações',
    settingsDescription: 'Personalize o app',
    logout: 'Sair da conta',
    logoutDescription: 'Encerrar sessão',
    notifications: 'Notificações',
    noNotifications: 'Você não possui novas notificações.',
    qrTitle: 'QR Code do usuário',
    qrMessage: 'O QR Code poderá ser vinculado ao cadastro do usuário na versão final.',
  },
  en: {
    hello: 'Hello',
    subtitle: 'Track the status of your prosthesis.',
    qr: 'My QR Code',
    prosthesis: 'YOUR PROSTHESIS',
    connected: 'Connected',
    disconnected: 'Disconnected',
    model: 'Model',
    batteryCharge: 'Battery charge',
    charge: 'Time to recharge!',
    batteryOk: 'Battery level is good',
    details: 'View prosthesis details',
    dailyUse: 'Daily use',
    lastUse: 'Last use',
    connections: 'Connections',
    personalInfo: 'PERSONAL INFORMATION',
    fullName: 'Full name',
    birthDate: 'Date of birth',
    phone: 'Phone',
    email: 'Email',
    quickActions: 'QUICK ACTIONS',
    settings: 'Settings',
    settingsDescription: 'Customize the app',
    logout: 'Log out',
    logoutDescription: 'End session',
    notifications: 'Notifications',
    noNotifications: 'You have no new notifications.',
    qrTitle: 'User QR Code',
    qrMessage: 'The QR Code can be linked to the user account in the final version.',
  },
  es: {
    hello: 'Hola',
    subtitle: 'Acompaña el estado de tu prótesis.',
    qr: 'Mi QR Code',
    prosthesis: 'TU PRÓTESIS',
    connected: 'Conectada',
    disconnected: 'Desconectada',
    model: 'Modelo',
    batteryCharge: 'Carga de batería',
    charge: '¡Ponla a cargar!',
    batteryOk: 'Nivel de batería adecuado',
    details: 'Ver detalles de la prótesis',
    dailyUse: 'Uso diario',
    lastUse: 'Último uso',
    connections: 'Conexiones',
    personalInfo: 'INFORMACIÓN PERSONAL',
    fullName: 'Nombre completo',
    birthDate: 'Fecha de nacimiento',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    quickActions: 'ACCIONES RÁPIDAS',
    settings: 'Configuración',
    settingsDescription: 'Personaliza la app',
    logout: 'Cerrar sesión',
    logoutDescription: 'Finalizar sesión',
    notifications: 'Notificaciones',
    noNotifications: 'No tienes nuevas notificaciones.',
    qrTitle: 'QR Code del usuario',
    qrMessage: 'El QR Code podrá vincularse al registro del usuario en la versión final.',
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function Tela2({ navigation }) {
  const { width } = useWindowDimensions();
  const { language, theme, t } = useAppSettings();
  const { user, signOut } = useAuth();

  const styles = useMemo(() => createStyles(theme), [theme]);
  const copy = COPY[language] || COPY.pt;
  const compact = width < 390;
  const isWide = width >= 720;

  // DADOS DO USUÁRIO CONTINUAM VINDO DO LOGIN/PHP PELO AuthContext.
  const fullName = user?.nome_usuario || t('profile.defaultUser');
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  const email = user?.email_usuario || t('profile.notInformed');
  const phone = user?.telefone_usuario || t('profile.notInformed');
  const userIdNumber = String(user?.id_usuario || 0).padStart(6, '0');
  const userId = `#L${userIdNumber}`;

  const birthDate = user?.data_nascimento
    ? new Date(`${user.data_nascimento}T00:00:00`).toLocaleDateString(
        language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR',
      )
    : t('profile.notInformed');

  // Esses fallbacks mantêm a tela funcionando com o backend atual.
  // Se o PHP passar esses campos futuramente, a tela os usa automaticamente.
  const prosthesisName = user?.nome_protese || t('profile.prosthesisName');
  const prosthesisModel = user?.modelo_protese || t('profile.model');
  const battery = clamp(Number(user?.bateria_protese ?? 25) || 0, 0, 100);
  const statusValue = String(user?.status_protese ?? 'conectada').toLowerCase();
  const isConnected = !['desconectada', 'disconnected', 'offline', '0', 'false'].includes(
    statusValue,
  );

  function openSettings() {
    navigation.navigate('Settings');
  }

  function openConnection() {
    navigation.navigate('Connections');
  }

  function showNotifications() {
    Alert.alert(copy.notifications, copy.noNotifications);
  }

  function showQrCode() {
    Alert.alert(copy.qrTitle, `${copy.qrMessage}\n\n${userId}`);
  }

  async function performLogout() {
    await signOut();

    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Principal' }],
    });
  }

  function logout() {
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window === 'undefined'
          ? true
          : window.confirm(`${t('profile.logoutTitle')}\n\n${t('profile.logoutMessage')}`);

      if (confirmed) performLogout();
      return;
    }

    Alert.alert(t('profile.logoutTitle'), t('profile.logoutMessage'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: performLogout,
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        showsVerticalScrollIndicator={false}
      >
        {/* CABEÇALHO */}
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={[styles.greeting, compact && styles.greetingCompact]}>
              {copy.hello},{' '}
              <Text style={styles.greetingName}>{firstName}!</Text>
            </Text>
            <Text style={styles.greetingSubtitle}>{copy.subtitle}</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={showNotifications}
              style={({ pressed }) => [styles.headerCircleLight, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={copy.notifications}
            >
              <Ionicons name="notifications-outline" size={24} color={theme.text} />
              <View style={styles.notificationDot} />
            </Pressable>

            <Pressable
              onPress={openSettings}
              style={({ pressed }) => [styles.headerCircleBlue, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={copy.settings}
            >
              <Ionicons name="person-outline" size={27} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* CARTÃO DO USUÁRIO */}
        <View style={styles.identityCard}>
          <View style={styles.identityGlowOne} />
          <View style={styles.identityGlowTwo} />

          <View style={styles.avatarArea}>
            <View style={styles.avatarOuter}>
              <Image
                source={require('../../../assets/icone.png')}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>

            <Pressable
              onPress={openSettings}
              style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed]}
            >
              <Ionicons name="camera-outline" size={19} color="#1557D9" />
            </Pressable>
          </View>

          <View style={styles.identityInfo}>
            <Text style={styles.identityName} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.identityEmail} numberOfLines={1}>
              {email}
            </Text>

            <View style={styles.identityIdPill}>
              <Text style={styles.identityIdLabel}>{t('profile.userIdPrefix')}:</Text>
              <Text style={styles.identityIdValue}>{userId}</Text>
            </View>
          </View>

          <View style={styles.identityDivider} />

          <Pressable
            onPress={showQrCode}
            style={({ pressed }) => [styles.qrArea, pressed && styles.pressed]}
          >
            <Ionicons name="qr-code-outline" size={33} color="#FFFFFF" />
            <View style={styles.qrTextRow}>
              <Text style={styles.qrText}>{copy.qr}</Text>
              <Ionicons name="chevron-forward" size={17} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>

        {/* CARTÃO PRINCIPAL DA PRÓTESE */}
        <View style={styles.prosthesisCard}>
          <View style={styles.prosthesisAura} />
          <View style={styles.prosthesisRing} />

          <View style={styles.prosthesisTopRow}>
            <Text style={styles.prosthesisEyebrow}>{copy.prosthesis}</Text>

            <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.connectionDot,
                  !isConnected && { backgroundColor: '#FF5D6C' },
                ]}
              />
              <Text
                style={[
                  styles.connectionText,
                  !isConnected && { color: '#FF7883' },
                ]}
              >
                {isConnected ? copy.connected : copy.disconnected}
              </Text>
            </View>
          </View>

          <View style={styles.prosthesisMainRow}>
            <View style={styles.prosthesisCopyArea}>
              <Text style={[styles.prosthesisName, compact && styles.prosthesisNameCompact]}>
                {prosthesisName}
              </Text>

              <Text style={styles.prosthesisModel}>
                {copy.model}: {prosthesisModel.replace(/^Modelo:\s*/i, '')}
              </Text>

              <View style={styles.batteryRow}>
                <View style={styles.batteryIconWrap}>
                  <Ionicons name="battery-half-outline" size={28} color="#56A1FF" />
                </View>
                <View>
                  <Text style={styles.batteryValue}>{battery}%</Text>
                  <Text style={styles.batteryCaption}>{copy.batteryCharge}</Text>
                </View>
              </View>

              <View style={styles.batteryTrack}>
                <View style={[styles.batteryFill, { width: `${battery}%` }]} />
              </View>

              <View style={styles.chargeRow}>
                <Ionicons
                  name={battery <= 30 ? 'flash' : 'checkmark-circle'}
                  size={19}
                  color="#3E8CFF"
                />
                <Text style={styles.chargeText}>
                  {battery <= 30 ? copy.charge : copy.batteryOk}
                </Text>
              </View>
            </View>

            <View style={styles.prosthesisImageArea}>
              <Image
                source={require('../../../assets/protese_PRO.png')}
                style={styles.prosthesisImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <Pressable
            onPress={openConnection}
            style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]}
          >
            <View style={styles.detailsLeft}>
              <Ionicons name="information-circle-outline" size={24} color="#58A5FF" />
              <Text style={styles.detailsText}>{copy.details}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ESTATÍSTICAS */}
        <View style={styles.statsGrid}>
          <StatCard
            theme={theme}
            styles={styles}
            icon="time-outline"
            title={copy.dailyUse}
            value={t('profile.minutes')}
            chart="line"
          />

          <StatCard
            theme={theme}
            styles={styles}
            icon="calendar-outline"
            title={copy.lastUse}
            value={t('profile.todayAt')}
            chart="bars"
          />

          <StatCard
            theme={theme}
            styles={styles}
            icon="trending-up-outline"
            title={copy.connections}
            value={t('profile.connectionsCount')}
            chart="line2"
          />
        </View>

        {/* INFORMAÇÕES PESSOAIS */}
        <View style={styles.personalCard}>
          <Text style={styles.sectionEyebrow}>{copy.personalInfo}</Text>

          <View style={styles.personalGrid}>
            <PersonalInfoItem
              styles={styles}
              icon="person-outline"
              label={copy.fullName}
              value={fullName}
            />

            <PersonalInfoItem
              styles={styles}
              icon="calendar-outline"
              label={copy.birthDate}
              value={birthDate}
            />

            <PersonalInfoItem
              styles={styles}
              icon="call-outline"
              label={copy.phone}
              value={phone}
            />

            <PersonalInfoItem
              styles={styles}
              icon="mail-outline"
              label={copy.email}
              value={email}
            />
          </View>
        </View>

        {/* AÇÕES RÁPIDAS */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.sectionEyebrow}>{copy.quickActions}</Text>

          <View style={styles.quickActionsRow}>
            <Pressable
              onPress={openSettings}
              style={({ pressed }) => [styles.quickSettings, pressed && styles.pressed]}
            >
              <View style={styles.quickWhiteIcon}>
                <Ionicons name="settings-outline" size={25} color="#0C2B5A" />
              </View>

              <View style={styles.quickCopy}>
                <Text style={styles.quickSettingsTitle}>{copy.settings}</Text>
                <Text style={styles.quickSettingsSubtitle}>{copy.settingsDescription}</Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={logout}
              style={({ pressed }) => [styles.quickLogout, pressed && styles.pressed]}
            >
              <View style={styles.quickWhiteIcon}>
                <Ionicons name="log-out-outline" size={25} color="#081B3A" />
              </View>

              <View style={styles.quickCopy}>
                <Text style={styles.quickLogoutTitle}>{copy.logout}</Text>
                <Text style={styles.quickLogoutSubtitle}>{copy.logoutDescription}</Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, title, value, chart, styles }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={22} color="#1160E8" />
      </View>

      <Text style={styles.statTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>

      <View style={styles.chartArea}>
        {chart === 'bars' ? (
          <MiniBars styles={styles} />
        ) : (
          <MiniLine styles={styles} alternate={chart === 'line2'} />
        )}
      </View>
    </View>
  );
}

function MiniBars({ styles }) {
  const bars = [9, 17, 12, 8, 10, 26, 17, 14, 10, 8, 17, 13, 18, 11, 9];

  return (
    <View style={styles.miniBars}>
      {bars.map((height, index) => (
        <View key={`${height}-${index}`} style={[styles.miniBar, { height }]} />
      ))}
    </View>
  );
}

function MiniLine({ styles, alternate }) {
  const values = alternate
    ? [20, 14, 11, 15, 20, 17, 14, 22, 28]
    : [12, 17, 13, 19, 10, 16, 20, 15, 22, 15, 24];

  return (
    <View style={styles.miniLineWrap}>
      <View style={styles.miniLineGuide} />
      <View style={styles.miniLinePoints}>
        {values.map((value, index) => (
          <View
            key={`${value}-${index}`}
            style={[
              styles.miniPoint,
              {
                marginTop: 30 - value,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function PersonalInfoItem({ icon, label, value, styles }) {
  return (
    <View style={styles.personalItem}>
      <View style={styles.personalIcon}>
        <Ionicons name={icon} size={21} color="#0C2046" />
      </View>

      <View style={styles.personalCopy}>
        <Text style={styles.personalLabel}>{label}</Text>
        <Text style={styles.personalValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme) => {
  const dark = theme.mode === 'dark';
  const pageBackground = dark ? theme.background : '#F5F8FF';
  const whiteCard = dark ? theme.surface : '#FFFFFF';
  const cardBorder = dark ? theme.border : '#EDF1F8';
  const mainText = dark ? theme.text : '#081B3A';
  const mutedText = dark ? theme.textMuted : '#637397';

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: pageBackground,
    },
    container: {
      flex: 1,
      backgroundColor: pageBackground,
    },
    content: {
      width: '100%',
      maxWidth: 860,
      alignSelf: 'center',
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 34,
    },
    contentWide: {
      paddingHorizontal: 26,
    },

    heroHeader: {
      minHeight: 104,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
      marginBottom: 13,
      paddingHorizontal: 4,
    },
    heroCopy: {
      flex: 1,
    },
    greeting: {
      color: mainText,
      fontSize: 31,
      lineHeight: 37,
      fontWeight: '900',
      letterSpacing: -0.9,
    },
    greetingCompact: {
      fontSize: 28,
      lineHeight: 34,
    },
    greetingName: {
      color: '#1260E8',
    },
    greetingSubtitle: {
      color: mutedText,
      fontSize: 14,
      marginTop: 5,
      lineHeight: 20,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    headerCircleLight: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: dark ? theme.surface : '#F1F4FA',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    notificationDot: {
      position: 'absolute',
      right: 7,
      top: 7,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#1260E8',
      borderWidth: 2,
      borderColor: dark ? theme.surface : '#F1F4FA',
    },
    headerCircleBlue: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#0E56DC',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#0E56DC',
      shadowOpacity: 0.24,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },

    identityCard: {
      minHeight: 142,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: 14,
      backgroundColor: '#0E4CC7',
      shadowColor: '#0D46B3',
      shadowOpacity: 0.18,
      shadowRadius: 17,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
    identityGlowOne: {
      position: 'absolute',
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: 'rgba(39, 103, 255, 0.58)',
      left: -80,
      top: -100,
    },
    identityGlowTwo: {
      position: 'absolute',
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: 'rgba(0, 34, 121, 0.35)',
      right: -35,
      bottom: -95,
    },
    avatarArea: {
      width: 82,
      height: 82,
      marginRight: 15,
      position: 'relative',
    },
    avatarOuter: {
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.76)',
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    cameraButton: {
      position: 'absolute',
      right: -1,
      bottom: -1,
      width: 31,
      height: 31,
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#DFE8FA',
    },
    identityInfo: {
      flex: 1,
      minWidth: 0,
      paddingRight: 12,
    },
    identityName: {
      color: '#FFFFFF',
      fontSize: 19,
      fontWeight: '900',
      letterSpacing: -0.2,
    },
    identityEmail: {
      color: '#CFDDFF',
      fontSize: 14,
      marginTop: 5,
    },
    identityIdPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.24)',
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 6,
      marginTop: 10,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    identityIdLabel: {
      color: '#CCDAFF',
      fontSize: 12,
      fontWeight: '600',
    },
    identityIdValue: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
    identityDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: 'stretch',
      marginVertical: 7,
      backgroundColor: 'rgba(255,255,255,0.23)',
    },
    qrArea: {
      width: 96,
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: 12,
      gap: 10,
    },
    qrTextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    qrText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },

    prosthesisCard: {
      borderRadius: 24,
      backgroundColor: '#061A38',
      padding: 18,
      overflow: 'hidden',
      marginBottom: 14,
      shadowColor: '#07172E',
      shadowOpacity: 0.23,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 9 },
      elevation: 6,
    },
    prosthesisAura: {
      position: 'absolute',
      width: 270,
      height: 270,
      borderRadius: 135,
      backgroundColor: 'rgba(0, 84, 201, 0.22)',
      right: -95,
      top: -20,
    },
    prosthesisRing: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 80,
      borderWidth: 5,
      borderColor: 'rgba(14, 92, 218, 0.28)',
      right: 5,
      top: 73,
    },
    prosthesisTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      zIndex: 2,
    },
    prosthesisEyebrow: {
      color: '#F1F5FF',
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    connectionDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#65E548',
    },
    connectionText: {
      color: '#69EF49',
      fontSize: 14,
      fontWeight: '700',
    },
    prosthesisMainRow: {
      flexDirection: 'row',
      minHeight: 205,
      marginTop: 12,
      zIndex: 2,
    },
    prosthesisCopyArea: {
      flex: 1.12,
      paddingLeft: 3,
      paddingTop: 4,
      zIndex: 3,
    },
    prosthesisName: {
      color: '#FFFFFF',
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '900',
      letterSpacing: -0.6,
    },
    prosthesisNameCompact: {
      fontSize: 25,
      lineHeight: 31,
    },
    prosthesisModel: {
      color: '#AFC1E4',
      fontSize: 14,
      marginTop: 7,
    },
    batteryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 19,
    },
    batteryIconWrap: {
      width: 34,
      alignItems: 'center',
    },
    batteryValue: {
      color: '#FFFFFF',
      fontSize: 21,
      fontWeight: '900',
    },
    batteryCaption: {
      color: '#B6C5DF',
      fontSize: 12,
      marginTop: 1,
    },
    batteryTrack: {
      width: '92%',
      height: 10,
      borderRadius: 8,
      backgroundColor: '#263753',
      overflow: 'hidden',
      marginTop: 14,
    },
    batteryFill: {
      height: '100%',
      borderRadius: 8,
      backgroundColor: '#126DFF',
    },
    chargeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    chargeText: {
      color: '#56A0FF',
      fontSize: 14,
      fontWeight: '600',
    },
    prosthesisImageArea: {
      flex: 0.88,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -3,
      marginTop: 9,
    },
    prosthesisImage: {
      width: '125%',
      height: 206,
      transform: [{ rotate: '4deg' }],
    },
    detailsButton: {
      minHeight: 51,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(182, 206, 255, 0.17)',
      backgroundColor: 'rgba(255,255,255,0.045)',
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 4,
    },
    detailsButtonPressed: {
      backgroundColor: 'rgba(255,255,255,0.09)',
    },
    detailsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    detailsText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },

    statsGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    statCard: {
      flex: 1,
      minWidth: 0,
      minHeight: 142,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 13,
      backgroundColor: whiteCard,
      borderWidth: 1,
      borderColor: cardBorder,
      shadowColor: '#31538D',
      shadowOpacity: dark ? 0.12 : 0.07,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    statIcon: {
      width: 31,
      height: 31,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: dark ? theme.primarySoft : '#EAF2FF',
      marginBottom: 8,
    },
    statTitle: {
      color: mainText,
      fontSize: 12,
      fontWeight: '600',
    },
    statValue: {
      color: mainText,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: '900',
      marginTop: 3,
    },
    chartArea: {
      height: 35,
      marginTop: 8,
      justifyContent: 'flex-end',
    },
    miniBars: {
      height: 32,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 2,
    },
    miniBar: {
      flex: 1,
      maxWidth: 5,
      borderRadius: 2,
      backgroundColor: '#8EB5FF',
    },
    miniLineWrap: {
      height: 32,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    miniLineGuide: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 8,
      height: 2,
      backgroundColor: '#DCE7FB',
      transform: [{ rotate: '-3deg' }],
    },
    miniLinePoints: {
      height: 32,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    miniPoint: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#1260E8',
    },

    personalCard: {
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 9,
      backgroundColor: whiteCard,
      borderWidth: 1,
      borderColor: cardBorder,
      marginBottom: 14,
      shadowColor: '#31538D',
      shadowOpacity: dark ? 0.12 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },
    sectionEyebrow: {
      color: '#0D57DD',
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 0.2,
      marginBottom: 10,
    },
    personalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    personalItem: {
      width: '50%',
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingRight: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: cardBorder,
    },
    personalIcon: {
      width: 37,
      height: 37,
      borderRadius: 19,
      backgroundColor: dark ? theme.surfaceAlt : '#F1F4FA',
      alignItems: 'center',
      justifyContent: 'center',
    },
    personalCopy: {
      flex: 1,
      minWidth: 0,
    },
    personalLabel: {
      color: mutedText,
      fontSize: 11,
      lineHeight: 12,
    },
    personalValue: {
      color: mainText,
      fontSize: 13,
      lineHeight: 15,
      fontWeight: '800',
      marginTop: 3,
    },

    quickActionsCard: {
      borderRadius: 22,
      padding: 15,
      backgroundColor: whiteCard,
      borderWidth: 1,
      borderColor: cardBorder,
      shadowColor: '#31538D',
      shadowOpacity: dark ? 0.12 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    quickSettings: {
      flex: 1,
      minHeight: 72,
      borderRadius: 18,
      backgroundColor: '#0E58E6',
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      overflow: 'hidden',
    },
    quickLogout: {
      flex: 1,
      minHeight: 72,
      borderRadius: 18,
      backgroundColor: '#061A38',
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      overflow: 'hidden',
    },
    quickWhiteIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    quickCopy: {
      flex: 1,
      minWidth: 0,
    },
    quickSettingsTitle: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },
    quickSettingsSubtitle: {
      color: '#D1E0FF',
      fontSize: 11,
      marginTop: 3,
    },
    quickLogoutTitle: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },
    quickLogoutSubtitle: {
      color: '#B9C5DA',
      fontSize: 11,
      marginTop: 3,
    },

    pressed: {
      opacity: 0.74,
      transform: [{ scale: 0.992 }],
    },
  });
};
