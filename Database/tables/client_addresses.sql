-- ============================================================
-- SmartFix
-- Tabela: client_addresses
-- Descrição: Endereços de clientes e parceiros, com proprietário exclusivo
-- Banco: PostgreSQL / Supabase
-- ============================================================

CREATE TABLE public.client_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Cliente proprietário do endereço
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.partner(id) ON DELETE CASCADE,

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
    is_principal BOOLEAN DEFAULT false,
    CONSTRAINT client_addresses_exactly_one_owner
      CHECK ((client_id IS NOT NULL)::int + (partner_id IS NOT NULL)::int = 1)
);
