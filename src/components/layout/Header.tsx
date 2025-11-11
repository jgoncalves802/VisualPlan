import React, { useState } from 'react';
import {
  Bell,
  Maximize,
  Moon,
  Sun,
  LogOut,
  User,
  Palette,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { useUIStore, useAuthStore, useThemeStore, useNotificationStore } from '../../store';
import { Button } from './Button';
import { ThemeCustomizer } from '../admin/ThemeCustomizer';
import { PerfilAcesso } from '../../types';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { presentationMode, togglePresentationMode, sidebarOpen } = useUIStore();
  const { usuario, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { notifications, unreadCount, markAsRead } = useNotificationStore();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const canCustomizeTheme = usuario?.perfilAcesso === PerfilAcesso.ADMIN;

  if (presentationMode) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePresentationMode}
          className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
        >
          Sair do Modo Apresentação
        </Button>
      </div>
    );
  }

  return (
    <>
      <header
        className={classNames(
          'fixed top-0 right-0 h-16 transition-theme z-30',
          {
            'left-64': sidebarOpen,
            'left-20': !sidebarOpen,
          }
        )}
        style={{
          backgroundColor: 'var(--color-bg-main)',
          borderBottom: '1px solid var(--color-secondary-200)',
        }}
      >
        <div className="h-full px-6 flex items-center justify-between">
          {/* Project Selector */}
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Projeto: Edifício Corporativo X
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Em Andamento • 45% Concluído
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
              ) : (
                <Moon className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
              )}
            </button>

            {/* Presentation Mode */}
            <button
              onClick={togglePresentationMode}
              className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              title="Modo Apresentação"
            >
              <Maximize className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-secondary-100 transition-colors"
                title="Notificações"
              >
                <Bell className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-lg shadow-xl max-h-96 overflow-y-auto custom-scrollbar"
                  style={{
                    backgroundColor: 'var(--color-bg-main)',
                    border: '1px solid var(--color-secondary-200)',
                  }}
                >
                  <div className="p-4 border-b" style={{ borderColor: 'var(--color-secondary-200)' }}>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      Notificações
                    </h3>
                    {unreadCount > 0 && (
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {unreadCount} não lidas
                      </p>
                    )}
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--color-secondary-200)' }}>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Nenhuma notificação
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={classNames(
                            'w-full p-4 text-left hover:bg-secondary-50 transition-colors',
                            {
                              'bg-primary-50': !notif.lida,
                            }
                          )}
                        >
                          <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {notif.titulo}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {notif.mensagem}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                  {usuario?.nome.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl"
                  style={{
                    backgroundColor: 'var(--color-bg-main)',
                    border: '1px solid var(--color-secondary-200)',
                  }}
                >
                  <div className="p-4 border-b" style={{ borderColor: 'var(--color-secondary-200)' }}>
                    <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {usuario?.nome}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {usuario?.email}
                    </p>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={() => navigate('/perfil')}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-100 transition-colors"
                    >
                      <User className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                      <span style={{ color: 'var(--color-text-primary)' }}>Meu Perfil</span>
                    </button>
                    
                    {canCustomizeTheme && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowThemeCustomizer(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-100 transition-colors"
                      >
                        <Palette className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                        <span style={{ color: 'var(--color-text-primary)' }}>Customizar Tema</span>
                      </button>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-danger hover:text-white transition-colors text-danger"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Theme Customizer Modal */}
      {canCustomizeTheme && usuario && (
        <ThemeCustomizer
          isOpen={showThemeCustomizer}
          onClose={() => setShowThemeCustomizer(false)}
          empresaId={usuario.empresaId}
        />
      )}
    </>
  );
};
