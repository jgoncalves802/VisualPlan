-- ============================================
-- MIGRATION COMPLETA: Enterprise Project Structure (EPS)
-- Execute este script completo no SQL Editor do Supabase
-- ============================================

-- 1. FUNÇÕES AUXILIARES
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

-- 2. TABELA EPS_NODES (Estrutura de Projetos)
CREATE TABLE IF NOT EXISTS eps_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES eps_nodes(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    responsible_manager_id UUID REFERENCES obs_nodes(id) ON DELETE SET NULL,
    nivel INTEGER NOT NULL DEFAULT 0,
    ordem INTEGER NOT NULL DEFAULT 0,
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

-- 3. TABELA EPS_CREATORS (Criadores de EPS)
CREATE TABLE IF NOT EXISTS eps_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    can_create BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT TRUE,
    can_delete BOOLEAN DEFAULT TRUE,
    can_assign_responsible BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_eps_creator_per_empresa UNIQUE (empresa_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_eps_creators_empresa ON eps_creators(empresa_id);
CREATE INDEX IF NOT EXISTS idx_eps_creators_usuario ON eps_creators(usuario_id);

-- 4. TABELA USUARIO_OBS_ASSIGNMENTS (Atribuição de OBS)
CREATE TABLE IF NOT EXISTS usuario_obs_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    obs_node_id UUID NOT NULL REFERENCES obs_nodes(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES access_profiles(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_obs_assignment UNIQUE (empresa_id, usuario_id, obs_node_id)
);

CREATE INDEX IF NOT EXISTS idx_user_obs_empresa ON usuario_obs_assignments(empresa_id);
CREATE INDEX IF NOT EXISTS idx_user_obs_usuario ON usuario_obs_assignments(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_obs_node ON usuario_obs_assignments(obs_node_id);

-- 5. HABILITAR RLS
ALTER TABLE eps_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eps_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_obs_assignments ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS - EPS_NODES
DROP POLICY IF EXISTS "eps_nodes_select_policy" ON eps_nodes;
CREATE POLICY "eps_nodes_select_policy" ON eps_nodes
    FOR SELECT USING (belongs_to_company(empresa_id));

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

-- 7. POLÍTICAS RLS - EPS_CREATORS
DROP POLICY IF EXISTS "eps_creators_select_policy" ON eps_creators;
CREATE POLICY "eps_creators_select_policy" ON eps_creators
    FOR SELECT USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "eps_creators_insert_policy" ON eps_creators;
CREATE POLICY "eps_creators_insert_policy" ON eps_creators
    FOR INSERT WITH CHECK (is_company_admin(empresa_id));

DROP POLICY IF EXISTS "eps_creators_update_policy" ON eps_creators;
CREATE POLICY "eps_creators_update_policy" ON eps_creators
    FOR UPDATE USING (is_company_admin(empresa_id));

DROP POLICY IF EXISTS "eps_creators_delete_policy" ON eps_creators;
CREATE POLICY "eps_creators_delete_policy" ON eps_creators
    FOR DELETE USING (is_company_admin(empresa_id));

-- 8. POLÍTICAS RLS - USUARIO_OBS_ASSIGNMENTS
DROP POLICY IF EXISTS "user_obs_select_policy" ON usuario_obs_assignments;
CREATE POLICY "user_obs_select_policy" ON usuario_obs_assignments
    FOR SELECT USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "user_obs_insert_policy" ON usuario_obs_assignments;
CREATE POLICY "user_obs_insert_policy" ON usuario_obs_assignments
    FOR INSERT WITH CHECK (is_company_admin(empresa_id));

DROP POLICY IF EXISTS "user_obs_update_policy" ON usuario_obs_assignments;
CREATE POLICY "user_obs_update_policy" ON usuario_obs_assignments
    FOR UPDATE USING (is_company_admin(empresa_id));

DROP POLICY IF EXISTS "user_obs_delete_policy" ON usuario_obs_assignments;
CREATE POLICY "user_obs_delete_policy" ON usuario_obs_assignments
    FOR DELETE USING (is_company_admin(empresa_id));

-- 9. FUNÇÃO AUXILIAR PARA VERIFICAR CRIADOR EPS
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

-- PRONTO! As 3 tabelas foram criadas com sucesso.
