-- =====================================================
-- MIGRAÇÃO CORRIGIDA: Critérios de Medição / Avanço Físico
-- Execute este script no SQL Editor do Supabase
-- Esta versão remove policies existentes antes de recriá-las
-- =====================================================

-- Tabela principal de Critérios de Medição
CREATE TABLE IF NOT EXISTS criterios_medicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  projeto_id UUID,
  codigo VARCHAR(100) NOT NULL,
  descritivo TEXT NOT NULL,
  descritivo_concreto TEXT,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'rascunho')),
  observacoes TEXT,
  criado_por UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

-- Tabela de Etapas dos Critérios
CREATE TABLE IF NOT EXISTS criterios_medicao_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterio_id UUID NOT NULL REFERENCES criterios_medicao(id) ON DELETE CASCADE,
  numero_etapa INTEGER NOT NULL,
  descritivo TEXT NOT NULL,
  descritivo_documento TEXT,
  percentual DECIMAL(5,2) NOT NULL CHECK (percentual >= 0 AND percentual <= 100),
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de vinculação Item x Critério
CREATE TABLE IF NOT EXISTS item_criterio_medicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL UNIQUE,
  criterio_id UUID NOT NULL REFERENCES criterios_medicao(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Avanços por Etapa
CREATE TABLE IF NOT EXISTS avancos_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_criterio_id UUID NOT NULL REFERENCES item_criterio_medicao(id) ON DELETE CASCADE,
  etapa_id UUID NOT NULL REFERENCES criterios_medicao_etapas(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  periodo_tipo VARCHAR(20) DEFAULT 'dia' CHECK (periodo_tipo IN ('hora', 'dia', 'semana', 'mes')),
  qtd_avancada DECIMAL(15,4) DEFAULT 0,
  qtd_acumulada DECIMAL(15,4) DEFAULT 0,
  percentual_avancado DECIMAL(8,4) DEFAULT 0,
  percentual_acumulado DECIMAL(8,4) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'aprovado', 'rejeitado')),
  registrado_por UUID,
  registrado_por_nome VARCHAR(255),
  registrado_em TIMESTAMPTZ DEFAULT NOW(),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Aprovações
CREATE TABLE IF NOT EXISTS avancos_aprovacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avanco_id UUID NOT NULL REFERENCES avancos_etapas(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL,
  nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('producao', 'planejamento', 'gerencia')),
  aprovador_id UUID,
  aprovador_nome VARCHAR(255),
  acao VARCHAR(20) NOT NULL CHECK (acao IN ('aprovado', 'rejeitado', 'pendente')),
  comentario TEXT,
  data_acao TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Medições de Take-off
CREATE TABLE IF NOT EXISTS takeoff_medicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  periodo_id UUID,
  empresa_id UUID NOT NULL,
  qtd_medida DECIMAL(15,4) DEFAULT 0,
  qtd_acumulada DECIMAL(15,4) DEFAULT 0,
  percentual_periodo DECIMAL(8,4) DEFAULT 0,
  percentual_acumulado DECIMAL(8,4) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_criterios_medicao_empresa ON criterios_medicao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_criterios_medicao_projeto ON criterios_medicao(projeto_id);
