-- Migration: Criar tabela takeoff_item_etapas
-- Data: 2026-01-29
-- Descrição: Tabela para armazenar o status (0% ou 100%) de cada etapa por item do takeoff

-- Criar tabela takeoff_item_etapas
CREATE TABLE IF NOT EXISTS takeoff_item_etapas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES takeoff_itens(id) ON DELETE CASCADE,
    etapa_id UUID NOT NULL REFERENCES criterios_medicao_etapas(id) ON DELETE CASCADE,
    concluido BOOLEAN DEFAULT false,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    concluido_por UUID REFERENCES auth.users(id),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, etapa_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_takeoff_item_etapas_item_id ON takeoff_item_etapas(item_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_item_etapas_etapa_id ON takeoff_item_etapas(etapa_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_item_etapas_concluido ON takeoff_item_etapas(concluido);

-- Habilitar RLS
ALTER TABLE takeoff_item_etapas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON takeoff_item_etapas;
CREATE POLICY "Permitir SELECT para usuários autenticados" ON takeoff_item_etapas
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON takeoff_item_etapas;
CREATE POLICY "Permitir INSERT para usuários autenticados" ON takeoff_item_etapas
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON takeoff_item_etapas;
CREATE POLICY "Permitir UPDATE para usuários autenticados" ON takeoff_item_etapas
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON takeoff_item_etapas;
CREATE POLICY "Permitir DELETE para usuários autenticados" ON takeoff_item_etapas
    FOR DELETE TO authenticated USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_takeoff_item_etapas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_takeoff_item_etapas_updated_at ON takeoff_item_etapas;
CREATE TRIGGER trigger_update_takeoff_item_etapas_updated_at
    BEFORE UPDATE ON takeoff_item_etapas
    FOR EACH ROW
    EXECUTE FUNCTION update_takeoff_item_etapas_updated_at();
