import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useTemaStore } from './stores/temaStore';
import { PerfilAcesso } from './types';
import { ToastProvider } from './components/ui';
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KanbanPage from './pages/KanbanPage';
import AdminTemasPage from './pages/AdminTemasPage';
import AdminUsuariosPage from './pages/AdminUsuariosPage';
import AdminEmpresasPage from './pages/AdminEmpresasPage';
import AdminPage from './pages/AdminPage';
import AdminPerfisPage from './pages/AdminPerfisPage';
import AdminEPSPage from './pages/AdminEPSPage';
import { CronogramaPage } from './pages/CronogramaPage';
import { WBSPage } from './pages/WBSPage';
import { LPSPage } from './pages/LPSPage';
import { RestricoesPage } from './pages/RestricoesPage';
import AnaliseIshikawaPage from './pages/AnaliseIshikawaPage';
import ReunioesPage from './pages/ReunioesPage';
import PortfolioPage from './pages/PortfolioPage';
import Acoes5W2HPage from './pages/Acoes5W2HPage';
import AuditoriaPage from './pages/AuditoriaPage';
import GestaoMudancaPage from './pages/GestaoMudancaPage';
import { RecursosPage } from './pages/RecursosPage';
import TakeoffPage from './pages/TakeoffPage';
import './styles/global.css';

const ProtectedAppLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <AppLayout />;
};

const ProtectedAdminLayout: React.FC = () => {
  const { isAuthenticated, usuario } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (usuario?.perfilAcesso !== PerfilAcesso.ADMIN && usuario?.perfilAcesso !== PerfilAcesso.DIRETOR) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <AdminLayout />;
};

function App() {
  const { aplicarTema } = useTemaStore();

  useEffect(() => {
    aplicarTema();
  }, [aplicarTema]);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedAppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wbs" element={<WBSPage />} />
            <Route path="/cronograma" element={<CronogramaPage />} />
            <Route path="/cronograma/:projetoId" element={<CronogramaPage />} />
            <Route path="/recursos" element={<RecursosPage />} />
            <Route path="/takeoff" element={<TakeoffPage />} />
            <Route path="/gantt" element={<Navigate to="/cronograma" replace />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/lps" element={<LPSPage />} />
            <Route path="/lps/:projetoId" element={<LPSPage />} />
            <Route path="/restricoes" element={<RestricoesPage />} />
            <Route path="/restricoes/:projetoId" element={<RestricoesPage />} />
            <Route path="/acoes" element={<Acoes5W2HPage />} />
            <Route path="/auditorias" element={<AuditoriaPage />} />
            <Route path="/mudancas" element={<GestaoMudancaPage />} />
            <Route path="/analise-ishikawa" element={<AnaliseIshikawaPage />} />
            <Route path="/reunioes" element={<ReunioesPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/bim" element={
              <div className="p-6 text-center py-12">
                <h2 className="text-2xl font-bold theme-text mb-4">BIM / 4D Viewer</h2>
                <p className="theme-text-secondary">Módulo em desenvolvimento...</p>
              </div>
            } />
            <Route path="/relatorios" element={
              <div className="p-6 text-center py-12">
                <h2 className="text-2xl font-bold theme-text mb-4">Relatórios</h2>
                <p className="theme-text-secondary">Módulo em desenvolvimento...</p>
              </div>
            } />
          </Route>

          <Route element={<ProtectedAdminLayout />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
            <Route path="/admin/empresas" element={<AdminEmpresasPage />} />
            <Route path="/admin/temas" element={<AdminTemasPage />} />
            <Route path="/admin/perfis" element={<AdminPerfisPage />} />
            <Route path="/admin/eps" element={<AdminEPSPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
