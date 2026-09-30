import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  connectDevice,
  disconnectDevice,
  getBluetoothState,
  getBondedDevices,
  isNativeBluetoothAvailable,
  normalizeBluetoothError,
  openBluetoothSettings,
  requestBluetoothPermission,
  subscribeToAdapterState,
  subscribeToDeviceDisconnect,
  writeCommand,
} from '../services/bluetoothService';

const BluetoothContext = createContext(null);

const PREFERRED_DEVICE_STORAGE_KEY =
  '@rebirth-prosthetics/bluetooth-preferred-device-v1';

export const BLUETOOTH_COMMANDS = Object.freeze({
  OPEN: 'A',
  CLOSE: 'C',
});

function getDeviceAddress(device) {
  return String(device?.address || device?.id || '').trim();
}

function getDeviceName(device) {
  return String(device?.name || getDeviceAddress(device) || 'Bluetooth').trim();
}

function isSameDevice(first, second) {
  const firstAddress = getDeviceAddress(first).toUpperCase();
  const secondAddress = getDeviceAddress(second).toUpperCase();
  return Boolean(firstAddress && secondAddress && firstAddress === secondAddress);
}

export function isHC05Device(device) {
  const normalized = getDeviceName(device)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  return normalized === 'HC05' || normalized.startsWith('HC05');
}

function toStoredDevice(device) {
  const address = getDeviceAddress(device);

  if (!address) {
    return null;
  }

  return {
    name: getDeviceName(device),
    address,
    id: String(device?.id || address),
    savedAt: new Date().toISOString(),
  };
}

function sortDevices(devices, preferredDevice) {
  return [...devices].sort((a, b) => {
    const aPreferred = isSameDevice(a, preferredDevice) ? 1 : 0;
    const bPreferred = isSameDevice(b, preferredDevice) ? 1 : 0;
    if (aPreferred !== bPreferred) return bPreferred - aPreferred;

    const aHC05 = isHC05Device(a) ? 1 : 0;
    const bHC05 = isHC05Device(b) ? 1 : 0;
    if (aHC05 !== bHC05) return bHC05 - aHC05;

    return getDeviceName(a).localeCompare(getDeviceName(b));
  });
}

