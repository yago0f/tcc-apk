USE rebirth_prosthetics;

SELECT * FROM schema_version;
SHOW TABLES;
DESCRIBE usuarios;
SELECT id_usuario, nome_usuario, cpf_usuario, email_usuario, data_nascimento, telefone_usuario, criado_em
FROM usuarios
ORDER BY id_usuario DESC;
