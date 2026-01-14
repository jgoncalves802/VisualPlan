-- =====================================================
-- MIGRATION: TABELAS DE INDICADORES E CURVA S
-- VisionPlan - 2025-01-14
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. TABELA: user_preferences (migração de localStorage para DB)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tema_preferido VARCHAR(50) DEFAULT 'light',
  cor_primaria VARCHAR(7),
  cor_secundaria VARCHAR(7),
  itens_por_pagina INTEGER DEFAULT 25,
  visualizacao_gantt VARCHAR(20) DEFAULT 'semana',
  mostrar_linha_hoje BOOLEAN DEFAULT true,
  mostrar_dependencias BOOLEAN DEFAULT true,
  mostrar_caminho_critico BOOLEAN DEFAULT true,
  notificar_email BOOLEAN DEFAULT true,
  notificar_app BOOLEAN DEFAULT true,
  resumo_diario BOOLEAN DEFAULT false,
  idioma VARCHAR(10) DEFAULT 'pt-BR',
  formato_data VARCHAR(20) DEFAULT 'dd/MM/yyyy',
  formato_hora VARCHAR(20) DEFAULT 'HH:mm',
  preferencias_extras JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. TABELA: snapshots_evm (Earned Value Management)
CREATE TABLE IF NOT EXISTS snapshots_evm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES eps_nodes(id) ON DELETE CASCADE,
  data_status DATE NOT NULL,
  periodo_referencia VARCHAR(20),
  -- Valores Planejados (Planned Value)
  pv_acumulado DECIMAL(18,2) DEFAULT 0,
  pv_periodo DECIMAL(18,2) DEFAULT 0,
  -- Valor Agregado (Earned Value)
  ev_acumulado DECIMAL(18,2) DEFAULT 0,
  ev_periodo DECIMAL(18,2) DEFAULT 0,
  -- Custo Real (Actual Cost)
  ac_acumulado DECIMAL(18,2) DEFAULT 0,
  ac_periodo DECIMAL(18,2) DEFAULT 0,
  -- Orçamento no Término (Budget at Completion)
  bac DECIMAL(18,2) DEFAULT 0,
  -- Variações
  cv DECIMAL(18,2) DEFAULT 0, -- Cost Variance (EV - AC)
  sv DECIMAL(18,2) DEFAULT 0, -- Schedule Variance (EV - PV)
  -- Índices de Performance
  cpi DECIMAL(5,4) DEFAULT 1, -- Cost Performance Index (EV/AC)
  spi DECIMAL(5,4) DEFAULT 1, -- Schedule Performance Index (EV/PV)
  tcpi DECIMAL(5,4), -- To Complete Performance Index
  -- Estimativas
  eac DECIMAL(18,2), -- Estimate at Completion
  etc DECIMAL(18,2), -- Estimate to Complete
  vac DECIMAL(18,2), -- Variance at Completion (BAC - EAC)
  -- Percentuais
  percentual_fisico DECIMAL(5,2) DEFAULT 0,
  percentual_financeiro DECIMAL(5,2) DEFAULT 0,
  observacoes TEXT,
  gerado_automaticamente BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(projeto_id, data_status)
);

-- 3. TABELA: indicadores_lps (Last Planner System)
CREATE TABLE IF NOT EXISTS indicadores_lps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES eps_nodes(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  semana_numero INTEGER,
  ano INTEGER,
  -- PPC - Percentual de Planos Concluídos
  atividades_planejadas INTEGER DEFAULT 0,
  atividades_concluidas INTEGER DEFAULT 0,
  ppc DECIMAL(5,2) DEFAULT 0,
  -- TMR - Taxa de Remoção de Restrições
  restricoes_identificadas INTEGER DEFAULT 0,
  restricoes_removidas INTEGER DEFAULT 0,
  tmr DECIMAL(5,2) DEFAULT 0,
  -- Causas de Não Cumprimento (6M Ishikawa)
  causas_mao_obra INTEGER DEFAULT 0,
  causas_material INTEGER DEFAULT 0,
  causas_maquina INTEGER DEFAULT 0,
  causas_metodo INTEGER DEFAULT 0,
  causas_meio_ambiente INTEGER DEFAULT 0,
  causas_medicao INTEGER DEFAULT 0,
  causas_outras INTEGER DEFAULT 0,
  -- Compromissos
  compromissos_assumidos INTEGER DEFAULT 0,
  compromissos_cumpridos INTEGER DEFAULT 0,
  taxa_compromisso DECIMAL(5,2) DEFAULT 0,
  -- Lookahead
  atividades_lookahead INTEGER DEFAULT 0,
  restricoes_lookahead INTEGER DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(projeto_id, data_inicio, data_fim)
);

