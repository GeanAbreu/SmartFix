-- ============================================================
-- SmartFix
-- Tabela: partner
-- Descrição: Armazena os dados das assistências técnicas parceiras
-- Banco: PostgreSQL / Supabase
-- ============================================================

CREATE TABLE public.partner (
    id UUID PRIMARY KEY,

    -- Dados principais
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    cnpj TEXT UNIQUE NOT NULL,
    data_nascimento DATE,

    -- Endereço
    cep TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    municipio TEXT,
    uf TEXT,

    -- Controle da assistência
    is_approved BOOLEAN,
    rating NUMERIC,

    -- Auditoria
    criado_em TIMESTAMPTZ,

    -- Senha
    senha TEXT
);
