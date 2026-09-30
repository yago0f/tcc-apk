import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

let cachedModule;
let moduleResolved = false;

function resolveBluetoothModule() {
  if (moduleResolved) {
    return cachedModule;
  }

  moduleResolved = true;

  if (Platform.OS !== 'android') {
    cachedModule = null;
    return cachedModule;
  }

  if (!NativeModules?.RNBluetoothClassic) {
    cachedModule = null;
    return cachedModule;
  }

  try {
    const bluetoothPackage = require('react-native-bluetooth-classic');
    const candidate = bluetoothPackage?.default || bluetoothPackage;

    cachedModule =
      candidate && typeof candidate.getBondedDevices === 'function'
        ? candidate
        : null;
  } catch (error) {
    cachedModule = null;
  }

  return cachedModule;
}

export function isNativeBluetoothAvailable() {
  return Boolean(resolveBluetoothModule());
}

export async function requestBluetoothPermission() {
  if (Platform.OS !== 'android') {
    return false;
  }

  const androidVersion = Number(Platform.Version);

  if (!Number.isFinite(androidVersion) || androidVersion < 31) {
    return true;
  }

  const permission =
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT ||
    'android.permission.BLUETOOTH_CONNECT';

  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) {
    return true;
  }

  // Let Android render the standard Nearby devices dialog in the phone's
  // own language instead of hard-coding a custom rationale in one language.
  const result = await PermissionsAndroid.request(permission);

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getBluetoothState() {
  const bluetooth = resolveBluetoothModule();

  if (Platform.OS !== 'android') {
    return {
      supported: false,
      nativeReady: false,
      enabled: false,
    };
  }

  if (!bluetooth) {
    return {
      supported: true,
      nativeReady: false,
      enabled: false,
    };
  }

  const [available, enabled] = await Promise.all([
    typeof bluetooth.isBluetoothAvailable === 'function'
      ? bluetooth.isBluetoothAvailable()
      : Promise.resolve(true),
    bluetooth.isBluetoothEnabled(),
  ]);

  return {
    supported: Boolean(available),
    nativeReady: true,
    enabled: Boolean(enabled),
  };
}

export async function getBondedDevices() {
  const bluetooth = resolveBluetoothModule();

  if (!bluetooth) {
    throw new Error('BLUETOOTH_NATIVE_MODULE_UNAVAILABLE');
  }

  const devices = await bluetooth.getBondedDevices();
  return Array.isArray(devices) ? devices : [];
}

export async function openBluetoothSettings() {
  const bluetooth = resolveBluetoothModule();

  if (!bluetooth) {
    throw new Error('BLUETOOTH_NATIVE_MODULE_UNAVAILABLE');
  }

  if (typeof bluetooth.openBluetoothSettings !== 'function') {
    throw new Error('BLUETOOTH_SETTINGS_UNAVAILABLE');
  }

  return bluetooth.openBluetoothSettings();
}

export async function connectDevice(device) {
  if (!device || typeof device.connect !== 'function') {
    throw new Error('BLUETOOTH_DEVICE_INVALID');
  }

  const connected = await device.connect({
    CONNECTION_TYPE: 'delimited',
    DELIMITER: '\n',
    DEVICE_CHARSET: 'ascii',
  });

  if (!connected) {
    throw new Error('BLUETOOTH_CONNECTION_REJECTED');
  }

  return true;
}

export async function disconnectDevice(device) {
  if (!device || typeof device.disconnect !== 'function') {
    return false;
  }

  return Boolean(await device.disconnect());
}

export async function writeCommand(device, command) {
  if (!device || typeof device.write !== 'function') {
    throw new Error('BLUETOOTH_DEVICE_NOT_CONNECTED');
  }

  if (command !== 'A' && command !== 'C') {
    throw new Error('BLUETOOTH_COMMAND_INVALID');
  }

  const written = await device.write(command, 'ascii');

  if (!written) {
    throw new Error('BLUETOOTH_WRITE_FAILED');
  }

  return true;
}

export function subscribeToAdapterState(listener) {
  const bluetooth = resolveBluetoothModule();

  if (!bluetooth || typeof listener !== 'function') {
    return () => {};
  }

  if (typeof bluetooth.onStateChanged === 'function') {
    const subscription = bluetooth.onStateChanged((event) => {
      listener(Boolean(event?.enabled));
    });

    return () => subscription?.remove?.();
  }

  const enabledSubscription = bluetooth.onBluetoothEnabled?.(() => listener(true));
  const disabledSubscription = bluetooth.onBluetoothDisabled?.(() => listener(false));

  return () => {
    enabledSubscription?.remove?.();
    disabledSubscription?.remove?.();
  };
}

export function subscribeToDeviceDisconnect(device, listener) {
  const bluetooth = resolveBluetoothModule();

  if (
    !bluetooth ||
    typeof bluetooth.onDeviceDisconnected !== 'function' ||
    typeof listener !== 'function'
  ) {
    return () => {};
  }

  const expectedAddress = String(device?.address || device?.id || '').toUpperCase();
  const subscription = bluetooth.onDeviceDisconnected((event) => {
    const eventAddress = String(
      event?.device?.address || event?.device?.id || '',
    ).toUpperCase();

    if (!expectedAddress || !eventAddress || expectedAddress === eventAddress) {
      listener(event?.device || device || null);
    }
  });

  return () => subscription?.remove?.();
}

export function normalizeBluetoothError(error) {
  const message = String(error?.message || error || '').trim();
  const lower = message.toLowerCase();

  if (message === 'BLUETOOTH_NATIVE_MODULE_UNAVAILABLE') {
    return { code: 'native_unavailable', message };
  }

  if (lower.includes('permission') || lower.includes('permiss')) {
    return { code: 'permission_denied', message };
  }

  if (lower.includes('disabled') || lower.includes('not enabled')) {
    return { code: 'bluetooth_off', message };
  }

  if (lower.includes('timeout')) {
    return { code: 'timeout', message };
  }

  if (lower.includes('socket') || lower.includes('connect')) {
    return { code: 'connection_failed', message };
  }

  if (lower.includes('write')) {
    return { code: 'write_failed', message };
  }

  return { code: 'unknown', message };
}