-- 4. TABELA: indicadores_qualidade
CREATE TABLE IF NOT EXISTS indicadores_qualidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES eps_nodes(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  periodo VARCHAR(20) DEFAULT 'mensal',
  -- Auditorias
  total_auditorias INTEGER DEFAULT 0,
  auditorias_conformes INTEGER DEFAULT 0,
  auditorias_nao_conformes INTEGER DEFAULT 0,
  taxa_conformidade DECIMAL(5,2) DEFAULT 0,
  -- Não Conformidades
  ncs_abertas INTEGER DEFAULT 0,
  ncs_fechadas INTEGER DEFAULT 0,
  ncs_em_tratamento INTEGER DEFAULT 0,
  tempo_medio_resolucao DECIMAL(5,2) DEFAULT 0,
  -- Inspeções
  total_inspecoes INTEGER DEFAULT 0,
  inspecoes_aprovadas INTEGER DEFAULT 0,
  inspecoes_reprovadas INTEGER DEFAULT 0,
  taxa_aprovacao DECIMAL(5,2) DEFAULT 0,
  -- Retrabalho
  horas_retrabalho DECIMAL(10,2) DEFAULT 0,
  custo_retrabalho DECIMAL(18,2) DEFAULT 0,
  taxa_retrabalho DECIMAL(5,2) DEFAULT 0,
  -- Segurança
  incidentes_seguranca INTEGER DEFAULT 0,
  dias_sem_acidentes INTEGER DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(projeto_id, data_referencia, periodo)
);

-- 5. TABELA: baselines (Linhas de Base do Projeto)
CREATE TABLE IF NOT EXISTS baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES eps_nodes(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativa BOOLEAN DEFAULT false,
  data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_aprovacao DATE,
  aprovado_por UUID REFERENCES auth.users(id),
  -- Snapshot do Projeto
  duracao_total_dias INTEGER,
  data_inicio_prevista DATE,
  data_fim_prevista DATE,
  custo_total_previsto DECIMAL(18,2),
  hh_total_previsto DECIMAL(12,2),
  motivo_revisao TEXT,
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(projeto_id, numero)
);

