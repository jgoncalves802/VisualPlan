-- ========================================
-- VisionPlan Database Seed - Versão Supabase
-- Compatível com o console SQL do Supabase
-- Execute este arquivo no console SQL do Supabase
-- ========================================

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- EMPRESA
INSERT INTO empresas (id, nome, cnpj, endereco, telefone, email, ativo)
VALUES ('a0000001-0000-0000-0000-000000000001'::uuid, 'Construtora VisionPlan Ltda', '12.345.678/0001-90', 'Av. Paulista, 1000 - São Paulo/SP', '(11) 3000-0000', 'contato@visionplan.com.br', true)
ON CONFLICT (id) DO NOTHING;

-- USUARIOS (8 users)
INSERT INTO usuarios (id, nome, email, camada_governanca, perfil_acesso, empresa_id, ativo) VALUES
('b0000001-0000-0000-0000-000000000001'::uuid, 'João Silva', 'joao.silva@visionplan.com.br', 'PROPONENTE', 'ADMIN', 'a0000001-0000-0000-0000-000000000001'::uuid, true),
('b0000002-0000-0000-0000-000000000002'::uuid, 'Maria Santos', 'maria.santos@visionplan.com.br', 'CONTRATADA', 'GERENTE_PROJETO', 'a0000001-0000-0000-0000-000000000001'::uuid, true),
('b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', 'carlos.lima@visionplan.com.br', 'CONTRATADA', 'COORDENADOR_OBRA', 'a0000001-0000-0000-0000-000000000001'::uuid, true),
('b0000004-0000-0000-0000-000000000004'::uuid, 'Ana Costa', 'ana.costa@visionplan.com.br', 'FISCALIZACAO', 'FISCALIZACAO_LEAD', 'a0000001-0000-0000-0000-000000000001'::uuid, true),
('b0000005-0000-0000-0000-000000000005'::uuid, 'Pedro Souza', 'pedro.souza@visionplan.com.br', 'FISCALIZACAO', 'FISCALIZACAO_TECNICO', 'a0000001-0000-0000-0000-000000000001'::uuid, true),
('b0000006-0000-0000-0000-000000000006'::uuid, 'Fernanda Oliveira', 'fernanda.oliveira@visionplan.com.br', 'CONTRATADA', 'ENGENHEIRO_PLANEJAMENTO', 'a0000001-0000-0000-0000-000000000001'::uuid, true),
('b0000007-0000-0000-0000-000000000007'::uuid, 'Roberto Dias', 'roberto.dias@visionplan.com.br', 'CONTRATADA', 'MESTRE_OBRAS', 'a0000001-0000-0000-0000-000000000001'::uuid, true),
('b0000008-0000-0000-0000-000000000008'::uuid, 'Luciana Ferreira', 'luciana.ferreira@visionplan.com.br', 'PROPONENTE', 'DIRETOR', 'a0000001-0000-0000-0000-000000000001'::uuid, true)
ON CONFLICT (id) DO NOTHING;

-- EPS_NODES (3 nodes)
INSERT INTO eps_nodes (id, codigo, nome, descricao, parent_id, empresa_id, nivel) VALUES
('c0000001-0000-0000-0000-000000000001'::uuid, 'EPS-RES', 'Residencial', 'Projetos residenciais', NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 1),
('c0000002-0000-0000-0000-000000000002'::uuid, 'EPS-COM', 'Comercial', 'Projetos comerciais', NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 1),
('c0000003-0000-0000-0000-000000000003'::uuid, 'EPS-IND', 'Industrial', 'Projetos industriais', NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 1)
ON CONFLICT (id) DO NOTHING;

-- PROJETOS (3 projects)
-- Schema: id, nome, codigo, descricao, eps_id, empresa_id, status, data_inicio, data_termino
INSERT INTO projetos (id, codigo, nome, descricao, eps_id, empresa_id, status, data_inicio, data_termino) VALUES
('d0000001-0000-0000-0000-000000000001'::uuid, 'PRJ-001', 'Torre Alpha', 'Edifício residencial de 20 andares', 'c0000001-0000-0000-0000-000000000001'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'em_andamento', '2025-01-01', '2026-12-31'),
('d0000002-0000-0000-0000-000000000002'::uuid, 'PRJ-002', 'Centro Comercial Plaza', 'Shopping center com 150 lojas', 'c0000002-0000-0000-0000-000000000002'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'planejamento', '2025-06-01', '2027-12-31'),
('d0000003-0000-0000-0000-000000000003'::uuid, 'PRJ-003', 'Galpão Logístico Beta', 'Centro de distribuição 50.000m²', 'c0000003-0000-0000-0000-000000000003'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'planejamento', '2025-09-01', '2026-09-30')
ON CONFLICT (id) DO NOTHING;

