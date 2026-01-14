-- ============================================================================
-- Check-in/Check-out Module - Last Planner System (LPS)
-- VisionPlan Construction Project Management Platform
-- ============================================================================
-- Implements Weekly Work Plan and Daily Check-in/Check-out tracking
-- for PPC (Percent Plan Complete) calculation following Lean Construction methodology

-- 1. Programação Semanal (Weekly Work Plan)
CREATE TABLE IF NOT EXISTS programacao_semanal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL,
  semana INTEGER NOT NULL CHECK (semana >= 1 AND semana <= 53),
  ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PLANEJADA' CHECK (status IN ('PLANEJADA', 'EM_EXECUCAO', 'CONCLUIDA', 'CANCELADA')),
  ppc_semanal NUMERIC(5,2) DEFAULT 0,
  total_atividades INTEGER DEFAULT 0,
  atividades_concluidas INTEGER DEFAULT 0,
  atividades_com_restricao INTEGER DEFAULT 0,
  observacoes TEXT,
  responsavel_id UUID,
  responsavel_nome VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, projeto_id, semana, ano)
);

-- 2. Atividades da Programação Semanal
CREATE TABLE IF NOT EXISTS programacao_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacao_id UUID NOT NULL REFERENCES programacao_semanal(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  atividade_cronograma_id UUID,
  codigo VARCHAR(50),
  nome VARCHAR(500) NOT NULL,
  area VARCHAR(255),
  responsavel_id UUID,
  responsavel_nome VARCHAR(255),
  unidade VARCHAR(50) DEFAULT 'un',
  tem_restricao BOOLEAN NOT NULL DEFAULT FALSE,
  restricao_id UUID,
  restricao_descricao TEXT,
  prev_seg NUMERIC(10,2) DEFAULT 0,
  prev_ter NUMERIC(10,2) DEFAULT 0,
  prev_qua NUMERIC(10,2) DEFAULT 0,
  prev_qui NUMERIC(10,2) DEFAULT 0,
  prev_sex NUMERIC(10,2) DEFAULT 0,
  prev_sab NUMERIC(10,2) DEFAULT 0,
  prev_dom NUMERIC(10,2) DEFAULT 0,
  real_seg NUMERIC(10,2) DEFAULT 0,
  real_ter NUMERIC(10,2) DEFAULT 0,
  real_qua NUMERIC(10,2) DEFAULT 0,
  real_qui NUMERIC(10,2) DEFAULT 0,
  real_sex NUMERIC(10,2) DEFAULT 0,
  real_sab NUMERIC(10,2) DEFAULT 0,
  real_dom NUMERIC(10,2) DEFAULT 0,
  total_previsto NUMERIC(10,2) GENERATED ALWAYS AS (
    COALESCE(prev_seg, 0) + COALESCE(prev_ter, 0) + COALESCE(prev_qua, 0) + 
    COALESCE(prev_qui, 0) + COALESCE(prev_sex, 0) + COALESCE(prev_sab, 0) + COALESCE(prev_dom, 0)
  ) STORED,
  total_realizado NUMERIC(10,2) GENERATED ALWAYS AS (
    COALESCE(real_seg, 0) + COALESCE(real_ter, 0) + COALESCE(real_qua, 0) + 
    COALESCE(real_qui, 0) + COALESCE(real_sex, 0) + COALESCE(real_sab, 0) + COALESCE(real_dom, 0)
  ) STORED,
  ppc_atividade NUMERIC(5,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'NAO_CONCLUIDA', 'CANCELADA')),
  observacao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Registros Diários de Check-in/Check-out
CREATE TABLE IF NOT EXISTS checkin_checkout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacao_atividade_id UUID NOT NULL REFERENCES programacao_atividades(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  dia_semana VARCHAR(3) NOT NULL CHECK (dia_semana IN ('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom')),
  previsto NUMERIC(10,2) NOT NULL DEFAULT 0,
  realizado NUMERIC(10,2) NOT NULL DEFAULT 0,
  concluido BOOLEAN NOT NULL DEFAULT FALSE,
  causa_nao_cumprimento VARCHAR(20) CHECK (causa_nao_cumprimento IN ('MATERIAL', 'MAO_DE_OBRA', 'MAQUINA', 'METODO', 'MEIO_AMBIENTE', 'MEDIDA', 'SEGURANCA', NULL)),
  causa_descricao TEXT,
  observacao TEXT,
  registrado_por UUID,
  registrado_por_nome VARCHAR(255),
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(programacao_atividade_id, data)
);

