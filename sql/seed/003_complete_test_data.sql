-- VisionPlan - Complete Test Data Seed
-- Execute this SQL in your Supabase SQL Editor
-- Creates missing tables and populates with comprehensive test data

-- ============================================================================
-- 1. CREATE MISSING TABLES
-- ============================================================================

-- EMPRESAS (Companies)
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    razao_social VARCHAR(255),
    endereco TEXT,
    telefone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EPS_NODES (Enterprise Project Structure)
CREATE TABLE IF NOT EXISTS eps_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES eps_nodes(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(50),
    descricao TEXT,
    responsible_manager_id UUID,
    nivel INTEGER DEFAULT 0,
    ordem INTEGER DEFAULT 0,
    cor VARCHAR(20) DEFAULT '#3B82F6',
    icone VARCHAR(50),
    peso_estimado DECIMAL(5,2) DEFAULT 1.0,
    ativo BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WBS_NODES (Work Breakdown Structure)
CREATE TABLE IF NOT EXISTS wbs_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eps_node_id UUID REFERENCES eps_nodes(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES wbs_nodes(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    nivel INTEGER DEFAULT 0,
    ordem INTEGER DEFAULT 0,
    peso DECIMAL(5,2) DEFAULT 1.0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RECURSOS (Resources)
CREATE TABLE IF NOT EXISTS recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'MAO_DE_OBRA',
    unidade VARCHAR(20) DEFAULT 'h',
    custo_por_hora DECIMAL(15,2) DEFAULT 0,
    custo_por_unidade DECIMAL(15,2) DEFAULT 0,
    disponibilidade_horas DECIMAL(10,2) DEFAULT 8,
    capacidade_maxima DECIMAL(10,2) DEFAULT 100,
    calendario_id UUID,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT recursos_tipo_check CHECK (tipo IN ('MAO_DE_OBRA', 'EQUIPAMENTO', 'MATERIAL', 'SUBCONTRATO'))
);

-- RESOURCE_ALLOCATIONS (Resource Allocations)
CREATE TABLE IF NOT EXISTS resource_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atividade_id UUID NOT NULL REFERENCES atividades_cronograma(id) ON DELETE CASCADE,
    recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE CASCADE,
    quantidade DECIMAL(10,2) NOT NULL DEFAULT 1,
    unidade VARCHAR(20) DEFAULT 'h',
    percentual_alocacao DECIMAL(5,2) DEFAULT 100,
    horas_planejadas DECIMAL(10,2),
    horas_reais DECIMAL(10,2) DEFAULT 0,
    custo_planejado DECIMAL(15,2),
    custo_real DECIMAL(15,2) DEFAULT 0,
    data_inicio DATE,
    data_fim DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESTRICOES_LPS (LPS Restrictions for Kanban)
CREATE TABLE IF NOT EXISTS restricoes_lps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    projeto_id UUID REFERENCES eps_nodes(id),
    codigo VARCHAR(20) NOT NULL,
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IDENTIFICADA',
    prioridade VARCHAR(20) DEFAULT 'MEDIA',
    responsavel_id UUID,
    responsavel_nome VARCHAR(255),
    data_identificacao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_prevista DATE,
    data_resolucao DATE,
    atividade_id UUID REFERENCES atividades_cronograma(id),
    wbs_id UUID REFERENCES wbs_nodes(id),
    impacto_cronograma INTEGER DEFAULT 0,
    impacto_custo DECIMAL(15,2) DEFAULT 0,
    observacoes TEXT,
    causa_raiz TEXT,
    acao_corretiva TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT restricoes_lps_categoria_check CHECK (categoria IN ('MAO_DE_OBRA', 'MATERIAL', 'MAQUINA', 'METODO', 'MEIO_AMBIENTE', 'MEDICAO', 'PROJETO', 'SEGURANCA', 'EXTERNO')),
    CONSTRAINT restricoes_lps_status_check CHECK (status IN ('IDENTIFICADA', 'EM_ANALISE', 'EM_RESOLUCAO', 'RESOLVIDA', 'CANCELADA')),
    CONSTRAINT restricoes_lps_prioridade_check CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA'))
);

-- ACOES_5W2H (5W2H Actions)
CREATE TABLE IF NOT EXISTS acoes_5w2h (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL,
    o_que TEXT NOT NULL,
    por_que TEXT NOT NULL,
    onde TEXT,
    quando TIMESTAMPTZ NOT NULL,
    quem VARCHAR(255) NOT NULL,
    quem_id UUID,
    como TEXT,
    quanto DECIMAL(15,2),
    quanto_descricao TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    prioridade VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    origem VARCHAR(50) NOT NULL,
    origem_id UUID,
    origem_descricao TEXT,
    atividade_gantt_id UUID REFERENCES atividades_cronograma(id),
    restricao_lps_id UUID REFERENCES restricoes_lps(id),
    auditoria_id UUID,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_conclusao TIMESTAMPTZ,
    observacoes TEXT,
    percentual_concluido INTEGER DEFAULT 0,
    tags TEXT[],
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    projeto_id UUID REFERENCES eps_nodes(id),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT acoes_5w2h_status_check CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'ATRASADA', 'CANCELADA')),
    CONSTRAINT acoes_5w2h_prioridade_check CHECK (prioridade IN ('ALTA', 'MEDIA', 'BAIXA', 'CRITICA')),
    CONSTRAINT acoes_5w2h_origem_check CHECK (origem IN ('MANUAL', 'REUNIAO', 'AUDITORIA', 'RESTRICAO', 'MUDANCA', 'ISHIKAWA'))
);

-- AUDITORIAS (Audits)
CREATE TABLE IF NOT EXISTS auditorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    template_id UUID,
    projeto_id UUID REFERENCES eps_nodes(id),
    projeto_nome VARCHAR(255),
    local_auditoria VARCHAR(255),
    data_programada DATE NOT NULL,
    data_realizacao DATE,
    auditor_id UUID,
    auditor_nome VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'PROGRAMADA',
    itens JSONB DEFAULT '[]'::jsonb,
    total_itens INTEGER DEFAULT 0,
    itens_conformes INTEGER DEFAULT 0,
    itens_nao_conformes INTEGER DEFAULT 0,
    itens_nao_aplicaveis INTEGER DEFAULT 0,
    nota_geral DECIMAL(5,2),
    observacoes TEXT,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT auditorias_tipo_check CHECK (tipo IN ('SEGURANCA', 'QUALIDADE', 'AMBIENTAL', 'ESTRUTURAL', 'INSTALACOES', 'ACABAMENTOS', 'FUNDACOES', 'OUTROS')),
    CONSTRAINT auditorias_status_check CHECK (status IN ('PROGRAMADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'))
);

