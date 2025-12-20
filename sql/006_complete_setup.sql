-- VisionPlan - Complete Database Setup
-- Este arquivo contém o schema completo e dados de seed
-- Execute na ordem: schema primeiro, depois seed

-- ========================================
-- EXTENSÕES
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABELAS BASE (ordem de dependência)
-- ========================================

-- Empresas (tenants)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  empresa_id UUID REFERENCES empresas(id),
  camada_governanca TEXT CHECK (camada_governanca IN ('PROPONENTE', 'FISCALIZACAO', 'CONTRATADA')),
  perfil_acesso TEXT CHECK (perfil_acesso IN ('ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'MESTRE_OBRAS', 'ENCARREGADO', 'COLABORADOR', 'FISCALIZACAO_LEAD', 'FISCALIZACAO_TECNICO')),
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- EPS Nodes (Enterprise Project Structure)
CREATE TABLE IF NOT EXISTS eps_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES eps_nodes(id),
  empresa_id UUID REFERENCES empresas(id),
  codigo TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  nivel INTEGER DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Projetos
CREATE TABLE IF NOT EXISTS projetos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eps_id UUID REFERENCES eps_nodes(id),
  empresa_id UUID REFERENCES empresas(id),
  codigo TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'em_andamento',
  data_inicio DATE,
  data_termino DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- WBS Nodes
CREATE TABLE IF NOT EXISTS wbs_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eps_node_id UUID REFERENCES eps_nodes(id),
  parent_id UUID REFERENCES wbs_nodes(id),
  codigo TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  nivel INTEGER DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  peso NUMERIC DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Atividades do Cronograma
CREATE TABLE IF NOT EXISTS atividades_cronograma (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id),
  projeto_id UUID REFERENCES projetos(id),
  wbs_id UUID REFERENCES wbs_nodes(id),
  codigo TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT CHECK (tipo IN ('Tarefa', 'Marco', 'Fase', 'WBS')) DEFAULT 'Tarefa',
  data_inicio DATE,
  data_termino DATE,
  duracao INTEGER,
  percentual_completo NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'nao_iniciada',
  predecessoras TEXT[],
  responsavel TEXT,
  responsavel_id UUID REFERENCES usuarios(id),
  parent_id UUID REFERENCES atividades_cronograma(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by UUID REFERENCES usuarios(id)
);

-- Checklist Templates
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  itens JSONB DEFAULT '[]'::jsonb,
  versao TEXT DEFAULT '1.0',
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ,
  empresa_id UUID REFERENCES empresas(id),
  created_by UUID REFERENCES usuarios(id)
);

-- Auditorias
CREATE TABLE IF NOT EXISTS auditorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  checklist_id UUID REFERENCES checklist_templates(id),
  checklist_nome TEXT,
  projeto_id UUID REFERENCES eps_nodes(id),
  projeto_nome TEXT,
  tipo TEXT,
  responsavel TEXT,
  responsavel_id UUID REFERENCES usuarios(id),
  data_auditoria DATE NOT NULL,
  status TEXT DEFAULT 'programada',
  itens JSONB DEFAULT '[]'::jsonb,
  percentual_conformidade NUMERIC,
  nao_conformidades INTEGER DEFAULT 0,
  acoes_geradas TEXT[],
  observacoes_gerais TEXT,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  atividade_gantt_id UUID,
  empresa_id UUID REFERENCES empresas(id),
  created_by UUID REFERENCES usuarios(id)
);

-- Solicitacoes de Mudanca
CREATE TABLE IF NOT EXISTS solicitacoes_mudanca (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  justificativa TEXT,
  tipo_mudanca TEXT NOT NULL,
  prioridade TEXT DEFAULT 'media',
  solicitante TEXT,
  solicitante_id UUID REFERENCES usuarios(id),
  data_solicitacao DATE,
  status TEXT DEFAULT 'submetida',
  projeto_id UUID REFERENCES eps_nodes(id),
  projeto_nome TEXT,
  impacto_prazo INTEGER,
  impacto_custo NUMERIC,
  nivel_impacto TEXT,
  historico JSONB DEFAULT '[]'::jsonb,
  empresa_id UUID REFERENCES empresas(id),
  created_by UUID REFERENCES usuarios(id)
);

-- Reunioes
CREATE TABLE IF NOT EXISTS reunioes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  frequencia TEXT,
  participantes TEXT[],
  pauta_fixa TEXT[],
  proxima_data TIMESTAMPTZ,
  hora_inicio TEXT,
  duracao INTEGER,
  local TEXT,
  ativo BOOLEAN DEFAULT true,
  empresa_id UUID REFERENCES empresas(id),
  projeto_id UUID REFERENCES projetos(id),
  created_by UUID REFERENCES usuarios(id)
);

-- Restricoes Ishikawa
CREATE TABLE IF NOT EXISTS restricoes_ishikawa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT,
  descricao TEXT NOT NULL,
  categoria TEXT CHECK (categoria IN ('material', 'maquina', 'mao_de_obra', 'meio_ambiente', 'metodo', 'medida')),
  status TEXT DEFAULT 'no_prazo',
  atividade_id UUID,
  atividade_nome TEXT,
  wbs_id UUID,
  wbs_nome TEXT,
  eps_id UUID,
  eps_nome TEXT,
  data_criacao DATE,
  data_prevista DATE,
  data_conclusao DATE,
  responsavel TEXT,
  responsavel_id UUID REFERENCES usuarios(id),
  impacto_caminho_critico BOOLEAN DEFAULT false,
  duracao_atividade_impactada INTEGER,
  dias_atraso INTEGER DEFAULT 0,
  score_impacto INTEGER,
  reincidente BOOLEAN DEFAULT false,
  empresa_id UUID REFERENCES empresas(id),
  projeto_id UUID REFERENCES projetos(id),
  created_by UUID REFERENCES usuarios(id)
);

