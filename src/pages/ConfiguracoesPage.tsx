import React, { useState } from 'react';
import { Palette, Save, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const ConfiguracoesPage: React.FC = () => {
  const usuario = useAppStore((state) => state.usuario);
  const tema = useAppStore((state) => state.tema);
  const setTema = useAppStore((state) => state.setTema);
  
  const [corPrimaria, setCorPrimaria] = useState(tema.corPrimaria);
  const [corSecundaria, setCorSecundaria] = useState(tema.corSecundaria);
  const [salvando, setSalvando] = useState(false);

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
      // Aqui você salvaria no Supabase na tabela de configurações da empresa
      setTema({
        corPrimaria,
        corSecundaria,
      });

      // Simular delay de rede
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

  // Só administradores podem alterar o tema
  const podeEditarTema = usuario?.perfilAcesso === 'ADMIN';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">
          Personalize a aparência e funcionalidades do sistema
        </p>
      </div>

      {/* Seção de Temas */}
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
              ⚠️ Apenas administradores podem alterar o tema do sistema
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
            {temasPreDefinidos.map((tema, idx) => (
              <button
                key={idx}
                onClick={() => podeEditarTema && aplicarTemaPreDefinido(tema.primaria, tema.secundaria)}
                disabled={!podeEditarTema}
                className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex gap-1">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: tema.primaria }}
                  />
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: tema.secundaria }}
                  />
                </div>
                <span className="text-sm font-medium">{tema.nome}</span>
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
