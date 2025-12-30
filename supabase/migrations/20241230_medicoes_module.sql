-- ============================================================================
-- Medições Module - Database Schema
-- VisionPlan Construction Project Management Platform
-- ============================================================================

-- 1. Configuração de Períodos de Medição (por projeto/EPS)
CREATE TABLE IF NOT EXISTS medicoes_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  dia_inicio_periodo INTEGER NOT NULL DEFAULT 1 CHECK (dia_inicio_periodo >= 1 AND dia_inicio_periodo <= 31),
  dia_fim_periodo INTEGER NOT NULL DEFAULT 25 CHECK (dia_fim_periodo >= 1 AND dia_fim_periodo <= 31),
  prazo_contratual_inicio DATE,
  prazo_contratual_fim DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(projeto_id)
);

-- 2. Períodos de Medição (gerados automaticamente baseado no prazo contratual)
CREATE TABLE IF NOT EXISTS medicoes_periodos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_medicao', 'aguardando_aprovacao', 'aprovado', 'fechado')),
  valor_previsto NUMERIC(18,2) NOT NULL DEFAULT 0,
  valor_medido NUMERIC(18,2) NOT NULL DEFAULT 0,
  valor_aprovado NUMERIC(18,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(projeto_id, numero)
);

-- 3. Avanços Físicos (registros de progresso)
CREATE TABLE IF NOT EXISTS medicoes_avancos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_id UUID NOT NULL REFERENCES medicoes_periodos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  -- Origem do avanço: cronograma ou mapa de controle
  origem VARCHAR(20) NOT NULL CHECK (origem IN ('cronograma', 'mapa_controle')),
  -- Referências opcionais dependendo da origem
  atividade_id UUID,
  item_id UUID REFERENCES takeoff_itens(id) ON DELETE SET NULL,
  -- Dados do avanço
  descricao TEXT NOT NULL,
  qtd_anterior NUMERIC(15,4) NOT NULL DEFAULT 0,
  qtd_avancada NUMERIC(15,4) NOT NULL DEFAULT 0,
  qtd_acumulada NUMERIC(15,4) NOT NULL DEFAULT 0,
  percentual_anterior NUMERIC(5,2) NOT NULL DEFAULT 0,
  percentual_avancado NUMERIC(5,2) NOT NULL DEFAULT 0,
  percentual_acumulado NUMERIC(5,2) NOT NULL DEFAULT 0,
  -- Quem registrou
  registrado_por UUID,
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Status de aprovação
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'supervisor_aprovado', 'fiscal_aprovado', 'aprovado', 'rejeitado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Aprovações de Avanços (histórico detalhado)
CREATE TABLE IF NOT EXISTS medicoes_aprovacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avanco_id UUID NOT NULL REFERENCES medicoes_avancos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('supervisor', 'fiscal', 'proponente')),
  aprovador_id UUID,
  aprovador_nome VARCHAR(255),
  acao VARCHAR(20) NOT NULL CHECK (acao IN ('aprovado', 'rejeitado', 'devolvido')),
  comentario TEXT,
  data_acao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Restrições vinculadas ao período (integração com LPS/Ishikawa)
CREATE TABLE IF NOT EXISTS medicoes_restricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_id UUID NOT NULL REFERENCES medicoes_periodos(id) ON DELETE CASCADE,
  restricao_id UUID NOT NULL,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  categoria VARCHAR(50),
  descricao TEXT,
  status VARCHAR(20),
  impacto_medicao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Alteração na tabela eps_nodes para prazo contratual
-- ============================================================================

ALTER TABLE eps_nodes 
ADD COLUMN IF NOT EXISTS prazo_contratual_inicio DATE,
ADD COLUMN IF NOT EXISTS prazo_contratual_fim DATE;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_medicoes_config_projeto ON medicoes_config(projeto_id);
CREATE INDEX IF NOT EXISTS idx_medicoes_config_empresa ON medicoes_config(empresa_id);
CREATE INDEX IF NOT EXISTS idx_medicoes_periodos_projeto ON medicoes_periodos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_medicoes_periodos_empresa ON medicoes_periodos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_medicoes_periodos_status ON medicoes_periodos(status);
CREATE INDEX IF NOT EXISTS idx_medicoes_avancos_periodo ON medicoes_avancos(periodo_id);
CREATE INDEX IF NOT EXISTS idx_medicoes_avancos_empresa ON medicoes_avancos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_medicoes_avancos_origem ON medicoes_avancos(origem);
CREATE INDEX IF NOT EXISTS idx_medicoes_avancos_status ON medicoes_avancos(status);
CREATE INDEX IF NOT EXISTS idx_medicoes_aprovacoes_avanco ON medicoes_aprovacoes(avanco_id);
CREATE INDEX IF NOT EXISTS idx_medicoes_restricoes_periodo ON medicoes_restricoes(periodo_id);

-- ============================================================================
-- Updated_at Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_medicoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_medicoes_config_updated_at ON medicoes_config;
CREATE TRIGGER trigger_medicoes_config_updated_at
  BEFORE UPDATE ON medicoes_config
  FOR EACH ROW EXECUTE FUNCTION update_medicoes_updated_at();

DROP TRIGGER IF EXISTS trigger_medicoes_periodos_updated_at ON medicoes_periodos;
CREATE TRIGGER trigger_medicoes_periodos_updated_at
  BEFORE UPDATE ON medicoes_periodos
  FOR EACH ROW EXECUTE FUNCTION update_medicoes_updated_at();

DROP TRIGGER IF EXISTS trigger_medicoes_avancos_updated_at ON medicoes_avancos;
CREATE TRIGGER trigger_medicoes_avancos_updated_at
  BEFORE UPDATE ON medicoes_avancos
  FOR EACH ROW EXECUTE FUNCTION update_medicoes_updated_at();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE medicoes_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicoes_periodos ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicoes_avancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicoes_aprovacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicoes_restricoes ENABLE ROW LEVEL SECURITY;

-- Políticas para medicoes_config
CREATE POLICY "Config visível por empresa"
  ON medicoes_config FOR SELECT
  USING (true);

CREATE POLICY "Config editável por empresa"
  ON medicoes_config FOR ALL
  USING (true);

-- Políticas para medicoes_periodos
CREATE POLICY "Períodos visíveis por empresa"
  ON medicoes_periodos FOR SELECT
  USING (true);

CREATE POLICY "Períodos editáveis por empresa"
  ON medicoes_periodos FOR ALL
  USING (true);

-- Políticas para medicoes_avancos
CREATE POLICY "Avanços visíveis por empresa"
  ON medicoes_avancos FOR SELECT
  USING (true);

CREATE POLICY "Avanços editáveis por empresa"
  ON medicoes_avancos FOR ALL
  USING (true);

-- Políticas para medicoes_aprovacoes
CREATE POLICY "Aprovações visíveis por empresa"
  ON medicoes_aprovacoes FOR SELECT
  USING (true);

CREATE POLICY "Aprovações editáveis por empresa"
  ON medicoes_aprovacoes FOR ALL
  USING (true);

-- Políticas para medicoes_restricoes
CREATE POLICY "Restrições visíveis por empresa"
  ON medicoes_restricoes FOR SELECT
  USING (true);

CREATE POLICY "Restrições editáveis por empresa"
  ON medicoes_restricoes FOR ALL
  USING (true);
