<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

const DB_HOST = '127.0.0.1';
const DB_PORT = '3306';
const DB_NAME = 'rebirth_prosthetics';
const DB_USER = 'root';
const DB_PASSWORD = '';
const BACKEND_VERSION = '4.0.0';
const SCHEMA_VERSION = '4.0.0';

function responderJson(array $dados, int $status = 200): never
{
    http_response_code($status);
    echo json_encode(
        $dados,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

function lerCorpoJson(): array
{
    $conteudo = file_get_contents('php://input');

    if ($conteudo === false || trim($conteudo) === '') {
        return is_array($_POST) ? $_POST : [];
    }

    $dados = json_decode($conteudo, true);

    if (!is_array($dados)) {
        responderJson([
            'sucesso' => false,
            'mensagem' => 'O corpo da requisicao precisa ser um JSON valido.',
        ], 400);
    }

    return $dados;
}

function apenasNumeros(string $valor): string
{
    return preg_replace('/\D+/', '', $valor) ?? '';
}

try {
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        DB_HOST,
        DB_PORT,
        DB_NAME
    );

    $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_TIMEOUT => 5,
    ]);

    $pdo->exec('SET SESSION innodb_lock_wait_timeout = 5');
} catch (Throwable $erro) {
    error_log('Rebirth DB: ' . $erro->getMessage());

    responderJson([
        'sucesso' => false,
        'mensagem' => 'Nao foi possivel conectar ao banco de dados.',
        'backend_version' => BACKEND_VERSION,
    ], 500);
}
