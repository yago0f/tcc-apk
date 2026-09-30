const fs = require('fs');
const path = require('path');

const root = process.cwd();
const failures = [];
const checks = [];

function read(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

function assert(condition, message) {
  checks.push(message);
  if (!condition) failures.push(message);
}

const pkgText = read('package.json');
const appText = read('app.json');
const appJs = read('App.js');
const service = read('src/services/bluetoothService.js');
const context = read('src/context/BluetoothContext.js');
const screen = read('src/Telas/Tela1/index.js');
const translations = read('src/i18n/translations.js');
const eas = read('eas.json');
const arduino = read('arduino/RebirthProsthetics_HC05_Servo.ino');

let pkg = {};
let app = {};
try { pkg = JSON.parse(pkgText || '{}'); } catch {}
try { app = JSON.parse(appText || '{}'); } catch {}

assert(Boolean(pkg.dependencies?.['react-native-bluetooth-classic']), 'package.json includes react-native-bluetooth-classic');
assert(Boolean(pkg.dependencies?.['expo-dev-client']), 'package.json includes expo-dev-client');
assert(Boolean(pkg.scripts?.['verify:bluetooth']), 'package.json exposes verify:bluetooth script');

const permissions = app?.expo?.android?.permissions || [];
assert(permissions.includes('android.permission.BLUETOOTH_CONNECT'), 'app.json declares BLUETOOTH_CONNECT');
assert(permissions.includes('android.permission.BLUETOOTH'), 'app.json declares legacy BLUETOOTH');
assert(permissions.includes('android.permission.BLUETOOTH_ADMIN'), 'app.json declares legacy BLUETOOTH_ADMIN');
assert(!permissions.includes('android.permission.BLUETOOTH_SCAN'), 'app.json avoids BLUETOOTH_SCAN because the app lists paired devices only');
assert(Boolean(app?.expo?.android?.package), 'app.json defines Android package id');
assert(Boolean(app?.expo?.scheme), 'app.json defines an app scheme');
assert(Boolean(eas && eas.includes('developmentClient')), 'eas.json contains a development-client profile');

assert(Boolean(service), 'bluetoothService.js exists');
if (service) {
  for (const symbol of [
    'isNativeBluetoothAvailable',
    'requestBluetoothPermission',
    'getBluetoothState',
    'getBondedDevices',
    'openBluetoothSettings',
    'connectDevice',
    'disconnectDevice',
    'writeCommand',
    'subscribeToAdapterState',
    'subscribeToDeviceDisconnect',
    'normalizeBluetoothError',
  ]) {
    assert(service.includes(symbol), `bluetoothService exposes ${symbol}`);
  }
}

assert(Boolean(context), 'BluetoothContext.js exists');
if (context) {
  assert(context.includes('@rebirth-prosthetics/bluetooth-preferred-device-v1'), 'context uses preferred-device storage key v1');
  assert(context.includes("OPEN: 'A'"), 'context maps OPEN to A');
  assert(context.includes("CLOSE: 'C'"), 'context maps CLOSE to C');
  assert(context.includes('setHandState'), 'context supports optimistic hand state updates');
  assert(context.includes('AsyncStorage'), 'context persists preferred device with AsyncStorage');
  assert(context.includes('preferredDevice'), 'context exposes preferredDevice state');
}

assert(Boolean(appJs && appJs.includes('BluetoothProvider')), 'App.js wraps authenticated app with BluetoothProvider');
assert(Boolean(appJs && appJs.includes('initialRouteName="Connections"')), 'Connections remains the first tab after login');
assert(Boolean(screen && screen.includes('useBluetooth')), 'Connection screen consumes useBluetooth');
assert(Boolean(screen && screen.includes('refreshPairedDevices')), 'Connection screen requests the paired-device list when Bluetooth is needed');
assert(Boolean(screen && screen.includes('connections.openHand')), 'Connection screen renders Abrir action');
assert(Boolean(screen && screen.includes('connections.closeHand')), 'Connection screen renders Fechar action');
assert(Boolean(screen && !/sendCommand\([^\n]*['\"]B['\"]/.test(screen)), 'Connection screen does not send B command');
assert(Boolean(translations && translations.includes('Falha ao enviar comando')), 'translations include approved PT failure title');
assert(Boolean(translations && translations.includes('Não foi possível enviar o comando para abrir a mão. O status exibido no aplicativo pode não corresponder à posição real da prótese. Verifique a conexão Bluetooth e tente novamente.')), 'translations include exact PT open failure message');
assert(Boolean(translations && translations.includes('Não foi possível enviar o comando para fechar a mão. O status exibido no aplicativo pode não corresponder à posição real da prótese. Verifique a conexão Bluetooth e tente novamente.')), 'translations include exact PT close failure message');
assert(Boolean(translations && translations.includes("failureAcknowledge: 'Entendi'")), 'translations include exact PT acknowledgement button');

assert(Boolean(arduino), 'Arduino HC-05/servo sketch exists');
if (arduino) {
  assert(arduino.includes("case 'A':"), 'Arduino sketch accepts A for opening');
  assert(arduino.includes("case 'C':"), 'Arduino sketch accepts C for closing');
  assert(!arduino.includes("case 'B':"), 'Arduino sketch exposes no B/90-degree command');
  assert(arduino.includes('SoftwareSerial bluetooth(10, 11)'), 'Arduino sketch keeps HC-05 on D10/D11');
  assert(arduino.includes('PINO_SERVO = 9'), 'Arduino sketch keeps servo signal on D9');
}

if (failures.length) {
  console.error(`Bluetooth integration verification FAILED (${failures.length}/${checks.length} failed):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`Bluetooth integration verification PASSED (${checks.length} checks).`);
