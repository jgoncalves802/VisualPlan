-- VisionPlan - Migration: Management Tables
-- Execute this SQL in your Supabase SQL Editor
-- These tables support the management modules: 5W2H Actions, Change Management, 
-- Meetings, Audits, Ishikawa Analysis, and Dashboard

-- ============================================================================
-- 1. AÇÕES 5W2H (5W2H Actions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS acoes_5w2h (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL,
    o_que TEXT NOT NULL,
    por_que TEXT NOT NULL,
    onde TEXT,
    quando TIMESTAMPTZ NOT NULL,
    quem VARCHAR(255) NOT NULL,
    quem_id UUID REFERENCES usuarios(id),
    como TEXT,
    quanto DECIMAL(15,2),
    quanto_descricao TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    prioridade VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    origem VARCHAR(50) NOT NULL,
    origem_id UUID,
    origem_descricao TEXT,
    atividade_gantt_id UUID REFERENCES atividades_cronograma(id),
    restricao_lps_id UUID,
    auditoria_id UUID,
    kanban_card_id UUID,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_conclusao TIMESTAMPTZ,
    observacoes TEXT,
    percentual_concluido INTEGER DEFAULT 0,
    tags TEXT[],
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    projeto_id UUID REFERENCES eps_nodes(id),
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT acoes_5w2h_status_check CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'ATRASADA', 'CANCELADA')),
    CONSTRAINT acoes_5w2h_prioridade_check CHECK (prioridade IN ('ALTA', 'MEDIA', 'BAIXA', 'CRITICA')),
    CONSTRAINT acoes_5w2h_origem_check CHECK (origem IN ('MANUAL', 'REUNIAO', 'AUDITORIA', 'RESTRICAO', 'MUDANCA', 'ISHIKAWA'))
);

CREATE INDEX idx_acoes_5w2h_empresa ON acoes_5w2h(empresa_id);
CREATE INDEX idx_acoes_5w2h_projeto ON acoes_5w2h(projeto_id);
CREATE INDEX idx_acoes_5w2h_status ON acoes_5w2h(status);
CREATE INDEX idx_acoes_5w2h_origem ON acoes_5w2h(origem, origem_id);
CREATE INDEX idx_acoes_5w2h_quando ON acoes_5w2h(quando);

-- ============================================================================
-- 2. SOLICITAÇÕES DE MUDANÇA (Change Requests)
-- ============================================================================
CREATE TABLE IF NOT EXISTS solicitacoes_mudanca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    justificativa TEXT,
    tipo_mudanca VARCHAR(50) NOT NULL,
    prioridade VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    solicitante VARCHAR(255) NOT NULL,
    solicitante_id UUID REFERENCES usuarios(id),
    data_solicitacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'RASCUNHO',
    projeto_id UUID NOT NULL REFERENCES eps_nodes(id),
    projeto_nome VARCHAR(255),
    impacto_cronograma INTEGER,
    impacto_custo DECIMAL(15,2),
    impacto_qualidade TEXT,
    impacto_risco TEXT,
    recursos_necessarios TEXT,
    riscos TEXT[],
    impacto_estimado VARCHAR(20) NOT NULL DEFAULT 'MEDIO',
    baseline_afetada VARCHAR(100),
    atividades_novas INTEGER DEFAULT 0,
    atividades_removidas INTEGER DEFAULT 0,
    aprovadores JSONB,
    aprovador VARCHAR(255),
    aprovador_id UUID REFERENCES usuarios(id),
    data_aprovacao TIMESTAMPTZ,
    observacoes_aprovacao TEXT,
    anexos TEXT[],
    historico JSONB DEFAULT '[]'::jsonb,
    acoes_5w2h UUID[],
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT solicitacoes_mudanca_tipo_check CHECK (tipo_mudanca IN ('ESCOPO', 'CRONOGRAMA', 'CUSTO', 'QUALIDADE', 'RECURSO', 'RISCO', 'OUTRO')),
    CONSTRAINT solicitacoes_mudanca_status_check CHECK (status IN ('RASCUNHO', 'SUBMETIDA', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'IMPLEMENTADA', 'CANCELADA')),
    CONSTRAINT solicitacoes_mudanca_impacto_check CHECK (impacto_estimado IN ('BAIXO', 'MEDIO', 'ALTO', 'CRITICO'))
);

CREATE INDEX idx_solicitacoes_mudanca_empresa ON solicitacoes_mudanca(empresa_id);
CREATE INDEX idx_solicitacoes_mudanca_projeto ON solicitacoes_mudanca(projeto_id);
CREATE INDEX idx_solicitacoes_mudanca_status ON solicitacoes_mudanca(status);
CREATE INDEX idx_solicitacoes_mudanca_data ON solicitacoes_mudanca(data_solicitacao);

