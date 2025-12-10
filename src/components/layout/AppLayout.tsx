import React from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutShell } from './LayoutShell';
import { useTemaStore } from '../../stores/temaStore';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  Calendar, 
  AlertTriangle, 
  Network,
  ClipboardCheck,
  GitBranch,
  Fish,
  Users,
  Briefcase,
  ListChecks,
  BarChart3,
  FileText,
} from 'lucide-react';

const allRoles = ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'COLABORADOR', 'ENCARREGADO', 'MESTRE_OBRAS', 'FISCALIZACAO_LEAD'];
const managementRoles = ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD'];
const executiveRoles = ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO'];

export const AppLayout: React.FC = () => {
  const { tema } = useTemaStore();

  const menuGroups = [
    {
      id: 'visao',
      label: 'Visão Geral',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: allRoles },
        { icon: Network, label: 'WBS', path: '/wbs', roles: managementRoles },
        { icon: Briefcase, label: 'Portfolio', path: '/portfolio', roles: executiveRoles },
      ]
    },
    {
      id: 'planejamento',
      label: 'Planejamento',
      items: [
        { icon: Calendar, label: 'Cronograma', path: '/cronograma', roles: managementRoles },
        { icon: FileText, label: 'LPS', path: '/lps', roles: managementRoles },
      ]
    },
    {
      id: 'execucao',
      label: 'Execução',
      items: [
        { icon: KanbanSquare, label: 'Kanban', path: '/kanban', roles: allRoles },
        { icon: AlertTriangle, label: 'Restrições', path: '/restricoes', roles: managementRoles },
        { icon: ListChecks, label: 'Ações 5W2H', path: '/acoes', roles: managementRoles },
      ]
    },
    {
      id: 'gestao',
      label: 'Gestão & Controle',
      items: [
        { icon: ClipboardCheck, label: 'Auditorias', path: '/auditorias', roles: managementRoles },
        { icon: GitBranch, label: 'Mudanças', path: '/mudancas', roles: managementRoles },
        { icon: Users, label: 'Reuniões', path: '/reunioes', roles: managementRoles },
      ]
    },
    {
      id: 'analise',
      label: 'Análise & Melhoria',
      items: [
        { icon: Fish, label: 'Ishikawa', path: '/analise-ishikawa', roles: managementRoles },
        { icon: BarChart3, label: 'Relatórios', path: '/relatorios', roles: managementRoles },
      ]
    },
  ];

  const menuItems = menuGroups.flatMap(g => g.items);

  return (
    <LayoutShell
      menuItems={menuItems}
      menuGroups={menuGroups}
      title="VisionPlan"
      logoLetter="V"
      logoColor={tema.primary}
      noPadding={true}
    >
      <Outlet />
    </LayoutShell>
  );
};
