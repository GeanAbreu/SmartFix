-- ============================================================
-- SmartFix
-- Tabela: client_addresses
-- Descrição: Armazena os endereços cadastrados pelos clientes
-- Banco: PostgreSQL / Supabase
-- ============================================================

CREATE TABLE public.client_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Cliente proprietário do endereço
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,

    -- Identificação do endereço
    apelido TEXT NOT NULL,

    -- Dados do endereço
    cep TEXT NOT NULL,
    logradouro TEXT NOT NULL,
    numero TEXT NOT NULL,
    complemento TEXT,
    bairro TEXT NOT NULL,
    municipio TEXT NOT NULL,
    uf TEXT NOT NULL,

    -- Define se este é o endereço principal do cliente
    is_principal BOOLEAN
);
