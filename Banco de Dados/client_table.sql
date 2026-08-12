-- ==============================================================================
-- Migration: Create customers table with RLS and updated_at trigger
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Habilita a extensão para automação do campo 'updated_at'
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- 2. Criar a tabela 'customers'
CREATE TABLE public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Dados cadastrais
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    tax_id VARCHAR(20) UNIQUE, -- Suporta CPF (11/14 chars) e CNPJ (14/18 chars)
    birth_date DATE,
    
    -- Vinculo com a conta de autenticação do Supabase
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE
);

-- 3. Trigger para atualizar 'updated_at' automaticamente em edições
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso Granulares (RLS)

-- Permite leitura apenas dos próprios dados
CREATE POLICY "Users can view their own customer data" 
ON public.customers FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Permite inserção apenas se for para o próprio ID
CREATE POLICY "Users can insert their own customer data" 
ON public.customers FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permite atualização apenas dos próprios dados
CREATE POLICY "Users can update their own customer data" 
ON public.customers FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Permite exclusão apenas do próprio registro
CREATE POLICY "Users can delete their own customer data" 
ON public.customers FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);
