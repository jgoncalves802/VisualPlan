-- VisionPlan Seed Data
-- Realistic construction project management data

-- Clear existing data (in reverse order of dependencies)
DELETE FROM acoes_5w2h;
DELETE FROM restricoes_lps;
DELETE FROM restricoes_ishikawa;
DELETE FROM pautas_reuniao;
DELETE FROM reunioes;
DELETE FROM solicitacoes_mudanca;
DELETE FROM auditorias;
DELETE FROM checklist_templates;
DELETE FROM atividades_cronograma;
DELETE FROM wbs_nodes;
DELETE FROM projetos;
DELETE FROM eps_nodes;
DELETE FROM usuarios;
DELETE FROM empresas;

-- ========================================
-- EMPRESA (Tenant)
-- ========================================
INSERT INTO empresas (id, nome, cnpj, ativo) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Construtora VisionPlan Ltda', '12.345.678/0001-90', true);

-- ========================================
-- USUARIOS (Users)
-- ========================================
INSERT INTO usuarios (id, nome, email, cargo, empresa_id) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'João Silva', 'joao.silva@visionplan.com.br', 'Gerente de Projetos', 'a0000001-0000-0000-0000-000000000001'),
  ('b0000002-0000-0000-0000-000000000002', 'Maria Santos', 'maria.santos@visionplan.com.br', 'Engenheira Civil', 'a0000001-0000-0000-0000-000000000001'),
  ('b0000003-0000-0000-0000-000000000003', 'Carlos Lima', 'carlos.lima@visionplan.com.br', 'Mestre de Obras', 'a0000001-0000-0000-0000-000000000001'),
  ('b0000004-0000-0000-0000-000000000004', 'Ana Costa', 'ana.costa@visionplan.com.br', 'Coordenadora de Qualidade', 'a0000001-0000-0000-0000-000000000001'),
  ('b0000005-0000-0000-0000-000000000005', 'Pedro Souza', 'pedro.souza@visionplan.com.br', 'Engenheiro de Segurança', 'a0000001-0000-0000-0000-000000000001'),
  ('b0000006-0000-0000-0000-000000000006', 'Fernanda Oliveira', 'fernanda.oliveira@visionplan.com.br', 'Arquiteta', 'a0000001-0000-0000-0000-000000000001'),
  ('b0000007-0000-0000-0000-000000000007', 'Roberto Dias', 'roberto.dias@visionplan.com.br', 'Técnico em Edificações', 'a0000001-0000-0000-0000-000000000001'),
  ('b0000008-0000-0000-0000-000000000008', 'Luciana Ferreira', 'luciana.ferreira@visionplan.com.br', 'Planejadora', 'a0000001-0000-0000-0000-000000000001');

-- ========================================
-- EPS NODES (Enterprise Project Structure)
-- ========================================
INSERT INTO eps_nodes (id, nome, codigo, parent_id, empresa_id) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Residencial', 'RES', NULL, 'a0000001-0000-0000-0000-000000000001'),
  ('c0000002-0000-0000-0000-000000000002', 'Comercial', 'COM', NULL, 'a0000001-0000-0000-0000-000000000001'),
  ('c0000003-0000-0000-0000-000000000003', 'Industrial', 'IND', NULL, 'a0000001-0000-0000-0000-000000000001');

