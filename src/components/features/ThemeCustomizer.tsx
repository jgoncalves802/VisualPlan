import React, { useState } from 'react';
import { Palette, Save, RotateCcw, Upload, Eye } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Modal } from '../common/Modal';
import { useThemeStore, DEFAULT_THEME } from '../../store';
import type { ThemeColors, CustomTheme } from '../../types';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId: string;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  isOpen,
  onClose,
  empresaId,
}) => {
  const { customTheme, setCustomTheme, resetTheme } = useThemeStore();
  const [isPreview, setIsPreview] = useState(false);
  const [themeName, setThemeName] = useState(customTheme?.nome || 'Tema Personalizado');
  const [colors, setColors] = useState<ThemeColors>(
    customTheme?.colors || DEFAULT_THEME
  );
  const [logo, setLogo] = useState<string | undefined>(customTheme?.logo);

  const handleColorChange = (path: string, value: string) => {
    const pathParts = path.split('.');
    setColors((prev) => {
      const newColors = { ...prev };
      let current: any = newColors;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      
      current[pathParts[pathParts.length - 1]] = value;
      return newColors;
    });
  };

  const handleSave = async () => {
    const newTheme: CustomTheme = {
      id: customTheme?.id || `theme-${Date.now()}`,
      empresaId,
      nome: themeName,
      colors,
      logo,
      ativo: true,
      createdAt: customTheme?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    setCustomTheme(newTheme);
    
    // Aqui você salvaria no Supabase
    // await supabase.from('temas_customizados').upsert(newTheme);
    
    onClose();
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar o tema padrão?')) {
      setColors(DEFAULT_THEME);
      setThemeName('Tema Padrão');
      setLogo(undefined);
      resetTheme();
    }
  };

  const handlePreview = () => {
    if (isPreview) {
      // Restaurar tema anterior
      if (customTheme) {
        setCustomTheme(customTheme);
      } else {
        resetTheme();
      }
    } else {
      // Aplicar preview
      const previewTheme: CustomTheme = {
        id: 'preview',
        empresaId,
        nome: themeName,
        colors,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCustomTheme(previewTheme);
    }
    setIsPreview(!isPreview);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const ColorPicker = ({ label, value, onChange }: any) => (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium w-32">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded cursor-pointer border border-secondary-300"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customizar Tema da Empresa"
      size="xl"
      footer={
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Restaurar Padrão
          </Button>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handlePreview}
              leftIcon={<Eye className="w-4 h-4" />}
            >
              {isPreview ? 'Cancelar Preview' : 'Preview'}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Salvar Tema
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Nome do Tema e Logo */}
        <Card title="Identidade Visual" padding="md">
          <div className="space-y-4">
            <Input
              label="Nome do Tema"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="Ex: Tema Construtora ABC"
            />
            
            <div>
              <label className="block text-sm font-medium mb-2">Logo da Empresa</label>
              <div className="flex items-center gap-4">
                {logo && (
                  <img src={logo} alt="Logo" className="h-16 w-auto rounded" />
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button variant="secondary" as="span" leftIcon={<Upload className="w-4 h-4" />}>
                    {logo ? 'Alterar Logo' : 'Upload Logo'}
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Cores Primárias */}
        <Card title="Cores Primárias" padding="md">
          <div className="space-y-3">
            <ColorPicker
              label="Principal (500)"
              value={colors.primary[500]}
              onChange={(v: string) => handleColorChange('primary.500', v)}
            />
            <ColorPicker
              label="Clara (300)"
              value={colors.primary[300]}
              onChange={(v: string) => handleColorChange('primary.300', v)}
            />
            <ColorPicker
              label="Escura (700)"
              value={colors.primary[700]}
              onChange={(v: string) => handleColorChange('primary.700', v)}
            />
          </div>
        </Card>

        {/* Cores de Status */}
        <Card title="Cores de Status" padding="md">
          <div className="space-y-3">
            <ColorPicker
              label="Sucesso"
              value={colors.success}
              onChange={(v: string) => handleColorChange('success', v)}
            />
            <ColorPicker
              label="Aviso"
              value={colors.warning}
              onChange={(v: string) => handleColorChange('warning', v)}
            />
            <ColorPicker
              label="Perigo"
              value={colors.danger}
              onChange={(v: string) => handleColorChange('danger', v)}
            />
            <ColorPicker
              label="Informação"
              value={colors.info}
              onChange={(v: string) => handleColorChange('info', v)}
            />
          </div>
        </Card>

        {/* Cores de Fundo e Texto */}
        <Card title="Backgrounds e Texto" padding="md">
          <div className="space-y-3">
            <ColorPicker
              label="Fundo Principal"
              value={colors.background.main}
              onChange={(v: string) => handleColorChange('background.main', v)}
            />
            <ColorPicker
              label="Fundo Secundário"
              value={colors.background.secondary}
              onChange={(v: string) => handleColorChange('background.secondary', v)}
            />
            <ColorPicker
              label="Texto Principal"
              value={colors.text.primary}
              onChange={(v: string) => handleColorChange('text.primary', v)}
            />
            <ColorPicker
              label="Texto Secundário"
              value={colors.text.secondary}
              onChange={(v: string) => handleColorChange('text.secondary', v)}
            />
          </div>
        </Card>

        {/* Preview de Componentes */}
        <Card title="Preview de Componentes" padding="md">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="primary" size="sm">Botão Primário</Button>
              <Button variant="secondary" size="sm">Botão Secundário</Button>
              <Button variant="danger" size="sm">Botão Perigo</Button>
            </div>
            
            <div className="p-4 rounded" style={{ backgroundColor: colors.primary[50] }}>
              <p className="font-medium" style={{ color: colors.primary[700] }}>
                Exemplo de card com cor primária
              </p>
            </div>
            
            <div className="flex gap-2">
              <span className="badge badge-success">Sucesso</span>
              <span className="badge badge-warning">Aviso</span>
              <span className="badge badge-danger">Perigo</span>
              <span className="badge badge-info">Info</span>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
};
