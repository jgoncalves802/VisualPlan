-- VisionPlan - Reset Database
-- ATENÇÃO: Este script apaga TODOS os dados do banco!
-- Execute com cuidado.

-- Desabilita constraints temporariamente para permitir DELETE em qualquer ordem
SET session_replication_role = 'replica';

-- Limpa todas as tabelas de dados (na ordem de dependências)
TRUNCATE TABLE acoes_5w2h CASCADE;
TRUNCATE TABLE restricoes_ishikawa CASCADE;
TRUNCATE TABLE restricoes_lps CASCADE;
TRUNCATE TABLE auditorias CASCADE;
TRUNCATE TABLE checklist_templates CASCADE;
TRUNCATE TABLE solicitacoes_mudanca CASCADE;
TRUNCATE TABLE reunioes CASCADE;
TRUNCATE TABLE pautas_reuniao CASCADE;
TRUNCATE TABLE resource_allocations CASCADE;
TRUNCATE TABLE recursos CASCADE;
TRUNCATE TABLE dependencias_atividades CASCADE;
TRUNCATE TABLE atividades_cronograma CASCADE;
TRUNCATE TABLE atividades CASCADE;
TRUNCATE TABLE wbs_nodes CASCADE;
TRUNCATE TABLE projetos CASCADE;
TRUNCATE TABLE eps_nodes CASCADE;
TRUNCATE TABLE usuarios CASCADE;
TRUNCATE TABLE empresas CASCADE;

-- Reabilita constraints
SET session_replication_role = 'origin';

-- Confirma limpeza
SELECT 'Database reset complete!' as status;