-- 4. Métricas de PPC por Dia
CREATE TABLE IF NOT EXISTS ppc_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacao_id UUID NOT NULL REFERENCES programacao_semanal(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  dia_semana VARCHAR(3) NOT NULL,
  total_atividades INTEGER NOT NULL DEFAULT 0,
  atividades_concluidas INTEGER NOT NULL DEFAULT 0,
  atividades_nao_concluidas INTEGER NOT NULL DEFAULT 0,
  atividades_com_restricao INTEGER NOT NULL DEFAULT 0,
  ppc NUMERIC(5,2) NOT NULL DEFAULT 0,
  causas_6m JSONB DEFAULT '{}',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(programacao_id, data)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_programacao_semanal_empresa ON programacao_semanal(empresa_id);
CREATE INDEX IF NOT EXISTS idx_programacao_semanal_projeto ON programacao_semanal(projeto_id);
CREATE INDEX IF NOT EXISTS idx_programacao_semanal_semana ON programacao_semanal(semana, ano);
CREATE INDEX IF NOT EXISTS idx_programacao_semanal_status ON programacao_semanal(status);

CREATE INDEX IF NOT EXISTS idx_programacao_atividades_programacao ON programacao_atividades(programacao_id);
CREATE INDEX IF NOT EXISTS idx_programacao_atividades_empresa ON programacao_atividades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_programacao_atividades_restricao ON programacao_atividades(tem_restricao);
CREATE INDEX IF NOT EXISTS idx_programacao_atividades_atividade ON programacao_atividades(atividade_cronograma_id);

CREATE INDEX IF NOT EXISTS idx_checkin_checkout_atividade ON checkin_checkout(programacao_atividade_id);
CREATE INDEX IF NOT EXISTS idx_checkin_checkout_data ON checkin_checkout(data);
CREATE INDEX IF NOT EXISTS idx_checkin_checkout_empresa ON checkin_checkout(empresa_id);
CREATE INDEX IF NOT EXISTS idx_checkin_checkout_causa ON checkin_checkout(causa_nao_cumprimento);

CREATE INDEX IF NOT EXISTS idx_ppc_diario_programacao ON ppc_diario(programacao_id);
CREATE INDEX IF NOT EXISTS idx_ppc_diario_data ON ppc_diario(data);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE programacao_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE programacao_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_checkout ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_diario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "programacao_semanal_empresa_isolation" ON programacao_semanal;
CREATE POLICY "programacao_semanal_empresa_isolation" ON programacao_semanal
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "programacao_atividades_empresa_isolation" ON programacao_atividades;
CREATE POLICY "programacao_atividades_empresa_isolation" ON programacao_atividades
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "checkin_checkout_empresa_isolation" ON checkin_checkout;
CREATE POLICY "checkin_checkout_empresa_isolation" ON checkin_checkout
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ppc_diario_empresa_isolation" ON ppc_diario;
CREATE POLICY "ppc_diario_empresa_isolation" ON ppc_diario
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- Triggers for Updated At
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_programacao_semanal_updated_at ON programacao_semanal;
CREATE TRIGGER update_programacao_semanal_updated_at
    BEFORE UPDATE ON programacao_semanal
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_programacao_atividades_updated_at ON programacao_atividades;
CREATE TRIGGER update_programacao_atividades_updated_at
    BEFORE UPDATE ON programacao_atividades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_checkin_checkout_updated_at ON checkin_checkout;
CREATE TRIGGER update_checkin_checkout_updated_at
    BEFORE UPDATE ON checkin_checkout
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ppc_diario_updated_at ON ppc_diario;
CREATE TRIGGER update_ppc_diario_updated_at
    BEFORE UPDATE ON ppc_diario
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function to Calculate PPC for a Programacao Semanal
-- ============================================================================

CREATE OR REPLACE FUNCTION calcular_ppc_semanal(p_programacao_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total INTEGER;
  v_concluidas INTEGER;
  v_ppc NUMERIC(5,2);
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'CONCLUIDA')
  INTO v_total, v_concluidas
  FROM programacao_atividades
  WHERE programacao_id = p_programacao_id;

  IF v_total > 0 THEN
    v_ppc := (v_concluidas::NUMERIC / v_total::NUMERIC) * 100;
  ELSE
    v_ppc := 0;
  END IF;

  UPDATE programacao_semanal
  SET ppc_semanal = v_ppc,
      total_atividades = v_total,
      atividades_concluidas = v_concluidas,
      atividades_com_restricao = (
        SELECT COUNT(*) FROM programacao_atividades 
        WHERE programacao_id = p_programacao_id AND tem_restricao = TRUE
      )
  WHERE id = p_programacao_id;

  RETURN v_ppc;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function to Calculate PPC for a specific day
-- ============================================================================

CREATE OR REPLACE FUNCTION calcular_ppc_diario(p_programacao_id UUID, p_data DATE)
RETURNS NUMERIC AS $$
DECLARE
  v_total INTEGER;
  v_concluidas INTEGER;
  v_ppc NUMERIC(5,2);
  v_dia_semana VARCHAR(3);
  v_causas JSONB;
BEGIN
  v_dia_semana := CASE EXTRACT(DOW FROM p_data)
    WHEN 0 THEN 'dom'
    WHEN 1 THEN 'seg'
    WHEN 2 THEN 'ter'
    WHEN 3 THEN 'qua'
    WHEN 4 THEN 'qui'
    WHEN 5 THEN 'sex'
    WHEN 6 THEN 'sab'
  END;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE concluido = TRUE)
  INTO v_total, v_concluidas
  FROM checkin_checkout
  WHERE programacao_atividade_id IN (
    SELECT id FROM programacao_atividades WHERE programacao_id = p_programacao_id
  )
  AND data = p_data;

  IF v_total > 0 THEN
    v_ppc := (v_concluidas::NUMERIC / v_total::NUMERIC) * 100;
  ELSE
    v_ppc := 0;
  END IF;

  SELECT jsonb_object_agg(COALESCE(causa_nao_cumprimento, 'SEM_CAUSA'), cnt)
  INTO v_causas
  FROM (
    SELECT causa_nao_cumprimento, COUNT(*) as cnt
    FROM checkin_checkout
    WHERE programacao_atividade_id IN (
      SELECT id FROM programacao_atividades WHERE programacao_id = p_programacao_id
    )
    AND data = p_data
    AND concluido = FALSE
    AND causa_nao_cumprimento IS NOT NULL
    GROUP BY causa_nao_cumprimento
  ) sub;

  INSERT INTO ppc_diario (programacao_id, empresa_id, data, dia_semana, total_atividades, atividades_concluidas, atividades_nao_concluidas, ppc, causas_6m)
  SELECT p_programacao_id, ps.empresa_id, p_data, v_dia_semana, v_total, v_concluidas, v_total - v_concluidas, v_ppc, COALESCE(v_causas, '{}'::jsonb)
  FROM programacao_semanal ps
  WHERE ps.id = p_programacao_id
  ON CONFLICT (programacao_id, data) DO UPDATE SET
    total_atividades = EXCLUDED.total_atividades,
    atividades_concluidas = EXCLUDED.atividades_concluidas,
    atividades_nao_concluidas = EXCLUDED.atividades_nao_concluidas,
    ppc = EXCLUDED.ppc,
    causas_6m = EXCLUDED.causas_6m,
    updated_at = NOW();

  RETURN v_ppc;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE programacao_semanal IS 'Weekly Work Plan - Programação semanal de atividades para Check-in/Check-out (Last Planner System)';
COMMENT ON TABLE programacao_atividades IS 'Atividades programadas para a semana com previstos e realizados por dia';
COMMENT ON TABLE checkin_checkout IS 'Registros diários de check-in/check-out com causas de não cumprimento (6M + S)';
COMMENT ON TABLE ppc_diario IS 'Métricas de PPC (Percent Plan Complete) calculadas por dia';

COMMENT ON COLUMN programacao_atividades.tem_restricao IS 'Flag que indica se a atividade foi programada mesmo tendo restrição - usado para métricas de aderência';
COMMENT ON COLUMN programacao_atividades.restricao_id IS 'FK opcional para a tabela de restrições Ishikawa';
COMMENT ON COLUMN checkin_checkout.causa_nao_cumprimento IS 'Categoria 6M + Segurança para análise de causas raiz (integração com Ishikawa)';
