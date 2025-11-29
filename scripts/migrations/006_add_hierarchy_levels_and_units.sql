-- Migration: Add Hierarchy Levels and Organizational Units
-- Version: 006
-- Date: 2024-11-29
-- Description: Adds configurable hierarchy levels and organizational units for org chart visualization

-- ============================================
-- 1. HIERARCHY LEVELS (Níveis Hierárquicos)
-- ============================================
-- Configurable hierarchy levels per company (e.g., Diretoria, Gerência, Coordenação, etc.)

CREATE TABLE IF NOT EXISTS hierarchy_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(50),
    descricao TEXT,
    nivel_ordem INTEGER NOT NULL DEFAULT 0, -- Order in hierarchy (0 = top, higher = lower)
    cor VARCHAR(20) DEFAULT '#3B82F6', -- Color for org chart visualization
    icone VARCHAR(50), -- Optional icon identifier
    is_default BOOLEAN DEFAULT FALSE, -- If created by system as default
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_hierarchy_level_per_empresa UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_hierarchy_levels_empresa ON hierarchy_levels(empresa_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_levels_ordem ON hierarchy_levels(empresa_id, nivel_ordem);

-- ============================================
-- 2. ORGANIZATIONAL UNITS (Unidades/Setores)
-- ============================================
-- Organizational units/departments per company (e.g., Comercial, Logística, RH, etc.)

CREATE TABLE IF NOT EXISTS organizational_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    codigo VARCHAR(50),
    descricao TEXT,
    sigla VARCHAR(20), -- Short abbreviation (e.g., "RH", "TI", "LOG")
    tipo VARCHAR(50) DEFAULT 'departamento', -- departamento, unidade, setor, area
    ordem INTEGER NOT NULL DEFAULT 0,
    cor VARCHAR(20) DEFAULT '#6366F1', -- Color for org chart visualization
    responsavel_id UUID REFERENCES usuarios(id), -- Optional unit head
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_org_unit_code_per_empresa UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_org_units_empresa ON organizational_units(empresa_id);
CREATE INDEX IF NOT EXISTS idx_org_units_parent ON organizational_units(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_units_responsavel ON organizational_units(responsavel_id);

-- ============================================
-- 3. UPDATE OBS_NODES to reference hierarchy and units
-- ============================================

-- Add hierarchy_level_id column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'obs_nodes' AND column_name = 'hierarchy_level_id'
    ) THEN
        ALTER TABLE obs_nodes ADD COLUMN hierarchy_level_id UUID REFERENCES hierarchy_levels(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add organizational_unit_id column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'obs_nodes' AND column_name = 'organizational_unit_id'
    ) THEN
        ALTER TABLE obs_nodes ADD COLUMN organizational_unit_id UUID REFERENCES organizational_units(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add tipo_cargo column to indicate if it's a position, department, etc.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'obs_nodes' AND column_name = 'tipo_cargo'
    ) THEN
        ALTER TABLE obs_nodes ADD COLUMN tipo_cargo VARCHAR(50) DEFAULT 'cargo'; -- cargo, staff, assessoria
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_obs_nodes_hierarchy ON obs_nodes(hierarchy_level_id);
CREATE INDEX IF NOT EXISTS idx_obs_nodes_unit ON obs_nodes(organizational_unit_id);

-- ============================================
-- 4. RLS POLICIES (Multi-tenant isolation by empresa_id)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE hierarchy_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizational_units ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin of a company
CREATE OR REPLACE FUNCTION is_company_admin(p_empresa_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios u
        WHERE u.id = auth.uid()
        AND u.empresa_id = p_empresa_id
        AND (u.perfil_acesso = 'ADMIN' OR u.perfil_acesso = 'DIRETOR')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user belongs to a company
CREATE OR REPLACE FUNCTION belongs_to_company(p_empresa_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios u
        WHERE u.id = auth.uid()
        AND u.empresa_id = p_empresa_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hierarchy Levels policies (tenant-isolated)
DROP POLICY IF EXISTS "hierarchy_levels_select_policy" ON hierarchy_levels;
CREATE POLICY "hierarchy_levels_select_policy" ON hierarchy_levels
    FOR SELECT USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "hierarchy_levels_insert_policy" ON hierarchy_levels;
CREATE POLICY "hierarchy_levels_insert_policy" ON hierarchy_levels
    FOR INSERT WITH CHECK (is_company_admin(empresa_id));

DROP POLICY IF EXISTS "hierarchy_levels_update_policy" ON hierarchy_levels;
CREATE POLICY "hierarchy_levels_update_policy" ON hierarchy_levels
    FOR UPDATE USING (is_company_admin(empresa_id));

DROP POLICY IF EXISTS "hierarchy_levels_delete_policy" ON hierarchy_levels;
CREATE POLICY "hierarchy_levels_delete_policy" ON hierarchy_levels
    FOR DELETE USING (is_company_admin(empresa_id));

-- Organizational Units policies (tenant-isolated)
DROP POLICY IF EXISTS "org_units_select_policy" ON organizational_units;
CREATE POLICY "org_units_select_policy" ON organizational_units
    FOR SELECT USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "org_units_insert_policy" ON organizational_units;
CREATE POLICY "org_units_insert_policy" ON organizational_units
    FOR INSERT WITH CHECK (is_company_admin(empresa_id));

DROP POLICY IF EXISTS "org_units_update_policy" ON organizational_units;
CREATE POLICY "org_units_update_policy" ON organizational_units
    FOR UPDATE USING (is_company_admin(empresa_id));

DROP POLICY IF EXISTS "org_units_delete_policy" ON organizational_units;
CREATE POLICY "org_units_delete_policy" ON organizational_units
    FOR DELETE USING (is_company_admin(empresa_id));

-- ============================================
-- 5. FUNCTION TO CREATE DEFAULT HIERARCHY LEVELS
-- ============================================

CREATE OR REPLACE FUNCTION create_default_hierarchy_levels(p_empresa_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO hierarchy_levels (empresa_id, nome, codigo, descricao, nivel_ordem, cor, is_default)
    VALUES 
        (p_empresa_id, 'Diretoria', 'DIR', 'Nível de Diretoria Geral', 0, '#1E40AF', true),
        (p_empresa_id, 'Gerência', 'GER', 'Nível de Gerência', 1, '#3B82F6', true),
        (p_empresa_id, 'Coordenação', 'COORD', 'Nível de Coordenação', 2, '#60A5FA', true),
        (p_empresa_id, 'Supervisão', 'SUP', 'Nível de Supervisão', 3, '#93C5FD', true),
        (p_empresa_id, 'Encarregado', 'ENC', 'Nível de Encarregado', 4, '#10B981', true),
        (p_empresa_id, 'Operacional', 'OPE', 'Nível Operacional/Execução', 5, '#6EE7B7', true)
    ON CONFLICT (empresa_id, codigo) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. TRIGGER TO CREATE DEFAULT HIERARCHY LEVELS ON NEW EMPRESA
-- ============================================

CREATE OR REPLACE FUNCTION trigger_create_default_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_hierarchy_levels(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_empresa_created_create_hierarchy ON empresas;
CREATE TRIGGER on_empresa_created_create_hierarchy
    AFTER INSERT ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_default_hierarchy();

-- ============================================
-- 7. CREATE DEFAULT HIERARCHY FOR EXISTING COMPANIES
-- ============================================
-- This will create default hierarchy levels for all existing companies

DO $$
DECLARE
    empresa_record RECORD;
BEGIN
    FOR empresa_record IN SELECT id FROM empresas WHERE ativo = true LOOP
        PERFORM create_default_hierarchy_levels(empresa_record.id);
    END LOOP;
END $$;

-- ============================================
-- 8. UPDATE TIMESTAMP TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hierarchy_levels_updated_at ON hierarchy_levels;
CREATE TRIGGER update_hierarchy_levels_updated_at
    BEFORE UPDATE ON hierarchy_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_units_updated_at ON organizational_units;
CREATE TRIGGER update_org_units_updated_at
    BEFORE UPDATE ON organizational_units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
