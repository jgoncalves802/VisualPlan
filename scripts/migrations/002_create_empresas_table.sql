-- Create empresas table for VisionPlan
-- Run this script in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  logo_url TEXT,
  tema_config JSONB DEFAULT '{
    "primary": "#0ea5e9",
    "secondary": "#64748b",
    "accent": "#8b5cf6",
    "success": "#22c55e",
    "warning": "#f59e0b",
    "danger": "#ef4444",
    "bgMain": "#ffffff",
    "bgSecondary": "#f8fafc",
    "textPrimary": "#1e293b",
    "textSecondary": "#64748b",
    "border": "#e2e8f0"
  }'::jsonb,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add empresa_id foreign key to usuarios table
ALTER TABLE public.usuarios 
ADD CONSTRAINT fk_usuarios_empresa 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;

-- Create updated_at trigger for empresas
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index
CREATE INDEX IF NOT EXISTS idx_empresas_ativo ON public.empresas(ativo);

-- Create a default company
INSERT INTO public.empresas (id, nome, cnpj)
VALUES ('00000000-0000-0000-0000-000000000001', 'VisionPlan Demo', '00.000.000/0001-00');

-- Update admin user to belong to the default company
UPDATE public.usuarios 
SET empresa_id = '00000000-0000-0000-0000-000000000001'
WHERE perfil_acesso = 'ADMIN';
