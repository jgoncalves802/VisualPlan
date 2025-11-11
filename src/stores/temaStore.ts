import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TemaEmpresa } from '../types';

// Tema padrão do VisionPlan
const TEMA_PADRAO: TemaEmpresa = {
  primary: '#0ea5e9',
  secondary: '#6366f1',
  accent: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0'
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
        
        // Aplicar cores CSS customizadas
        root.style.setProperty('--color-primary', tema.primary);
        root.style.setProperty('--color-secondary', tema.secondary);
        root.style.setProperty('--color-accent', tema.accent);
        root.style.setProperty('--color-success', tema.success);
        root.style.setProperty('--color-warning', tema.warning);
        root.style.setProperty('--color-danger', tema.danger);
        root.style.setProperty('--color-info', tema.info);
        root.style.setProperty('--color-background', tema.background);
        root.style.setProperty('--color-surface', tema.surface);
        root.style.setProperty('--color-text', tema.text);
        root.style.setProperty('--color-text-secondary', tema.textSecondary);
        root.style.setProperty('--color-border', tema.border);
      }
    }),
    {
      name: 'visionplan-tema'
    }
  )
);
