-- Migration 013: Create atividades (schedule activities) table
-- VisionPlan - Cronograma Module

-- ============================================================================
-- TABELA DE ATIVIDADES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID NOT NULL,
    codigo VARCHAR(50),
    edt VARCHAR(100),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(20) DEFAULT 'Tarefa' CHECK (tipo IN ('Tarefa', 'Marco', 'Fase', 'WBS')),
    parent_id UUID REFERENCES public.atividades(id) ON DELETE SET NULL,
    wbs_id UUID,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    duracao_dias INTEGER DEFAULT 1,
    unidade_tempo VARCHAR(10) DEFAULT 'DIAS' CHECK (unidade_tempo IN ('HORAS', 'DIAS')),
    progresso DECIMAL(5,2) DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
    status VARCHAR(30) DEFAULT 'Não Iniciada',
    responsavel_id UUID,
    responsavel_nome VARCHAR(255),
    setor_id UUID,
    prioridade VARCHAR(20) DEFAULT 'Média',
    e_critica BOOLEAN DEFAULT FALSE,
    folga_total INTEGER DEFAULT 0,
    calendario_id VARCHAR(100),
    custo_planejado DECIMAL(15,2),
    custo_real DECIMAL(15,2),
    valor_planejado DECIMAL(15,2),
    valor_real DECIMAL(15,2),
    empresa_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELA DE DEPENDÊNCIAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dependencias_atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atividade_origem_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
    atividade_destino_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
    tipo VARCHAR(10) DEFAULT 'FS' CHECK (tipo IN ('FS', 'SS', 'FF', 'SF')),
    lag_dias INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(atividade_origem_id, atividade_destino_id)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_atividades_projeto ON public.atividades(projeto_id);
CREATE INDEX IF NOT EXISTS idx_atividades_empresa ON public.atividades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_atividades_parent ON public.atividades(parent_id);
CREATE INDEX IF NOT EXISTS idx_atividades_wbs ON public.atividades(wbs_id);
CREATE INDEX IF NOT EXISTS idx_dependencias_origem ON public.dependencias_atividades(atividade_origem_id);
CREATE INDEX IF NOT EXISTS idx_dependencias_destino ON public.dependencias_atividades(atividade_destino_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencias_atividades ENABLE ROW LEVEL SECURITY;

-- Políticas para atividades
CREATE POLICY "Usuários podem ver atividades da sua empresa"
    ON public.atividades FOR SELECT
    USING (empresa_id IN (
        SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "Usuários podem criar atividades na sua empresa"
    ON public.atividades FOR INSERT
    WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "Usuários podem atualizar atividades da sua empresa"
    ON public.atividades FOR UPDATE
    USING (empresa_id IN (
        SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "Usuários podem excluir atividades da sua empresa"
    ON public.atividades FOR DELETE
    USING (empresa_id IN (
        SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
    ));

-- Políticas para dependências (baseadas nas atividades)
CREATE POLICY "Usuários podem ver dependências das suas atividades"
    ON public.dependencias_atividades FOR SELECT
    USING (
        atividade_origem_id IN (
            SELECT id FROM public.atividades WHERE empresa_id IN (
                SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Usuários podem criar dependências para suas atividades"
    ON public.dependencias_atividades FOR INSERT
    WITH CHECK (
        atividade_origem_id IN (
            SELECT id FROM public.atividades WHERE empresa_id IN (
                SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Usuários podem atualizar dependências das suas atividades"
    ON public.dependencias_atividades FOR UPDATE
    USING (
        atividade_origem_id IN (
            SELECT id FROM public.atividades WHERE empresa_id IN (
                SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Usuários podem excluir dependências das suas atividades"
    ON public.dependencias_atividades FOR DELETE
    USING (
        atividade_origem_id IN (
            SELECT id FROM public.atividades WHERE empresa_id IN (
                SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- TRIGGER PARA UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_atividades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atividades_updated_at
    BEFORE UPDATE ON public.atividades
    FOR EACH ROW
    EXECUTE FUNCTION update_atividades_updated_at();
