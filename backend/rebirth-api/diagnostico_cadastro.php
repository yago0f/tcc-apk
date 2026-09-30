<?php

declare(strict_types=1);

require_once __DIR__ . '/conexao.php';

try {
    $tabela = $pdo->query("SHOW TABLES LIKE 'usuarios'")->fetchColumn();

    if (!$tabela) {
        responderJson([
            'sucesso' => false,
            'backend_version' => BACKEND_VERSION,
            'mensagem' => 'A tabela usuarios nao existe.',
        ], 500);
    }

    $colunas = $pdo->query('SHOW COLUMNS FROM usuarios')->fetchAll(PDO::FETCH_COLUMN, 0);
    $obrigatorias = [
        'id_usuario',
        'nome_usuario',
        'cpf_usuario',
        'email_usuario',
        'senha_usuario',
        'data_nascimento',
        'telefone_usuario',
        'foto_usuario',
    ];

    $faltando = array_values(array_diff($obrigatorias, $colunas));
    $total = (int) $pdo->query('SELECT COUNT(*) FROM usuarios')->fetchColumn();

    responderJson([
        'sucesso' => empty($faltando),
        'backend_version' => BACKEND_VERSION,
        'banco' => DB_NAME,
        'tabela_usuarios' => true,
        'estrutura_compativel' => empty($faltando),
        'colunas_faltando' => $faltando,
        'total_usuarios' => $total,
        'mensagem' => empty($faltando)
            ? 'Backend e tabela usuarios prontos para cadastro.'
            : 'A tabela usuarios nao possui todas as colunas esperadas.',
    ], empty($faltando) ? 200 : 500);
} catch (Throwable $erro) {
    responderJson([
        'sucesso' => false,
        'backend_version' => BACKEND_VERSION,
        'mensagem' => 'Falha no diagnostico: ' . $erro->getMessage(),
    ], 500);
}
