import React, { useState } from 'react';
import { useTemaStore } from '../stores/temaStore';
import { Palette, RotateCcw, Save, Eye } from 'lucide-react';

const AdminTemasPage: React.FC = () => {
  const { tema, setTema, resetTema } = useTemaStore();
  const [tempTema, setTempTema] = useState(tema);
  const [showPreview, setShowPreview] = useState(false);

  const handleColorChange = (key: keyof typeof tema, value: string) => {
    setTempTema({ ...tempTema, [key]: value });
  };

  const handleSave = () => {
    setTema(tempTema);
    alert('Tema salvo com sucesso!');
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar o tema padrão?')) {
      resetTema();
      setTempTema(tema);
    }
  };

  const colorOptions = [
    { key: 'primary', label: 'Cor Primária', description: 'Cor principal da interface' },
    { key: 'secondary', label: 'Cor Secundária', description: 'Cor secundária de destaque' },
    { key: 'accent', label: 'Cor de Destaque', description: 'Cor para elementos importantes' },
    { key: 'success', label: 'Sucesso', description: 'Cor para ações positivas' },
    { key: 'warning', label: 'Aviso', description: 'Cor para avisos' },
    { key: 'danger', label: 'Perigo', description: 'Cor para erros e alertas' },
    { key: 'info', label: 'Informação', description: 'Cor para informações' },
    { key: 'background', label: 'Fundo', description: 'Cor de fundo principal' },
    { key: 'surface', label: 'Superfície', description: 'Cor de cards e painéis' },
    { key: 'text', label: 'Texto', description: 'Cor do texto principal' },
    { key: 'textSecondary', label: 'Texto Secundário', description: 'Cor do texto secundário' },
    { key: 'border', label: 'Borda', description: 'Cor das bordas' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold theme-text">Personalização de Tema</h1>
          <p className="text-sm theme-text-secondary mt-1">
            Customize as cores da plataforma para o seu cliente
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn btn-outline flex items-center space-x-2"
          >
            <Eye size={20} />
            <span>{showPreview ? 'Ocultar' : 'Visualizar'} Preview</span>
          </button>
          <button
            onClick={handleReset}
            className="btn btn-outline flex items-center space-x-2"
          >
            <RotateCcw size={20} />
            <span>Restaurar Padrão</span>
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Save size={20} />
            <span>Salvar Tema</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Picker Panel */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <Palette className="theme-primary" size={24} />
              <h2 className="text-xl font-semibold theme-text">Cores do Sistema</h2>
            </div>

            <div className="space-y-4">
              {colorOptions.map(option => (
                <div key={option.key} className="space-y-2">
                  <label className="block">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium theme-text text-sm">
                          {option.label}
                        </span>
                        <p className="text-xs theme-text-secondary">
                          {option.description}
                        </p>
                      </div>
                      <div 
                        className="w-10 h-10 rounded-lg border-2 theme-border-primary"
                        style={{ backgroundColor: tempTema[option.key as keyof typeof tempTema] }}
                      />
                    </div>
                    <input
                      type="color"
                      value={tempTema[option.key as keyof typeof tempTema]}
                      onChange={(e) => handleColorChange(option.key as keyof typeof tema, e.target.value)}
                      className="w-full h-12 rounded-lg cursor-pointer border theme-border-primary"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-xl font-semibold theme-text mb-6">Preview em Tempo Real</h2>

              {/* KPI Cards Preview */}
              <div className="space-y-4">
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: `${tempTema.primary}15` }}
                >
                  <p className="text-sm font-medium theme-text-secondary">% PAC Médio</p>
                  <h3 
                    className="text-2xl font-bold mt-1"
                    style={{ color: tempTema.primary }}
                  >
                    78.5%
                  </h3>
                </div>

                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: `${tempTema.success}15` }}
                >
                  <p className="text-sm font-medium theme-text-secondary">Atividades Concluídas</p>
                  <h3 
                    className="text-2xl font-bold mt-1"
                    style={{ color: tempTema.success }}
                  >
                    156
                  </h3>
                </div>

                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: `${tempTema.warning}15` }}
                >
                  <p className="text-sm font-medium theme-text-secondary">Em Andamento</p>
                  <h3 
                    className="text-2xl font-bold mt-1"
                    style={{ color: tempTema.warning }}
                  >
                    23
                  </h3>
                </div>

                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: `${tempTema.danger}15` }}
                >
                  <p className="text-sm font-medium theme-text-secondary">Restrições Ativas</p>
                  <h3 
                    className="text-2xl font-bold mt-1"
                    style={{ color: tempTema.danger }}
                  >
                    5
                  </h3>
                </div>
              </div>

              {/* Buttons Preview */}
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold theme-text mb-3">Botões</h3>
                <button
                  className="w-full py-2 px-4 rounded-lg text-white font-medium"
                  style={{ backgroundColor: tempTema.primary }}
                >
                  Botão Primário
                </button>
                <button
                  className="w-full py-2 px-4 rounded-lg text-white font-medium"
                  style={{ backgroundColor: tempTema.secondary }}
                >
                  Botão Secundário
                </button>
                <button
                  className="w-full py-2 px-4 rounded-lg font-medium"
                  style={{ 
                    backgroundColor: 'transparent',
                    border: `1px solid ${tempTema.primary}`,
                    color: tempTema.primary
                  }}
                >
                  Botão Outline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div 
        className="card border-l-4"
        style={{ borderLeftColor: tempTema.info }}
      >
        <div className="flex items-start space-x-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${tempTema.info}20`, color: tempTema.info }}
          >
            <Palette size={20} />
          </div>
          <div>
            <h3 className="font-semibold theme-text mb-1">Dica sobre Personalização</h3>
            <p className="text-sm theme-text-secondary">
              As cores escolhidas serão aplicadas em toda a plataforma. Certifique-se de escolher
              cores que tenham bom contraste e representem a identidade visual do seu cliente.
              As alterações são salvas localmente e podem ser exportadas para serem aplicadas em
              outras instalações da plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTemasPage;
