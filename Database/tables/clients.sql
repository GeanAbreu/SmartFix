-- ============================================================
-- SmartFix
-- Tabela: clients
-- Descrição: Armazena os dados dos clientes da plataforma
-- Banco: PostgreSQL / Supabase
-- ============================================================

CREATE TABLE public.clients (
    -- Mesmo ID do usuário cadastrado no Supabase Auth
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    -- Dados pessoais
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    cpf TEXT UNIQUE NOT NULL,
    data_nascimento DATE,

    -- Endereço
    cep TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    municipio TEXT,
    uf TEXT,

    -- Data de criação
    criado_em TIMESTAMPTZ,

    -- Senha
    senha TEXT
);
