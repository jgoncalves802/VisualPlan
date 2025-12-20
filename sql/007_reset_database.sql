-- VisionPlan - Reset Database
-- ATENÇÃO: Este script apaga TODOS os dados do banco!
-- Execute com cuidado.

-- Limpa tabelas na ordem correta (filhas antes das pais)
DELETE FROM resource_allocations;
DELETE FROM dependencias_atividades;
DELETE FROM acoes_5w2h;
DELETE FROM restricoes_ishikawa;
DELETE FROM restricoes_lps;
DELETE FROM auditorias;
DELETE FROM solicitacoes_mudanca;
DELETE FROM reunioes;
DELETE FROM pautas_reuniao;
DELETE FROM checklist_templates;
DELETE FROM atividades_cronograma;
DELETE FROM atividades;
DELETE FROM recursos;
DELETE FROM wbs_nodes;
DELETE FROM projetos;
DELETE FROM eps_nodes;
DELETE FROM usuarios;
DELETE FROM empresas;

-- Confirma limpeza
SELECT 'Database reset complete!' as status;
