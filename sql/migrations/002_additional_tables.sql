-- VisionPlan - Migration 002: Additional Tables
-- Execute this SQL in your Supabase SQL Editor
-- These tables support Portfolio, Calendars, LPS Indicators, and EVM Snapshots

-- ============================================================================
-- 1. CRITÉRIOS DE PRIORIZAÇÃO (Prioritization Criteria)
-- ============================================================================
CREATE TABLE IF NOT EXISTS criterios_priorizacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    peso INTEGER NOT NULL DEFAULT 10,
    inverso BOOLEAN NOT NULL DEFAULT false,
    ativo BOOLEAN NOT NULL DEFAULT true,
    ordem INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT criterios_priorizacao_peso_check CHECK (peso >= 0 AND peso <= 100)
);

CREATE INDEX idx_criterios_priorizacao_empresa ON criterios_priorizacao(empresa_id);
CREATE INDEX idx_criterios_priorizacao_ativo ON criterios_priorizacao(ativo);

-- ============================================================================
-- 2. PROJETOS PORTFOLIO (Portfolio Projects with Scoring)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projetos_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    eps_node_id UUID REFERENCES eps_nodes(id),
    codigo VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    gerente VARCHAR(255),
    gerente_id UUID REFERENCES usuarios(id),
    orcamento DECIMAL(15,2),
    data_inicio DATE,
    data_fim DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'NO_PRAZO',
    scores JSONB DEFAULT '[]'::jsonb,
    valor_estrategico DECIMAL(5,2),
    roi_esperado DECIMAL(8,2),
    score_total DECIMAL(10,4) DEFAULT 0,
    ranking INTEGER,
    categoria VARCHAR(100),
    fase VARCHAR(50),
    prioridade_manual INTEGER,
    notas TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT projetos_portfolio_status_check CHECK (status IN ('NO_PRAZO', 'EM_RISCO', 'ATRASADO', 'CRITICO', 'CONCLUIDO', 'CANCELADO', 'SUSPENSO'))
);

CREATE INDEX idx_projetos_portfolio_empresa ON projetos_portfolio(empresa_id);
CREATE INDEX idx_projetos_portfolio_status ON projetos_portfolio(status);
CREATE INDEX idx_projetos_portfolio_ranking ON projetos_portfolio(ranking);
CREATE INDEX idx_projetos_portfolio_eps ON projetos_portfolio(eps_node_id);

-- ============================================================================
-- 3. SCORES DE PROJETOS (Project Scores by Criteria)
-- ============================================================================
CREATE TABLE IF NOT EXISTS scores_projetos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID NOT NULL REFERENCES projetos_portfolio(id) ON DELETE CASCADE,
    criterio_id UUID NOT NULL REFERENCES criterios_priorizacao(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 5,
    justificativa TEXT,
    avaliador_id UUID REFERENCES usuarios(id),
    data_avaliacao TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT scores_projetos_score_check CHECK (score >= 1 AND score <= 10),
    UNIQUE(projeto_id, criterio_id)
);

CREATE INDEX idx_scores_projetos_projeto ON scores_projetos(projeto_id);
CREATE INDEX idx_scores_projetos_criterio ON scores_projetos(criterio_id);

-- ============================================================================
-- 4. CALENDÁRIOS DE PROJETO (Project Work Calendars)
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendarios_projeto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    projeto_id UUID REFERENCES eps_nodes(id),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    dias_trabalho INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
    horario_inicio TIME NOT NULL DEFAULT '08:00',
    horario_fim TIME NOT NULL DEFAULT '17:00',
    horario_almoco_inicio TIME DEFAULT '12:00',
    horario_almoco_fim TIME DEFAULT '13:00',
    horas_por_dia DECIMAL(4,2) NOT NULL DEFAULT 8,
    padrao BOOLEAN NOT NULL DEFAULT false,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendarios_projeto_empresa ON calendarios_projeto(empresa_id);
CREATE INDEX idx_calendarios_projeto_projeto ON calendarios_projeto(projeto_id);
CREATE INDEX idx_calendarios_projeto_padrao ON calendarios_projeto(padrao);

