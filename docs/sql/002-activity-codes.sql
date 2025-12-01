-- ============================================================================
-- VisionPlan P6 Features - Activity Codes Migration
-- PREREQUISITE: Run 001-base-schema.sql first!
-- Execute this script in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ACTIVITY CODE TYPES
-- Global and project-specific activity code definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_code_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  eps_id UUID REFERENCES eps_nodes(id) ON DELETE SET NULL,
  
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(20),
  descricao TEXT,
  escopo VARCHAR(20) NOT NULL DEFAULT 'global' CHECK (escopo IN ('global', 'project', 'eps')),
  max_length INTEGER DEFAULT 20,
  is_secure BOOLEAN DEFAULT FALSE,
  obrigatorio BOOLEAN DEFAULT FALSE,
  cor VARCHAR(20) DEFAULT '#3B82F6',
  icone VARCHAR(50),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id),
  
  UNIQUE(empresa_id, nome)
);

-- ============================================================================
-- ACTIVITY CODE VALUES
-- Hierarchical values for each activity code type
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_code_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id UUID NOT NULL REFERENCES activity_code_types(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES activity_code_values(id) ON DELETE CASCADE,
  
  valor VARCHAR(50) NOT NULL,
  descricao TEXT,
  cor VARCHAR(20),
  icone VARCHAR(50),
  ordem INTEGER DEFAULT 0,
  nivel INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(type_id, valor)
);

-- ============================================================================
-- ACTIVITY TASK CODES (Junction Table)
-- Links activities to their assigned code values
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_task_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  code_value_id UUID NOT NULL REFERENCES activity_code_values(id) ON DELETE CASCADE,
  type_id UUID NOT NULL REFERENCES activity_code_types(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id),
  
  UNIQUE(atividade_id, type_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_code_types_empresa ON activity_code_types(empresa_id);
CREATE INDEX IF NOT EXISTS idx_activity_code_types_projeto ON activity_code_types(projeto_id);
CREATE INDEX IF NOT EXISTS idx_activity_code_values_type ON activity_code_values(type_id);
CREATE INDEX IF NOT EXISTS idx_activity_code_values_parent ON activity_code_values(parent_id);
CREATE INDEX IF NOT EXISTS idx_activity_task_codes_atividade ON activity_task_codes(atividade_id);
CREATE INDEX IF NOT EXISTS idx_activity_task_codes_projeto ON activity_task_codes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_activity_task_codes_value ON activity_task_codes(code_value_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE activity_code_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_code_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_task_codes ENABLE ROW LEVEL SECURITY;

-- Activity Code Types Policies
CREATE POLICY "Users can view activity code types from their company"
  ON activity_code_types FOR SELECT
  USING (empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Admins can insert activity code types"
  ON activity_code_types FOR INSERT
  WITH CHECK (empresa_id IN (
    SELECT empresa_id FROM usuarios 
    WHERE auth_id = auth.uid() 
    AND perfil IN ('ADMIN', 'DIRETOR', 'GERENTE_PROJETO')
  ));

CREATE POLICY "Admins can update activity code types"
  ON activity_code_types FOR UPDATE
  USING (empresa_id IN (
    SELECT empresa_id FROM usuarios 
    WHERE auth_id = auth.uid() 
    AND perfil IN ('ADMIN', 'DIRETOR', 'GERENTE_PROJETO')
  ));

CREATE POLICY "Admins can delete activity code types"
  ON activity_code_types FOR DELETE
  USING (empresa_id IN (
    SELECT empresa_id FROM usuarios 
    WHERE auth_id = auth.uid() 
    AND perfil IN ('ADMIN', 'DIRETOR')
  ) AND NOT is_secure);

-- Activity Code Values Policies
CREATE POLICY "Users can view activity code values"
  ON activity_code_values FOR SELECT
  USING (type_id IN (
    SELECT id FROM activity_code_types 
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  ));

CREATE POLICY "Admins can insert activity code values"
  ON activity_code_values FOR INSERT
  WITH CHECK (type_id IN (
    SELECT id FROM activity_code_types 
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() 
      AND perfil IN ('ADMIN', 'DIRETOR', 'GERENTE_PROJETO')
    )
  ));

CREATE POLICY "Admins can update activity code values"
  ON activity_code_values FOR UPDATE
  USING (type_id IN (
    SELECT id FROM activity_code_types 
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() 
      AND perfil IN ('ADMIN', 'DIRETOR', 'GERENTE_PROJETO')
    )
  ));

CREATE POLICY "Admins can delete activity code values"
  ON activity_code_values FOR DELETE
  USING (type_id IN (
    SELECT id FROM activity_code_types 
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() 
      AND perfil IN ('ADMIN', 'DIRETOR')
    )
  ));

