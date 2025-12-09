import React from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutShell } from './LayoutShell';
import { 
  LayoutDashboard, 
  Users,
  Building2,
  Palette,
  Shield,
  Database,
  Settings,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Painel Admin', 
      path: '/admin',
      roles: ['ADMIN']
    },
    { 
      icon: Users, 
      label: 'Usuários', 
      path: '/admin/usuarios',
      roles: ['ADMIN']
    },
    { 
      icon: Building2, 
      label: 'Empresas', 
      path: '/admin/empresas',
      roles: ['ADMIN']
    },
    { 
      icon: Shield, 
      label: 'Perfis de Acesso', 
      path: '/admin/perfis',
      roles: ['ADMIN']
    },
    { 
      icon: Palette, 
      label: 'Temas', 
      path: '/admin/temas',
      roles: ['ADMIN']
    },
    { 
      icon: Database, 
      label: 'Estrutura EPS/OBS', 
      path: '/admin/eps',
      roles: ['ADMIN']
    },
    { 
      icon: Settings, 
      label: 'Configurações', 
      path: '/admin/configuracoes',
      roles: ['ADMIN']
    },
  ];

  return (
    <LayoutShell
      menuItems={menuItems}
      title="Admin"
      subtitle="Gestão do Sistema"
      logoLetter="A"
      logoColor="#6366f1"
      noPadding={false}
    >
      <Outlet />
    </LayoutShell>
  );
};