-- ============================================================================
-- 5. EXCEÇÕES DE CALENDÁRIO (Calendar Exceptions - Holidays, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS excecoes_calendario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendario_id UUID NOT NULL REFERENCES calendarios_projeto(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'FERIADO',
    descricao VARCHAR(255),
    horas_trabalho DECIMAL(4,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT excecoes_calendario_tipo_check CHECK (tipo IN ('FERIADO', 'FOLGA', 'TRABALHO_EXTRA', 'MEIO_PERIODO')),
    UNIQUE(calendario_id, data)
);

CREATE INDEX idx_excecoes_calendario_calendario ON excecoes_calendario(calendario_id);
CREATE INDEX idx_excecoes_calendario_data ON excecoes_calendario(data);

-- ============================================================================
-- 6. INDICADORES LPS (Last Planner System Indicators)
-- ============================================================================
CREATE TABLE IF NOT EXISTS indicadores_lps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    projeto_id UUID REFERENCES eps_nodes(id),
    data_referencia DATE NOT NULL,
    semana INTEGER,
    ano INTEGER,
    ppc DECIMAL(5,2),
    tarefas_planejadas INTEGER DEFAULT 0,
    tarefas_concluidas INTEGER DEFAULT 0,
    restricoes_ativas INTEGER DEFAULT 0,
    restricoes_removidas INTEGER DEFAULT 0,
    tmr_dias DECIMAL(5,2),
    causas_nao_conclusao JSONB DEFAULT '[]'::jsonb,
    observacoes TEXT,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(empresa_id, projeto_id, data_referencia)
);

CREATE INDEX idx_indicadores_lps_empresa ON indicadores_lps(empresa_id);
CREATE INDEX idx_indicadores_lps_projeto ON indicadores_lps(projeto_id);
CREATE INDEX idx_indicadores_lps_data ON indicadores_lps(data_referencia);
CREATE INDEX idx_indicadores_lps_semana ON indicadores_lps(ano, semana);

-- ============================================================================
-- 7. SNAPSHOTS EVM (Earned Value Management Snapshots)
-- ============================================================================
CREATE TABLE IF NOT EXISTS snapshots_evm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    projeto_id UUID REFERENCES eps_nodes(id),
    data_referencia DATE NOT NULL,
    bac DECIMAL(15,2),
    pv DECIMAL(15,2),
    ev DECIMAL(15,2),
    ac DECIMAL(15,2),
    sv DECIMAL(15,2),
    cv DECIMAL(15,2),
    spi DECIMAL(8,4),
    cpi DECIMAL(8,4),
    eac DECIMAL(15,2),
    etc DECIMAL(15,2),
    vac DECIMAL(15,2),
    tcpi DECIMAL(8,4),
    percentual_fisico DECIMAL(5,2),
    percentual_financeiro DECIMAL(5,2),
    observacoes TEXT,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(empresa_id, projeto_id, data_referencia)
);

CREATE INDEX idx_snapshots_evm_empresa ON snapshots_evm(empresa_id);
CREATE INDEX idx_snapshots_evm_projeto ON snapshots_evm(projeto_id);
CREATE INDEX idx_snapshots_evm_data ON snapshots_evm(data_referencia);

-- ============================================================================
-- 8. INDICADORES QUALIDADE (Quality Indicators)
-- ============================================================================
CREATE TABLE IF NOT EXISTS indicadores_qualidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    projeto_id UUID REFERENCES eps_nodes(id),
    data_referencia DATE NOT NULL,
    iqo DECIMAL(5,2),
    auditorias_realizadas INTEGER DEFAULT 0,
    auditorias_planejadas INTEGER DEFAULT 0,
    nao_conformidades_abertas INTEGER DEFAULT 0,
    nao_conformidades_fechadas INTEGER DEFAULT 0,
    acoes_corretivas_abertas INTEGER DEFAULT 0,
    acoes_corretivas_concluidas INTEGER DEFAULT 0,
    indice_conformidade DECIMAL(5,2),
    observacoes TEXT,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(empresa_id, projeto_id, data_referencia)
);

CREATE INDEX idx_indicadores_qualidade_empresa ON indicadores_qualidade(empresa_id);
CREATE INDEX idx_indicadores_qualidade_projeto ON indicadores_qualidade(projeto_id);
CREATE INDEX idx_indicadores_qualidade_data ON indicadores_qualidade(data_referencia);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE criterios_priorizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendarios_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE excecoes_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicadores_lps ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots_evm ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicadores_qualidade ENABLE ROW LEVEL SECURITY;

