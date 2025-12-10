-- ============================================
-- MIGRATION 015: Extensões P6 para Recursos
-- Adiciona: Multi-taxas, Curvas de Recursos, Alocação por Período
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. RESOURCE_RATES: Multi-taxas por recurso (5 tipos como P6)
-- ============================================
CREATE TABLE IF NOT EXISTS resource_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    
    -- Tipo de taxa (1-5 como P6)
    rate_type INTEGER NOT NULL CHECK (rate_type BETWEEN 1 AND 5),
    rate_name VARCHAR(50) NOT NULL, -- Ex: "Standard", "Overtime", "External", etc.
    
    -- Valor da taxa
    price_per_unit DECIMAL(15,4) NOT NULL DEFAULT 0,
    unit_type VARCHAR(20) NOT NULL DEFAULT 'hour' CHECK (unit_type IN ('hour', 'day', 'week', 'month', 'unit', 'fixed')),
    
    -- Período de validade (para taxas que variam ao longo do tempo)
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    
    -- Metadados
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_resource_rate UNIQUE (resource_id, rate_type, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_resource_rates_resource ON resource_rates(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_rates_empresa ON resource_rates(empresa_id);
CREATE INDEX IF NOT EXISTS idx_resource_rates_effective ON resource_rates(effective_from, effective_to);

-- ============================================
-- 2. RESOURCE_CURVES: Curvas de distribuição de recursos
-- ============================================
CREATE TABLE IF NOT EXISTS resource_curves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Identificação
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    
    -- Tipo de curva
    curve_type VARCHAR(30) NOT NULL DEFAULT 'CUSTOM' CHECK (
        curve_type IN ('LINEAR', 'BELL', 'FRONT_LOADED', 'BACK_LOADED', 'TRIANGULAR', 'TRAPEZOIDAL', 'CUSTOM')
    ),
    
    -- 21 pontos de distribuição (0%, 5%, 10%, ..., 100%)
    -- Cada ponto representa a % acumulada de trabalho naquele ponto da duração
    distribution_points JSONB NOT NULL DEFAULT '[0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]',
    
    -- Indicador se é curva padrão do sistema (não pode ser excluída)
    is_system_default BOOLEAN DEFAULT FALSE,
    
    -- Cor para visualização
    cor VARCHAR(7) DEFAULT '#3B82F6',
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    
    CONSTRAINT unique_curve_code UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_resource_curves_empresa ON resource_curves(empresa_id);
CREATE INDEX IF NOT EXISTS idx_resource_curves_type ON resource_curves(curve_type);

-- ============================================
-- 3. RESOURCE_ASSIGNMENT_PERIODS: Distribuição temporal detalhada
-- Armazena a distribuição de unidades/custos por período
-- ============================================
CREATE TABLE IF NOT EXISTS resource_assignment_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES resource_allocations(id) ON DELETE CASCADE,
    
    -- Período
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(10) NOT NULL DEFAULT 'day' CHECK (period_type IN ('day', 'week', 'month')),
    
    -- Unidades neste período
    planned_units DECIMAL(10,4) DEFAULT 0,
    actual_units DECIMAL(10,4) DEFAULT 0,
    remaining_units DECIMAL(10,4) DEFAULT 0,
    
    -- Custos neste período
    planned_cost DECIMAL(15,2) DEFAULT 0,
    actual_cost DECIMAL(15,2) DEFAULT 0,
    remaining_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Para cálculo de EVM
    earned_value DECIMAL(15,2) DEFAULT 0,
    
    -- Flags
    is_manual_entry BOOLEAN DEFAULT FALSE, -- True se foi entrada manual vs calculado pela curva
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_periods_allocation ON resource_assignment_periods(allocation_id);
CREATE INDEX IF NOT EXISTS idx_assignment_periods_dates ON resource_assignment_periods(period_start, period_end);

-- ============================================
-- 4. Expandir resource_allocations com campos P6
-- ============================================
ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS curve_id UUID REFERENCES resource_curves(id) ON DELETE SET NULL;

ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS rate_type INTEGER DEFAULT 1 CHECK (rate_type BETWEEN 1 AND 5);

ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS units_per_time DECIMAL(10,4) DEFAULT 8.0;

ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS budgeted_units DECIMAL(15,4) DEFAULT 0;

ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS actual_units DECIMAL(15,4) DEFAULT 0;

ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS remaining_units DECIMAL(15,4) DEFAULT 0;

ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS at_completion_units DECIMAL(15,4) DEFAULT 0;

ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS budgeted_cost DECIMAL(15,2) DEFAULT 0;

ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(15,2) DEFAULT 0;

ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS remaining_cost DECIMAL(15,2) DEFAULT 0;

ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS at_completion_cost DECIMAL(15,2) DEFAULT 0;

ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS actual_start DATE;

ALTER TABLE resource_allocations 
ADD COLUMN IF NOT EXISTS actual_finish DATE;

-- ============================================
-- 5. HABILITAR RLS nas novas tabelas
-- ============================================
ALTER TABLE resource_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_curves ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_assignment_periods ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. POLÍTICAS RLS para resource_rates
-- ============================================
DROP POLICY IF EXISTS "resource_rates_select_policy" ON resource_rates;
CREATE POLICY "resource_rates_select_policy" ON resource_rates
    FOR SELECT USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resource_rates_insert_policy" ON resource_rates;
CREATE POLICY "resource_rates_insert_policy" ON resource_rates
    FOR INSERT WITH CHECK (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resource_rates_update_policy" ON resource_rates;
CREATE POLICY "resource_rates_update_policy" ON resource_rates
    FOR UPDATE USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resource_rates_delete_policy" ON resource_rates;
CREATE POLICY "resource_rates_delete_policy" ON resource_rates
    FOR DELETE USING (belongs_to_company(empresa_id));

-- ============================================
-- 7. POLÍTICAS RLS para resource_curves
-- ============================================
DROP POLICY IF EXISTS "resource_curves_select_policy" ON resource_curves;
CREATE POLICY "resource_curves_select_policy" ON resource_curves
    FOR SELECT USING (
        empresa_id IS NULL -- Curvas padrão do sistema
        OR belongs_to_company(empresa_id)
    );

DROP POLICY IF EXISTS "resource_curves_insert_policy" ON resource_curves;
CREATE POLICY "resource_curves_insert_policy" ON resource_curves
    FOR INSERT WITH CHECK (
        empresa_id IS NULL 
        OR belongs_to_company(empresa_id)
    );

DROP POLICY IF EXISTS "resource_curves_update_policy" ON resource_curves;
CREATE POLICY "resource_curves_update_policy" ON resource_curves
    FOR UPDATE USING (
        (empresa_id IS NULL AND is_system_default = FALSE)
        OR belongs_to_company(empresa_id)
    );

DROP POLICY IF EXISTS "resource_curves_delete_policy" ON resource_curves;
CREATE POLICY "resource_curves_delete_policy" ON resource_curves
    FOR DELETE USING (
        is_system_default = FALSE 
        AND (empresa_id IS NULL OR is_company_admin(empresa_id))
    );

-- ============================================
-- 8. POLÍTICAS RLS para resource_assignment_periods
-- ============================================
DROP POLICY IF EXISTS "resource_assignment_periods_select_policy" ON resource_assignment_periods;
CREATE POLICY "resource_assignment_periods_select_policy" ON resource_assignment_periods
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM resource_allocations ra 
            WHERE ra.id = resource_assignment_periods.allocation_id 
            AND belongs_to_company(ra.empresa_id)
        )
    );

DROP POLICY IF EXISTS "resource_assignment_periods_insert_policy" ON resource_assignment_periods;
CREATE POLICY "resource_assignment_periods_insert_policy" ON resource_assignment_periods
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM resource_allocations ra 
            WHERE ra.id = resource_assignment_periods.allocation_id 
            AND belongs_to_company(ra.empresa_id)
        )
    );

