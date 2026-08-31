-- =====================================================
-- SMARTFIX
-- BANCO DE DADOS - PAINEL ADMINISTRATIVO
-- REQUISITO FUNCIONAL RF20
-- =====================================================

-- Criação da tabela de usuários

CREATE TABLE usuarios (

    id SERIAL PRIMARY KEY,

    nome VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    senha VARCHAR(255) NOT NULL,

    tipo_usuario VARCHAR(20) NOT NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- =====================================================
-- TABELA DE CLIENTES
-- =====================================================

CREATE TABLE clientes (

    id SERIAL PRIMARY KEY,

    usuario_id INTEGER NOT NULL,

    cpf VARCHAR(14) UNIQUE,

    telefone VARCHAR(20),

    CONSTRAINT fk_cliente_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE

);


-- =====================================================
-- TABELA DE ASSISTÊNCIAS TÉCNICAS
-- =====================================================

CREATE TABLE assistencias (

    id SERIAL PRIMARY KEY,

    usuario_id INTEGER NOT NULL,

    nome_empresa VARCHAR(150) NOT NULL,

    cnpj VARCHAR(18) UNIQUE,

    telefone VARCHAR(20),

    regiao VARCHAR(100),

    CONSTRAINT fk_assistencia_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE

);


-- =====================================================
-- TABELA DE ENDEREÇOS
-- =====================================================

CREATE TABLE enderecos (

    id SERIAL PRIMARY KEY,

    cliente_id INTEGER NOT NULL,

    cep VARCHAR(9) NOT NULL,

    rua VARCHAR(150),

    numero VARCHAR(10),

    complemento VARCHAR(100),

    bairro VARCHAR(100),

    cidade VARCHAR(100),

    estado VARCHAR(2),

    CONSTRAINT fk_endereco_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE CASCADE

);


-- =====================================================
-- TABELA DE ORDENS DE SERVIÇO
-- =====================================================

CREATE TABLE ordens_servico (

    id SERIAL PRIMARY KEY,

    codigo_os VARCHAR(20) NOT NULL UNIQUE,

    cliente_id INTEGER NOT NULL,

    assistencia_id INTEGER,

    dispositivo VARCHAR(100) NOT NULL,

    servico VARCHAR(150) NOT NULL,

    descricao_defeito TEXT,

    regiao VARCHAR(100),

    status VARCHAR(30) NOT NULL DEFAULT 'Aguardando',

    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_os_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id),


    CONSTRAINT fk_os_assistencia
        FOREIGN KEY (assistencia_id)
        REFERENCES assistencias(id)

);


-- =====================================================
-- TABELA DE HISTÓRICO DE STATUS
-- =====================================================

CREATE TABLE historico_status (

    id SERIAL PRIMARY KEY,

    ordem_servico_id INTEGER NOT NULL,

    status_anterior VARCHAR(30),

    novo_status VARCHAR(30) NOT NULL,

    observacao TEXT,

    alterado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_historico_os
        FOREIGN KEY (ordem_servico_id)
        REFERENCES ordens_servico(id)
        ON DELETE CASCADE

);


-- =====================================================
-- TABELA DE CONFLITOS
-- =====================================================

CREATE TABLE conflitos (

    id SERIAL PRIMARY KEY,

    ordem_servico_id INTEGER NOT NULL,

    motivo TEXT NOT NULL,

    descricao TEXT,

    status VARCHAR(30) DEFAULT 'Aberto',

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_conflito_os
        FOREIGN KEY (ordem_servico_id)
        REFERENCES ordens_servico(id)
        ON DELETE CASCADE

);


-- =====================================================
-- TABELA DE MEDIAÇÕES
-- =====================================================

CREATE TABLE mediacoes (

    id SERIAL PRIMARY KEY,

    conflito_id INTEGER NOT NULL,

    administrador_id INTEGER NOT NULL,

    decisao VARCHAR(100) NOT NULL,

    observacao TEXT,

    data_mediacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_mediacao_conflito
        FOREIGN KEY (conflito_id)
        REFERENCES conflitos(id)
        ON DELETE CASCADE,


    CONSTRAINT fk_mediacao_administrador
        FOREIGN KEY (administrador_id)
        REFERENCES usuarios(id)

);


-- =====================================================
-- DADOS DE TESTE
-- =====================================================


-- ADMINISTRADOR

INSERT INTO usuarios
(nome, email, senha, tipo_usuario)

VALUES

(
    'Administrador SmartFix',
    'admin@smartfix.com',
    '123456',
    'ADMIN'
);


-- CLIENTES

INSERT INTO usuarios
(nome, email, senha, tipo_usuario)

VALUES

(
    'João Silva',
    'joao@email.com',
    '123456',
    'CLIENTE'
),

(
    'Maria Santos',
    'maria@email.com',
    '123456',
    'CLIENTE'
),

(
    'Ana Souza',
    'ana@email.com',
    '123456',
    'CLIENTE'
);


-- REGISTRO DOS CLIENTES

INSERT INTO clientes
(usuario_id, cpf, telefone)

VALUES

(2, '111.111.111-11', '(11) 99999-1111'),

(3, '222.222.222-22', '(11) 99999-2222'),

(4, '333.333.333-33', '(11) 99999-3333');


-- ASSISTÊNCIAS

INSERT INTO usuarios
(nome, email, senha, tipo_usuario)

VALUES

(
    'TechFix Barueri',
    'techfix@email.com',
    '123456',
    'PARCEIRO'
),

(
    'SmartTech Osasco',
    'smarttech@email.com',
    '123456',
    'PARCEIRO'
),

(
    'Fast Repair',
    'fastrepair@email.com',
    '123456',
    'PARCEIRO'
);


INSERT INTO assistencias
(usuario_id, nome_empresa, cnpj, telefone, regiao)

VALUES

(
    5,
    'TechFix Barueri',
    '11.111.111/0001-11',
    '(11) 98888-1111',
    'Barueri'
),

(
    6,
    'SmartTech Osasco',
    '22.222.222/0001-22',
    '(11) 98888-2222',
    'Osasco'
),

(
    7,
    'Fast Repair',
    '33.333.333/0001-33',
    '(11) 98888-3333',
    'Carapicuíba'
);


-- =====================================================
-- ORDENS DE SERVIÇO DE TESTE
-- =====================================================

INSERT INTO ordens_servico

(
    codigo_os,
    cliente_id,
    assistencia_id,
    dispositivo,
    servico,
    descricao_defeito,
    regiao,
    status
)

VALUES

(
    'SF001',
    1,
    1,
    'Smartphone',
    'Troca de Tela',
    'Tela quebrada após queda.',
    'Barueri',
    'Em Reparo'
),

(
    'SF002',
    2,
    2,
    'Notebook',
    'Reparo de Notebook',
    'Notebook não liga.',
    'Osasco',
    'Aguardando'
),

(
    'SF003',
    1,
    1,
    'Smartphone',
    'Troca de Bateria',
    'Bateria descarregando rapidamente.',
    'Barueri',
    'Concluído'
),

(
    'SF004',
    3,
    3,
    'Smartphone',
    'Reparo de Smartphone',
    'Problema após realização do serviço.',
    'Carapicuíba',
    'Conflito'
);


-- =====================================================
-- CONFLITO DE TESTE
-- =====================================================

INSERT INTO conflitos

(
    ordem_servico_id,
    motivo,
    descricao,
    status
)

VALUES

(
    4,
    'Divergência sobre o serviço realizado',
    'O cliente informou que o problema do aparelho continuou após o reparo.',
    'Aberto'
);