-- Acoes 5W2H
CREATE TABLE IF NOT EXISTS acoes_5w2h (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT,
  o_que TEXT NOT NULL,
  por_que TEXT,
  onde TEXT,
  quando DATE,
  quem TEXT,
  quem_id UUID REFERENCES usuarios(id),
  como TEXT,
  quanto NUMERIC,
  status TEXT DEFAULT 'pendente',
  prioridade TEXT DEFAULT 'media',
  percentual_concluido INTEGER DEFAULT 0,
  origem TEXT,
  origem_id UUID,
  restricao_lps_id UUID,
  empresa_id UUID REFERENCES empresas(id),
  projeto_id UUID REFERENCES eps_nodes(id),
  created_by UUID REFERENCES usuarios(id)
);

-- Restricoes LPS
CREATE TABLE IF NOT EXISTS restricoes_lps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id),
  projeto_id UUID REFERENCES eps_nodes(id),
  codigo TEXT,
  descricao TEXT NOT NULL,
  categoria TEXT,
  status TEXT DEFAULT 'identificada',
  prioridade TEXT DEFAULT 'media',
  responsavel_id UUID REFERENCES usuarios(id),
  responsavel_nome TEXT,
  data_identificacao DATE,
  data_prevista DATE,
  data_resolucao DATE,
  atividade_id UUID,
  wbs_id UUID,
  impacto_cronograma INTEGER,
  impacto_custo NUMERIC,
  observacoes TEXT,
  created_by UUID REFERENCES usuarios(id)
);

-- ========================================
-- DADOS DE SEED
-- ========================================

-- EMPRESA: Tenta inserir, ignora erro se já existir
DO $$
BEGIN
  INSERT INTO empresas (id, nome, cnpj, ativo) VALUES
    ('a0000001-0000-0000-0000-000000000001'::uuid, 'Construtora VisionPlan Ltda', '12.345.678/0001-90', true);
EXCEPTION WHEN unique_violation THEN
  -- Ignora se já existe (por ID ou CNPJ)
  NULL;
END $$;

-- USUARIOS (8 users com governance layers)
INSERT INTO usuarios (id, nome, email, empresa_id, camada_governanca, perfil_acesso, ativo) VALUES
  ('b0000001-0000-0000-0000-000000000001'::uuid, 'João Silva', 'joao.silva@visionplan.com', 'a0000001-0000-0000-0000-000000000001'::uuid, 'PROPONENTE', 'ADMIN', true),
  ('b0000002-0000-0000-0000-000000000002'::uuid, 'Maria Santos', 'maria.santos@visionplan.com', 'a0000001-0000-0000-0000-000000000001'::uuid, 'CONTRATADA', 'GERENTE_PROJETO', true),
  ('b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', 'carlos.lima@visionplan.com', 'a0000001-0000-0000-0000-000000000001'::uuid, 'CONTRATADA', 'COORDENADOR_OBRA', true),
  ('b0000004-0000-0000-0000-000000000004'::uuid, 'Ana Costa', 'ana.costa@visionplan.com', 'a0000001-0000-0000-0000-000000000001'::uuid, 'FISCALIZACAO', 'FISCALIZACAO_LEAD', true),
  ('b0000005-0000-0000-0000-000000000005'::uuid, 'Pedro Souza', 'pedro.souza@visionplan.com', 'a0000001-0000-0000-0000-000000000001'::uuid, 'FISCALIZACAO', 'FISCALIZACAO_TECNICO', true),
  ('b0000006-0000-0000-0000-000000000006'::uuid, 'Fernanda Oliveira', 'fernanda.oliveira@visionplan.com', 'a0000001-0000-0000-0000-000000000001'::uuid, 'CONTRATADA', 'ENGENHEIRO_PLANEJAMENTO', true),
  ('b0000007-0000-0000-0000-000000000007'::uuid, 'Roberto Dias', 'roberto.dias@visionplan.com', 'a0000001-0000-0000-0000-000000000001'::uuid, 'CONTRATADA', 'MESTRE_OBRAS', true),
  ('b0000008-0000-0000-0000-000000000008'::uuid, 'Luciana Ferreira', 'luciana.ferreira@visionplan.com', 'a0000001-0000-0000-0000-000000000001'::uuid, 'PROPONENTE', 'DIRETOR', true)
ON CONFLICT (id) DO NOTHING;

-- EPS NODES (3 nodes)
INSERT INTO eps_nodes (id, parent_id, empresa_id, codigo, nome, descricao, nivel, ordem, ativo) VALUES
  ('c0000001-0000-0000-0000-000000000001'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'EPS-001', 'Residencial', 'Projetos residenciais', 0, 1, true),
  ('c0000002-0000-0000-0000-000000000002'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'EPS-002', 'Comercial', 'Projetos comerciais', 0, 2, true),
  ('c0000003-0000-0000-0000-000000000003'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'EPS-003', 'Industrial', 'Projetos industriais', 0, 3, true)
ON CONFLICT (id) DO NOTHING;

