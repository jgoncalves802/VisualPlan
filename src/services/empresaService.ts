import { supabase } from './supabase';

export interface TemaConfig {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  bgMain: string;
  bgSecondary: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string | null;
  logoUrl: string | null;
  temaConfig: TemaConfig;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const defaultTema: TemaConfig = {
  primary: '#0ea5e9',
  secondary: '#64748b',
  accent: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  bgMain: '#ffffff',
  bgSecondary: '#f8fafc',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
};

export const empresaService = {
  async getById(id: string): Promise<{ data: Empresa | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const empresa: Empresa = {
        id: data.id,
        nome: data.nome,
        cnpj: data.cnpj,
        logoUrl: data.logo_url,
        temaConfig: data.tema_config || defaultTema,
        ativo: data.ativo,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return { data: empresa, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async updateTema(empresaId: string, temaConfig: TemaConfig): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ tema_config: temaConfig, updated_at: new Date().toISOString() })
        .eq('id', empresaId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  async updateLogo(empresaId: string, file: File): Promise<{ data: string | null; error: Error | null }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${empresaId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      const logoUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('empresas')
        .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
        .eq('id', empresaId);

      if (updateError) throw updateError;

      return { data: logoUrl, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async removeLogo(empresaId: string): Promise<{ error: Error | null }> {
    try {
      const { error: updateError } = await supabase
        .from('empresas')
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq('id', empresaId);

      if (updateError) throw updateError;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  async update(empresaId: string, data: Partial<{ nome: string; cnpj: string }>): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', empresaId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },
};