DROP POLICY IF EXISTS "resource_assignment_periods_update_policy" ON resource_assignment_periods;
CREATE POLICY "resource_assignment_periods_update_policy" ON resource_assignment_periods
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM resource_allocations ra 
            WHERE ra.id = resource_assignment_periods.allocation_id 
            AND belongs_to_company(ra.empresa_id)
        )
    );

DROP POLICY IF EXISTS "resource_assignment_periods_delete_policy" ON resource_assignment_periods;
CREATE POLICY "resource_assignment_periods_delete_policy" ON resource_assignment_periods
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM resource_allocations ra 
            WHERE ra.id = resource_assignment_periods.allocation_id 
            AND belongs_to_company(ra.empresa_id)
        )
    );

-- ============================================
-- 9. TRIGGERS para updated_at
-- ============================================
DROP TRIGGER IF EXISTS resource_rates_updated_at ON resource_rates;
CREATE TRIGGER resource_rates_updated_at
    BEFORE UPDATE ON resource_rates
    FOR EACH ROW EXECUTE FUNCTION update_resources_timestamp();

DROP TRIGGER IF EXISTS resource_curves_updated_at ON resource_curves;
CREATE TRIGGER resource_curves_updated_at
    BEFORE UPDATE ON resource_curves
    FOR EACH ROW EXECUTE FUNCTION update_resources_timestamp();

DROP TRIGGER IF EXISTS resource_assignment_periods_updated_at ON resource_assignment_periods;
CREATE TRIGGER resource_assignment_periods_updated_at
    BEFORE UPDATE ON resource_assignment_periods
    FOR EACH ROW EXECUTE FUNCTION update_resources_timestamp();

