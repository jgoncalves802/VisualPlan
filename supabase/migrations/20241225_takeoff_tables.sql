-- ============================================================================
-- Take-off Module - Database Schema
-- VisionPlan Construction Project Management Platform
-- ============================================================================

-- 1. Disciplinas - Templates de disciplinas por empresa
CREATE TABLE IF NOT EXISTS takeoff_disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(20) NOT NULL,
  descricao TEXT,
  cor VARCHAR(7) NOT NULL DEFAULT '#6B7280',
  icone VARCHAR(50) NOT NULL DEFAULT 'box',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

-- 2. Colunas Configuradas por Disciplina
CREATE TABLE IF NOT EXISTS takeoff_colunas_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES takeoff_disciplinas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('text', 'number', 'decimal', 'select', 'date', 'calculated', 'reference', 'percentage')),
  formula TEXT,
  opcoes TEXT[],
  unidade VARCHAR(20),
  casas_decimais INTEGER NOT NULL DEFAULT 0,
  obrigatoria BOOLEAN NOT NULL DEFAULT false,
  visivel BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  largura INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(disciplina_id, codigo)
);

-- 3. Documentos de Projeto (Isométricos, Diagramas, etc.)
CREATE TABLE IF NOT EXISTS takeoff_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL,
  disciplina_id UUID REFERENCES takeoff_disciplinas(id) ON DELETE SET NULL,
  codigo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255),
  revisao VARCHAR(10) NOT NULL DEFAULT 'A',
  tipo VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'emitido' CHECK (status IN ('emitido', 'em_revisao', 'aprovado', 'cancelado', 'as_built')),
  data_emissao DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Mapas de Quantitativos
CREATE TABLE IF NOT EXISTS takeoff_mapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL,
  disciplina_id UUID NOT NULL REFERENCES takeoff_disciplinas(id) ON DELETE RESTRICT,
  nome VARCHAR(255) NOT NULL,
  versao VARCHAR(20) NOT NULL DEFAULT '1.0',
  status VARCHAR(20) NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'em_analise', 'aprovado', 'fechado')),
  descricao TEXT,
  data_referencia DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Itens do Take-off (Materiais/Serviços)
CREATE TABLE IF NOT EXISTS takeoff_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapa_id UUID NOT NULL REFERENCES takeoff_mapas(id) ON DELETE CASCADE,
  documento_id UUID REFERENCES takeoff_documentos(id) ON DELETE SET NULL,
  item_pq VARCHAR(50),
  area VARCHAR(100),
  edificacao VARCHAR(100),
  tag VARCHAR(100),
  linha VARCHAR(100),
  descricao TEXT NOT NULL,
  tipo_material VARCHAR(100),
  dimensao VARCHAR(100),
  unidade VARCHAR(20) NOT NULL,
  qtd_prevista NUMERIC(15,4) NOT NULL DEFAULT 0,
  qtd_takeoff NUMERIC(15,4) NOT NULL DEFAULT 0,
  qtd_executada NUMERIC(15,4) NOT NULL DEFAULT 0,
  peso_unitario NUMERIC(12,4) NOT NULL DEFAULT 0,
  peso_total NUMERIC(15,4) GENERATED ALWAYS AS (qtd_takeoff * peso_unitario) STORED,
  custo_unitario NUMERIC(15,2) NOT NULL DEFAULT 0,
  custo_total NUMERIC(18,2) GENERATED ALWAYS AS (qtd_takeoff * custo_unitario) STORED,
  percentual_executado NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN qtd_takeoff > 0 THEN LEAST((qtd_executada / qtd_takeoff) * 100, 100) ELSE 0 END
  ) STORED,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Valores Custom (EAV para colunas extras)
CREATE TABLE IF NOT EXISTS takeoff_valores_custom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES takeoff_itens(id) ON DELETE CASCADE,
  coluna_config_id UUID NOT NULL REFERENCES takeoff_colunas_config(id) ON DELETE CASCADE,
  valor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_id, coluna_config_id)
);

-- 7. Medições Periódicas
CREATE TABLE IF NOT EXISTS takeoff_medicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES takeoff_itens(id) ON DELETE CASCADE,
  usuario_id UUID,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  qtd_periodo NUMERIC(15,4) NOT NULL DEFAULT 0,
  qtd_acumulada NUMERIC(15,4),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Vínculos com Atividades do Cronograma
CREATE TABLE IF NOT EXISTS takeoff_vinculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES takeoff_itens(id) ON DELETE CASCADE,
  atividade_id UUID NOT NULL,
  peso NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (peso >= 0 AND peso <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_id, atividade_id)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_takeoff_disciplinas_empresa ON takeoff_disciplinas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_disciplinas_ativo ON takeoff_disciplinas(ativo);
