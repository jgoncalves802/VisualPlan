-- ============================================
-- MIGRATION 010: Sistema de Recursos - Primavera P6 / MS Project Style
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. TIPOS DE RECURSO (Work, Material, Cost, Generic, Budget)
CREATE TABLE IF NOT EXISTS resource_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('WORK', 'MATERIAL', 'COST', 'GENERIC', 'BUDGET')),
    descricao TEXT,
    unidade_padrao VARCHAR(20) DEFAULT 'hora',
    custo_padrao DECIMAL(15,2) DEFAULT 0,
    cor VARCHAR(7) DEFAULT '#3B82F6',
    icone VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_resource_type_code UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_resource_types_empresa ON resource_types(empresa_id);

-- 2. RECURSOS (Pessoas, Equipamentos, Materiais)
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    resource_type_id UUID REFERENCES resource_types(id) ON DELETE SET NULL,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cargo VARCHAR(100),
    departamento VARCHAR(100),
    
    -- Capacidade e disponibilidade
    capacidade_diaria DECIMAL(5,2) DEFAULT 8.0,
    unidade_capacidade VARCHAR(20) DEFAULT 'hora',
    disponivel_de DATE,
    disponivel_ate DATE,
    
    -- Custos (MS Project / Primavera P6 style)
    custo_por_hora DECIMAL(15,4) DEFAULT 0,
    custo_por_uso DECIMAL(15,2) DEFAULT 0,
    custo_hora_extra DECIMAL(15,4) DEFAULT 0,
    custo_fixo DECIMAL(15,2) DEFAULT 0,
    
    -- Habilidades e competências
    habilidades JSONB DEFAULT '[]',
    
    -- Calendário específico do recurso
    calendario_id UUID,
    
    -- Avatar/Foto
    avatar_url TEXT,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_resource_code UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_resources_empresa ON resources(empresa_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type_id);

-- 3. CALENDÁRIOS DE RECURSOS (Exceções de disponibilidade)
CREATE TABLE IF NOT EXISTS resource_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    
    -- Dias de trabalho padrão (bitmask: 1=Dom, 2=Seg, 4=Ter, 8=Qua, 16=Qui, 32=Sex, 64=Sab)
    dias_trabalho INTEGER DEFAULT 62, -- Seg-Sex
    
    -- Horários padrão
    horario_inicio TIME DEFAULT '08:00',
    horario_fim TIME DEFAULT '17:00',
    horario_almoco_inicio TIME DEFAULT '12:00',
    horario_almoco_fim TIME DEFAULT '13:00',
    
    -- Exceções (feriados, férias, etc.)
    excecoes JSONB DEFAULT '[]',
    
    is_padrao BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_calendars_resource ON resource_calendars(resource_id);

-- 4. ALOCAÇÕES DE RECURSOS (Vincula recursos às atividades)
CREATE TABLE IF NOT EXISTS resource_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    atividade_id VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    
    -- Período da alocação
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    
    -- Unidades alocadas (percentual ou quantidade)
    unidades DECIMAL(10,2) DEFAULT 100,
    unidade_tipo VARCHAR(20) DEFAULT 'PERCENT',
    
    -- Horas/Quantidade planejada e real
    quantidade_planejada DECIMAL(15,2) DEFAULT 0,
    quantidade_real DECIMAL(15,2) DEFAULT 0,
    
    -- Custos calculados
    custo_planejado DECIMAL(15,2) DEFAULT 0,
    custo_real DECIMAL(15,2) DEFAULT 0,
    
    -- Curva de alocação (Front-loaded, Back-loaded, Bell, Flat, etc.)
    curva_alocacao VARCHAR(20) DEFAULT 'FLAT',
    
    -- Status da alocação
    status VARCHAR(20) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    
    -- Notas e observações
    notas TEXT,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_resource_allocations_empresa ON resource_allocations(empresa_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_atividade ON resource_allocations(atividade_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_resource ON resource_allocations(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_dates ON resource_allocations(data_inicio, data_fim);

-- 5. CONFLITOS DE RECURSOS (Sobrealocações detectadas)
CREATE TABLE IF NOT EXISTS resource_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    
    -- Período do conflito
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    
    -- Detalhes do conflito
    alocacao_total DECIMAL(10,2) NOT NULL,
    capacidade_disponivel DECIMAL(10,2) NOT NULL,
    excesso DECIMAL(10,2) NOT NULL,
    
    -- Atividades envolvidas
    atividades_ids JSONB DEFAULT '[]',
    allocation_ids UUID[] DEFAULT '{}',
    
    -- Severidade
    severidade VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severidade IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- Status de resolução
    resolvido BOOLEAN DEFAULT FALSE,
    resolucao_tipo VARCHAR(50),
    resolucao_notas TEXT,
    resolvido_por UUID REFERENCES usuarios(id),
    resolvido_em TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_conflicts_empresa ON resource_conflicts(empresa_id);
CREATE INDEX IF NOT EXISTS idx_resource_conflicts_resource ON resource_conflicts(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_conflicts_dates ON resource_conflicts(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_resource_conflicts_resolvido ON resource_conflicts(resolvido);

-- 6. HABILITAR RLS
ALTER TABLE resource_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_conflicts ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS RLS
-- Resource Types
DROP POLICY IF EXISTS "resource_types_select_policy" ON resource_types;
CREATE POLICY "resource_types_select_policy" ON resource_types
    FOR SELECT USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resource_types_insert_policy" ON resource_types;
CREATE POLICY "resource_types_insert_policy" ON resource_types
    FOR INSERT WITH CHECK (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resource_types_update_policy" ON resource_types;
CREATE POLICY "resource_types_update_policy" ON resource_types
    FOR UPDATE USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resource_types_delete_policy" ON resource_types;
CREATE POLICY "resource_types_delete_policy" ON resource_types
    FOR DELETE USING (is_company_admin(empresa_id));

-- Resources
DROP POLICY IF EXISTS "resources_select_policy" ON resources;
CREATE POLICY "resources_select_policy" ON resources
    FOR SELECT USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resources_insert_policy" ON resources;
CREATE POLICY "resources_insert_policy" ON resources
    FOR INSERT WITH CHECK (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resources_update_policy" ON resources;
CREATE POLICY "resources_update_policy" ON resources
    FOR UPDATE USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resources_delete_policy" ON resources;
CREATE POLICY "resources_delete_policy" ON resources
    FOR DELETE USING (is_company_admin(empresa_id));

-- Resource Calendars
DROP POLICY IF EXISTS "resource_calendars_select_policy" ON resource_calendars;
CREATE POLICY "resource_calendars_select_policy" ON resource_calendars
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM resources r 
            WHERE r.id = resource_calendars.resource_id 
            AND belongs_to_company(r.empresa_id)
        )
    );

DROP POLICY IF EXISTS "resource_calendars_insert_policy" ON resource_calendars;
CREATE POLICY "resource_calendars_insert_policy" ON resource_calendars
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM resources r 
            WHERE r.id = resource_calendars.resource_id 
            AND belongs_to_company(r.empresa_id)
        )
    );

DROP POLICY IF EXISTS "resource_calendars_update_policy" ON resource_calendars;
CREATE POLICY "resource_calendars_update_policy" ON resource_calendars
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM resources r 
            WHERE r.id = resource_calendars.resource_id 
            AND belongs_to_company(r.empresa_id)
        )
    );

DROP POLICY IF EXISTS "resource_calendars_delete_policy" ON resource_calendars;
CREATE POLICY "resource_calendars_delete_policy" ON resource_calendars
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM resources r 
            WHERE r.id = resource_calendars.resource_id 
            AND is_company_admin(r.empresa_id)
        )
    );

