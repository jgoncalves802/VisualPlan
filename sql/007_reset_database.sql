-- VisionPlan - Reset Database
-- ATENÇÃO: Este script apaga TODOS os dados do banco!
-- Execute com cuidado.
-- Usa DO block para ignorar erros de tabelas inexistentes

DO $$
BEGIN
  -- Tabelas de alocação/relacionamento
  EXECUTE 'DELETE FROM resource_allocations' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resource_allocations');
  EXECUTE 'DELETE FROM resource_conflicts' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resource_conflicts');
  EXECUTE 'DELETE FROM resource_rates' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resource_rates');
  EXECUTE 'DELETE FROM resource_curves' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resource_curves');
  EXECUTE 'DELETE FROM resource_assignment_periods' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resource_assignment_periods');
  EXECUTE 'DELETE FROM dependencias_atividades' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dependencias_atividades');
  EXECUTE 'DELETE FROM baseline_dependencies' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'baseline_dependencies');
  EXECUTE 'DELETE FROM baseline_tasks' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'baseline_tasks');
  EXECUTE 'DELETE FROM baselines' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'baselines');
  EXECUTE 'DELETE FROM activity_task_codes' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_task_codes');
  EXECUTE 'DELETE FROM activity_code_values' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_code_values');
  EXECUTE 'DELETE FROM activity_code_types' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_code_types');
  
  -- Tabelas de gestão
  EXECUTE 'DELETE FROM acoes_5w2h' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'acoes_5w2h');
  EXECUTE 'DELETE FROM restricoes_ishikawa' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'restricoes_ishikawa');
  EXECUTE 'DELETE FROM restricoes_lps' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'restricoes_lps');
  EXECUTE 'DELETE FROM auditorias' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auditorias');
  EXECUTE 'DELETE FROM solicitacoes_mudanca' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'solicitacoes_mudanca');
  EXECUTE 'DELETE FROM pautas_reuniao' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pautas_reuniao');
  EXECUTE 'DELETE FROM reunioes' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reunioes');
  EXECUTE 'DELETE FROM checklist_templates' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'checklist_templates');
  EXECUTE 'DELETE FROM excecoes_calendario' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'excecoes_calendario');
  EXECUTE 'DELETE FROM calendarios_projeto' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calendarios_projeto');
  
  -- Tabelas de cronograma
  EXECUTE 'DELETE FROM cronograma_column_configs' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cronograma_column_configs');
  EXECUTE 'DELETE FROM atividades_cronograma' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'atividades_cronograma');
  EXECUTE 'DELETE FROM atividades' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'atividades');
  EXECUTE 'DELETE FROM resources' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resources');
  EXECUTE 'DELETE FROM recursos' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recursos');
  EXECUTE 'DELETE FROM resource_types' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resource_types');
  
  -- Tabelas de estrutura
  EXECUTE 'DELETE FROM wbs_nodes' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wbs_nodes');
  EXECUTE 'DELETE FROM projetos' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projetos');
  EXECUTE 'DELETE FROM organizational_units' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizational_units');
  EXECUTE 'DELETE FROM obs_nodes' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'obs_nodes');
  EXECUTE 'DELETE FROM eps_nodes' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'eps_nodes');
  
  -- Tabelas de perfis
  EXECUTE 'DELETE FROM usuario_perfis' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuario_perfis');
  EXECUTE 'DELETE FROM profile_permissions' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profile_permissions');
  EXECUTE 'DELETE FROM access_profiles' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'access_profiles');
  EXECUTE 'DELETE FROM permission_catalog' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'permission_catalog');
  
  -- Tabelas base
  EXECUTE 'DELETE FROM usuarios' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios');
  EXECUTE 'DELETE FROM temas_customizados' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'temas_customizados');
  EXECUTE 'DELETE FROM empresas' WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'empresas');
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erro ignorado: %', SQLERRM;
END $$;

-- Confirma limpeza
SELECT 'Database reset complete!' as status;
