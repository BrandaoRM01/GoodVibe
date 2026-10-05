CREATE DATABASE IF NOT EXISTS good_vibe;

USE good_vibe;

CREATE TABLE IF NOT EXISTS usuarios (
    email VARCHAR(150) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    url_foto VARCHAR(500) DEFAULT NULL,
    tipo_usuario ENUM('user', 'admin', 'superadmin') DEFAULT 'user' NOT NULL,
    token_recuperacao VARCHAR(255) NULL,
    token_expiracao DATETIME NULL,
    qtd_seguidores INT UNSIGNED NOT NULL DEFAULT 0,
    qtd_seguindo INT UNSIGNED NOT NULL DEFAULT 0,
    descricao_perfil VARCHAR(500) DEFAULT NULL,
    data_entrada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    url_capa VARCHAR(500) DEFAULT NULL,
    localizacao VARCHAR(150) DEFAULT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historico_senhas (
    usuario_email VARCHAR(255) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (usuario_email, senha_hash),
    FOREIGN KEY (usuario_email) REFERENCES usuarios(email) 
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS postagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conteudo TEXT NOT NULL,
    url_imagem VARCHAR(500) DEFAULT NULL,
    boa_acao VARCHAR(100) DEFAULT NULL,
    total_curtidas INT NOT NULL DEFAULT 0,
    total_comentarios INT NOT NULL DEFAULT 0,
    total_compartilhamentos INT NOT NULL DEFAULT 0,
    status ENUM('rejeitado', 'pendente', 'aprovado') NOT NULL DEFAULT 'aprovado',
    autor_email VARCHAR(150) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (autor_email) REFERENCES usuarios(email)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS postagens_tags (
    postagem_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (postagem_id, tag_id),
    FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS curtidas (
    postagem_id INT NOT NULL,
    usuario_email VARCHAR(150) NOT NULL,
    PRIMARY KEY (postagem_id, usuario_email),
    FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_email) REFERENCES usuarios(email) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    postagem_id INT NOT NULL,
    autor_email VARCHAR(150) NOT NULL,
    comentario_pai_id INT DEFAULT NULL,
    conteudo VARCHAR(500) NOT NULL,
    profundidade TINYINT UNSIGNED NOT NULL DEFAULT 0,
    total_curtidas INT NOT NULL DEFAULT 0,
    total_respostas INT NOT NULL DEFAULT 0,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_em DATETIME DEFAULT NULL,

    FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,
    FOREIGN KEY (autor_email) REFERENCES usuarios(email) ON DELETE CASCADE,
    FOREIGN KEY (comentario_pai_id) REFERENCES comentarios(id) ON DELETE CASCADE,

    INDEX idx_comentarios_postagem_raiz (postagem_id, comentario_pai_id, criado_em),
    INDEX idx_comentarios_pai (comentario_pai_id, criado_em)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS curtidas_comentarios (
    comentario_id INT NOT NULL,
    usuario_email VARCHAR(150) NOT NULL,
    PRIMARY KEY (comentario_id, usuario_email),
    FOREIGN KEY (comentario_id) REFERENCES comentarios(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_email) REFERENCES usuarios(email) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW vw_postagens AS
SELECT
    p.id, p.conteudo, p.url_imagem, p.boa_acao,
    p.total_curtidas, p.total_comentarios, p.total_compartilhamentos,
    p.status, p.criado_em, p.autor_email,

    u.username AS autor_username,
    u.url_foto AS autor_url_foto,
    u.tipo_usuario AS autor_tipo_usuario,

    t.id AS tag_id,
    t.nome AS tag_nome,

    c.usuario_email AS curtida_usuario_email

FROM postagens p
    INNER JOIN usuarios u ON p.autor_email = u.email
    LEFT JOIN postagens_tags pt ON pt.postagem_id = p.id
    LEFT JOIN tags t ON pt.tag_id = t.id
    LEFT JOIN curtidas c ON c.postagem_id = p.id;