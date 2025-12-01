-- ============================================================================
-- VisionPlan - Activity Codes Schema (Primavera P6 Style)
-- ============================================================================
-- This schema supports enterprise-level activity code management similar to 
-- Primavera P6, allowing multiple code types with hierarchical values.
-- ============================================================================

-- Activity Code Types Table
-- Defines the types of activity codes (e.g., Discipline, Area, Phase)
CREATE TABLE IF NOT EXISTS activity_code_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE, -- NULL for global codes
  eps_id UUID REFERENCES eps_nodes(id) ON DELETE CASCADE, -- NULL if not EPS-scoped
  
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(50),
  descricao TEXT,
  
  -- Scope: 'global' (company-wide), 'project', or 'eps'
  escopo VARCHAR(20) NOT NULL DEFAULT 'global' CHECK (escopo IN ('global', 'project', 'eps')),
  
  -- Configuration
  max_length INTEGER DEFAULT 20,
  is_secure BOOLEAN DEFAULT false, -- If true, only admins can modify
  obrigatorio BOOLEAN DEFAULT false, -- If true, required for all activities
  
  -- Display settings
  cor VARCHAR(7) DEFAULT '#3B82F6',
  icone VARCHAR(50),
  ordem INTEGER DEFAULT 0,
  
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id)
);

-- Activity Code Values Table
-- Stores the actual values for each code type
CREATE TABLE IF NOT EXISTS activity_code_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id UUID NOT NULL REFERENCES activity_code_types(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES activity_code_values(id) ON DELETE CASCADE, -- For hierarchical codes
  
  valor VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  -- Display settings
  cor VARCHAR(7),
  icone VARCHAR(50),
  ordem INTEGER DEFAULT 0,
  nivel INTEGER DEFAULT 0, -- Hierarchy level (0 = root)
  
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Task Codes (Junction Table)
-- Links activities to their assigned code values
CREATE TABLE IF NOT EXISTS activity_task_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES atividades(id) ON DELETE CASCADE, -- References atividades
  code_value_id UUID NOT NULL REFERENCES activity_code_values(id) ON DELETE CASCADE,
  
  -- Denormalized for performance
  type_id UUID NOT NULL REFERENCES activity_code_types(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE, -- Project context for RLS
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id),
  
  -- Ensure unique code type per activity
  UNIQUE(atividade_id, type_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_code_types_empresa ON activity_code_types(empresa_id);
CREATE INDEX IF NOT EXISTS idx_activity_code_types_projeto ON activity_code_types(projeto_id);
CREATE INDEX IF NOT EXISTS idx_activity_code_types_escopo ON activity_code_types(escopo);
CREATE INDEX IF NOT EXISTS idx_activity_code_values_type ON activity_code_values(type_id);
CREATE INDEX IF NOT EXISTS idx_activity_code_values_parent ON activity_code_values(parent_id);
CREATE INDEX IF NOT EXISTS idx_activity_task_codes_atividade ON activity_task_codes(atividade_id);
CREATE INDEX IF NOT EXISTS idx_activity_task_codes_value ON activity_task_codes(code_value_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE activity_code_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_code_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_task_codes ENABLE ROW LEVEL SECURITY;

-- Policy for activity_code_types
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
    AND perfil IN ('ADMIN', 'GERENTE')
  ));

CREATE POLICY "Admins can update activity code types"
  ON activity_code_types FOR UPDATE
  USING (empresa_id IN (
    SELECT empresa_id FROM usuarios 
    WHERE auth_id = auth.uid() 
    AND perfil IN ('ADMIN', 'GERENTE')
  ));

CREATE POLICY "Admins can delete activity code types"
  ON activity_code_types FOR DELETE
  USING (empresa_id IN (
    SELECT empresa_id FROM usuarios 
    WHERE auth_id = auth.uid() 
    AND perfil IN ('ADMIN', 'GERENTE')
  ) AND NOT is_secure);

-- Policy for activity_code_values
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
      AND perfil IN ('ADMIN', 'GERENTE')
    )
  ));

CREATE POLICY "Admins can update activity code values"
  ON activity_code_values FOR UPDATE
  USING (type_id IN (
    SELECT id FROM activity_code_types 
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() 
      AND perfil IN ('ADMIN', 'GERENTE')
    )
  ));

CREATE POLICY "Admins can delete activity code values"
  ON activity_code_values FOR DELETE
  USING (type_id IN (
    SELECT id FROM activity_code_types 
    WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE auth_id = auth.uid() 
      AND perfil IN ('ADMIN', 'GERENTE')
    ) AND NOT is_secure
  ));

-- Policy for activity_task_codes
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
    WHERE u.auth_id = auth.uid() AND u.perfil IN ('ADMIN', 'GERENTE')
  ));

-- ============================================================================
-- DEFAULT ACTIVITY CODE TYPES (Common P6 Patterns)
-- ============================================================================
-- Run this after initial setup to populate common code types:
-- 
-- INSERT INTO activity_code_types (empresa_id, nome, codigo, descricao, escopo, ordem) VALUES
--   ('<empresa_id>', 'Disciplina', 'DISC', 'Disciplina técnica (Civil, Mecânica, Elétrica)', 'global', 1),
--   ('<empresa_id>', 'Área', 'AREA', 'Área ou localização da obra', 'global', 2),
--   ('<empresa_id>', 'Fase', 'FASE', 'Fase do projeto', 'global', 3),
--   ('<empresa_id>', 'Responsável', 'RESP', 'Contratada/Equipe responsável', 'global', 4),
--   ('<empresa_id>', 'Tipo de Trabalho', 'TIPO', 'Tipo de serviço', 'global', 5);
--
-- Example discipline values:
-- INSERT INTO activity_code_values (type_id, valor, descricao, cor, ordem) VALUES
--   ('<type_id>', 'CIV', 'Civil', '#3B82F6', 1),
--   ('<type_id>', 'MEC', 'Mecânica', '#EF4444', 2),
--   ('<type_id>', 'ELE', 'Elétrica', '#F59E0B', 3),
--   ('<type_id>', 'INS', 'Instrumentação', '#10B981', 4),
--   ('<type_id>', 'TUB', 'Tubulação', '#8B5CF6', 5);
