-- Migration: Create OBS (Organizational Breakdown Structure) and Access Profiles System
-- Version: 004
-- Date: 2024-11-29
-- Description: Implements per-company OBS, configurable access profiles, and permission system

-- ============================================
-- 1. PERMISSION CATALOG (System-wide permissions)
-- ============================================
CREATE TABLE IF NOT EXISTS permission_catalog (
    permission_code VARCHAR(100) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    default_level VARCHAR(20) DEFAULT 'none', -- none, read, write, admin
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default permissions
INSERT INTO permission_catalog (permission_code, module, action, description, default_level) VALUES
-- Dashboard
('dashboard.view', 'dashboard', 'view', 'Visualizar dashboard principal', 'read'),
('dashboard.kpis', 'dashboard', 'kpis', 'Visualizar KPIs e métricas', 'read'),
('dashboard.export', 'dashboard', 'export', 'Exportar dados do dashboard', 'write'),

-- Projects (Obras)
('projects.view', 'projects', 'view', 'Visualizar lista de obras', 'read'),
('projects.create', 'projects', 'create', 'Criar novas obras', 'write'),
('projects.edit', 'projects', 'edit', 'Editar dados de obras', 'write'),
('projects.delete', 'projects', 'delete', 'Excluir obras', 'admin'),
('projects.archive', 'projects', 'archive', 'Arquivar obras', 'write'),

-- Planning (Planejamento)
('planning.view', 'planning', 'view', 'Visualizar cronograma', 'read'),
('planning.edit', 'planning', 'edit', 'Editar cronograma', 'write'),
('planning.approve', 'planning', 'approve', 'Aprovar planejamento', 'admin'),
('planning.baseline', 'planning', 'baseline', 'Definir linha de base', 'admin'),

-- Activities (Atividades)
('activities.view', 'activities', 'view', 'Visualizar atividades', 'read'),
('activities.create', 'activities', 'create', 'Criar atividades', 'write'),
('activities.edit', 'activities', 'edit', 'Editar atividades', 'write'),
('activities.delete', 'activities', 'delete', 'Excluir atividades', 'admin'),
('activities.assign', 'activities', 'assign', 'Atribuir responsáveis', 'write'),

-- LPS (Last Planner System)
('lps.view', 'lps', 'view', 'Visualizar LPS', 'read'),
('lps.weekly_plan', 'lps', 'weekly_plan', 'Criar planejamento semanal', 'write'),
('lps.daily_plan', 'lps', 'daily_plan', 'Criar planejamento diário', 'write'),
('lps.commit', 'lps', 'commit', 'Fazer compromissos', 'write'),
('lps.release', 'lps', 'release', 'Liberar atividades', 'admin'),

-- Restrictions (Restrições)
('restrictions.view', 'restrictions', 'view', 'Visualizar restrições', 'read'),
('restrictions.create', 'restrictions', 'create', 'Criar restrições', 'write'),
('restrictions.resolve', 'restrictions', 'resolve', 'Resolver restrições', 'write'),

-- Quality (Qualidade)
('quality.view', 'quality', 'view', 'Visualizar inspeções de qualidade', 'read'),
('quality.inspect', 'quality', 'inspect', 'Realizar inspeções', 'write'),
('quality.approve', 'quality', 'approve', 'Aprovar qualidade', 'admin'),

-- Reports (Relatórios)
('reports.view', 'reports', 'view', 'Visualizar relatórios', 'read'),
('reports.generate', 'reports', 'generate', 'Gerar relatórios', 'write'),
('reports.export', 'reports', 'export', 'Exportar relatórios', 'write'),

-- 4D Visualization
('4d.view', '4d', 'view', 'Visualizar modelo 4D', 'read'),
('4d.configure', '4d', 'configure', 'Configurar visualização 4D', 'write'),

-- Kanban
('kanban.view', 'kanban', 'view', 'Visualizar Kanban pessoal', 'read'),
('kanban.manage', 'kanban', 'manage', 'Gerenciar tarefas Kanban', 'write'),

-- Users (Usuários)
('users.view', 'users', 'view', 'Visualizar lista de usuários', 'read'),
('users.create', 'users', 'create', 'Criar usuários', 'admin'),
('users.edit', 'users', 'edit', 'Editar usuários', 'admin'),
('users.delete', 'users', 'delete', 'Desativar usuários', 'admin'),
('users.assign_profile', 'users', 'assign_profile', 'Atribuir perfis a usuários', 'admin'),

-- Companies (Empresas)
('companies.view', 'companies', 'view', 'Visualizar empresas', 'read'),
('companies.create', 'companies', 'create', 'Criar empresas', 'admin'),
('companies.edit', 'companies', 'edit', 'Editar empresas', 'admin'),
('companies.delete', 'companies', 'delete', 'Excluir empresas', 'admin'),
('companies.theme', 'companies', 'theme', 'Personalizar tema da empresa', 'admin'),

-- OBS (Estrutura Organizacional)
('obs.view', 'obs', 'view', 'Visualizar estrutura organizacional', 'read'),
('obs.manage', 'obs', 'manage', 'Gerenciar estrutura organizacional', 'admin'),

-- Profiles (Perfis de Acesso)
('profiles.view', 'profiles', 'view', 'Visualizar perfis de acesso', 'read'),
('profiles.manage', 'profiles', 'manage', 'Gerenciar perfis de acesso', 'admin'),

-- Settings (Configurações)
('settings.view', 'settings', 'view', 'Visualizar configurações', 'read'),
('settings.edit', 'settings', 'edit', 'Editar configurações', 'admin'),

-- Logs (Auditoria)
('logs.view', 'logs', 'view', 'Visualizar logs de atividade', 'read'),
('logs.export', 'logs', 'export', 'Exportar logs', 'admin')
ON CONFLICT (permission_code) DO NOTHING;

-- ============================================
-- 2. OBS NODES (Organizational Breakdown Structure per company)
-- ============================================
CREATE TABLE IF NOT EXISTS obs_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES obs_nodes(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    codigo VARCHAR(50),
    descricao TEXT,
    nivel INTEGER NOT NULL DEFAULT 1,
    ordem INTEGER NOT NULL DEFAULT 0,
    path TEXT, -- Materialized path for efficient queries (e.g., "root/level1/level2")
    metadata JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_obs_nodes_empresa ON obs_nodes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_obs_nodes_parent ON obs_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_obs_nodes_path ON obs_nodes(path);

-- ============================================
-- 3. ACCESS PROFILES (Per-company configurable profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS access_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    descricao TEXT,
    camada_governanca VARCHAR(50), -- PROPONENTE, FISCALIZACAO, CONTRATADA
    cor VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
    icone VARCHAR(50) DEFAULT 'shield', -- Lucide icon name
    is_default BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE, -- System profiles cannot be deleted
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_access_profiles_empresa ON access_profiles(empresa_id);

-- ============================================
-- 4. PROFILE PERMISSIONS (Permissions assigned to profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS profile_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES access_profiles(id) ON DELETE CASCADE,
    permission_code VARCHAR(100) NOT NULL REFERENCES permission_catalog(permission_code) ON DELETE CASCADE,
    nivel VARCHAR(20) NOT NULL DEFAULT 'read', -- none, read, write, admin
    scope JSONB DEFAULT '{}', -- Additional scope restrictions (e.g., specific OBS nodes)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_profile_permissions_profile ON profile_permissions(profile_id);

-- ============================================
-- 5. PROFILE OBS SCOPE (Which OBS nodes a profile can access)
-- ============================================
CREATE TABLE IF NOT EXISTS profile_obs_scope (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES access_profiles(id) ON DELETE CASCADE,
    obs_node_id UUID NOT NULL REFERENCES obs_nodes(id) ON DELETE CASCADE,
    include_children BOOLEAN DEFAULT TRUE, -- If true, includes all child nodes
    access_level VARCHAR(20) NOT NULL DEFAULT 'read', -- read, write, admin
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, obs_node_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_obs_scope_profile ON profile_obs_scope(profile_id);

-- ============================================
-- 6. USER PROFILES (Users assigned to profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS usuario_perfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES access_profiles(id) ON DELETE CASCADE,
    obs_node_id UUID REFERENCES obs_nodes(id) ON DELETE SET NULL, -- Optional: specific OBS scope for this user
    is_primary BOOLEAN DEFAULT FALSE, -- Primary profile for the user
    assigned_by UUID REFERENCES usuarios(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ, -- NULL means indefinite
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_perfis_usuario ON usuario_perfis(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_perfis_profile ON usuario_perfis(profile_id);

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE permission_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE obs_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_obs_scope ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_perfis ENABLE ROW LEVEL SECURITY;

-- Permission Catalog: Read-only for authenticated users
CREATE POLICY "permission_catalog_read" ON permission_catalog
    FOR SELECT TO authenticated USING (true);

-- OBS Nodes: Users can only see their company's OBS
CREATE POLICY "obs_nodes_select" ON obs_nodes
    FOR SELECT TO authenticated
    USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "obs_nodes_insert" ON obs_nodes
    FOR INSERT TO authenticated
    WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios 
        WHERE id = auth.uid() 
        AND perfil_acesso IN ('ADMIN', 'DIRETOR')
    ));

CREATE POLICY "obs_nodes_update" ON obs_nodes
    FOR UPDATE TO authenticated
    USING (empresa_id IN (
        SELECT empresa_id FROM usuarios 
        WHERE id = auth.uid() 
        AND perfil_acesso IN ('ADMIN', 'DIRETOR')
    ));

CREATE POLICY "obs_nodes_delete" ON obs_nodes
    FOR DELETE TO authenticated
    USING (empresa_id IN (
        SELECT empresa_id FROM usuarios 
        WHERE id = auth.uid() 
        AND perfil_acesso = 'ADMIN'
    ));

-- Access Profiles: Users can only see their company's profiles
CREATE POLICY "access_profiles_select" ON access_profiles
    FOR SELECT TO authenticated
    USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "access_profiles_insert" ON access_profiles
    FOR INSERT TO authenticated
    WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios 
        WHERE id = auth.uid() 
        AND perfil_acesso = 'ADMIN'
    ));

CREATE POLICY "access_profiles_update" ON access_profiles
    FOR UPDATE TO authenticated
    USING (empresa_id IN (
        SELECT empresa_id FROM usuarios 
        WHERE id = auth.uid() 
        AND perfil_acesso = 'ADMIN'
    ));

CREATE POLICY "access_profiles_delete" ON access_profiles
    FOR DELETE TO authenticated
    USING (empresa_id IN (
        SELECT empresa_id FROM usuarios 
        WHERE id = auth.uid() 
        AND perfil_acesso = 'ADMIN'
    ) AND is_system = FALSE);

-- Profile Permissions: Users can see permissions for their company's profiles
CREATE POLICY "profile_permissions_select" ON profile_permissions
    FOR SELECT TO authenticated
    USING (profile_id IN (
        SELECT ap.id FROM access_profiles ap
        JOIN usuarios u ON u.empresa_id = ap.empresa_id
        WHERE u.id = auth.uid()
    ));

CREATE POLICY "profile_permissions_insert" ON profile_permissions
    FOR INSERT TO authenticated
    WITH CHECK (profile_id IN (
        SELECT ap.id FROM access_profiles ap
        JOIN usuarios u ON u.empresa_id = ap.empresa_id
        WHERE u.id = auth.uid() AND u.perfil_acesso = 'ADMIN'
    ));

CREATE POLICY "profile_permissions_update" ON profile_permissions
    FOR UPDATE TO authenticated
    USING (profile_id IN (
        SELECT ap.id FROM access_profiles ap
        JOIN usuarios u ON u.empresa_id = ap.empresa_id
        WHERE u.id = auth.uid() AND u.perfil_acesso = 'ADMIN'
    ));

CREATE POLICY "profile_permissions_delete" ON profile_permissions
    FOR DELETE TO authenticated
    USING (profile_id IN (
        SELECT ap.id FROM access_profiles ap
        JOIN usuarios u ON u.empresa_id = ap.empresa_id
        WHERE u.id = auth.uid() AND u.perfil_acesso = 'ADMIN'
    ));

-- Profile OBS Scope: Similar to profile permissions
CREATE POLICY "profile_obs_scope_select" ON profile_obs_scope
    FOR SELECT TO authenticated
    USING (profile_id IN (
        SELECT ap.id FROM access_profiles ap
        JOIN usuarios u ON u.empresa_id = ap.empresa_id
        WHERE u.id = auth.uid()
    ));

CREATE POLICY "profile_obs_scope_all" ON profile_obs_scope
    FOR ALL TO authenticated
    USING (profile_id IN (
        SELECT ap.id FROM access_profiles ap
        JOIN usuarios u ON u.empresa_id = ap.empresa_id
        WHERE u.id = auth.uid() AND u.perfil_acesso = 'ADMIN'
    ));

-- User Profiles: Users can see their own profile assignments
CREATE POLICY "usuario_perfis_select" ON usuario_perfis
    FOR SELECT TO authenticated
    USING (
        usuario_id = auth.uid() OR
        profile_id IN (
            SELECT ap.id FROM access_profiles ap
            JOIN usuarios u ON u.empresa_id = ap.empresa_id
            WHERE u.id = auth.uid() AND u.perfil_acesso IN ('ADMIN', 'DIRETOR')
        )
    );

CREATE POLICY "usuario_perfis_insert" ON usuario_perfis
    FOR INSERT TO authenticated
    WITH CHECK (profile_id IN (
        SELECT ap.id FROM access_profiles ap
        JOIN usuarios u ON u.empresa_id = ap.empresa_id
        WHERE u.id = auth.uid() AND u.perfil_acesso = 'ADMIN'
    ));

CREATE POLICY "usuario_perfis_update" ON usuario_perfis
    FOR UPDATE TO authenticated
    USING (profile_id IN (
        SELECT ap.id FROM access_profiles ap
        JOIN usuarios u ON u.empresa_id = ap.empresa_id
        WHERE u.id = auth.uid() AND u.perfil_acesso = 'ADMIN'
    ));

CREATE POLICY "usuario_perfis_delete" ON usuario_perfis
    FOR DELETE TO authenticated
    USING (profile_id IN (
        SELECT ap.id FROM access_profiles ap
        JOIN usuarios u ON u.empresa_id = ap.empresa_id
        WHERE u.id = auth.uid() AND u.perfil_acesso = 'ADMIN'
    ));

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to update OBS node path when parent changes
CREATE OR REPLACE FUNCTION update_obs_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path := NEW.nome;
        NEW.nivel := 1;
    ELSE
        SELECT path, nivel INTO parent_path FROM obs_nodes WHERE id = NEW.parent_id;
        NEW.path := parent_path || '/' || NEW.nome;
        NEW.nivel := (SELECT nivel + 1 FROM obs_nodes WHERE id = NEW.parent_id);
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_obs_path
    BEFORE INSERT OR UPDATE ON obs_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_obs_path();

-- Function to check user permission
CREATE OR REPLACE FUNCTION check_user_permission(
    p_usuario_id UUID,
    p_permission_code VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM usuario_perfis up
        JOIN profile_permissions pp ON pp.profile_id = up.profile_id
        WHERE up.usuario_id = p_usuario_id
        AND up.ativo = TRUE
        AND pp.permission_code = p_permission_code
        AND pp.nivel IN ('read', 'write', 'admin')
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. COMMENTS
-- ============================================
COMMENT ON TABLE permission_catalog IS 'Catálogo de todas as permissões disponíveis no sistema';
COMMENT ON TABLE obs_nodes IS 'Estrutura Organizacional (OBS) hierárquica por empresa';
COMMENT ON TABLE access_profiles IS 'Perfis de acesso configuráveis por empresa';
COMMENT ON TABLE profile_permissions IS 'Permissões atribuídas a cada perfil';
COMMENT ON TABLE profile_obs_scope IS 'Escopo de OBS que cada perfil pode acessar';
COMMENT ON TABLE usuario_perfis IS 'Associação de usuários a perfis de acesso';
