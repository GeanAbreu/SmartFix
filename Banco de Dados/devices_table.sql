-- ==============================================================================
-- Migration: Create devices table with RLS and updated_at trigger
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Habilita a extensão para automação do campo 'updated_at' (se ainda não ativa)
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- 2. Criar a tabela 'devices'
CREATE TABLE public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Tipo de Aparelho (smartphone, notebook, desktop, smartwatch, etc.)
    device_type VARCHAR(50) NOT NULL,
    
    -- Marca (Samsung, Apple, Motorola, Dell, etc.)
    brand VARCHAR(50) NOT NULL,
    
    -- Modelo (Galaxy A20, Galaxy S22, iPhone 13, etc.)
    model VARCHAR(100) NOT NULL,
    
    -- Tipo de Problema (Tela quebrada, Não carrega, Parou de funcionar, etc.)
    issue_type VARCHAR(100) NOT NULL,
    
    -- Detalhamento opcional do problema
    issue_description TEXT,
    
    -- Chave Estrangeira vinculando o dispositivo ao usuário (Supabase Auth)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- 3. Trigger para atualização automática do campo 'updated_at'
CREATE TRIGGER handle_updated_at_devices 
    BEFORE UPDATE ON public.devices
    FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 5. POLÍTICAS DE SEGURANÇA (RLS)
-- ==============================================================================

-- Leitura: Usuários podem ver apenas seus próprios dispositivos
CREATE POLICY "Users can view their own devices" 
ON public.devices FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Inserção: Usuários podem cadastrar apenas dispositivos vinculados a si mesmos
CREATE POLICY "Users can insert their own devices" 
ON public.devices FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Atualização: Usuários podem editar apenas seus próprios dispositivos
CREATE POLICY "Users can update their own devices" 
ON public.devices FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Exclusão: Usuários podem deletar apenas seus próprios dispositivos
CREATE POLICY "Users can delete their own devices" 
ON public.devices FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
