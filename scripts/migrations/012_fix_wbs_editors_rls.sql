-- ============================================
-- FIX: WBS Editors RLS Policies
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Primeiro, recriar a função is_company_admin para garantir que funciona corretamente
CREATE OR REPLACE FUNCTION is_company_admin(p_empresa_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND empresa_id = p_empresa_id 
        AND perfil_acesso = 'ADMIN'
    )
    OR 
    -- Também considerar ADMIN global (sem empresa específica)
    EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND perfil_acesso = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar belongs_to_company
CREATE OR REPLACE FUNCTION belongs_to_company(p_empresa_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = auth.uid() 
        AND (empresa_id = p_empresa_id OR perfil_acesso = 'ADMIN')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar políticas de wbs_editors com verificação mais ampla
DROP POLICY IF EXISTS "wbs_editors_select_policy" ON wbs_editors;
CREATE POLICY "wbs_editors_select_policy" ON wbs_editors
    FOR SELECT USING (
        belongs_to_company(empresa_id)
        OR
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil_acesso = 'ADMIN')
    );

DROP POLICY IF EXISTS "wbs_editors_insert_policy" ON wbs_editors;
CREATE POLICY "wbs_editors_insert_policy" ON wbs_editors
    FOR INSERT WITH CHECK (
        -- Admin global pode inserir
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil_acesso = 'ADMIN')
        OR
        -- Admin da empresa pode inserir
        is_company_admin(empresa_id)
        OR 
        -- Usuário com permissão EPS pode inserir
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
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil_acesso = 'ADMIN')
        OR
        is_company_admin(empresa_id) 
        OR 
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
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil_acesso = 'ADMIN')
        OR
        is_company_admin(empresa_id) 
        OR 
        EXISTS (
            SELECT 1 FROM eps_creators ec 
            WHERE ec.usuario_id = auth.uid() 
            AND ec.empresa_id = wbs_editors.empresa_id
            AND ec.can_delete = true
        )
    );

-- ============================================
-- FIM DA CORREÇÃO
-- ============================================
