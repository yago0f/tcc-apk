#include <SoftwareSerial.h>
#include <Servo.h>

// HC-05:
// TXD do HC-05 -> D10 do Arduino
// RXD do HC-05 <- D11 do Arduino por divisor de tensão 5V -> ~3,3V
SoftwareSerial bluetooth(10, 11); // RX, TX

// Servo:
// fio de sinal -> D9
// alimentação conforme a capacidade do servo; sempre compartilhe o GND.
Servo servoMao;
const int PINO_SERVO = 9;

const int POSICAO_ABERTA = 0;
const int POSICAO_FECHADA = 180;

void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);

  servoMao.attach(PINO_SERVO);
  servoMao.write(POSICAO_ABERTA);

  Serial.println("RebirthProsthetics pronto");
  Serial.println("A = abrir");
  Serial.println("C = fechar");
}

void loop() {
  if (!bluetooth.available()) {
    return;
  }

  const char comando = bluetooth.read();

  // Alguns terminais podem enviar quebra de linha; o app envia somente A ou C.
  if (comando == '\n' || comando == '\r') {
    return;
  }

  Serial.print("Comando recebido: ");
  Serial.println(comando);

  switch (comando) {
    case 'A':
    case 'a':
      servoMao.write(POSICAO_ABERTA);
      Serial.println("Mao aberta - 0 graus");
      break;

    case 'C':
    case 'c':
      servoMao.write(POSICAO_FECHADA);
      Serial.println("Mao fechada - 180 graus");
      break;

    default:
      Serial.println("Comando ignorado. Use A ou C.");
      break;
  }
}
