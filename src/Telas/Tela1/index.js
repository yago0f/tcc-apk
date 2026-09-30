import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useBluetooth } from '../../context/BluetoothContext';

export default function Tela1() {
  const { theme, t } = useAppSettings();
  const bluetooth = useBluetooth();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const handledCommandErrorRef = useRef(null);

  useEffect(() => {
    // Ask for Bluetooth access only when the user actually opens the
    // Connection screen. This keeps login/cadastro independent from hardware.
    bluetooth.refreshPairedDevices();
  }, [bluetooth.refreshPairedDevices]);

  const filteredDevices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return bluetooth.pairedDevices;

    return bluetooth.pairedDevices.filter((device) => {
      const name = String(device?.name || '').toLowerCase();
      const address = String(device?.address || device?.id || '').toLowerCase();
      return name.includes(normalizedQuery) || address.includes(normalizedQuery);
    });
  }, [bluetooth.pairedDevices, query]);

  const preferredIsPaired = useMemo(
    () =>
      Boolean(
        bluetooth.preferredDevice &&
          bluetooth.pairedDevices.some((device) =>
            bluetooth.isSameDevice(device, bluetooth.preferredDevice),
          ),
      ),
    [bluetooth],
  );

  useEffect(() => {
    const error = bluetooth.lastError;
    if (!error || error.scope !== 'command') return;

    if (handledCommandErrorRef.current === error) return;
    handledCommandErrorRef.current = error;

    const message =
      error.action === 'open'
        ? t('connections.failureOpen')
        : t('connections.failureClose');

    Alert.alert(t('connections.failureTitle'), message, [
      { text: t('connections.failureAcknowledge') },
    ]);
  }, [bluetooth.lastError, t]);

  function getDeviceName(device) {
    return device?.name || t('connections.unnamedDevice');
  }

  function getDeviceAddress(device) {
    return device?.address || device?.id || t('connections.unknownAddress');
  }

  function isPreferred(device) {
    return bluetooth.isSameDevice(device, bluetooth.preferredDevice);
  }

  function isConnected(device) {
    return bluetooth.isSameDevice(device, bluetooth.connectedDevice);
  }

  function renderEnvironmentState() {
    if (
      bluetooth.isInitializing ||
      (bluetooth.isRefreshing && bluetooth.permissionState === 'unknown')
    ) {
      return (
        <StateCard
          icon="bluetooth-outline"
          theme={theme}
          styles={styles}
          title={t('connections.initializingTitle')}
          text={t('connections.initializingText')}
        />
      );
    }

    if (!bluetooth.supported) {
      return (
        <StateCard
          icon="logo-android"
          theme={theme}
          styles={styles}
          title={t('connections.androidOnlyTitle')}
          text={t('connections.androidOnlyText')}
        />
      );
    }

    if (!bluetooth.nativeModuleReady) {
      return (
        <StateCard
          icon="construct-outline"
          theme={theme}
          styles={styles}
          title={t('connections.developmentBuildTitle')}
          text={t('connections.developmentBuildText')}
        />
      );
    }

    if (bluetooth.permissionState === 'denied') {
      return (
        <StateCard
          icon="shield-checkmark-outline"
          theme={theme}
          styles={styles}
          title={t('connections.permissionTitle')}
          text={t('connections.permissionText')}
          actionLabel={t('connections.tryPermissionAgain')}
          onAction={bluetooth.refreshPairedDevices}
        />
      );
    }

    if (!bluetooth.bluetoothEnabled) {
      return (
        <StateCard
          icon="bluetooth-outline"
          theme={theme}
          styles={styles}
          title={t('connections.bluetoothOffTitle')}
          text={t('connections.bluetoothOffText')}
          actionLabel={t('connections.openBluetoothSettings')}
          onAction={bluetooth.openSettings}
        />
      );
    }

    return null;
  }

  const environmentState = renderEnvironmentState();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('connections.title')}</Text>
            <Text style={styles.subtitle}>{t('connections.subtitle')}</Text>
          </View>
          <View
            style={[
              styles.headerStatus,
              bluetooth.connectionState === 'connected' && styles.headerStatusConnected,
            ]}
          >
            <Ionicons
              name={bluetooth.connectionState === 'connected' ? 'bluetooth' : 'bluetooth-outline'}
              size={25}
              color={
                bluetooth.connectionState === 'connected'
                  ? theme.success
                  : theme.accent
              }
            />
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusTopRow}>
            <View style={styles.statusIconWrap}>
              <Ionicons name="bluetooth" size={23} color="#FFFFFF" />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusLabel}>{t('connections.bluetooth')}</Text>
              <Text style={styles.statusValue}>
                {bluetooth.bluetoothEnabled
                  ? t('connections.bluetoothOn')
                  : t('connections.bluetoothOff')}
              </Text>
            </View>
            {bluetooth.isInitializing ? (
              <ActivityIndicator color={theme.accent} />
            ) : (
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: bluetooth.bluetoothEnabled
                      ? theme.success
                      : theme.textMuted,
                  },
                ]}
              />
            )}
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusMetaRow}>
            <Ionicons name="hand-left-outline" size={17} color={theme.textMuted} />
            <Text style={styles.statusMetaText}>{t('connections.manualConnectionNote')}</Text>
          </View>
        </View>

        {environmentState}

        {!environmentState && bluetooth.connectedDevice ? (
          <ControlPanel
            theme={theme}
            styles={styles}
            t={t}
            device={bluetooth.connectedDevice}
            handState={bluetooth.handState}
            lastAction={bluetooth.lastAction}
            connectionState={bluetooth.connectionState}
            onOpen={bluetooth.openHand}
            onClose={bluetooth.closeHand}
            onDisconnect={bluetooth.disconnect}
          />
        ) : null}

        {!environmentState ? (
          <>
            <View style={[styles.sectionHeader, bluetooth.connectedDevice && styles.sectionHeaderAfterControl]}>
              <View>
                <Text style={styles.sectionEyebrow}>{t('connections.devicesEyebrow')}</Text>
                <Text style={styles.sectionTitle}>{t('connections.pairedDevices')}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('connections.refresh')}
                disabled={bluetooth.isRefreshing}
                onPress={bluetooth.refreshPairedDevices}
                style={({ pressed }) => [
                  styles.refreshButton,
                  pressed && styles.pressed,
                  bluetooth.isRefreshing && styles.disabled,
                ]}
              >
                {bluetooth.isRefreshing ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                  <Ionicons name="refresh" size={20} color={theme.accent} />
                )}
                <Text style={styles.refreshText}>{t('connections.refresh')}</Text>
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color={theme.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('connections.searchPlaceholder')}
                placeholderTextColor={theme.textMuted}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={10}>
                  <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                </Pressable>
              ) : null}
            </View>

            {bluetooth.preferredDevice && !preferredIsPaired ? (
              <View style={styles.preferredUnavailableCard}>
                <View style={styles.preferredUnavailableIcon}>
                  <Ionicons name="star" size={20} color={theme.warning} />
                </View>
                <View style={styles.preferredUnavailableCopy}>
                  <Text style={styles.preferredUnavailableTitle}>
                    {getDeviceName(bluetooth.preferredDevice)}
                  </Text>
                  <Text style={styles.preferredUnavailableText}>
                    {t('connections.preferredUnavailableText')}
                  </Text>
                </View>
                <Pressable
                  onPress={bluetooth.clearPreferredDevice}
                  hitSlop={10}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.textMuted} />
                </Pressable>
              </View>
            ) : null}

            {bluetooth.isRefreshing && bluetooth.pairedDevices.length === 0 ? (
              <View style={styles.loadingDevices}>
                <ActivityIndicator color={theme.accent} />
                <Text style={styles.loadingDevicesText}>
                  {t('connections.loadingPaired')}
                </Text>
              </View>
            ) : null}

            {!bluetooth.isRefreshing && bluetooth.pairedDevices.length === 0 ? (
              <StateCard
                icon="link-outline"
                theme={theme}
                styles={styles}
                title={t('connections.noPairedTitle')}
                text={t('connections.noPairedText')}
                actionLabel={t('connections.openBluetoothSettings')}
                onAction={bluetooth.openSettings}
              />
            ) : null}

            {bluetooth.pairedDevices.length > 0 && filteredDevices.length === 0 ? (
              <StateCard
                icon="search-outline"
                theme={theme}
                styles={styles}
                title={t('connections.noResultTitle')}
                text={t('connections.noResultText')}
              />
            ) : null}

            <View style={styles.deviceList}>
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={getDeviceAddress(device)}
                  device={device}
                  preferred={isPreferred(device)}
                  recommended={bluetooth.isHC05Device(device)}
                  connected={isConnected(device)}
                  connecting={
                    bluetooth.connectionState === 'connecting' &&
                    String(bluetooth.connectingDeviceAddress || '').toUpperCase() ===
                      String(getDeviceAddress(device)).toUpperCase()
                  }
                  busy={
                    bluetooth.connectionState === 'connecting' ||
                    bluetooth.connectionState === 'disconnecting'
                  }
                  theme={theme}
                  styles={styles}
                  t={t}
                  onConnect={() => bluetooth.connect(device)}
                  onDisconnect={bluetooth.disconnect}
                  onPrefer={() => bluetooth.setPreferredDevice(device)}
                />
              ))}
            </View>
          </>
        ) : null}

        {bluetooth.lastError && bluetooth.lastError.scope !== 'command' ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={21} color={theme.danger} />
            <View style={styles.errorBannerCopy}>
              <Text style={styles.errorBannerTitle}>{t('connections.connectionIssue')}</Text>
              <Text style={styles.errorBannerText}>
                {getErrorMessage(bluetooth.lastError, t)}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DeviceCard({
  device,
  preferred,
  recommended,
  connected,
  connecting,
  busy,
  theme,
  styles,
  t,
  onConnect,
  onDisconnect,
  onPrefer,
}) {
  const name = device?.name || t('connections.unnamedDevice');
  const address = device?.address || device?.id || t('connections.unknownAddress');

  return (
    <View
      style={[
        styles.deviceCard,
        preferred && styles.deviceCardPreferred,
        connected && styles.deviceCardConnected,
      ]}
    >
      <View style={styles.deviceTopRow}>
        <View
          style={[
            styles.deviceIcon,
            recommended && styles.deviceIconRecommended,
            connected && styles.deviceIconConnected,
          ]}
        >
          <Ionicons
            name={recommended ? 'hardware-chip-outline' : 'bluetooth-outline'}
            size={24}
            color={connected ? theme.success : recommended ? theme.accent : theme.primary}
          />
        </View>
        <View style={styles.deviceCopy}>
          <View style={styles.deviceNameRow}>
            <Text style={styles.deviceName} numberOfLines={1}>{name}</Text>
            {connected ? <View style={styles.onlineDot} /> : null}
          </View>
          <Text style={styles.deviceAddress}>{address}</Text>
        </View>
      </View>

      <View style={styles.badgesRow}>
        {preferred ? (
          <View style={[styles.badge, styles.preferredBadge]}>
            <Ionicons name="star" size={13} color={theme.warning} />
            <Text style={[styles.badgeText, { color: theme.warning }]}>
              {t('connections.preferred')}
            </Text>
          </View>
        ) : null}
        {recommended ? (
          <View style={[styles.badge, styles.recommendedBadge]}>
            <Ionicons name="checkmark-circle" size={13} color={theme.accent} />
            <Text style={[styles.badgeText, { color: theme.accent }]}>
              {t('connections.recommended')}
            </Text>
          </View>
        ) : null}
        {connected ? (
          <View style={[styles.badge, styles.connectedBadge]}>
            <Ionicons name="radio-button-on" size={12} color={theme.success} />
            <Text style={[styles.badgeText, { color: theme.success }]}>
              {t('connections.connectedNow')}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.deviceActions}>
        {!preferred ? (
          <Pressable
            disabled={busy}
            onPress={onPrefer}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="star-outline" size={18} color={theme.accent} />
            <Text style={styles.secondaryButtonText}>{t('connections.makePreferred')}</Text>
          </Pressable>
        ) : (
          <View style={styles.preferredInfo}>
            <Ionicons name="bookmark" size={17} color={theme.warning} />
            <Text style={styles.preferredInfoText}>{t('connections.preferredSaved')}</Text>
          </View>
        )}

        <Pressable
          disabled={busy}
          onPress={connected ? onDisconnect : onConnect}
          style={({ pressed }) => [
            styles.primaryButton,
            connected && styles.disconnectButton,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}
        >
          {connecting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name={connected ? 'close-circle-outline' : 'link-outline'}
              size={19}
              color="#FFFFFF"
            />
          )}
          <Text style={styles.primaryButtonText}>
            {connecting
              ? t('connections.connecting')
              : connected
                ? t('connections.disconnect')
                : t('connections.connect')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ControlPanel({
  theme,
  styles,
  t,
  device,
  handState,
  lastAction,
  connectionState,
  onOpen,
  onClose,
  onDisconnect,
}) {
  const controlsEnabled = connectionState === 'connected';
  const stateLabel =
    handState === 'open'
      ? t('connections.handOpen')
      : handState === 'closed'
        ? t('connections.handClosed')
        : t('connections.handUnknown');

  const actionLabel =
    lastAction === 'open'
      ? t('connections.actionOpen')
      : lastAction === 'close'
        ? t('connections.actionClose')
        : t('connections.noAction');

  return (
    <View style={styles.controlCard}>
      <View style={styles.controlHeader}>
        <View>
          <Text style={styles.controlEyebrow}>{t('connections.controlEyebrow')}</Text>
          <Text style={styles.controlTitle}>{t('connections.controlTitle')}</Text>
          <Text style={styles.controlSubtitle}>
            {device?.name || t('connections.unnamedDevice')}
          </Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{t('connections.connectedNow')}</Text>
        </View>
      </View>

      <View style={styles.handStateBox}>
        <View style={styles.handStateIcon}>
          <Ionicons
            name={handState === 'closed' ? 'lock-closed-outline' : 'hand-left-outline'}
            size={28}
            color={theme.accent}
          />
        </View>
        <View style={styles.handStateCopy}>
          <Text style={styles.handStateLabel}>{t('connections.handState')}</Text>
          <Text style={styles.handStateValue}>{stateLabel}</Text>
        </View>
        <View style={styles.lastActionBox}>
          <Text style={styles.lastActionLabel}>{t('connections.lastAction')}</Text>
          <Text style={styles.lastActionValue}>{actionLabel}</Text>
        </View>
      </View>

      <View style={styles.controlButtonsRow}>
        <Pressable
          disabled={!controlsEnabled}
          onPress={onOpen}
          style={({ pressed }) => [
            styles.motionButton,
            styles.openButton,
            pressed && styles.motionButtonPressed,
            !controlsEnabled && styles.disabled,
          ]}
        >
          <View style={styles.motionIconWrap}>
            <Ionicons name="hand-left-outline" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.motionButtonTitle}>{t('connections.openHand')}</Text>
          <Text style={styles.motionButtonMeta}>{t('connections.openPosition')}</Text>
        </Pressable>

        <Pressable
          disabled={!controlsEnabled}
          onPress={onClose}
          style={({ pressed }) => [
            styles.motionButton,
            styles.closeButton,
            pressed && styles.motionButtonPressed,
            !controlsEnabled && styles.disabled,
          ]}
        >
          <View style={styles.motionIconWrap}>
            <Ionicons name="lock-closed-outline" size={29} color="#FFFFFF" />
          </View>
          <Text style={styles.motionButtonTitle}>{t('connections.closeHand')}</Text>
          <Text style={styles.motionButtonMeta}>{t('connections.closePosition')}</Text>
        </Pressable>
      </View>

      <View style={styles.optimisticNote}>
        <Ionicons name="flash-outline" size={18} color={theme.warning} />
        <Text style={styles.optimisticNoteText}>{t('connections.optimisticNote')}</Text>
      </View>

      <Pressable
        onPress={onDisconnect}
        style={({ pressed }) => [styles.fullDisconnectButton, pressed && styles.pressed]}
      >
        <Ionicons name="power-outline" size={20} color={theme.danger} />
        <Text style={styles.fullDisconnectText}>{t('connections.disconnect')}</Text>
      </Pressable>
    </View>
  );
}

function StateCard({ icon, title, text, actionLabel, onAction, theme, styles }) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={27} color={theme.accent} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{text}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.stateButton, pressed && styles.pressed]}
        >
          <Text style={styles.stateButtonText}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

function getErrorMessage(error, t) {
  if (error?.code === 'disconnected') return t('connections.connectionLost');
  if (error?.code === 'permission_denied') return t('connections.permissionText');
  if (error?.code === 'bluetooth_off') return t('connections.bluetoothOffText');
  if (error?.scope === 'connect') return t('connections.connectError');
  if (error?.scope === 'preference') return t('connections.preferenceError');
  if (error?.scope === 'disconnect') return t('connections.disconnectError');
  return t('connections.genericBluetoothError');
}

const createStyles = (theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.background },
    container: { flex: 1, backgroundColor: theme.background },
    content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 34 },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
      marginBottom: 18,
    },
    headerCopy: { flex: 1 },
    title: {
      color: theme.text,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '900',
      letterSpacing: -0.6,
    },
    subtitle: {
      color: theme.textMuted,
      fontSize: 15,
      lineHeight: 21,
      marginTop: 4,
    },
    headerStatus: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerStatusConnected: { backgroundColor: theme.successSoft },
    statusCard: {
      borderRadius: 22,
      padding: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
    },
    statusTopRow: { flexDirection: 'row', alignItems: 'center' },
    statusIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 15,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    statusCopy: { flex: 1 },
    statusLabel: { color: theme.textMuted, fontSize: 14, fontWeight: '700' },
    statusValue: { color: theme.text, fontSize: 16, fontWeight: '900', marginTop: 2 },
    statusDot: { width: 11, height: 11, borderRadius: 6 },
    statusDivider: { height: 1, backgroundColor: theme.border, marginVertical: 13 },
    statusMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusMetaText: { flex: 1, color: theme.textMuted, fontSize: 14, lineHeight: 18 },
    sectionHeaderAfterControl: { marginTop: 20 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 3,
      marginBottom: 11,
    },
    sectionEyebrow: {
      color: theme.accent,
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    sectionTitle: { color: theme.text, fontSize: 20, fontWeight: '900', marginTop: 2 },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      minHeight: 42,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    refreshText: { color: theme.accent, fontSize: 14, fontWeight: '800' },
    searchBox: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      paddingHorizontal: 14,
      borderRadius: 17,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 13,
    },
    searchInput: { flex: 1, color: theme.text, fontSize: 15, paddingVertical: 12 },
    deviceList: { gap: 12 },
    deviceCard: {
      borderRadius: 22,
      padding: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOpacity: theme.mode === 'dark' ? 0.14 : 0.06,
      shadowRadius: 11,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },
    deviceCardPreferred: { borderColor: theme.warning, borderWidth: 1.5 },
    deviceCardConnected: { borderColor: theme.success, borderWidth: 1.5 },
    deviceTopRow: { flexDirection: 'row', alignItems: 'center' },
    deviceIcon: {
      width: 50,
      height: 50,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primarySoft,
      marginRight: 12,
    },
    deviceIconRecommended: { backgroundColor: theme.accentSoft },
    deviceIconConnected: { backgroundColor: theme.successSoft },
    deviceCopy: { flex: 1, minWidth: 0 },
    deviceNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    deviceName: { flexShrink: 1, color: theme.text, fontSize: 17, fontWeight: '900' },
    deviceAddress: { color: theme.textMuted, fontSize: 14, marginTop: 4, fontWeight: '600' },
    onlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.success },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 999,
    },
    preferredBadge: { backgroundColor: theme.warningSoft },
    recommendedBadge: { backgroundColor: theme.accentSoft },
    connectedBadge: { backgroundColor: theme.successSoft },
    badgeText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.25 },
    deviceActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 14,
    },
    secondaryButton: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingHorizontal: 10,
    },
    secondaryButtonText: { color: theme.accent, fontSize: 14, fontWeight: '800' },
    preferredInfo: {
      flex: 1,
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 8,
    },
    preferredInfoText: { color: theme.warning, fontSize: 14, fontWeight: '800' },
    primaryButton: {
      minWidth: 122,
      minHeight: 46,
      borderRadius: 14,
      paddingHorizontal: 14,
      backgroundColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
    },
    disconnectButton: { backgroundColor: theme.danger },
    primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
    preferredUnavailableCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      padding: 14,
      borderRadius: 18,
      backgroundColor: theme.warningSoft,
      borderWidth: 1,
      borderColor: theme.warning,
      marginBottom: 12,
    },
    preferredUnavailableIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    preferredUnavailableCopy: { flex: 1 },
    preferredUnavailableTitle: { color: theme.text, fontSize: 15, fontWeight: '900' },
    preferredUnavailableText: { color: theme.textMuted, fontSize: 14, lineHeight: 17, marginTop: 2 },
    loadingDevices: {
      minHeight: 110,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 12,
    },
    loadingDevicesText: { color: theme.textMuted, fontSize: 14, fontWeight: '700' },
    stateCard: {
      borderRadius: 22,
      padding: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      marginBottom: 16,
    },
    stateIcon: {
      width: 58,
      height: 58,
      borderRadius: 20,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    stateTitle: { color: theme.text, fontSize: 17, fontWeight: '900', textAlign: 'center' },
    stateText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: 7,
    },
    stateButton: {
      marginTop: 15,
      minHeight: 48,
      paddingHorizontal: 18,
      borderRadius: 15,
      backgroundColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    stateButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
    controlCard: {
      marginTop: 18,
      borderRadius: 26,
      padding: 18,
      backgroundColor: theme.primaryDeep,
      shadowColor: theme.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    controlHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
    },
    controlEyebrow: {
      color: theme.sky,
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    controlTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 3 },
    controlSubtitle: { color: '#B9C8E8', fontSize: 14, marginTop: 3 },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: 'rgba(95,210,154,0.14)',
    },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5FD29A' },
    liveText: { color: '#86E9B8', fontSize: 13, fontWeight: '900' },
    handStateBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 17,
      padding: 13,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.10)',
    },
    handStateIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(124,140,255,0.16)',
    },
    handStateCopy: { flex: 1 },
    handStateLabel: { color: '#AFC0E2', fontSize: 13, fontWeight: '700' },
    handStateValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginTop: 2 },
    lastActionBox: { alignItems: 'flex-end' },
    lastActionLabel: { color: '#AFC0E2', fontSize: 12, fontWeight: '700' },
    lastActionValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: 2 },
    controlButtonsRow: { flexDirection: 'row', gap: 11, marginTop: 14 },
    motionButton: {
      flex: 1,
      minHeight: 132,
      borderRadius: 22,
      padding: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    openButton: { backgroundColor: '#176BDA' },
    closeButton: { backgroundColor: '#314367' },
    motionButtonPressed: { transform: [{ scale: 0.975 }], opacity: 0.9 },
    motionIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.13)',
      marginBottom: 7,
    },
    motionButtonTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
    motionButtonMeta: { color: '#DCE7FF', fontSize: 14, fontWeight: '700', marginTop: 3 },
    optimisticNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: 14,
      padding: 11,
      borderRadius: 14,
      backgroundColor: 'rgba(243,184,82,0.10)',
    },
    optimisticNoteText: { flex: 1, color: '#D5DFF2', fontSize: 14, lineHeight: 17 },
    fullDisconnectButton: {
      minHeight: 48,
      marginTop: 13,
      borderRadius: 15,
      backgroundColor: 'rgba(255,116,116,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(255,116,116,0.30)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    fullDisconnectText: { color: theme.danger, fontSize: 14, fontWeight: '900' },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginTop: 14,
      padding: 14,
      borderRadius: 17,
      backgroundColor: theme.dangerSoft,
      borderWidth: 1,
      borderColor: theme.danger,
    },
    errorBannerCopy: { flex: 1 },
    errorBannerTitle: { color: theme.danger, fontSize: 14, fontWeight: '900' },
    errorBannerText: { color: theme.text, fontSize: 14, lineHeight: 18, marginTop: 3 },
    pressed: { opacity: 0.74 },
    disabled: { opacity: 0.52 },
  });
