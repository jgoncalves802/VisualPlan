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
      label: 'WBS - Todos Projetos', 
      path: '/wbs',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: Calendar, 
      label: 'Gantt / Cronograma', 
      path: '/cronograma/proj-1',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: KanbanSquare, 
      label: 'Kanban de Execução', 
      path: '/kanban',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'COLABORADOR', 'ENCARREGADO', 'MESTRE_OBRAS', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: FileText, 
      label: 'LPS', 
      path: '/lps',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: AlertTriangle, 
      label: 'Restrições', 
      path: '/restricoes',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: Box, 
      label: 'BIM / 4D', 
      path: '/bim',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA']
    },
    { 
      icon: FileText, 
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