-- PROJETOS (3 projects)
INSERT INTO projetos (id, eps_id, empresa_id, codigo, nome, descricao, status, data_inicio, data_termino) VALUES
  ('d0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'PRJ-001', 'Torre Alpha', 'Edifício residencial 20 pavimentos', 'em_andamento', '2025-01-15', '2026-12-31'),
  ('d0000002-0000-0000-0000-000000000002'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'PRJ-002', 'Centro Comercial Plaza', 'Shopping center 3 pisos', 'em_andamento', '2025-03-01', '2027-06-30'),
  ('d0000003-0000-0000-0000-000000000003'::uuid, 'c0000003-0000-0000-0000-000000000003'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'PRJ-003', 'Galpão Logístico Beta', 'Centro de distribuição 15.000m²', 'em_andamento', '2025-02-01', '2025-11-30')
ON CONFLICT (id) DO NOTHING;

-- WBS NODES (8 nodes)
INSERT INTO wbs_nodes (id, eps_node_id, codigo, nome, descricao, nivel, ordem, ativo) VALUES
  ('e0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'WBS-1', 'Fundações', 'Serviços de fundação', 1, 1, true),
  ('e0000002-0000-0000-0000-000000000002'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'WBS-2', 'Estrutura', 'Estrutura de concreto armado', 1, 2, true),
  ('e0000003-0000-0000-0000-000000000003'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'WBS-3', 'Vedações', 'Alvenaria e fechamentos', 1, 3, true),
  ('e0000004-0000-0000-0000-000000000004'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'WBS-4', 'Instalações', 'Instalações elétricas e hidráulicas', 1, 4, true),
  ('e0000005-0000-0000-0000-000000000005'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'WBS-5', 'Acabamentos', 'Revestimentos e acabamentos', 1, 5, true),
  ('e0000006-0000-0000-0000-000000000006'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid, 'WBS-6', 'Infraestrutura', 'Terraplenagem e fundações', 1, 1, true),
  ('e0000007-0000-0000-0000-000000000007'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid, 'WBS-7', 'Superestrutura', 'Estrutura metálica', 1, 2, true),
  ('e0000008-0000-0000-0000-000000000008'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid, 'WBS-8', 'MEP', 'Mechanical, Electrical, Plumbing', 1, 3, true)
ON CONFLICT (id) DO NOTHING;

-- ATIVIDADES CRONOGRAMA (13 activities)
INSERT INTO atividades_cronograma (id, empresa_id, projeto_id, wbs_id, codigo, nome, tipo, data_inicio, data_termino, duracao, percentual_completo, status, responsavel, responsavel_id, created_by) VALUES
  ('f0000001-0000-0000-0000-000000000001'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 'AT-001', 'Locação da Obra', 'Tarefa', '2025-01-15', '2025-01-20', 5, 100, 'concluida', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000002-0000-0000-0000-000000000002'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 'AT-002', 'Escavação Fundações', 'Tarefa', '2025-01-21', '2025-02-10', 20, 100, 'concluida', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000003-0000-0000-0000-000000000003'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 'AT-003', 'Armação Fundações', 'Tarefa', '2025-02-03', '2025-02-20', 17, 85, 'em_andamento', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000004-0000-0000-0000-000000000004'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 'AT-004', 'Concretagem Fundações', 'Tarefa', '2025-02-15', '2025-03-01', 14, 60, 'em_andamento', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000005-0000-0000-0000-000000000005'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000002-0000-0000-0000-000000000002'::uuid, 'AT-005', 'Forma Pilares 1º Pav', 'Tarefa', '2025-03-01', '2025-03-10', 9, 0, 'nao_iniciada', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000006-0000-0000-0000-000000000006'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000002-0000-0000-0000-000000000002'::uuid, 'AT-006', 'Armação Pilares 1º Pav', 'Tarefa', '2025-03-08', '2025-03-18', 10, 0, 'nao_iniciada', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000007-0000-0000-0000-000000000007'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000002-0000-0000-0000-000000000002'::uuid, 'AT-007', 'Concretagem Pilares 1º Pav', 'Tarefa', '2025-03-18', '2025-03-22', 4, 0, 'nao_iniciada', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000008-0000-0000-0000-000000000008'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000003-0000-0000-0000-000000000003'::uuid, 'AT-008', 'Alvenaria Térreo', 'Tarefa', '2025-04-01', '2025-04-30', 29, 0, 'nao_iniciada', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000009-0000-0000-0000-000000000009'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000004-0000-0000-0000-000000000004'::uuid, 'AT-009', 'Instalações Elétricas Térreo', 'Tarefa', '2025-05-01', '2025-05-20', 19, 0, 'nao_iniciada', 'Fernanda Oliveira', 'b0000006-0000-0000-0000-000000000006'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000010-0000-0000-0000-000000000010'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000004-0000-0000-0000-000000000004'::uuid, 'AT-010', 'Instalações Hidráulicas Térreo', 'Tarefa', '2025-05-01', '2025-05-25', 24, 0, 'nao_iniciada', 'Fernanda Oliveira', 'b0000006-0000-0000-0000-000000000006'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000011-0000-0000-0000-000000000011'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000005-0000-0000-0000-000000000005'::uuid, 'AT-011', 'Revestimento Interno Térreo', 'Tarefa', '2025-06-01', '2025-07-15', 44, 0, 'nao_iniciada', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000012-0000-0000-0000-000000000012'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000005-0000-0000-0000-000000000005'::uuid, 'AT-012', 'Pintura Geral', 'Tarefa', '2025-07-16', '2025-08-30', 45, 0, 'nao_iniciada', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000013-0000-0000-0000-000000000013'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, NULL, 'AT-013', 'Entrega Final', 'Marco', '2026-12-31', '2026-12-31', 0, 0, 'nao_iniciada', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- CHECKLIST TEMPLATES (3 templates)
INSERT INTO checklist_templates (id, nome, categoria, itens, versao, empresa_id, created_by) VALUES
  ('11111111-1111-1111-1111-111111111101'::uuid, 'Checklist de Segurança - NR-18', 'Segurança',
   '[{"id": "item-1", "descricao": "EPIs disponíveis e em bom estado", "obrigatorio": true},
     {"id": "item-2", "descricao": "Sinalização adequada", "obrigatorio": true},
     {"id": "item-3", "descricao": "Extintores dentro da validade", "obrigatorio": true},
     {"id": "item-4", "descricao": "Proteções coletivas instaladas", "obrigatorio": true},
     {"id": "item-5", "descricao": "Ordem e limpeza do canteiro", "obrigatorio": false}]',
   '2.0', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),

  ('11111111-1111-1111-1111-111111111102'::uuid, 'Checklist de Concreto', 'Qualidade',
   '[{"id": "item-1", "descricao": "Slump test realizado", "obrigatorio": true},
     {"id": "item-2", "descricao": "Corpos de prova moldados", "obrigatorio": true},
     {"id": "item-3", "descricao": "Nota fiscal conferida", "obrigatorio": true},
     {"id": "item-4", "descricao": "Tempo de descarga adequado", "obrigatorio": true}]',
   '1.5', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),

  ('11111111-1111-1111-1111-111111111103'::uuid, 'Checklist de Alvenaria', 'Qualidade',
   '[{"id": "item-1", "descricao": "Prumo verificado", "obrigatorio": true},
     {"id": "item-2", "descricao": "Nível conferido", "obrigatorio": true},
     {"id": "item-3", "descricao": "Espessura de juntas adequada", "obrigatorio": true},
     {"id": "item-4", "descricao": "Amarração correta", "obrigatorio": true}]',
   '1.0', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid)
