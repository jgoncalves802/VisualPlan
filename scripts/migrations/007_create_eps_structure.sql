-- Migration: Create Enterprise Project Structure (EPS) System
-- Version: 007
-- Date: 2024-11-29
-- Description: Implements EPS following Primavera P6 model with Responsible Manager concept
-- The EPS and OBS are linked via Responsible Manager field, which controls project visibility
-- 
-- DEPENDENCY: This migration requires migration 006 to be executed first
-- (creates belongs_to_company and is_company_admin helper functions)

-- ============================================
-- 0. ENSURE HELPER FUNCTIONS EXIST
-- ============================================
-- These functions should already exist from migration 006, but we create them
-- if they don't to ensure this migration can run independently

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

-- ============================================
-- 1. EPS NODES (Enterprise Project Structure)
-- ============================================
-- Hierarchical structure representing how projects are organized
-- Similar to Primavera P6 EPS - folders/nodes containing projects

CREATE TABLE IF NOT EXISTS eps_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES eps_nodes(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    -- Responsible Manager links EPS to OBS (Primavera P6 concept)
    -- Users assigned to this OBS node can see projects under this EPS node
    responsible_manager_id UUID REFERENCES obs_nodes(id) ON DELETE SET NULL,
    nivel INTEGER NOT NULL DEFAULT 0, -- Level in hierarchy (0 = root)
    ordem INTEGER NOT NULL DEFAULT 0, -- Order within same level
    cor VARCHAR(20) DEFAULT '#3B82F6',
    icone VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    
    CONSTRAINT unique_eps_code_per_empresa UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_eps_nodes_empresa ON eps_nodes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_eps_nodes_parent ON eps_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_eps_nodes_responsible ON eps_nodes(responsible_manager_id);
CREATE INDEX IF NOT EXISTS idx_eps_nodes_nivel ON eps_nodes(empresa_id, nivel);

-- ============================================
-- 2. EPS CREATORS (Permission to Create EPS)
-- ============================================
-- Only ADMIN can assign users as EPS creators
-- Users with this permission can create/edit/delete EPS nodes

CREATE TABLE IF NOT EXISTS eps_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    can_create BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT TRUE,
    can_delete BOOLEAN DEFAULT TRUE,
    can_assign_responsible BOOLEAN DEFAULT TRUE, -- Can assign Responsible Manager to EPS
    created_by UUID REFERENCES usuarios(id), -- Must be ADMIN
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_eps_creator_per_empresa UNIQUE (empresa_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_eps_creators_empresa ON eps_creators(empresa_id);
CREATE INDEX IF NOT EXISTS idx_eps_creators_usuario ON eps_creators(usuario_id);

-- ============================================
-- 3. USER OBS ASSIGNMENTS (Responsible Manager Assignment)
-- ============================================
-- Links users to OBS nodes - determines which EPS/Projects they can see
-- A user MUST have an OBS assignment linked to an EPS to see any projects

CREATE TABLE IF NOT EXISTS usuario_obs_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    obs_node_id UUID NOT NULL REFERENCES obs_nodes(id) ON DELETE CASCADE,
    -- Project profile for this assignment (controls permissions level)
    profile_id UUID REFERENCES access_profiles(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT FALSE, -- Primary responsible manager assignment
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_obs_assignment UNIQUE (empresa_id, usuario_id, obs_node_id)
);

CREATE INDEX IF NOT EXISTS idx_user_obs_empresa ON usuario_obs_assignments(empresa_id);
CREATE INDEX IF NOT EXISTS idx_user_obs_usuario ON usuario_obs_assignments(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_obs_node ON usuario_obs_assignments(obs_node_id);

-- ============================================
-- 4. RLS POLICIES (Multi-tenant isolation)
-- ============================================

ALTER TABLE eps_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eps_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_obs_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4.1 EPS NODES POLICIES
-- ============================================

-- SELECT: Users can see EPS nodes of their company
DROP POLICY IF EXISTS "eps_nodes_select_policy" ON eps_nodes;
CREATE POLICY "eps_nodes_select_policy" ON eps_nodes
    FOR SELECT USING (belongs_to_company(empresa_id));

-- INSERT: Only EPS creators or ADMIN can create
DROP POLICY IF EXISTS "eps_nodes_insert_policy" ON eps_nodes;
CREATE POLICY "eps_nodes_insert_policy" ON eps_nodes
    FOR INSERT WITH CHECK (
        is_company_admin(empresa_id) OR 
        EXISTS (
            SELECT 1 FROM eps_creators ec 
            WHERE ec.usuario_id = auth.uid() 
            AND ec.empresa_id = eps_nodes.empresa_id
            AND ec.can_create = true
        )
    );

-- UPDATE: Only EPS creators with edit permission or ADMIN
DROP POLICY IF EXISTS "eps_nodes_update_policy" ON eps_nodes;
CREATE POLICY "eps_nodes_update_policy" ON eps_nodes
    FOR UPDATE USING (
        is_company_admin(empresa_id) OR 
        EXISTS (
            SELECT 1 FROM eps_creators ec 
            WHERE ec.usuario_id = auth.uid() 
            AND ec.empresa_id = eps_nodes.empresa_id
            AND ec.can_edit = true
        )
    );

-- DELETE: Only EPS creators with delete permission or ADMIN
DROP POLICY IF EXISTS "eps_nodes_delete_policy" ON eps_nodes;
CREATE POLICY "eps_nodes_delete_policy" ON eps_nodes
    FOR DELETE USING (
        is_company_admin(empresa_id) OR 
        EXISTS (
            SELECT 1 FROM eps_creators ec 
            WHERE ec.usuario_id = auth.uid() 
            AND ec.empresa_id = eps_nodes.empresa_id
            AND ec.can_delete = true
        )
    );

-- ============================================
-- 4.2 EPS CREATORS POLICIES (ADMIN only)
-- ============================================

-- SELECT: Users of the company can see who are creators
DROP POLICY IF EXISTS "eps_creators_select_policy" ON eps_creators;
CREATE POLICY "eps_creators_select_policy" ON eps_creators
    FOR SELECT USING (belongs_to_company(empresa_id));

-- INSERT: Only ADMIN can add EPS creators
DROP POLICY IF EXISTS "eps_creators_insert_policy" ON eps_creators;
CREATE POLICY "eps_creators_insert_policy" ON eps_creators
    FOR INSERT WITH CHECK (is_company_admin(empresa_id));

-- UPDATE: Only ADMIN can modify EPS creator permissions
DROP POLICY IF EXISTS "eps_creators_update_policy" ON eps_creators;
CREATE POLICY "eps_creators_update_policy" ON eps_creators
    FOR UPDATE USING (is_company_admin(empresa_id));

-- DELETE: Only ADMIN can remove EPS creators
DROP POLICY IF EXISTS "eps_creators_delete_policy" ON eps_creators;
CREATE POLICY "eps_creators_delete_policy" ON eps_creators
    FOR DELETE USING (is_company_admin(empresa_id));

-- ============================================
-- 4.3 USER OBS ASSIGNMENTS POLICIES (ADMIN only)
-- ============================================

-- SELECT: Users of the company can see assignments
DROP POLICY IF EXISTS "user_obs_select_policy" ON usuario_obs_assignments;
CREATE POLICY "user_obs_select_policy" ON usuario_obs_assignments
    FOR SELECT USING (belongs_to_company(empresa_id));

-- INSERT: Only ADMIN can assign OBS to users
DROP POLICY IF EXISTS "user_obs_insert_policy" ON usuario_obs_assignments;
CREATE POLICY "user_obs_insert_policy" ON usuario_obs_assignments
    FOR INSERT WITH CHECK (is_company_admin(empresa_id));

-- UPDATE: Only ADMIN can modify assignments
DROP POLICY IF EXISTS "user_obs_update_policy" ON usuario_obs_assignments;
CREATE POLICY "user_obs_update_policy" ON usuario_obs_assignments
    FOR UPDATE USING (is_company_admin(empresa_id));

-- DELETE: Only ADMIN can remove assignments
DROP POLICY IF EXISTS "user_obs_delete_policy" ON usuario_obs_assignments;
CREATE POLICY "user_obs_delete_policy" ON usuario_obs_assignments
    FOR DELETE USING (is_company_admin(empresa_id));

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Check if user is an EPS creator for a company
CREATE OR REPLACE FUNCTION is_eps_creator(p_empresa_id UUID, p_permission VARCHAR DEFAULT 'create')
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM eps_creators ec
        WHERE ec.usuario_id = auth.uid()
        AND ec.empresa_id = p_empresa_id
        AND (
            (p_permission = 'create' AND ec.can_create = true) OR
            (p_permission = 'edit' AND ec.can_edit = true) OR
            (p_permission = 'delete' AND ec.can_delete = true) OR
            (p_permission = 'assign' AND ec.can_assign_responsible = true)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all EPS nodes visible to a user based on their OBS assignments
-- This is the core function for project visibility control
CREATE OR REPLACE FUNCTION get_visible_eps_for_user(p_user_id UUID)
RETURNS TABLE (eps_node_id UUID) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE 
    -- Get user's OBS assignments
    user_obs AS (
        SELECT obs_node_id FROM usuario_obs_assignments WHERE usuario_id = p_user_id
    ),
    -- Get all OBS nodes including children of assigned nodes
    accessible_obs AS (
        SELECT o.id FROM obs_nodes o
        INNER JOIN user_obs uo ON o.id = uo.obs_node_id
        UNION ALL
        SELECT o.id FROM obs_nodes o
        INNER JOIN accessible_obs ao ON o.parent_id = ao.id
    ),
    -- Get EPS nodes where Responsible Manager is in accessible OBS
    visible_eps AS (
        SELECT e.id FROM eps_nodes e
        INNER JOIN accessible_obs ao ON e.responsible_manager_id = ao.id
        UNION ALL
        -- Include parent EPS nodes for navigation
        SELECT e.id FROM eps_nodes e
        INNER JOIN visible_eps ve ON e.id = (SELECT parent_id FROM eps_nodes WHERE id = ve.id)
        -- Include child EPS nodes
        UNION ALL
        SELECT e.id FROM eps_nodes e
        INNER JOIN visible_eps ve ON e.parent_id = ve.id
    )
    SELECT DISTINCT id FROM visible_eps;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can access a specific EPS node
CREATE OR REPLACE FUNCTION can_access_eps(p_user_id UUID, p_eps_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM get_visible_eps_for_user(p_user_id) WHERE eps_node_id = p_eps_id
    ) OR EXISTS (
        -- ADMIN always has access
        SELECT 1 FROM usuarios u 
        WHERE u.id = p_user_id 
        AND u.perfil_acesso = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. UPDATE TIMESTAMP TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_eps_nodes_updated_at ON eps_nodes;
CREATE TRIGGER update_eps_nodes_updated_at
    BEFORE UPDATE ON eps_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eps_creators_updated_at ON eps_creators;
CREATE TRIGGER update_eps_creators_updated_at
    BEFORE UPDATE ON eps_creators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE eps_nodes IS 'Enterprise Project Structure - hierarchical structure for organizing projects (Primavera P6 model)';
COMMENT ON COLUMN eps_nodes.responsible_manager_id IS 'Links to OBS node - users assigned to this OBS can access this EPS branch';
COMMENT ON TABLE eps_creators IS 'Users authorized to create/manage EPS nodes - only ADMIN can assign this permission';
COMMENT ON TABLE usuario_obs_assignments IS 'User to OBS node assignments - determines project visibility following Responsible Manager concept';
