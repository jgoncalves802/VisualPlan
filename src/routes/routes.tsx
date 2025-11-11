import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/common/MainLayout';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { CronogramaPage } from './pages/CronogramaPage';
import { useAuthStore } from './store';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="spinner"></div>
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
          <Route path="lps" element={<PlaceholderPage title="Last Planner System" />} />
          <Route path="restricoes" element={<PlaceholderPage title="Gestão de Restrições" />} />
          <Route path="kanban" element={<PlaceholderPage title="Minhas Tarefas" />} />
          <Route path="bim" element={<PlaceholderPage title="BIM 4D" />} />
          <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
          <Route path="usuarios" element={<PlaceholderPage title="Gestão de Usuários" />} />
          <Route path="configuracoes" element={<PlaceholderPage title="Configurações" />} />
          <Route path="perfil" element={<PlaceholderPage title="Meu Perfil" />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
