-- ============================================================
-- SmartFix
-- Tabela: client_devices
-- Descrição: Armazena os dispositivos cadastrados pelos clientes
-- Banco: PostgreSQL / Supabase
-- ============================================================

CREATE TABLE public.client_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Cliente proprietário do dispositivo
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,

    -- Dados do dispositivo
    tipo TEXT NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT,
    foto_url TEXT NOT NULL
);
