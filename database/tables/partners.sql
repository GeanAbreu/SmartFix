-- ============================================================
-- SmartFix
-- Tabela: partner
-- Descrição: Armazena os dados das assistências técnicas parceiras
-- Banco: PostgreSQL / Supabase
-- ============================================================

CREATE TABLE public.partner (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Dados principais
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    cnpj TEXT UNIQUE NOT NULL,
    company_name TEXT,

    -- Controle da assistência
    is_approved BOOLEAN DEFAULT false,

    -- Auditoria
    criado_em TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Senha
    senha TEXT
);
