-- ============================================================================
-- Fix RLS Policies - Aceites e Interferências
-- VisionPlan Construction Project Management Platform
-- ============================================================================
-- Implements proper empresa_id scoped RLS policies for security

-- Drop existing permissive policies
DROP POLICY IF EXISTS aceites_programacao_select_policy ON aceites_programacao;
DROP POLICY IF EXISTS aceites_programacao_insert_policy ON aceites_programacao;
DROP POLICY IF EXISTS aceites_programacao_update_policy ON aceites_programacao;
DROP POLICY IF EXISTS aceites_programacao_delete_policy ON aceites_programacao;

DROP POLICY IF EXISTS interferencias_obra_select_policy ON interferencias_obra;
DROP POLICY IF EXISTS interferencias_obra_insert_policy ON interferencias_obra;
DROP POLICY IF EXISTS interferencias_obra_update_policy ON interferencias_obra;
DROP POLICY IF EXISTS interferencias_obra_delete_policy ON interferencias_obra;

-- ============================================================================
-- RLS Policies for aceites_programacao (empresa_id scoped)
-- ============================================================================

CREATE POLICY aceites_programacao_select_policy ON aceites_programacao
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuario_empresa 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY aceites_programacao_insert_policy ON aceites_programacao
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuario_empresa 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY aceites_programacao_update_policy ON aceites_programacao
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuario_empresa 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY aceites_programacao_delete_policy ON aceites_programacao
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuario_empresa 
      WHERE usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS Policies for interferencias_obra (empresa_id scoped)
-- ============================================================================

CREATE POLICY interferencias_obra_select_policy ON interferencias_obra
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuario_empresa 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY interferencias_obra_insert_policy ON interferencias_obra
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuario_empresa 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY interferencias_obra_update_policy ON interferencias_obra
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuario_empresa 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY interferencias_obra_delete_policy ON interferencias_obra
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuario_empresa 
      WHERE usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- Function to convert interference to restriction atomically
-- ============================================================================

CREATE OR REPLACE FUNCTION converter_interferencia_em_restricao(
  p_interferencia_id UUID,
  p_empresa_id UUID,
  p_codigo VARCHAR,
  p_descricao TEXT,
  p_categoria VARCHAR,
  p_atividade_id UUID DEFAULT NULL,
  p_atividade_nome VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_restricao_id UUID;
BEGIN
  INSERT INTO restricoes_ishikawa (
    empresa_id,
    codigo,
    descricao,
    categoria,
    status,
    atividade_id,
    atividade_nome,
    impacto_caminho_critico,
    duracao_atividade_impactada,
    dias_atraso,
    score_impacto,
    reincidente,
    data_criacao,
    data_prevista
  ) VALUES (
    p_empresa_id,
    p_codigo,
    p_descricao,
    p_categoria,
    'EM_EXECUCAO',
    p_atividade_id,
    p_atividade_nome,
    false,
    0,
    0,
    0,
    false,
    NOW(),
    NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO v_restricao_id;

  UPDATE interferencias_obra
  SET 
    convertida_restricao = true,
    restricao_id = v_restricao_id,
    status = 'CONVERTIDA_RESTRICAO',
    updated_at = NOW()
  WHERE id = p_interferencia_id;

  RETURN v_restricao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to get next restriction code
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_restricao_code(p_empresa_id UUID, p_prefix VARCHAR DEFAULT 'INT')
RETURNS VARCHAR AS $$
DECLARE
  v_max_num INTEGER;
  v_new_code VARCHAR;
BEGIN
  SELECT COALESCE(MAX(
    CASE 
      WHEN codigo ~ ('^' || p_prefix || '-[0-9]+$') 
      THEN CAST(SUBSTRING(codigo FROM LENGTH(p_prefix) + 2) AS INTEGER)
      ELSE 0 
    END
  ), 0) + 1
  INTO v_max_num
  FROM restricoes_ishikawa
  WHERE empresa_id = p_empresa_id;

  v_new_code := p_prefix || '-' || LPAD(v_max_num::TEXT, 4, '0');
  RETURN v_new_code;
END;
$$ LANGUAGE plpgsql;
