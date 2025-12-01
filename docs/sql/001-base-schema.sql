-- ============================================================================
-- VisionPlan - Base Schema Migration
-- Execute this script FIRST in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- EMPRESAS (Companies)
-- ============================================================================

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

-- ============================================================================
-- USUARIOS (Users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  camada_governanca VARCHAR(50) DEFAULT 'CONTRATADA',
  perfil VARCHAR(50) DEFAULT 'COLABORADOR',
  avatar_url TEXT,
  telefone VARCHAR(20),
  cargo VARCHAR(100),
  ativo BOOLEAN DEFAULT TRUE,
  ultimo_acesso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROJETOS (Projects)
-- ============================================================================

CREATE TABLE IF NOT EXISTS projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  descricao TEXT,
  status VARCHAR(50) DEFAULT 'PLANEJAMENTO',
  data_inicio DATE,
  data_fim_prevista DATE,
  data_fim_real DATE,
  orcamento_total DECIMAL(15,2),
  custo_atual DECIMAL(15,2) DEFAULT 0,
  progresso INTEGER DEFAULT 0,
  gerente_id UUID REFERENCES usuarios(id),
  eps_id UUID,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EPS NODES (Enterprise Project Structure)
-- ============================================================================

CREATE TABLE IF NOT EXISTS eps_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES eps_nodes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  descricao TEXT,
  nivel INTEGER DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  responsavel_id UUID REFERENCES usuarios(id),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from projetos to eps_nodes
ALTER TABLE projetos 
  ADD CONSTRAINT fk_projetos_eps 
  FOREIGN KEY (eps_id) REFERENCES eps_nodes(id) ON DELETE SET NULL;

-- ============================================================================
-- OBS NODES (Organizational Breakdown Structure)
-- ============================================================================

CREATE TABLE IF NOT EXISTS obs_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES obs_nodes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  descricao TEXT,
  nivel INTEGER DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  responsavel_id UUID REFERENCES usuarios(id),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ATIVIDADES (Activities/Tasks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES atividades(id) ON DELETE SET NULL,
  nome VARCHAR(500) NOT NULL,
  codigo VARCHAR(50),
  wbs VARCHAR(100),
  descricao TEXT,
  tipo VARCHAR(50) DEFAULT 'Tarefa',
  status VARCHAR(50) DEFAULT 'NAO_INICIADA',
  data_inicio DATE,
  data_fim DATE,
  data_inicio_real DATE,
  data_fim_real DATE,
  duracao INTEGER DEFAULT 1,
  duracao_real INTEGER,
  progresso INTEGER DEFAULT 0,
  custo_planejado DECIMAL(15,2) DEFAULT 0,
  custo_real DECIMAL(15,2) DEFAULT 0,
  trabalho_planejado DECIMAL(10,2) DEFAULT 0,
  trabalho_real DECIMAL(10,2) DEFAULT 0,
  prioridade VARCHAR(20) DEFAULT 'MEDIA',
  restricao_tipo VARCHAR(50),
  restricao_data DATE,
  e_critica BOOLEAN DEFAULT FALSE,
  folga_total INTEGER DEFAULT 0,
  folga_livre INTEGER DEFAULT 0,
  nivel INTEGER DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  calendario_id UUID,
  responsavel_id UUID REFERENCES usuarios(id),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DEPENDENCIAS (Dependencies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dependencias_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  atividade_origem_id UUID NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  atividade_destino_id UUID NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  tipo VARCHAR(10) DEFAULT 'FS',
  lag_dias INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(atividade_origem_id, atividade_destino_id)
);

-- ============================================================================
-- RECURSOS (Resources)
-- ============================================================================

CREATE TABLE IF NOT EXISTS recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  tipo VARCHAR(50) DEFAULT 'TRABALHO',
  unidade VARCHAR(20) DEFAULT 'h',
  custo_padrao DECIMAL(10,2) DEFAULT 0,
  custo_hora_extra DECIMAL(10,2) DEFAULT 0,
  capacidade_maxima DECIMAL(10,2) DEFAULT 8,
  email VARCHAR(255),
  calendario_id UUID,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ALOCACOES DE RECURSOS (Resource Allocations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS alocacoes_recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE CASCADE,
  unidades DECIMAL(5,2) DEFAULT 1,
  trabalho_planejado DECIMAL(10,2) DEFAULT 0,
  trabalho_real DECIMAL(10,2) DEFAULT 0,
  custo_planejado DECIMAL(15,2) DEFAULT 0,
  custo_real DECIMAL(15,2) DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(atividade_id, recurso_id)
);

-- ============================================================================
-- CALENDARIOS (Calendars)
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  descricao TEXT,
  tipo VARCHAR(50) DEFAULT 'PADRAO',
  horas_dia DECIMAL(4,2) DEFAULT 8,
  dias_semana INTEGER[] DEFAULT '{1,2,3,4,5}',
  is_default BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EXCECOES DE CALENDARIO (Calendar Exceptions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS excecoes_calendario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendario_id UUID NOT NULL REFERENCES calendarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  tipo VARCHAR(50) DEFAULT 'NAO_TRABALHO',
  horas_trabalho DECIMAL(4,2) DEFAULT 0,
  recorrente BOOLEAN DEFAULT FALSE,
  recorrencia_tipo VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BASELINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) DEFAULT 'ORIGINAL',
  data_baseline TIMESTAMPTZ DEFAULT NOW(),
  data_inicio_projeto DATE,
  data_fim_projeto DATE,
  duracao_total_dias INTEGER,
  total_atividades INTEGER,
  custo_total_planejado DECIMAL(15,2),
  is_atual BOOLEAN DEFAULT FALSE,
  aprovado BOOLEAN DEFAULT FALSE,
  aprovado_por UUID REFERENCES usuarios(id),
  aprovado_em TIMESTAMPTZ,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(projeto_id, numero)
);

-- ============================================================================
-- BASELINE TASKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS baseline_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_id UUID NOT NULL REFERENCES baselines(id) ON DELETE CASCADE,
  atividade_id UUID NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  nome VARCHAR(500) NOT NULL,
  codigo VARCHAR(50),
  wbs VARCHAR(100),
  data_inicio_planejada DATE,
  data_fim_planejada DATE,
  duracao_planejada INTEGER,
  progresso_planejado INTEGER DEFAULT 0,
  status VARCHAR(50),
  custo_planejado DECIMAL(15,2) DEFAULT 0,
  trabalho_planejado DECIMAL(10,2) DEFAULT 0,
  e_critica BOOLEAN DEFAULT FALSE,
  folga_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(baseline_id, atividade_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_auth ON usuarios(auth_id);
CREATE INDEX IF NOT EXISTS idx_projetos_empresa ON projetos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_atividades_projeto ON atividades(projeto_id);
CREATE INDEX IF NOT EXISTS idx_atividades_parent ON atividades(parent_id);
CREATE INDEX IF NOT EXISTS idx_dependencias_projeto ON dependencias_atividades(projeto_id);
CREATE INDEX IF NOT EXISTS idx_dependencias_origem ON dependencias_atividades(atividade_origem_id);
CREATE INDEX IF NOT EXISTS idx_dependencias_destino ON dependencias_atividades(atividade_destino_id);
CREATE INDEX IF NOT EXISTS idx_recursos_empresa ON recursos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alocacoes_atividade ON alocacoes_recursos(atividade_id);
CREATE INDEX IF NOT EXISTS idx_alocacoes_recurso ON alocacoes_recursos(recurso_id);
CREATE INDEX IF NOT EXISTS idx_calendarios_empresa ON calendarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_baselines_projeto ON baselines(projeto_id);
CREATE INDEX IF NOT EXISTS idx_baseline_tasks_baseline ON baseline_tasks(baseline_id);
CREATE INDEX IF NOT EXISTS idx_eps_empresa ON eps_nodes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_eps_parent ON eps_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_obs_empresa ON obs_nodes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_obs_parent ON obs_nodes(parent_id);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
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
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependencias_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE alocacoes_recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE excecoes_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE eps_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE obs_nodes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - EMPRESAS
-- ============================================================================

CREATE POLICY "Users can view their own company" ON empresas
  FOR SELECT USING (
    id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admins can update their company" ON empresas
  FOR UPDATE USING (
    id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() AND perfil = 'ADMIN'
    )
  );

-- ============================================================================
-- RLS POLICIES - USUARIOS
-- ============================================================================

CREATE POLICY "Users can view users from their company" ON usuarios
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can update their own profile" ON usuarios
  FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "Admins can manage users" ON usuarios
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() AND perfil = 'ADMIN'
    )
  );

