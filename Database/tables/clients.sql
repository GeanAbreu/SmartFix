-- ============================================================
-- SmartFix
-- Tabela: clients
-- Descrição: Armazena os dados dos clientes da plataforma
-- Banco: PostgreSQL / Supabase
-- ============================================================

CREATE TABLE public.clients (
    -- Autenticação própria do SmartFix
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Dados pessoais
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    cpf TEXT UNIQUE NOT NULL,
    data_nascimento DATE,

    avatar_url TEXT,

    -- Data de criação
    criado_em TIMESTAMPTZ DEFAULT now(),

    -- Senha
    senha TEXT
);