ON CONFLICT (id) DO NOTHING;

-- AUDITORIAS (5 auditorias)
INSERT INTO auditorias (id, codigo, titulo, descricao, checklist_id, checklist_nome, projeto_id, projeto_nome, tipo, responsavel, responsavel_id, data_auditoria, status, itens, percentual_conformidade, nao_conformidades, acoes_geradas, observacoes_gerais, empresa_id, created_by) VALUES
  ('22222222-2222-2222-2222-222222222201'::uuid, 'AUD-2025-001', 'Auditoria de Segurança - Janeiro', 'Auditoria mensal de segurança do trabalho', '11111111-1111-1111-1111-111111111101'::uuid, 'Checklist de Segurança - NR-18', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Segurança', 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, '2025-01-25', 'concluida',
   '[{"id": "item-1", "status": "conforme"}, {"id": "item-2", "status": "conforme"}, {"id": "item-3", "status": "nao_conforme", "observacao": "2 extintores vencidos"}, {"id": "item-4", "status": "conforme"}, {"id": "item-5", "status": "conforme"}]',
   80.0, 1, ARRAY['5W2H-001'], 'Auditoria realizada com sucesso. Pendência de extintores identificada.', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),

  ('22222222-2222-2222-2222-222222222202'::uuid, 'AUD-2025-002', 'Auditoria de Concreto - Fundações', 'Verificação de qualidade do concreto das fundações', '11111111-1111-1111-1111-111111111102'::uuid, 'Checklist de Concreto', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Qualidade', 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, '2025-02-10', 'concluida',
   '[{"id": "item-1", "status": "conforme"}, {"id": "item-2", "status": "conforme"}, {"id": "item-3", "status": "conforme"}, {"id": "item-4", "status": "conforme"}]',
   100.0, 0, NULL, 'Todos os itens em conformidade.', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),

  ('22222222-2222-2222-2222-222222222203'::uuid, 'AUD-2025-003', 'Auditoria de Segurança - Fevereiro', 'Auditoria mensal de segurança do trabalho', '11111111-1111-1111-1111-111111111101'::uuid, 'Checklist de Segurança - NR-18', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Segurança', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005'::uuid, '2025-02-25', 'em_andamento',
   '[{"id": "item-1", "status": "conforme"}, {"id": "item-2", "status": "pendente"}]',
   50.0, 0, NULL, 'Auditoria em andamento.', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),

  ('22222222-2222-2222-2222-222222222204'::uuid, 'AUD-2025-004', 'Auditoria de Alvenaria - Térreo', 'Verificação de qualidade da alvenaria', '11111111-1111-1111-1111-111111111103'::uuid, 'Checklist de Alvenaria', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Qualidade', 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, '2025-04-15', 'programada',
   '[]', NULL, 0, NULL, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),

  ('22222222-2222-2222-2222-222222222205'::uuid, 'AUD-2025-005', 'Auditoria de Segurança - Março', 'Auditoria mensal de segurança do trabalho', '11111111-1111-1111-1111-111111111101'::uuid, 'Checklist de Segurança - NR-18', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Segurança', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005'::uuid, '2025-03-25', 'programada',
   '[]', NULL, 0, NULL, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid)
ON CONFLICT (id) DO NOTHING;