CREATE INDEX IF NOT EXISTS idx_criterios_medicao_codigo ON criterios_medicao(codigo);
CREATE INDEX IF NOT EXISTS idx_criterios_etapas_criterio ON criterios_medicao_etapas(criterio_id);
CREATE INDEX IF NOT EXISTS idx_item_criterio_item ON item_criterio_medicao(item_id);
CREATE INDEX IF NOT EXISTS idx_item_criterio_criterio ON item_criterio_medicao(criterio_id);
CREATE INDEX IF NOT EXISTS idx_avancos_item_criterio ON avancos_etapas(item_criterio_id);
CREATE INDEX IF NOT EXISTS idx_avancos_etapa ON avancos_etapas(etapa_id);
CREATE INDEX IF NOT EXISTS idx_avancos_periodo ON avancos_etapas(periodo_inicio, periodo_fim);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_avanco ON avancos_aprovacoes(avanco_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_medicoes_item ON takeoff_medicoes(item_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_medicoes_periodo ON takeoff_medicoes(periodo_id);

-- Habilitar RLS
ALTER TABLE criterios_medicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterios_medicao_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_criterio_medicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE avancos_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE avancos_aprovacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_medicoes ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes antes de recriar
DROP POLICY IF EXISTS "criterios_medicao_select" ON criterios_medicao;
DROP POLICY IF EXISTS "criterios_medicao_insert" ON criterios_medicao;
DROP POLICY IF EXISTS "criterios_medicao_update" ON criterios_medicao;
DROP POLICY IF EXISTS "criterios_medicao_delete" ON criterios_medicao;

DROP POLICY IF EXISTS "criterios_etapas_select" ON criterios_medicao_etapas;
DROP POLICY IF EXISTS "criterios_etapas_insert" ON criterios_medicao_etapas;
DROP POLICY IF EXISTS "criterios_etapas_update" ON criterios_medicao_etapas;
DROP POLICY IF EXISTS "criterios_etapas_delete" ON criterios_medicao_etapas;

DROP POLICY IF EXISTS "item_criterio_select" ON item_criterio_medicao;
DROP POLICY IF EXISTS "item_criterio_insert" ON item_criterio_medicao;
DROP POLICY IF EXISTS "item_criterio_update" ON item_criterio_medicao;
DROP POLICY IF EXISTS "item_criterio_delete" ON item_criterio_medicao;

DROP POLICY IF EXISTS "avancos_etapas_select" ON avancos_etapas;
DROP POLICY IF EXISTS "avancos_etapas_insert" ON avancos_etapas;
DROP POLICY IF EXISTS "avancos_etapas_update" ON avancos_etapas;
DROP POLICY IF EXISTS "avancos_etapas_delete" ON avancos_etapas;

DROP POLICY IF EXISTS "avancos_aprovacoes_select" ON avancos_aprovacoes;
DROP POLICY IF EXISTS "avancos_aprovacoes_insert" ON avancos_aprovacoes;
DROP POLICY IF EXISTS "avancos_aprovacoes_update" ON avancos_aprovacoes;
DROP POLICY IF EXISTS "avancos_aprovacoes_delete" ON avancos_aprovacoes;

DROP POLICY IF EXISTS "takeoff_medicoes_select" ON takeoff_medicoes;
DROP POLICY IF EXISTS "takeoff_medicoes_insert" ON takeoff_medicoes;
DROP POLICY IF EXISTS "takeoff_medicoes_update" ON takeoff_medicoes;
DROP POLICY IF EXISTS "takeoff_medicoes_delete" ON takeoff_medicoes;

-- Criar políticas de acesso
CREATE POLICY "criterios_medicao_select" ON criterios_medicao FOR SELECT TO authenticated USING (true);
CREATE POLICY "criterios_medicao_insert" ON criterios_medicao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "criterios_medicao_update" ON criterios_medicao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "criterios_medicao_delete" ON criterios_medicao FOR DELETE TO authenticated USING (true);

CREATE POLICY "criterios_etapas_select" ON criterios_medicao_etapas FOR SELECT TO authenticated USING (true);
CREATE POLICY "criterios_etapas_insert" ON criterios_medicao_etapas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "criterios_etapas_update" ON criterios_medicao_etapas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "criterios_etapas_delete" ON criterios_medicao_etapas FOR DELETE TO authenticated USING (true);

CREATE POLICY "item_criterio_select" ON item_criterio_medicao FOR SELECT TO authenticated USING (true);
CREATE POLICY "item_criterio_insert" ON item_criterio_medicao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "item_criterio_update" ON item_criterio_medicao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "item_criterio_delete" ON item_criterio_medicao FOR DELETE TO authenticated USING (true);

CREATE POLICY "avancos_etapas_select" ON avancos_etapas FOR SELECT TO authenticated USING (true);
CREATE POLICY "avancos_etapas_insert" ON avancos_etapas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "avancos_etapas_update" ON avancos_etapas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "avancos_etapas_delete" ON avancos_etapas FOR DELETE TO authenticated USING (true);

CREATE POLICY "avancos_aprovacoes_select" ON avancos_aprovacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "avancos_aprovacoes_insert" ON avancos_aprovacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "avancos_aprovacoes_update" ON avancos_aprovacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "avancos_aprovacoes_delete" ON avancos_aprovacoes FOR DELETE TO authenticated USING (true);

CREATE POLICY "takeoff_medicoes_select" ON takeoff_medicoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "takeoff_medicoes_insert" ON takeoff_medicoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "takeoff_medicoes_update" ON takeoff_medicoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "takeoff_medicoes_delete" ON takeoff_medicoes FOR DELETE TO authenticated USING (true);