-- SOLICITACOES_MUDANCA (Change Requests)
CREATE TABLE IF NOT EXISTS solicitacoes_mudanca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    justificativa TEXT,
    tipo_mudanca VARCHAR(50) NOT NULL,
    prioridade VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    solicitante VARCHAR(255) NOT NULL,
    solicitante_id UUID,
    data_solicitacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'RASCUNHO',
    projeto_id UUID NOT NULL REFERENCES eps_nodes(id),
    projeto_nome VARCHAR(255),
    impacto_cronograma INTEGER,
    impacto_custo DECIMAL(15,2),
    impacto_qualidade TEXT,
    impacto_estimado VARCHAR(20) NOT NULL DEFAULT 'MEDIO',
    aprovadores JSONB DEFAULT '[]'::jsonb,
    aprovador VARCHAR(255),
    aprovador_id UUID,
    data_aprovacao TIMESTAMPTZ,
    historico JSONB DEFAULT '[]'::jsonb,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT solicitacoes_mudanca_tipo_check CHECK (tipo_mudanca IN ('ESCOPO', 'CRONOGRAMA', 'CUSTO', 'QUALIDADE', 'RECURSO', 'RISCO', 'OUTRO')),
    CONSTRAINT solicitacoes_mudanca_status_check CHECK (status IN ('RASCUNHO', 'SUBMETIDA', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'IMPLEMENTADA', 'CANCELADA')),
    CONSTRAINT solicitacoes_mudanca_impacto_check CHECK (impacto_estimado IN ('BAIXO', 'MEDIO', 'ALTO', 'CRITICO'))
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_eps_nodes_empresa ON eps_nodes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_eps_nodes_parent ON eps_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_wbs_nodes_eps ON wbs_nodes(eps_node_id);
CREATE INDEX IF NOT EXISTS idx_recursos_empresa ON recursos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_atividade ON resource_allocations(atividade_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_recurso ON resource_allocations(recurso_id);
CREATE INDEX IF NOT EXISTS idx_restricoes_lps_empresa ON restricoes_lps(empresa_id);
CREATE INDEX IF NOT EXISTS idx_restricoes_lps_status ON restricoes_lps(status);
CREATE INDEX IF NOT EXISTS idx_restricoes_lps_categoria ON restricoes_lps(categoria);
CREATE INDEX IF NOT EXISTS idx_acoes_5w2h_empresa ON acoes_5w2h(empresa_id);
CREATE INDEX IF NOT EXISTS idx_acoes_5w2h_status ON acoes_5w2h(status);
CREATE INDEX IF NOT EXISTS idx_auditorias_empresa ON auditorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_mudanca_empresa ON solicitacoes_mudanca(empresa_id);

-- ============================================================================
-- 3. SEED DATA - EMPRESA E PROJETO
-- ============================================================================

-- Create test company
INSERT INTO empresas (id, nome, cnpj, razao_social, email, ativo)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Construtora VisionPlan Demo',
    '12.345.678/0001-90',
    'VisionPlan Engenharia e Construção Ltda',
    'contato@visionplan-demo.com',
    true
) ON CONFLICT (cnpj) DO NOTHING;

-- Update admin user with company
UPDATE usuarios 
SET empresa_id = '11111111-1111-1111-1111-111111111111'
WHERE email = 'admin@visionplan.com';

-- Create additional test users
INSERT INTO usuarios (id, nome, email, empresa_id, cargo)
VALUES 
    ('22222222-2222-2222-2222-222222222222', 'João Silva', 'joao.silva@visionplan.com', '11111111-1111-1111-1111-111111111111', 'Gerente de Projeto'),
    ('33333333-3333-3333-3333-333333333333', 'Maria Santos', 'maria.santos@visionplan.com', '11111111-1111-1111-1111-111111111111', 'Engenheira Civil'),
    ('44444444-4444-4444-4444-444444444444', 'Carlos Lima', 'carlos.lima@visionplan.com', '11111111-1111-1111-1111-111111111111', 'Mestre de Obras'),
    ('55555555-5555-5555-5555-555555555555', 'Ana Costa', 'ana.costa@visionplan.com', '11111111-1111-1111-1111-111111111111', 'Coordenadora de Qualidade'),
    ('66666666-6666-6666-6666-666666666666', 'Pedro Souza', 'pedro.souza@visionplan.com', '11111111-1111-1111-1111-111111111111', 'Engenheiro de Planejamento')
ON CONFLICT (email) DO NOTHING;

-- Create EPS structure
INSERT INTO eps_nodes (id, empresa_id, codigo, nome, descricao, nivel, ordem, cor)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'EPS-001', 'Portfólio de Obras', 'Raiz do portfólio', 0, 1, '#3B82F6'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'PRJ-001', 'Edifício Residencial TESTE', 'Projeto de edificação residencial multifamiliar - 20 pavimentos', 1, 1, '#10B981')
ON CONFLICT DO NOTHING;

