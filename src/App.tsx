import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useTemaStore } from './stores/temaStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KanbanPage from './pages/KanbanPage';
import AdminTemasPage from './pages/AdminTemasPage';
import AdminUsuariosPage from './pages/AdminUsuariosPage';
import AdminEmpresasPage from './pages/AdminEmpresasPage';
import { CronogramaPage } from './pages/CronogramaPage';
import { WBSPage } from './pages/WBSPage';
import { LPSPage } from './pages/LPSPage';
import { RestricoesPage } from './pages/RestricoesPage';
import { PerfilAcesso } from './types';
import './styles/global.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin Protected Route - Only for ADMIN users
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, usuario } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (usuario?.perfilAcesso !== PerfilAcesso.ADMIN && usuario?.perfilAcesso !== PerfilAcesso.DIRETOR) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { aplicarTema } = useTemaStore();

  // Aplicar tema ao carregar a aplicação
  useEffect(() => {
    aplicarTema();
  }, [aplicarTema]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas Protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Navigate to="/dashboard" replace />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/kanban"
          element={
            <ProtectedRoute>
              <Layout>
                <KanbanPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/cronograma/:projetoId"
          element={
            <ProtectedRoute>
              <Layout>
                <CronogramaPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/wbs"
          element={
            <ProtectedRoute>
              <Layout>
                <WBSPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Redirect /gantt para /cronograma/proj-1 */}
        <Route
          path="/gantt"
          element={<Navigate to="/cronograma/proj-1" replace />}
        />
        
        <Route
          path="/lps"
          element={
            <ProtectedRoute>
              <Layout>
                <LPSPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/lps/:projetoId"
          element={
            <ProtectedRoute>
              <Layout>
                <LPSPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/restricoes"
          element={
            <ProtectedRoute>
              <Layout>
                <RestricoesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/restricoes/:projetoId"
          element={
            <ProtectedRoute>
              <Layout>
                <RestricoesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/bim"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold theme-text mb-4">BIM / 4D Viewer</h2>
                  <p className="theme-text-secondary">Módulo em desenvolvimento...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold theme-text mb-4">Relatórios</h2>
                  <p className="theme-text-secondary">Módulo em desenvolvimento...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout>
                <AdminTemasPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/usuarios"
          element={
            <AdminRoute>
              <Layout>
                <AdminUsuariosPage />
              </Layout>
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/empresas"
          element={
            <AdminRoute>
              <Layout>
                <AdminEmpresasPage />
              </Layout>
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/temas"
          element={
            <AdminRoute>
              <Layout>
                <AdminTemasPage />
              </Layout>
            </AdminRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
