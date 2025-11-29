-- ============================================
-- MIGRATION 011: Sistema de Baselines - Snapshots do Cronograma
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. BASELINES (Snapshots do cronograma)
CREATE TABLE IF NOT EXISTS baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    projeto_id VARCHAR(100) NOT NULL,
    
    -- Identificação
    numero INTEGER NOT NULL,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    
    -- Tipo de baseline
    tipo VARCHAR(20) DEFAULT 'ORIGINAL' CHECK (tipo IN ('ORIGINAL', 'REVISION', 'WHAT_IF', 'APPROVED')),
    
    -- Data do snapshot
    data_baseline DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Resumo do cronograma no momento do snapshot
    data_inicio_projeto DATE,
    data_fim_projeto DATE,
    duracao_total_dias INTEGER,
    total_atividades INTEGER,
    custo_total_planejado DECIMAL(15,2),
    
    -- Status
    is_atual BOOLEAN DEFAULT FALSE,
    aprovado BOOLEAN DEFAULT FALSE,
    aprovado_por UUID REFERENCES usuarios(id),
    aprovado_em TIMESTAMPTZ,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    
    CONSTRAINT unique_baseline_number UNIQUE (empresa_id, projeto_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_baselines_empresa ON baselines(empresa_id);
CREATE INDEX IF NOT EXISTS idx_baselines_projeto ON baselines(projeto_id);
CREATE INDEX IF NOT EXISTS idx_baselines_atual ON baselines(is_atual) WHERE is_atual = TRUE;

-- 2. BASELINE TASKS (Snapshot de cada atividade)
CREATE TABLE IF NOT EXISTS baseline_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baseline_id UUID NOT NULL REFERENCES baselines(id) ON DELETE CASCADE,
    atividade_id VARCHAR(100) NOT NULL,
    
    -- Dados da atividade no momento do snapshot
    nome VARCHAR(500) NOT NULL,
    codigo VARCHAR(50),
    wbs VARCHAR(100),
    
    -- Datas planejadas
    data_inicio_planejada DATE NOT NULL,
    data_fim_planejada DATE NOT NULL,
    duracao_planejada INTEGER,
    
    -- Progresso e status
    progresso_planejado DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(50),
    
    -- Custos planejados
    custo_planejado DECIMAL(15,2) DEFAULT 0,
    trabalho_planejado DECIMAL(15,2) DEFAULT 0,
    
    -- Caminho crítico
    e_critica BOOLEAN DEFAULT FALSE,
    folga_total INTEGER DEFAULT 0,
    folga_livre INTEGER DEFAULT 0,
    
    -- Early/Late Start/Finish (CPM)
    early_start DATE,
    early_finish DATE,
    late_start DATE,
    late_finish DATE,
    
    -- Hierarquia
    parent_id VARCHAR(100),
    nivel INTEGER DEFAULT 0,
    
    -- Recursos alocados (snapshot)
    recursos_alocados JSONB DEFAULT '[]',
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baseline_tasks_baseline ON baseline_tasks(baseline_id);
CREATE INDEX IF NOT EXISTS idx_baseline_tasks_atividade ON baseline_tasks(atividade_id);
CREATE INDEX IF NOT EXISTS idx_baseline_tasks_critica ON baseline_tasks(e_critica) WHERE e_critica = TRUE;

-- 3. BASELINE DEPENDENCIES (Snapshot das dependências)
CREATE TABLE IF NOT EXISTS baseline_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baseline_id UUID NOT NULL REFERENCES baselines(id) ON DELETE CASCADE,
    dependencia_id VARCHAR(100) NOT NULL,
    
    -- Atividades relacionadas
    atividade_origem_id VARCHAR(100) NOT NULL,
    atividade_destino_id VARCHAR(100) NOT NULL,
    
    -- Tipo de dependência
    tipo VARCHAR(5) NOT NULL CHECK (tipo IN ('FS', 'SS', 'FF', 'SF')),
    lag_dias INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baseline_dependencies_baseline ON baseline_dependencies(baseline_id);

-- 4. BASELINE RESOURCES (Snapshot das alocações de recursos)
CREATE TABLE IF NOT EXISTS baseline_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baseline_id UUID NOT NULL REFERENCES baselines(id) ON DELETE CASCADE,
    allocation_id UUID,
    
    -- Recurso
    resource_id UUID NOT NULL,
    resource_nome VARCHAR(200),
    resource_tipo VARCHAR(20),
    
    -- Atividade
    atividade_id VARCHAR(100) NOT NULL,
    
    -- Alocação planejada
    unidades DECIMAL(10,2) DEFAULT 100,
    quantidade_planejada DECIMAL(15,2) DEFAULT 0,
    custo_planejado DECIMAL(15,2) DEFAULT 0,
    
    -- Datas
    data_inicio DATE,
    data_fim DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baseline_resources_baseline ON baseline_resources(baseline_id);

-- 5. FUNÇÃO: Criar Baseline a partir do cronograma atual
CREATE OR REPLACE FUNCTION create_baseline(
    p_empresa_id UUID,
    p_projeto_id VARCHAR,
    p_nome VARCHAR,
    p_descricao TEXT DEFAULT NULL,
    p_tipo VARCHAR DEFAULT 'REVISION',
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_baseline_id UUID;
    v_numero INTEGER;
BEGIN
    -- Obter próximo número de baseline para o projeto
    SELECT COALESCE(MAX(numero), 0) + 1 INTO v_numero
    FROM baselines
    WHERE empresa_id = p_empresa_id AND projeto_id = p_projeto_id;
    
    -- Criar baseline
    INSERT INTO baselines (
        empresa_id, projeto_id, numero, nome, descricao, tipo, created_by
    ) VALUES (
        p_empresa_id, p_projeto_id, v_numero, p_nome, p_descricao, p_tipo, p_created_by
    ) RETURNING id INTO v_baseline_id;
    
    -- Nota: O snapshot das atividades deve ser feito via aplicação
    -- pois as atividades estão em formato diferente (cronogramaStore)
    
    RETURN v_baseline_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNÇÃO: Definir baseline como atual
CREATE OR REPLACE FUNCTION set_current_baseline(
    p_baseline_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_empresa_id UUID;
    v_projeto_id VARCHAR;
BEGIN
    -- Obter empresa e projeto do baseline
    SELECT empresa_id, projeto_id INTO v_empresa_id, v_projeto_id
    FROM baselines WHERE id = p_baseline_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Remover is_atual de outros baselines do projeto
    UPDATE baselines 
    SET is_atual = FALSE 
    WHERE empresa_id = v_empresa_id 
    AND projeto_id = v_projeto_id;
    
    -- Definir este como atual
    UPDATE baselines 
    SET is_atual = TRUE 
    WHERE id = p_baseline_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNÇÃO: Comparar baseline com cronograma atual
CREATE OR REPLACE FUNCTION get_baseline_variance(
    p_baseline_id UUID,
    p_atividade_id VARCHAR
)
RETURNS TABLE (
    atividade_id VARCHAR,
    nome_baseline VARCHAR,
    data_inicio_baseline DATE,
    data_fim_baseline DATE,
    duracao_baseline INTEGER,
    custo_baseline DECIMAL,
    variacao_dias_inicio INTEGER,
    variacao_dias_fim INTEGER,
    variacao_custo DECIMAL
) AS $$
BEGIN
    -- Esta função retorna a variação entre baseline e atividade atual
    -- A comparação com dados atuais deve ser feita na aplicação
    RETURN QUERY
    SELECT 
        bt.atividade_id::VARCHAR,
        bt.nome::VARCHAR,
        bt.data_inicio_planejada,
        bt.data_fim_planejada,
        bt.duracao_planejada,
        bt.custo_planejado,
        0::INTEGER, -- variacao_dias_inicio (calcular na aplicação)
        0::INTEGER, -- variacao_dias_fim (calcular na aplicação)
        0::DECIMAL  -- variacao_custo (calcular na aplicação)
    FROM baseline_tasks bt
    WHERE bt.baseline_id = p_baseline_id
    AND (p_atividade_id IS NULL OR bt.atividade_id = p_atividade_id);
END;
$$ LANGUAGE plpgsql;

-- 8. HABILITAR RLS
ALTER TABLE baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_resources ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS RLS
-- Baselines
DROP POLICY IF EXISTS "baselines_select_policy" ON baselines;
CREATE POLICY "baselines_select_policy" ON baselines
    FOR SELECT USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "baselines_insert_policy" ON baselines;
CREATE POLICY "baselines_insert_policy" ON baselines
    FOR INSERT WITH CHECK (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "baselines_update_policy" ON baselines;
CREATE POLICY "baselines_update_policy" ON baselines
    FOR UPDATE USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "baselines_delete_policy" ON baselines;
CREATE POLICY "baselines_delete_policy" ON baselines
    FOR DELETE USING (is_company_admin(empresa_id));

-- Baseline Tasks
DROP POLICY IF EXISTS "baseline_tasks_select_policy" ON baseline_tasks;
CREATE POLICY "baseline_tasks_select_policy" ON baseline_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM baselines b 
            WHERE b.id = baseline_tasks.baseline_id 
            AND belongs_to_company(b.empresa_id)
        )
    );

DROP POLICY IF EXISTS "baseline_tasks_insert_policy" ON baseline_tasks;
CREATE POLICY "baseline_tasks_insert_policy" ON baseline_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM baselines b 
            WHERE b.id = baseline_tasks.baseline_id 
            AND belongs_to_company(b.empresa_id)
        )
    );