-- Policies for criterios_priorizacao
CREATE POLICY "criterios_priorizacao_select_policy" ON criterios_priorizacao
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "criterios_priorizacao_insert_policy" ON criterios_priorizacao
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "criterios_priorizacao_update_policy" ON criterios_priorizacao
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "criterios_priorizacao_delete_policy" ON criterios_priorizacao
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for projetos_portfolio
CREATE POLICY "projetos_portfolio_select_policy" ON projetos_portfolio
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "projetos_portfolio_insert_policy" ON projetos_portfolio
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "projetos_portfolio_update_policy" ON projetos_portfolio
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "projetos_portfolio_delete_policy" ON projetos_portfolio
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for scores_projetos
CREATE POLICY "scores_projetos_select_policy" ON scores_projetos
    FOR SELECT USING (projeto_id IN (
        SELECT id FROM projetos_portfolio WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

CREATE POLICY "scores_projetos_insert_policy" ON scores_projetos
    FOR INSERT WITH CHECK (projeto_id IN (
        SELECT id FROM projetos_portfolio WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

CREATE POLICY "scores_projetos_update_policy" ON scores_projetos
    FOR UPDATE USING (projeto_id IN (
        SELECT id FROM projetos_portfolio WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

CREATE POLICY "scores_projetos_delete_policy" ON scores_projetos
    FOR DELETE USING (projeto_id IN (
        SELECT id FROM projetos_portfolio WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

-- Policies for calendarios_projeto
CREATE POLICY "calendarios_projeto_select_policy" ON calendarios_projeto
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "calendarios_projeto_insert_policy" ON calendarios_projeto
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "calendarios_projeto_update_policy" ON calendarios_projeto
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "calendarios_projeto_delete_policy" ON calendarios_projeto
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for excecoes_calendario
CREATE POLICY "excecoes_calendario_select_policy" ON excecoes_calendario
    FOR SELECT USING (calendario_id IN (
        SELECT id FROM calendarios_projeto WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

CREATE POLICY "excecoes_calendario_insert_policy" ON excecoes_calendario
    FOR INSERT WITH CHECK (calendario_id IN (
        SELECT id FROM calendarios_projeto WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

CREATE POLICY "excecoes_calendario_update_policy" ON excecoes_calendario
    FOR UPDATE USING (calendario_id IN (
        SELECT id FROM calendarios_projeto WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

CREATE POLICY "excecoes_calendario_delete_policy" ON excecoes_calendario
    FOR DELETE USING (calendario_id IN (
        SELECT id FROM calendarios_projeto WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

-- Policies for indicadores_lps
CREATE POLICY "indicadores_lps_select_policy" ON indicadores_lps
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "indicadores_lps_insert_policy" ON indicadores_lps
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "indicadores_lps_update_policy" ON indicadores_lps
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "indicadores_lps_delete_policy" ON indicadores_lps
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for snapshots_evm
CREATE POLICY "snapshots_evm_select_policy" ON snapshots_evm
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "snapshots_evm_insert_policy" ON snapshots_evm
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "snapshots_evm_update_policy" ON snapshots_evm
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "snapshots_evm_delete_policy" ON snapshots_evm
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for indicadores_qualidade
CREATE POLICY "indicadores_qualidade_select_policy" ON indicadores_qualidade
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "indicadores_qualidade_insert_policy" ON indicadores_qualidade
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "indicadores_qualidade_update_policy" ON indicadores_qualidade
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "indicadores_qualidade_delete_policy" ON indicadores_qualidade
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_criterios_priorizacao_updated_at
    BEFORE UPDATE ON criterios_priorizacao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projetos_portfolio_updated_at
    BEFORE UPDATE ON projetos_portfolio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_projetos_updated_at
    BEFORE UPDATE ON scores_projetos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendarios_projeto_updated_at
    BEFORE UPDATE ON calendarios_projeto
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indicadores_lps_updated_at
    BEFORE UPDATE ON indicadores_lps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indicadores_qualidade_updated_at
    BEFORE UPDATE ON indicadores_qualidade
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: DEFAULT PRIORITIZATION CRITERIA (Optional)
-- ============================================================================
-- These are inserted only if the criterios_priorizacao table is empty for the company
-- Run this separately or modify empresa_id as needed

-- INSERT INTO criterios_priorizacao (empresa_id, nome, descricao, peso, inverso, ordem) VALUES
-- ('YOUR_EMPRESA_ID', 'ROI', 'Retorno sobre Investimento', 20, false, 1),
-- ('YOUR_EMPRESA_ID', 'Alinhamento Estratégico', 'Alinhamento com objetivos estratégicos', 20, false, 2),
-- ('YOUR_EMPRESA_ID', 'Urgência', 'Urgência de execução', 15, false, 3),
-- ('YOUR_EMPRESA_ID', 'Complexidade', 'Complexidade do projeto (menor é melhor)', 15, true, 4),
-- ('YOUR_EMPRESA_ID', 'Disponibilidade de Recursos', 'Disponibilidade de recursos necessários', 15, false, 5),
-- ('YOUR_EMPRESA_ID', 'Risco', 'Nível de risco do projeto (menor é melhor)', 15, true, 6);

-- ============================================================================
-- SEED DATA: DEFAULT CALENDARS (Optional)
-- ============================================================================
-- INSERT INTO calendarios_projeto (empresa_id, nome, descricao, dias_trabalho, horario_inicio, horario_fim, horas_por_dia, padrao) VALUES
-- ('YOUR_EMPRESA_ID', 'Calendário Padrão 5x8', 'Segunda a Sexta, 8 horas por dia', '{1,2,3,4,5}', '08:00', '17:00', 8, true),
-- ('YOUR_EMPRESA_ID', 'Calendário 6x8', 'Segunda a Sábado, 8 horas por dia', '{1,2,3,4,5,6}', '07:00', '16:00', 8, false),
-- ('YOUR_EMPRESA_ID', 'Calendário 24/7', 'Operação contínua 24 horas, 7 dias por semana', '{0,1,2,3,4,5,6}', '00:00', '23:59', 24, false);