-- Update parent reference
UPDATE eps_nodes SET parent_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Create WBS structure
INSERT INTO wbs_nodes (id, eps_node_id, codigo, nome, nivel, ordem)
VALUES 
    ('wbs-0001-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '1', 'Fundações', 0, 1),
    ('wbs-0002-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2', 'Estrutura', 0, 2),
    ('wbs-0003-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '3', 'Instalações', 0, 3),
    ('wbs-0004-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '4', 'Acabamentos', 0, 4)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. SEED DATA - RECURSOS (RESOURCES)
-- ============================================================================

INSERT INTO recursos (id, empresa_id, codigo, nome, tipo, unidade, custo_por_hora, disponibilidade_horas)
VALUES 
    -- Mão de Obra
    ('rec-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'MO-001', 'Pedreiro', 'MAO_DE_OBRA', 'h', 35.00, 8),
    ('rec-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'MO-002', 'Servente', 'MAO_DE_OBRA', 'h', 20.00, 8),
    ('rec-0003-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'MO-003', 'Carpinteiro', 'MAO_DE_OBRA', 'h', 40.00, 8),
    ('rec-0004-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'MO-004', 'Armador', 'MAO_DE_OBRA', 'h', 38.00, 8),
    ('rec-0005-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'MO-005', 'Eletricista', 'MAO_DE_OBRA', 'h', 45.00, 8),
    ('rec-0006-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'MO-006', 'Encanador', 'MAO_DE_OBRA', 'h', 42.00, 8),
    ('rec-0007-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'MO-007', 'Pintor', 'MAO_DE_OBRA', 'h', 32.00, 8),
    -- Equipamentos
    ('rec-0008-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'EQ-001', 'Betoneira 400L', 'EQUIPAMENTO', 'h', 25.00, 10),
    ('rec-0009-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'EQ-002', 'Grua Torre', 'EQUIPAMENTO', 'h', 150.00, 10),
    ('rec-0010-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'EQ-003', 'Bomba de Concreto', 'EQUIPAMENTO', 'h', 200.00, 8),
    ('rec-0011-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'EQ-004', 'Andaime Fachadeiro', 'EQUIPAMENTO', 'dia', 500.00, 24),
    -- Materiais
    ('rec-0012-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'MT-001', 'Concreto FCK 30', 'MATERIAL', 'm³', 0, 0),
    ('rec-0013-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'MT-002', 'Aço CA-50', 'MATERIAL', 'kg', 0, 0),
    ('rec-0014-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'MT-003', 'Forma Compensado', 'MATERIAL', 'm²', 0, 0)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. SEED DATA - ATIVIDADES DO CRONOGRAMA
-- ============================================================================

-- Delete existing activities for clean seed
DELETE FROM dependencias_atividades;
DELETE FROM atividades_cronograma;

-- Insert hierarchical activities (40+ activities)
INSERT INTO atividades_cronograma (id, projeto_id, empresa_id, codigo, edt, nome, tipo, parent_id, wbs_id, data_inicio, data_fim, duracao_dias, progresso, status, responsavel_nome, e_critica, folga_total, custo_planejado, valor_planejado)
VALUES 
    -- WBS 1: FUNDAÇÕES (Summary)
    ('act-0001-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'FUND', '1', 'Fundações', 'Fase', NULL, 'wbs-0001-0000-0000-000000000001', '2025-01-06', '2025-02-28', 40, 75, 'Em Andamento', NULL, true, 0, 450000, 450000),
    
    -- Fundações - Atividades
    ('act-0002-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'FUND-001', '1.1', 'Locação da obra', 'Tarefa', 'act-0001-0000-0000-000000000001', 'wbs-0001-0000-0000-000000000001', '2025-01-06', '2025-01-08', 3, 100, 'Concluída', 'Carlos Lima', true, 0, 5000, 5000),
    ('act-0003-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'FUND-002', '1.2', 'Escavação de estacas', 'Tarefa', 'act-0001-0000-0000-000000000001', 'wbs-0001-0000-0000-000000000001', '2025-01-09', '2025-01-17', 7, 100, 'Concluída', 'Carlos Lima', true, 0, 85000, 85000),
    ('act-0004-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'FUND-003', '1.3', 'Armação das estacas', 'Tarefa', 'act-0001-0000-0000-000000000001', 'wbs-0001-0000-0000-000000000001', '2025-01-13', '2025-01-24', 10, 100, 'Concluída', 'Maria Santos', true, 0, 45000, 45000),
    ('act-0005-0000-0000-000000000005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'FUND-004', '1.4', 'Concretagem das estacas', 'Tarefa', 'act-0001-0000-0000-000000000001', 'wbs-0001-0000-0000-000000000001', '2025-01-20', '2025-01-31', 10, 100, 'Concluída', 'João Silva', true, 0, 120000, 120000),
    ('act-0006-0000-0000-000000000006', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'FUND-005', '1.5', 'Escavação de blocos e vigas', 'Tarefa', 'act-0001-0000-0000-000000000001', 'wbs-0001-0000-0000-000000000001', '2025-02-03', '2025-02-07', 5, 100, 'Concluída', 'Carlos Lima', false, 3, 25000, 25000),
    ('act-0007-0000-0000-000000000007', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'FUND-006', '1.6', 'Armação blocos e vigas baldrame', 'Tarefa', 'act-0001-0000-0000-000000000001', 'wbs-0001-0000-0000-000000000001', '2025-02-10', '2025-02-14', 5, 80, 'Em Andamento', 'Maria Santos', true, 0, 55000, 55000),
    ('act-0008-0000-0000-000000000008', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'FUND-007', '1.7', 'Formas blocos e vigas baldrame', 'Tarefa', 'act-0001-0000-0000-000000000001', 'wbs-0001-0000-0000-000000000001', '2025-02-10', '2025-02-18', 7, 60, 'Em Andamento', 'Carlos Lima', true, 0, 35000, 35000),
    ('act-0009-0000-0000-000000000009', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'FUND-008', '1.8', 'Concretagem blocos e baldrame', 'Tarefa', 'act-0001-0000-0000-000000000001', 'wbs-0001-0000-0000-000000000001', '2025-02-19', '2025-02-21', 3, 0, 'Não Iniciada', 'João Silva', true, 0, 80000, 80000),
    
    -- WBS 2: ESTRUTURA (Summary)
    ('act-0010-0000-0000-000000000010', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR', '2', 'Estrutura', 'Fase', NULL, 'wbs-0002-0000-0000-000000000002', '2025-02-24', '2025-08-29', 135, 15, 'Em Andamento', NULL, true, 0, 2500000, 2500000),
    
    -- Estrutura - Térreo
    ('act-0011-0000-0000-000000000011', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-001', '2.1', 'Estrutura Térreo', 'Fase', 'act-0010-0000-0000-000000000010', 'wbs-0002-0000-0000-000000000002', '2025-02-24', '2025-03-14', 15, 50, 'Em Andamento', NULL, true, 0, 180000, 180000),
    ('act-0012-0000-0000-000000000012', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-001A', '2.1.1', 'Pilares Térreo', 'Tarefa', 'act-0011-0000-0000-000000000011', 'wbs-0002-0000-0000-000000000002', '2025-02-24', '2025-03-03', 6, 70, 'Em Andamento', 'Maria Santos', true, 0, 60000, 60000),
    ('act-0013-0000-0000-000000000013', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-001B', '2.1.2', 'Vigas Térreo', 'Tarefa', 'act-0011-0000-0000-000000000011', 'wbs-0002-0000-0000-000000000002', '2025-03-04', '2025-03-10', 5, 30, 'Em Andamento', 'Maria Santos', true, 0, 55000, 55000),
    ('act-0014-0000-0000-000000000014', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-001C', '2.1.3', 'Laje Térreo', 'Tarefa', 'act-0011-0000-0000-000000000011', 'wbs-0002-0000-0000-000000000002', '2025-03-11', '2025-03-14', 4, 0, 'Não Iniciada', 'João Silva', true, 0, 65000, 65000),
    
    -- Estrutura - Pavimentos Tipo (1 ao 10)
    ('act-0015-0000-0000-000000000015', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-002', '2.2', 'Estrutura Pav. Tipo 1-5', 'Fase', 'act-0010-0000-0000-000000000010', 'wbs-0002-0000-0000-000000000002', '2025-03-17', '2025-05-09', 40, 0, 'Não Iniciada', NULL, true, 0, 650000, 650000),
    ('act-0016-0000-0000-000000000016', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-002A', '2.2.1', 'Ciclo Pav. 1', 'Tarefa', 'act-0015-0000-0000-000000000015', 'wbs-0002-0000-0000-000000000002', '2025-03-17', '2025-03-24', 6, 0, 'Não Iniciada', 'Maria Santos', true, 0, 130000, 130000),
    ('act-0017-0000-0000-000000000017', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-002B', '2.2.2', 'Ciclo Pav. 2', 'Tarefa', 'act-0015-0000-0000-000000000015', 'wbs-0002-0000-0000-000000000002', '2025-03-25', '2025-04-01', 6, 0, 'Não Iniciada', 'Maria Santos', true, 0, 130000, 130000),
    ('act-0018-0000-0000-000000000018', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-002C', '2.2.3', 'Ciclo Pav. 3', 'Tarefa', 'act-0015-0000-0000-000000000015', 'wbs-0002-0000-0000-000000000002', '2025-04-02', '2025-04-09', 6, 0, 'Não Iniciada', 'Maria Santos', true, 0, 130000, 130000),
    ('act-0019-0000-0000-000000000019', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-002D', '2.2.4', 'Ciclo Pav. 4', 'Tarefa', 'act-0015-0000-0000-000000000015', 'wbs-0002-0000-0000-000000000002', '2025-04-10', '2025-04-17', 6, 0, 'Não Iniciada', 'Maria Santos', false, 5, 130000, 130000),
    ('act-0020-0000-0000-000000000020', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-002E', '2.2.5', 'Ciclo Pav. 5', 'Tarefa', 'act-0015-0000-0000-000000000015', 'wbs-0002-0000-0000-000000000002', '2025-04-18', '2025-04-25', 6, 0, 'Não Iniciada', 'Maria Santos', false, 5, 130000, 130000),
    
    -- Estrutura - Pavimentos Tipo (6 ao 10)
    ('act-0021-0000-0000-000000000021', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-003', '2.3', 'Estrutura Pav. Tipo 6-10', 'Fase', 'act-0010-0000-0000-000000000010', 'wbs-0002-0000-0000-000000000002', '2025-04-28', '2025-06-20', 40, 0, 'Não Iniciada', NULL, true, 0, 650000, 650000),
    ('act-0022-0000-0000-000000000022', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-003A', '2.3.1', 'Ciclo Pav. 6', 'Tarefa', 'act-0021-0000-0000-000000000021', 'wbs-0002-0000-0000-000000000002', '2025-04-28', '2025-05-05', 6, 0, 'Não Iniciada', 'Maria Santos', true, 0, 130000, 130000),
    ('act-0023-0000-0000-000000000023', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-003B', '2.3.2', 'Ciclo Pav. 7', 'Tarefa', 'act-0021-0000-0000-000000000021', 'wbs-0002-0000-0000-000000000002', '2025-05-06', '2025-05-13', 6, 0, 'Não Iniciada', 'Maria Santos', true, 0, 130000, 130000),
    ('act-0024-0000-0000-000000000024', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-003C', '2.3.3', 'Ciclo Pav. 8', 'Tarefa', 'act-0021-0000-0000-000000000021', 'wbs-0002-0000-0000-000000000002', '2025-05-14', '2025-05-21', 6, 0, 'Não Iniciada', 'Maria Santos', true, 0, 130000, 130000),
    ('act-0025-0000-0000-000000000025', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-003D', '2.3.4', 'Ciclo Pav. 9', 'Tarefa', 'act-0021-0000-0000-000000000021', 'wbs-0002-0000-0000-000000000002', '2025-05-22', '2025-05-29', 6, 0, 'Não Iniciada', 'Maria Santos', false, 5, 130000, 130000),
    ('act-0026-0000-0000-000000000026', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-003E', '2.3.5', 'Ciclo Pav. 10', 'Tarefa', 'act-0021-0000-0000-000000000021', 'wbs-0002-0000-0000-000000000002', '2025-05-30', '2025-06-06', 6, 0, 'Não Iniciada', 'Maria Santos', false, 5, 130000, 130000),
    
    -- Estrutura - Cobertura
    ('act-0027-0000-0000-000000000027', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-004', '2.4', 'Estrutura Cobertura', 'Fase', 'act-0010-0000-0000-000000000010', 'wbs-0002-0000-0000-000000000002', '2025-06-09', '2025-06-27', 15, 0, 'Não Iniciada', NULL, true, 0, 220000, 220000),
    ('act-0028-0000-0000-000000000028', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-004A', '2.4.1', 'Laje de Cobertura', 'Tarefa', 'act-0027-0000-0000-000000000027', 'wbs-0002-0000-0000-000000000002', '2025-06-09', '2025-06-18', 8, 0, 'Não Iniciada', 'João Silva', true, 0, 150000, 150000),
    ('act-0029-0000-0000-000000000029', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ESTR-004B', '2.4.2', 'Casa de Máquinas', 'Tarefa', 'act-0027-0000-0000-000000000027', 'wbs-0002-0000-0000-000000000002', '2025-06-19', '2025-06-27', 7, 0, 'Não Iniciada', 'Carlos Lima', false, 3, 70000, 70000),
    
    -- WBS 3: INSTALAÇÕES (Summary)
    ('act-0030-0000-0000-000000000030', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'INST', '3', 'Instalações', 'Fase', NULL, 'wbs-0003-0000-0000-000000000003', '2025-04-07', '2025-09-26', 125, 5, 'Em Andamento', NULL, false, 10, 850000, 850000),
    
    -- Instalações Elétricas
    ('act-0031-0000-0000-000000000031', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'INST-001', '3.1', 'Instalações Elétricas', 'Fase', 'act-0030-0000-0000-000000000030', 'wbs-0003-0000-0000-000000000003', '2025-04-07', '2025-08-29', 105, 8, 'Em Andamento', NULL, false, 10, 350000, 350000),
    ('act-0032-0000-0000-000000000032', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'INST-001A', '3.1.1', 'Infraestrutura elétrica subsolo', 'Tarefa', 'act-0031-0000-0000-000000000031', 'wbs-0003-0000-0000-000000000003', '2025-04-07', '2025-04-18', 10, 30, 'Em Andamento', 'Pedro Souza', false, 5, 45000, 45000),
    ('act-0033-0000-0000-000000000033', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'INST-001B', '3.1.2', 'Tubulação pavimentos tipo', 'Tarefa', 'act-0031-0000-0000-000000000031', 'wbs-0003-0000-0000-000000000003', '2025-04-21', '2025-06-27', 50, 0, 'Não Iniciada', 'Pedro Souza', false, 10, 180000, 180000),
    ('act-0034-0000-0000-000000000034', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'INST-001C', '3.1.3', 'Fiação e acabamentos', 'Tarefa', 'act-0031-0000-0000-000000000031', 'wbs-0003-0000-0000-000000000003', '2025-06-30', '2025-08-29', 45, 0, 'Não Iniciada', 'Pedro Souza', false, 15, 125000, 125000),
    
    -- Instalações Hidrossanitárias
    ('act-0035-0000-0000-000000000035', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'INST-002', '3.2', 'Instalações Hidrossanitárias', 'Fase', 'act-0030-0000-0000-000000000030', 'wbs-0003-0000-0000-000000000003', '2025-04-07', '2025-09-12', 115, 5, 'Em Andamento', NULL, false, 10, 400000, 400000),
    ('act-0036-0000-0000-000000000036', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'INST-002A', '3.2.1', 'Prumadas água fria e quente', 'Tarefa', 'act-0035-0000-0000-000000000035', 'wbs-0003-0000-0000-000000000003', '2025-04-07', '2025-05-23', 35, 20, 'Em Andamento', 'Ana Costa', false, 10, 120000, 120000),
    ('act-0037-0000-0000-000000000037', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'INST-002B', '3.2.2', 'Esgoto e águas pluviais', 'Tarefa', 'act-0035-0000-0000-000000000035', 'wbs-0003-0000-0000-000000000003', '2025-05-26', '2025-07-18', 40, 0, 'Não Iniciada', 'Ana Costa', false, 10, 150000, 150000),
    ('act-0038-0000-0000-000000000038', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'INST-002C', '3.2.3', 'Louças e metais', 'Tarefa', 'act-0035-0000-0000-000000000035', 'wbs-0003-0000-0000-000000000003', '2025-07-21', '2025-09-12', 40, 0, 'Não Iniciada', 'Ana Costa', false, 15, 130000, 130000),
    
    -- WBS 4: ACABAMENTOS (Summary)
    ('act-0039-0000-0000-000000000039', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ACAB', '4', 'Acabamentos', 'Fase', NULL, 'wbs-0004-0000-0000-000000000004', '2025-07-07', '2025-11-28', 105, 0, 'Não Iniciada', NULL, false, 20, 1200000, 1200000),
    
    -- Revestimentos
    ('act-0040-0000-0000-000000000040', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ACAB-001', '4.1', 'Revestimentos Internos', 'Fase', 'act-0039-0000-0000-000000000039', 'wbs-0004-0000-0000-000000000004', '2025-07-07', '2025-09-26', 60, 0, 'Não Iniciada', NULL, false, 20, 450000, 450000),
    ('act-0041-0000-0000-000000000041', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ACAB-001A', '4.1.1', 'Chapisco e emboço', 'Tarefa', 'act-0040-0000-0000-000000000040', 'wbs-0004-0000-0000-000000000004', '2025-07-07', '2025-08-15', 30, 0, 'Não Iniciada', 'Carlos Lima', false, 20, 200000, 200000),
    ('act-0042-0000-0000-000000000042', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ACAB-001B', '4.1.2', 'Cerâmicas e porcelanatos', 'Tarefa', 'act-0040-0000-0000-000000000040', 'wbs-0004-0000-0000-000000000004', '2025-08-18', '2025-09-26', 30, 0, 'Não Iniciada', 'Carlos Lima', false, 20, 250000, 250000),
    
    -- Pintura
    ('act-0043-0000-0000-000000000043', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ACAB-002', '4.2', 'Pintura', 'Fase', 'act-0039-0000-0000-000000000039', 'wbs-0004-0000-0000-000000000004', '2025-09-29', '2025-11-07', 30, 0, 'Não Iniciada', NULL, false, 25, 280000, 280000),
    ('act-0044-0000-0000-000000000044', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ACAB-002A', '4.2.1', 'Massa corrida e lixamento', 'Tarefa', 'act-0043-0000-0000-000000000043', 'wbs-0004-0000-0000-000000000004', '2025-09-29', '2025-10-17', 15, 0, 'Não Iniciada', 'Carlos Lima', false, 25, 120000, 120000),
    ('act-0045-0000-0000-000000000045', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ACAB-002B', '4.2.2', 'Pintura PVA e Acrílica', 'Tarefa', 'act-0043-0000-0000-000000000043', 'wbs-0004-0000-0000-000000000004', '2025-10-20', '2025-11-07', 15, 0, 'Não Iniciada', 'Carlos Lima', false, 25, 160000, 160000),
    
    -- Esquadrias
    ('act-0046-0000-0000-000000000046', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ACAB-003', '4.3', 'Esquadrias', 'Fase', 'act-0039-0000-0000-000000000039', 'wbs-0004-0000-0000-000000000004', '2025-10-13', '2025-11-21', 30, 0, 'Não Iniciada', NULL, false, 25, 350000, 350000),
    ('act-0047-0000-0000-000000000047', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ACAB-003A', '4.3.1', 'Instalação janelas alumínio', 'Tarefa', 'act-0046-0000-0000-000000000046', 'wbs-0004-0000-0000-000000000004', '2025-10-13', '2025-10-31', 15, 0, 'Não Iniciada', 'Pedro Souza', false, 25, 200000, 200000),
    ('act-0048-0000-0000-000000000048', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ACAB-003B', '4.3.2', 'Portas madeira e metálicas', 'Tarefa', 'act-0046-0000-0000-000000000046', 'wbs-0004-0000-0000-000000000004', '2025-11-03', '2025-11-21', 15, 0, 'Não Iniciada', 'Pedro Souza', false, 25, 150000, 150000),
    
    -- Marco final
    ('act-0049-0000-0000-000000000049', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ENTREGA', '5', 'Entrega da Obra', 'Marco', NULL, NULL, '2025-11-28', '2025-11-28', 0, 0, 'Não Iniciada', 'João Silva', true, 0, 0, 0);

-- ============================================================================
-- 6. SEED DATA - DEPENDÊNCIAS
-- ============================================================================

INSERT INTO dependencias_atividades (atividade_origem_id, atividade_destino_id, tipo, lag_dias)
VALUES 
    -- Fundações
    ('act-0002-0000-0000-000000000002', 'act-0003-0000-0000-000000000003', 'FS', 0),
    ('act-0003-0000-0000-000000000003', 'act-0004-0000-0000-000000000004', 'SS', 3),
    ('act-0004-0000-0000-000000000004', 'act-0005-0000-0000-000000000005', 'SS', 5),
    ('act-0005-0000-0000-000000000005', 'act-0006-0000-0000-000000000006', 'FS', 2),
    ('act-0006-0000-0000-000000000006', 'act-0007-0000-0000-000000000007', 'FS', 0),
    ('act-0006-0000-0000-000000000006', 'act-0008-0000-0000-000000000008', 'SS', 0),
    ('act-0007-0000-0000-000000000007', 'act-0009-0000-0000-000000000009', 'FF', 0),
    ('act-0008-0000-0000-000000000008', 'act-0009-0000-0000-000000000009', 'FS', 0),
    
    -- Fundações -> Estrutura
    ('act-0009-0000-0000-000000000009', 'act-0011-0000-0000-000000000011', 'FS', 2),
    
    -- Estrutura Térreo
    ('act-0012-0000-0000-000000000012', 'act-0013-0000-0000-000000000013', 'FS', 0),
    ('act-0013-0000-0000-000000000013', 'act-0014-0000-0000-000000000014', 'FS', 0),
    
    -- Estrutura -> Pav Tipo
    ('act-0014-0000-0000-000000000014', 'act-0016-0000-0000-000000000016', 'FS', 2),
    ('act-0016-0000-0000-000000000016', 'act-0017-0000-0000-000000000017', 'FS', 0),
    ('act-0017-0000-0000-000000000017', 'act-0018-0000-0000-000000000018', 'FS', 0),
    ('act-0018-0000-0000-000000000018', 'act-0019-0000-0000-000000000019', 'FS', 0),
    ('act-0019-0000-0000-000000000019', 'act-0020-0000-0000-000000000020', 'FS', 0),
    
    -- Pav 5 -> Pav 6-10
    ('act-0020-0000-0000-000000000020', 'act-0022-0000-0000-000000000022', 'FS', 2),
    ('act-0022-0000-0000-000000000022', 'act-0023-0000-0000-000000000023', 'FS', 0),
    ('act-0023-0000-0000-000000000023', 'act-0024-0000-0000-000000000024', 'FS', 0),
    ('act-0024-0000-0000-000000000024', 'act-0025-0000-0000-000000000025', 'FS', 0),
    ('act-0025-0000-0000-000000000025', 'act-0026-0000-0000-000000000026', 'FS', 0),
    
    -- Pav 10 -> Cobertura
    ('act-0026-0000-0000-000000000026', 'act-0028-0000-0000-000000000028', 'FS', 2),
    ('act-0028-0000-0000-000000000028', 'act-0029-0000-0000-000000000029', 'FS', 0),
    
    -- Estrutura -> Instalações (após laje térreo)
    ('act-0014-0000-0000-000000000014', 'act-0032-0000-0000-000000000032', 'FS', 5),
    ('act-0014-0000-0000-000000000014', 'act-0036-0000-0000-000000000036', 'FS', 5),
    
    -- Instalações sequências internas
    ('act-0032-0000-0000-000000000032', 'act-0033-0000-0000-000000000033', 'FS', 2),
    ('act-0033-0000-0000-000000000033', 'act-0034-0000-0000-000000000034', 'FS', 2),
    ('act-0036-0000-0000-000000000036', 'act-0037-0000-0000-000000000037', 'FS', 2),
    ('act-0037-0000-0000-000000000037', 'act-0038-0000-0000-000000000038', 'FS', 2),
    
    -- Estrutura Cobertura -> Acabamentos
    ('act-0029-0000-0000-000000000029', 'act-0041-0000-0000-000000000041', 'FS', 7),
    
    -- Acabamentos
    ('act-0041-0000-0000-000000000041', 'act-0042-0000-0000-000000000042', 'FS', 2),
    ('act-0042-0000-0000-000000000042', 'act-0044-0000-0000-000000000044', 'FS', 2),
    ('act-0044-0000-0000-000000000044', 'act-0045-0000-0000-000000000045', 'FS', 2),
    ('act-0042-0000-0000-000000000042', 'act-0047-0000-0000-000000000047', 'FS', 15),
    ('act-0047-0000-0000-000000000047', 'act-0048-0000-0000-000000000048', 'FS', 2),
    
    -- Entrega
    ('act-0045-0000-0000-000000000045', 'act-0049-0000-0000-000000000049', 'FS', 15),
    ('act-0048-0000-0000-000000000048', 'act-0049-0000-0000-000000000049', 'FS', 5),
    ('act-0038-0000-0000-000000000038', 'act-0049-0000-0000-000000000049', 'FS', 60);

-- ============================================================================
-- 7. SEED DATA - ALOCAÇÕES DE RECURSOS
-- ============================================================================

INSERT INTO resource_allocations (atividade_id, recurso_id, quantidade, percentual_alocacao, horas_planejadas, data_inicio, data_fim)
VALUES 
    -- Fundações
    ('act-0002-0000-0000-000000000002', 'rec-0001-0000-0000-000000000001', 2, 100, 48, '2025-01-06', '2025-01-08'),
    ('act-0003-0000-0000-000000000003', 'rec-0008-0000-0000-000000000008', 1, 100, 56, '2025-01-09', '2025-01-17'),
    ('act-0004-0000-0000-000000000004', 'rec-0004-0000-0000-000000000004', 4, 100, 320, '2025-01-13', '2025-01-24'),
    ('act-0005-0000-0000-000000000005', 'rec-0010-0000-0000-000000000010', 1, 100, 80, '2025-01-20', '2025-01-31'),
    ('act-0007-0000-0000-000000000007', 'rec-0004-0000-0000-000000000004', 3, 100, 120, '2025-02-10', '2025-02-14'),
    ('act-0008-0000-0000-000000000008', 'rec-0003-0000-0000-000000000003', 4, 100, 224, '2025-02-10', '2025-02-18'),
    
    -- Estrutura (com conflitos propositais)
    ('act-0012-0000-0000-000000000012', 'rec-0004-0000-0000-000000000004', 6, 100, 288, '2025-02-24', '2025-03-03'),
    ('act-0012-0000-0000-000000000012', 'rec-0003-0000-0000-000000000003', 4, 100, 192, '2025-02-24', '2025-03-03'),
    ('act-0013-0000-0000-000000000013', 'rec-0004-0000-0000-000000000004', 5, 100, 200, '2025-03-04', '2025-03-10'),
    ('act-0013-0000-0000-000000000013', 'rec-0009-0000-0000-000000000009', 1, 100, 50, '2025-03-04', '2025-03-10'),
    ('act-0014-0000-0000-000000000014', 'rec-0010-0000-0000-000000000010', 1, 100, 32, '2025-03-11', '2025-03-14'),
    
    -- Conflito intencional: Armador sobrealcoado em março
    ('act-0016-0000-0000-000000000016', 'rec-0004-0000-0000-000000000004', 8, 120, 576, '2025-03-17', '2025-03-24'),
    ('act-0017-0000-0000-000000000017', 'rec-0004-0000-0000-000000000004', 8, 100, 384, '2025-03-25', '2025-04-01'),
    
    -- Instalações
    ('act-0032-0000-0000-000000000032', 'rec-0005-0000-0000-000000000005', 3, 100, 240, '2025-04-07', '2025-04-18'),
    ('act-0036-0000-0000-000000000036', 'rec-0006-0000-0000-000000000006', 3, 100, 840, '2025-04-07', '2025-05-23'),
    
    -- Acabamentos
    ('act-0041-0000-0000-000000000041', 'rec-0001-0000-0000-000000000001', 6, 100, 1440, '2025-07-07', '2025-08-15'),
    ('act-0044-0000-0000-000000000044', 'rec-0007-0000-0000-000000000007', 4, 100, 480, '2025-09-29', '2025-10-17'),
    ('act-0045-0000-0000-000000000045', 'rec-0007-0000-0000-000000000007', 4, 100, 480, '2025-10-20', '2025-11-07');

-- ============================================================================
-- 8. SEED DATA - RESTRIÇÕES LPS (KANBAN/ISHIKAWA)
-- ============================================================================

INSERT INTO restricoes_lps (id, empresa_id, projeto_id, codigo, descricao, categoria, status, prioridade, responsavel_nome, data_identificacao, data_prevista, atividade_id, impacto_cronograma, causa_raiz, acao_corretiva)
VALUES 
    -- Restrições IDENTIFICADAS
    ('rest-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'REST-001', 'Atraso na entrega de aço CA-50 para armação de pilares', 'MATERIAL', 'IDENTIFICADA', 'CRITICA', 'Carlos Lima', '2025-02-15', '2025-03-01', 'act-0012-0000-0000-000000000012', 5, 'Fornecedor com problemas logísticos', 'Acionar fornecedor alternativo'),
    ('rest-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'REST-002', 'Falta de EPI específico para trabalho em altura', 'MAO_DE_OBRA', 'IDENTIFICADA', 'ALTA', 'Ana Costa', '2025-02-18', '2025-02-25', NULL, 2, 'Estoque de EPIs não foi reposto a tempo', 'Compra emergencial de EPIs'),
    ('rest-0003-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'REST-003', 'Betoneira com manutenção atrasada', 'MAQUINA', 'IDENTIFICADA', 'MEDIA', 'Carlos Lima', '2025-02-20', '2025-02-28', 'act-0008-0000-0000-000000000008', 1, 'Peças de reposição em falta no mercado', 'Alugar equipamento temporário'),
    
    -- Restrições EM_ANALISE
    ('rest-0004-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'REST-004', 'Projeto elétrico com incompatibilidade na prumada do bloco B', 'PROJETO', 'EM_ANALISE', 'ALTA', 'Pedro Souza', '2025-02-10', '2025-03-05', 'act-0032-0000-0000-000000000032', 7, 'Falta de compatibilização BIM entre disciplinas', 'Reunião de compatibilização com projetistas'),
    ('rest-0005-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'REST-005', 'Metodologia de concretagem em dias de chuva não definida', 'METODO', 'EM_ANALISE', 'MEDIA', 'João Silva', '2025-02-12', '2025-02-20', 'act-0009-0000-0000-000000000009', 3, 'Procedimento não previsto no plano de qualidade', 'Elaborar procedimento específico'),
    
    -- Restrições EM_RESOLUCAO
    ('rest-0006-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'REST-006', 'Vizinho contestando ruído excessivo durante escavação', 'MEIO_AMBIENTE', 'EM_RESOLUCAO', 'ALTA', 'Ana Costa', '2025-01-20', '2025-02-10', 'act-0003-0000-0000-000000000003', 3, 'Horário de trabalho não respeitado', 'Ajuste de horário e barreira acústica'),
    ('rest-0007-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'REST-007', 'Falta de mão de obra qualificada para armação', 'MAO_DE_OBRA', 'EM_RESOLUCAO', 'CRITICA', 'Carlos Lima', '2025-02-05', '2025-02-15', 'act-0007-0000-0000-000000000007', 5, 'Alta demanda no mercado da construção civil', 'Contratar empresa terceirizada'),
    
    -- Restrições RESOLVIDAS
    ('rest-0008-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'REST-008', 'Licença ambiental com pendência documental', 'EXTERNO', 'RESOLVIDA', 'CRITICA', 'João Silva', '2025-01-05', '2025-01-15', NULL, 10, 'Documentação incompleta na prefeitura', 'Complementação de documentos'),
    ('rest-0009-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'REST-009', 'Sondagem adicional necessária para fundações', 'MEDICAO', 'RESOLVIDA', 'ALTA', 'Maria Santos', '2025-01-08', '2025-01-12', 'act-0003-0000-0000-000000000003', 2, 'Laudo geotécnico inconclusivo', 'Contratar empresa de sondagem'),
    ('rest-0010-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'REST-010', 'Treinamento NR-35 para equipe nova', 'SEGURANCA', 'RESOLVIDA', 'ALTA', 'Ana Costa', '2025-01-15', '2025-01-22', NULL, 0, 'Novos colaboradores sem certificação', 'Agendar treinamento com empresa credenciada');

-- ============================================================================
-- 9. SEED DATA - AÇÕES 5W2H
-- ============================================================================

INSERT INTO acoes_5w2h (id, empresa_id, projeto_id, codigo, o_que, por_que, onde, quando, quem, como, quanto, status, prioridade, origem, restricao_lps_id)
VALUES 
    -- Ações PENDENTES
    ('acao-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5W2H-001', 'Contratar fornecedor alternativo de aço', 'Evitar atraso na estrutura devido à falha do fornecedor principal', 'Departamento de Suprimentos', '2025-02-25', 'Carlos Lima', 'Solicitar cotações de 3 fornecedores e aprovar o melhor custo-benefício', 180000, 'PENDENTE', 'CRITICA', 'RESTRICAO', 'rest-0001-0000-0000-000000000001'),
    ('acao-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5W2H-002', 'Comprar EPIs para trabalho em altura', 'Garantir segurança da equipe e conformidade NR-35', 'Almoxarifado da obra', '2025-02-22', 'Ana Costa', 'Identificar quantidades necessárias e emitir ordem de compra', 15000, 'PENDENTE', 'ALTA', 'RESTRICAO', 'rest-0002-0000-0000-000000000002'),
    ('acao-0003-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5W2H-003', 'Alugar betoneira reserva', 'Manter produtividade da concretagem durante manutenção', 'Canteiro de obras', '2025-02-28', 'Carlos Lima', 'Contatar locadoras e verificar disponibilidade imediata', 8000, 'PENDENTE', 'MEDIA', 'RESTRICAO', 'rest-0003-0000-0000-000000000003'),
    
    -- Ações EM_ANDAMENTO
    ('acao-0004-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5W2H-004', 'Realizar reunião de compatibilização BIM', 'Resolver conflitos entre projetos elétrico e hidráulico', 'Sala de reuniões', '2025-02-28', 'Pedro Souza', 'Agendar reunião com todos os projetistas e usar software de compatibilização', 0, 'EM_ANDAMENTO', 'ALTA', 'RESTRICAO', 'rest-0004-0000-0000-000000000004'),
    ('acao-0005-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5W2H-005', 'Instalar barreira acústica provisória', 'Reduzir impacto sonoro para vizinhança', 'Perímetro da obra', '2025-02-15', 'Ana Costa', 'Contratar empresa especializada e supervisionar instalação', 25000, 'EM_ANDAMENTO', 'ALTA', 'RESTRICAO', 'rest-0006-0000-0000-000000000006'),
    ('acao-0006-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5W2H-006', 'Negociar contrato com empreiteira de armação', 'Suprir falta de mão de obra qualificada', 'Escritório central', '2025-02-18', 'João Silva', 'Avaliar propostas de 3 empreiteiras e negociar condições', 95000, 'EM_ANDAMENTO', 'CRITICA', 'RESTRICAO', 'rest-0007-0000-0000-000000000007'),
    
    -- Ações CONCLUÍDAS
    ('acao-0007-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5W2H-007', 'Protocolar documentação complementar na prefeitura', 'Obter liberação da licença ambiental', 'Prefeitura Municipal', '2025-01-12', 'João Silva', 'Preparar documentos faltantes e protocolar fisicamente', 500, 'CONCLUIDA', 'CRITICA', 'RESTRICAO', 'rest-0008-0000-0000-000000000008'),
    ('acao-0008-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5W2H-008', 'Contratar sondagem complementar', 'Validar projeto de fundações', 'Área de fundações', '2025-01-10', 'Maria Santos', 'Solicitar proposta de empresa de sondagem credenciada', 12000, 'CONCLUIDA', 'ALTA', 'RESTRICAO', 'rest-0009-0000-0000-000000000009'),
    ('acao-0009-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5W2H-009', 'Agendar treinamento NR-35', 'Habilitar novos colaboradores para trabalho em altura', 'Centro de treinamento', '2025-01-20', 'Ana Costa', 'Contatar empresa credenciada e reservar vagas', 4500, 'CONCLUIDA', 'ALTA', 'RESTRICAO', 'rest-0010-0000-0000-000000000010'),
    
    -- Ações ATRASADAS
    ('acao-0010-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5W2H-010', 'Elaborar procedimento de concretagem em dias chuvosos', 'Garantir qualidade do concreto em condições adversas', 'Escritório técnico', '2025-02-18', 'Maria Santos', 'Pesquisar normas, elaborar procedimento e aprovar com engenheiro', 0, 'ATRASADA', 'MEDIA', 'RESTRICAO', 'rest-0005-0000-0000-000000000005');

-- ============================================================================
-- 10. SEED DATA - AUDITORIAS
-- ============================================================================

INSERT INTO auditorias (id, empresa_id, codigo, titulo, tipo, projeto_id, projeto_nome, local_auditoria, data_programada, data_realizacao, auditor_nome, status, total_itens, itens_conformes, itens_nao_conformes, itens_nao_aplicaveis, nota_geral, observacoes)
VALUES 
    -- Auditoria CONCLUÍDA com não conformidades
    ('audit-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'AUD-001', 'Auditoria de Segurança - Fundações', 'SEGURANCA', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Edifício Residencial TESTE', 'Área de Fundações', '2025-01-25', '2025-01-25', 'Ana Costa', 'CONCLUIDA', 10, 7, 2, 1, 70.00, 'Identificadas 2 não conformidades relacionadas à sinalização e organização do canteiro'),
    
    -- Auditoria CONCLUÍDA ok
    ('audit-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'AUD-002', 'Auditoria de Qualidade - Concretagem Estacas', 'QUALIDADE', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Edifício Residencial TESTE', 'Área de Fundações', '2025-02-05', '2025-02-05', 'Maria Santos', 'CONCLUIDA', 8, 8, 0, 0, 100.00, 'Todos os itens conformes. Rastreabilidade do concreto excelente'),
    
    -- Auditoria EM_ANDAMENTO
    ('audit-0003-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'AUD-003', 'Auditoria Ambiental - Gestão de Resíduos', 'AMBIENTAL', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Edifício Residencial TESTE', 'Canteiro de Obras', '2025-02-20', NULL, 'Ana Costa', 'EM_ANDAMENTO', 6, 4, 1, 0, NULL, 'Em andamento - aguardando verificação de documentação de destinação'),
    
    -- Auditorias PROGRAMADAS
    ('audit-0004-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'AUD-004', 'Auditoria de Qualidade - Estrutura Térreo', 'QUALIDADE', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Edifício Residencial TESTE', 'Estrutura Térreo', '2025-03-15', NULL, 'Maria Santos', 'PROGRAMADA', 0, 0, 0, 0, NULL, NULL),
    ('audit-0005-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'AUD-005', 'Auditoria de Segurança - Trabalho em Altura', 'SEGURANCA', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Edifício Residencial TESTE', 'Estrutura - Pavimentos Tipo', '2025-04-10', NULL, 'Ana Costa', 'PROGRAMADA', 0, 0, 0, 0, NULL, NULL);

-- ============================================================================
-- 11. SEED DATA - SOLICITAÇÕES DE MUDANÇA
-- ============================================================================

INSERT INTO solicitacoes_mudanca (id, empresa_id, codigo, titulo, descricao, justificativa, tipo_mudanca, prioridade, solicitante, data_solicitacao, status, projeto_id, projeto_nome, impacto_cronograma, impacto_custo, impacto_estimado)
VALUES 
    -- Mudança APROVADA
    ('mud-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'SM-001', 'Extensão de prazo para fundações', 'Solicito extensão de 5 dias no prazo de conclusão das fundações devido a condições climáticas adversas.', 'Chuvas intensas nos últimos 10 dias impediram a continuidade dos trabalhos de escavação e concretagem.', 'CRONOGRAMA', 'ALTA', 'Maria Santos', '2025-02-10', 'APROVADA', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Edifício Residencial TESTE', 5, 0, 'MEDIO'),
    
    -- Mudança EM_ANALISE
    ('mud-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'SM-002', 'Alteração de especificação de revestimento', 'Proposta de substituição do porcelanato especificado por modelo similar de fabricante diferente.', 'Fabricante original descontinuou o modelo especificado. Novo modelo possui características técnicas equivalentes com custo 15% menor.', 'ESCOPO', 'MEDIA', 'Carlos Lima', '2025-02-15', 'EM_ANALISE', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Edifício Residencial TESTE', 0, -45000, 'BAIXO'),
    
    -- Mudança SUBMETIDA
    ('mud-0003-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'SM-003', 'Acréscimo de sistema de automação predial', 'Inclusão de sistema de automação para controle de iluminação das áreas comuns e monitoramento de consumo energético.', 'Solicitação do cliente para atender certificação LEED e reduzir custos operacionais do condomínio.', 'ESCOPO', 'MEDIA', 'João Silva', '2025-02-18', 'SUBMETIDA', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Edifício Residencial TESTE', 15, 180000, 'ALTO'),
    
    -- Mudança RASCUNHO
    ('mud-0004-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'SM-004', 'Substituição de fornecedor de esquadrias', 'Análise de troca de fornecedor de esquadrias de alumínio devido a problemas de qualidade identificados em outras obras.', 'Relatos de problemas de vedação e infiltração em outros empreendimentos com mesmo fornecedor.', 'RECURSO', 'ALTA', 'Pedro Souza', '2025-02-20', 'RASCUNHO', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Edifício Residencial TESTE', 10, 50000, 'MEDIO');

-- ============================================================================
-- 12. UPDATE TIMESTAMPS TRIGGER (GENERIC)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_%I ON %I', t, t);
        EXECUTE format('CREATE TRIGGER trigger_update_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END
$$;

-- ============================================================================
-- 13. SEED DATA - CRITÉRIOS DE PRIORIZAÇÃO (PORTFOLIO)
-- ============================================================================

INSERT INTO criterios_priorizacao (id, empresa_id, nome, descricao, peso, inverso, ativo, ordem)
VALUES 
    ('crit-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Alinhamento Estratégico', 'Grau de alinhamento com os objetivos estratégicos da empresa', 25, false, true, 1),
    ('crit-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Retorno Financeiro (ROI)', 'Retorno sobre o investimento esperado', 20, false, true, 2),
    ('crit-0003-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Risco do Projeto', 'Nível de risco associado ao projeto', 15, true, true, 3),
    ('crit-0004-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Complexidade Técnica', 'Grau de complexidade técnica do projeto', 10, true, true, 4),
    ('crit-0005-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Urgência', 'Urgência de execução do projeto', 15, false, true, 5),
    ('crit-0006-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Disponibilidade de Recursos', 'Disponibilidade de recursos para execução', 15, false, true, 6)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 14. SEED DATA - PROJETOS DO PORTFÓLIO
-- ============================================================================

INSERT INTO projetos_portfolio (id, empresa_id, eps_node_id, codigo, nome, descricao, gerente, orcamento, data_inicio, data_fim, status, valor_estrategico, roi_esperado, score_total, ranking, categoria, fase)
VALUES 
    ('port-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PRJ-001', 'Edifício Residencial TESTE', 'Construção de edifício residencial multifamiliar com 20 pavimentos', 'João Silva', 25000000, '2025-01-06', '2025-11-28', 'NO_PRAZO', 8.5, 18.5, 7.85, 1, 'Residencial', 'Construção'),
    ('port-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', NULL, 'PRJ-002', 'Shopping Center Plaza Norte', 'Construção de shopping center com 150 lojas e cinema', 'Maria Santos', 85000000, '2025-06-01', '2027-12-31', 'NO_PRAZO', 9.0, 22.0, 7.42, 2, 'Comercial', 'Projeto'),
    ('port-0003-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', NULL, 'PRJ-003', 'Hospital Regional Oeste', 'Construção de hospital com 200 leitos', 'Pedro Souza', 120000000, '2025-09-01', '2028-06-30', 'NO_PRAZO', 9.5, 15.0, 7.28, 3, 'Saúde', 'Aprovação'),
    ('port-0004-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', NULL, 'PRJ-004', 'Residencial Vista Mar', 'Condomínio de casas alto padrão', 'Carlos Lima', 18000000, '2025-03-01', '2026-08-31', 'EM_RISCO', 7.0, 25.0, 6.95, 4, 'Residencial', 'Construção'),
    ('port-0005-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', NULL, 'PRJ-005', 'Centro Logístico Industrial', 'Galpões logísticos com 50.000m²', 'Ana Costa', 45000000, '2025-04-15', '2026-10-15', 'ATRASADO', 6.5, 20.0, 6.12, 5, 'Industrial', 'Construção')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 15. SEED DATA - SCORES DOS PROJETOS
-- ============================================================================

INSERT INTO scores_projetos (projeto_id, criterio_id, score, justificativa)
VALUES 
    -- Edifício Residencial TESTE
    ('port-0001-0000-0000-000000000001', 'crit-0001-0000-0000-000000000001', 8, 'Projeto alinhado com estratégia de expansão residencial'),
    ('port-0001-0000-0000-000000000001', 'crit-0002-0000-0000-000000000002', 9, 'ROI estimado de 18.5% - excelente retorno'),
    ('port-0001-0000-0000-000000000001', 'crit-0003-0000-0000-000000000003', 4, 'Risco moderado - terreno já adquirido'),
    ('port-0001-0000-0000-000000000001', 'crit-0004-0000-0000-000000000004', 3, 'Complexidade baixa - projeto padrão'),
    ('port-0001-0000-0000-000000000001', 'crit-0005-0000-0000-000000000005', 8, 'Alta urgência - vendas já iniciadas'),
    ('port-0001-0000-0000-000000000001', 'crit-0006-0000-0000-000000000006', 7, 'Boa disponibilidade de equipe'),
    
    -- Shopping Center Plaza Norte
    ('port-0002-0000-0000-000000000002', 'crit-0001-0000-0000-000000000001', 9, 'Projeto âncora para expansão comercial'),
    ('port-0002-0000-0000-000000000002', 'crit-0002-0000-0000-000000000002', 8, 'ROI de 22% - muito bom para setor'),
    ('port-0002-0000-0000-000000000002', 'crit-0003-0000-0000-000000000003', 6, 'Risco alto - licenciamento complexo'),
    ('port-0002-0000-0000-000000000002', 'crit-0004-0000-0000-000000000004', 7, 'Complexidade alta - múltiplas disciplinas'),
    ('port-0002-0000-0000-000000000002', 'crit-0005-0000-0000-000000000005', 6, 'Urgência média - prazo confortável'),
    ('port-0002-0000-0000-000000000002', 'crit-0006-0000-0000-000000000006', 6, 'Recursos a contratar'),
    
    -- Hospital Regional Oeste
    ('port-0003-0000-0000-000000000003', 'crit-0001-0000-0000-000000000001', 10, 'Projeto estratégico de responsabilidade social'),
    ('port-0003-0000-0000-000000000003', 'crit-0002-0000-0000-000000000002', 6, 'Margem menor - contrato público'),
    ('port-0003-0000-0000-000000000003', 'crit-0003-0000-0000-000000000003', 7, 'Risco alto - regulamentações ANVISA'),
    ('port-0003-0000-0000-000000000003', 'crit-0004-0000-0000-000000000004', 9, 'Altíssima complexidade técnica'),
    ('port-0003-0000-0000-000000000003', 'crit-0005-0000-0000-000000000005', 5, 'Baixa urgência - início futuro'),
    ('port-0003-0000-0000-000000000003', 'crit-0006-0000-0000-000000000006', 5, 'Equipe especializada necessária'),
    
    -- Residencial Vista Mar
    ('port-0004-0000-0000-000000000004', 'crit-0001-0000-0000-000000000001', 7, 'Alinhado parcialmente - segmento alto padrão'),
    ('port-0004-0000-0000-000000000004', 'crit-0002-0000-0000-000000000002', 9, 'Excelente ROI de 25%'),
    ('port-0004-0000-0000-000000000004', 'crit-0003-0000-0000-000000000003', 5, 'Risco moderado - dependência de vendas'),
    ('port-0004-0000-0000-000000000004', 'crit-0004-0000-0000-000000000004', 4, 'Complexidade média'),
    ('port-0004-0000-0000-000000000004', 'crit-0005-0000-0000-000000000005', 7, 'Urgência alta - atrasos existentes'),
    ('port-0004-0000-0000-000000000004', 'crit-0006-0000-0000-000000000006', 6, 'Recursos parcialmente disponíveis'),
    
    -- Centro Logístico Industrial
    ('port-0005-0000-0000-000000000005', 'crit-0001-0000-0000-000000000001', 6, 'Diversificação de portfólio'),
    ('port-0005-0000-0000-000000000005', 'crit-0002-0000-0000-000000000002', 7, 'Bom ROI de 20%'),
    ('port-0005-0000-0000-000000000005', 'crit-0003-0000-0000-000000000003', 5, 'Risco moderado'),
    ('port-0005-0000-0000-000000000005', 'crit-0004-0000-0000-000000000004', 5, 'Complexidade moderada'),
    ('port-0005-0000-0000-000000000005', 'crit-0005-0000-0000-000000000005', 8, 'Urgente - projeto atrasado'),
    ('port-0005-0000-0000-000000000005', 'crit-0006-0000-0000-000000000006', 4, 'Falta de recursos especializados')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 16. SEED DATA - CALENDÁRIOS DE PROJETO
-- ============================================================================

INSERT INTO calendarios_projeto (id, empresa_id, projeto_id, nome, descricao, dias_trabalho, horario_inicio, horario_fim, horas_por_dia, padrao)
VALUES 
    ('cal-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', NULL, 'Padrão 5x8', 'Calendário padrão segunda a sexta, 8h/dia', '{1,2,3,4,5}', '08:00', '17:00', 8, true),
    ('cal-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', NULL, 'Sábado Incluso 6x8', 'Segunda a sábado, 8h/dia', '{1,2,3,4,5,6}', '07:00', '16:00', 8, false),
    ('cal-0003-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Projeto TESTE', 'Calendário específico do projeto TESTE', '{1,2,3,4,5,6}', '07:00', '17:00', 9, false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 17. SEED DATA - EXCEÇÕES DE CALENDÁRIO
-- ============================================================================

INSERT INTO excecoes_calendario (calendario_id, data, tipo, descricao, horas_trabalho)
VALUES 
    ('cal-0001-0000-0000-000000000001', '2025-01-01', 'FERIADO', 'Confraternização Universal', 0),
    ('cal-0001-0000-0000-000000000001', '2025-02-03', 'FERIADO', 'Carnaval', 0),
    ('cal-0001-0000-0000-000000000001', '2025-02-04', 'FERIADO', 'Carnaval', 0),
    ('cal-0001-0000-0000-000000000001', '2025-04-18', 'FERIADO', 'Sexta-feira Santa', 0),
    ('cal-0001-0000-0000-000000000001', '2025-04-21', 'FERIADO', 'Tiradentes', 0),
    ('cal-0001-0000-0000-000000000001', '2025-05-01', 'FERIADO', 'Dia do Trabalho', 0),
    ('cal-0001-0000-0000-000000000001', '2025-09-07', 'FERIADO', 'Independência do Brasil', 0),
    ('cal-0001-0000-0000-000000000001', '2025-10-12', 'FERIADO', 'Nossa Senhora Aparecida', 0),
    ('cal-0001-0000-0000-000000000001', '2025-11-02', 'FERIADO', 'Finados', 0),
    ('cal-0001-0000-0000-000000000001', '2025-11-15', 'FERIADO', 'Proclamação da República', 0),
    ('cal-0001-0000-0000-000000000001', '2025-12-25', 'FERIADO', 'Natal', 0),
    -- Exceções específicas do projeto
    ('cal-0003-0000-0000-000000000003', '2025-02-08', 'TRABALHO_EXTRA', 'Mutirão de concretagem', 10),
    ('cal-0003-0000-0000-000000000003', '2025-03-22', 'TRABALHO_EXTRA', 'Recuperação de atraso', 8)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================
-- Total: 1 empresa, 6 usuarios, 2 eps_nodes, 4 wbs_nodes, 14 recursos,
--        49 atividades, 38 dependencias, 18 alocacoes, 10 restricoes,
--        10 acoes_5w2h, 5 auditorias, 4 solicitacoes_mudanca,
--        6 criterios_priorizacao, 5 projetos_portfolio, 30 scores_projetos,
--        3 calendarios_projeto, 13 excecoes_calendario