CREATE INDEX IF NOT EXISTS idx_takeoff_colunas_disciplina ON takeoff_colunas_config(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_documentos_projeto ON takeoff_documentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_documentos_disciplina ON takeoff_documentos(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_mapas_projeto ON takeoff_mapas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_mapas_disciplina ON takeoff_mapas(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_mapas_status ON takeoff_mapas(status);
CREATE INDEX IF NOT EXISTS idx_takeoff_itens_mapa ON takeoff_itens(mapa_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_itens_documento ON takeoff_itens(documento_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_itens_area ON takeoff_itens(area);
CREATE INDEX IF NOT EXISTS idx_takeoff_itens_status ON takeoff_itens(status);
CREATE INDEX IF NOT EXISTS idx_takeoff_valores_item ON takeoff_valores_custom(item_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_medicoes_item ON takeoff_medicoes(item_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_vinculos_item ON takeoff_vinculos(item_id);
CREATE INDEX IF NOT EXISTS idx_takeoff_vinculos_atividade ON takeoff_vinculos(atividade_id);

-- ============================================================================
-- Updated_at Trigger Function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_takeoff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS trigger_takeoff_disciplinas_updated_at ON takeoff_disciplinas;
CREATE TRIGGER trigger_takeoff_disciplinas_updated_at
  BEFORE UPDATE ON takeoff_disciplinas
  FOR EACH ROW EXECUTE FUNCTION update_takeoff_updated_at();

DROP TRIGGER IF EXISTS trigger_takeoff_colunas_updated_at ON takeoff_colunas_config;
CREATE TRIGGER trigger_takeoff_colunas_updated_at
  BEFORE UPDATE ON takeoff_colunas_config
  FOR EACH ROW EXECUTE FUNCTION update_takeoff_updated_at();

DROP TRIGGER IF EXISTS trigger_takeoff_documentos_updated_at ON takeoff_documentos;
CREATE TRIGGER trigger_takeoff_documentos_updated_at
  BEFORE UPDATE ON takeoff_documentos
  FOR EACH ROW EXECUTE FUNCTION update_takeoff_updated_at();

DROP TRIGGER IF EXISTS trigger_takeoff_mapas_updated_at ON takeoff_mapas;
CREATE TRIGGER trigger_takeoff_mapas_updated_at
  BEFORE UPDATE ON takeoff_mapas
  FOR EACH ROW EXECUTE FUNCTION update_takeoff_updated_at();

DROP TRIGGER IF EXISTS trigger_takeoff_itens_updated_at ON takeoff_itens;
CREATE TRIGGER trigger_takeoff_itens_updated_at
  BEFORE UPDATE ON takeoff_itens
  FOR EACH ROW EXECUTE FUNCTION update_takeoff_updated_at();

DROP TRIGGER IF EXISTS trigger_takeoff_valores_updated_at ON takeoff_valores_custom;
CREATE TRIGGER trigger_takeoff_valores_updated_at
  BEFORE UPDATE ON takeoff_valores_custom
  FOR EACH ROW EXECUTE FUNCTION update_takeoff_updated_at();

DROP TRIGGER IF EXISTS trigger_takeoff_medicoes_updated_at ON takeoff_medicoes;
CREATE TRIGGER trigger_takeoff_medicoes_updated_at
  BEFORE UPDATE ON takeoff_medicoes
  FOR EACH ROW EXECUTE FUNCTION update_takeoff_updated_at();

DROP TRIGGER IF EXISTS trigger_takeoff_vinculos_updated_at ON takeoff_vinculos;
CREATE TRIGGER trigger_takeoff_vinculos_updated_at
  BEFORE UPDATE ON takeoff_vinculos
  FOR EACH ROW EXECUTE FUNCTION update_takeoff_updated_at();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE takeoff_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_colunas_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_mapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_valores_custom ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_medicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_vinculos ENABLE ROW LEVEL SECURITY;

-- Políticas para disciplinas (por empresa)
CREATE POLICY "Disciplinas visíveis por empresa"
  ON takeoff_disciplinas FOR SELECT
  USING (true);

CREATE POLICY "Disciplinas editáveis por empresa"
  ON takeoff_disciplinas FOR ALL
  USING (true);

-- Políticas para colunas config
CREATE POLICY "Colunas visíveis"
  ON takeoff_colunas_config FOR SELECT
  USING (true);

CREATE POLICY "Colunas editáveis"
  ON takeoff_colunas_config FOR ALL
  USING (true);

-- Políticas para documentos
CREATE POLICY "Documentos visíveis"
  ON takeoff_documentos FOR SELECT
  USING (true);

CREATE POLICY "Documentos editáveis"
  ON takeoff_documentos FOR ALL
  USING (true);

-- Políticas para mapas
CREATE POLICY "Mapas visíveis"
  ON takeoff_mapas FOR SELECT
  USING (true);

CREATE POLICY "Mapas editáveis"
  ON takeoff_mapas FOR ALL
  USING (true);

-- Políticas para itens
CREATE POLICY "Itens visíveis"
  ON takeoff_itens FOR SELECT
  USING (true);

CREATE POLICY "Itens editáveis"
  ON takeoff_itens FOR ALL
  USING (true);

-- Políticas para valores custom
CREATE POLICY "Valores custom visíveis"
  ON takeoff_valores_custom FOR SELECT
  USING (true);

CREATE POLICY "Valores custom editáveis"
  ON takeoff_valores_custom FOR ALL
  USING (true);

-- Políticas para medições
CREATE POLICY "Medições visíveis"
  ON takeoff_medicoes FOR SELECT
  USING (true);

CREATE POLICY "Medições editáveis"
  ON takeoff_medicoes FOR ALL
  USING (true);

-- Políticas para vínculos
CREATE POLICY "Vínculos visíveis"
  ON takeoff_vinculos FOR SELECT
  USING (true);

CREATE POLICY "Vínculos editáveis"
  ON takeoff_vinculos FOR ALL
  USING (true);
