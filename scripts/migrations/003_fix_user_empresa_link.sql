-- Script de diagnóstico e correção para VisionPlan
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela empresas existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'empresas'
) as tabela_empresas_existe;

-- 2. Verificar se há empresas cadastradas
SELECT id, nome, cnpj, logo_url, ativo FROM public.empresas;

-- 3. Verificar os usuários e seus vínculos com empresa
SELECT 
  u.id, 
  u.nome, 
  u.email, 
  u.perfil_acesso,
  u.auth_id,
  u.empresa_id,
  e.nome as empresa_nome
FROM public.usuarios u
LEFT JOIN public.empresas e ON u.empresa_id = e.id;

-- 4. Se a tabela empresas não existir, execute a migração 002 primeiro!

-- 5. Se não houver empresa, criar uma empresa padrão:
INSERT INTO public.empresas (id, nome, cnpj, ativo)
VALUES ('00000000-0000-0000-0000-000000000001', 'VisionPlan Demo', '00.000.000/0001-00', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Vincular TODOS os usuários ADMIN à empresa padrão (se não tiverem empresa)
UPDATE public.usuarios 
SET empresa_id = '00000000-0000-0000-0000-000000000001'
WHERE empresa_id IS NULL;

-- 7. Verificar novamente os vínculos
SELECT 
  u.id, 
  u.nome, 
  u.email, 
  u.perfil_acesso,
  u.auth_id,
  u.empresa_id,
  e.nome as empresa_nome
FROM public.usuarios u
LEFT JOIN public.empresas e ON u.empresa_id = e.id;

-- 8. Verificar se o auth_id está preenchido (deve corresponder ao ID do Supabase Auth)
-- Se auth_id estiver NULL, você precisa preencher manualmente com o ID do usuário do Auth
-- Você pode encontrar o ID do usuário em Authentication > Users no painel do Supabase