-- ============================================================================
-- 3. REUNIÕES (Meetings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reunioes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    frequencia VARCHAR(50) NOT NULL DEFAULT 'SEMANAL',
    participantes TEXT[] NOT NULL DEFAULT '{}',
    pauta_fixa TEXT[],
    proxima_data TIMESTAMPTZ,
    hora_inicio VARCHAR(10),
    duracao INTEGER,
    local VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT true,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    projeto_id UUID REFERENCES eps_nodes(id),
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT reunioes_tipo_check CHECK (tipo IN ('DIARIA', 'SEMANAL_PLANEJAMENTO', 'MENSAL_GESTAO', 'CONTROLE_RESTRICOES', 'KAIZEN', 'AUDITORIA', 'OUTRO')),
    CONSTRAINT reunioes_frequencia_check CHECK (frequencia IN ('DIARIA', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'SOB_DEMANDA'))
);

CREATE INDEX idx_reunioes_empresa ON reunioes(empresa_id);
CREATE INDEX idx_reunioes_projeto ON reunioes(projeto_id);
CREATE INDEX idx_reunioes_proxima_data ON reunioes(proxima_data);
CREATE INDEX idx_reunioes_ativo ON reunioes(ativo);

-- ============================================================================
-- 4. PAUTAS DE REUNIÃO (Meeting Agendas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pautas_reuniao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reuniao_id UUID NOT NULL REFERENCES reunioes(id) ON DELETE CASCADE,
    data TIMESTAMPTZ NOT NULL,
    itens JSONB NOT NULL DEFAULT '[]'::jsonb,
    participantes_presentes TEXT[],
    observacoes TEXT,
    acoes_geradas UUID[],
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pautas_reuniao_reuniao ON pautas_reuniao(reuniao_id);
CREATE INDEX idx_pautas_reuniao_data ON pautas_reuniao(data);
CREATE INDEX idx_pautas_reuniao_empresa ON pautas_reuniao(empresa_id);

-- ============================================================================
-- 5. CHECKLIST TEMPLATES (Audit Checklist Templates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    itens JSONB NOT NULL DEFAULT '[]'::jsonb,
    versao VARCHAR(20) NOT NULL DEFAULT '1.0',
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT checklist_templates_categoria_check CHECK (categoria IN ('SEGURANCA', 'QUALIDADE', 'AMBIENTAL', 'ESTRUTURAL', 'INSTALACOES', 'ACABAMENTOS', 'FUNDACOES', 'OUTROS'))
);

CREATE INDEX idx_checklist_templates_empresa ON checklist_templates(empresa_id);
CREATE INDEX idx_checklist_templates_categoria ON checklist_templates(categoria);
CREATE INDEX idx_checklist_templates_nome ON checklist_templates(nome);

-- ============================================================================
-- 6. AUDITORIAS (Audits)
-- ============================================================================
CREATE TABLE IF NOT EXISTS auditorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    checklist_id UUID NOT NULL REFERENCES checklist_templates(id),
    checklist_nome VARCHAR(255),
    projeto_id UUID NOT NULL REFERENCES eps_nodes(id),
    projeto_nome VARCHAR(255),
    tipo VARCHAR(50) NOT NULL DEFAULT 'INTERNA',
    responsavel VARCHAR(255) NOT NULL,
    responsavel_id UUID REFERENCES usuarios(id),
    data_auditoria TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AGENDADA',
    itens JSONB NOT NULL DEFAULT '[]'::jsonb,
    percentual_conformidade DECIMAL(5,2),
    nao_conformidades INTEGER DEFAULT 0,
    acoes_geradas UUID[],
    observacoes_gerais TEXT,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atividade_gantt_id UUID REFERENCES atividades_cronograma(id),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT auditorias_tipo_check CHECK (tipo IN ('INTERNA', 'EXTERNA', 'CERTIFICACAO', 'FISCALIZACAO')),
    CONSTRAINT auditorias_status_check CHECK (status IN ('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'))
);

CREATE INDEX idx_auditorias_empresa ON auditorias(empresa_id);
CREATE INDEX idx_auditorias_projeto ON auditorias(projeto_id);
CREATE INDEX idx_auditorias_status ON auditorias(status);
CREATE INDEX idx_auditorias_data ON auditorias(data_auditoria);
CREATE INDEX idx_auditorias_checklist ON auditorias(checklist_id);

-- ============================================================================
-- 7. RESTRIÇÕES ISHIKAWA (Ishikawa Restrictions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS restricoes_ishikawa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    codigo VARCHAR(20) NOT NULL,
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IDENTIFICADA',
    atividade_id UUID REFERENCES atividades_cronograma(id),
    atividade_nome VARCHAR(255),
    wbs_id UUID,
    wbs_nome VARCHAR(255),
    eps_id UUID REFERENCES eps_nodes(id),
    eps_nome VARCHAR(255),
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_prevista TIMESTAMPTZ NOT NULL,
    data_conclusao TIMESTAMPTZ,
    responsavel VARCHAR(255) NOT NULL,
    impacto_caminho_critico BOOLEAN DEFAULT false,
    duracao_atividade_impactada INTEGER DEFAULT 0,
    dias_atraso INTEGER DEFAULT 0,
    score_impacto DECIMAL(5,2) DEFAULT 0,
    reincidente BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT restricoes_ishikawa_categoria_check CHECK (categoria IN ('METODO', 'MAO_DE_OBRA', 'MATERIAL', 'MAQUINA', 'MEDIDA', 'MEIO_AMBIENTE')),
    CONSTRAINT restricoes_ishikawa_status_check CHECK (status IN ('IDENTIFICADA', 'EM_TRATAMENTO', 'CONCLUIDA_NO_PRAZO', 'ATRASADA', 'VENCIDA', 'CANCELADA'))
);

