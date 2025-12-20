-- VisionPlan - Reset Database (Simple Version)
-- ATENÇÃO: Este script apaga TODOS os dados do banco!

-- Deleta na ordem correta de dependências (filhas primeiro)
DELETE FROM resource_allocations;
DELETE FROM dependencias_atividades;
DELETE FROM acoes_5w2h;
DELETE FROM restricoes_ishikawa;
DELETE FROM restricoes_lps;
DELETE FROM auditorias;
DELETE FROM checklist_templates;
DELETE FROM solicitacoes_mudanca;
DELETE FROM pautas_reuniao;
DELETE FROM reunioes;
DELETE FROM atividades_cronograma;
DELETE FROM recursos;
DELETE FROM wbs_nodes;
DELETE FROM projetos;
DELETE FROM eps_nodes;
DELETE FROM usuarios;
DELETE FROM empresas;

SELECT 'Reset complete!' as status;
