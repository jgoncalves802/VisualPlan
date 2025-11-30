import React, { useState, useCallback } from 'react';
import { Palette, Save, RefreshCw, Keyboard, RotateCcw, Edit2, Check, X } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { 
  useKeyboardShortcutsStore, 
  SHORTCUT_CATEGORIES,
  type KeyboardShortcut 
} from '../stores/keyboardShortcutsStore';

type ConfigTab = 'tema' | 'atalhos';

const ShortcutEditor: React.FC<{
  shortcut: KeyboardShortcut;
  onSave: (id: string, key: string, modifiers: KeyboardShortcut['modifiers']) => void;
  onReset: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  formatShortcut: (s: KeyboardShortcut) => string;
}> = ({ shortcut, onSave, onReset, onToggle, formatShortcut }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(shortcut.currentKey);
  const [tempModifiers, setTempModifiers] = useState(shortcut.modifiers);

  const handleKeyCapture = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const ignoredKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'];
    if (ignoredKeys.includes(e.key)) return;

    setTempKey(e.code);
    setTempModifiers({
      alt: e.altKey,
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      meta: e.metaKey
    });
  }, []);

  const handleSave = () => {
    onSave(shortcut.id, tempKey, tempModifiers);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempKey(shortcut.currentKey);
    setTempModifiers(shortcut.modifiers);
    setIsEditing(false);
  };

  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        shortcut.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={shortcut.enabled}
          onChange={(e) => onToggle(shortcut.id, e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-gray-900 text-sm truncate">
            {shortcut.name}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {shortcut.description}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        {isEditing ? (
          <>
            <input
              type="text"
              value={formatShortcut({ ...shortcut, currentKey: tempKey, modifiers: tempModifiers })}
              onKeyDown={handleKeyCapture}
              readOnly
              placeholder="Pressione uma tecla..."
              className="w-32 px-2 py-1 text-sm border border-blue-400 rounded bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Salvar"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <span 
              className="px-3 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700 min-w-[80px] text-center"
            >
              {formatShortcut(shortcut)}
            </span>
            <button
              onClick={() => setIsEditing(true)}
              disabled={!shortcut.enabled}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Editar"
            >
              <Edit2 size={14} />
            </button>
            {shortcut.currentKey !== shortcut.defaultKey && (
              <button
                onClick={() => onReset(shortcut.id)}
                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                title="Restaurar padrão"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const ConfiguracoesPage: React.FC = () => {
  const usuario = useAppStore((state) => state.usuario);
  const tema = useAppStore((state) => state.tema);
  const setTema = useAppStore((state) => state.setTema);
  
  const [activeTab, setActiveTab] = useState<ConfigTab>('tema');
  const [corPrimaria, setCorPrimaria] = useState(tema.corPrimaria);
  const [corSecundaria, setCorSecundaria] = useState(tema.corSecundaria);
  const [salvando, setSalvando] = useState(false);

  const { 
    setShortcut, 
    resetShortcut, 
    resetAllShortcuts, 
    toggleShortcut,
    getShortcutsByCategory,
    formatShortcut 
  } = useKeyboardShortcutsStore();

  const temasPreDefinidos = [
    { nome: 'Azul Profissional', primaria: '#0ea5e9', secundaria: '#0284c7' },
    { nome: 'Verde Sustentável', primaria: '#10b981', secundaria: '#059669' },
    { nome: 'Laranja Energia', primaria: '#f97316', secundaria: '#ea580c' },
    { nome: 'Roxo Inovação', primaria: '#8b5cf6', secundaria: '#7c3aed' },
    { nome: 'Vermelho Ação', primaria: '#ef4444', secundaria: '#dc2626' },
  ];

  const handleSalvarTema = async () => {
    setSalvando(true);
    
    try {
      setTema({
        corPrimaria,
        corSecundaria,
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert('Tema salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
      alert('Erro ao salvar tema');
    } finally {
      setSalvando(false);
    }
  };

  const aplicarTemaPreDefinido = (primaria: string, secundaria: string) => {
    setCorPrimaria(primaria);
    setCorSecundaria(secundaria);
  };

  const resetarTema = () => {
    setCorPrimaria('#0ea5e9');
    setCorSecundaria('#0284c7');
  };

  const podeEditarTema = usuario?.perfilAcesso === 'ADMIN';

  const handleShortcutSave = useCallback((id: string, key: string, modifiers: KeyboardShortcut['modifiers']) => {
    setShortcut(id, key, modifiers);
  }, [setShortcut]);

  const handleResetAllShortcuts = useCallback(() => {
    if (window.confirm('Deseja restaurar todos os atalhos para os valores padrão?')) {
      resetAllShortcuts();
    }
  }, [resetAllShortcuts]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">
          Personalize a aparência e funcionalidades do sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('tema')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'tema' 
              ? 'text-blue-600 border-blue-600' 
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Palette size={18} />
          Tema
        </button>
        <button
          onClick={() => setActiveTab('atalhos')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'atalhos' 
              ? 'text-blue-600 border-blue-600' 
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Keyboard size={18} />
          Atalhos de Teclado
        </button>
      </div>

      {/* Tema Tab */}
      {activeTab === 'tema' && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${tema.corPrimaria}20` }}
            >
              <Palette size={24} style={{ color: tema.corPrimaria }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Personalização de Tema</h2>
              <p className="text-sm text-gray-600">
                Customize as cores da interface conforme a identidade da sua empresa
              </p>
            </div>
          </div>

          {!podeEditarTema && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                Apenas administradores podem alterar o tema do sistema
              </p>
            </div>
          )}

          {/* Preview do Tema Atual */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
            <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex gap-4">
                <button
                  className="px-6 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: corPrimaria }}
                >
                  Botão Primário
                </button>
                <button
                  className="px-6 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: corSecundaria }}
                >
                  Botão Secundário
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full"
                  style={{ backgroundColor: corPrimaria }}
                />
                <div>
                  <div className="h-3 w-32 rounded" style={{ backgroundColor: corPrimaria }} />
                  <div className="h-2 w-24 rounded bg-gray-200 mt-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Temas Pré-definidos */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Temas Pré-definidos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {temasPreDefinidos.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => podeEditarTema && aplicarTemaPreDefinido(t.primaria, t.secundaria)}
                  disabled={!podeEditarTema}
                  className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: t.primaria }}
                    />
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: t.secundaria }}
                    />
                  </div>
                  <span className="text-sm font-medium">{t.nome}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Seletores de Cor Customizados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor Primária
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={corPrimaria}
                  onChange={(e) => setCorPrimaria(e.target.value)}
                  disabled={!podeEditarTema}
                  className="w-16 h-10 rounded border-2 border-gray-200 cursor-pointer disabled:cursor-not-allowed"
                />
                <input
                  type="text"
                  value={corPrimaria}
                  onChange={(e) => setCorPrimaria(e.target.value)}
                  disabled={!podeEditarTema}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="#0ea5e9"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor Secundária
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={corSecundaria}
                  onChange={(e) => setCorSecundaria(e.target.value)}
                  disabled={!podeEditarTema}
                  className="w-16 h-10 rounded border-2 border-gray-200 cursor-pointer disabled:cursor-not-allowed"
                />
                <input
                  type="text"
                  value={corSecundaria}
                  onChange={(e) => setCorSecundaria(e.target.value)}
                  disabled={!podeEditarTema}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="#0284c7"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          {podeEditarTema && (
            <div className="flex gap-3">
              <button
                onClick={handleSalvarTema}
                disabled={salvando}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: corPrimaria }}
              >
                {salvando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar Tema
                  </>
                )}
              </button>

              <button
                onClick={resetarTema}
                className="flex items-center gap-2 px-6 py-2 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={18} />
                Resetar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Atalhos Tab */}
      {activeTab === 'atalhos' && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-indigo-50">
                <Keyboard size={24} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Atalhos de Teclado</h2>
                <p className="text-sm text-gray-600">
                  Configure os atalhos para agilizar seu trabalho no cronograma
                </p>
              </div>
            </div>
            <button
              onClick={handleResetAllShortcuts}
              className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <RotateCcw size={16} />
              Restaurar Padrões
            </button>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> Clique no botão editar e pressione a combinação de teclas desejada para alterar um atalho.
              Os atalhos são salvos automaticamente e persistem entre sessões.
            </p>
          </div>

          {/* Shortcuts by category */}
          <div className="space-y-6">
            {(Object.keys(SHORTCUT_CATEGORIES) as Array<keyof typeof SHORTCUT_CATEGORIES>).map((category) => {
              const categoryShortcuts = getShortcutsByCategory(category);
              if (categoryShortcuts.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    {SHORTCUT_CATEGORIES[category].label}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut) => (
                      <ShortcutEditor
                        key={shortcut.id}
                        shortcut={shortcut}
                        onSave={handleShortcutSave}
                        onReset={resetShortcut}
                        onToggle={toggleShortcut}
                        formatShortcut={formatShortcut}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Special instructions */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Atalhos Especiais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-200 rounded font-mono text-xs">Alt + Scroll</span>
                <span>Zoom no cronograma</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-200 rounded font-mono text-xs">Clique Direito</span>
                <span>Menu de contexto da atividade</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-200 rounded font-mono text-xs">Ctrl + Clique</span>
                <span>Adicionar/Remover da seleção</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-200 rounded font-mono text-xs">Arrastar Divisória</span>
                <span>Redimensionar grid/timeline</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informações do Sistema */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Informações do Sistema</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Versão:</span>
            <span className="font-medium">2.2.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Usuário:</span>
            <span className="font-medium">{usuario?.nome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Perfil:</span>
            <span className="font-medium">{usuario?.perfilAcesso}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Camada:</span>
            <span className="font-medium">{usuario?.camadaGovernanca}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
