# HC-05 + Arduino + Servo no RebirthProsthetics

## 1. Arquitetura

```text
Android / RebirthProsthetics
          ↓ Bluetooth Classic SPP
        HC-05
          ↓ serial
        Arduino
          ↓ D9
         Servo
```

A conta do usuário continua independente:

```text
RebirthProsthetics → PHP → MySQL
```

Uma falha no Laragon não impede o controle Bluetooth local depois que o usuário já está dentro do aplicativo.

## 2. Ligações usadas pelo firmware

```text
HC-05 VCC  → 5V
HC-05 GND  → GND
HC-05 TXD  → Arduino D10
HC-05 RXD  ← Arduino D11 por divisor de tensão
Servo sinal → Arduino D9
```

No RXD do HC-05, reduza o nível de 5 V do Arduino para aproximadamente 3,3 V usando divisor resistivo. Todos os GNDs devem estar em comum. Servos que exigem corrente maior devem usar fonte 5–6 V externa adequada, mantendo GND da fonte ligado ao GND do Arduino.

O sketch pronto está em `arduino/RebirthProsthetics_HC05_Servo.ino`.

## 3. Protocolo

O aplicativo envia exatamente um caractere ASCII por ação:

```text
Abrir  → A → servo 0°
Fechar → C → servo 180°
```

Não existe botão de 90°/comando B na interface.

## 4. Pareamento

Antes de abrir o app:

1. Ligue Arduino + HC-05.
2. Abra as configurações Bluetooth do Android.
3. Procure `HC-05`.
4. Pareie. PINs comuns são `1234` e `0000`.
5. O aparelho precisa aparecer entre os dispositivos pareados.

O RebirthProsthetics lista **dispositivos já pareados**. Ele não faz descoberta ativa.

## 5. Development build

O HC-05 é Bluetooth Classic e usa uma biblioteca React Native nativa. **Expo Go não contém esse código nativo.**

Instale dependências:

```bash
npm install
```

Gere o projeto Android e instale no celular conectado por USB:

```bash
npx expo prebuild --platform android --clean
npx expo run:android --device
```

Depois de a development build estar instalada, para alterações somente em JS:

```bash
npx expo start --clear
```

Se mudar `app.json` ou uma dependência nativa, faça nova build.

### Alternativa EAS

O `eas.json` contém o perfil `development`:

```bash
npx eas-cli@latest build --platform android --profile development
```

Instale o APK gerado no Android.

## 6. Fluxo dentro do app

1. Faça login.
2. A primeira aba é **Conexão**.
3. Autorize o acesso a dispositivos próximos. A permissão só é solicitada quando a aba **Conexão** é usada; login e cadastro não dependem dela.
4. Toque em **Atualizar**.
5. O HC-05 aparece destacado como recomendado.
6. Toque em **Conectar**.
7. Quando a conexão abrir, o dispositivo é salvo como preferido.
8. Use **Abrir** e **Fechar**.
9. Em uma próxima abertura, o preferido aparece primeiro/destacado, mas o app espera você tocar **Conectar**.

## 7. Estado otimista

Ao tocar em Abrir ou Fechar, a interface muda imediatamente para `MÃO ABERTA` ou `MÃO FECHADA` e envia o comando em paralelo.

Se o envio falhar, o app mantém o estado visual e avisa que a posição exibida pode não corresponder à posição física real.

## 8. Permissões Android

No Android 12+ a comunicação com dispositivos Bluetooth já pareados usa `BLUETOOTH_CONNECT`, solicitado em tempo de execução como acesso a dispositivos próximos. O projeto também declara as permissões Bluetooth legadas necessárias para versões anteriores do Android.

## 9. Solução de problemas

### HC-05 não aparece
- Confirme que ele já está pareado no Android.
- Toque em Atualizar.
- Confirme que Bluetooth está ligado.

### App pede development build
- Você abriu no Expo Go. Instale e abra a development build/APK do projeto.

### Conecta, mas servo não mexe
- Confira D9 do servo.
- Confira D10/D11 do HC-05.
- Confira baud rate 9600.
- Confirme GND comum.
- Teste a alimentação do servo; motores/servos maiores não devem depender do 5 V do Arduino.

### Abrir/Fechar falha
- Confira se o cartão mostra `CONECTADO`.
- HC-05 só aceita uma conexão serial por vez; desconecte aplicativos de terminal Bluetooth antes de usar o RebirthProsthetics.
- Desligue/ligue o HC-05 e tente conectar novamente.


## 10. Sessão e logout

A conexão Bluetooth existe somente dentro da área autenticada do aplicativo. Ao sair da conta, o provider Bluetooth é desmontado e o aplicativo tenta encerrar o socket RFCOMM ativo. O dispositivo preferido permanece salvo no celular para a próxima sessão, mas nunca é reconectado automaticamente.

## 11. Compatibilidade do módulo nativo

O projeto usa `react-native-bluetooth-classic` 1.73.0-rc.17. O módulo é carregado de forma defensiva: em Expo Go, web ou quando o código nativo não estiver presente, a tela informa que é necessária uma development build em vez de quebrar a inicialização do aplicativo.
