import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TemaEmpresa } from '../types';

// Tema padrão do VisionPlan - Cores profissionais e suaves
const TEMA_PADRAO: TemaEmpresa = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  accent: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB'
};

interface TemaState {
  tema: TemaEmpresa;
  setTema: (tema: Partial<TemaEmpresa>) => void;
  resetTema: () => void;
  aplicarTema: () => void;
}

export const useTemaStore = create<TemaState>()(
  persist(
    (set, get) => ({
      tema: TEMA_PADRAO,
      
      setTema: (novoCores) => {
        set((state) => ({
          tema: { ...state.tema, ...novoCores }
        }));
        get().aplicarTema();
      },
      
      resetTema: () => {
        set({ tema: TEMA_PADRAO });
        get().aplicarTema();
      },
      
      aplicarTema: () => {
        const { tema } = get();
        const root = document.documentElement;
        
        // Helper para converter hex para RGB
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : { r: 0, g: 0, b: 0 };
        };
        
        // Helper para converter RGB para hex
        const rgbToHex = (r: number, g: number, b: number) => {
          return '#' + [r, g, b].map(x => {
            const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          }).join('');
        };
        
        // Clarear cor
        const lighten = (hex: string, amount: number) => {
          const rgb = hexToRgb(hex);
          return rgbToHex(
            rgb.r + (255 - rgb.r) * amount,
            rgb.g + (255 - rgb.g) * amount,
            rgb.b + (255 - rgb.b) * amount
          );
        };
        
        // Escurecer cor
        const darken = (hex: string, amount: number) => {
          const rgb = hexToRgb(hex);
          return rgbToHex(
            rgb.r * (1 - amount),
            rgb.g * (1 - amount),
            rgb.b * (1 - amount)
          );
        };
        
        // Aplicar cores CSS customizadas
        root.style.setProperty('--color-primary', tema.primary);
        root.style.setProperty('--color-primary-dark', darken(tema.primary, 0.15));
        root.style.setProperty('--color-primary-light', lighten(tema.primary, 0.3));
        root.style.setProperty('--color-primary-100', lighten(tema.primary, 0.85));
        root.style.setProperty('--color-primary-300', lighten(tema.primary, 0.5));
        
        root.style.setProperty('--color-secondary', tema.secondary);
        root.style.setProperty('--color-secondary-dark', darken(tema.secondary, 0.15));
        root.style.setProperty('--color-secondary-light', lighten(tema.secondary, 0.3));
        
        root.style.setProperty('--color-accent', tema.accent);
        root.style.setProperty('--color-success', tema.success);
        root.style.setProperty('--color-success-light', lighten(tema.success, 0.85));
        root.style.setProperty('--color-warning', tema.warning);
        root.style.setProperty('--color-warning-light', lighten(tema.warning, 0.85));
        root.style.setProperty('--color-danger', tema.danger);
        root.style.setProperty('--color-danger-light', lighten(tema.danger, 0.85));
        root.style.setProperty('--color-info', tema.info);
        root.style.setProperty('--color-info-light', lighten(tema.info, 0.85));
        
        root.style.setProperty('--color-background', tema.background);
        root.style.setProperty('--color-surface', tema.surface);
        root.style.setProperty('--color-surface-secondary', darken(tema.surface, 0.03));
        root.style.setProperty('--color-surface-tertiary', darken(tema.surface, 0.08));
        
        root.style.setProperty('--color-text', tema.text);
        root.style.setProperty('--color-text-secondary', tema.textSecondary);
        root.style.setProperty('--color-text-muted', lighten(tema.textSecondary, 0.25));
        
        root.style.setProperty('--color-border', tema.border);
        root.style.setProperty('--color-border-light', lighten(tema.border, 0.4));
      }
    }),
    {
      name: 'visionplan-tema'
    }
  )
);
