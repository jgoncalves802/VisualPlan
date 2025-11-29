import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { empresaService, Empresa, TemaConfig } from '../services/empresaService';

interface EmpresaState {
  empresa: Empresa | null;
  isLoading: boolean;
  loadEmpresa: (empresaId: string) => Promise<void>;
  updateTema: (temaConfig: TemaConfig) => Promise<boolean>;
  updateLogo: (file: File) => Promise<boolean>;
  removeLogo: () => Promise<boolean>;
  clearEmpresa: () => void;
}

export const useEmpresaStore = create<EmpresaState>()(
  persist(
    (set, get) => ({
      empresa: null,
      isLoading: false,

      loadEmpresa: async (empresaId: string) => {
        set({ isLoading: true });
        const { data, error } = await empresaService.getById(empresaId);
        if (!error && data) {
          set({ empresa: data });
        }
        set({ isLoading: false });
      },

      updateTema: async (temaConfig: TemaConfig) => {
        const empresa = get().empresa;
        if (!empresa) return false;

        const { error } = await empresaService.updateTema(empresa.id, temaConfig);
        if (!error) {
          set({ empresa: { ...empresa, temaConfig } });
          return true;
        }
        return false;
      },

      updateLogo: async (file: File) => {
        const empresa = get().empresa;
        if (!empresa) {
          console.error('Nenhuma empresa carregada');
          return false;
        }

        console.log('Iniciando upload para empresa:', empresa.id);
        const { data: logoUrl, error } = await empresaService.updateLogo(empresa.id, file);
        
        if (error) {
          console.error('Erro no upload da logo:', error.message);
          return false;
        }
        
        if (logoUrl) {
          console.log('Logo atualizada com sucesso:', logoUrl);
          set({ empresa: { ...empresa, logoUrl } });
          return true;
        }
        return false;
      },

      removeLogo: async () => {
        const empresa = get().empresa;
        if (!empresa) return false;

        const { error } = await empresaService.removeLogo(empresa.id);
        if (!error) {
          set({ empresa: { ...empresa, logoUrl: null } });
          return true;
        }
        return false;
      },

      clearEmpresa: () => set({ empresa: null }),
    }),
    {
      name: 'visionplan-empresa',
    }
  )
);