-- Resource Allocations
DROP POLICY IF EXISTS "resource_allocations_select_policy" ON resource_allocations;
CREATE POLICY "resource_allocations_select_policy" ON resource_allocations
    FOR SELECT USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resource_allocations_insert_policy" ON resource_allocations;
CREATE POLICY "resource_allocations_insert_policy" ON resource_allocations
    FOR INSERT WITH CHECK (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resource_allocations_update_policy" ON resource_allocations;
CREATE POLICY "resource_allocations_update_policy" ON resource_allocations
    FOR UPDATE USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resource_allocations_delete_policy" ON resource_allocations;
CREATE POLICY "resource_allocations_delete_policy" ON resource_allocations
    FOR DELETE USING (belongs_to_company(empresa_id));

-- Resource Conflicts
DROP POLICY IF EXISTS "resource_conflicts_select_policy" ON resource_conflicts;
CREATE POLICY "resource_conflicts_select_policy" ON resource_conflicts
    FOR SELECT USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resource_conflicts_insert_policy" ON resource_conflicts;
CREATE POLICY "resource_conflicts_insert_policy" ON resource_conflicts
    FOR INSERT WITH CHECK (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resource_conflicts_update_policy" ON resource_conflicts;
CREATE POLICY "resource_conflicts_update_policy" ON resource_conflicts
    FOR UPDATE USING (belongs_to_company(empresa_id));

DROP POLICY IF EXISTS "resource_conflicts_delete_policy" ON resource_conflicts;
CREATE POLICY "resource_conflicts_delete_policy" ON resource_conflicts
    FOR DELETE USING (is_company_admin(empresa_id));

-- 8. TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_resources_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resource_types_updated_at ON resource_types;
CREATE TRIGGER resource_types_updated_at
    BEFORE UPDATE ON resource_types
    FOR EACH ROW EXECUTE FUNCTION update_resources_timestamp();

DROP TRIGGER IF EXISTS resources_updated_at ON resources;
CREATE TRIGGER resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_resources_timestamp();

DROP TRIGGER IF EXISTS resource_calendars_updated_at ON resource_calendars;
CREATE TRIGGER resource_calendars_updated_at
    BEFORE UPDATE ON resource_calendars
    FOR EACH ROW EXECUTE FUNCTION update_resources_timestamp();

DROP TRIGGER IF EXISTS resource_allocations_updated_at ON resource_allocations;
CREATE TRIGGER resource_allocations_updated_at
    BEFORE UPDATE ON resource_allocations
    FOR EACH ROW EXECUTE FUNCTION update_resources_timestamp();

DROP TRIGGER IF EXISTS resource_conflicts_updated_at ON resource_conflicts;
CREATE TRIGGER resource_conflicts_updated_at
    BEFORE UPDATE ON resource_conflicts
    FOR EACH ROW EXECUTE FUNCTION update_resources_timestamp();

-- ============================================
-- FIM DA MIGRATION 010
-- ============================================