-- ============================================================================
-- RLS POLICIES - PROJETOS
-- ============================================================================

CREATE POLICY "Users can view projects from their company" ON projetos
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
  );

CREATE POLICY "Project managers can modify projects" ON projetos
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() 
      AND perfil IN ('ADMIN', 'DIRETOR', 'GERENTE_PROJETO')
    )
  );

-- ============================================================================
-- RLS POLICIES - ATIVIDADES
-- ============================================================================

CREATE POLICY "Users can view activities from their projects" ON atividades
  FOR SELECT USING (
    projeto_id IN (
      SELECT p.id FROM projetos p
      JOIN usuarios u ON u.empresa_id = p.empresa_id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify activities" ON atividades
  FOR ALL USING (
    projeto_id IN (
      SELECT p.id FROM projetos p
      JOIN usuarios u ON u.empresa_id = p.empresa_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES - DEPENDENCIAS
-- ============================================================================

CREATE POLICY "Users can view dependencies" ON dependencias_atividades
  FOR SELECT USING (
    projeto_id IN (
      SELECT p.id FROM projetos p
      JOIN usuarios u ON u.empresa_id = p.empresa_id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify dependencies" ON dependencias_atividades
  FOR ALL USING (
    projeto_id IN (
      SELECT p.id FROM projetos p
      JOIN usuarios u ON u.empresa_id = p.empresa_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES - RECURSOS
-- ============================================================================

CREATE POLICY "Users can view resources from their company" ON recursos
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admins can manage resources" ON recursos
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() 
      AND perfil IN ('ADMIN', 'DIRETOR', 'GERENTE_PROJETO')
    )
  );

-- ============================================================================
-- RLS POLICIES - ALOCACOES
-- ============================================================================

CREATE POLICY "Users can view allocations" ON alocacoes_recursos
  FOR SELECT USING (
    atividade_id IN (
      SELECT a.id FROM atividades a
      JOIN projetos p ON p.id = a.projeto_id
      JOIN usuarios u ON u.empresa_id = p.empresa_id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify allocations" ON alocacoes_recursos
  FOR ALL USING (
    atividade_id IN (
      SELECT a.id FROM atividades a
      JOIN projetos p ON p.id = a.projeto_id
      JOIN usuarios u ON u.empresa_id = p.empresa_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES - CALENDARIOS
-- ============================================================================

CREATE POLICY "Users can view calendars" ON calendarios
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admins can manage calendars" ON calendarios
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() 
      AND perfil IN ('ADMIN', 'DIRETOR')
    )
  );

-- ============================================================================
-- RLS POLICIES - BASELINES
-- ============================================================================

CREATE POLICY "Users can view baselines" ON baselines
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
  );

CREATE POLICY "Project managers can manage baselines" ON baselines
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() 
      AND perfil IN ('ADMIN', 'DIRETOR', 'GERENTE_PROJETO')
    )
  );

-- ============================================================================
-- RLS POLICIES - BASELINE TASKS
-- ============================================================================

CREATE POLICY "Users can view baseline tasks" ON baseline_tasks
  FOR SELECT USING (
    baseline_id IN (
      SELECT b.id FROM baselines b
      JOIN usuarios u ON u.empresa_id = b.empresa_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES - EPS/OBS
-- ============================================================================

CREATE POLICY "Users can view EPS nodes" ON eps_nodes
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admins can manage EPS nodes" ON eps_nodes
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() 
      AND perfil IN ('ADMIN', 'DIRETOR')
    )
  );

CREATE POLICY "Users can view OBS nodes" ON obs_nodes
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admins can manage OBS nodes" ON obs_nodes
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() 
      AND perfil IN ('ADMIN', 'DIRETOR')
    )
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'VisionPlan base schema created successfully!';
  RAISE NOTICE 'Next: Run 002-activity-codes.sql for Activity Codes feature';
END $$;
