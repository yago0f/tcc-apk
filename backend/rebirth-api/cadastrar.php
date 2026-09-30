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

$nome = trim((string) ($dados['nome_usuario'] ?? ''));
$cpf = apenasNumeros((string) ($dados['cpf_usuario'] ?? ''));
$email = strtolower(trim((string) ($dados['email_usuario'] ?? '')));
$senha = (string) ($dados['senha_usuario'] ?? '');
$dataNascimento = trim((string) ($dados['data_nascimento'] ?? ''));
$telefone = trim((string) ($dados['telefone_usuario'] ?? ''));
$telefoneNumeros = apenasNumeros($telefone);

if ($nome === '' || $cpf === '' || $email === '' || $senha === '' || $dataNascimento === '' || $telefone === '') {
    responderJson([
        'sucesso' => false,
        'mensagem' => 'Preencha nome, CPF, data de nascimento, telefone, e-mail e senha.',
    ], 422);
}

if (strlen($nome) < 3 || strlen($nome) > 120) {
    responderJson(['sucesso' => false, 'mensagem' => 'Informe um nome valido.'], 422);
}

if (strlen($cpf) !== 11) {
    responderJson(['sucesso' => false, 'mensagem' => 'O CPF precisa possuir 11 numeros.'], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responderJson(['sucesso' => false, 'mensagem' => 'Informe um e-mail valido.'], 422);
}

if (strlen($senha) < 6) {
    responderJson(['sucesso' => false, 'mensagem' => 'A senha precisa ter pelo menos 6 caracteres.'], 422);
}

$data = DateTimeImmutable::createFromFormat('!Y-m-d', $dataNascimento);
$hoje = new DateTimeImmutable('today');

if (!$data || $data->format('Y-m-d') !== $dataNascimento || $data > $hoje || (int) $data->format('Y') < 1900) {
    responderJson(['sucesso' => false, 'mensagem' => 'Informe uma data de nascimento valida.'], 422);
}

if (strlen($telefoneNumeros) < 10 || strlen($telefoneNumeros) > 11) {
    responderJson(['sucesso' => false, 'mensagem' => 'Informe um telefone valido com DDD.'], 422);
}

$senhaHash = password_hash($senha, PASSWORD_DEFAULT);

if ($senhaHash === false) {
    responderJson(['sucesso' => false, 'mensagem' => 'Nao foi possivel proteger a senha.'], 500);
}

try {
    $sql = 'INSERT INTO usuarios (
                nome_usuario,
                cpf_usuario,
                email_usuario,
                senha_usuario,
                data_nascimento,
                telefone_usuario
            ) VALUES (
                :nome,
                :cpf,
                :email,
                :senha,
                :data_nascimento,
                :telefone
            )';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nome' => $nome,
        ':cpf' => $cpf,
        ':email' => $email,
        ':senha' => $senhaHash,
        ':data_nascimento' => $dataNascimento,
        ':telefone' => $telefone,
    ]);

    $idUsuario = (int) $pdo->lastInsertId();

    responderJson([
        'sucesso' => true,
        'mensagem' => 'Cadastro realizado com sucesso.',
        'backend_version' => BACKEND_VERSION,
        'usuario' => [
            'id_usuario' => $idUsuario,
            'nome_usuario' => $nome,
            'cpf_usuario' => $cpf,
            'email_usuario' => $email,
            'data_nascimento' => $dataNascimento,
            'telefone_usuario' => $telefone,
            'foto_usuario' => null,
        ],
    ], 201);
} catch (PDOException $erro) {
    $sqlState = (string) $erro->getCode();
    $mysqlError = $erro->errorInfo[1] ?? null;

    if ($sqlState === '23000' || $mysqlError === 1062) {
        responderJson([
            'sucesso' => false,
            'mensagem' => 'Este e-mail ou CPF ja esta cadastrado.',
            'backend_version' => BACKEND_VERSION,
        ], 409);
    }

    error_log('Rebirth cadastro: ' . $erro->getMessage());

    responderJson([
        'sucesso' => false,
        'mensagem' => 'Nao foi possivel concluir o cadastro.',
        'backend_version' => BACKEND_VERSION,
    ], 500);
}