-- WBS_NODES (8 nodes)
-- Schema: id, eps_node_id, parent_id, codigo, nome, descricao, nivel, ordem, peso, ativo
-- Note: WBS links to EPS nodes, not projects directly
INSERT INTO wbs_nodes (id, eps_node_id, parent_id, codigo, nome, descricao, nivel, ordem) VALUES
('e0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, NULL, 'WBS-1', 'Fundações', 'Serviços de fundação', 1, 1),
('e0000002-0000-0000-0000-000000000002'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, NULL, 'WBS-2', 'Estrutura', 'Estrutura de concreto', 1, 2),
('e0000003-0000-0000-0000-000000000003'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, NULL, 'WBS-3', 'Vedações', 'Alvenaria e divisórias', 1, 3),
('e0000004-0000-0000-0000-000000000004'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, NULL, 'WBS-4', 'Instalações', 'Elétrica, hidráulica e HVAC', 1, 4),
('e0000005-0000-0000-0000-000000000005'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, NULL, 'WBS-5', 'Acabamentos', 'Revestimentos e pintura', 1, 5),
('e0000006-0000-0000-0000-000000000006'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid, NULL, 'WBS-C1', 'Infraestrutura', 'Terraplanagem e fundações', 1, 1),
('e0000007-0000-0000-0000-000000000007'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid, NULL, 'WBS-C2', 'Superestrutura', 'Estrutura metálica', 1, 2),
('e0000008-0000-0000-0000-000000000008'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid, NULL, 'WBS-C3', 'MEP', 'Instalações prediais', 1, 3)
ON CONFLICT (id) DO NOTHING;

-- ATIVIDADES CRONOGRAMA (13 activities)
INSERT INTO atividades_cronograma (id, empresa_id, projeto_id, wbs_id, codigo, nome, tipo, data_inicio, data_fim, duracao_dias, progresso, status, responsavel_nome, responsavel_id) VALUES
('f0000001-0000-0000-0000-000000000001'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 'AT-001', 'Locação da Obra', 'Tarefa', '2025-01-15', '2025-01-20', 5, 100, 'Concluída', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid),
('f0000002-0000-0000-0000-000000000002'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 'AT-002', 'Escavação Fundações', 'Tarefa', '2025-01-21', '2025-02-10', 20, 100, 'Concluída', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid),
('f0000003-0000-0000-0000-000000000003'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 'AT-003', 'Armação Fundações', 'Tarefa', '2025-02-03', '2025-02-20', 17, 85, 'Em Andamento', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid),
('f0000004-0000-0000-0000-000000000004'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000001-0000-0000-0000-000000000001'::uuid, 'AT-004', 'Concretagem Fundações', 'Tarefa', '2025-02-15', '2025-03-01', 14, 60, 'Em Andamento', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid),
('f0000005-0000-0000-0000-000000000005'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000002-0000-0000-0000-000000000002'::uuid, 'AT-005', 'Forma Pilares 1º Pav', 'Tarefa', '2025-03-01', '2025-03-10', 9, 0, 'Não Iniciada', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid),
('f0000006-0000-0000-0000-000000000006'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000002-0000-0000-0000-000000000002'::uuid, 'AT-006', 'Armação Pilares 1º Pav', 'Tarefa', '2025-03-08', '2025-03-18', 10, 0, 'Não Iniciada', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid),
('f0000007-0000-0000-0000-000000000007'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000002-0000-0000-0000-000000000002'::uuid, 'AT-007', 'Concretagem Pilares 1º Pav', 'Tarefa', '2025-03-18', '2025-03-22', 4, 0, 'Não Iniciada', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid),
('f0000008-0000-0000-0000-000000000008'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000003-0000-0000-0000-000000000003'::uuid, 'AT-008', 'Alvenaria Térreo', 'Tarefa', '2025-04-01', '2025-04-30', 29, 0, 'Não Iniciada', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid),
('f0000009-0000-0000-0000-000000000009'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000004-0000-0000-0000-000000000004'::uuid, 'AT-009', 'Instalações Elétricas Térreo', 'Tarefa', '2025-05-01', '2025-05-20', 19, 0, 'Não Iniciada', 'Fernanda Oliveira', 'b0000006-0000-0000-0000-000000000006'::uuid),
('f0000010-0000-0000-0000-000000000010'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000004-0000-0000-0000-000000000004'::uuid, 'AT-010', 'Instalações Hidráulicas Térreo', 'Tarefa', '2025-05-01', '2025-05-25', 24, 0, 'Não Iniciada', 'Fernanda Oliveira', 'b0000006-0000-0000-0000-000000000006'::uuid),
('f0000011-0000-0000-0000-000000000011'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000005-0000-0000-0000-000000000005'::uuid, 'AT-011', 'Revestimento Interno Térreo', 'Tarefa', '2025-06-01', '2025-07-15', 44, 0, 'Não Iniciada', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid),
('f0000012-0000-0000-0000-000000000012'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'e0000005-0000-0000-0000-000000000005'::uuid, 'AT-012', 'Pintura Geral', 'Tarefa', '2025-07-16', '2025-08-30', 45, 0, 'Não Iniciada', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid),
('f0000013-0000-0000-0000-000000000013'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, NULL, 'AT-013', 'Entrega Final', 'Marco', '2026-12-31', '2026-12-31', 0, 0, 'Não Iniciada', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- CHECKLIST TEMPLATES (3 templates)
-- Schema: id, nome, categoria, itens (jsonb), versao, empresa_id
INSERT INTO checklist_templates (id, nome, categoria, itens, versao, empresa_id) VALUES
('11111111-1111-1111-1111-111111111101'::uuid, 'Checklist de Segurança - NR-18', 'Segurança',
 '[{"id": "item-1", "descricao": "EPIs disponíveis", "obrigatorio": true}, {"id": "item-2", "descricao": "Sinalização adequada", "obrigatorio": true}, {"id": "item-3", "descricao": "Extintores dentro da validade", "obrigatorio": true}, {"id": "item-4", "descricao": "Área de vivência limpa", "obrigatorio": false}, {"id": "item-5", "descricao": "Proteções coletivas instaladas", "obrigatorio": true}]',
 '1.0', 'a0000001-0000-0000-0000-000000000001'::uuid),
('11111111-1111-1111-1111-111111111102'::uuid, 'Checklist de Concreto', 'Qualidade',
 '[{"id": "item-1", "descricao": "Slump test realizado", "obrigatorio": true}, {"id": "item-2", "descricao": "Corpos de prova coletados", "obrigatorio": true}, {"id": "item-3", "descricao": "Nota fiscal conferida", "obrigatorio": true}, {"id": "item-4", "descricao": "Tempo de transporte dentro do limite", "obrigatorio": true}]',
 '1.0', 'a0000001-0000-0000-0000-000000000001'::uuid),
('11111111-1111-1111-1111-111111111103'::uuid, 'Checklist de Alvenaria', 'Qualidade',
 '[{"id": "item-1", "descricao": "Prumo verificado", "obrigatorio": true}, {"id": "item-2", "descricao": "Nível verificado", "obrigatorio": true}, {"id": "item-3", "descricao": "Amarração correta", "obrigatorio": true}, {"id": "item-4", "descricao": "Argamassa homogênea", "obrigatorio": true}]',
 '1.0', 'a0000001-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- AUDITORIAS (5 auditorias)
INSERT INTO auditorias (id, codigo, titulo, tipo, template_id, projeto_id, projeto_nome, local_auditoria, data_programada, data_realizacao, auditor_id, auditor_nome, status, itens, total_itens, itens_conformes, itens_nao_conformes, nota_geral, observacoes, empresa_id, created_by) VALUES
('22222222-2222-2222-2222-222222222201'::uuid, 'AUD-2025-001', 'Auditoria de Segurança - Janeiro', 'Segurança', '11111111-1111-1111-1111-111111111101'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Canteiro de Obras', '2025-01-25', '2025-01-25', 'b0000004-0000-0000-0000-000000000004'::uuid, 'Ana Costa', 'REALIZADA',
 '[{"id": "item-1", "status": "conforme"}, {"id": "item-2", "status": "conforme"}, {"id": "item-3", "status": "nao_conforme", "observacao": "2 extintores vencidos"}, {"id": "item-4", "status": "conforme"}, {"id": "item-5", "status": "conforme"}]',
 5, 4, 1, 80.0, 'Auditoria realizada com sucesso. Pendência de extintores identificada.', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
('22222222-2222-2222-2222-222222222202'::uuid, 'AUD-2025-002', 'Auditoria de Concreto - Fundações', 'Qualidade', '11111111-1111-1111-1111-111111111102'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Fundações', '2025-02-10', '2025-02-10', 'b0000004-0000-0000-0000-000000000004'::uuid, 'Ana Costa', 'REALIZADA',
 '[{"id": "item-1", "status": "conforme"}, {"id": "item-2", "status": "conforme"}, {"id": "item-3", "status": "conforme"}, {"id": "item-4", "status": "conforme"}]',
 4, 4, 0, 100.0, 'Todos os itens em conformidade.', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
('22222222-2222-2222-2222-222222222203'::uuid, 'AUD-2025-003', 'Auditoria de Segurança - Fevereiro', 'Segurança', '11111111-1111-1111-1111-111111111101'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Canteiro de Obras', '2025-02-25', NULL, 'b0000005-0000-0000-0000-000000000005'::uuid, 'Pedro Souza', 'EM_ANDAMENTO',
 '[{"id": "item-1", "status": "conforme"}, {"id": "item-2", "status": "pendente"}]',
 5, 1, 0, 50.0, 'Auditoria em andamento.', 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),
('22222222-2222-2222-2222-222222222204'::uuid, 'AUD-2025-004', 'Auditoria de Alvenaria - Térreo', 'Qualidade', '11111111-1111-1111-1111-111111111103'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Térreo', '2025-04-15', NULL, 'b0000004-0000-0000-0000-000000000004'::uuid, 'Ana Costa', 'PROGRAMADA',
 '[]', 4, 0, 0, NULL, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
('22222222-2222-2222-2222-222222222205'::uuid, 'AUD-2025-005', 'Auditoria de Segurança - Março', 'Segurança', '11111111-1111-1111-1111-111111111101'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 'Canteiro de Obras', '2025-03-25', NULL, 'b0000005-0000-0000-0000-000000000005'::uuid, 'Pedro Souza', 'PROGRAMADA',
 '[]', 5, 0, 0, NULL, NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid)
ON CONFLICT (id) DO NOTHING;

-- SOLICITACOES DE MUDANCA (5 solicitações)
INSERT INTO solicitacoes_mudanca (id, codigo, titulo, descricao, justificativa, tipo_mudanca, prioridade, solicitante, solicitante_id, data_solicitacao, status, projeto_id, projeto_nome, impacto_cronograma, impacto_custo, impacto_estimado, historico, empresa_id, created_by) VALUES
('33333333-3333-3333-3333-333333333301'::uuid, 'SM-2025-001', 'Alteração de Layout - Subsolo', 'Modificar layout das vagas de garagem', 'Atender nova legislação municipal', 'ESCOPO', 'ALTA', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, '2025-02-01', 'APROVADA', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 15, 85000.00, 'MEDIO',
 '[{"id": "hist-1", "data": "2025-02-01T10:00:00Z", "acao": "submetida", "usuario": "João Silva"}, {"id": "hist-2", "data": "2025-02-05T14:00:00Z", "acao": "em_analise", "usuario": "Maria Santos"}, {"id": "hist-3", "data": "2025-02-08T16:00:00Z", "acao": "aprovada", "usuario": "Luciana Ferreira"}]',
 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),
('33333333-3333-3333-3333-333333333302'::uuid, 'SM-2025-002', 'Inclusão de Gerador de Emergência', 'Adicionar gerador diesel 500kVA', 'Exigência do Corpo de Bombeiros', 'ESCOPO', 'ALTA', 'Pedro Souza', 'b0000005-0000-0000-0000-000000000005'::uuid, '2025-02-10', 'EM_ANALISE', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 20, 180000.00, 'ALTO',
 '[{"id": "hist-1", "data": "2025-02-10T11:00:00Z", "acao": "submetida", "usuario": "Pedro Souza"}, {"id": "hist-2", "data": "2025-02-12T16:00:00Z", "acao": "em_analise", "usuario": "João Silva"}]',
 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid),
('33333333-3333-3333-3333-333333333303'::uuid, 'SM-2025-003', 'Alteração de Acabamento - Fachada', 'Substituição de pastilha por ACM', 'Redução de custo e prazo', 'ESCOPO', 'MEDIA', 'Fernanda Oliveira', 'b0000006-0000-0000-0000-000000000006'::uuid, '2025-02-15', 'SUBMETIDA', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', -10, -45000.00, 'MEDIO',
 '[{"id": "hist-1", "data": "2025-02-15T08:30:00Z", "acao": "submetida", "usuario": "Fernanda Oliveira"}]',
 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000006-0000-0000-0000-000000000006'::uuid),
('33333333-3333-3333-3333-333333333304'::uuid, 'SM-2025-004', 'Antecipação de Elevadores', 'Antecipar instalação para uso na obra', 'Facilitar transporte de materiais', 'CRONOGRAMA', 'BAIXA', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, '2025-02-20', 'REJEITADA', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial Torre Alpha', 0, 25000.00, 'BAIXO',
 '[{"id": "hist-1", "data": "2025-02-20T13:00:00Z", "acao": "submetida", "usuario": "Carlos Lima"}, {"id": "hist-2", "data": "2025-02-22T10:00:00Z", "acao": "rejeitada", "usuario": "João Silva"}]',
 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
('33333333-3333-3333-3333-333333333305'::uuid, 'SM-2025-005', 'Ampliação de Subsolos - Plaza', 'Adicionar nível de subsolo', 'Atender norma de vagas/m²', 'ESCOPO', 'ALTA', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, '2025-03-01', 'SUBMETIDA', 'c0000002-0000-0000-0000-000000000002'::uuid, 'Centro Comercial Plaza', 60, 2500000.00, 'ALTO',
 '[{"id": "hist-1", "data": "2025-03-01T09:00:00Z", "acao": "submetida", "usuario": "João Silva"}]',
 'a0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- REUNIOES (5 reuniões)
-- Schema: id, tipo, titulo, descricao, frequencia, participantes (text[]), pauta_fixa (text[]), proxima_data, hora_inicio, duracao, local, ativo, empresa_id, projeto_id, created_by
INSERT INTO reunioes (id, tipo, titulo, descricao, frequencia, participantes, pauta_fixa, proxima_data, hora_inicio, duracao, local, ativo, empresa_id, projeto_id, created_by) VALUES
('44444444-4444-4444-4444-444444444401'::uuid, 'diaria', 'Reunião Diária de Obra', 'Alinhamento diário da equipe', 'diaria', 
 ARRAY['Maria Santos', 'Carlos Lima', 'Roberto Dias'],
 ARRAY['Revisão das atividades do dia anterior', 'Planejamento das atividades do dia', 'Identificação de restrições'],
 '2025-02-20 07:30:00', '07:30', 30, 'Canteiro de Obras', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),
('44444444-4444-4444-4444-444444444402'::uuid, 'semanal', 'Reunião Semanal de Planejamento', 'Revisão do planejamento semanal', 'semanal',
 ARRAY['João Silva', 'Maria Santos', 'Fernanda Oliveira'],
 ARRAY['Análise do avanço físico', 'Revisão de restrições LPS', 'Planejamento das próximas 4 semanas'],
 '2025-02-21 14:00:00', '14:00', 120, 'Sala de Reuniões', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),
('44444444-4444-4444-4444-444444444403'::uuid, 'mensal', 'Reunião Mensal de Diretoria', 'Apresentação de resultados mensais', 'mensal',
 ARRAY['João Silva', 'Luciana Ferreira', 'Maria Santos'],
 ARRAY['Relatório de progresso físico-financeiro', 'Análise de desvios', 'Projeções para o próximo mês'],
 '2025-02-28 09:00:00', '09:00', 180, 'Escritório Central', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
('44444444-4444-4444-4444-444444444404'::uuid, 'quinzenal', 'Reunião de Fiscalização', 'Acompanhamento da fiscalização', 'quinzenal',
 ARRAY['Ana Costa', 'Pedro Souza', 'Maria Santos'],
 ARRAY['Verificação de pendências anteriores', 'Inspeção de serviços em andamento', 'Registro de não conformidades'],
 '2025-02-25 10:00:00', '10:00', 90, 'Canteiro de Obras', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
('44444444-4444-4444-4444-444444444405'::uuid, 'extraordinaria', 'Reunião de Kick-off - Plaza', 'Início do projeto Centro Comercial Plaza', 'unica',
 ARRAY['João Silva', 'Luciana Ferreira'],
 ARRAY['Apresentação do projeto', 'Definição de equipe', 'Cronograma macro'],
 '2025-05-15 09:00:00', '09:00', 480, 'Escritório Central', true, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000002-0000-0000-0000-000000000002'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- RESTRICOES ISHIKAWA (12 restrições)
-- Schema: id, codigo, descricao, categoria, status, atividade_id, atividade_nome, wbs_id, wbs_nome, eps_id, eps_nome, data_prevista, data_conclusao, responsavel, responsavel_id, impacto_caminho_critico, dias_atraso, score_impacto, reincidente, empresa_id, projeto_id, created_by
INSERT INTO restricoes_ishikawa (id, codigo, descricao, categoria, status, atividade_id, atividade_nome, wbs_id, wbs_nome, eps_id, eps_nome, data_prevista, data_conclusao, responsavel, responsavel_id, impacto_caminho_critico, dias_atraso, score_impacto, reincidente, empresa_id, projeto_id, created_by) VALUES
('55555555-5555-5555-5555-555555555501'::uuid, 'ISH-001', 'Atraso Entrega Aço - Fornecedor com atraso de 15 dias', 'material', 'atrasada', 'f0000003-0000-0000-0000-000000000003'::uuid, 'Armação Fundações', 'e0000002-0000-0000-0000-000000000002'::uuid, 'Estrutura', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-20', NULL, 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, true, 5, 85, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
('55555555-5555-5555-5555-555555555502'::uuid, 'ISH-002', 'Betoneira com Defeito - Equipamento parado há 3 dias', 'maquina', 'no_prazo', 'f0000004-0000-0000-0000-000000000004'::uuid, 'Concretagem Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-10', NULL, 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, false, 0, 45, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000007-0000-0000-0000-000000000007'::uuid),
('55555555-5555-5555-5555-555555555503'::uuid, 'ISH-003', 'Falta de Armadores - Equipe reduzida por doença', 'mao_de_obra', 'concluida', 'f0000003-0000-0000-0000-000000000003'::uuid, 'Armação Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-01-25', '2025-01-24', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid, true, 0, 90, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),
('55555555-5555-5555-5555-555555555504'::uuid, 'ISH-004', 'Chuvas Intensas - Previsão de chuvas fortes', 'meio_ambiente', 'no_prazo', NULL, NULL, NULL, NULL, 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-28', NULL, 'Fernanda Oliveira', 'b0000006-0000-0000-0000-000000000006'::uuid, false, 0, 55, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000006-0000-0000-0000-000000000006'::uuid),
('55555555-5555-5555-5555-555555555505'::uuid, 'ISH-005', 'Projeto Elétrico Desatualizado - Incompatibilidade com estrutural', 'metodo', 'atrasada', 'f0000009-0000-0000-0000-000000000009'::uuid, 'Instalações Elétricas Térreo', 'e0000004-0000-0000-0000-000000000004'::uuid, 'Instalações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-25', NULL, 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, true, 3, 80, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
('55555555-5555-5555-5555-555555555506'::uuid, 'ISH-006', 'Topógrafo Indisponível - Equipamento de medição em calibração', 'medida', 'concluida', 'f0000001-0000-0000-0000-000000000001'::uuid, 'Locação da Obra', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-01-15', '2025-01-14', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, false, 0, 25, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
('55555555-5555-5555-5555-555555555507'::uuid, 'ISH-007', 'Concreto Fora de Especificação - Slump acima do tolerado', 'material', 'concluida', 'f0000004-0000-0000-0000-000000000004'::uuid, 'Concretagem Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-03', '2025-02-02', 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, true, 0, 75, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
('55555555-5555-5555-5555-555555555508'::uuid, 'ISH-008', 'Grua com Problema Hidráulico - Vazamento no sistema', 'maquina', 'atrasada', NULL, NULL, 'e0000002-0000-0000-0000-000000000002'::uuid, 'Estrutura', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-20', NULL, 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, true, 2, 88, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000007-0000-0000-0000-000000000007'::uuid),
('55555555-5555-5555-5555-555555555509'::uuid, 'ISH-009', 'Treinamento NR-35 Pendente - 5 funcionários sem certificação', 'mao_de_obra', 'no_prazo', NULL, NULL, NULL, NULL, 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-22', NULL, 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid, false, 0, 50, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),
('55555555-5555-5555-5555-555555555510'::uuid, 'ISH-010', 'Licença Ambiental Atrasada - Órgão com demora na análise', 'meio_ambiente', 'atrasada', NULL, NULL, NULL, NULL, 'c0000002-0000-0000-0000-000000000002'::uuid, 'Comercial', '2025-04-01', NULL, 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, true, 0, 95, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000002-0000-0000-0000-000000000002'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
('55555555-5555-5555-5555-555555555511'::uuid, 'ISH-011', 'Procedimento de Concretagem Desatualizado - Norma ABNT atualizada em 2024', 'metodo', 'no_prazo', 'f0000004-0000-0000-0000-000000000004'::uuid, 'Concretagem Fundações', 'e0000001-0000-0000-0000-000000000001'::uuid, 'Fundações', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-28', NULL, 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, false, 0, 40, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
('55555555-5555-5555-5555-555555555512'::uuid, 'ISH-012', 'Estação Total Descalibrada - Erro de medição detectado', 'medida', 'no_prazo', 'f0000005-0000-0000-0000-000000000005'::uuid, 'Forma Pilares 1º Pav', 'e0000002-0000-0000-0000-000000000002'::uuid, 'Estrutura', 'c0000001-0000-0000-0000-000000000001'::uuid, 'Residencial', '2025-02-25', NULL, 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, false, 0, 55, false, 'a0000001-0000-0000-0000-000000000001'::uuid, 'd0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ACOES 5W2H (10 ações)
-- Schema: id, codigo, o_que, por_que, onde, quando, quem, quem_id, como, quanto, status, prioridade, origem, origem_id, origem_descricao, auditoria_id, empresa_id, projeto_id (FK -> eps_nodes!), created_by
INSERT INTO acoes_5w2h (id, codigo, o_que, por_que, onde, quando, quem, quem_id, como, quanto, status, prioridade, origem, origem_id, origem_descricao, auditoria_id, empresa_id, projeto_id, created_by) VALUES
('66666666-6666-6666-6666-666666666601'::uuid, '5W2H-001', 'Substituir 2 extintores de incêndio', 'Extintores vencidos identificados na auditoria', 'Canteiro de obras - Área de vivência', '2025-02-05', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, 'Solicitar orçamento, aprovar e realizar troca', 450.00, 'CONCLUIDA', 'ALTA', 'AUDITORIA', '22222222-2222-2222-2222-222222222201'::uuid, 'Auditoria de Segurança - Janeiro', '22222222-2222-2222-2222-222222222201'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
('66666666-6666-6666-6666-666666666602'::uuid, '5W2H-002', 'Homologar novo fornecedor de aço CA-50', 'Atraso do fornecedor principal', 'Departamento de Suprimentos', '2025-02-15', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid, 'Solicitar cotações, avaliar e homologar', 0.00, 'EM_ANDAMENTO', 'ALTA', 'ISHIKAWA', '55555555-5555-5555-5555-555555555501'::uuid, 'Atraso Entrega Aço', NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
('66666666-6666-6666-6666-666666666603'::uuid, '5W2H-003', 'Realizar manutenção corretiva da betoneira', 'Equipamento parado afetando produção', 'Oficina de manutenção', '2025-02-10', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, 'Contratar serviço de manutenção especializada', 2500.00, 'EM_ANDAMENTO', 'MEDIA', 'ISHIKAWA', '55555555-5555-5555-5555-555555555502'::uuid, 'Betoneira com Defeito', NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000007-0000-0000-0000-000000000007'::uuid),
('66666666-6666-6666-6666-666666666604'::uuid, '5W2H-004', 'Realizar reunião de compatibilização de projetos', 'Inconsistências entre projetos', 'Sala de reuniões - Escritório', '2025-02-20', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, 'Convocar projetistas e realizar análise conjunta', 0.00, 'PENDENTE', 'ALTA', 'ISHIKAWA', '55555555-5555-5555-5555-555555555505'::uuid, 'Projeto Elétrico Desatualizado', NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid),
('66666666-6666-6666-6666-666666666605'::uuid, '5W2H-005', 'Agendar e realizar treinamento NR-35', '5 funcionários sem certificação para trabalho em altura', 'Centro de treinamento', '2025-02-22', 'Maria Santos', 'b0000002-0000-0000-0000-000000000002'::uuid, 'Contratar empresa de treinamento certificada', 3500.00, 'PENDENTE', 'MEDIA', 'ISHIKAWA', '55555555-5555-5555-5555-555555555509'::uuid, 'Treinamento NR-35 Pendente', NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid),
('66666666-6666-6666-6666-666666666606'::uuid, '5W2H-006', 'Realizar manutenção do sistema hidráulico da grua', 'Vazamento detectado afetando operação', 'Canteiro de obras', '2025-02-20', 'Roberto Dias', 'b0000007-0000-0000-0000-000000000007'::uuid, 'Contratar técnico especializado', 8500.00, 'PENDENTE', 'ALTA', 'ISHIKAWA', '55555555-5555-5555-5555-555555555508'::uuid, 'Grua com Problema Hidráulico', NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000007-0000-0000-0000-000000000007'::uuid),
('66666666-6666-6666-6666-666666666607'::uuid, '5W2H-007', 'Realizar calibração da estação total', 'Erro de medição detectado', 'Laboratório de metrologia', '2025-02-25', 'Carlos Lima', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Enviar para laboratório credenciado INMETRO', 1200.00, 'PENDENTE', 'MEDIA', 'ISHIKAWA', '55555555-5555-5555-5555-555555555512'::uuid, 'Estação Total Descalibrada', NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid),
('66666666-6666-6666-6666-666666666608'::uuid, '5W2H-008', 'Revisar procedimento técnico de concretagem', 'Norma ABNT atualizada em 2024', 'Departamento de Qualidade', '2025-02-28', 'Ana Costa', 'b0000004-0000-0000-0000-000000000004'::uuid, 'Revisar documento e treinar equipe', 0.00, 'PENDENTE', 'MEDIA', 'ISHIKAWA', '55555555-5555-5555-5555-555555555511'::uuid, 'Procedimento de Concretagem Desatualizado', NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid),
('66666666-6666-6666-6666-666666666609'::uuid, '5W2H-009', 'Criar cronograma alternativo para dias chuvosos', 'Previsão de chuvas intensas em fevereiro', 'Departamento de Planejamento', '2025-02-28', 'Fernanda Oliveira', 'b0000006-0000-0000-0000-000000000006'::uuid, 'Identificar atividades internas e reprogramar', 0.00, 'EM_ANDAMENTO', 'MEDIA', 'ISHIKAWA', '55555555-5555-5555-5555-555555555504'::uuid, 'Chuvas Intensas', NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'b0000006-0000-0000-0000-000000000006'::uuid),
('66666666-6666-6666-6666-666666666610'::uuid, '5W2H-010', 'Acompanhar processo de licenciamento', 'Atraso pode impactar início do projeto', 'Órgão ambiental', '2025-03-15', 'João Silva', 'b0000001-0000-0000-0000-000000000001'::uuid, 'Protocolar ofício e agendar reunião', 0.00, 'PENDENTE', 'ALTA', 'ISHIKAWA', '55555555-5555-5555-5555-555555555510'::uuid, 'Licença Ambiental Atrasada', NULL, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- RESTRICOES LPS (8 restrições)
-- Schema: id, empresa_id, projeto_id (FK -> eps_nodes!), codigo, descricao, categoria, status, prioridade, responsavel_id, responsavel_nome, data_identificacao, data_prevista, data_resolucao, atividade_id, impacto_cronograma, observacoes, created_by
INSERT INTO restricoes_lps (id, empresa_id, projeto_id, codigo, descricao, categoria, status, prioridade, responsavel_id, responsavel_nome, data_identificacao, data_prevista, data_resolucao, atividade_id, impacto_cronograma, observacoes, created_by) VALUES
('77777777-7777-7777-7777-777777777701'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-001', 'Aguardando Liberação Projeto Revisado - Projeto estrutural em revisão pelo calculista', 'PROJETO', 'IDENTIFICADA', 'ALTA', 'b0000001-0000-0000-0000-000000000001'::uuid, 'João Silva', '2025-02-15', '2025-02-28', NULL, 'f0000005-0000-0000-0000-000000000005'::uuid, 5, 'Forma Pilares 1º Pav', 'b0000006-0000-0000-0000-000000000006'::uuid),
('77777777-7777-7777-7777-777777777702'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-002', 'Aço CA-50 em Trânsito - Material previsto para chegar dia 20/02', 'MATERIAL', 'EM_TRATAMENTO', 'ALTA', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', '2025-02-10', '2025-02-20', NULL, 'f0000003-0000-0000-0000-000000000003'::uuid, 3, 'Armação Fundações', 'b0000003-0000-0000-0000-000000000003'::uuid),
('77777777-7777-7777-7777-777777777703'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-003', 'Equipe de Armadores Incompleta - Faltam 2 armadores para completar frente', 'MAO_DE_OBRA', 'RESOLVIDA', 'MEDIA', 'b0000002-0000-0000-0000-000000000002'::uuid, 'Maria Santos', '2025-02-01', '2025-02-08', '2025-02-07', 'f0000003-0000-0000-0000-000000000003'::uuid, 2, 'Armação Fundações', 'b0000002-0000-0000-0000-000000000002'::uuid),
('77777777-7777-7777-7777-777777777704'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-004', 'Bomba de Concreto Reservada - Equipamento reservado para dia 25/02', 'EQUIPAMENTO', 'RESOLVIDA', 'ALTA', 'b0000007-0000-0000-0000-000000000007'::uuid, 'Roberto Dias', '2025-02-12', '2025-02-25', '2025-02-14', 'f0000004-0000-0000-0000-000000000004'::uuid, 0, 'Concretagem Fundações', 'b0000007-0000-0000-0000-000000000007'::uuid),
('77777777-7777-7777-7777-777777777705'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-005', 'Fôrmas Metálicas em Uso - Fôrmas sendo usadas em outra atividade', 'EQUIPAMENTO', 'IDENTIFICADA', 'MEDIA', 'b0000007-0000-0000-0000-000000000007'::uuid, 'Roberto Dias', '2025-02-18', '2025-03-01', NULL, 'f0000005-0000-0000-0000-000000000005'::uuid, 2, 'Forma Pilares 1º Pav', 'b0000007-0000-0000-0000-000000000007'::uuid),
('77777777-7777-7777-7777-777777777706'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-006', 'Aprovação do Cliente Pendente - Aguardando aprovação da cor da fachada', 'OUTROS', 'IDENTIFICADA', 'BAIXA', 'b0000001-0000-0000-0000-000000000001'::uuid, 'João Silva', '2025-02-10', '2025-06-30', NULL, 'f0000012-0000-0000-0000-000000000012'::uuid, 0, 'Pintura Geral', 'b0000001-0000-0000-0000-000000000001'::uuid),
('77777777-7777-7777-7777-777777777707'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-007', 'Blocos Cerâmicos em Estoque - Material já disponível no canteiro', 'MATERIAL', 'RESOLVIDA', 'MEDIA', 'b0000003-0000-0000-0000-000000000003'::uuid, 'Carlos Lima', '2025-03-20', '2025-04-01', '2025-03-25', 'f0000008-0000-0000-0000-000000000008'::uuid, 0, 'Alvenaria Térreo', 'b0000003-0000-0000-0000-000000000003'::uuid),
('77777777-7777-7777-7777-777777777708'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'LPS-008', 'Definição de Layout Elétrico - Aguardando posicionamento das tomadas', 'PROJETO', 'EM_TRATAMENTO', 'MEDIA', 'b0000006-0000-0000-0000-000000000006'::uuid, 'Fernanda Oliveira', '2025-04-15', '2025-04-30', NULL, 'f0000009-0000-0000-0000-000000000009'::uuid, 3, 'Instalações Elétricas Térreo', 'b0000006-0000-0000-0000-000000000006'::uuid)
ON CONFLICT (id) DO NOTHING;

-- RECURSOS (14 recursos)
INSERT INTO recursos (id, empresa_id, codigo, nome, tipo, unidade, custo_por_hora, custo_por_unidade, disponibilidade_horas, ativo) VALUES
('88888888-8888-8888-8888-888888888801'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-001', 'Pedreiro', 'MAO_DE_OBRA', 'h', 45.00, 0, 8, true),
('88888888-8888-8888-8888-888888888802'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-002', 'Armador', 'MAO_DE_OBRA', 'h', 55.00, 0, 8, true),
('88888888-8888-8888-8888-888888888803'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-003', 'Carpinteiro', 'MAO_DE_OBRA', 'h', 50.00, 0, 8, true),
('88888888-8888-8888-8888-888888888804'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-004', 'Eletricista', 'MAO_DE_OBRA', 'h', 60.00, 0, 8, true),
('88888888-8888-8888-8888-888888888805'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-005', 'Encanador', 'MAO_DE_OBRA', 'h', 55.00, 0, 8, true),
('88888888-8888-8888-8888-888888888806'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-006', 'Servente', 'MAO_DE_OBRA', 'h', 25.00, 0, 8, true),
('88888888-8888-8888-8888-888888888807'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-007', 'Retroescavadeira', 'EQUIPAMENTO', 'h', 180.00, 50, 8, true),
('88888888-8888-8888-8888-888888888808'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-008', 'Betoneira 400L', 'EQUIPAMENTO', 'h', 35.00, 20, 8, true),
('88888888-8888-8888-8888-888888888809'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-009', 'Grua Torre 8t', 'EQUIPAMENTO', 'h', 250.00, 100, 10, true),
('88888888-8888-8888-8888-888888888810'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-010', 'Vibrador de Concreto', 'EQUIPAMENTO', 'h', 15.00, 5, 8, true),
('88888888-8888-8888-8888-888888888811'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-011', 'Concreto FCK 30', 'MATERIAL', 'm3', 420.00, 0, 999, true),
('88888888-8888-8888-8888-888888888812'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-012', 'Aço CA-50', 'MATERIAL', 'kg', 8.50, 0, 999, true),
('88888888-8888-8888-8888-888888888813'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-013', 'Bloco Cerâmico', 'MATERIAL', 'un', 2.80, 0, 999, true),
('88888888-8888-8888-8888-888888888814'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'REC-014', 'Forma Metálica', 'EQUIPAMENTO', 'm2', 12.00, 30, 500, true)
ON CONFLICT (id) DO NOTHING;

-- DEPENDENCIAS DE ATIVIDADES (10 dependências)
INSERT INTO dependencias_atividades (id, atividade_origem_id, atividade_destino_id, tipo, lag_dias) VALUES
('99999999-9999-9999-9999-999999999901'::uuid, 'f0000001-0000-0000-0000-000000000001'::uuid, 'f0000002-0000-0000-0000-000000000002'::uuid, 'FS', 0),
('99999999-9999-9999-9999-999999999902'::uuid, 'f0000002-0000-0000-0000-000000000002'::uuid, 'f0000003-0000-0000-0000-000000000003'::uuid, 'SS', 5),
('99999999-9999-9999-9999-999999999903'::uuid, 'f0000003-0000-0000-0000-000000000003'::uuid, 'f0000004-0000-0000-0000-000000000004'::uuid, 'FS', 2),
('99999999-9999-9999-9999-999999999904'::uuid, 'f0000004-0000-0000-0000-000000000004'::uuid, 'f0000005-0000-0000-0000-000000000005'::uuid, 'FS', 0),
('99999999-9999-9999-9999-999999999905'::uuid, 'f0000005-0000-0000-0000-000000000005'::uuid, 'f0000006-0000-0000-0000-000000000006'::uuid, 'SS', 3),
('99999999-9999-9999-9999-999999999906'::uuid, 'f0000006-0000-0000-0000-000000000006'::uuid, 'f0000007-0000-0000-0000-000000000007'::uuid, 'FS', 0),
('99999999-9999-9999-9999-999999999907'::uuid, 'f0000007-0000-0000-0000-000000000007'::uuid, 'f0000008-0000-0000-0000-000000000008'::uuid, 'FS', 7),
('99999999-9999-9999-9999-999999999908'::uuid, 'f0000008-0000-0000-0000-000000000008'::uuid, 'f0000009-0000-0000-0000-000000000009'::uuid, 'SS', 0),
('99999999-9999-9999-9999-999999999909'::uuid, 'f0000008-0000-0000-0000-000000000008'::uuid, 'f0000010-0000-0000-0000-000000000010'::uuid, 'SS', 0),
('99999999-9999-9999-9999-999999999910'::uuid, 'f0000011-0000-0000-0000-000000000011'::uuid, 'f0000012-0000-0000-0000-000000000012'::uuid, 'FS', 0)
ON CONFLICT (id) DO NOTHING;

-- RESOURCE ALLOCATIONS (18 alocações)
INSERT INTO resource_allocations (id, recurso_id, atividade_id, quantidade, percentual_alocacao, horas_planejadas, custo_planejado, data_inicio, data_fim) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001'::uuid, '88888888-8888-8888-8888-888888888801'::uuid, 'f0000008-0000-0000-0000-000000000008'::uuid, 4, 100, 928, 5760.00, '2025-04-01', '2025-04-30'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002'::uuid, '88888888-8888-8888-8888-888888888806'::uuid, 'f0000008-0000-0000-0000-000000000008'::uuid, 2, 100, 464, 1600.00, '2025-04-01', '2025-04-30'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003'::uuid, '88888888-8888-8888-8888-888888888802'::uuid, 'f0000003-0000-0000-0000-000000000003'::uuid, 6, 100, 816, 4752.00, '2025-02-03', '2025-02-20'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004'::uuid, '88888888-8888-8888-8888-888888888812'::uuid, 'f0000003-0000-0000-0000-000000000003'::uuid, 15000, 100, 0, 127500.00, '2025-02-03', '2025-02-20'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005'::uuid, '88888888-8888-8888-8888-888888888807'::uuid, 'f0000002-0000-0000-0000-000000000002'::uuid, 1, 100, 160, 28800.00, '2025-01-21', '2025-02-10'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa006'::uuid, '88888888-8888-8888-8888-888888888806'::uuid, 'f0000002-0000-0000-0000-000000000002'::uuid, 4, 100, 640, 3200.00, '2025-01-21', '2025-02-10'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa007'::uuid, '88888888-8888-8888-8888-888888888808'::uuid, 'f0000004-0000-0000-0000-000000000004'::uuid, 2, 75, 168, 2520.00, '2025-02-15', '2025-03-01'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa008'::uuid, '88888888-8888-8888-8888-888888888810'::uuid, 'f0000004-0000-0000-0000-000000000004'::uuid, 3, 75, 252, 1890.00, '2025-02-15', '2025-03-01'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa009'::uuid, '88888888-8888-8888-8888-888888888811'::uuid, 'f0000004-0000-0000-0000-000000000004'::uuid, 250, 100, 0, 105000.00, '2025-02-15', '2025-03-01'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa010'::uuid, '88888888-8888-8888-8888-888888888803'::uuid, 'f0000005-0000-0000-0000-000000000005'::uuid, 4, 100, 288, 2880.00, '2025-03-01', '2025-03-10'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa011'::uuid, '88888888-8888-8888-8888-888888888814'::uuid, 'f0000005-0000-0000-0000-000000000005'::uuid, 200, 100, 0, 2400.00, '2025-03-01', '2025-03-10'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa012'::uuid, '88888888-8888-8888-8888-888888888802'::uuid, 'f0000006-0000-0000-0000-000000000006'::uuid, 5, 100, 400, 4400.00, '2025-03-08', '2025-03-18'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa013'::uuid, '88888888-8888-8888-8888-888888888809'::uuid, 'f0000006-0000-0000-0000-000000000006'::uuid, 1, 100, 80, 20000.00, '2025-03-08', '2025-03-18'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa014'::uuid, '88888888-8888-8888-8888-888888888804'::uuid, 'f0000009-0000-0000-0000-000000000009'::uuid, 3, 100, 456, 5760.00, '2025-05-01', '2025-05-20'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa015'::uuid, '88888888-8888-8888-8888-888888888805'::uuid, 'f0000010-0000-0000-0000-000000000010'::uuid, 2, 100, 400, 4400.00, '2025-05-01', '2025-05-25'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa016'::uuid, '88888888-8888-8888-8888-888888888801'::uuid, 'f0000011-0000-0000-0000-000000000011'::uuid, 6, 100, 2112, 15840.00, '2025-06-01', '2025-07-15'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa017'::uuid, '88888888-8888-8888-8888-888888888801'::uuid, 'f0000012-0000-0000-0000-000000000012'::uuid, 4, 100, 1440, 12960.00, '2025-07-16', '2025-08-30'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa018'::uuid, '88888888-8888-8888-8888-888888888806'::uuid, 'f0000001-0000-0000-0000-000000000001'::uuid, 2, 100, 80, 800.00, '2025-01-15', '2025-01-20')
ON CONFLICT (id) DO NOTHING;

-- FIM DO SCRIPT
SELECT 'VisionPlan database seed complete!' as status;
