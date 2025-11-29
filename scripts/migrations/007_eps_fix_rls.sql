-- ============================================
-- FIX: Remover políticas restritivas e criar permissivas
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. REMOVER POLÍTICAS ATUAIS
DROP POLICY IF EXISTS "eps_nodes_select_policy" ON eps_nodes;
DROP POLICY IF EXISTS "eps_nodes_insert_policy" ON eps_nodes;
DROP POLICY IF EXISTS "eps_nodes_update_policy" ON eps_nodes;
DROP POLICY IF EXISTS "eps_nodes_delete_policy" ON eps_nodes;

DROP POLICY IF EXISTS "eps_creators_select_policy" ON eps_creators;
DROP POLICY IF EXISTS "eps_creators_insert_policy" ON eps_creators;
DROP POLICY IF EXISTS "eps_creators_update_policy" ON eps_creators;
DROP POLICY IF EXISTS "eps_creators_delete_policy" ON eps_creators;

DROP POLICY IF EXISTS "user_obs_select_policy" ON usuario_obs_assignments;
DROP POLICY IF EXISTS "user_obs_insert_policy" ON usuario_obs_assignments;
DROP POLICY IF EXISTS "user_obs_update_policy" ON usuario_obs_assignments;
DROP POLICY IF EXISTS "user_obs_delete_policy" ON usuario_obs_assignments;

-- 2. CRIAR POLÍTICAS PERMISSIVAS PARA EPS_NODES
CREATE POLICY "eps_nodes_select_all" ON eps_nodes
    FOR SELECT USING (true);

CREATE POLICY "eps_nodes_insert_all" ON eps_nodes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "eps_nodes_update_all" ON eps_nodes
    FOR UPDATE USING (true);

CREATE POLICY "eps_nodes_delete_all" ON eps_nodes
    FOR DELETE USING (true);

-- 3. CRIAR POLÍTICAS PERMISSIVAS PARA EPS_CREATORS
CREATE POLICY "eps_creators_select_all" ON eps_creators
    FOR SELECT USING (true);

CREATE POLICY "eps_creators_insert_all" ON eps_creators
    FOR INSERT WITH CHECK (true);

CREATE POLICY "eps_creators_update_all" ON eps_creators
    FOR UPDATE USING (true);

CREATE POLICY "eps_creators_delete_all" ON eps_creators
    FOR DELETE USING (true);

-- 4. CRIAR POLÍTICAS PERMISSIVAS PARA USUARIO_OBS_ASSIGNMENTS
CREATE POLICY "user_obs_select_all" ON usuario_obs_assignments
    FOR SELECT USING (true);

CREATE POLICY "user_obs_insert_all" ON usuario_obs_assignments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "user_obs_update_all" ON usuario_obs_assignments
    FOR UPDATE USING (true);

CREATE POLICY "user_obs_delete_all" ON usuario_obs_assignments
    FOR DELETE USING (true);

-- PRONTO! Políticas corrigidas.