-- ========================================
-- PROJETOS (Projects)
-- ========================================
INSERT INTO projetos (id, nome, codigo, descricao, eps_id, empresa_id, status, data_inicio, data_termino) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Residencial Torre Alpha', 'PROJ-001', 'Edifício residencial de 20 andares com 80 unidades', 'c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'em_andamento', '2025-01-15', '2026-12-31'),
  ('d0000002-0000-0000-0000-000000000002', 'Centro Comercial Plaza', 'PROJ-002', 'Shopping center com 3 pisos e 120 lojas', 'c0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'em_andamento', '2025-03-01', '2027-06-30'),
  ('d0000003-0000-0000-0000-000000000003', 'Galpão Logístico Beta', 'PROJ-003', 'Centro de distribuição com 15.000m²', 'c0000003-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'planejamento', '2025-06-01', '2026-08-31');

-- ========================================
-- WBS NODES (Work Breakdown Structure)
-- ========================================
INSERT INTO wbs_nodes (id, nome, codigo, parent_id, projeto_id, empresa_id) VALUES
  -- Projeto 1 - Torre Alpha
  ('e0000001-0000-0000-0000-000000000001', 'Fundações', 'WBS-001', NULL, 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001'),
  ('e0000002-0000-0000-0000-000000000002', 'Estrutura', 'WBS-002', NULL, 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001'),
  ('e0000003-0000-0000-0000-000000000003', 'Vedações', 'WBS-003', NULL, 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001'),
  ('e0000004-0000-0000-0000-000000000004', 'Instalações', 'WBS-004', NULL, 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001'),
  ('e0000005-0000-0000-0000-000000000005', 'Acabamentos', 'WBS-005', NULL, 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001'),
  -- Projeto 2 - Plaza
  ('e0000006-0000-0000-0000-000000000006', 'Infraestrutura', 'WBS-006', NULL, 'd0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001'),
  ('e0000007-0000-0000-0000-000000000007', 'Superestrutura', 'WBS-007', NULL, 'd0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001'),
  ('e0000008-0000-0000-0000-000000000008', 'MEP', 'WBS-008', NULL, 'd0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001');

-- ========================================
-- ATIVIDADES DO CRONOGRAMA
-- ========================================
INSERT INTO atividades_cronograma (id, codigo, nome, descricao, wbs_id, projeto_id, empresa_id, data_inicio, data_termino, duracao, percentual_completo, status) VALUES
  -- Fundações
  ('f0000001-0000-0000-0000-000000000001', 'ATIV-001', 'Locação da Obra', 'Marcação topográfica e locação dos elementos estruturais', 'e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '2025-01-15', '2025-01-20', 5, 100, 'concluida'),
  ('f0000002-0000-0000-0000-000000000002', 'ATIV-002', 'Escavação Fundações', 'Escavação mecânica para blocos e baldrames', 'e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '2025-01-21', '2025-02-10', 20, 100, 'concluida'),
  ('f0000003-0000-0000-0000-000000000003', 'ATIV-003', 'Armação Fundações', 'Montagem de armaduras dos blocos e baldrames', 'e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '2025-02-11', '2025-02-28', 17, 85, 'em_andamento'),
  ('f0000004-0000-0000-0000-000000000004', 'ATIV-004', 'Concretagem Fundações', 'Lançamento de concreto fck 30 MPa', 'e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '2025-03-01', '2025-03-15', 14, 0, 'nao_iniciada'),
  -- Estrutura
  ('f0000005-0000-0000-0000-000000000005', 'ATIV-005', 'Forma Pilares 1º Pav', 'Montagem de formas para pilares do 1º pavimento', 'e0000002-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '2025-03-16', '2025-03-25', 9, 0, 'nao_iniciada'),
  ('f0000006-0000-0000-0000-000000000006', 'ATIV-006', 'Armação Pilares 1º Pav', 'Montagem de armaduras dos pilares', 'e0000002-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '2025-03-20', '2025-03-30', 10, 0, 'nao_iniciada'),
  ('f0000007-0000-0000-0000-000000000007', 'ATIV-007', 'Concretagem Pilares 1º Pav', 'Lançamento de concreto fck 35 MPa', 'e0000002-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '2025-04-01', '2025-04-05', 4, 0, 'nao_iniciada'),
  ('f0000008-0000-0000-0000-000000000008', 'ATIV-008', 'Forma Laje 1º Pav', 'Montagem de escoramento e forma da laje', 'e0000002-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '2025-04-06', '2025-04-20', 14, 0, 'nao_iniciada'),
  -- Instalações
  ('f0000009-0000-0000-0000-000000000009', 'ATIV-009', 'Instalações Hidráulicas', 'Tubulações de água fria e quente', 'e0000004-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '2025-06-01', '2025-07-15', 44, 0, 'nao_iniciada'),
  ('f0000010-0000-0000-0000-000000000010', 'ATIV-010', 'Instalações Elétricas', 'Eletrodutos e fiação', 'e0000004-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '2025-06-01', '2025-08-30', 90, 0, 'nao_iniciada'),
  -- Acabamentos
  ('f0000011-0000-0000-0000-000000000011', 'ATIV-011', 'Revestimento Interno', 'Reboco e massa corrida', 'e0000005-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '2025-09-01', '2025-10-31', 60, 0, 'nao_iniciada'),
  ('f0000012-0000-0000-0000-000000000012', 'ATIV-012', 'Pintura Interna', 'Pintura látex PVA', 'e0000005-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '2025-11-01', '2025-12-15', 44, 0, 'nao_iniciada');

-- ========================================
-- CHECKLIST TEMPLATES
-- ========================================
INSERT INTO checklist_templates (id, nome, categoria, itens, versao, empresa_id, created_by) VALUES
  ('g0000001-0000-0000-0000-000000000001', 'Inspeção de Segurança - Canteiro', 'seguranca', 
   '[{"id": "item-1", "descricao": "EPIs disponíveis e em bom estado", "obrigatorio": true, "categoria": "seguranca"},
     {"id": "item-2", "descricao": "Sinalização de segurança adequada", "obrigatorio": true, "categoria": "seguranca"},
     {"id": "item-3", "descricao": "Extintores de incêndio acessíveis", "obrigatorio": true, "categoria": "seguranca"},
     {"id": "item-4", "descricao": "Áreas de risco demarcadas", "obrigatorio": true, "categoria": "seguranca"},
     {"id": "item-5", "descricao": "Proteção de periferias instalada", "obrigatorio": true, "categoria": "seguranca"},
     {"id": "item-6", "descricao": "Treinamento de integração realizado", "obrigatorio": true, "categoria": "seguranca"}]',
   '2.1', 'a0000001-0000-0000-0000-000000000001', 'b0000005-0000-0000-0000-000000000005'),
  
  ('g0000002-0000-0000-0000-000000000002', 'Controle de Qualidade - Concreto', 'qualidade',
   '[{"id": "item-1", "descricao": "Nota fiscal do concreto verificada", "obrigatorio": true, "categoria": "qualidade"},
     {"id": "item-2", "descricao": "Slump test realizado e conforme", "obrigatorio": true, "categoria": "qualidade"},
     {"id": "item-3", "descricao": "Corpos de prova moldados", "obrigatorio": true, "categoria": "qualidade"},
     {"id": "item-4", "descricao": "Armaduras conferidas antes do lançamento", "obrigatorio": true, "categoria": "qualidade"},
     {"id": "item-5", "descricao": "Adensamento executado corretamente", "obrigatorio": true, "categoria": "qualidade"},
     {"id": "item-6", "descricao": "Cura do concreto iniciada", "obrigatorio": true, "categoria": "qualidade"},
     {"id": "item-7", "descricao": "Temperatura ambiente registrada", "obrigatorio": false, "categoria": "qualidade"}]',
   '1.5', 'a0000001-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000004'),
  
  ('g0000003-0000-0000-0000-000000000003', 'Inspeção de Alvenaria', 'qualidade',
   '[{"id": "item-1", "descricao": "Prumo verificado", "obrigatorio": true, "categoria": "qualidade"},
     {"id": "item-2", "descricao": "Nível verificado", "obrigatorio": true, "categoria": "qualidade"},
     {"id": "item-3", "descricao": "Espessura das juntas conforme projeto", "obrigatorio": true, "categoria": "qualidade"},
     {"id": "item-4", "descricao": "Amarração com estrutura executada", "obrigatorio": true, "categoria": "qualidade"},
     {"id": "item-5", "descricao": "Vergas e contravergas instaladas", "obrigatorio": true, "categoria": "qualidade"}]',
   '1.2', 'a0000001-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000004'),
  
  ('g0000004-0000-0000-0000-000000000004', 'Verificação de Instalações Elétricas', 'tecnica',
   '[{"id": "item-1", "descricao": "Eletrodutos instalados conforme projeto", "obrigatorio": true, "categoria": "tecnica"},
     {"id": "item-2", "descricao": "Caixas de passagem posicionadas", "obrigatorio": true, "categoria": "tecnica"},
     {"id": "item-3", "descricao": "Quadros de distribuição conferidos", "obrigatorio": true, "categoria": "tecnica"},
     {"id": "item-4", "descricao": "Aterramento executado", "obrigatorio": true, "categoria": "tecnica"},
     {"id": "item-5", "descricao": "Teste de continuidade realizado", "obrigatorio": true, "categoria": "tecnica"}]',
   '1.0', 'a0000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002');

-- ========================================
-- AUDITORIAS
-- ========================================
INSERT INTO auditorias (id, codigo, titulo, descricao, checklist_id, checklist_nome, projeto_id, projeto_nome, tipo, responsavel, responsavel_id, data_auditoria, status, itens, percentual_conformidade, nao_conformidades, empresa_id, created_by) VALUES
  ('h0000001-0000-0000-0000-000000000001', 'AUD-2025-001', 'Auditoria de Segurança - Janeiro', 'Inspeção mensal de segurança do canteiro de obras', 'g0000001-0000-0000-0000-000000000001', 'Inspeção de Segurança - Canteiro', 'd0000001-0000-0000-0000-000000000001', 'Residencial Torre Alpha', 'interna', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005', '2025-01-25', 'concluida',
   '[{"id": "ai-1", "itemId": "item-1", "descricao": "EPIs disponíveis e em bom estado", "status": "conforme", "observacoes": "Todos os EPIs em estoque adequado"},
     {"id": "ai-2", "itemId": "item-2", "descricao": "Sinalização de segurança adequada", "status": "conforme", "observacoes": null},
     {"id": "ai-3", "itemId": "item-3", "descricao": "Extintores de incêndio acessíveis", "status": "nao_conforme", "observacoes": "2 extintores com validade vencida", "severidade": "media", "acaoCorretiva": "Substituir extintores vencidos"},
     {"id": "ai-4", "itemId": "item-4", "descricao": "Áreas de risco demarcadas", "status": "conforme", "observacoes": null},
     {"id": "ai-5", "itemId": "item-5", "descricao": "Proteção de periferias instalada", "status": "conforme", "observacoes": null},
     {"id": "ai-6", "itemId": "item-6", "descricao": "Treinamento de integração realizado", "status": "conforme", "observacoes": null}]',
   83.33, 1, 'a0000001-0000-0000-0000-000000000001', 'b0000005-0000-0000-0000-000000000005'),

  ('h0000002-0000-0000-0000-000000000002', 'AUD-2025-002', 'Controle de Qualidade - Concretagem Blocos', 'Verificação do processo de concretagem das fundações', 'g0000002-0000-0000-0000-000000000002', 'Controle de Qualidade - Concreto', 'd0000001-0000-0000-0000-000000000001', 'Residencial Torre Alpha', 'interna', 'Ana Costa', 'b0000004-0000-0000-0000-000000000004', '2025-02-15', 'concluida',
   '[{"id": "ai-1", "itemId": "item-1", "descricao": "Nota fiscal do concreto verificada", "status": "conforme", "observacoes": "NF 45678 - Concreteira ABC"},
     {"id": "ai-2", "itemId": "item-2", "descricao": "Slump test realizado e conforme", "status": "conforme", "observacoes": "Slump: 12cm - Dentro do especificado"},
     {"id": "ai-3", "itemId": "item-3", "descricao": "Corpos de prova moldados", "status": "conforme", "observacoes": "6 CPs moldados - Lote 2025-023"},
     {"id": "ai-4", "itemId": "item-4", "descricao": "Armaduras conferidas antes do lançamento", "status": "conforme", "observacoes": null},
     {"id": "ai-5", "itemId": "item-5", "descricao": "Adensamento executado corretamente", "status": "conforme", "observacoes": null},
     {"id": "ai-6", "itemId": "item-6", "descricao": "Cura do concreto iniciada", "status": "conforme", "observacoes": "Cura úmida iniciada imediatamente"},
     {"id": "ai-7", "itemId": "item-7", "descricao": "Temperatura ambiente registrada", "status": "conforme", "observacoes": "28°C às 09:00h"}]',
   100.00, 0, 'a0000001-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000004'),

  ('h0000003-0000-0000-0000-000000000003', 'AUD-2025-003', 'Auditoria de Segurança - Fevereiro', 'Inspeção mensal de segurança do canteiro', 'g0000001-0000-0000-0000-000000000001', 'Inspeção de Segurança - Canteiro', 'd0000001-0000-0000-0000-000000000001', 'Residencial Torre Alpha', 'interna', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005', '2025-02-28', 'em_andamento',
   '[{"id": "ai-1", "itemId": "item-1", "descricao": "EPIs disponíveis e em bom estado", "status": "conforme", "observacoes": null},
     {"id": "ai-2", "itemId": "item-2", "descricao": "Sinalização de segurança adequada", "status": "conforme", "observacoes": null},
     {"id": "ai-3", "itemId": "item-3", "descricao": "Extintores de incêndio acessíveis", "status": "conforme", "observacoes": "Extintores substituídos conforme ação corretiva anterior"},
     {"id": "ai-4", "itemId": "item-4", "descricao": "Áreas de risco demarcadas", "status": "pendente", "observacoes": null},
     {"id": "ai-5", "itemId": "item-5", "descricao": "Proteção de periferias instalada", "status": "pendente", "observacoes": null},
     {"id": "ai-6", "itemId": "item-6", "descricao": "Treinamento de integração realizado", "status": "pendente", "observacoes": null}]',
   50.00, 0, 'a0000001-0000-0000-0000-000000000001', 'b0000005-0000-0000-0000-000000000005'),

  ('h0000004-0000-0000-0000-000000000004', 'AUD-2025-004', 'Inspeção Alvenaria Térreo', 'Verificação de qualidade da alvenaria do pavimento térreo', 'g0000003-0000-0000-0000-000000000003', 'Inspeção de Alvenaria', 'd0000002-0000-0000-0000-000000000002', 'Centro Comercial Plaza', 'interna', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002', '2025-03-10', 'programada',
   '[]', NULL, 0, 'a0000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002'),

  ('h0000005-0000-0000-0000-000000000005', 'AUD-2025-005', 'Auditoria Externa ISO 9001', 'Auditoria de certificação do SGQ', 'g0000002-0000-0000-0000-000000000002', 'Controle de Qualidade - Concreto', 'd0000001-0000-0000-0000-000000000001', 'Residencial Torre Alpha', 'externa', 'Auditor Externo', NULL, '2025-04-15', 'programada',
   '[]', NULL, 0, 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001');

-- ========================================
-- SOLICITACOES DE MUDANCA
-- ========================================
INSERT INTO solicitacoes_mudanca (id, codigo, titulo, descricao, justificativa, tipo_mudanca, prioridade, solicitante, solicitante_id, data_solicitacao, status, projeto_id, projeto_nome, impacto_cronograma, impacto_custo, impacto_estimado, historico, empresa_id, created_by) VALUES
  ('i0000001-0000-0000-0000-000000000001', 'SM-2025-001', 'Alteração de Fundação - Bloco B', 'Mudança do tipo de fundação de sapata para estaca raiz devido a solo com baixa capacidade de carga', 'Sondagem adicional identificou camada de argila mole não prevista no projeto original', 'escopo', 'alta', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002', '2025-01-28', 'aprovada', 'd0000001-0000-0000-0000-000000000001', 'Residencial Torre Alpha', 15, 85000.00, 'alto',
   '[{"id": "hist-1", "data": "2025-01-28T10:00:00Z", "acao": "submetida", "usuario": "Maria Santos", "observacao": "Solicitação criada"},
     {"id": "hist-2", "data": "2025-01-30T14:30:00Z", "acao": "em_analise", "usuario": "João Silva", "observacao": "Iniciada análise de impacto"},
     {"id": "hist-3", "data": "2025-02-05T09:00:00Z", "acao": "aprovada", "usuario": "João Silva", "observacao": "Aprovada com ajuste de cronograma"}]',
   'a0000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002'),

  ('i0000002-0000-0000-0000-000000000002', 'SM-2025-002', 'Inclusão de Gerador de Emergência', 'Adicionar gerador diesel 500kVA para áreas comuns', 'Exigência do Corpo de Bombeiros para aprovação do AVCB', 'escopo', 'alta', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005', '2025-02-10', 'em_analise', 'd0000001-0000-0000-0000-000000000001', 'Residencial Torre Alpha', 20, 180000.00, 'alto',
   '[{"id": "hist-1", "data": "2025-02-10T11:00:00Z", "acao": "submetida", "usuario": "Pedro Souza", "observacao": "Exigência normativa"},
     {"id": "hist-2", "data": "2025-02-12T16:00:00Z", "acao": "em_analise", "usuario": "João Silva", "observacao": "Aguardando orçamentos"}]',
   'a0000001-0000-0000-0000-000000000001', 'b0000005-0000-0000-0000-000000000005'),

  ('i0000003-0000-0000-0000-000000000003', 'SM-2025-003', 'Alteração de Acabamento - Fachada', 'Substituição de pastilha cerâmica por ACM nas fachadas', 'Redução de custo e prazo de execução sem comprometer qualidade estética', 'escopo', 'media', 'Fernanda Oliveira', 'b0000006-0000-0000-0000-000000000006', '2025-02-15', 'submetida', 'd0000001-0000-0000-0000-000000000001', 'Residencial Torre Alpha', -10, -45000.00, 'medio',
   '[{"id": "hist-1", "data": "2025-02-15T08:30:00Z", "acao": "submetida", "usuario": "Fernanda Oliveira", "observacao": "Proposta de value engineering"}]',
   'a0000001-0000-0000-0000-000000000001', 'b0000006-0000-0000-0000-000000000006'),

  ('i0000004-0000-0000-0000-000000000004', 'SM-2025-004', 'Antecipação de Elevadores', 'Antecipar instalação de elevadores para uso durante obra', 'Facilitar transporte de materiais e melhorar produtividade', 'cronograma', 'baixa', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003', '2025-02-20', 'rejeitada', 'd0000001-0000-0000-0000-000000000001', 'Residencial Torre Alpha', 0, 25000.00, 'baixo',
   '[{"id": "hist-1", "data": "2025-02-20T13:00:00Z", "acao": "submetida", "usuario": "Carlos Lima", "observacao": "Proposta para melhoria operacional"},
     {"id": "hist-2", "data": "2025-02-22T10:00:00Z", "acao": "rejeitada", "usuario": "João Silva", "observacao": "Custo adicional não justifica benefício. Manter cremalheira."}]',
   'a0000001-0000-0000-0000-000000000001', 'b0000003-0000-0000-0000-000000000003'),

  ('i0000005-0000-0000-0000-000000000005', 'SM-2025-005', 'Ampliação de Subsolos - Plaza', 'Adicionar um nível de subsolo para aumentar vagas de estacionamento', 'Demanda do cliente para atender norma de vagas/m²', 'escopo', 'alta', 'João Silva', 'b0000001-0000-0000-0000-000000000001', '2025-03-01', 'submetida', 'd0000002-0000-0000-0000-000000000002', 'Centro Comercial Plaza', 60, 2500000.00, 'alto',
   '[{"id": "hist-1", "data": "2025-03-01T09:00:00Z", "acao": "submetida", "usuario": "João Silva", "observacao": "Solicitação do cliente"}]',
   'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001');

-- ========================================
-- REUNIOES
-- ========================================
INSERT INTO reunioes (id, tipo, titulo, descricao, frequencia, participantes, pauta_fixa, proxima_data, hora_inicio, duracao, local, ativo, empresa_id, projeto_id, created_by) VALUES
  ('j0000001-0000-0000-0000-000000000001', 'daily', 'Daily Standup - Torre Alpha', 'Reunião diária de alinhamento da equipe de produção', 'diaria', '{"João Silva", "Carlos Lima", "Maria Santos", "Roberto Dias"}', '{"Verificação de segurança", "Status das frentes de trabalho", "Impedimentos e restrições", "Programação do dia"}', '2025-12-21 07:30:00', '07:30', 15, 'Canteiro de obras - Container escritório', true, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001'),
  
  ('j0000002-0000-0000-0000-000000000002', 'weekly', 'Reunião Semanal de Coordenação', 'Reunião de coordenação técnica e acompanhamento de cronograma', 'semanal', '{"João Silva", "Maria Santos", "Ana Costa", "Pedro Souza", "Fernanda Oliveira", "Luciana Ferreira"}', '{"Análise de avanço físico", "Revisão de restrições LPS", "Acompanhamento de custos", "Plano de ação para desvios"}', '2025-12-23 14:00:00', '14:00', 90, 'Sala de reuniões - Sede', true, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001'),
  
  ('j0000003-0000-0000-0000-000000000003', 'monthly', 'Reunião Mensal com Cliente', 'Apresentação de resultados e alinhamento estratégico', 'mensal', '{"João Silva", "Maria Santos", "Cliente - Representante"}', '{"Apresentação de avanço físico-financeiro", "Status de mudanças e pendências", "Projeções e tendências", "Próximos marcos"}', '2025-12-28 10:00:00', '10:00', 120, 'Escritório do Cliente', true, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001'),
  
  ('j0000004-0000-0000-0000-000000000004', 'weekly', 'Reunião de Segurança', 'Discussão de indicadores e ações de segurança', 'semanal', '{"Pedro Souza", "Carlos Lima", "Técnico de Segurança"}', '{"Análise de incidentes da semana", "Indicadores de segurança", "DDS realizados", "Inspeções programadas"}', '2025-12-22 08:00:00', '08:00', 60, 'Canteiro de obras - Container escritório', true, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000005-0000-0000-0000-000000000005'),
  
  ('j0000005-0000-0000-0000-000000000005', 'biweekly', 'Reunião de Qualidade', 'Análise de não conformidades e ações corretivas', 'quinzenal', '{"Ana Costa", "Maria Santos", "Carlos Lima"}', '{"Revisão de auditorias", "Status de ações corretivas", "Indicadores de qualidade", "Planejamento de inspeções"}', '2025-12-26 15:00:00', '15:00', 60, 'Sala de reuniões - Sede', true, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000004');

-- ========================================
-- RESTRICOES ISHIKAWA
-- ========================================
INSERT INTO restricoes_ishikawa (id, codigo, descricao, categoria, status, atividade_id, atividade_nome, wbs_id, wbs_nome, eps_id, eps_nome, data_criacao, data_prevista, data_conclusao, responsavel, responsavel_id, impacto_caminho_critico, duracao_atividade_impactada, dias_atraso, score_impacto, reincidente, empresa_id, projeto_id, created_by) VALUES
  ('k0000001-0000-0000-0000-000000000001', 'RI-001', 'Atraso na entrega de aço CA-50', 'material', 'vencida', 'f0000003-0000-0000-0000-000000000003', 'Armação Fundações', 'e0000001-0000-0000-0000-000000000001', 'Fundações', 'c0000001-0000-0000-0000-000000000001', 'Residencial', '2025-02-01', '2025-02-08', NULL, 'João Silva', 'b0000001-0000-0000-0000-000000000001', true, 17, 12, 68, true, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000008-0000-0000-0000-000000000008'),
  
  ('k0000002-0000-0000-0000-000000000002', 'RI-002', 'Equipamento de sondagem indisponível', 'maquina', 'concluida', 'f0000002-0000-0000-0000-000000000002', 'Escavação Fundações', 'e0000001-0000-0000-0000-000000000001', 'Fundações', 'c0000001-0000-0000-0000-000000000001', 'Residencial', '2025-01-20', '2025-01-25', '2025-01-24', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003', false, 20, 0, 15, false, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000003-0000-0000-0000-000000000003'),
  
  ('k0000003-0000-0000-0000-000000000003', 'RI-003', 'Falta de mão de obra qualificada para armação', 'mao_de_obra', 'atrasada', 'f0000003-0000-0000-0000-000000000003', 'Armação Fundações', 'e0000001-0000-0000-0000-000000000001', 'Fundações', 'c0000001-0000-0000-0000-000000000001', 'Residencial', '2025-02-05', '2025-02-12', NULL, 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003', true, 17, 8, 55, false, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000003-0000-0000-0000-000000000003'),
  
  ('k0000004-0000-0000-0000-000000000004', 'RI-004', 'Licença ambiental pendente', 'meio_ambiente', 'em_execucao', 'f0000004-0000-0000-0000-000000000004', 'Concretagem Fundações', 'e0000001-0000-0000-0000-000000000001', 'Fundações', 'c0000001-0000-0000-0000-000000000001', 'Residencial', '2025-02-10', '2025-02-28', NULL, 'João Silva', 'b0000001-0000-0000-0000-000000000001', true, 14, 0, 42, false, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001'),
  
  ('k0000005-0000-0000-0000-000000000005', 'RI-005', 'Projeto estrutural com inconsistências', 'metodo', 'no_prazo', 'f0000005-0000-0000-0000-000000000005', 'Forma Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002', 'Estrutura', 'c0000001-0000-0000-0000-000000000001', 'Residencial', '2025-02-15', '2025-03-10', NULL, 'Maria Santos', 'b0000002-0000-0000-0000-000000000002', false, 9, 0, 22, false, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002'),
  
  ('k0000006-0000-0000-0000-000000000006', 'RI-006', 'Ensaio de resistência do concreto reprovado', 'medida', 'vencida', 'f0000004-0000-0000-0000-000000000004', 'Concretagem Fundações', 'e0000001-0000-0000-0000-000000000001', 'Fundações', 'c0000001-0000-0000-0000-000000000001', 'Residencial', '2025-02-08', '2025-02-10', NULL, 'Ana Costa', 'b0000004-0000-0000-0000-000000000004', true, 14, 15, 72, true, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000004'),
  
  ('k0000007-0000-0000-0000-000000000007', 'RI-007', 'Chuvas intensas paralisando escavação', 'meio_ambiente', 'concluida', 'f0000002-0000-0000-0000-000000000002', 'Escavação Fundações', 'e0000001-0000-0000-0000-000000000001', 'Fundações', 'c0000001-0000-0000-0000-000000000001', 'Residencial', '2025-01-25', '2025-01-30', '2025-01-29', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003', false, 20, 0, 18, false, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000003-0000-0000-0000-000000000003'),
  
  ('k0000008-0000-0000-0000-000000000008', 'RI-008', 'Falta de procedimento para cura de concreto', 'metodo', 'em_execucao', 'f0000004-0000-0000-0000-000000000004', 'Concretagem Fundações', 'e0000001-0000-0000-0000-000000000001', 'Fundações', 'c0000001-0000-0000-0000-000000000001', 'Residencial', '2025-02-12', '2025-02-20', NULL, 'Ana Costa', 'b0000004-0000-0000-0000-000000000004', false, 14, 0, 25, false, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000004'),
  
  ('k0000009-0000-0000-0000-000000000009', 'RI-009', 'Grua com capacidade insuficiente', 'maquina', 'no_prazo', 'f0000006-0000-0000-0000-000000000006', 'Armação Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002', 'Estrutura', 'c0000001-0000-0000-0000-000000000001', 'Residencial', '2025-02-18', '2025-03-15', NULL, 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007', true, 10, 0, 35, false, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000007-0000-0000-0000-000000000007'),
  
  ('k0000010-0000-0000-0000-000000000010', 'RI-010', 'Treinamento de NR-35 pendente', 'mao_de_obra', 'atrasada', 'f0000005-0000-0000-0000-000000000005', 'Forma Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002', 'Estrutura', 'c0000001-0000-0000-0000-000000000001', 'Residencial', '2025-02-20', '2025-03-01', NULL, 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005', false, 9, 5, 28, false, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000005-0000-0000-0000-000000000005'),
  
  ('k0000011-0000-0000-0000-000000000011', 'RI-011', 'Fornecedor de formas com atraso', 'material', 'em_execucao', 'f0000005-0000-0000-0000-000000000005', 'Forma Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002', 'Estrutura', 'c0000001-0000-0000-0000-000000000001', 'Residencial', '2025-02-22', '2025-03-08', NULL, 'João Silva', 'b0000001-0000-0000-0000-000000000001', true, 9, 0, 45, false, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000008-0000-0000-0000-000000000008'),
  
  ('k0000012-0000-0000-0000-000000000012', 'RI-012', 'Calibração de equipamentos de topografia', 'medida', 'concluida', 'f0000001-0000-0000-0000-000000000001', 'Locação da Obra', 'e0000001-0000-0000-0000-000000000001', 'Fundações', 'c0000001-0000-0000-0000-000000000001', 'Residencial', '2025-01-14', '2025-01-16', '2025-01-15', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002', false, 5, 0, 8, false, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002');

-- ========================================
-- ACOES 5W2H
-- ========================================
INSERT INTO acoes_5w2h (id, codigo, titulo, o_que, por_que, onde, quando, quem, quem_id, como, quanto, status, prioridade, percentual_completo, origem_tipo, restricao_id, empresa_id, projeto_id, created_by) VALUES
  ('l0000001-0000-0000-0000-000000000001', '5W2H-001', 'Contato urgente com fornecedor de aço', 'Negociar entrega antecipada de aço CA-50', 'Mitigar atraso crítico na armação de fundações', 'Fornecedor - Gerdau', '2025-02-05', 'João Silva', 'b0000001-0000-0000-0000-000000000001', 'Reunião virtual com gerente comercial para negociar entrega parcial', 5000.00, 'em_andamento', 'alta', 50, 'restricao', 'k0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000008-0000-0000-0000-000000000008'),
  
  ('l0000002-0000-0000-0000-000000000002', '5W2H-002', 'Contratar equipe adicional de armadores', 'Recrutar 5 armadores qualificados', 'Recuperar atraso e manter cronograma', 'Canteiro de obras', '2025-02-10', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003', 'Contato com sindicato e construtoras parceiras', 15000.00, 'concluida', 'alta', 100, 'restricao', 'k0000003-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000003-0000-0000-0000-000000000003'),
  
  ('l0000003-0000-0000-0000-000000000003', '5W2H-003', 'Regularização de licença ambiental', 'Obter licença ambiental complementar', 'Cumprir exigência legal para concretagem', 'IBAMA / Secretaria de Meio Ambiente', '2025-02-25', 'João Silva', 'b0000001-0000-0000-0000-000000000001', 'Protocolar documentação complementar e agendar vistoria', 3500.00, 'em_andamento', 'alta', 75, 'restricao', 'k0000004-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001'),
  
  ('l0000004-0000-0000-0000-000000000004', '5W2H-004', 'Substituição de extintores vencidos', 'Substituir 2 extintores com validade vencida', 'Corrigir não conformidade de auditoria de segurança', 'Canteiro de obras', '2025-01-30', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005', 'Solicitar ao fornecedor de equipamentos de segurança', 450.00, 'concluida', 'media', 100, 'auditoria', NULL, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000005-0000-0000-0000-000000000005'),
  
  ('l0000005-0000-0000-0000-000000000005', '5W2H-005', 'Elaborar procedimento de cura de concreto', 'Criar PO para processo de cura úmida', 'Padronizar processo e garantir qualidade', 'Escritório técnico', '2025-02-18', 'Ana Costa', 'b0000004-0000-0000-0000-000000000004', 'Desenvolver procedimento baseado em norma NBR 14931', 0.00, 'em_andamento', 'media', 60, 'restricao', 'k0000008-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000004'),
  
  ('l0000006-0000-0000-0000-000000000006', '5W2H-006', 'Agendar treinamento NR-35', 'Realizar treinamento de trabalho em altura', 'Habilitar equipe para serviços em andares elevados', 'Centro de treinamento', '2025-03-05', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005', 'Contratar empresa certificadora e agendar turma', 8500.00, 'pendente', 'alta', 0, 'restricao', 'k0000010-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000005-0000-0000-0000-000000000005'),
  
  ('l0000007-0000-0000-0000-000000000007', '5W2H-007', 'Contratar grua de maior capacidade', 'Substituir grua atual por modelo de 10t', 'Atender demanda de içamento de estruturas pesadas', 'Canteiro de obras', '2025-03-10', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007', 'Negociar com locadoras e planejar mobilização', 45000.00, 'pendente', 'alta', 0, 'restricao', 'k0000009-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000007-0000-0000-0000-000000000007'),
  
  ('l0000008-0000-0000-0000-000000000008', '5W2H-008', 'Revisar projeto estrutural', 'Solicitar revisão ao projetista para corrigir inconsistências', 'Eliminar conflitos entre projeto e execução', 'Escritório de projeto', '2025-03-01', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002', 'Reunião técnica com projetista e envio de RFI', 2500.00, 'em_andamento', 'media', 40, 'restricao', 'k0000005-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002'),
  
  ('l0000009-0000-0000-0000-000000000009', '5W2H-009', 'Investigar causa de reprovação de CP', 'Analisar falha em corpos de prova de concreto', 'Identificar causa raiz e prevenir reincidência', 'Laboratório de ensaios', '2025-02-12', 'Ana Costa', 'b0000004-0000-0000-0000-000000000004', 'Reunir com concreteira e analisar processo de moldagem', 1200.00, 'concluida', 'alta', 100, 'restricao', 'k0000006-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000004'),
  
  ('l0000010-0000-0000-0000-000000000010', '5W2H-010', 'Negociar antecipação de formas', 'Antecipar entrega de kit de formas', 'Evitar impacto no início de estrutura', 'Fornecedor - Formaço', '2025-02-28', 'João Silva', 'b0000001-0000-0000-0000-000000000001', 'Negociação comercial com pagamento antecipado', 12000.00, 'em_andamento', 'alta', 30, 'restricao', 'k0000011-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000008-0000-0000-0000-000000000008');

-- ========================================
-- RESTRICOES LPS (Last Planner System)
-- ========================================
INSERT INTO restricoes_lps (id, codigo, descricao, tipo, status, atividade_id, atividade_nome, responsavel, responsavel_id, data_identificacao, data_necessaria, data_prevista_remocao, data_remocao, empresa_id, projeto_id, created_by) VALUES
  ('m0000001-0000-0000-0000-000000000001', 'LPS-001', 'Aguardando liberação de projeto revisado', 'projeto', 'identificada', 'f0000005-0000-0000-0000-000000000005', 'Forma Pilares 1º Pav', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002', '2025-02-20', '2025-03-10', '2025-03-05', NULL, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000008-0000-0000-0000-000000000008'),
  
  ('m0000002-0000-0000-0000-000000000002', 'LPS-002', 'Material de formas em trânsito', 'material', 'em_tratamento', 'f0000005-0000-0000-0000-000000000005', 'Forma Pilares 1º Pav', 'João Silva', 'b0000001-0000-0000-0000-000000000001', '2025-02-22', '2025-03-12', '2025-03-08', NULL, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000008-0000-0000-0000-000000000008'),
  
  ('m0000003-0000-0000-0000-000000000003', 'LPS-003', 'Equipe de armação subdimensionada', 'mao_de_obra', 'removida', 'f0000003-0000-0000-0000-000000000003', 'Armação Fundações', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003', '2025-02-05', '2025-02-10', '2025-02-10', '2025-02-09', 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000003-0000-0000-0000-000000000003'),
  
  ('m0000004-0000-0000-0000-000000000004', 'LPS-004', 'Equipamento de vibração indisponível', 'equipamento', 'identificada', 'f0000004-0000-0000-0000-000000000004', 'Concretagem Fundações', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007', '2025-02-25', '2025-03-01', '2025-02-28', NULL, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000007-0000-0000-0000-000000000007'),
  
  ('m0000005-0000-0000-0000-000000000005', 'LPS-005', 'Condições climáticas adversas previstas', 'outros', 'em_tratamento', 'f0000004-0000-0000-0000-000000000004', 'Concretagem Fundações', 'Luciana Ferreira', 'b0000008-0000-0000-0000-000000000008', '2025-02-26', '2025-03-01', '2025-03-02', NULL, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000008-0000-0000-0000-000000000008'),
  
  ('m0000006-0000-0000-0000-000000000006', 'LPS-006', 'Liberação de área pelo cliente pendente', 'projeto', 'identificada', 'f0000009-0000-0000-0000-000000000009', 'Instalações Hidráulicas', 'João Silva', 'b0000001-0000-0000-0000-000000000001', '2025-02-28', '2025-05-25', '2025-05-20', NULL, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001'),
  
  ('m0000007-0000-0000-0000-000000000007', 'LPS-007', 'Contrato com subempreiteiro em negociação', 'mao_de_obra', 'em_tratamento', 'f0000011-0000-0000-0000-000000000011', 'Revestimento Interno', 'João Silva', 'b0000001-0000-0000-0000-000000000001', '2025-02-28', '2025-08-20', '2025-08-15', NULL, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001'),
  
  ('m0000008-0000-0000-0000-000000000008', 'LPS-008', 'Definição de cores pelo cliente pendente', 'projeto', 'identificada', 'f0000012-0000-0000-0000-000000000012', 'Pintura Interna', 'Fernanda Oliveira', 'b0000006-0000-0000-0000-000000000006', '2025-02-28', '2025-10-15', '2025-10-10', NULL, 'a0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'b0000006-0000-0000-0000-000000000006');
