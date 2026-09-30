<?php

declare(strict_types=1);

require_once __DIR__ . '/conexao.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responderJson([
        'sucesso' => false,
        'mensagem' => 'Metodo nao permitido. Utilize POST.',
    ], 405);
}

$dados = lerCorpoJson();
$email = strtolower(trim((string) ($dados['email_usuario'] ?? '')));
$senha = (string) ($dados['senha_usuario'] ?? '');

if ($email === '' || $senha === '') {
    responderJson(['sucesso' => false, 'mensagem' => 'Informe o e-mail e a senha.'], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responderJson(['sucesso' => false, 'mensagem' => 'Informe um e-mail valido.'], 422);
}

try {
    $stmt = $pdo->prepare(
        'SELECT
            id_usuario,
            nome_usuario,
            cpf_usuario,
            email_usuario,
            senha_usuario,
            data_nascimento,
            telefone_usuario,
            foto_usuario,
            criado_em,
            atualizado_em
         FROM usuarios
         WHERE email_usuario = :email
         LIMIT 1'
    );

    $stmt->execute([':email' => $email]);
    $usuario = $stmt->fetch();

    if (!$usuario || !password_verify($senha, (string) $usuario['senha_usuario'])) {
        responderJson(['sucesso' => false, 'mensagem' => 'E-mail ou senha incorretos.'], 401);
    }

    if (password_needs_rehash((string) $usuario['senha_usuario'], PASSWORD_DEFAULT)) {
        $novoHash = password_hash($senha, PASSWORD_DEFAULT);
        if ($novoHash !== false) {
            $update = $pdo->prepare('UPDATE usuarios SET senha_usuario = :senha WHERE id_usuario = :id');
            $update->execute([
                ':senha' => $novoHash,
                ':id' => $usuario['id_usuario'],
            ]);
        }
    }

    unset($usuario['senha_usuario']);
    $usuario['id_usuario'] = (int) $usuario['id_usuario'];

    responderJson([
        'sucesso' => true,
        'mensagem' => 'Login realizado com sucesso.',
        'backend_version' => BACKEND_VERSION,
        'usuario' => $usuario,
    ]);
} catch (PDOException $erro) {
    error_log('Rebirth login: ' . $erro->getMessage());

    responderJson([
        'sucesso' => false,
        'mensagem' => 'Nao foi possivel realizar o login.',
        'backend_version' => BACKEND_VERSION,
    ], 500);
}