-- Activity Task Codes Policies
CREATE POLICY "Users can view activity task codes from their projects"
  ON activity_task_codes FOR SELECT
  USING (projeto_id IN (
    SELECT p.id FROM projetos p
    JOIN usuarios u ON u.empresa_id = p.empresa_id
    WHERE u.auth_id = auth.uid()
  ));

CREATE POLICY "Project members can insert task codes"
  ON activity_task_codes FOR INSERT
  WITH CHECK (projeto_id IN (
    SELECT p.id FROM projetos p
    JOIN usuarios u ON u.empresa_id = p.empresa_id
    WHERE u.auth_id = auth.uid()
  ));

CREATE POLICY "Project members can update task codes"
  ON activity_task_codes FOR UPDATE
  USING (projeto_id IN (
    SELECT p.id FROM projetos p
    JOIN usuarios u ON u.empresa_id = p.empresa_id
    WHERE u.auth_id = auth.uid()
  ));

CREATE POLICY "Admins can delete task codes"
  ON activity_task_codes FOR DELETE
  USING (projeto_id IN (
    SELECT p.id FROM projetos p
    JOIN usuarios u ON u.empresa_id = p.empresa_id
    WHERE u.auth_id = auth.uid() AND u.perfil IN ('ADMIN', 'DIRETOR', 'GERENTE_PROJETO')
  ));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_activity_code_types_updated_at
    BEFORE UPDATE ON activity_code_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_code_values_updated_at
    BEFORE UPDATE ON activity_code_values
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEFAULT DATA (Optional - Run after creating empresa)
-- ============================================================================

-- To create default activity code types for a company, run:
-- SELECT create_default_activity_codes('YOUR_EMPRESA_ID_HERE');

CREATE OR REPLACE FUNCTION create_default_activity_codes(p_empresa_id UUID)
RETURNS void AS $$
DECLARE
  v_tipo_disciplina UUID;
  v_tipo_area UUID;
  v_tipo_fase UUID;
BEGIN
  -- Disciplina
  INSERT INTO activity_code_types (empresa_id, nome, codigo, descricao, escopo, max_length, ordem)
  VALUES (p_empresa_id, 'Disciplina', 'DISC', 'Disciplina técnica da atividade', 'global', 10, 1)
  RETURNING id INTO v_tipo_disciplina;
  
  INSERT INTO activity_code_values (type_id, valor, descricao, cor, ordem) VALUES
    (v_tipo_disciplina, 'CIV', 'Civil', '#3B82F6', 1),
    (v_tipo_disciplina, 'MEC', 'Mecânica', '#10B981', 2),
    (v_tipo_disciplina, 'ELE', 'Elétrica', '#F59E0B', 3),
    (v_tipo_disciplina, 'INS', 'Instrumentação', '#8B5CF6', 4),
    (v_tipo_disciplina, 'TUB', 'Tubulação', '#EC4899', 5);

  -- Área
  INSERT INTO activity_code_types (empresa_id, nome, codigo, descricao, escopo, max_length, ordem)
  VALUES (p_empresa_id, 'Área', 'AREA', 'Área física do projeto', 'global', 15, 2)
  RETURNING id INTO v_tipo_area;
  
  INSERT INTO activity_code_values (type_id, valor, descricao, cor, ordem) VALUES
    (v_tipo_area, 'PROC', 'Área de Processo', '#3B82F6', 1),
    (v_tipo_area, 'UTIL', 'Utilidades', '#10B981', 2),
    (v_tipo_area, 'ADM', 'Administrativa', '#F59E0B', 3),
    (v_tipo_area, 'EXT', 'Externa', '#6B7280', 4);

  -- Fase
  INSERT INTO activity_code_types (empresa_id, nome, codigo, descricao, escopo, max_length, ordem)
  VALUES (p_empresa_id, 'Fase', 'FASE', 'Fase do projeto', 'global', 20, 3)
  RETURNING id INTO v_tipo_fase;
  
  INSERT INTO activity_code_values (type_id, valor, descricao, cor, ordem) VALUES
    (v_tipo_fase, 'PLAN', 'Planejamento', '#DBEAFE', 1),
    (v_tipo_fase, 'ENG', 'Engenharia', '#E0E7FF', 2),
    (v_tipo_fase, 'SUPR', 'Suprimentos', '#FEF3C7', 3),
    (v_tipo_fase, 'CONS', 'Construção', '#D1FAE5', 4),
    (v_tipo_fase, 'COM', 'Comissionamento', '#FCE7F3', 5);
    
  RAISE NOTICE 'Default activity codes created for empresa %', p_empresa_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'activity%';

-- Check policies:
-- SELECT policyname, tablename FROM pg_policies WHERE tablename LIKE 'activity%';
