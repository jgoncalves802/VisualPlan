-- ============================================
-- MIGRATION 008: Adicionar Peso Estimado para WBS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Adicionar coluna peso_estimado à tabela eps_nodes
-- Default = 1.0 (representa 100% ou peso unitário)
ALTER TABLE eps_nodes 
ADD COLUMN IF NOT EXISTS peso_estimado DECIMAL(10,4) DEFAULT 1.0;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN eps_nodes.peso_estimado IS 'Peso estimado da WBS (default 1.0 = 100%). A soma dos pesos dos filhos deve totalizar 100% no nível do projeto (EPS).';

-- PRONTO! Coluna peso_estimado adicionada.
