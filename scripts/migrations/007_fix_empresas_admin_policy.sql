-- Fix RLS policies for empresas table to allow admins to see all companies
-- Run this script in Supabase SQL Editor

-- Drop the restrictive policy
DROP POLICY IF EXISTS "users_view_own_empresa" ON public.empresas;

-- Create a more flexible SELECT policy:
-- 1. ADMIN users can see ALL companies
-- 2. Other users can only see their own company
CREATE POLICY "users_view_empresas" ON public.empresas
  FOR SELECT
  USING (
    -- Admins can see all companies
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
        AND perfil_acesso = 'ADMIN'
    )
    OR
    -- Other users can only see their own company
    id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE id = auth.uid()
    )
  );

-- Also update INSERT policy to be more flexible for admins
DROP POLICY IF EXISTS "admin_insert_empresa" ON public.empresas;

CREATE POLICY "admin_insert_empresa" ON public.empresas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
        AND perfil_acesso = 'ADMIN'
    )
  );

-- Update DELETE policy for admins
DROP POLICY IF EXISTS "admin_delete_empresa" ON public.empresas;

CREATE POLICY "admin_delete_empresa" ON public.empresas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
        AND perfil_acesso = 'ADMIN'
    )
  );

-- Update UPDATE policy to allow admins to update any company
DROP POLICY IF EXISTS "admin_diretor_update_empresa" ON public.empresas;

CREATE POLICY "admin_update_empresa" ON public.empresas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
        AND perfil_acesso = 'ADMIN'
    )
    OR
    id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE id = auth.uid() 
        AND perfil_acesso IN ('DIRETOR')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
        AND perfil_acesso = 'ADMIN'
    )
    OR
    id IN (
      SELECT empresa_id FROM public.usuarios 
      WHERE id = auth.uid() 
        AND perfil_acesso IN ('DIRETOR')
    )
  );

-- Insert sample companies for testing
INSERT INTO public.empresas (nome, cnpj, ativo)
VALUES 
  ('Construtora ABC', '12.345.678/0001-90', true),
  ('Engenharia XYZ', '98.765.432/0001-10', true),
  ('Incorporadora Delta', '11.222.333/0001-44', true)
ON CONFLICT DO NOTHING;