DROP POLICY IF EXISTS "baseline_tasks_delete_policy" ON baseline_tasks;
CREATE POLICY "baseline_tasks_delete_policy" ON baseline_tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM baselines b 
            WHERE b.id = baseline_tasks.baseline_id 
            AND is_company_admin(b.empresa_id)
        )
    );

-- Baseline Dependencies
DROP POLICY IF EXISTS "baseline_dependencies_select_policy" ON baseline_dependencies;
CREATE POLICY "baseline_dependencies_select_policy" ON baseline_dependencies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM baselines b 
            WHERE b.id = baseline_dependencies.baseline_id 
            AND belongs_to_company(b.empresa_id)
        )
    );

DROP POLICY IF EXISTS "baseline_dependencies_insert_policy" ON baseline_dependencies;
CREATE POLICY "baseline_dependencies_insert_policy" ON baseline_dependencies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM baselines b 
            WHERE b.id = baseline_dependencies.baseline_id 
            AND belongs_to_company(b.empresa_id)
        )
    );

-- Baseline Resources
DROP POLICY IF EXISTS "baseline_resources_select_policy" ON baseline_resources;
CREATE POLICY "baseline_resources_select_policy" ON baseline_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM baselines b 
            WHERE b.id = baseline_resources.baseline_id 
            AND belongs_to_company(b.empresa_id)
        )
    );

DROP POLICY IF EXISTS "baseline_resources_insert_policy" ON baseline_resources;
CREATE POLICY "baseline_resources_insert_policy" ON baseline_resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM baselines b 
            WHERE b.id = baseline_resources.baseline_id 
            AND belongs_to_company(b.empresa_id)
        )
    );

-- 10. TRIGGERS PARA UPDATED_AT
DROP TRIGGER IF EXISTS baselines_updated_at ON baselines;
CREATE TRIGGER baselines_updated_at
    BEFORE UPDATE ON baselines
    FOR EACH ROW EXECUTE FUNCTION update_resources_timestamp();

-- ============================================
-- FIM DA MIGRATION 011
-- ============================================