CREATE INDEX idx_restricoes_ishikawa_empresa ON restricoes_ishikawa(empresa_id);
CREATE INDEX idx_restricoes_ishikawa_categoria ON restricoes_ishikawa(categoria);
CREATE INDEX idx_restricoes_ishikawa_status ON restricoes_ishikawa(status);
CREATE INDEX idx_restricoes_ishikawa_atividade ON restricoes_ishikawa(atividade_id);
CREATE INDEX idx_restricoes_ishikawa_wbs ON restricoes_ishikawa(wbs_id);
CREATE INDEX idx_restricoes_ishikawa_eps ON restricoes_ishikawa(eps_id);
CREATE INDEX idx_restricoes_ishikawa_data_prevista ON restricoes_ishikawa(data_prevista);

-- ============================================================================
-- 8. CURVA S (S-Curve for Dashboard)
-- ============================================================================
CREATE TABLE IF NOT EXISTS curva_s (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    projeto_id UUID REFERENCES eps_nodes(id),
    data DATE NOT NULL,
    mes VARCHAR(10) NOT NULL,
    planejado DECIMAL(10,2) NOT NULL DEFAULT 0,
    realizado DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(empresa_id, projeto_id, data)
);

CREATE INDEX idx_curva_s_empresa ON curva_s(empresa_id);
CREATE INDEX idx_curva_s_projeto ON curva_s(projeto_id);
CREATE INDEX idx_curva_s_data ON curva_s(data);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE acoes_5w2h ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_mudanca ENABLE ROW LEVEL SECURITY;
ALTER TABLE reunioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pautas_reuniao ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE restricoes_ishikawa ENABLE ROW LEVEL SECURITY;
ALTER TABLE curva_s ENABLE ROW LEVEL SECURITY;

-- Policies for acoes_5w2h
CREATE POLICY "acoes_5w2h_select_policy" ON acoes_5w2h
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "acoes_5w2h_insert_policy" ON acoes_5w2h
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "acoes_5w2h_update_policy" ON acoes_5w2h
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "acoes_5w2h_delete_policy" ON acoes_5w2h
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for solicitacoes_mudanca
CREATE POLICY "solicitacoes_mudanca_select_policy" ON solicitacoes_mudanca
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "solicitacoes_mudanca_insert_policy" ON solicitacoes_mudanca
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "solicitacoes_mudanca_update_policy" ON solicitacoes_mudanca
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "solicitacoes_mudanca_delete_policy" ON solicitacoes_mudanca
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for reunioes
CREATE POLICY "reunioes_select_policy" ON reunioes
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "reunioes_insert_policy" ON reunioes
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "reunioes_update_policy" ON reunioes
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "reunioes_delete_policy" ON reunioes
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for pautas_reuniao
CREATE POLICY "pautas_reuniao_select_policy" ON pautas_reuniao
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "pautas_reuniao_insert_policy" ON pautas_reuniao
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "pautas_reuniao_update_policy" ON pautas_reuniao
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "pautas_reuniao_delete_policy" ON pautas_reuniao
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for checklist_templates
CREATE POLICY "checklist_templates_select_policy" ON checklist_templates
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "checklist_templates_insert_policy" ON checklist_templates
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "checklist_templates_update_policy" ON checklist_templates
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "checklist_templates_delete_policy" ON checklist_templates
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for auditorias
CREATE POLICY "auditorias_select_policy" ON auditorias
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "auditorias_insert_policy" ON auditorias
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "auditorias_update_policy" ON auditorias
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "auditorias_delete_policy" ON auditorias
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for restricoes_ishikawa
CREATE POLICY "restricoes_ishikawa_select_policy" ON restricoes_ishikawa
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "restricoes_ishikawa_insert_policy" ON restricoes_ishikawa
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "restricoes_ishikawa_update_policy" ON restricoes_ishikawa
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "restricoes_ishikawa_delete_policy" ON restricoes_ishikawa
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for curva_s
CREATE POLICY "curva_s_select_policy" ON curva_s
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "curva_s_insert_policy" ON curva_s
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "curva_s_update_policy" ON curva_s
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "curva_s_delete_policy" ON curva_s
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_acoes_5w2h_updated_at
    BEFORE UPDATE ON acoes_5w2h
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitacoes_mudanca_updated_at
    BEFORE UPDATE ON solicitacoes_mudanca
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reunioes_updated_at
    BEFORE UPDATE ON reunioes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pautas_reuniao_updated_at
    BEFORE UPDATE ON pautas_reuniao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_templates_updated_at
    BEFORE UPDATE ON checklist_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auditorias_updated_at
    BEFORE UPDATE ON auditorias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restricoes_ishikawa_updated_at
    BEFORE UPDATE ON restricoes_ishikawa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curva_s_updated_at
    BEFORE UPDATE ON curva_s
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
