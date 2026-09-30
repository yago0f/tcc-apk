# Bluetooth HC-05 + Servo Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simulated Connection tab with reliable Android Bluetooth Classic control for a paired HC-05 and Arduino servo using only Abrir (`A`) and Fechar (`C`).

**Architecture:** A focused native Bluetooth service wraps `react-native-bluetooth-classic`; `BluetoothContext` owns app state, persistence, connection lifecycle and optimistic prosthesis state. The Connection screen only renders state/actions from that context. PHP/MySQL stays untouched.

**Tech Stack:** Expo SDK 55, React Native 0.83.2, JavaScript, AsyncStorage, react-native-bluetooth-classic, expo-dev-client, React Navigation.

**Spec:** `docs/superpowers/specs/2026-09-17-bluetooth-hc05-servo-design.md`

## Global Constraints
- Android is the supported HC-05 platform.
- List bonded/paired devices only; do not implement active discovery.
- Never auto-connect the preferred device.
- Persist preferred device locally by Bluetooth address.
- Abrir sends exactly `A`; Fechar sends exactly `C`.
- Update hand state optimistically and retain it if write fails.
- Preserve PHP/MySQL/auth/profile/settings contracts.
- Keep Connections as the first tab after login.

---

### Task 1: Add regression/integration checks and native dependencies

**Files:**
- Create: `scripts/verify-bluetooth-integration.cjs`
- Modify: `package.json`
- Modify: `app.json`
- Create: `eas.json`

**Interfaces:**
- Consumes: Expo SDK 55 project configuration.
- Produces: native dependency/config contract required by later tasks.

- [ ] **Step 1: Write failing integration checks**
  Create a Node script that asserts required dependency names, Android permissions, provider wiring, preferred storage key, `A`/`C` protocol, no UI `B` command, and approved error copy. Before implementation it must exit non-zero.
- [ ] **Step 2: Run check and verify failure**
  Run: `node scripts/verify-bluetooth-integration.cjs`
  Expected: FAIL because Bluetooth files/dependencies/config do not exist yet.
- [ ] **Step 3: Add dependencies and Android/dev-build configuration**
  Add `react-native-bluetooth-classic`, `expo-dev-client`, scripts for native start/build checks, Android package name/permissions, scheme, and a development EAS profile.
- [ ] **Step 4: Re-run integration check**
  It may still fail on missing service/context/UI, but dependency/config assertions should no longer fail.

### Task 2: Implement isolated Bluetooth service

**Files:**
- Create: `src/services/bluetoothService.js`

**Interfaces:**
- Produces: `isNativeBluetoothAvailable()`, `requestBluetoothPermission()`, `getBluetoothState()`, `getBondedDevices()`, `openBluetoothSettings()`, `connectDevice(device)`, `disconnectDevice(device)`, `writeCommand(device, command)`, `subscribeToAdapterState(...)`, `subscribeToDeviceDisconnect(...)`, `normalizeBluetoothError(error)`.

- [ ] **Step 1: Extend failing integration checks for service API**
- [ ] **Step 2: Run check and verify service assertions fail**
- [ ] **Step 3: Implement minimal service with lazy native-module loading so web/Expo Go fail gracefully instead of crashing import-time**
- [ ] **Step 4: Re-run check and verify service assertions pass**

### Task 3: Implement Bluetooth context and persistence

**Files:**
- Create: `src/context/BluetoothContext.js`
- Modify: `App.js`

**Interfaces:**
- Produces `useBluetooth()` values: `supported`, `nativeModuleReady`, `permissionState`, `bluetoothEnabled`, `pairedDevices`, `preferredDevice`, `connectedDevice`, `connectionState`, `handState`, `lastAction`, `lastError`, `refreshPairedDevices`, `connect`, `disconnect`, `setPreferredDevice`, `clearPreferredDevice`, `openSettings`, `openHand`, `closeHand`.

- [ ] **Step 1: Extend failing checks for context state/actions and provider wiring**
- [ ] **Step 2: Run check and verify failure**
- [ ] **Step 3: Implement context, AsyncStorage persistence, manual connection only, preferred sorting, listeners, and optimistic hand updates**
- [ ] **Step 4: Re-run checks and verify pass for context/provider requirements**

### Task 4: Replace simulated Connection screen with real paired-device/controller UI

**Files:**
- Replace: `src/Telas/Tela1/index.js`
- Modify: `src/i18n/translations.js`

**Interfaces:**
- Consumes: `useBluetooth()` from Task 3.
- Produces: device list with HC-05/preferred highlighting, manual Connect/Disconnect, Abrir/Fechar controller, error/status states.

- [ ] **Step 1: Extend checks for approved labels/copy/protocol and absence of simulated state**
- [ ] **Step 2: Run check and verify failure**
- [ ] **Step 3: Implement Connection UI and PT/EN/ES copy**
- [ ] **Step 4: Re-run integration check and verify all Bluetooth requirements pass**

### Task 5: Increase readability without changing unrelated behavior

**Files:**
- Modify: `App.js`
- Modify: `src/Telas/Principal/index.js`
- Modify: `src/Telas/Tela2/index.js`
- Modify: `src/Telas/Tela3/index.js`

**Interfaces:**
- Consumes existing theme styles.
- Produces modest font-size increases and dark/light scene background correctness.

- [ ] **Step 1: Record current small font sizes with scripted audit**
- [ ] **Step 2: Increase sub-14px user-facing text conservatively (generally +1/+2px) and tab labels to 13px**
- [ ] **Step 3: Re-run audit and inspect for accidental logic changes using diffs**

### Task 6: Documentation and full verification

**Files:**
- Modify: `README.md`
- Create: `BLUETOOTH_HC05_ANDROID.md`
- Keep backend files byte-for-byte unchanged.

**Interfaces:**
- Produces install/run instructions for development build/APK and Arduino protocol.

- [ ] **Step 1: Document physical protocol and development-build workflow**
- [ ] **Step 2: Install dependencies**
  Run: `npm install`
- [ ] **Step 3: Run integration checks**
  Run: `npm run verify:bluetooth`
- [ ] **Step 4: Run Expo diagnostics**
  Run: `npx expo-doctor`
- [ ] **Step 5: Generate Android native project**
  Run: `npx expo prebuild --platform android --clean --no-install`
- [ ] **Step 6: Bundle/export JS to catch Metro/import errors**
  Run: `npx expo export --platform android --output-dir dist-test`
- [ ] **Step 7: PHP non-regression verification**
  Run `php -l` for every PHP file and compare the embedded/copy-to-Laragon backends.
- [ ] **Step 8: Package final ZIP and run `unzip -t`**
