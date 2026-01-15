-- ============================================================================
-- Aceites e Interferências - Workflow de Programação Semanal
-- VisionPlan Construction Project Management Platform
-- ============================================================================
-- Implements acceptance workflow and interference tracking for LPS

-- 1. Atualizar status da programacao_semanal para incluir novos estados
ALTER TABLE programacao_semanal DROP CONSTRAINT IF EXISTS programacao_semanal_status_check;
ALTER TABLE programacao_semanal ADD CONSTRAINT programacao_semanal_status_check 
  CHECK (status IN ('PLANEJADA', 'AGUARDANDO_ACEITE', 'ACEITA', 'EM_EXECUCAO', 'CONCLUIDA', 'CANCELADA'));

-- 2. Tabela de Aceites da Programação
CREATE TABLE IF NOT EXISTS aceites_programacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  programacao_id UUID NOT NULL REFERENCES programacao_semanal(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  usuario_nome VARCHAR(255) NOT NULL,
  setor VARCHAR(100) NOT NULL,
  tipo_aceite VARCHAR(50) NOT NULL CHECK (tipo_aceite IN ('ENVIO_PRODUCAO', 'ACEITE_PRODUCAO', 'REJEICAO_PRODUCAO', 'RETORNO_PLANEJAMENTO')),
  observacoes TEXT,
  data_aceite TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Interferências da Obra
CREATE TABLE IF NOT EXISTS interferencias_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL,
  programacao_id UUID REFERENCES programacao_semanal(id) ON DELETE SET NULL,
  atividade_id UUID,
  atividade_codigo VARCHAR(50),
  atividade_nome VARCHAR(500),
  usuario_id UUID NOT NULL,
  usuario_nome VARCHAR(255) NOT NULL,
  setor VARCHAR(100) NOT NULL,
  empresa_nome VARCHAR(255) NOT NULL,
  tipo_empresa VARCHAR(50) NOT NULL CHECK (tipo_empresa IN ('CONTRATADA', 'CONTRATANTE', 'FISCALIZACAO')),
  categoria VARCHAR(50) CHECK (categoria IN ('MATERIAL', 'MAO_DE_OBRA', 'MAQUINA', 'METODO', 'MEIO_AMBIENTE', 'MEDIDA', 'SEGURANCA', 'PROJETO', 'CLIMA', 'OUTRO')),
  descricao TEXT NOT NULL,
  impacto TEXT,
  acao_tomada TEXT,
  data_ocorrencia DATE NOT NULL,
  data_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  convertida_restricao BOOLEAN NOT NULL DEFAULT FALSE,
  restricao_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'EM_ANALISE', 'RESOLVIDA', 'CONVERTIDA_RESTRICAO')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_aceites_programacao_empresa ON aceites_programacao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_aceites_programacao_programacao ON aceites_programacao(programacao_id);
CREATE INDEX IF NOT EXISTS idx_aceites_programacao_usuario ON aceites_programacao(usuario_id);
CREATE INDEX IF NOT EXISTS idx_aceites_programacao_tipo ON aceites_programacao(tipo_aceite);

CREATE INDEX IF NOT EXISTS idx_interferencias_obra_empresa ON interferencias_obra(empresa_id);
CREATE INDEX IF NOT EXISTS idx_interferencias_obra_projeto ON interferencias_obra(projeto_id);
CREATE INDEX IF NOT EXISTS idx_interferencias_obra_programacao ON interferencias_obra(programacao_id);
CREATE INDEX IF NOT EXISTS idx_interferencias_obra_atividade ON interferencias_obra(atividade_id);
CREATE INDEX IF NOT EXISTS idx_interferencias_obra_status ON interferencias_obra(status);
CREATE INDEX IF NOT EXISTS idx_interferencias_obra_data ON interferencias_obra(data_ocorrencia);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE aceites_programacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE interferencias_obra ENABLE ROW LEVEL SECURITY;

-- RLS Policies for aceites_programacao
DROP POLICY IF EXISTS aceites_programacao_select_policy ON aceites_programacao;
CREATE POLICY aceites_programacao_select_policy ON aceites_programacao
  FOR SELECT USING (true);

DROP POLICY IF EXISTS aceites_programacao_insert_policy ON aceites_programacao;
CREATE POLICY aceites_programacao_insert_policy ON aceites_programacao
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS aceites_programacao_update_policy ON aceites_programacao;
CREATE POLICY aceites_programacao_update_policy ON aceites_programacao
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS aceites_programacao_delete_policy ON aceites_programacao;
CREATE POLICY aceites_programacao_delete_policy ON aceites_programacao
  FOR DELETE USING (true);

-- RLS Policies for interferencias_obra
DROP POLICY IF EXISTS interferencias_obra_select_policy ON interferencias_obra;
CREATE POLICY interferencias_obra_select_policy ON interferencias_obra
  FOR SELECT USING (true);

DROP POLICY IF EXISTS interferencias_obra_insert_policy ON interferencias_obra;
CREATE POLICY interferencias_obra_insert_policy ON interferencias_obra
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS interferencias_obra_update_policy ON interferencias_obra;
CREATE POLICY interferencias_obra_update_policy ON interferencias_obra
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS interferencias_obra_delete_policy ON interferencias_obra;
CREATE POLICY interferencias_obra_delete_policy ON interferencias_obra
  FOR DELETE USING (true);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS aceites_programacao_updated_at ON aceites_programacao;
CREATE TRIGGER aceites_programacao_updated_at
  BEFORE UPDATE ON aceites_programacao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS interferencias_obra_updated_at ON interferencias_obra;
CREATE TRIGGER interferencias_obra_updated_at
  BEFORE UPDATE ON interferencias_obra
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE aceites_programacao IS 'Registro de aceites e aprovações da programação semanal entre planejamento e produção';
COMMENT ON TABLE interferencias_obra IS 'Registro de interferências encontradas durante a execução da obra, mapeadas no check-in/check-out';

COMMENT ON COLUMN aceites_programacao.tipo_aceite IS 'ENVIO_PRODUCAO: Planejamento envia para produção. ACEITE_PRODUCAO: Produção aceita. REJEICAO_PRODUCAO: Produção rejeita. RETORNO_PLANEJAMENTO: Retorna para edição';
COMMENT ON COLUMN interferencias_obra.tipo_empresa IS 'Tipo de empresa do usuário que registrou: CONTRATADA, CONTRATANTE ou FISCALIZACAO';
COMMENT ON COLUMN interferencias_obra.convertida_restricao IS 'Se TRUE, a interferência foi convertida em uma restrição no módulo Ishikawa';
