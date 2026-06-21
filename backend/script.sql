CREATE DATABASE IF NOT EXISTS good_vibe;

USE good_vibe;

CREATE TABLE IF NOT EXISTS usuarios (
    email VARCHAR(150) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    url_foto VARCHAR(500) DEFAULT 'img/default/user_foto.webp',
    tipo_usuario ENUM('user', 'admin', 'superadmin') DEFAULT 'user' NOT NULL,
    token_recuperacao VARCHAR(255) NULL,
    token_expiracao DATETIME NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historico_senhas (
    usuario_email VARCHAR(255) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (usuario_email, senha_hash),
    FOREIGN KEY (usuario_email) REFERENCES usuarios(email) 
    ON DELETE CASCADE
) ENGINE=InnoDB;