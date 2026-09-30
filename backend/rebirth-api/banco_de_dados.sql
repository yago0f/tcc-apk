-- ============================================================
-- Rebirth Prosthetics - Banco de dados limpo e reconstruido
-- Versao do schema: 4.0.0
-- Compatibilidade: MySQL 5.7+/8.x e MariaDB 10.2+
--
-- ATENCAO: este arquivo APAGA o banco rebirth_prosthetics atual.
-- Use-o quando a intencao for realmente reconstruir o banco do zero.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS rebirth_prosthetics;

CREATE DATABASE rebirth_prosthetics
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rebirth_prosthetics;

-- ------------------------------------------------------------
-- Controle de versao do schema
-- ------------------------------------------------------------
CREATE TABLE schema_version (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  versao VARCHAR(20) NOT NULL,
  aplicado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_version (id, versao)
VALUES (1, '4.0.0');

-- ------------------------------------------------------------
-- Usuarios
-- Mantem exatamente os nomes de campos esperados pelo app/PHP.
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id_usuario INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_usuario VARCHAR(120) NOT NULL,
  cpf_usuario CHAR(11) NOT NULL,
  email_usuario VARCHAR(190) NOT NULL,
  senha_usuario VARCHAR(255) NOT NULL,
  data_nascimento DATE NULL,
  telefone_usuario VARCHAR(20) NULL,
  foto_usuario VARCHAR(255) NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id_usuario),
  UNIQUE KEY uk_usuarios_cpf (cpf_usuario),
  UNIQUE KEY uk_usuarios_email (email_usuario),
  KEY idx_usuarios_nome (nome_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Proteses vinculadas aos usuarios
-- Ainda nao interfere no login/cadastro atual, mas deixa o banco
-- pronto para o perfil e para a integracao futura com o dispositivo.
-- ------------------------------------------------------------
CREATE TABLE proteses (
  id_protese INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario INT UNSIGNED NOT NULL,
  nome_protese VARCHAR(100) NOT NULL DEFAULT 'Mao 3D Pro',
  modelo VARCHAR(80) NULL,
  numero_serie VARCHAR(100) NULL,
  codigo_dispositivo VARCHAR(100) NULL,
  bateria TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status_protese VARCHAR(20) NOT NULL DEFAULT 'desconectada',
  ultimo_uso DATETIME NULL,
  ultima_conexao DATETIME NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id_protese),
  UNIQUE KEY uk_proteses_numero_serie (numero_serie),
  UNIQUE KEY uk_proteses_codigo_dispositivo (codigo_dispositivo),
  KEY idx_proteses_usuario (id_usuario),

  CONSTRAINT fk_proteses_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id_usuario)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Sessoes de uso da protese
-- ------------------------------------------------------------
CREATE TABLE sessoes_uso (
  id_sessao BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_protese INT UNSIGNED NOT NULL,
  inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fim DATETIME NULL,
  duracao_segundos INT UNSIGNED NOT NULL DEFAULT 0,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id_sessao),
  KEY idx_sessoes_protese_inicio (id_protese, inicio),

  CONSTRAINT fk_sessoes_protese
    FOREIGN KEY (id_protese)
    REFERENCES proteses (id_protese)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Historico de conexoes
-- ------------------------------------------------------------
CREATE TABLE conexoes_protese (
  id_conexao BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_protese INT UNSIGNED NOT NULL,
  conectado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  desconectado_em DATETIME NULL,
  tipo_conexao VARCHAR(20) NOT NULL DEFAULT 'wifi',
  endereco_ip VARCHAR(45) NULL,
  sinal_rssi SMALLINT NULL,

  PRIMARY KEY (id_conexao),
  KEY idx_conexoes_protese_data (id_protese, conectado_em),

  CONSTRAINT fk_conexoes_protese
    FOREIGN KEY (id_protese)
    REFERENCES proteses (id_protese)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Leituras EMG
-- ------------------------------------------------------------
CREATE TABLE leituras_emg (
  id_leitura BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_protese INT UNSIGNED NOT NULL,
  canal_1 INT NOT NULL,
  canal_2 INT NULL,
  movimento_detectado VARCHAR(80) NULL,
  confianca DECIMAL(5,2) NULL,
  bateria TINYINT UNSIGNED NULL,
  data_leitura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id_leitura),
  KEY idx_emg_protese_data (id_protese, data_leitura),

  CONSTRAINT fk_emg_protese
    FOREIGN KEY (id_protese)
    REFERENCES proteses (id_protese)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Verificacao final
SELECT versao AS schema_version FROM schema_version WHERE id = 1;
SHOW TABLES;
