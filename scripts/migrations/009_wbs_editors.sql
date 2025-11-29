-- ============================================
-- MIGRATION: WBS Editors - Sistema de Permissões para Editores de WBS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. TABELA WBS_EDITORS (Editores de WBS por Projeto EPS)
CREATE TABLE IF NOT EXISTS wbs_editors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    eps_node_id UUID NOT NULL REFERENCES eps_nodes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    can_create BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT TRUE,
    can_delete BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_wbs_editor_per_project UNIQUE (eps_node_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_wbs_editors_empresa ON wbs_editors(empresa_id);
CREATE INDEX IF NOT EXISTS idx_wbs_editors_eps_node ON wbs_editors(eps_node_id);
CREATE INDEX IF NOT EXISTS idx_wbs_editors_usuario ON wbs_editors(usuario_id);

-- 2. HABILITAR RLS
ALTER TABLE wbs_editors ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS - WBS_EDITORS
DROP POLICY IF EXISTS "wbs_editors_select_policy" ON wbs_editors;
CREATE POLICY "wbs_editors_select_policy" ON wbs_editors
    FOR SELECT USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "wbs_editors_insert_policy" ON wbs_editors;
CREATE POLICY "wbs_editors_insert_policy" ON wbs_editors
    FOR INSERT WITH CHECK (
        is_company_admin(empresa_id) OR 
        EXISTS (
            SELECT 1 FROM eps_creators ec 
            WHERE ec.usuario_id = auth.uid() 
            AND ec.empresa_id = wbs_editors.empresa_id
            AND ec.can_create = true
        )
    );

DROP POLICY IF EXISTS "wbs_editors_update_policy" ON wbs_editors;
CREATE POLICY "wbs_editors_update_policy" ON wbs_editors
    FOR UPDATE USING (
        is_company_admin(empresa_id) OR 
        EXISTS (
            SELECT 1 FROM eps_creators ec 
            WHERE ec.usuario_id = auth.uid() 
            AND ec.empresa_id = wbs_editors.empresa_id
            AND ec.can_edit = true
        )
    );

DROP POLICY IF EXISTS "wbs_editors_delete_policy" ON wbs_editors;
CREATE POLICY "wbs_editors_delete_policy" ON wbs_editors
    FOR DELETE USING (
        is_company_admin(empresa_id) OR 
        EXISTS (
            SELECT 1 FROM eps_creators ec 
            WHERE ec.usuario_id = auth.uid() 
            AND ec.empresa_id = wbs_editors.empresa_id
            AND ec.can_delete = true
        )
    );

-- 4. FUNÇÃO: Verificar se usuário pode editar WBS de um projeto
CREATE OR REPLACE FUNCTION can_edit_wbs(p_eps_node_id UUID, p_usuario_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    v_empresa_id UUID;
    v_root_eps_id UUID;
BEGIN
    -- Encontrar a empresa do nó EPS
    SELECT empresa_id INTO v_empresa_id FROM eps_nodes WHERE id = p_eps_node_id;
    
    IF v_empresa_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Admin sempre pode
    IF is_company_admin(v_empresa_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Encontrar o nó raiz (EPS/Projeto - nivel 0) deste nó
    WITH RECURSIVE node_path AS (
        SELECT id, parent_id, nivel FROM eps_nodes WHERE id = p_eps_node_id
        UNION ALL
        SELECT e.id, e.parent_id, e.nivel 
        FROM eps_nodes e
        JOIN node_path np ON e.id = np.parent_id
    )
    SELECT id INTO v_root_eps_id FROM node_path WHERE nivel = 0 LIMIT 1;
    
    IF v_root_eps_id IS NULL THEN
        v_root_eps_id := p_eps_node_id;
    END IF;
    
    -- Verificar se o usuário é editor de WBS deste projeto
    RETURN EXISTS (
        SELECT 1 FROM wbs_editors we
        WHERE we.eps_node_id = v_root_eps_id
        AND we.usuario_id = p_usuario_id
        AND we.can_edit = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO: Verificar se usuário pode criar WBS em um projeto
CREATE OR REPLACE FUNCTION can_create_wbs(p_eps_node_id UUID, p_usuario_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    v_empresa_id UUID;
    v_root_eps_id UUID;
BEGIN
    SELECT empresa_id INTO v_empresa_id FROM eps_nodes WHERE id = p_eps_node_id;
    
    IF v_empresa_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF is_company_admin(v_empresa_id) THEN
        RETURN TRUE;
    END IF;
    
    WITH RECURSIVE node_path AS (
        SELECT id, parent_id, nivel FROM eps_nodes WHERE id = p_eps_node_id
        UNION ALL
        SELECT e.id, e.parent_id, e.nivel 
        FROM eps_nodes e
        JOIN node_path np ON e.id = np.parent_id
    )
    SELECT id INTO v_root_eps_id FROM node_path WHERE nivel = 0 LIMIT 1;
    
    IF v_root_eps_id IS NULL THEN
        v_root_eps_id := p_eps_node_id;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM wbs_editors we
        WHERE we.eps_node_id = v_root_eps_id
        AND we.usuario_id = p_usuario_id
        AND we.can_create = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNÇÃO: Verificar se usuário pode deletar WBS em um projeto
CREATE OR REPLACE FUNCTION can_delete_wbs(p_eps_node_id UUID, p_usuario_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    v_empresa_id UUID;
    v_root_eps_id UUID;
BEGIN
    SELECT empresa_id INTO v_empresa_id FROM eps_nodes WHERE id = p_eps_node_id;
    
    IF v_empresa_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF is_company_admin(v_empresa_id) THEN
        RETURN TRUE;
    END IF;
    
    WITH RECURSIVE node_path AS (
        SELECT id, parent_id, nivel FROM eps_nodes WHERE id = p_eps_node_id
        UNION ALL
        SELECT e.id, e.parent_id, e.nivel 
        FROM eps_nodes e
        JOIN node_path np ON e.id = np.parent_id
    )
    SELECT id INTO v_root_eps_id FROM node_path WHERE nivel = 0 LIMIT 1;
    
    IF v_root_eps_id IS NULL THEN
        v_root_eps_id := p_eps_node_id;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM wbs_editors we
        WHERE we.eps_node_id = v_root_eps_id
        AND we.usuario_id = p_usuario_id
        AND we.can_delete = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNÇÃO: Obter projetos EPS visíveis para um usuário
-- Retorna projetos onde o usuário é:
-- 1. Admin da empresa
-- 2. Editor de WBS do projeto
-- 3. Atribuído a um nó OBS que é responsável por um nó EPS do projeto
-- 4. Manager de nível superior na mesma hierarquia OBS
CREATE OR REPLACE FUNCTION get_visible_eps_projects(p_empresa_id UUID, p_usuario_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    eps_id UUID,
    visibility_reason TEXT
) AS $$
BEGIN
    -- Admin vê tudo
    IF is_company_admin(p_empresa_id) THEN
        RETURN QUERY
        SELECT e.id, 'admin'::TEXT
        FROM eps_nodes e
        WHERE e.empresa_id = p_empresa_id
        AND e.nivel = 0;
        RETURN;
    END IF;
    
    RETURN QUERY
    -- Projetos onde o usuário é editor WBS
    SELECT DISTINCT e.id, 'wbs_editor'::TEXT
    FROM eps_nodes e
    JOIN wbs_editors we ON we.eps_node_id = e.id
    WHERE e.empresa_id = p_empresa_id
    AND e.nivel = 0
    AND we.usuario_id = p_usuario_id
    
    UNION
    
    -- Projetos onde o usuário está atribuído a um OBS que é responsável pelo projeto ou sub-nós
    SELECT DISTINCT root_eps.id, 'obs_assignment'::TEXT
    FROM eps_nodes en
    JOIN usuario_obs_assignments uoa ON uoa.obs_node_id = en.responsible_manager_id
    JOIN eps_nodes root_eps ON (
        -- O próprio nó é nível 0
        (en.nivel = 0 AND root_eps.id = en.id)
        OR
        -- Ou encontrar o nó raiz via parent chain
        (en.nivel > 0 AND root_eps.id = (
            WITH RECURSIVE find_root AS (
                SELECT id, parent_id, nivel FROM eps_nodes WHERE id = en.id
                UNION ALL
                SELECT e.id, e.parent_id, e.nivel
                FROM eps_nodes e
                JOIN find_root fr ON e.id = fr.parent_id
            )
            SELECT id FROM find_root WHERE nivel = 0 LIMIT 1
        ))
    )
    WHERE en.empresa_id = p_empresa_id
    AND uoa.usuario_id = p_usuario_id
    AND root_eps.nivel = 0
    
    UNION
    
    -- Projetos onde o usuário é manager de nível superior na hierarquia OBS
    SELECT DISTINCT root_eps.id, 'obs_hierarchy'::TEXT
    FROM eps_nodes en
    JOIN obs_nodes responsible_obs ON responsible_obs.id = en.responsible_manager_id
    JOIN usuario_obs_assignments uoa ON uoa.obs_node_id IN (
        -- Obter todos os nós OBS ancestrais do responsible_obs
        WITH RECURSIVE obs_ancestors AS (
            SELECT id, parent_id FROM obs_nodes WHERE id = responsible_obs.id
            UNION ALL
            SELECT o.id, o.parent_id
            FROM obs_nodes o
            JOIN obs_ancestors oa ON o.id = oa.parent_id
        )
        SELECT id FROM obs_ancestors WHERE id != responsible_obs.id
    )
    JOIN eps_nodes root_eps ON (
        (en.nivel = 0 AND root_eps.id = en.id)
        OR
        (en.nivel > 0 AND root_eps.id = (
            WITH RECURSIVE find_root AS (
                SELECT id, parent_id, nivel FROM eps_nodes WHERE id = en.id
                UNION ALL
                SELECT e.id, e.parent_id, e.nivel
                FROM eps_nodes e
                JOIN find_root fr ON e.id = fr.parent_id
            )
            SELECT id FROM find_root WHERE nivel = 0 LIMIT 1
        ))
    )
    WHERE en.empresa_id = p_empresa_id
    AND uoa.usuario_id = p_usuario_id
    AND root_eps.nivel = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_wbs_editors_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wbs_editors_updated_at ON wbs_editors;
CREATE TRIGGER wbs_editors_updated_at
    BEFORE UPDATE ON wbs_editors
    FOR EACH ROW
    EXECUTE FUNCTION update_wbs_editors_timestamp();

-- ============================================
-- FIM DA MIGRATION 009
-- ============================================
