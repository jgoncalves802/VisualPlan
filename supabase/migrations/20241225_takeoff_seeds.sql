-- ============================================================================
-- Take-off Module - Seed Data for Default Disciplinas
-- Execute this after tables are created
-- ============================================================================

-- Function to initialize takeoff disciplinas for a company
CREATE OR REPLACE FUNCTION initialize_takeoff_disciplinas(p_empresa_id UUID)
RETURNS void AS $$
DECLARE
  v_disciplina_id UUID;
BEGIN
  -- Tubulação
  INSERT INTO takeoff_disciplinas (empresa_id, nome, codigo, cor, icone, ativo)
  VALUES (p_empresa_id, 'Tubulação', 'TUB', '#3B82F6', 'cylinder', true)
  ON CONFLICT (empresa_id, codigo) DO NOTHING
  RETURNING id INTO v_disciplina_id;
  
  IF v_disciplina_id IS NOT NULL THEN
    INSERT INTO takeoff_colunas_config (disciplina_id, nome, codigo, tipo, ordem, casas_decimais, obrigatoria, visivel, largura)
    VALUES
      (v_disciplina_id, 'Linha', 'linha', 'text', 1, 0, false, true, 120),
      (v_disciplina_id, 'Isométrico', 'isometrico', 'text', 2, 0, false, true, 130),
      (v_disciplina_id, 'Diâmetro', 'diametro', 'text', 3, 0, false, true, 80),
      (v_disciplina_id, 'Material', 'material', 'text', 4, 0, false, true, 150),
      (v_disciplina_id, 'Schedule', 'schedule', 'text', 5, 0, false, true, 80),
      (v_disciplina_id, 'Fluido', 'fluido', 'text', 6, 0, false, true, 100),
      (v_disciplina_id, 'Soldas (un)', 'soldas', 'number', 7, 0, false, true, 80),
      (v_disciplina_id, 'Pol. Soldadas', 'pol_soldadas', 'decimal', 8, 2, false, true, 100)
    ON CONFLICT (disciplina_id, codigo) DO NOTHING;
  END IF;

  -- Elétrica
  INSERT INTO takeoff_disciplinas (empresa_id, nome, codigo, cor, icone, ativo)
  VALUES (p_empresa_id, 'Elétrica', 'ELE', '#F59E0B', 'zap', true)
  ON CONFLICT (empresa_id, codigo) DO NOTHING
  RETURNING id INTO v_disciplina_id;
  
  IF v_disciplina_id IS NOT NULL THEN
    INSERT INTO takeoff_colunas_config (disciplina_id, nome, codigo, tipo, ordem, casas_decimais, obrigatoria, visivel, largura, opcoes)
    VALUES
      (v_disciplina_id, 'Circuito', 'circuito', 'text', 1, 0, false, true, 120, NULL),
      (v_disciplina_id, 'Cabo', 'cabo', 'text', 2, 0, false, true, 150, NULL),
      (v_disciplina_id, 'Seção (mm²)', 'secao', 'decimal', 3, 2, false, true, 100, NULL),
      (v_disciplina_id, 'Tipo', 'tipo_cabo', 'select', 4, 0, false, true, 100, ARRAY['Força', 'Controle', 'Instrumentação', 'Aterramento']),
      (v_disciplina_id, 'Bandeja', 'bandeja', 'text', 5, 0, false, true, 100, NULL),
      (v_disciplina_id, 'Metragem', 'metragem', 'decimal', 6, 2, false, true, 100, NULL)
    ON CONFLICT (disciplina_id, codigo) DO NOTHING;
  END IF;

  -- Caldeiraria
  INSERT INTO takeoff_disciplinas (empresa_id, nome, codigo, cor, icone, ativo)
  VALUES (p_empresa_id, 'Caldeiraria', 'CAL', '#EF4444', 'box', true)
  ON CONFLICT (empresa_id, codigo) DO NOTHING
  RETURNING id INTO v_disciplina_id;
  
  IF v_disciplina_id IS NOT NULL THEN
    INSERT INTO takeoff_colunas_config (disciplina_id, nome, codigo, tipo, ordem, casas_decimais, obrigatoria, visivel, largura, unidade, opcoes)
    VALUES
      (v_disciplina_id, 'TAG Equipamento', 'tag_equip', 'text', 1, 0, false, true, 130, NULL, NULL),
      (v_disciplina_id, 'Peso (ton)', 'peso_ton', 'decimal', 2, 3, false, true, 100, 'ton', NULL),
      (v_disciplina_id, 'Área Pintura (m²)', 'area_pintura', 'decimal', 3, 2, false, true, 120, 'm²', NULL),
      (v_disciplina_id, 'Tipo Solda', 'tipo_solda', 'select', 4, 0, false, true, 100, NULL, ARRAY['TIG', 'MIG', 'Eletrodo', 'Arco Submerso'])
    ON CONFLICT (disciplina_id, codigo) DO NOTHING;
  END IF;

  -- Suporte
  INSERT INTO takeoff_disciplinas (empresa_id, nome, codigo, cor, icone, ativo)
  VALUES (p_empresa_id, 'Suporte', 'SUP', '#6B7280', 'layers', true)
  ON CONFLICT (empresa_id, codigo) DO NOTHING
  RETURNING id INTO v_disciplina_id;
  
  IF v_disciplina_id IS NOT NULL THEN
    INSERT INTO takeoff_colunas_config (disciplina_id, nome, codigo, tipo, ordem, casas_decimais, obrigatoria, visivel, largura, unidade)
    VALUES
      (v_disciplina_id, 'Tipo Suporte', 'tipo_suporte', 'text', 1, 0, false, true, 130, NULL),
      (v_disciplina_id, 'Perfil', 'perfil', 'text', 2, 0, false, true, 100, NULL),
      (v_disciplina_id, 'Comprimento (m)', 'comprimento', 'decimal', 3, 2, false, true, 120, 'm')
    ON CONFLICT (disciplina_id, codigo) DO NOTHING;
  END IF;

  -- Estrutura
  INSERT INTO takeoff_disciplinas (empresa_id, nome, codigo, cor, icone, ativo)
  VALUES (p_empresa_id, 'Estrutura', 'EST', '#10B981', 'building', true)
  ON CONFLICT (empresa_id, codigo) DO NOTHING
  RETURNING id INTO v_disciplina_id;
  
  IF v_disciplina_id IS NOT NULL THEN
    INSERT INTO takeoff_colunas_config (disciplina_id, nome, codigo, tipo, ordem, casas_decimais, obrigatoria, visivel, largura, unidade, opcoes)
    VALUES
      (v_disciplina_id, 'Peça', 'peca', 'text', 1, 0, false, true, 120, NULL, NULL),
      (v_disciplina_id, 'Perfil', 'perfil', 'text', 2, 0, false, true, 100, NULL, NULL),
      (v_disciplina_id, 'Comprimento (m)', 'comprimento', 'decimal', 3, 2, false, true, 120, 'm', NULL),
      (v_disciplina_id, 'Tratamento', 'tratamento', 'select', 4, 0, false, true, 120, NULL, ARRAY['Galvanizado', 'Pintado', 'Zincado', 'Natural'])
    ON CONFLICT (disciplina_id, codigo) DO NOTHING;
  END IF;

  -- Equipamentos
  INSERT INTO takeoff_disciplinas (empresa_id, nome, codigo, cor, icone, ativo)
  VALUES (p_empresa_id, 'Equipamentos', 'EQP', '#06B6D4', 'settings', true)
  ON CONFLICT (empresa_id, codigo) DO NOTHING
  RETURNING id INTO v_disciplina_id;
  
  IF v_disciplina_id IS NOT NULL THEN
    INSERT INTO takeoff_colunas_config (disciplina_id, nome, codigo, tipo, ordem, casas_decimais, obrigatoria, visivel, largura, unidade, opcoes)
    VALUES
      (v_disciplina_id, 'TAG', 'tag_equip', 'text', 1, 0, true, true, 120, NULL, NULL),
      (v_disciplina_id, 'Peso (ton)', 'peso_ton', 'decimal', 2, 3, false, true, 100, 'ton', NULL),
      (v_disciplina_id, 'Dimensões', 'dimensoes', 'text', 3, 0, false, true, 150, NULL, NULL),
      (v_disciplina_id, 'Tipo Montagem', 'tipo_montagem', 'select', 4, 0, false, true, 120, NULL, ARRAY['Içamento', 'Rigging', 'Manual', 'Rolamento'])
    ON CONFLICT (disciplina_id, codigo) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION initialize_takeoff_disciplinas(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_takeoff_disciplinas(UUID) TO anon;