-- ============================================
-- 10. INSERIR CURVAS PADRÃO DO SISTEMA
-- ============================================
INSERT INTO resource_curves (empresa_id, codigo, nome, descricao, curve_type, distribution_points, is_system_default, cor)
VALUES 
    (NULL, 'LINEAR', 'Linear (Uniforme)', 'Distribuição uniforme ao longo da duração', 'LINEAR', 
     '[0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]', TRUE, '#3B82F6'),
    
    (NULL, 'BELL', 'Curva em Sino', 'Início lento, pico no meio, término lento', 'BELL', 
     '[0,1,3,6,11,18,27,38,50,62,73,82,89,94,97,99,100,100,100,100,100]', TRUE, '#10B981'),
    
    (NULL, 'FRONT_LOADED', 'Carregamento Inicial', 'Maior esforço no início da atividade', 'FRONT_LOADED', 
     '[0,12,22,32,41,49,56,63,69,74,79,83,87,90,93,95,97,98,99,100,100]', TRUE, '#F59E0B'),
    
    (NULL, 'BACK_LOADED', 'Carregamento Final', 'Maior esforço no final da atividade', 'BACK_LOADED', 
     '[0,1,2,3,5,7,10,13,17,21,26,31,37,44,51,59,68,78,88,95,100]', TRUE, '#EF4444'),
    
    (NULL, 'TRIANGULAR', 'Triangular', 'Crescimento linear até metade, decrescimento após', 'TRIANGULAR', 
     '[0,4,8,12,18,24,32,40,50,60,70,78,84,89,92,95,97,98,99,100,100]', TRUE, '#8B5CF6'),
    
    (NULL, 'TRAPEZOIDAL', 'Trapezoidal', 'Ramp-up, platô, ramp-down', 'TRAPEZOIDAL', 
     '[0,3,8,15,25,35,45,50,55,60,65,70,75,85,92,96,98,99,100,100,100]', TRUE, '#06B6D4')
ON CONFLICT (empresa_id, codigo) DO NOTHING;

-- ============================================
-- 11. VIEW para S-Curve e Commodity Curves
-- ============================================
CREATE OR REPLACE VIEW v_resource_distribution AS
SELECT 
    ra.empresa_id,
    ra.atividade_id,
    r.id as resource_id,
    r.nome as resource_name,
    rt.categoria as resource_category,
    rt.nome as resource_type_name,
    rap.period_start,
    rap.period_end,
    rap.planned_units,
    rap.actual_units,
    rap.remaining_units,
    rap.planned_cost,
    rap.actual_cost,
    rap.remaining_cost,
    rap.earned_value,
    rc.curve_type,
    ra.rate_type,
    rr.price_per_unit as rate_value
FROM resource_allocations ra
JOIN resources r ON r.id = ra.resource_id
LEFT JOIN resource_types rt ON rt.id = r.resource_type_id
LEFT JOIN resource_assignment_periods rap ON rap.allocation_id = ra.id
LEFT JOIN resource_curves rc ON rc.id = ra.curve_id
LEFT JOIN resource_rates rr ON rr.resource_id = r.id AND rr.rate_type = ra.rate_type
WHERE ra.ativo = TRUE;

-- ============================================
-- 12. FUNÇÃO para calcular distribuição baseada em curva
-- ============================================
CREATE OR REPLACE FUNCTION calculate_curve_distribution(
    p_allocation_id UUID,
    p_total_units DECIMAL,
    p_start_date DATE,
    p_end_date DATE,
    p_curve_id UUID
) RETURNS TABLE (
    period_date DATE,
    period_units DECIMAL,
    cumulative_percent DECIMAL
) AS $$
DECLARE
    v_curve JSONB;
    v_duration INTEGER;
    v_daily_points DECIMAL[];
    v_prev_pct DECIMAL;
    v_curr_pct DECIMAL;
    v_daily_units DECIMAL;
    v_i INTEGER;
    v_curve_idx INTEGER;
    v_curve_value DECIMAL;
BEGIN
    SELECT distribution_points INTO v_curve
    FROM resource_curves WHERE id = p_curve_id;
    
    IF v_curve IS NULL THEN
        v_curve := '[0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]'::JSONB;
    END IF;
    
    v_duration := p_end_date - p_start_date + 1;
    
    FOR v_i IN 0..(v_duration - 1) LOOP
        v_curve_idx := FLOOR((v_i::DECIMAL / v_duration) * 20)::INTEGER;
        IF v_curve_idx >= 20 THEN v_curve_idx := 19; END IF;
        
        v_prev_pct := COALESCE((v_curve->(v_curve_idx))::DECIMAL, 0);
        v_curr_pct := COALESCE((v_curve->(v_curve_idx + 1))::DECIMAL, 100);
        
        v_daily_units := p_total_units * (v_curr_pct - v_prev_pct) / 100;
        
        RETURN QUERY SELECT 
            p_start_date + v_i,
            v_daily_units,
            v_curr_pct;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIM DA MIGRATION 015
-- ============================================
