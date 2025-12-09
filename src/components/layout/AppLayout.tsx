import React from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutShell } from './LayoutShell';
import { useTemaStore } from '../../stores/temaStore';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  Calendar, 
  AlertTriangle, 
  Box,
  FileText,
  Network,
  ClipboardCheck,
  GitBranch,
  Fish,
  Users,
  Briefcase,
  ListChecks,
  BarChart3,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { tema } = useTemaStore();

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dashboard',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'COLABORADOR', 'ENCARREGADO', 'MESTRE_OBRAS', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: Network, 
      label: 'WBS', 
      path: '/wbs',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: Calendar, 
      label: 'Cronograma', 
      path: '/cronograma/proj-1',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: KanbanSquare, 
      label: 'Kanban', 
      path: '/kanban',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'COLABORADOR', 'ENCARREGADO', 'MESTRE_OBRAS', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: FileText, 
      label: 'LPS', 
      path: '/lps',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD'],
      separator: true,
    },
    { 
      icon: AlertTriangle, 
      label: 'Restrições', 
      path: '/restricoes',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: ListChecks, 
      label: 'Ações 5W2H', 
      path: '/acoes',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: ClipboardCheck, 
      label: 'Auditorias', 
      path: '/auditorias',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: GitBranch, 
      label: 'Mudanças', 
      path: '/mudancas',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD'],
      separator: true,
    },
    { 
      icon: Fish, 
      label: 'Ishikawa', 
      path: '/analise-ishikawa',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: Users, 
      label: 'Reuniões', 
      path: '/reunioes',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: Briefcase, 
      label: 'Portfolio', 
      path: '/portfolio',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO'],
      separator: true,
    },
    { 
      icon: Box, 
      label: 'BIM / 4D', 
      path: '/bim',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA']
    },
    { 
      icon: BarChart3, 
      label: 'Relatórios', 
      path: '/relatorios',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
  ];

  return (
    <LayoutShell
      menuItems={menuItems}
      title="VisionPlan"
      logoLetter="V"
      logoColor={tema.primary}
      noPadding={true}
    >
      <Outlet />
    </LayoutShell>
  );
};
