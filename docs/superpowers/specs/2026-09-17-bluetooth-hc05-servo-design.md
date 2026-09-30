# Bluetooth HC-05 + Servo Integration Design

## Goal
Transform the existing simulated Connection tab into a real Android Bluetooth Classic controller for a paired HC-05 connected to the Arduino/servo, while preserving authentication/PHP/MySQL, Profile, Settings, themes, languages, and navigation.

## Approved behavior
- Android is the supported platform for the HC-05 integration.
- The app lists already paired Bluetooth Classic devices; it does not perform active discovery.
- HC-05 devices are visually highlighted as recommended.
- The user manually chooses a device and taps Connect.
- The successfully chosen device is saved locally as the preferred device by address/MAC and shown first/highlighted on subsequent app launches.
- The app never auto-connects at startup; it waits for the user to tap Connect.
- When connected, the control panel exposes only two user-facing actions: **Abrir** and **Fechar**.
- Abrir sends the single character `A`; Fechar sends the single character `C`.
- The UI updates optimistically immediately to `MÃO ABERTA` or `MÃO FECHADA` before waiting for any Arduino acknowledgement.
- If a Bluetooth write fails, the optimistic hand state remains and an explicit warning explains that the displayed state may not match the physical prosthesis.
- Exact PT-BR failure copy:
  - Title: `Falha ao enviar comando`
  - Open: `Não foi possível enviar o comando para abrir a mão. O status exibido no aplicativo pode não corresponder à posição real da prótese. Verifique a conexão Bluetooth e tente novamente.`
  - Close: `Não foi possível enviar o comando para fechar a mão. O status exibido no aplicativo pode não corresponder à posição real da prótese. Verifique a conexão Bluetooth e tente novamente.`
  - Button: `Entendi`
- Existing PT/EN/ES localization remains functional, with equivalent Bluetooth copy added for EN/ES.
- Text sizes across the app are increased modestly for readability without restructuring unrelated screens.

## Architecture
Bluetooth is isolated from PHP/MySQL. Account/authentication continues to use the existing API; prosthesis control is local phone ↔ HC-05 ↔ Arduino.

`BluetoothContext` owns state and orchestration: permissions, adapter state, paired devices, preferred device persistence, connection state, optimistic hand state, last action, and errors. `bluetoothService` is the only module that talks directly to `react-native-bluetooth-classic`; the UI consumes context methods and state.

AsyncStorage key: `@rebirth-prosthetics/bluetooth-preferred-device-v1`.

## Device lifecycle
1. Connection screen opens.
2. Android Nearby Devices permission is requested when needed.
3. App checks Bluetooth availability/enabled state.
4. App reads bonded devices with `getBondedDevices()`.
5. Preferred saved address is matched and sorted first.
6. HC-05-like names are highlighted (`HC-05`, case/spacing/hyphen insensitive).
7. User taps Connect.
8. App opens a socket using the selected BluetoothDevice.
9. On successful connection, device name/address are persisted as preferred.
10. No automatic reconnection occurs on future launches.
11. User can disconnect manually; unexpected disconnect updates connection state and leaves preference intact.

## Protocol
- Encoding: ASCII.
- `A` = open hand / servo target currently represented by Arduino as 0°.
- `C` = close hand / servo target currently represented by Arduino as 180°.
- No `B` / 90° control is exposed in the application.
- Newline is not required for command transmission; the app sends exactly `A` or `C`.

## Android/native requirements
- Custom native module requires a development build; Expo Go is not a supported runtime for Bluetooth Classic.
- Add `expo-dev-client`.
- Add `react-native-bluetooth-classic` 1.70+ line compatible with RN >=0.73.
- Add Android Bluetooth permissions for paired-device communication (`BLUETOOTH_CONNECT`) plus legacy Bluetooth permissions for older Android versions as generated/required by native manifests.
- Runtime permission request on Android 12+ uses `PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT`.
- No active discovery means `BLUETOOTH_SCAN` is not required by application behavior unless the native package itself requires it; the app does not request location for paired-device listing.

## UI states
- Unsupported platform: explain that HC-05 control is Android-only.
- Native module unavailable (e.g. Expo Go): explain that a development build/APK is required.
- Permission required/denied.
- Bluetooth unavailable.
- Bluetooth off, with button to open Bluetooth settings.
- Loading paired devices.
- Empty paired-device list.
- Preferred device unavailable but still shown as preferred metadata where useful.
- Device connecting.
- Connected.
- Connection failure.
- Unexpected disconnection.
- Command send failure with approved warning copy.

## Compatibility / non-regression
- Do not alter PHP/MySQL contracts.
- Do not alter login/signup payload field names.
- Connection tab remains first after successful login.
- Profile and Settings behavior remain intact.
- Existing AsyncStorage keys for auth/theme/language remain unchanged.
- Bottom navigation remains Connections → Profile → Settings.

## Verification
- Static integration checks verify dependency/config/context/service/wiring/copy/protocol requirements.
- JavaScript files are syntax/bundle checked through Expo tooling.
- `expo-doctor` is run after dependency installation.
- Android native prebuild is generated to ensure config can produce an Android project.
- PHP files are syntax-checked and compared between the two backend copies to ensure Bluetooth changes did not modify backend behavior.