-- SOLICITACOES DE MUDANCA (5 solicitações)
INSERT INTO solicitacoes_mudanca (id, codigo, titulo, descricao, justificativa, tipo_mudanca, prioridade, solicitante, solicitante_id, data_solicitacao, status, projeto_id, projeto_nome, impacto_prazo, impacto_custo, nivel_impacto, historico, empresa_id, created_by) VALUES
  ('33333333-3333-3333-3333-333333333301'::uuid, 'SM-2025-001', 'Alteração de Layout - Subsolo', 'Modificar layout das vagas de garagem', 'Atender nova legislação municipal', 'escopo', 'alta', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, '2025-02-01', 'aprovada', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 15, 85000.00, 'medio',
   '[{"id": "hist-1", "data": "2025-02-01T10:00:00Z", "acao": "submetida", "usuario": "João Silva"},
     {"id": "hist-2", "data": "2025-02-05T14:00:00Z", "acao": "em_analise", "usuario": "Maria Santos"},
     {"id": "hist-3", "data": "2025-02-08T16:00:00Z", "acao": "aprovada", "usuario": "Luciana Ferreira"}]',
   'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),

  ('33333333-3333-3333-3333-333333333302'::uuid, 'SM-2025-002', 'Inclusão de Gerador de Emergência', 'Adicionar gerador diesel 500kVA', 'Exigência do Corpo de Bombeiros', 'escopo', 'alta', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005'::uuid, '2025-02-10', 'em_analise', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 20, 180000.00, 'alto',
   '[{"id": "hist-1", "data": "2025-02-10T11:00:00Z", "acao": "submetida", "usuario": "Pedro Souza"},
     {"id": "hist-2", "data": "2025-02-12T16:00:00Z", "acao": "em_analise", "usuario": "João Silva"}]',
   'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),

  ('33333333-3333-3333-3333-333333333303'::uuid, 'SM-2025-003', 'Alteração de Acabamento - Fachada', 'Substituição de pastilha por ACM', 'Redução de custo e prazo', 'escopo', 'media', 'Fernanda Oliveira', 'b0000006-0000-0000-0000-000000000006'::uuid, '2025-02-15', 'submetida', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', -10, -45000.00, 'medio',
   '[{"id": "hist-1", "data": "2025-02-15T08:30:00Z", "acao": "submetida", "usuario": "Fernanda Oliveira"}]',
   'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000006-0000-0000-0000-000000000006'::uuid),

  ('33333333-3333-3333-3333-333333333304'::uuid, 'SM-2025-004', 'Antecipação de Elevadores', 'Antecipar instalação para uso na obra', 'Facilitar transporte de materiais', 'cronograma', 'baixa', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, '2025-02-20', 'rejeitada', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 0, 25000.00, 'baixo',
   '[{"id": "hist-1", "data": "2025-02-20T13:00:00Z", "acao": "submetida", "usuario": "Carlos Lima"},
     {"id": "hist-2", "data": "2025-02-22T10:00:00Z", "acao": "rejeitada", "usuario": "João Silva"}]',
   'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),

  ('33333333-3333-3333-3333-333333333305'::uuid, 'SM-2025-005', 'Ampliação de Subsolos - Plaza', 'Adicionar nível de subsolo', 'Atender norma de vagas/m²', 'escopo', 'alta', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, '2025-03-01', 'submetida', 'c0000002-0000-0000-0000-000000000002'::uuid, 'Centro Comercial Plaza', 60, 2500000.00, 'alto',
   '[{"id": "hist-1", "data": "2025-03-01T09:00:00Z", "acao": "submetida", "usuario": "João Silva"}]',
   'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- REUNIOES (5 reuniões)
INSERT INTO reunioes (id, tipo, titulo, descricao, frequencia, participantes, pauta_fixa, proxima_data, hora_inicio, duracao, local, ativo, empresa_id, projeto_id, created_by) VALUES
  ('44444444-4444-4444-4444-444444444401'::uuid, 'daily', 'Daily Standup - Torre Alpha', 'Reunião diária de alinhamento', 'diaria', '{"João Silva", "Carlos Lima", "Maria Santos"}', '{"Verificação segurança", "Status frentes", "Impedimentos"}', '2025-12-21 07:30:00', '07:30', 15, 'Canteiro de obras', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('44444444-4444-4444-4444-444444444402'::uuid, 'weekly', 'Reunião Semanal de Coordenação', 'Reunião de coordenação técnica', 'semanal', '{"João Silva", "Maria Santos", "Ana Costa", "Pedro Souza"}', '{"Avanço físico", "Restrições LPS", "Custos", "Plano ação"}', '2025-12-23 14:00:00', '14:00', 90, 'Sala de reuniões - Sede', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('44444444-4444-4444-4444-444444444403'::uuid, 'monthly', 'Reunião Mensal com Cliente', 'Apresentação de resultados', 'mensal', '{"João Silva", "Maria Santos", "Cliente"}', '{"Avanço físico-financeiro", "Pendências", "Projeções"}', '2025-12-28 10:00:00', '10:00', 120, 'Escritório do Cliente', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('44444444-4444-4444-4444-444444444404'::uuid, 'weekly', 'Reunião de Segurança', 'Discussão de indicadores de segurança', 'semanal', '{"Pedro Souza", "Carlos Lima"}', '{"Incidentes", "Indicadores", "DDS", "Inspeções"}', '2025-12-22 08:00:00', '08:00', 60, 'Canteiro de obras', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),
  
  ('44444444-4444-4444-4444-444444444405'::uuid, 'biweekly', 'Reunião de Qualidade', 'Análise de não conformidades', 'quinzenal', '{"Ana Costa", "Maria Santos", "Carlos Lima"}', '{"Auditorias", "Ações corretivas", "Indicadores"}', '2025-12-26 15:00:00', '15:00', 60, 'Sala de reuniões - Sede', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid)
ON CONFLICT (id) DO NOTHING;

-- RESTRICOES ISHIKAWA (12 restrições - todas as 6M categorias)
INSERT INTO restricoes_ishikawa (id, codigo, descricao, categoria, status, atividade_id, atividade_nome, wbs_id, wbs_nome, eps_id, eps_nome, data_criacao, data_prevista, data_conclusao, responsavel, responsavel_id, impacto_caminho_critico, duracao_atividade_impactada, dias_atraso, score_impacto, reincidente, empresa_id, projeto_id, created_by) VALUES
  ('55555555-5555-5555-5555-555555555501'::uuid, 'RI-001', 'Atraso na entrega de aço CA-50', 'material', 'vencida', 'f0000003-0000-0000-0000-000000000003'::uuid, 'Armação Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-01', '2025-02-08', NULL, 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, true, 17, 12, 68, true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid),
  
  ('55555555-5555-5555-5555-555555555502'::uuid, 'RI-002', 'Equipamento de sondagem indisponível', 'maquina', 'concluida', 'f0000002-0000-0000-0000-000000000002'::uuid, 'Escavação Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-01-20', '2025-01-25', '2025-01-24', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, false, 20, 0, 15, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
  
  ('55555555-5555-5555-5555-555555555503'::uuid, 'RI-003', 'Falta de mão de obra qualificada', 'mao_de_obra', 'atrasada', 'f0000003-0000-0000-0000-000000000003'::uuid, 'Armação Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-05', '2025-02-12', NULL, 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, true, 17, 8, 55, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
  
  ('55555555-5555-5555-5555-555555555504'::uuid, 'RI-004', 'Licença ambiental pendente', 'meio_ambiente', 'em_execucao', 'f0000004-0000-0000-0000-000000000004'::uuid, 'Concretagem Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-10', '2025-02-28', NULL, 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, true, 14, 0, 42, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('55555555-5555-5555-5555-555555555505'::uuid, 'RI-005', 'Projeto estrutural com inconsistências', 'metodo', 'no_prazo', 'f0000005-0000-0000-0000-000000000005'::uuid, 'Forma Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002'::uuid, 'Estrutura', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-15', '2025-03-10', NULL, 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid, false, 9, 0, 22, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),
  
  ('55555555-5555-5555-5555-555555555506'::uuid, 'RI-006', 'Ensaio de resistência reprovado', 'medida', 'vencida', 'f0000004-0000-0000-0000-000000000004'::uuid, 'Concretagem Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-08', '2025-02-10', NULL, 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, true, 14, 15, 72, true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
  
  ('55555555-5555-5555-5555-555555555507'::uuid, 'RI-007', 'Chuvas intensas paralisando obra', 'meio_ambiente', 'concluida', 'f0000002-0000-0000-0000-000000000002'::uuid, 'Escavação Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-01-25', '2025-01-30', '2025-01-29', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, false, 20, 0, 18, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
  
  ('55555555-5555-5555-5555-555555555508'::uuid, 'RI-008', 'Falta procedimento de cura concreto', 'metodo', 'em_execucao', 'f0000004-0000-0000-0000-000000000004'::uuid, 'Concretagem Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-12', '2025-02-20', NULL, 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, false, 14, 0, 25, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
  
  ('55555555-5555-5555-5555-555555555509'::uuid, 'RI-009', 'Grua com capacidade insuficiente', 'maquina', 'no_prazo', 'f0000006-0000-0000-0000-000000000006'::uuid, 'Armação Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002'::uuid, 'Estrutura', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-18', '2025-03-15', NULL, 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, true, 10, 0, 35, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000007-0000-0000-0000-000000000007'::uuid),
  
  ('55555555-5555-5555-5555-555555555510'::uuid, 'RI-010', 'Treinamento de NR-35 pendente', 'mao_de_obra', 'atrasada', 'f0000005-0000-0000-0000-000000000005'::uuid, 'Forma Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002'::uuid, 'Estrutura', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-20', '2025-03-01', NULL, 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005'::uuid, false, 9, 5, 28, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),
  
  ('55555555-5555-5555-5555-555555555511'::uuid, 'RI-011', 'Fornecedor de formas com atraso', 'material', 'em_execucao', 'f0000005-0000-0000-0000-000000000005'::uuid, 'Forma Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002'::uuid, 'Estrutura', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-22', '2025-03-08', NULL, 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, true, 9, 0, 45, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid),
  
  ('55555555-5555-5555-5555-555555555512'::uuid, 'RI-012', 'Calibração de equipamentos topografia', 'medida', 'concluida', 'f0000001-0000-0000-0000-000000000001'::uuid, 'Locação da Obra', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-01-14', '2025-01-16', '2025-01-15', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid, false, 5, 0, 8, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ACOES 5W2H (10 ações)
INSERT INTO acoes_5w2h (id, codigo, o_que, por_que, onde, quando, quem, quem_id, como, quanto, status, prioridade, percentual_concluido, origem, origem_id, restricao_lps_id, empresa_id, projeto_id, created_by) VALUES
  ('66666666-6666-6666-6666-666666666601'::uuid, '5W2H-001', 'Negociar entrega antecipada de aço CA-50', 'Mitigar atraso crítico', 'Fornecedor - Gerdau', '2025-02-05', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, 'Reunião virtual com gerente', 5000.00, 'em_andamento', 'alta', 50, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555501'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid),
  
  ('66666666-6666-6666-6666-666666666602'::uuid, '5W2H-002', 'Recrutar 5 armadores qualificados', 'Recuperar atraso', 'Canteiro de obras', '2025-02-10', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Contato com sindicato', 15000.00, 'concluida', 'alta', 100, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555503'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
  
  ('66666666-6666-6666-6666-666666666603'::uuid, '5W2H-003', 'Obter licença ambiental complementar', 'Cumprir exigência legal', 'IBAMA / Secretaria', '2025-02-25', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, 'Protocolar documentação', 3500.00, 'em_andamento', 'alta', 75, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555504'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('66666666-6666-6666-6666-666666666604'::uuid, '5W2H-004', 'Substituir 2 extintores vencidos', 'Corrigir não conformidade', 'Canteiro de obras', '2025-01-30', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005'::uuid, 'Solicitar ao fornecedor', 450.00, 'concluida', 'media', 100, 'auditoria', '22222222-2222-2222-2222-222222222201'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),
  
  ('66666666-6666-6666-6666-666666666605'::uuid, '5W2H-005', 'Criar PO para cura úmida', 'Padronizar processo', 'Escritório técnico', '2025-02-18', 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, 'Procedimento NBR 14931', 0.00, 'em_andamento', 'media', 60, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555508'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
  
  ('66666666-6666-6666-6666-666666666606'::uuid, '5W2H-006', 'Realizar treinamento NR-35', 'Habilitar equipe', 'Centro de treinamento', '2025-03-05', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005'::uuid, 'Contratar certificadora', 8500.00, 'pendente', 'alta', 0, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555510'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),
  
  ('66666666-6666-6666-6666-666666666607'::uuid, '5W2H-007', 'Substituir grua por 10t', 'Atender demanda', 'Canteiro de obras', '2025-03-10', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, 'Negociar com locadoras', 45000.00, 'pendente', 'alta', 0, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555509'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000007-0000-0000-0000-000000000007'::uuid),
  
  ('66666666-6666-6666-6666-666666666608'::uuid, '5W2H-008', 'Solicitar revisão ao projetista', 'Eliminar conflitos', 'Escritório de projeto', '2025-03-01', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid, 'Reunião técnica e RFI', 2500.00, 'em_andamento', 'media', 40, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555505'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),
  
  ('66666666-6666-6666-6666-666666666609'::uuid, '5W2H-009', 'Analisar falha corpos de prova', 'Identificar causa raiz', 'Laboratório de ensaios', '2025-02-12', 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, 'Reunir com concreteira', 1200.00, 'concluida', 'alta', 100, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555506'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
  
  ('66666666-6666-6666-6666-666666666610'::uuid, '5W2H-010', 'Antecipar entrega kit formas', 'Evitar impacto estrutura', 'Fornecedor - Formaço', '2025-02-28', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, 'Pagamento antecipado', 12000.00, 'em_andamento', 'alta', 30, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555511'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid)
ON CONFLICT (id) DO NOTHING;

-- RESTRICOES LPS (8 restrições)
INSERT INTO restricoes_lps (id, empresa_id, projeto_id, codigo, descricao, categoria, status, prioridade, responsavel_id, responsavel_nome, data_identificacao, data_prevista, data_resolucao, atividade_id, wbs_id, impacto_cronograma, impacto_custo, observacoes, created_by) VALUES
  ('77777777-7777-7777-7777-777777777701'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-001', 'Aguardando liberação de projeto revisado', 'projeto', 'identificada', 'alta', 'b0000002-0000-0000-0000-000000000002'::uuid, 'Maria Santos', '2025-02-20', '2025-03-05', NULL, 'f0000005-0000-0000-0000-000000000005'::uuid, 'e0000002-0000-0000-0000-000000000002'::uuid, 5, 0, NULL, 'b0000008-0000-0000-0000-000000000008'::uuid),
  
  ('77777777-7777-7777-7777-777777777702'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-002', 'Material de formas em trânsito', 'material', 'em_tratamento', 'alta', 'b0000001-0000-0000-0000-000000000001'::uuid, 'João Silva', '2025-02-22', '2025-03-08', NULL, 'f0000005-0000-0000-0000-000000000005'::uuid, 'e0000002-0000-0000-0000-000000000002'::uuid, 7, 12000, NULL, 'b0000008-0000-0000-0000-000000000008'::uuid),
  
  ('77777777-7777-7777-7777-777777777703'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-003', 'Equipe de armação subdimensionada', 'mao_de_obra', 'removida', 'alta', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', '2025-02-05', '2025-02-10', '2025-02-09', 'f0000003-0000-0000-0000-000000000003'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 3, 15000, 'Contratação emergencial realizada', 'b0000003-0000-0000-0000-000000000003'::uuid),
  
  ('77777777-7777-7777-7777-777777777704'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-004', 'Grua com capacidade insuficiente', 'equipamento', 'em_tratamento', 'media', 'b0000007-0000-0000-0000-000000000007'::uuid, 'Roberto Dias', '2025-02-18', '2025-03-15', NULL, 'f0000006-0000-0000-0000-000000000006'::uuid, 'e0000002-0000-0000-0000-000000000002'::uuid, 10, 45000, 'Negociação com locadora em andamento', 'b0000007-0000-0000-0000-000000000007'::uuid),
  
  ('77777777-7777-7777-7777-777777777705'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-005', 'Licença ambiental complementar pendente', 'outros', 'identificada', 'alta', 'b0000001-0000-0000-0000-000000000001'::uuid, 'João Silva', '2025-02-10', '2025-02-28', NULL, 'f0000004-0000-0000-0000-000000000004'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 14, 3500, NULL, 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('77777777-7777-7777-7777-777777777706'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-006', 'Conflito de interfaces projeto estrutural x hidráulico', 'projeto', 'em_tratamento', 'media', 'b0000002-0000-0000-0000-000000000002'::uuid, 'Maria Santos', '2025-02-15', '2025-03-10', NULL, 'f0000009-0000-0000-0000-000000000009'::uuid, 'e0000004-0000-0000-0000-000000000004'::uuid, 8, 2500, 'RFI enviada ao projetista', 'b0000002-0000-0000-0000-000000000002'::uuid),
  
  ('77777777-7777-7777-7777-777777777707'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-007', 'Atraso entrega aço CA-50', 'material', 'removida', 'alta', 'b0000001-0000-0000-0000-000000000001'::uuid, 'João Silva', '2025-02-01', '2025-02-08', '2025-02-07', 'f0000003-0000-0000-0000-000000000003'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 5, 5000, 'Fornecedor alternativo acionado', 'b0000008-0000-0000-0000-000000000008'::uuid),
  
  ('77777777-7777-7777-7777-777777777708'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-008', 'Definição de acabamentos pelo cliente', 'projeto', 'identificada', 'baixa', 'b0000006-0000-0000-0000-000000000006'::uuid, 'Fernanda Oliveira', '2025-02-28', '2025-10-10', NULL, 'f0000012-0000-0000-0000-000000000012'::uuid, 'e0000005-0000-0000-0000-000000000005'::uuid, 0, 0, 'Reunião agendada com cliente', 'b0000006-0000-0000-0000-000000000006'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- RECURSOS (14 recursos: mão de obra, equipamentos, materiais)
-- ========================================
INSERT INTO recursos (id, empresa_id, codigo, nome, tipo, unidade, custo_hora, custo_uso, disponibilidade_diaria, calendario, ativo) VALUES
  ('88888888-8888-8888-8888-888888888801'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-001', 'Pedreiro', 'mao_de_obra', 'hora', 45.00, 0, 8, 'padrao', true),
  ('88888888-8888-8888-8888-888888888802'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-002', 'Armador', 'mao_de_obra', 'hora', 55.00, 0, 8, 'padrao', true),
  ('88888888-8888-8888-8888-888888888803'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-003', 'Carpinteiro', 'mao_de_obra', 'hora', 50.00, 0, 8, 'padrao', true),
  ('88888888-8888-8888-8888-888888888804'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-004', 'Eletricista', 'mao_de_obra', 'hora', 60.00, 0, 8, 'padrao', true),
  ('88888888-8888-8888-8888-888888888805'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-005', 'Encanador', 'mao_de_obra', 'hora', 55.00, 0, 8, 'padrao', true),
  ('88888888-8888-8888-8888-888888888806'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-006', 'Servente', 'mao_de_obra', 'hora', 25.00, 0, 8, 'padrao', true),
  ('88888888-8888-8888-8888-888888888807'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-007', 'Retroescavadeira', 'equipamento', 'hora', 180.00, 50, 8, 'padrao', true),
  ('88888888-8888-8888-8888-888888888808'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-008', 'Betoneira 400L', 'equipamento', 'hora', 35.00, 20, 8, 'padrao', true),
  ('88888888-8888-8888-8888-888888888809'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-009', 'Grua Torre 8t', 'equipamento', 'hora', 250.00, 100, 10, 'padrao', true),
  ('88888888-8888-8888-8888-888888888810'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-010', 'Vibrador de Concreto', 'equipamento', 'hora', 15.00, 5, 8, 'padrao', true),
  ('88888888-8888-8888-8888-888888888811'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-011', 'Concreto FCK 30', 'material', 'm3', 420.00, 0, 999, NULL, true),
  ('88888888-8888-8888-8888-888888888812'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-012', 'Aço CA-50', 'material', 'kg', 8.50, 0, 999, NULL, true),
  ('88888888-8888-8888-8888-888888888813'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-013', 'Bloco Cerâmico', 'material', 'un', 2.80, 0, 999, NULL, true),
  ('88888888-8888-8888-8888-888888888814'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-014', 'Forma Metálica', 'equipamento', 'm2', 12.00, 30, 500, 'padrao', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- DEPENDENCIAS DE ATIVIDADES (10 dependências)
-- ========================================
INSERT INTO dependencias_atividades (id, atividade_predecessora_id, atividade_sucessora_id, tipo, lag) VALUES
  ('99999999-9999-9999-9999-999999999901'::uuid, 'f0000001-0000-0000-0000-000000000001'::uuid, 'f0000002-0000-0000-0000-000000000002'::uuid, 'FS', 0),
  ('99999999-9999-9999-9999-999999999902'::uuid, 'f0000002-0000-0000-0000-000000000002'::uuid, 'f0000003-0000-0000-0000-000000000003'::uuid, 'SS', 5),
  ('99999999-9999-9999-9999-999999999903'::uuid, 'f0000003-0000-0000-0000-000000000003'::uuid, 'f0000004-0000-0000-0000-000000000004'::uuid, 'FS', 2),
  ('99999999-9999-9999-9999-999999999904'::uuid, 'f0000004-0000-0000-0000-000000000004'::uuid, 'f0000005-0000-0000-0000-000000000005'::uuid, 'FS', 0),
  ('99999999-9999-9999-9999-999999999905'::uuid, 'f0000005-0000-0000-0000-000000000005'::uuid, 'f0000006-0000-0000-0000-000000000006'::uuid, 'SS', 3),
  ('99999999-9999-9999-9999-999999999906'::uuid, 'f0000006-0000-0000-0000-000000000006'::uuid, 'f0000007-0000-0000-0000-000000000007'::uuid, 'FS', 0),
  ('99999999-9999-9999-9999-999999999907'::uuid, 'f0000007-0000-0000-0000-000000000007'::uuid, 'f0000008-0000-0000-0000-000000000008'::uuid, 'FS', 7),
  ('99999999-9999-9999-9999-999999999908'::uuid, 'f0000008-0000-0000-0000-000000000008'::uuid, 'f0000009-0000-0000-0000-000000000009'::uuid, 'SS', 0),
  ('99999999-9999-9999-9999-999999999909'::uuid, 'f0000008-0000-0000-0000-000000000008'::uuid, 'f0000010-0000-0000-0000-000000000010'::uuid, 'SS', 0),
  ('99999999-9999-9999-9999-999999999910'::uuid, 'f0000011-0000-0000-0000-000000000011'::uuid, 'f0000012-0000-0000-0000-000000000012'::uuid, 'FS', 0)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- RESOURCE ALLOCATIONS (18 alocações de recursos)
-- ========================================
INSERT INTO resource_allocations (id, recurso_id, atividade_id, quantidade, unidades_por_dia, data_inicio, data_fim, custo_total) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001'::uuid, '88888888-8888-8888-8888-888888888801'::uuid, 'f0000008-0000-0000-0000-000000000008'::uuid, 4, 8, '2025-04-01', '2025-04-30', 5760.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002'::uuid, '88888888-8888-8888-8888-888888888806'::uuid, 'f0000008-0000-0000-0000-000000000008'::uuid, 2, 8, '2025-04-01', '2025-04-30', 1600.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003'::uuid, '88888888-8888-8888-8888-888888888802'::uuid, 'f0000003-0000-0000-0000-000000000003'::uuid, 6, 8, '2025-02-03', '2025-02-20', 4752.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004'::uuid, '88888888-8888-8888-8888-888888888812'::uuid, 'f0000003-0000-0000-0000-000000000003'::uuid, 15000, 1, '2025-02-03', '2025-02-20', 127500.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005'::uuid, '88888888-8888-8888-8888-888888888807'::uuid, 'f0000002-0000-0000-0000-000000000002'::uuid, 1, 8, '2025-01-21', '2025-02-10', 28800.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa006'::uuid, '88888888-8888-8888-8888-888888888806'::uuid, 'f0000002-0000-0000-0000-000000000002'::uuid, 4, 8, '2025-01-21', '2025-02-10', 3200.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa007'::uuid, '88888888-8888-8888-8888-888888888808'::uuid, 'f0000004-0000-0000-0000-000000000004'::uuid, 2, 6, '2025-02-15', '2025-03-01', 2520.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa008'::uuid, '88888888-8888-8888-8888-888888888810'::uuid, 'f0000004-0000-0000-0000-000000000004'::uuid, 3, 6, '2025-02-15', '2025-03-01', 1890.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa009'::uuid, '88888888-8888-8888-8888-888888888811'::uuid, 'f0000004-0000-0000-0000-000000000004'::uuid, 250, 1, '2025-02-15', '2025-03-01', 105000.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa010'::uuid, '88888888-8888-8888-8888-888888888803'::uuid, 'f0000005-0000-0000-0000-000000000005'::uuid, 4, 8, '2025-03-01', '2025-03-10', 2880.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa011'::uuid, '88888888-8888-8888-8888-888888888814'::uuid, 'f0000005-0000-0000-0000-000000000005'::uuid, 200, 1, '2025-03-01', '2025-03-10', 2400.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa012'::uuid, '88888888-8888-8888-8888-888888888802'::uuid, 'f0000006-0000-0000-0000-000000000006'::uuid, 5, 8, '2025-03-08', '2025-03-18', 4400.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa013'::uuid, '88888888-8888-8888-8888-888888888809'::uuid, 'f0000006-0000-0000-0000-000000000006'::uuid, 1, 8, '2025-03-08', '2025-03-18', 20000.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa014'::uuid, '88888888-8888-8888-8888-888888888804'::uuid, 'f0000009-0000-0000-0000-000000000009'::uuid, 3, 8, '2025-05-01', '2025-05-20', 5760.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa015'::uuid, '88888888-8888-8888-8888-888888888805'::uuid, 'f0000010-0000-0000-0000-000000000010'::uuid, 2, 8, '2025-05-01', '2025-05-25', 4400.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa016'::uuid, '88888888-8888-8888-8888-888888888801'::uuid, 'f0000011-0000-0000-0000-000000000011'::uuid, 6, 8, '2025-06-01', '2025-07-15', 15840.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa017'::uuid, '88888888-8888-8888-8888-888888888801'::uuid, 'f0000012-0000-0000-0000-000000000012'::uuid, 4, 8, '2025-07-16', '2025-08-30', 12960.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa018'::uuid, '88888888-8888-8888-8888-888888888806'::uuid, 'f0000001-0000-0000-0000-000000000001'::uuid, 2, 8, '2025-01-15', '2025-01-20', 800.00)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- FIM DO SCRIPT
-- ========================================
