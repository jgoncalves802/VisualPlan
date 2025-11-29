-- Create usuarios table for VisionPlan
-- Run this script in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  empresa_id UUID,
  camada_governanca TEXT NOT NULL CHECK (camada_governanca IN ('PROPONENTE', 'FISCALIZACAO', 'CONTRATADA')),
  perfil_acesso TEXT NOT NULL CHECK (perfil_acesso IN ('ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'MESTRE_OBRAS', 'ENCARREGADO', 'COLABORADOR', 'FISCALIZACAO_LEAD', 'FISCALIZACAO_TECNICO')),
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can view own profile" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

-- Create policy for admins to manage all users
CREATE POLICY "Admins can manage all users" ON public.usuarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND perfil_acesso IN ('ADMIN', 'DIRETOR')
    )
  );

-- Create policy for authenticated users to view other users (read-only)
CREATE POLICY "Authenticated users can view all users" ON public.usuarios
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON public.usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON public.usuarios(perfil_acesso);
CREATE INDEX IF NOT EXISTS idx_usuarios_camada ON public.usuarios(camada_governanca);
