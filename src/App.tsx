import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useTemaStore } from './stores/temaStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KanbanPage from './pages/KanbanPage';
import AdminTemasPage from './pages/AdminTemasPage';
import './styles/global.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
          path="/gantt"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold theme-text mb-4">Gantt / Cronograma</h2>
                  <p className="theme-text-secondary">Módulo em desenvolvimento...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/lps"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold theme-text mb-4">LPS / Restrições</h2>
                  <p className="theme-text-secondary">Módulo em desenvolvimento...</p>
                </div>
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

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
