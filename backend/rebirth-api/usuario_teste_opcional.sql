USE rebirth_prosthetics;

-- Usuario opcional para testar o login.
-- E-mail: yagopegazu@gmail.com
-- Senha: 123456
-- Se o e-mail ou CPF ja existir, o INSERT sera ignorado.
INSERT IGNORE INTO usuarios (
    nome_usuario,
    cpf_usuario,
    email_usuario,
    senha_usuario,
    data_nascimento,
    telefone_usuario,
    foto_usuario
) VALUES (
    'Yago',
    '52998224725',
    'yagopegazu@gmail.com',
    '$2y$12$aAYQGJd.40h.XF.0eq2h/uNRG0lzsLi.zhA0X79U2tiL4KFxjfrSe',
    NULL,
    NULL,
    NULL
);
