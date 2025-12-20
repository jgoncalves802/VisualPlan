-- VisionPlan Final Seed Data
-- Uses existing empresa, eps_nodes, projetos IDs

-- Existing IDs from database:
-- empresa: a0000001-0000-0000-0000-000000000001
-- eps_nodes: c0000001, c0000002, c0000003
-- projetos: d0000001, d0000002, d0000003

-- ========================================
-- USUARIOS - Use valid camada_governanca values
-- ========================================
INSERT INTO usuarios (id, nome, email, empresa_id, camada_governanca, perfil_acesso, ativo) VALUES
  ('b0000001-0000-0000-0000-000000000001'::uuid, 'João Silva', 'joao.silva@visionplan.com.br', 'a0000001-0000-0000-0000-000000000001'::uuid, 'PROPONENTE', 'admin', true),
  ('b0000002-0000-0000-0000-000000000002'::uuid, 'Maria Santos', 'maria.santos@visionplan.com.br', 'a0000001-0000-0000-0000-000000000001'::uuid, 'CONTRATADA', 'gerente', true),
  ('b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', 'carlos.lima@visionplan.com.br', 'a0000001-0000-0000-0000-000000000001'::uuid, 'CONTRATADA', 'operador', true),
  ('b0000004-0000-0000-0000-000000000004'::uuid, 'Ana Costa', 'ana.costa@visionplan.com.br', 'a0000001-0000-0000-0000-000000000001'::uuid, 'FISCALIZACAO', 'gerente', true),
  ('b0000005-0000-0000-0000-000000000005'::uuid, 'Pedro Souza', 'pedro.souza@visionplan.com.br', 'a0000001-0000-0000-0000-000000000001'::uuid, 'FISCALIZACAO', 'gerente', true),
  ('b0000006-0000-0000-0000-000000000006'::uuid, 'Fernanda Oliveira', 'fernanda.oliveira@visionplan.com.br', 'a0000001-0000-0000-0000-000000000001'::uuid, 'CONTRATADA', 'operador', true),
  ('b0000007-0000-0000-0000-000000000007'::uuid, 'Roberto Dias', 'roberto.dias@visionplan.com.br', 'a0000001-0000-0000-0000-000000000001'::uuid, 'CONTRATADA', 'operador', true),
  ('b0000008-0000-0000-0000-000000000008'::uuid, 'Luciana Ferreira', 'luciana.ferreira@visionplan.com.br', 'a0000001-0000-0000-0000-000000000001'::uuid, 'PROPONENTE', 'gerente', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- WBS NODES
-- ========================================
INSERT INTO wbs_nodes (id, eps_node_id, codigo, nome, descricao, nivel, ordem, ativo) VALUES
  ('e0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'WBS-001', 'Fundações', 'Trabalhos de fundação', 1, 1, true),
  ('e0000002-0000-0000-0000-000000000002'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'WBS-002', 'Estrutura', 'Estrutura de concreto armado', 1, 2, true),
  ('e0000003-0000-0000-0000-000000000003'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'WBS-003', 'Vedações', 'Alvenaria e divisórias', 1, 3, true),
  ('e0000004-0000-0000-0000-000000000004'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'WBS-004', 'Instalações', 'Instalações elétricas e hidráulicas', 1, 4, true),
  ('e0000005-0000-0000-0000-000000000005'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'WBS-005', 'Acabamentos', 'Revestimentos e pintura', 1, 5, true),
  ('e0000006-0000-0000-0000-000000000006'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid, 'WBS-006', 'Infraestrutura', 'Fundações e contenções', 1, 1, true),
  ('e0000007-0000-0000-0000-000000000007'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid, 'WBS-007', 'Superestrutura', 'Estrutura metálica e concreto', 1, 2, true),
  ('e0000008-0000-0000-0000-000000000008'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid, 'WBS-008', 'MEP', 'Instalações prediais', 1, 3, true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- ATIVIDADES DO CRONOGRAMA - Use valid tipo values
-- ========================================
INSERT INTO atividades_cronograma (id, projeto_id, codigo, nome, descricao, tipo, wbs_id, data_inicio, data_fim, duracao_dias, progresso, status, responsavel_id, responsavel_nome, empresa_id) VALUES
  ('f0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-001', 'Locação da Obra', 'Marcação topográfica', 'Tarefa', 'e0000001-0000-0000-0000-000000000001'::uuid, '2025-01-15', '2025-01-20', 5, 100, 'concluida', 'b0000002-0000-0000-0000-000000000002'::uuid, 'Maria Santos', 'a0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000002-0000-0000-0000-000000000002'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-002', 'Escavação Fundações', 'Escavação mecânica para blocos', 'Tarefa', 'e0000001-0000-0000-0000-000000000001'::uuid, '2025-01-21', '2025-02-10', 20, 100, 'concluida', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', 'a0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000003-0000-0000-0000-000000000003'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-003', 'Armação Fundações', 'Montagem de armaduras', 'Tarefa', 'e0000001-0000-0000-0000-000000000001'::uuid, '2025-02-11', '2025-02-28', 17, 85, 'em_andamento', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', 'a0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000004-0000-0000-0000-000000000004'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-004', 'Concretagem Fundações', 'Lançamento de concreto fck 30 MPa', 'Tarefa', 'e0000001-0000-0000-0000-000000000001'::uuid, '2025-03-01', '2025-03-15', 14, 0, 'nao_iniciada', 'b0000002-0000-0000-0000-000000000002'::uuid, 'Maria Santos', 'a0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000005-0000-0000-0000-000000000005'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-005', 'Forma Pilares 1º Pav', 'Montagem de formas', 'Tarefa', 'e0000002-0000-0000-0000-000000000002'::uuid, '2025-03-16', '2025-03-25', 9, 0, 'nao_iniciada', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', 'a0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000006-0000-0000-0000-000000000006'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-006', 'Armação Pilares 1º Pav', 'Montagem de armaduras', 'Tarefa', 'e0000002-0000-0000-0000-000000000002'::uuid, '2025-03-20', '2025-03-30', 10, 0, 'nao_iniciada', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', 'a0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000007-0000-0000-0000-000000000007'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-007', 'Concretagem Pilares 1º Pav', 'Lançamento de concreto fck 35 MPa', 'Marco', 'e0000002-0000-0000-0000-000000000002'::uuid, '2025-04-01', '2025-04-05', 4, 0, 'nao_iniciada', 'b0000002-0000-0000-0000-000000000002'::uuid, 'Maria Santos', 'a0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000008-0000-0000-0000-000000000008'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-008', 'Forma Laje 1º Pav', 'Montagem de escoramento', 'Tarefa', 'e0000002-0000-0000-0000-000000000002'::uuid, '2025-04-06', '2025-04-20', 14, 0, 'nao_iniciada', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', 'a0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000009-0000-0000-0000-000000000009'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-009', 'Instalações Hidráulicas', 'Tubulações de água', 'Tarefa', 'e0000004-0000-0000-0000-000000000004'::uuid, '2025-06-01', '2025-07-15', 44, 0, 'nao_iniciada', 'b0000007-0000-0000-0000-000000000007'::uuid, 'Roberto Dias', 'a0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000010-0000-0000-0000-000000000010'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-010', 'Instalações Elétricas', 'Eletrodutos e fiação', 'Tarefa', 'e0000004-0000-0000-0000-000000000004'::uuid, '2025-06-01', '2025-08-30', 90, 0, 'nao_iniciada', 'b0000007-0000-0000-0000-000000000007'::uuid, 'Roberto Dias', 'a0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000011-0000-0000-0000-000000000011'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-011', 'Revestimento Interno', 'Reboco e massa corrida', 'Tarefa', 'e0000005-0000-0000-0000-000000000005'::uuid, '2025-09-01', '2025-10-31', 60, 0, 'nao_iniciada', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', 'a0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000012-0000-0000-0000-000000000012'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-012', 'Pintura Interna', 'Pintura látex PVA', 'Tarefa', 'e0000005-0000-0000-0000-000000000005'::uuid, '2025-11-01', '2025-12-15', 44, 0, 'nao_iniciada', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', 'a0000001-0000-0000-0000-000000000001'::uuid),
  ('f0000013-0000-0000-0000-000000000013'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'ATIV-013', 'Entrega Final', 'Marco de conclusão do projeto', 'Marco', 'e0000005-0000-0000-0000-000000000005'::uuid, '2025-12-20', '2025-12-20', 0, 0, 'nao_iniciada', 'b0000001-0000-0000-0000-000000000001'::uuid, 'João Silva', 'a0000001-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- CHECKLIST TEMPLATES
-- ========================================
INSERT INTO checklist_templates (id, nome, categoria, itens, versao, empresa_id, created_by) VALUES
  ('11111111-1111-1111-1111-111111111101'::uuid, 'Inspeção de Segurança - Canteiro', 'seguranca', 
   '[{"id": "item-1", "descricao": "EPIs disponíveis e em bom estado", "obrigatorio": true},
     {"id": "item-2", "descricao": "Sinalização de segurança adequada", "obrigatorio": true},
     {"id": "item-3", "descricao": "Extintores de incêndio acessíveis", "obrigatorio": true},
     {"id": "item-4", "descricao": "Áreas de risco demarcadas", "obrigatorio": true},
     {"id": "item-5", "descricao": "Proteção de periferias instalada", "obrigatorio": true},
     {"id": "item-6", "descricao": "Treinamento de integração realizado", "obrigatorio": true}]',
   '2.1', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),
  
  ('11111111-1111-1111-1111-111111111102'::uuid, 'Controle de Qualidade - Concreto', 'qualidade',
   '[{"id": "item-1", "descricao": "Nota fiscal do concreto verificada", "obrigatorio": true},
     {"id": "item-2", "descricao": "Slump test realizado e conforme", "obrigatorio": true},
     {"id": "item-3", "descricao": "Corpos de prova moldados", "obrigatorio": true},
     {"id": "item-4", "descricao": "Armaduras conferidas antes do lançamento", "obrigatorio": true},
     {"id": "item-5", "descricao": "Adensamento executado corretamente", "obrigatorio": true},
     {"id": "item-6", "descricao": "Cura do concreto iniciada", "obrigatorio": true}]',
   '1.5', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
  
  ('11111111-1111-1111-1111-111111111103'::uuid, 'Inspeção de Alvenaria', 'qualidade',
   '[{"id": "item-1", "descricao": "Prumo verificado", "obrigatorio": true},
     {"id": "item-2", "descricao": "Nível verificado", "obrigatorio": true},
     {"id": "item-3", "descricao": "Espessura das juntas conforme projeto", "obrigatorio": true},
     {"id": "item-4", "descricao": "Amarração com estrutura executada", "obrigatorio": true},
     {"id": "item-5", "descricao": "Vergas e contravergas instaladas", "obrigatorio": true}]',
   '1.2', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- AUDITORIAS
-- ========================================
INSERT INTO auditorias (id, codigo, titulo, tipo, template_id, projeto_id, projeto_nome, local_auditoria, data_programada, data_realizacao, auditor_id, auditor_nome, status, itens, total_itens, itens_conformes, itens_nao_conformes, nota_geral, observacoes, empresa_id, created_by) VALUES
  ('22222222-2222-2222-2222-222222222201'::uuid, 'AUD-2025-001', 'Auditoria de Segurança - Janeiro', 'interna', '11111111-1111-1111-1111-111111111101'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Canteiro de obras', '2025-01-25', '2025-01-25', 'b0000005-0000-0000-0000-000000000005'::uuid, 'Pedro Souza', 'concluida',
   '[{"id": "ai-1", "itemId": "item-1", "descricao": "EPIs disponíveis e em bom estado", "status": "conforme"},
     {"id": "ai-2", "itemId": "item-2", "descricao": "Sinalização de segurança adequada", "status": "conforme"},
     {"id": "ai-3", "itemId": "item-3", "descricao": "Extintores de incêndio acessíveis", "status": "nao_conforme", "observacoes": "2 extintores vencidos"},
     {"id": "ai-4", "itemId": "item-4", "descricao": "Áreas de risco demarcadas", "status": "conforme"},
     {"id": "ai-5", "itemId": "item-5", "descricao": "Proteção de periferias instalada", "status": "conforme"},
     {"id": "ai-6", "itemId": "item-6", "descricao": "Treinamento de integração realizado", "status": "conforme"}]',
   6, 5, 1, 83.33, 'Auditoria concluída com uma não conformidade menor', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),

  ('22222222-2222-2222-2222-222222222202'::uuid, 'AUD-2025-002', 'Controle de Qualidade - Concretagem Blocos', 'interna', '11111111-1111-1111-1111-111111111102'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Fundações - Bloco A', '2025-02-15', '2025-02-15', 'b0000004-0000-0000-0000-000000000004'::uuid, 'Ana Costa', 'concluida',
   '[{"id": "ai-1", "itemId": "item-1", "descricao": "Nota fiscal do concreto verificada", "status": "conforme"},
     {"id": "ai-2", "itemId": "item-2", "descricao": "Slump test realizado e conforme", "status": "conforme"},
     {"id": "ai-3", "itemId": "item-3", "descricao": "Corpos de prova moldados", "status": "conforme"},
     {"id": "ai-4", "itemId": "item-4", "descricao": "Armaduras conferidas antes do lançamento", "status": "conforme"},
     {"id": "ai-5", "itemId": "item-5", "descricao": "Adensamento executado corretamente", "status": "conforme"},
     {"id": "ai-6", "itemId": "item-6", "descricao": "Cura do concreto iniciada", "status": "conforme"}]',
   6, 6, 0, 100.00, 'Processo de concretagem conforme especificações', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),

  ('22222222-2222-2222-2222-222222222203'::uuid, 'AUD-2025-003', 'Auditoria de Segurança - Fevereiro', 'interna', '11111111-1111-1111-1111-111111111101'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Canteiro de obras', '2025-02-28', NULL, 'b0000005-0000-0000-0000-000000000005'::uuid, 'Pedro Souza', 'em_andamento',
   '[{"id": "ai-1", "itemId": "item-1", "descricao": "EPIs disponíveis e em bom estado", "status": "conforme"},
     {"id": "ai-2", "itemId": "item-2", "descricao": "Sinalização de segurança adequada", "status": "conforme"},
     {"id": "ai-3", "itemId": "item-3", "descricao": "Extintores de incêndio acessíveis", "status": "conforme"}]',
   6, 3, 0, 50.00, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),

  ('22222222-2222-2222-2222-222222222204'::uuid, 'AUD-2025-004', 'Inspeção Alvenaria Térreo', 'interna', '11111111-1111-1111-1111-111111111103'::uuid, 'd0000002-0000-0000-0000-000000000002'::uuid, 'Centro Comercial Plaza', 'Pavimento Térreo', '2025-03-10', NULL, 'b0000002-0000-0000-0000-000000000002'::uuid, 'Maria Santos', 'programada',
   '[]', 5, 0, 0, NULL, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),

  ('22222222-2222-2222-2222-222222222205'::uuid, 'AUD-2025-005', 'Auditoria Externa ISO 9001', 'externa', '11111111-1111-1111-1111-111111111102'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Escritório e Canteiro', '2025-04-15', NULL, NULL, 'Auditor Externo', 'programada',
   '[]', 6, 0, 0, NULL, 'Auditoria de certificação do SGQ', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- SOLICITACOES DE MUDANCA
-- ========================================
INSERT INTO solicitacoes_mudanca (id, codigo, titulo, descricao, justificativa, tipo_mudanca, prioridade, solicitante, solicitante_id, data_solicitacao, status, projeto_id, projeto_nome, impacto_cronograma, impacto_custo, impacto_estimado, historico, empresa_id, created_by) VALUES
  ('33333333-3333-3333-3333-333333333301'::uuid, 'SM-2025-001', 'Alteração de Fundação - Bloco B', 'Mudança do tipo de fundação de sapata para estaca raiz devido a solo com baixa capacidade', 'Sondagem identificou camada de argila mole não prevista', 'escopo', 'alta', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid, '2025-01-28', 'aprovada', 'd0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 15, 85000.00, 'alto',
   '[{"id": "hist-1", "data": "2025-01-28T10:00:00Z", "acao": "submetida", "usuario": "Maria Santos"},
     {"id": "hist-2", "data": "2025-01-30T14:30:00Z", "acao": "em_analise", "usuario": "João Silva"},
     {"id": "hist-3", "data": "2025-02-05T09:00:00Z", "acao": "aprovada", "usuario": "João Silva"}]',
   'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),

  ('33333333-3333-3333-3333-333333333302'::uuid, 'SM-2025-002', 'Inclusão de Gerador de Emergência', 'Adicionar gerador diesel 500kVA para áreas comuns', 'Exigência do Corpo de Bombeiros para aprovação do AVCB', 'escopo', 'alta', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005'::uuid, '2025-02-10', 'em_analise', 'd0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 20, 180000.00, 'alto',
   '[{"id": "hist-1", "data": "2025-02-10T11:00:00Z", "acao": "submetida", "usuario": "Pedro Souza"},
     {"id": "hist-2", "data": "2025-02-12T16:00:00Z", "acao": "em_analise", "usuario": "João Silva"}]',
   'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),

  ('33333333-3333-3333-3333-333333333303'::uuid, 'SM-2025-003', 'Alteração de Acabamento - Fachada', 'Substituição de pastilha cerâmica por ACM nas fachadas', 'Redução de custo e prazo sem comprometer qualidade estética', 'escopo', 'media', 'Fernanda Oliveira', 'b0000006-0000-0000-0000-000000000006'::uuid, '2025-02-15', 'submetida', 'd0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', -10, -45000.00, 'medio',
   '[{"id": "hist-1", "data": "2025-02-15T08:30:00Z", "acao": "submetida", "usuario": "Fernanda Oliveira"}]',
   'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000006-0000-0000-0000-000000000006'::uuid),

  ('33333333-3333-3333-3333-333333333304'::uuid, 'SM-2025-004', 'Antecipação de Elevadores', 'Antecipar instalação de elevadores para uso durante obra', 'Facilitar transporte de materiais e melhorar produtividade', 'cronograma', 'baixa', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, '2025-02-20', 'rejeitada', 'd0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 0, 25000.00, 'baixo',
   '[{"id": "hist-1", "data": "2025-02-20T13:00:00Z", "acao": "submetida", "usuario": "Carlos Lima"},
     {"id": "hist-2", "data": "2025-02-22T10:00:00Z", "acao": "rejeitada", "usuario": "João Silva", "observacao": "Custo não justifica benefício"}]',
   'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),

  ('33333333-3333-3333-3333-333333333305'::uuid, 'SM-2025-005', 'Ampliação de Subsolos - Plaza', 'Adicionar um nível de subsolo para aumentar vagas de estacionamento', 'Demanda do cliente para atender norma de vagas/m²', 'escopo', 'alta', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, '2025-03-01', 'submetida', 'd0000002-0000-0000-0000-000000000002'::uuid, 'Centro Comercial Plaza', 60, 2500000.00, 'alto',
   '[{"id": "hist-1", "data": "2025-03-01T09:00:00Z", "acao": "submetida", "usuario": "João Silva"}]',
   'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- REUNIOES
-- ========================================
INSERT INTO reunioes (id, tipo, titulo, descricao, frequencia, participantes, pauta_fixa, proxima_data, hora_inicio, duracao, local, ativo, empresa_id, projeto_id, created_by) VALUES
  ('44444444-4444-4444-4444-444444444401'::uuid, 'daily', 'Daily Standup - Torre Alpha', 'Reunião diária de alinhamento da equipe', 'diaria', '{"João Silva", "Carlos Lima", "Maria Santos"}', '{"Verificação de segurança", "Status das frentes", "Impedimentos"}', '2025-12-21 07:30:00', '07:30', 15, 'Canteiro de obras', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('44444444-4444-4444-4444-444444444402'::uuid, 'weekly', 'Reunião Semanal de Coordenação', 'Reunião de coordenação técnica', 'semanal', '{"João Silva", "Maria Santos", "Ana Costa", "Pedro Souza", "Luciana Ferreira"}', '{"Avanço físico", "Restrições LPS", "Custos", "Plano de ação"}', '2025-12-23 14:00:00', '14:00', 90, 'Sala de reuniões - Sede', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('44444444-4444-4444-4444-444444444403'::uuid, 'monthly', 'Reunião Mensal com Cliente', 'Apresentação de resultados', 'mensal', '{"João Silva", "Maria Santos", "Cliente"}', '{"Avanço físico-financeiro", "Pendências", "Projeções"}', '2025-12-28 10:00:00', '10:00', 120, 'Escritório do Cliente', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('44444444-4444-4444-4444-444444444404'::uuid, 'weekly', 'Reunião de Segurança', 'Discussão de indicadores de segurança', 'semanal', '{"Pedro Souza", "Carlos Lima"}', '{"Incidentes", "Indicadores", "DDS", "Inspeções"}', '2025-12-22 08:00:00', '08:00', 60, 'Canteiro de obras', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),
  
  ('44444444-4444-4444-4444-444444444405'::uuid, 'biweekly', 'Reunião de Qualidade', 'Análise de não conformidades', 'quinzenal', '{"Ana Costa", "Maria Santos", "Carlos Lima"}', '{"Auditorias", "Ações corretivas", "Indicadores", "Inspeções"}', '2025-12-26 15:00:00', '15:00', 60, 'Sala de reuniões - Sede', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- RESTRICOES ISHIKAWA
-- ========================================
INSERT INTO restricoes_ishikawa (id, codigo, descricao, categoria, status, atividade_id, atividade_nome, wbs_id, wbs_nome, eps_id, eps_nome, data_criacao, data_prevista, data_conclusao, responsavel, responsavel_id, impacto_caminho_critico, duracao_atividade_impactada, dias_atraso, score_impacto, reincidente, empresa_id, projeto_id, created_by) VALUES
  ('55555555-5555-5555-5555-555555555501'::uuid, 'RI-001', 'Atraso na entrega de aço CA-50', 'material', 'vencida', 'f0000003-0000-0000-0000-000000000003'::uuid, 'Armação Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-01', '2025-02-08', NULL, 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, true, 17, 12, 68, true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid),
  
  ('55555555-5555-5555-5555-555555555502'::uuid, 'RI-002', 'Equipamento de sondagem indisponível', 'maquina', 'concluida', 'f0000002-0000-0000-0000-000000000002'::uuid, 'Escavação Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-01-20', '2025-01-25', '2025-01-24', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, false, 20, 0, 15, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
  
  ('55555555-5555-5555-5555-555555555503'::uuid, 'RI-003', 'Falta de mão de obra qualificada para armação', 'mao_de_obra', 'atrasada', 'f0000003-0000-0000-0000-000000000003'::uuid, 'Armação Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-05', '2025-02-12', NULL, 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, true, 17, 8, 55, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
  
  ('55555555-5555-5555-5555-555555555504'::uuid, 'RI-004', 'Licença ambiental pendente', 'meio_ambiente', 'em_execucao', 'f0000004-0000-0000-0000-000000000004'::uuid, 'Concretagem Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-10', '2025-02-28', NULL, 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, true, 14, 0, 42, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('55555555-5555-5555-5555-555555555505'::uuid, 'RI-005', 'Projeto estrutural com inconsistências', 'metodo', 'no_prazo', 'f0000005-0000-0000-0000-000000000005'::uuid, 'Forma Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002'::uuid, 'Estrutura', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-15', '2025-03-10', NULL, 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid, false, 9, 0, 22, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),
  
  ('55555555-5555-5555-5555-555555555506'::uuid, 'RI-006', 'Ensaio de resistência do concreto reprovado', 'medida', 'vencida', 'f0000004-0000-0000-0000-000000000004'::uuid, 'Concretagem Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-08', '2025-02-10', NULL, 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, true, 14, 15, 72, true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
  
  ('55555555-5555-5555-5555-555555555507'::uuid, 'RI-007', 'Chuvas intensas paralisando escavação', 'meio_ambiente', 'concluida', 'f0000002-0000-0000-0000-000000000002'::uuid, 'Escavação Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-01-25', '2025-01-30', '2025-01-29', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, false, 20, 0, 18, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
  
  ('55555555-5555-5555-5555-555555555508'::uuid, 'RI-008', 'Falta de procedimento para cura de concreto', 'metodo', 'em_execucao', 'f0000004-0000-0000-0000-000000000004'::uuid, 'Concretagem Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-12', '2025-02-20', NULL, 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, false, 14, 0, 25, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
  
  ('55555555-5555-5555-5555-555555555509'::uuid, 'RI-009', 'Grua com capacidade insuficiente', 'maquina', 'no_prazo', 'f0000006-0000-0000-0000-000000000006'::uuid, 'Armação Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002'::uuid, 'Estrutura', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-18', '2025-03-15', NULL, 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, true, 10, 0, 35, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000007-0000-0000-0000-000000000007'::uuid),
  
  ('55555555-5555-5555-5555-555555555510'::uuid, 'RI-010', 'Treinamento de NR-35 pendente', 'mao_de_obra', 'atrasada', 'f0000005-0000-0000-0000-000000000005'::uuid, 'Forma Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002'::uuid, 'Estrutura', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-20', '2025-03-01', NULL, 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005'::uuid, false, 9, 5, 28, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),
  
  ('55555555-5555-5555-5555-555555555511'::uuid, 'RI-011', 'Fornecedor de formas com atraso', 'material', 'em_execucao', 'f0000005-0000-0000-0000-000000000005'::uuid, 'Forma Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002'::uuid, 'Estrutura', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-22', '2025-03-08', NULL, 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, true, 9, 0, 45, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid),
  
  ('55555555-5555-5555-5555-555555555512'::uuid, 'RI-012', 'Calibração de equipamentos de topografia', 'medida', 'concluida', 'f0000001-0000-0000-0000-000000000001'::uuid, 'Locação da Obra', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-01-14', '2025-01-16', '2025-01-15', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid, false, 5, 0, 8, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- ACOES 5W2H
-- ========================================
INSERT INTO acoes_5w2h (id, codigo, o_que, por_que, onde, quando, quem, quem_id, como, quanto, status, prioridade, percentual_concluido, origem, origem_id, restricao_lps_id, empresa_id, projeto_id, created_by) VALUES
  ('66666666-6666-6666-6666-666666666601'::uuid, '5W2H-001', 'Negociar entrega antecipada de aço CA-50', 'Mitigar atraso crítico na armação de fundações', 'Fornecedor - Gerdau', '2025-02-05', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, 'Reunião virtual com gerente comercial', 5000.00, 'em_andamento', 'alta', 50, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555501'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid),
  
  ('66666666-6666-6666-6666-666666666602'::uuid, '5W2H-002', 'Recrutar 5 armadores qualificados', 'Recuperar atraso e manter cronograma', 'Canteiro de obras', '2025-02-10', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Contato com sindicato e parceiros', 15000.00, 'concluida', 'alta', 100, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555503'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
  
  ('66666666-6666-6666-6666-666666666603'::uuid, '5W2H-003', 'Obter licença ambiental complementar', 'Cumprir exigência legal para concretagem', 'IBAMA / Secretaria de Meio Ambiente', '2025-02-25', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, 'Protocolar documentação e agendar vistoria', 3500.00, 'em_andamento', 'alta', 75, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555504'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('66666666-6666-6666-6666-666666666604'::uuid, '5W2H-004', 'Substituir 2 extintores vencidos', 'Corrigir não conformidade de auditoria', 'Canteiro de obras', '2025-01-30', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005'::uuid, 'Solicitar ao fornecedor de equipamentos', 450.00, 'concluida', 'media', 100, 'auditoria', '22222222-2222-2222-2222-222222222201'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),
  
  ('66666666-6666-6666-6666-666666666605'::uuid, '5W2H-005', 'Criar PO para processo de cura úmida', 'Padronizar processo e garantir qualidade', 'Escritório técnico', '2025-02-18', 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, 'Desenvolver procedimento baseado em NBR 14931', 0.00, 'em_andamento', 'media', 60, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555508'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
  
  ('66666666-6666-6666-6666-666666666606'::uuid, '5W2H-006', 'Realizar treinamento de trabalho em altura', 'Habilitar equipe para serviços elevados', 'Centro de treinamento', '2025-03-05', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005'::uuid, 'Contratar empresa certificadora', 8500.00, 'pendente', 'alta', 0, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555510'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),
  
  ('66666666-6666-6666-6666-666666666607'::uuid, '5W2H-007', 'Substituir grua por modelo de 10t', 'Atender demanda de içamento', 'Canteiro de obras', '2025-03-10', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, 'Negociar com locadoras', 45000.00, 'pendente', 'alta', 0, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555509'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000007-0000-0000-0000-000000000007'::uuid),
  
  ('66666666-6666-6666-6666-666666666608'::uuid, '5W2H-008', 'Solicitar revisão ao projetista', 'Eliminar conflitos projeto/execução', 'Escritório de projeto', '2025-03-01', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid, 'Reunião técnica e envio de RFI', 2500.00, 'em_andamento', 'media', 40, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555505'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),
  
  ('66666666-6666-6666-6666-666666666609'::uuid, '5W2H-009', 'Analisar falha em corpos de prova', 'Identificar causa raiz', 'Laboratório de ensaios', '2025-02-12', 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, 'Reunir com concreteira', 1200.00, 'concluida', 'alta', 100, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555506'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
  
  ('66666666-6666-6666-6666-666666666610'::uuid, '5W2H-010', 'Antecipar entrega de kit de formas', 'Evitar impacto no início de estrutura', 'Fornecedor - Formaço', '2025-02-28', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, 'Negociação com pagamento antecipado', 12000.00, 'em_andamento', 'alta', 30, 'restricao_ishikawa', '55555555-5555-5555-5555-555555555511'::uuid, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- RESTRICOES LPS
-- ========================================
INSERT INTO restricoes_lps (id, empresa_id, projeto_id, codigo, descricao, categoria, status, prioridade, responsavel_id, responsavel_nome, data_identificacao, data_prevista, data_resolucao, atividade_id, wbs_id, impacto_cronograma, impacto_custo, observacoes, created_by) VALUES
  ('77777777-7777-7777-7777-777777777701'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'LPS-001', 'Aguardando liberação de projeto revisado', 'projeto', 'identificada', 'alta', 'b0000002-0000-0000-0000-000000000002'::uuid, 'Maria Santos', '2025-02-20', '2025-03-05', NULL, 'f0000005-0000-0000-0000-000000000005'::uuid, 'e0000002-0000-0000-0000-000000000002'::uuid, 5, 0, NULL, 'b0000008-0000-0000-0000-000000000008'::uuid),
  
  ('77777777-7777-7777-7777-777777777702'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'LPS-002', 'Material de formas em trânsito', 'material', 'em_tratamento', 'alta', 'b0000001-0000-0000-0000-000000000001'::uuid, 'João Silva', '2025-02-22', '2025-03-08', NULL, 'f0000005-0000-0000-0000-000000000005'::uuid, 'e0000002-0000-0000-0000-000000000002'::uuid, 7, 12000, NULL, 'b0000008-0000-0000-0000-000000000008'::uuid),
  
  ('77777777-7777-7777-7777-777777777703'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'LPS-003', 'Equipe de armação subdimensionada', 'mao_de_obra', 'removida', 'alta', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', '2025-02-05', '2025-02-10', '2025-02-09', 'f0000003-0000-0000-0000-000000000003'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 3, 15000, 'Contratação emergencial realizada', 'b0000003-0000-0000-0000-000000000003'::uuid),
  
  ('77777777-7777-7777-7777-777777777704'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'LPS-004', 'Equipamento de vibração indisponível', 'equipamento', 'identificada', 'media', 'b0000007-0000-0000-0000-000000000007'::uuid, 'Roberto Dias', '2025-02-25', '2025-02-28', NULL, 'f0000004-0000-0000-0000-000000000004'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 2, 3000, NULL, 'b0000007-0000-0000-0000-000000000007'::uuid),
  
  ('77777777-7777-7777-7777-777777777705'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'LPS-005', 'Condições climáticas adversas previstas', 'outros', 'em_tratamento', 'media', 'b0000008-0000-0000-0000-000000000008'::uuid, 'Luciana Ferreira', '2025-02-26', '2025-03-02', NULL, 'f0000004-0000-0000-0000-000000000004'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 3, 0, 'Monitorando previsão do tempo', 'b0000008-0000-0000-0000-000000000008'::uuid),
  
  ('77777777-7777-7777-7777-777777777706'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'LPS-006', 'Liberação de área pelo cliente pendente', 'projeto', 'identificada', 'baixa', 'b0000001-0000-0000-0000-000000000001'::uuid, 'João Silva', '2025-02-28', '2025-05-20', NULL, 'f0000009-0000-0000-0000-000000000009'::uuid, 'e0000004-0000-0000-0000-000000000004'::uuid, 0, 0, 'Atividade futura - acompanhar', 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('77777777-7777-7777-7777-777777777707'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'LPS-007', 'Contrato com subempreiteiro em negociação', 'mao_de_obra', 'em_tratamento', 'media', 'b0000001-0000-0000-0000-000000000001'::uuid, 'João Silva', '2025-02-28', '2025-08-15', NULL, 'f0000011-0000-0000-0000-000000000011'::uuid, 'e0000005-0000-0000-0000-000000000005'::uuid, 0, 0, 'Negociação em andamento', 'b0000001-0000-0000-0000-000000000001'::uuid),
  
  ('77777777-7777-7777-7777-777777777708'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'LPS-008', 'Definição de cores pelo cliente pendente', 'projeto', 'identificada', 'baixa', 'b0000006-0000-0000-0000-000000000006'::uuid, 'Fernanda Oliveira', '2025-02-28', '2025-10-10', NULL, 'f0000012-0000-0000-0000-000000000012'::uuid, 'e0000005-0000-0000-0000-000000000005'::uuid, 0, 0, 'Reunião agendada com cliente', 'b0000006-0000-0000-0000-000000000006'::uuid)
ON CONFLICT (id) DO NOTHING;