-- 6. TABELA: curva_s (Suporte a Múltiplas Baselines)
-- tipo_curva: 'planejado', 'previsto', 'realizado', 'baseline_1', 'baseline_2', etc.
CREATE TABLE IF NOT EXISTS curva_s (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES eps_nodes(id) ON DELETE CASCADE,
  baseline_id UUID REFERENCES baselines(id) ON DELETE SET NULL,
  data_referencia DATE NOT NULL,
  periodo_ordem INTEGER NOT NULL,
  periodo_label VARCHAR(50),
  -- Tipo da Curva: planejado, previsto, realizado, baseline_1, baseline_2, etc.
  tipo_curva VARCHAR(30) NOT NULL,
  -- Valores do Período
  percentual_periodo DECIMAL(5,2) DEFAULT 0,
  percentual_acumulado DECIMAL(5,2) DEFAULT 0,
  valor_periodo DECIMAL(18,2) DEFAULT 0,
  valor_acumulado DECIMAL(18,2) DEFAULT 0,
  hh_periodo DECIMAL(12,2) DEFAULT 0,
  hh_acumulado DECIMAL(12,2) DEFAULT 0,
  atividades_periodo INTEGER DEFAULT 0,
  atividades_acumulado INTEGER DEFAULT 0,
  -- Fonte e Metadados
  fonte_dados VARCHAR(50) DEFAULT 'cronograma',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índices únicos para curva_s (garantir unicidade considerando baseline_id NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_curva_s_unique_with_baseline 
  ON curva_s(projeto_id, data_referencia, tipo_curva, baseline_id) 
  WHERE baseline_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_curva_s_unique_without_baseline 
  ON curva_s(projeto_id, data_referencia, tipo_curva) 
  WHERE baseline_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_empresa ON user_preferences(empresa_id);

CREATE INDEX IF NOT EXISTS idx_snapshots_evm_projeto ON snapshots_evm(projeto_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_evm_empresa ON snapshots_evm(empresa_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_evm_data ON snapshots_evm(data_status);
CREATE INDEX IF NOT EXISTS idx_snapshots_evm_projeto_data ON snapshots_evm(projeto_id, data_status);

CREATE INDEX IF NOT EXISTS idx_indicadores_lps_projeto ON indicadores_lps(projeto_id);
CREATE INDEX IF NOT EXISTS idx_indicadores_lps_empresa ON indicadores_lps(empresa_id);
CREATE INDEX IF NOT EXISTS idx_indicadores_lps_semana ON indicadores_lps(ano, semana_numero);

CREATE INDEX IF NOT EXISTS idx_indicadores_qualidade_projeto ON indicadores_qualidade(projeto_id);
CREATE INDEX IF NOT EXISTS idx_indicadores_qualidade_empresa ON indicadores_qualidade(empresa_id);

CREATE INDEX IF NOT EXISTS idx_baselines_projeto ON baselines(projeto_id);
CREATE INDEX IF NOT EXISTS idx_baselines_empresa ON baselines(empresa_id);
CREATE INDEX IF NOT EXISTS idx_baselines_ativa ON baselines(projeto_id, ativa) WHERE ativa = true;

CREATE INDEX IF NOT EXISTS idx_curva_s_projeto ON curva_s(projeto_id);
CREATE INDEX IF NOT EXISTS idx_curva_s_empresa ON curva_s(empresa_id);
CREATE INDEX IF NOT EXISTS idx_curva_s_baseline ON curva_s(baseline_id);
CREATE INDEX IF NOT EXISTS idx_curva_s_tipo ON curva_s(tipo_curva);
CREATE INDEX IF NOT EXISTS idx_curva_s_projeto_tipo ON curva_s(projeto_id, tipo_curva);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots_evm ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicadores_lps ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicadores_qualidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE curva_s ENABLE ROW LEVEL SECURITY;

-- user_preferences policies
DROP POLICY IF EXISTS "user_prefs_select" ON user_preferences;
DROP POLICY IF EXISTS "user_prefs_all" ON user_preferences;
CREATE POLICY "user_prefs_select" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_prefs_all" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- snapshots_evm policies
DROP POLICY IF EXISTS "evm_select" ON snapshots_evm;
DROP POLICY IF EXISTS "evm_all" ON snapshots_evm;
CREATE POLICY "evm_select" ON snapshots_evm FOR SELECT USING (
  empresa_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "evm_all" ON snapshots_evm FOR ALL USING (
  empresa_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid())
);

-- indicadores_lps policies
DROP POLICY IF EXISTS "lps_select" ON indicadores_lps;
DROP POLICY IF EXISTS "lps_all" ON indicadores_lps;
CREATE POLICY "lps_select" ON indicadores_lps FOR SELECT USING (
  empresa_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "lps_all" ON indicadores_lps FOR ALL USING (
  empresa_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid())
);

-- indicadores_qualidade policies
DROP POLICY IF EXISTS "qualidade_select" ON indicadores_qualidade;
DROP POLICY IF EXISTS "qualidade_all" ON indicadores_qualidade;
CREATE POLICY "qualidade_select" ON indicadores_qualidade FOR SELECT USING (
  empresa_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "qualidade_all" ON indicadores_qualidade FOR ALL USING (
  empresa_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid())
);

-- baselines policies
DROP POLICY IF EXISTS "baselines_select" ON baselines;
DROP POLICY IF EXISTS "baselines_all" ON baselines;
CREATE POLICY "baselines_select" ON baselines FOR SELECT USING (
  empresa_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "baselines_all" ON baselines FOR ALL USING (
  empresa_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid())
);

-- curva_s policies
DROP POLICY IF EXISTS "curva_s_select" ON curva_s;
DROP POLICY IF EXISTS "curva_s_all" ON curva_s;
CREATE POLICY "curva_s_select" ON curva_s FOR SELECT USING (
  empresa_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "curva_s_all" ON curva_s FOR ALL USING (
  empresa_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid())
);

-- =====================================================
-- TRIGGERS para updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_snapshots_evm_updated_at ON snapshots_evm;
CREATE TRIGGER update_snapshots_evm_updated_at
  BEFORE UPDATE ON snapshots_evm
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_indicadores_lps_updated_at ON indicadores_lps;
CREATE TRIGGER update_indicadores_lps_updated_at
  BEFORE UPDATE ON indicadores_lps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_indicadores_qualidade_updated_at ON indicadores_qualidade;
CREATE TRIGGER update_indicadores_qualidade_updated_at
  BEFORE UPDATE ON indicadores_qualidade
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_baselines_updated_at ON baselines;
CREATE TRIGGER update_baselines_updated_at
  BEFORE UPDATE ON baselines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_curva_s_updated_at ON curva_s;
CREATE TRIGGER update_curva_s_updated_at
  BEFORE UPDATE ON curva_s
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Garantir apenas uma baseline ativa por projeto
-- =====================================================
CREATE OR REPLACE FUNCTION enforce_single_active_baseline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ativa = true THEN
    UPDATE baselines SET ativa = false 
    WHERE projeto_id = NEW.projeto_id AND id != NEW.id AND ativa = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_active_baseline ON baselines;
CREATE TRIGGER ensure_single_active_baseline
  BEFORE INSERT OR UPDATE OF ativa ON baselines
  FOR EACH ROW WHEN (NEW.ativa = true)
  EXECUTE FUNCTION enforce_single_active_baseline();

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================
COMMENT ON TABLE user_preferences IS 'Preferências de usuário - migrado de localStorage para persistência no banco';
COMMENT ON TABLE snapshots_evm IS 'Snapshots periódicos de Earned Value Management (Gerenciamento de Valor Agregado)';
COMMENT ON TABLE indicadores_lps IS 'Indicadores semanais do Last Planner System (PPC, TMR, causas)';
COMMENT ON TABLE indicadores_qualidade IS 'Indicadores de qualidade, conformidade e segurança';
COMMENT ON TABLE baselines IS 'Linhas de base do projeto (versões históricas do planejamento)';
COMMENT ON TABLE curva_s IS 'Dados da Curva S com suporte a múltiplas baselines para análise de variância';

COMMENT ON COLUMN curva_s.tipo_curva IS 'Tipos válidos: planejado (original), previsto (replanejado), realizado (executado), baseline_1, baseline_2, baseline_N (históricos)';
COMMENT ON COLUMN curva_s.baseline_id IS 'Referência à baseline específica - NULL para curvas planejado/previsto/realizado atuais';
COMMENT ON COLUMN curva_s.periodo_ordem IS 'Ordem sequencial do período para garantir ordenação correta (1, 2, 3...)';
COMMENT ON COLUMN curva_s.fonte_dados IS 'Origem dos dados: cronograma, takeoff, manual';

COMMENT ON COLUMN baselines.ativa IS 'Apenas uma baseline pode estar ativa por projeto (trigger garante)';
COMMENT ON COLUMN baselines.numero IS 'Número sequencial da baseline (1, 2, 3...) - único por projeto';

COMMENT ON COLUMN snapshots_evm.cpi IS 'Cost Performance Index: EV/AC - valores > 1 indicam economia';
COMMENT ON COLUMN snapshots_evm.spi IS 'Schedule Performance Index: EV/PV - valores > 1 indicam adiantamento';
COMMENT ON COLUMN snapshots_evm.tcpi IS 'To Complete Performance Index: desempenho necessário para atingir o BAC';

COMMENT ON COLUMN indicadores_lps.ppc IS 'Percentual de Planos Concluídos: atividades_concluidas / atividades_planejadas * 100';
COMMENT ON COLUMN indicadores_lps.tmr IS 'Taxa de Remoção de Restrições: restricoes_removidas / restricoes_identificadas * 100';
