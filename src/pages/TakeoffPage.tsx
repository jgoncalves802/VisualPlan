import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Upload, 
  Download, 
  LayoutGrid,
  Link2,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  Loader2,
  ChevronRight,
  Search,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTakeoffStore } from '../stores/takeoffStore';
import { useEpsStore } from '../stores/epsStore';
import TakeoffGrid from '../components/features/takeoff/TakeoffGrid';
import TakeoffDashboard from '../components/features/takeoff/TakeoffDashboard';
import TakeoffImportModal from '../components/features/takeoff/TakeoffImportModal';
import TakeoffMapaModal from '../components/features/takeoff/TakeoffMapaModal';

type TabType = 'dashboard' | 'mapas' | 'vinculos' | 'medicoes' | 'documentos' | 'config';

const TakeoffPage: React.FC = () => {
  const { usuario } = useAuthStore();
  const { 
    disciplinas, 
    mapas,
    selectedDisciplinaId,
    selectedMapaId,
    selectedProjetoId,
    isLoading,
    loadDisciplinas,
    initializeDisciplinas,
    loadMapas,
    setSelectedDisciplina,
    setSelectedMapa,
    setSelectedProjeto,
  } = useTakeoffStore();
  
  const { projetos, loadProjetos } = useEpsStore();

  const [activeTab, setActiveTab] = useState<TabType>('mapas');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMapaModal, setShowMapaModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (usuario?.empresaId) {
      loadDisciplinas(usuario.empresaId);
      loadProjetos(usuario.empresaId);
    }
  }, [usuario?.empresaId, loadDisciplinas, loadProjetos]);

  const handleInitializeDisciplinas = async () => {
    if (usuario?.empresaId) {
      await initializeDisciplinas(usuario.empresaId);
    }
  };

  const handleProjetoChange = (projetoId: string) => {
    setSelectedProjeto(projetoId);
    loadMapas(projetoId, selectedDisciplinaId || undefined);
  };

  const handleDisciplinaChange = (disciplinaId: string | null) => {
    setSelectedDisciplina(disciplinaId);
    if (selectedProjetoId) {
      loadMapas(selectedProjetoId, disciplinaId || undefined);
    }
  };

  const handleMapaSelect = (mapaId: string) => {
    setSelectedMapa(mapaId);
    setActiveTab('mapas');
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
    { id: 'mapas' as TabType, label: 'Mapas de Controle', icon: LayoutGrid },
    { id: 'vinculos' as TabType, label: 'Vínculos', icon: Link2 },
    { id: 'medicoes' as TabType, label: 'Medições', icon: Calendar },
    { id: 'documentos' as TabType, label: 'Documentos', icon: FileText },
    { id: 'config' as TabType, label: 'Configurações', icon: Settings },
  ];

  const filteredMapas = mapas.filter(mapa => 
    !searchTerm || 
    mapa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapa.disciplina?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 theme-surface border-b theme-divide px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 theme-text-secondary" />
            <div>
              <h1 className="text-xl font-bold theme-text">Take-off / Levantamento de Quantidades</h1>
              <p className="text-sm theme-text-secondary">Gestão de quantitativos e avanço físico</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedMapaId && (
              <>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm theme-text rounded-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)' }}
                >
                  <Upload className="w-4 h-4" />
                  Importar Excel
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm theme-text rounded-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)' }}
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              </>
            )}
            {selectedProjetoId && selectedDisciplinaId && (
              <button
                onClick={() => setShowMapaModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg hover:opacity-90 transition-opacity theme-text"
                style={{ backgroundColor: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border)' }}
              >
                <Plus className="w-4 h-4" />
                Novo Mapa
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium theme-text-secondary">Projeto:</label>
            <select
              value={selectedProjetoId || ''}
              onChange={(e) => handleProjetoChange(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg theme-text"
              style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
            >
              <option value="">Selecione um projeto</option>
              {projetos.map((projeto) => (
                <option key={projeto.id} value={projeto.id}>
                  {projeto.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium theme-text-secondary">Disciplina:</label>
            <select
              value={selectedDisciplinaId || ''}
              onChange={(e) => handleDisciplinaChange(e.target.value || null)}
              className="px-3 py-1.5 text-sm border rounded-lg theme-text"
              style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
              disabled={!selectedProjetoId}
            >
              <option value="">Todas</option>
              {disciplinas.map((disc) => (
                <option key={disc.id} value={disc.id}>
                  {disc.nome}
                </option>
              ))}
            </select>
          </div>

          {disciplinas.length === 0 && !isLoading && (
            <button
              onClick={handleInitializeDisciplinas}
              className="flex items-center gap-2 px-3 py-1.5 text-sm theme-text-secondary hover:theme-text rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-surface-secondary)' }}
            >
              <RefreshCw className="w-4 h-4" />
              Inicializar Disciplinas
            </button>
          )}
        </div>

        <div className="flex gap-1 mt-4 border-b theme-divide -mb-4 -mx-6 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'theme-text'
                  : 'border-transparent theme-text-secondary hover:theme-text'
              }`}
              style={{ borderBottomColor: activeTab === tab.id ? 'var(--color-text)' : 'transparent' }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'mapas' && (
          <>
            <div className="w-72 flex-shrink-0 border-r theme-divide theme-surface overflow-y-auto">
              <div className="p-3 border-b theme-divide">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-secondary" />
                  <input
                    type="text"
                    placeholder="Buscar mapa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm border rounded-lg theme-text"
                    style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 theme-text-secondary hover:theme-text" />
                    </button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 theme-text-secondary animate-spin" />
                </div>
              ) : !selectedProjetoId ? (
                <div className="p-6 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 theme-text-secondary opacity-50" />
                  <p className="text-sm theme-text-secondary">
                    Selecione um projeto para ver os mapas de controle
                  </p>
                </div>
              ) : filteredMapas.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 theme-text-secondary opacity-50" />
                  <p className="text-sm theme-text-secondary mb-4">
                    Nenhum mapa encontrado
                  </p>
                  {selectedDisciplinaId && (
                    <button
                      onClick={() => setShowMapaModal(true)}
                      className="text-sm theme-text-secondary hover:theme-text hover:underline"
                    >
                      Criar primeiro mapa
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y theme-divide">
                  {filteredMapas.map((mapa) => (
                    <button
                      key={mapa.id}
                      onClick={() => handleMapaSelect(mapa.id)}
                      className={`w-full p-3 text-left transition-colors ${
                        selectedMapaId === mapa.id ? 'border-l-2' : ''
                      }`}
                      style={{ 
                        backgroundColor: selectedMapaId === mapa.id ? 'var(--color-surface-secondary)' : 'transparent',
                        borderColor: selectedMapaId === mapa.id ? 'var(--color-text)' : 'transparent'
                      }}
                      onMouseEnter={(e) => { if (selectedMapaId !== mapa.id) e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)'; }}
                      onMouseLeave={(e) => { if (selectedMapaId !== mapa.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: mapa.disciplina?.cor || '#6B7280' }}
                            />
                            <span className="text-sm font-medium theme-text truncate">
                              {mapa.nome}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs theme-text-secondary">
                              {mapa.disciplina?.nome}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded theme-text-secondary" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                              v{mapa.versao}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 theme-text-secondary flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              {selectedMapaId ? (
                <TakeoffGrid mapaId={selectedMapaId} disciplinaId={selectedDisciplinaId} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <LayoutGrid className="w-16 h-16 mx-auto mb-4 theme-text-secondary opacity-30" />
                    <h3 className="text-lg font-medium theme-text mb-2">
                      Selecione um Mapa de Controle
                    </h3>
                    <p className="text-sm theme-text-secondary max-w-md">
                      Escolha um mapa na lista à esquerda para visualizar e editar os itens de take-off
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-auto p-6">
            <TakeoffDashboard projetoId={selectedProjetoId} disciplinaId={selectedDisciplinaId} />
          </div>
        )}

        {activeTab === 'vinculos' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="text-center py-12">
              <Link2 className="w-16 h-16 mx-auto mb-4 theme-text-secondary opacity-30" />
              <h3 className="text-lg font-medium theme-text mb-2">Vínculos com Cronograma</h3>
              <p className="text-sm theme-text-secondary">
                Associe itens de take-off às atividades do cronograma para calcular avanço físico automaticamente
              </p>
            </div>
          </div>
        )}

        {activeTab === 'medicoes' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 theme-text-secondary opacity-30" />
              <h3 className="text-lg font-medium theme-text mb-2">Medições por Período</h3>
              <p className="text-sm theme-text-secondary">
                Registre quantidades executadas por período para acompanhar o avanço físico
              </p>
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 theme-text-secondary opacity-30" />
              <h3 className="text-lg font-medium theme-text mb-2">Documentos de Projeto</h3>
              <p className="text-sm theme-text-secondary">
                Gerencie isométricos, plantas e desenhos de referência
              </p>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="grid gap-6 max-w-4xl">
              <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <h3 className="text-lg font-medium theme-text mb-4">Disciplinas Configuradas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {disciplinas.map((disc) => (
                    <div
                      key={disc.id}
                      className="flex items-center gap-3 p-3 theme-surface rounded-lg border"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: disc.cor }}
                      />
                      <div>
                        <div className="text-sm font-medium theme-text">{disc.nome}</div>
                        <div className="text-xs theme-text-secondary">{disc.codigo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showImportModal && selectedMapaId && (
        <TakeoffImportModal
          mapaId={selectedMapaId}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {showMapaModal && selectedProjetoId && selectedDisciplinaId && (
        <TakeoffMapaModal
          projetoId={selectedProjetoId}
          disciplinaId={selectedDisciplinaId}
          onClose={() => setShowMapaModal(false)}
        />
      )}
    </div>
  );
};

export default TakeoffPage;
