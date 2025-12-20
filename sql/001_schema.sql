-- VisionPlan Database Schema
-- Management Tables for Auditorias, Mudanças, Reuniões, Ishikawa, 5W2H

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Empresas (Companies/Tenants)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(20),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usuarios (Users)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  cargo VARCHAR(100),
  empresa_id UUID REFERENCES empresas(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- EPS (Enterprise Project Structure)
CREATE TABLE IF NOT EXISTS eps_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  parent_id UUID REFERENCES eps_nodes(id),
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projetos (Projects)
CREATE TABLE IF NOT EXISTS projetos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  descricao TEXT,
  eps_id UUID REFERENCES eps_nodes(id),
  empresa_id UUID REFERENCES empresas(id),
  status VARCHAR(50) DEFAULT 'em_andamento',
  data_inicio DATE,
  data_termino DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- WBS (Work Breakdown Structure)
CREATE TABLE IF NOT EXISTS wbs_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  parent_id UUID REFERENCES wbs_nodes(id),
  projeto_id UUID REFERENCES projetos(id),
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Atividades do Cronograma
CREATE TABLE IF NOT EXISTS atividades_cronograma (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  wbs_id UUID REFERENCES wbs_nodes(id),
  projeto_id UUID REFERENCES projetos(id),
  empresa_id UUID REFERENCES empresas(id),
  data_inicio DATE,
  data_termino DATE,
  duracao INTEGER,
  percentual_completo DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'nao_iniciada',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Checklist Templates
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  itens JSONB DEFAULT '[]'::jsonb,
  versao VARCHAR(20) DEFAULT '1.0',
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP,
  empresa_id UUID REFERENCES empresas(id),
  created_by UUID REFERENCES usuarios(id)
);

-- Auditorias
CREATE TABLE IF NOT EXISTS auditorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  checklist_id UUID REFERENCES checklist_templates(id),
  checklist_nome VARCHAR(255),
  projeto_id UUID REFERENCES projetos(id),
  projeto_nome VARCHAR(255),
  tipo VARCHAR(100),
  responsavel VARCHAR(255),
  responsavel_id UUID REFERENCES usuarios(id),
  data_auditoria DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'programada',
  itens JSONB DEFAULT '[]'::jsonb,
  percentual_conformidade DECIMAL(5,2),
  nao_conformidades INTEGER DEFAULT 0,
  acoes_geradas TEXT[],
  observacoes_gerais TEXT,
  data_criacao TIMESTAMP DEFAULT NOW(),
  atividade_gantt_id UUID REFERENCES atividades_cronograma(id),
  empresa_id UUID REFERENCES empresas(id),
  created_by UUID REFERENCES usuarios(id)
);

-- Solicitacoes de Mudanca
CREATE TABLE IF NOT EXISTS solicitacoes_mudanca (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  justificativa TEXT,
  tipo_mudanca VARCHAR(50) NOT NULL,
  prioridade VARCHAR(50) NOT NULL,
  solicitante VARCHAR(255) NOT NULL,
  solicitante_id UUID REFERENCES usuarios(id),
  data_solicitacao TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'submetida',
  projeto_id UUID REFERENCES projetos(id),
  projeto_nome VARCHAR(255),
  impacto_cronograma INTEGER,
  impacto_custo DECIMAL(15,2),
  impacto_qualidade VARCHAR(50),
  impacto_risco VARCHAR(50),
  recursos_necessarios TEXT,
  riscos TEXT[],
  impacto_estimado VARCHAR(50) DEFAULT 'medio',
  baseline_afetada VARCHAR(100),
  atividades_novas INTEGER,
  atividades_removidas INTEGER,
  aprovadores JSONB,
  aprovador VARCHAR(255),
  aprovador_id UUID REFERENCES usuarios(id),
  data_aprovacao TIMESTAMP,
  observacoes_aprovacao TEXT,
  anexos TEXT[],
  historico JSONB DEFAULT '[]'::jsonb,
  acoes_5w2h TEXT[],
  empresa_id UUID REFERENCES empresas(id),
  created_by UUID REFERENCES usuarios(id)
);

-- Reunioes
CREATE TABLE IF NOT EXISTS reunioes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  frequencia VARCHAR(50) DEFAULT 'semanal',
  participantes TEXT[] DEFAULT '{}',
  pauta_fixa TEXT[],
  proxima_data TIMESTAMP,
  hora_inicio VARCHAR(10),
  duracao INTEGER DEFAULT 60,
  local VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  empresa_id UUID REFERENCES empresas(id),
  projeto_id UUID REFERENCES projetos(id),
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pautas de Reuniao
CREATE TABLE IF NOT EXISTS pautas_reuniao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reuniao_id UUID REFERENCES reunioes(id),
  data TIMESTAMP NOT NULL,
  itens JSONB DEFAULT '[]'::jsonb,
  participantes_presentes TEXT[],
  observacoes TEXT,
  acoes_geradas TEXT[],
  empresa_id UUID REFERENCES empresas(id),
  created_by UUID REFERENCES usuarios(id)
);

-- Restricoes Ishikawa
CREATE TABLE IF NOT EXISTS restricoes_ishikawa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'no_prazo',
  atividade_id UUID REFERENCES atividades_cronograma(id),
  atividade_nome VARCHAR(255),
  wbs_id UUID REFERENCES wbs_nodes(id),
  wbs_nome VARCHAR(255),
  eps_id UUID REFERENCES eps_nodes(id),
  eps_nome VARCHAR(255),
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_prevista DATE NOT NULL,
  data_conclusao DATE,
  responsavel VARCHAR(255),
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
  codigo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  o_que TEXT NOT NULL,
  por_que TEXT,
  onde VARCHAR(255),
  quando DATE,
  quem VARCHAR(255),
  quem_id UUID REFERENCES usuarios(id),
  como TEXT,
  quanto DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'pendente',
  prioridade VARCHAR(50) DEFAULT 'media',
  percentual_completo DECIMAL(5,2) DEFAULT 0,
  data_conclusao DATE,
  origem_tipo VARCHAR(50),
  origem_id UUID,
  restricao_id UUID REFERENCES restricoes_ishikawa(id),
  auditoria_id UUID REFERENCES auditorias(id),
  empresa_id UUID REFERENCES empresas(id),
  projeto_id UUID REFERENCES projetos(id),
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Restricoes LPS (Last Planner System)
CREATE TABLE IF NOT EXISTS restricoes_lps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'identificada',
  atividade_id UUID REFERENCES atividades_cronograma(id),
  atividade_nome VARCHAR(255),
  responsavel VARCHAR(255),
  responsavel_id UUID REFERENCES usuarios(id),
  data_identificacao DATE DEFAULT CURRENT_DATE,
  data_necessaria DATE,
  data_prevista_remocao DATE,
  data_remocao DATE,
  empresa_id UUID REFERENCES empresas(id),
  projeto_id UUID REFERENCES projetos(id),
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklist_templates_empresa ON checklist_templates(empresa_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_empresa ON auditorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_projeto ON auditorias(projeto_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_mudanca_empresa ON solicitacoes_mudanca(empresa_id);
CREATE INDEX IF NOT EXISTS idx_reunioes_empresa ON reunioes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_restricoes_ishikawa_empresa ON restricoes_ishikawa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_acoes_5w2h_empresa ON acoes_5w2h(empresa_id);
CREATE INDEX IF NOT EXISTS idx_restricoes_lps_empresa ON restricoes_lps(empresa_id);
