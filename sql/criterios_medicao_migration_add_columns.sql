-- =====================================================
-- MIGRAÇÃO: Adicionar colunas faltantes em takeoff_medicoes
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Adicionar coluna periodo_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'takeoff_medicoes' AND column_name = 'periodo_id'
  ) THEN
    ALTER TABLE takeoff_medicoes ADD COLUMN periodo_id UUID;
  END IF;
END $$;

-- Criar índice para periodo_id se não existir
CREATE INDEX IF NOT EXISTS idx_takeoff_medicoes_periodo ON takeoff_medicoes(periodo_id);

-- Remover e recriar policies para takeoff_medicoes
DROP POLICY IF EXISTS "takeoff_medicoes_select" ON takeoff_medicoes;
DROP POLICY IF EXISTS "takeoff_medicoes_insert" ON takeoff_medicoes;
DROP POLICY IF EXISTS "takeoff_medicoes_update" ON takeoff_medicoes;
DROP POLICY IF EXISTS "takeoff_medicoes_delete" ON takeoff_medicoes;

CREATE POLICY "takeoff_medicoes_select" ON takeoff_medicoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "takeoff_medicoes_insert" ON takeoff_medicoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "takeoff_medicoes_update" ON takeoff_medicoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "takeoff_medicoes_delete" ON takeoff_medicoes FOR DELETE TO authenticated USING (true);

-- Agora executar o resto da migration para as outras tabelas
-- Remover policies existentes antes de recriar
DROP POLICY IF EXISTS "criterios_medicao_select" ON criterios_medicao;
DROP POLICY IF EXISTS "criterios_medicao_insert" ON criterios_medicao;
DROP POLICY IF EXISTS "criterios_medicao_update" ON criterios_medicao;
DROP POLICY IF EXISTS "criterios_medicao_delete" ON criterios_medicao;

DROP POLICY IF EXISTS "criterios_etapas_select" ON criterios_medicao_etapas;
DROP POLICY IF EXISTS "criterios_etapas_insert" ON criterios_medicao_etapas;
DROP POLICY IF EXISTS "criterios_etapas_update" ON criterios_medicao_etapas;
DROP POLICY IF EXISTS "criterios_etapas_delete" ON criterios_medicao_etapas;

DROP POLICY IF EXISTS "item_criterio_select" ON item_criterio_medicao;
DROP POLICY IF EXISTS "item_criterio_insert" ON item_criterio_medicao;
DROP POLICY IF EXISTS "item_criterio_update" ON item_criterio_medicao;
DROP POLICY IF EXISTS "item_criterio_delete" ON item_criterio_medicao;

DROP POLICY IF EXISTS "avancos_etapas_select" ON avancos_etapas;
DROP POLICY IF EXISTS "avancos_etapas_insert" ON avancos_etapas;
DROP POLICY IF EXISTS "avancos_etapas_update" ON avancos_etapas;
DROP POLICY IF EXISTS "avancos_etapas_delete" ON avancos_etapas;

DROP POLICY IF EXISTS "avancos_aprovacoes_select" ON avancos_aprovacoes;
DROP POLICY IF EXISTS "avancos_aprovacoes_insert" ON avancos_aprovacoes;
DROP POLICY IF EXISTS "avancos_aprovacoes_update" ON avancos_aprovacoes;
DROP POLICY IF EXISTS "avancos_aprovacoes_delete" ON avancos_aprovacoes;

-- Criar políticas de acesso
CREATE POLICY "criterios_medicao_select" ON criterios_medicao FOR SELECT TO authenticated USING (true);
CREATE POLICY "criterios_medicao_insert" ON criterios_medicao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "criterios_medicao_update" ON criterios_medicao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "criterios_medicao_delete" ON criterios_medicao FOR DELETE TO authenticated USING (true);

CREATE POLICY "criterios_etapas_select" ON criterios_medicao_etapas FOR SELECT TO authenticated USING (true);
CREATE POLICY "criterios_etapas_insert" ON criterios_medicao_etapas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "criterios_etapas_update" ON criterios_medicao_etapas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "criterios_etapas_delete" ON criterios_medicao_etapas FOR DELETE TO authenticated USING (true);

CREATE POLICY "item_criterio_select" ON item_criterio_medicao FOR SELECT TO authenticated USING (true);
CREATE POLICY "item_criterio_insert" ON item_criterio_medicao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "item_criterio_update" ON item_criterio_medicao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "item_criterio_delete" ON item_criterio_medicao FOR DELETE TO authenticated USING (true);

CREATE POLICY "avancos_etapas_select" ON avancos_etapas FOR SELECT TO authenticated USING (true);
CREATE POLICY "avancos_etapas_insert" ON avancos_etapas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "avancos_etapas_update" ON avancos_etapas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "avancos_etapas_delete" ON avancos_etapas FOR DELETE TO authenticated USING (true);

CREATE POLICY "avancos_aprovacoes_select" ON avancos_aprovacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "avancos_aprovacoes_insert" ON avancos_aprovacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "avancos_aprovacoes_update" ON avancos_aprovacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "avancos_aprovacoes_delete" ON avancos_aprovacoes FOR DELETE TO authenticated USING (true);
