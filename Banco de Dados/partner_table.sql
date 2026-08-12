-- ==============================================================================
-- Migration: Create repair_shops and employees tables with RLS and triggers
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Habilita a extensão para automação do campo 'updated_at' (se ainda não ativa)
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- 2. Criar a tabela da Assistência Técnica ('repair_shops')
CREATE TABLE public.repair_shops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    company_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(20) UNIQUE NOT NULL, -- CNPJ (formato: 00.000.000/0000-00 ou 14 dígitos)
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    
    -- Vincula a loja ao usuário parceiro do Supabase Auth
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL
);

-- 3. Criar a tabela de Funcionários ('employees')
CREATE TABLE public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    full_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(14) NOT NULL, -- CPF (removido UNIQUE global para evitar conflito se cadastrado em lojas diferentes)
    role VARCHAR(100),           -- Cargo (ex: "Técnico", "Atendente")
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- CHAVE ESTRANGEIRA (FK): Vincula o funcionário à Assistência Técnica
    repair_shop_id UUID REFERENCES public.repair_shops(id) ON DELETE CASCADE NOT NULL
);

-- 4. Triggers para atualização automática do campo 'updated_at'
CREATE TRIGGER handle_updated_at_repair_shops 
    BEFORE UPDATE ON public.repair_shops
    FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_employees 
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

-- 5. Habilitar Row Level Security (RLS) nas duas tabelas
ALTER TABLE public.repair_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 6. POLÍTICAS DE SEGURANÇA (RLS)
-- ==============================================================================

--------------------------------------------------------------------------------
-- POLÍTICAS PARA 'repair_shops' (O dono da loja acessa apenas a sua própria loja)
--------------------------------------------------------------------------------

CREATE POLICY "Users can view their own repair shop" 
ON public.repair_shops FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own repair shop" 
ON public.repair_shops FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repair shop" 
ON public.repair_shops FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repair shop" 
ON public.repair_shops FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- POLÍTICAS PARA 'employees' (O dono da loja só lê/edita os funcionários da SUA loja)
--------------------------------------------------------------------------------

CREATE POLICY "Shop owners can view their employees" 
ON public.employees FOR SELECT 
TO authenticated 
USING (
    repair_shop_id IN (
        SELECT id FROM public.repair_shops WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Shop owners can insert employees to their shop" 
ON public.employees FOR INSERT 
TO authenticated 
WITH CHECK (
    repair_shop_id IN (
        SELECT id FROM public.repair_shops WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Shop owners can update their employees" 
ON public.employees FOR UPDATE 
TO authenticated 
USING (
    repair_shop_id IN (
        SELECT id FROM public.repair_shops WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Shop owners can delete their employees" 
ON public.employees FOR DELETE 
TO authenticated 
USING (
    repair_shop_id IN (
        SELECT id FROM public.repair_shops WHERE user_id = auth.uid()
    )
);
