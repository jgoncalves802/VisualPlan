idx_indicadores_qualidade_empresa ON indicadores_qualidade(empresa_id);
CREATE INDEX idx_indicadores_qualidade_projeto ON indicadores_qualidade(projeto_id);
CREATE INDEX idx_indicadores_qualidade_data ON indicadores_qualidade(data_referencia);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE criterios_priorizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendarios_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE excecoes_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicadores_lps ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots_evm ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicadores_qualidade ENABLE ROW LEVEL SECURITY;

-- Policies for criterios_priorizacao
CREATE POLICY "criterios_priorizacao_select_policy" ON criterios_priorizacao
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "criterios_priorizacao_insert_policy" ON criterios_priorizacao
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "criterios_priorizacao_update_policy" ON criterios_priorizacao
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "criterios_priorizacao_delete_policy" ON criterios_priorizacao
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for projetos_portfolio
CREATE POLICY "projetos_portfolio_select_policy" ON projetos_portfolio
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "projetos_portfolio_insert_policy" ON projetos_portfolio
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "projetos_portfolio_update_policy" ON projetos_portfolio
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "projetos_portfolio_delete_policy" ON projetos_portfolio
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for scores_projetos
CREATE POLICY "scores_projetos_select_policy" ON scores_projetos
    FOR SELECT USING (projeto_id IN (
        SELECT id FROM projetos_portfolio WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

CREATE POLICY "scores_projetos_insert_policy" ON scores_projetos
    FOR INSERT WITH CHECK (projeto_id IN (
        SELECT id FROM projetos_portfolio WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

CREATE POLICY "scores_projetos_update_policy" ON scores_projetos
    FOR UPDATE USING (projeto_id IN (
        SELECT id FROM projetos_portfolio WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

CREATE POLICY "scores_projetos_delete_policy" ON scores_projetos
    FOR DELETE USING (projeto_id IN (
        SELECT id FROM projetos_portfolio WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

-- Policies for calendarios_projeto
CREATE POLICY "calendarios_projeto_select_policy" ON calendarios_projeto
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "calendarios_projeto_insert_policy" ON calendarios_projeto
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "calendarios_projeto_update_policy" ON calendarios_projeto
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "calendarios_projeto_delete_policy" ON calendarios_projeto
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for excecoes_calendario
CREATE POLICY "excecoes_calendario_select_policy" ON excecoes_calendario
    FOR SELECT USING (calendario_id IN (
        SELECT id FROM calendarios_projeto WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

CREATE POLICY "excecoes_calendario_insert_policy" ON excecoes_calendario
    FOR INSERT WITH CHECK (calendario_id IN (
        SELECT id FROM calendarios_projeto WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

CREATE POLICY "excecoes_calendario_update_policy" ON excecoes_calendario
    FOR UPDATE USING (calendario_id IN (
        SELECT id FROM calendarios_projeto WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

CREATE POLICY "excecoes_calendario_delete_policy" ON excecoes_calendario
    FOR DELETE USING (calendario_id IN (
        SELECT id FROM calendarios_projeto WHERE empresa_id IN (
            SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        )
    ));

-- Policies for indicadores_lps
CREATE POLICY "indicadores_lps_select_policy" ON indicadores_lps
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "indicadores_lps_insert_policy" ON indicadores_lps
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "indicadores_lps_update_policy" ON indicadores_lps
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "indicadores_lps_delete_policy" ON indicadores_lps
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for snapshots_evm
CREATE POLICY "snapshots_evm_select_policy" ON snapshots_evm
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "snapshots_evm_insert_policy" ON snapshots_evm
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "snapshots_evm_update_policy" ON snapshots_evm
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "snapshots_evm_delete_policy" ON snapshots_evm
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- Policies for indicadores_qualidade
CREATE POLICY "indicadores_qualidade_select_policy" ON indicadores_qualidade
    FOR SELECT USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "indicadores_qualidade_insert_policy" ON indicadores_qualidade
    FOR INSERT WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "indicadores_qualidade_update_policy" ON indicadores_qualidade
    FOR UPDATE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "indicadores_qualidade_delete_policy" ON indicadores_qualidade
    FOR DELETE USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_criterios_priorizacao_updated_at
    BEFORE UPDATE ON criterios_priorizacao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projetos_portfolio_updated_at
    BEFORE UPDATE ON projetos_portfolio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_projetos_updated_at
    BEFORE UPDATE ON scores_projetos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendarios_projeto_updated_at
    BEFORE UPDATE ON calendarios_projeto
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indicadores_lps_updated_at
    BEFORE UPDATE ON indicadores_lps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indicadores_qualidade_updated_at
    BEFORE UPDATE ON indicadores_qualidade
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: DEFAULT PRIORITIZATION CRITERIA (Optional)
-- ============================================================================
-- These are inserted only if the criterios_priorizacao table is empty for the company
-- Run this separately or modify empresa_id as needed

-- INSERT INTO criterios_priorizacao (empresa_id, nome, descricao, peso, inverso, ordem) VALUES
-- ('YOUR_EMPRESA_ID', 'ROI', 'Retorno sobre Investimento', 20, false, 1),
-- ('YOUR_EMPRESA_ID', 'Alinhamento Estratégico', 'Alinhamento com objetivos estratégicos', 20, false, 2),
-- ('YOUR_EMPRESA_ID', 'Urgência', 'Urgência de execução', 15, false, 3),
-- ('YOUR_EMPRESA_ID', 'Complexidade', 'Complexidade do projeto (menor é melhor)', 15, true, 4),
-- ('YOUR_EMPRESA_ID', 'Disponibilidade de Recursos', 'Disponibilidade de recursos necessários', 15, false, 5),
-- ('YOUR_EMPRESA_ID', 'Risco', 'Nível de risco do projeto (menor é melhor)', 15, true, 6);

-- ============================================================================
-- SEED DATA: DEFAULT CALENDARS (Optional)
-- ============================================================================
-- INSERT INTO calendarios_projeto (empresa_id, nome, descricao, dias_trabalho, horario_inicio, horario_fim, horas_por_dia, padrao) VALUES
-- ('YOUR_EMPRESA_ID', 'Calendário Padrão 5x8', 'Segunda a Sexta, 8 horas por dia', '{1,2,3,4,5}', '08:00', '17:00', 8, true),
-- ('YOUR_EMPRESA_ID', 'Calendário 6x8', 'Segunda a Sábado, 8 horas por dia', '{1,2,3,4,5,6}', '07:00', '16:00', 8, false),
-- ('YOUR_EMPRESA_ID', 'Calendário 24/7', 'Operação contínua 24 horas, 7 dias por semana', '{0,1,2,3,4,5,6}', '00:00', '23:59', 24, false);
