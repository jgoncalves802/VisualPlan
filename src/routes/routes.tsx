import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/Layout';
import { LoginPage } from '../pages/Login';
import DashboardPage from '../pages/DashboardPage';
import { CronogramaPage } from '../pages/CronogramaPage';
import KanbanPage from '../pages/KanbanPage';
import { RestricoesPage } from '../pages/RestricoesPage';
import { LPSPage } from '../pages/LPSPage';
import { ConfiguracoesPage } from '../pages/ConfiguracoesPage';
import AdminPage from '../pages/AdminPage';
import AdminUsuariosPage from '../pages/AdminUsuariosPage';
import AdminEmpresasPage from '../pages/AdminEmpresasPage';
import AdminTemasPage from '../pages/AdminTemasPage';
import AdminPerfisPage from '../pages/AdminPerfisPage';
import AdminEPSPage from '../pages/AdminEPSPage';
import { SVARTestPage } from '../pages/SVARTestPage';
import { useAuthStore } from '../stores/authStore';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Placeholder pages (to be implemented)
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h1>
      <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
        Esta página está em desenvolvimento
      </p>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/test/svar" element={<SVARTestPage />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projetos" element={<PlaceholderPage title="Projetos" />} />
          <Route path="planejamento" element={<PlaceholderPage title="Planejamento" />} />
          <Route path="cronograma/:projetoId" element={<CronogramaPage />} />
          <Route path="lps" element={<LPSPage />} />
          <Route path="restricoes" element={<RestricoesPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="bim" element={<PlaceholderPage title="BIM 4D" />} />
          <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
          <Route path="perfil" element={<PlaceholderPage title="Meu Perfil" />} />
          
          {/* Admin Routes */}
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/usuarios" element={<AdminUsuariosPage />} />
          <Route path="admin/empresas" element={<AdminEmpresasPage />} />
          <Route path="admin/temas" element={<AdminTemasPage />} />
          <Route path="admin/perfis" element={<AdminPerfisPage />} />
          <Route path="admin/eps" element={<AdminEPSPage />} />
          <Route path="admin/seguranca" element={<PlaceholderPage title="Segurança" />} />
          <Route path="admin/relatorios" element={<PlaceholderPage title="Relatórios" />} />
          <Route path="admin/logs" element={<PlaceholderPage title="Logs de Atividade" />} />
          <Route path="admin/api-keys" element={<PlaceholderPage title="Chaves de API" />} />
          <Route path="admin/configuracoes" element={<PlaceholderPage title="Configurações Gerais" />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