export function BluetoothProvider({ children }) {
  const [supported, setSupported] = useState(Platform.OS === 'android');
  const [nativeModuleReady, setNativeModuleReady] = useState(false);
  const [permissionState, setPermissionState] = useState('unknown');
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [pairedDevices, setPairedDevices] = useState([]);
  const [preferredDevice, setPreferredDeviceState] = useState(null);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [connectionState, setConnectionState] = useState('idle');
  const [connectingDeviceAddress, setConnectingDeviceAddress] = useState(null);
  const [handState, setHandState] = useState('unknown');
  const [lastAction, setLastAction] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const connectedDeviceRef = useRef(null);
  const preferredDeviceRef = useRef(null);
  const manualDisconnectRef = useRef(false);

  useEffect(() => {
    connectedDeviceRef.current = connectedDevice;
  }, [connectedDevice]);

  useEffect(
    () => () => {
      // Home is unmounted on logout. Close any active RFCOMM socket so a
      // session cannot keep controlling the hardware after leaving the app.
      const device = connectedDeviceRef.current;
      if (device) {
        disconnectDevice(device).catch(() => {});
      }
    },
    [],
  );

  useEffect(() => {
    preferredDeviceRef.current = preferredDevice;
  }, [preferredDevice]);

  const persistPreferredDevice = useCallback(async (device) => {
    const storedDevice = toStoredDevice(device);

    if (!storedDevice) {
      return null;
    }

    await AsyncStorage.setItem(
      PREFERRED_DEVICE_STORAGE_KEY,
      JSON.stringify(storedDevice),
    );
    setPreferredDeviceState(storedDevice);
    return storedDevice;
  }, []);

  const clearPreferredDevice = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PREFERRED_DEVICE_STORAGE_KEY);
      setPreferredDeviceState(null);
      setLastError(null);
      return true;
    } catch (error) {
      const normalized = normalizeBluetoothError(error);
      setLastError({ ...normalized, scope: 'preference' });
      return false;
    }
  }, []);

  const setPreferredDevice = useCallback(
    async (device) => {
      try {
        await persistPreferredDevice(device);
        setLastError(null);
        return true;
      } catch (error) {
        const normalized = normalizeBluetoothError(error);
        setLastError({ ...normalized, scope: 'preference' });
        return false;
      }
    },
    [persistPreferredDevice],
  );

  const refreshPairedDevices = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setSupported(false);
      setNativeModuleReady(false);
      setBluetoothEnabled(false);
      setPairedDevices([]);
      return [];
    }

    setIsRefreshing(true);
    setLastError(null);

    try {
      const moduleReady = isNativeBluetoothAvailable();
      setNativeModuleReady(moduleReady);

      if (!moduleReady) {
        setPairedDevices([]);
        return [];
      }

      const granted = await requestBluetoothPermission();
      setPermissionState(granted ? 'granted' : 'denied');

      if (!granted) {
        setPairedDevices([]);
        return [];
      }

      const state = await getBluetoothState();
      setSupported(state.supported);
      setNativeModuleReady(state.nativeReady);
      setBluetoothEnabled(state.enabled);

      if (!state.enabled) {
        setPairedDevices([]);
        return [];
      }

      const devices = await getBondedDevices();
      const ordered = sortDevices(devices, preferredDeviceRef.current);
      setPairedDevices(ordered);
      return ordered;
    } catch (error) {
      const normalized = normalizeBluetoothError(error);
      setLastError({ ...normalized, scope: 'refresh' });
      setPairedDevices([]);
      return [];
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const connect = useCallback(
    async (device) => {
      if (!device) return false;

      setLastError(null);
      setConnectionState('connecting');
      setConnectingDeviceAddress(getDeviceAddress(device));

      try {
        const granted = await requestBluetoothPermission();
        setPermissionState(granted ? 'granted' : 'denied');

        if (!granted) {
          throw new Error('BLUETOOTH_PERMISSION_DENIED');
        }

        const state = await getBluetoothState();
        setSupported(state.supported);
        setNativeModuleReady(state.nativeReady);
        setBluetoothEnabled(state.enabled);

        if (!state.enabled) {
          throw new Error('BLUETOOTH_DISABLED');
        }

        const current = connectedDeviceRef.current;
        if (current && !isSameDevice(current, device)) {
          manualDisconnectRef.current = true;
          try {
            await disconnectDevice(current);
          } catch {
            // A stale socket must not prevent connecting to the selected device.
          } finally {
            manualDisconnectRef.current = false;
          }
        }

        await connectDevice(device);
        setConnectedDevice(device);
        connectedDeviceRef.current = device;
        setConnectionState('connected');
        setConnectingDeviceAddress(null);
        try {
          await persistPreferredDevice(device);
        } catch (storageError) {
          const normalizedStorageError = normalizeBluetoothError(storageError);
          setLastError({ ...normalizedStorageError, scope: 'preference' });
        }
        return true;
      } catch (error) {
        const normalized = normalizeBluetoothError(error);
        setConnectedDevice(null);
        connectedDeviceRef.current = null;
        setConnectionState('error');
        setConnectingDeviceAddress(null);
        setLastError({ ...normalized, scope: 'connect' });
        return false;
      }
    },
    [persistPreferredDevice],
  );

  const disconnect = useCallback(async () => {
    const device = connectedDeviceRef.current;

    if (!device) {
      setConnectionState('idle');
      setConnectingDeviceAddress(null);
      return true;
    }

    manualDisconnectRef.current = true;
    setConnectionState('disconnecting');
    setLastError(null);

    try {
      await disconnectDevice(device);
      setConnectedDevice(null);
      connectedDeviceRef.current = null;
      setConnectionState('idle');
      setConnectingDeviceAddress(null);
      manualDisconnectRef.current = false;
      return true;
    } catch (error) {
      const normalized = normalizeBluetoothError(error);
      setLastError({ ...normalized, scope: 'disconnect' });
      setConnectionState('error');
      manualDisconnectRef.current = false;
      return false;
    }
  }, []);

  const sendOptimisticCommand = useCallback(async (action, command) => {
    const nextHandState = action === 'open' ? 'open' : 'closed';

    setHandState(nextHandState);
    setLastAction(action);
    setLastError(null);

    const device = connectedDeviceRef.current;
    if (!device || connectionState !== 'connected') {
      setLastError({
        code: 'write_failed',
        scope: 'command',
        action,
        message: 'BLUETOOTH_DEVICE_NOT_CONNECTED',
      });
      return false;
    }

    try {
      await writeCommand(device, command);
      return true;
    } catch (error) {
      const normalized = normalizeBluetoothError(error);
      setLastError({
        ...normalized,
        code: 'write_failed',
        scope: 'command',
        action,
      });
      return false;
    }
  }, [connectionState]);

  const openHand = useCallback(
    () => sendOptimisticCommand('open', BLUETOOTH_COMMANDS.OPEN),
    [sendOptimisticCommand],
  );

  const closeHand = useCallback(
    () => sendOptimisticCommand('close', BLUETOOTH_COMMANDS.CLOSE),
    [sendOptimisticCommand],
  );

  const openSettings = useCallback(async () => {
    try {
      await openBluetoothSettings();
      return true;
    } catch (error) {
      const normalized = normalizeBluetoothError(error);
      setLastError({ ...normalized, scope: 'settings' });
      return false;
    }
  }, []);

  useEffect(() => {
    let alive = true;

    async function initialize() {
      try {
        const raw = await AsyncStorage.getItem(PREFERRED_DEVICE_STORAGE_KEY);
        if (raw && alive) {
          try {
            setPreferredDeviceState(JSON.parse(raw));
          } catch {
            await AsyncStorage.removeItem(PREFERRED_DEVICE_STORAGE_KEY);
          }
        }

        if (Platform.OS !== 'android') {
          if (alive) {
            setSupported(false);
            setNativeModuleReady(false);
          }
          return;
        }

        // Do not request Bluetooth permission while the user is still on the
        // login/cadastro flow. The Connection screen starts the first refresh
        // explicitly, so Android only shows the Nearby devices permission when
        // Bluetooth is actually needed.
        const moduleReady = isNativeBluetoothAvailable();
        if (!alive) return;
        setNativeModuleReady(moduleReady);
      } catch (error) {
        if (alive) {
          const normalized = normalizeBluetoothError(error);
          setLastError({ ...normalized, scope: 'initialize' });
        }
      } finally {
        if (alive) setIsInitializing(false);
      }
    }

    initialize();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!nativeModuleReady || permissionState !== 'granted') return undefined;

    return subscribeToAdapterState((enabled) => {
      setBluetoothEnabled(enabled);

      if (!enabled) {
        setConnectedDevice(null);
        connectedDeviceRef.current = null;
        setConnectionState('idle');
        setConnectingDeviceAddress(null);
        setPairedDevices([]);
      }
    });
  }, [nativeModuleReady, permissionState]);

  useEffect(() => {
    if (!connectedDevice) return undefined;

    return subscribeToDeviceDisconnect(connectedDevice, () => {
      const wasManual = manualDisconnectRef.current;
      setConnectedDevice(null);
      connectedDeviceRef.current = null;
      setConnectionState('idle');
      setConnectingDeviceAddress(null);
      manualDisconnectRef.current = false;

      if (!wasManual) {
        setLastError({
          code: 'disconnected',
          scope: 'connection',
          message: 'BLUETOOTH_DEVICE_DISCONNECTED',
        });
      }
    });
  }, [connectedDevice]);

  const value = useMemo(
    () => ({
      supported,
      nativeModuleReady,
      permissionState,
      bluetoothEnabled,
      pairedDevices: sortDevices(pairedDevices, preferredDevice),
      preferredDevice,
      connectedDevice,
      connectionState,
      connectingDeviceAddress,
      handState,
      lastAction,
      lastError,
      isRefreshing,
      isInitializing,
      refreshPairedDevices,
      connect,
      disconnect,
      setPreferredDevice,
      clearPreferredDevice,
      openSettings,
      openHand,
      closeHand,
      isHC05Device,
      isSameDevice,
    }),
    [
      supported,
      nativeModuleReady,
      permissionState,
      bluetoothEnabled,
      pairedDevices,
      preferredDevice,
      connectedDevice,
      connectionState,
      connectingDeviceAddress,
      handState,
      lastAction,
      lastError,
      isRefreshing,
      isInitializing,
      refreshPairedDevices,
      connect,
      disconnect,
      setPreferredDevice,
      clearPreferredDevice,
      openSettings,
      openHand,
      closeHand,
    ],
  );

  return (
    <BluetoothContext.Provider value={value}>
      {children}
    </BluetoothContext.Provider>
  );
}

export function useBluetooth() {
  const context = useContext(BluetoothContext);

  if (!context) {
    throw new Error('useBluetooth must be used inside BluetoothProvider.');
  }

  return context;
}
