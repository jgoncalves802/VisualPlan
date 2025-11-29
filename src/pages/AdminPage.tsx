import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Palette,
  Shield,
  Settings,
  UserPlus,
  Lock,
  BarChart3,
  FileText,
  Key,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { PerfilAcesso } from '../types';

interface AdminCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  requiredProfiles?: PerfilAcesso[];
}

const adminCards: AdminCard[] = [
  {
    id: 'usuarios',
    title: 'Gestão de Usuários',
    description: 'Criar, editar e gerenciar usuários do sistema',
    icon: <Users className="w-10 h-10" />,
    path: '/admin/usuarios',
    color: 'var(--color-primary-500)',
    requiredProfiles: [PerfilAcesso.ADMIN, PerfilAcesso.DIRETOR],
  },
  {
    id: 'empresas',
    title: 'Gestão de Empresas',
    description: 'Gerenciar empresas e clientes cadastrados',
    icon: <Building2 className="w-10 h-10" />,
    path: '/admin/empresas',
    color: 'var(--color-info)',
    requiredProfiles: [PerfilAcesso.ADMIN],
  },
  {
    id: 'criar-usuario',
    title: 'Criar Usuário',
    description: 'Cadastrar novo usuário no sistema',
    icon: <UserPlus className="w-10 h-10" />,
    path: '/admin/usuarios?action=create',
    color: 'var(--color-success)',
    requiredProfiles: [PerfilAcesso.ADMIN, PerfilAcesso.DIRETOR],
  },
  {
    id: 'temas',
    title: 'Personalização',
    description: 'Configurar logo e cores da empresa',
    icon: <Palette className="w-10 h-10" />,
    path: '/admin/temas',
    color: '#9333ea',
    requiredProfiles: [PerfilAcesso.ADMIN],
  },
  {
    id: 'perfis',
    title: 'Perfis de Acesso',
    description: 'Gerenciar permissões e níveis de acesso',
    icon: <Shield className="w-10 h-10" />,
    path: '/admin/perfis',
    color: 'var(--color-warning)',
    requiredProfiles: [PerfilAcesso.ADMIN],
  },
  {
    id: 'seguranca',
    title: 'Segurança',
    description: 'Configurações de segurança e políticas',
    icon: <Lock className="w-10 h-10" />,
    path: '/admin/seguranca',
    color: '#dc2626',
    requiredProfiles: [PerfilAcesso.ADMIN],
  },
];

const reportCards: AdminCard[] = [
  {
    id: 'relatorios',
    title: 'Relatórios',
    description: 'Visualizar relatórios administrativos',
    icon: <BarChart3 className="w-10 h-10" />,
    path: '/admin/relatorios',
    color: 'var(--color-primary-600)',
    requiredProfiles: [PerfilAcesso.ADMIN, PerfilAcesso.DIRETOR],
  },
  {
    id: 'logs',
    title: 'Logs de Atividade',
    description: 'Auditar ações realizadas no sistema',
    icon: <FileText className="w-10 h-10" />,
    path: '/admin/logs',
    color: '#64748b',
    requiredProfiles: [PerfilAcesso.ADMIN],
  },
  {
    id: 'api-keys',
    title: 'Chaves de API',
    description: 'Gerenciar integrações e chaves',
    icon: <Key className="w-10 h-10" />,
    path: '/admin/api-keys',
    color: '#0891b2',
    requiredProfiles: [PerfilAcesso.ADMIN],
  },
  {
    id: 'configuracoes',
    title: 'Configurações Gerais',
    description: 'Ajustes e preferências do sistema',
    icon: <Settings className="w-10 h-10" />,
    path: '/admin/configuracoes',
    color: '#475569',
    requiredProfiles: [PerfilAcesso.ADMIN],
  },
];

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();

  const filterCardsByProfile = (cards: AdminCard[]) => {
    return cards.filter((card) => {
      if (!card.requiredProfiles) return true;
      return usuario && card.requiredProfiles.includes(usuario.perfilAcesso);
    });
  };

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  const CardGrid: React.FC<{ cards: AdminCard[]; title: string }> = ({ cards, title }) => {
    const filteredCards = filterCardsByProfile(cards);
    
    if (filteredCards.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-900">
          {title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.path)}
              className="flex flex-col items-center p-6 rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg hover:-translate-y-1 text-center group"
            >
              <div
                className="mb-3 p-3 rounded-xl transition-transform group-hover:scale-110"
                style={{ 
                  backgroundColor: `${card.color}15`,
                  color: card.color 
                }}
              >
                {card.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1 text-gray-900">
                {card.title}
              </h3>
              <p className="text-xs leading-tight text-gray-600">
                {card.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">
          Administração
        </h1>
        <p className="text-sm text-gray-600">
          Gerencie usuários, empresas, permissões e configurações do sistema
        </p>
      </div>

      <CardGrid cards={adminCards} title="Gestão de Acesso" />
      <CardGrid cards={reportCards} title="Relatórios e Configurações" />

      {!usuario && (
        <div className="text-center py-12 rounded-lg bg-white border border-gray-200">
          <Shield className="w-16 h-16 mx-auto mb-4 opacity-30 text-gray-400" />
          <p className="text-lg font-medium text-gray-900">
            Acesso Restrito
          </p>
          <p className="text-sm text-gray-600">
            Você precisa estar autenticado para acessar esta área
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
