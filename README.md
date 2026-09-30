# RebirthProsthetics Mobile — versão 2.1

Aplicativo Expo/React Native do projeto RebirthProsthetics com autenticação PHP/MySQL, perfil, tema/idioma persistentes e controle real da prótese por Bluetooth Classic no Android.

## Recursos principais

- Login e cadastro conectados ao backend PHP/MySQL.
- Cadastro com nome, CPF, data de nascimento, telefone, e-mail e senha.
- Tela **Conexão** como primeira aba após o login.
- Integração real Android com **HC-05 (Bluetooth Classic SPP)**.
- Lista somente os dispositivos Bluetooth já pareados no Android.
- HC-05 destacado como dispositivo recomendado.
- Dispositivo escolhido salvo localmente como preferido com AsyncStorage.
- O dispositivo preferido é destacado na próxima abertura, mas **nunca é conectado automaticamente**.
- Controle da prótese com apenas **Abrir** (`A`) e **Fechar** (`C`).
- Estado visual da mão atualizado imediatamente ao toque.
- Se o envio falhar, o estado visual é mantido e o aplicativo mostra um aviso explícito.
- Tema claro/escuro/sistema e idiomas PT-BR/EN/ES.
- Fontes revisadas e aumentadas levemente para melhorar a leitura.

## Importante: Expo Go não controla o HC-05

`react-native-bluetooth-classic` contém código nativo. Por isso, o controle Bluetooth deve ser testado em uma **development build/APK própria** do RebirthProsthetics. O Expo Go pode continuar útil para telas sem Bluetooth, mas não contém esse módulo nativo.

Leia `BLUETOOTH_HC05_ANDROID.md` para o passo a passo completo.

## Instalação

Requisitos:

- Node.js 20.19 ou superior.
- Android físico com Bluetooth Classic.
- HC-05 previamente pareado nas configurações do Android.
- Para build local: Android Studio/SDK configurado.

```bash
npm install
npx expo prebuild --platform android --clean
npx expo run:android --device
```

Depois que a development build estiver instalada, mudanças somente em JavaScript podem ser executadas com:

```bash
npx expo start --clear
```

Se alterar dependência nativa ou `app.json`, gere/recompile a development build novamente.

## Backend PHP/MySQL

Copie `backend/rebirth-api` para:

```text
C:\laragon\www\rebirth-api
```

No `.env` da raiz do aplicativo, configure o endereço do computador com Laragon:

```env
EXPO_PUBLIC_API_URL=http://SEU_IPV4/rebirth-api
```

Exemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10/rebirth-api
```

O Bluetooth e o backend são independentes:

```text
Conta:   App ↔ PHP ↔ MySQL
Controle: App ↔ HC-05 ↔ Arduino ↔ Servo
```

## Arquivos principais

- `App.js` — navegação, providers e barra inferior.
- `src/context/AppSettingsContext.js` — tema e idioma.
- `src/context/AuthContext.js` — sessão do usuário.
- `src/context/BluetoothContext.js` — estado, preferência, conexão e comandos Bluetooth.
- `src/services/bluetoothService.js` — acesso isolado ao módulo Bluetooth Classic.
- `src/services/api.js` — comunicação PHP.
- `src/Telas/Principal/index.js` — login/cadastro.
- `src/Telas/Tela1/index.js` — conexão HC-05 e Abrir/Fechar.
- `src/Telas/Tela2/index.js` — perfil.
- `src/Telas/Tela3/index.js` — configurações.
- `arduino/RebirthProsthetics_HC05_Servo.ino` — firmware correspondente ao protocolo do app.
