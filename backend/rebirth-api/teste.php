<?php

declare(strict_types=1);

require_once __DIR__ . '/conexao.php';

try {
    $stmt = $pdo->query('SELECT versao FROM schema_version WHERE id = 1 LIMIT 1');
    $versao = (string) $stmt->fetchColumn();

    responderJson([
        'sucesso' => $versao === SCHEMA_VERSION,
        'api' => 'online',
        'banco' => DB_NAME,
        'backend_version' => BACKEND_VERSION,
        'schema_version' => $versao,
        'schema_esperado' => SCHEMA_VERSION,
        'mensagem' => $versao === SCHEMA_VERSION
            ? 'API e banco compativeis.'
            : 'A versao do banco nao corresponde ao backend.',
    ], $versao === SCHEMA_VERSION ? 200 : 500);
} catch (Throwable $erro) {
    responderJson([
        'sucesso' => false,
        'api' => 'online',
        'banco' => DB_NAME,
        'backend_version' => BACKEND_VERSION,
        'mensagem' => 'O banco existe, mas o schema 4.0.0 nao foi instalado corretamente.',
    ], 500);
}
