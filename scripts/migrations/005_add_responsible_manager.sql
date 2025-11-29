-- Migration: Add Responsible Manager to OBS Nodes
-- Version: 005
-- Date: 2024-11-29
-- Description: Adds responsible_manager_id to obs_nodes for Primavera P6-style OBS management

-- ============================================
-- 1. ADD RESPONSIBLE MANAGER COLUMN
-- ============================================
ALTER TABLE obs_nodes 
ADD COLUMN IF NOT EXISTS responsible_manager_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_obs_nodes_responsible ON obs_nodes(responsible_manager_id);

-- ============================================
-- 2. FIX RLS POLICIES - More permissive for ADMIN
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "obs_nodes_select" ON obs_nodes;
DROP POLICY IF EXISTS "obs_nodes_insert" ON obs_nodes;
DROP POLICY IF EXISTS "obs_nodes_update" ON obs_nodes;
DROP POLICY IF EXISTS "obs_nodes_delete" ON obs_nodes;
DROP POLICY IF EXISTS "obs_nodes_admin_all" ON obs_nodes;
DROP POLICY IF EXISTS "obs_nodes_select_empresa" ON obs_nodes;
DROP POLICY IF EXISTS "obs_nodes_all" ON obs_nodes;

DROP POLICY IF EXISTS "access_profiles_select" ON access_profiles;
DROP POLICY IF EXISTS "access_profiles_insert" ON access_profiles;
DROP POLICY IF EXISTS "access_profiles_update" ON access_profiles;
DROP POLICY IF EXISTS "access_profiles_delete" ON access_profiles;
DROP POLICY IF EXISTS "access_profiles_admin_all" ON access_profiles;
DROP POLICY IF EXISTS "access_profiles_all" ON access_profiles;

DROP POLICY IF EXISTS "profile_permissions_select" ON profile_permissions;
DROP POLICY IF EXISTS "profile_permissions_insert" ON profile_permissions;
DROP POLICY IF EXISTS "profile_permissions_update" ON profile_permissions;
DROP POLICY IF EXISTS "profile_permissions_delete" ON profile_permissions;
DROP POLICY IF EXISTS "profile_permissions_all" ON profile_permissions;

DROP POLICY IF EXISTS "profile_obs_scope_select" ON profile_obs_scope;
DROP POLICY IF EXISTS "profile_obs_scope_all" ON profile_obs_scope;

DROP POLICY IF EXISTS "usuario_perfis_select" ON usuario_perfis;
DROP POLICY IF EXISTS "usuario_perfis_insert" ON usuario_perfis;
DROP POLICY IF EXISTS "usuario_perfis_update" ON usuario_perfis;
DROP POLICY IF EXISTS "usuario_perfis_delete" ON usuario_perfis;
DROP POLICY IF EXISTS "usuario_perfis_all" ON usuario_perfis;

-- ============================================
-- 3. CREATE NEW RLS POLICIES
-- ============================================

-- OBS_NODES: Admin can do everything, others read their company
CREATE POLICY "obs_nodes_admin_full" ON obs_nodes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.perfil_acesso = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.perfil_acesso = 'ADMIN'
        )
    );

CREATE POLICY "obs_nodes_empresa_read" ON obs_nodes
    FOR SELECT TO authenticated
    USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE usuarios.id = auth.uid()
        )
        OR
        responsible_manager_id = auth.uid()
    );

-- ACCESS_PROFILES: Admin can do everything
CREATE POLICY "access_profiles_admin_full" ON access_profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.perfil_acesso = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.perfil_acesso = 'ADMIN'
        )
    );

CREATE POLICY "access_profiles_empresa_read" ON access_profiles
    FOR SELECT TO authenticated
    USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE usuarios.id = auth.uid()
        )
    );

-- PROFILE_PERMISSIONS: Admin can do everything
CREATE POLICY "profile_permissions_admin_full" ON profile_permissions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.perfil_acesso = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.perfil_acesso = 'ADMIN'
        )
    );

CREATE POLICY "profile_permissions_read" ON profile_permissions
    FOR SELECT TO authenticated
    USING (
        profile_id IN (
            SELECT ap.id FROM access_profiles ap
            JOIN usuarios u ON u.empresa_id = ap.empresa_id
            WHERE u.id = auth.uid()
        )
    );

-- PROFILE_OBS_SCOPE: Admin can do everything
CREATE POLICY "profile_obs_scope_admin_full" ON profile_obs_scope
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.perfil_acesso = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.perfil_acesso = 'ADMIN'
        )
    );

CREATE POLICY "profile_obs_scope_read" ON profile_obs_scope
    FOR SELECT TO authenticated
    USING (
        profile_id IN (
            SELECT ap.id FROM access_profiles ap
            JOIN usuarios u ON u.empresa_id = ap.empresa_id
            WHERE u.id = auth.uid()
        )
    );

-- USUARIO_PERFIS: Admin can do everything
CREATE POLICY "usuario_perfis_admin_full" ON usuario_perfis
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.perfil_acesso = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.perfil_acesso = 'ADMIN'
        )
    );

CREATE POLICY "usuario_perfis_own_read" ON usuario_perfis
    FOR SELECT TO authenticated
    USING (
        usuario_id = auth.uid()
        OR
        profile_id IN (
            SELECT ap.id FROM access_profiles ap
            JOIN usuarios u ON u.empresa_id = ap.empresa_id
            WHERE u.id = auth.uid()
        )
    );

-- ============================================
-- 4. COMMENTS
-- ============================================
COMMENT ON COLUMN obs_nodes.responsible_manager_id IS 'Usuário responsável por este nível da OBS (Responsible Manager no estilo Primavera P6)';
