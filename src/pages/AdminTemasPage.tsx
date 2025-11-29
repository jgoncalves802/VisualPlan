import React, { useState, useRef, useEffect } from 'react';
import { useTemaStore } from '../stores/temaStore';
import { useAuthStore } from '../stores/authStore';
import { useEmpresaStore } from '../stores/empresaStore';
import { Palette, RotateCcw, Save, Eye, Upload, Trash2, Building2, Image } from 'lucide-react';

const AdminTemasPage: React.FC = () => {
  const { tema, setTema, resetTema } = useTemaStore();
  const { usuario } = useAuthStore();
  const { empresa, loadEmpresa, updateTema, updateLogo, removeLogo } = useEmpresaStore();
  
  const [tempTema, setTempTema] = useState(tema);
  const [showPreview, setShowPreview] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (usuario?.empresaId) {
      loadEmpresa(usuario.empresaId);
    }
  }, [usuario?.empresaId, loadEmpresa]);

  useEffect(() => {
    if (empresa?.logoUrl) {
      setLogoPreview(empresa.logoUrl);
    }
  }, [empresa?.logoUrl]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleColorChange = (key: keyof typeof tema, value: string) => {
    setTempTema({ ...tempTema, [key]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setTema(tempTema);
      
      if (empresa) {
        const temaConfig = {
          primary: tempTema.primary,
          secondary: tempTema.secondary,
          accent: tempTema.accent || tempTema.primary,
          success: tempTema.success,
          warning: tempTema.warning,
          danger: tempTema.danger,
          bgMain: tempTema.background || '#ffffff',
          bgSecondary: tempTema.surface || '#f8fafc',
          textPrimary: tempTema.text || '#1e293b',
          textSecondary: tempTema.textSecondary || '#64748b',
          border: tempTema.border || '#e2e8f0',
        };
        const temaSuccess = await updateTema(temaConfig);
        if (!temaSuccess) {
          showNotification('error', 'Erro ao salvar configurações de tema. Verifique se você tem permissão.');
          setIsSaving(false);
          return;
        }
      }
      
      if (logoFile && empresa) {
        const logoSuccess = await updateLogo(logoFile);
        if (!logoSuccess) {
          showNotification('error', 'Erro ao enviar logo. Verifique se o bucket "logos" existe no Supabase Storage.');
          setIsSaving(false);
          return;
        }
        setLogoFile(null);
        
        if (usuario?.empresaId) {
          await loadEmpresa(usuario.empresaId);
        }
      }
      
      showNotification('success', 'Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showNotification('error', 'Erro ao salvar. Verifique o console para mais detalhes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar o tema padrão?')) {
      resetTema();
      setTempTema(tema);
      showNotification('success', 'Tema restaurado ao padrão');
    }
  };

  const validateImageDimensions = (file: File): Promise<{ valid: boolean; width: number; height: number; error?: string }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        
        if (width < 32 || height < 32) {
          resolve({ valid: false, width, height, error: 'A imagem deve ter no mínimo 32x32 pixels' });
          return;
        }
        
        if (width > 512 || height > 512) {
          resolve({ valid: false, width, height, error: 'A imagem deve ter no máximo 512x512 pixels' });
          return;
        }
        
        const aspectRatio = width / height;
        if (aspectRatio < 0.8 || aspectRatio > 1.25) {
          resolve({ valid: false, width, height, error: 'A logo deve ser quadrada ou quase quadrada (proporção entre 4:5 e 5:4)' });
          return;
        }
        
        resolve({ valid: true, width, height });
      };
      img.onerror = () => {
        resolve({ valid: false, width: 0, height: 0, error: 'Não foi possível carregar a imagem' });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification('error', 'A imagem deve ter no máximo 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Selecione uma imagem válida (PNG, JPG, SVG)');
        return;
      }
      
      const validation = await validateImageDimensions(file);
      if (!validation.valid) {
        showNotification('error', validation.error || 'Imagem inválida');
        return;
      }
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      showNotification('success', `Logo carregada (${validation.width}x${validation.height}px). Clique em "Salvar Tema" para aplicar.`);
    }
  };

  const handleRemoveLogo = async () => {
    if (confirm('Deseja remover o logo da empresa?')) {
      await removeLogo();
      setLogoFile(null);
      setLogoPreview(null);
      showNotification('success', 'Logo removido');
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
      {notification && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          style={{
            backgroundColor: notification.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            color: 'white',
          }}
        >
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold theme-text">Personalização da Empresa</h1>
          <p className="text-sm theme-text-secondary mt-1">
            Configure o logo e as cores da plataforma para sua empresa
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
            disabled={isSaving}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Save size={20} />
            <span>{isSaving ? 'Salvando...' : 'Salvar Tema'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <Building2 className="theme-primary" size={24} />
              <h2 className="text-xl font-semibold theme-text">Logo da Empresa</h2>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div 
                className="w-40 h-40 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden"
                style={{ borderColor: 'var(--color-secondary-300)', backgroundColor: 'var(--color-bg-secondary)' }}
              >
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo da empresa" 
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Image className="w-12 h-12 mx-auto mb-2 theme-text-secondary" />
                    <p className="text-sm theme-text-secondary">Sem logo</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />

              <div className="flex space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline flex items-center space-x-2"
                >
                  <Upload size={18} />
                  <span>Enviar Logo</span>
                </button>
                {logoPreview && (
                  <button
                    onClick={handleRemoveLogo}
                    className="btn btn-outline text-red-500 border-red-300 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 size={18} />
                    <span>Remover</span>
                  </button>
                )}
              </div>

              <p className="text-xs theme-text-secondary text-center">
                Formatos: PNG, JPG, SVG (máx. 2MB)<br/>
                Dimensões: 32x32 até 512x512px<br/>
                Proporção: quadrada ou quase quadrada
              </p>
            </div>
          </div>

          {empresa && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="theme-primary" size={20} />
                <h3 className="text-lg font-semibold theme-text">Dados da Empresa</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="theme-text-secondary">Nome:</span> <span className="theme-text font-medium">{empresa.nome}</span></p>
                {empresa.cnpj && (
                  <p><span className="theme-text-secondary">CNPJ:</span> <span className="theme-text">{empresa.cnpj}</span></p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <Palette className="theme-primary" size={24} />
              <h2 className="text-xl font-semibold theme-text">Cores do Sistema</h2>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
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

        {showPreview && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-xl font-semibold theme-text mb-6">Preview em Tempo Real</h2>

              {logoPreview && (
                <div className="flex justify-center mb-6">
                  <div 
                    className="w-20 h-20 rounded-lg flex items-center justify-center p-2"
                    style={{ backgroundColor: tempTema.primary + '15' }}
                  >
                    <img src={logoPreview} alt="Preview logo" className="max-w-full max-h-full object-contain" />
                  </div>
                </div>
              )}

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
              O logo e as cores escolhidas serão aplicados em toda a plataforma para os usuários 
              da sua empresa. Certifique-se de escolher cores que tenham bom contraste e 
              representem a identidade visual da sua organização.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTemasPage;
