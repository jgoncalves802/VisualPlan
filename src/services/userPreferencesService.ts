import { supabase } from './supabase';
import { 
  UserPreferences, 
  UserPreferencesDTO, 
  DEFAULT_USER_PREFERENCES 
} from '../types/userPreferences.types';

const LOCALSTORAGE_KEY = 'visionplan-preferencias';

class UserPreferencesService {
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return this.migrateFromLocalStorage(userId);
        }
        if (error.code === '42P01') {
          console.warn('Tabela user_preferences não existe - usando localStorage');
          return this.getFromLocalStorage(userId);
        }
        throw error;
      }
      
      return data;
    } catch (err) {
      console.warn('Erro ao buscar preferências do banco, usando localStorage:', err);
      return this.getFromLocalStorage(userId);
    }
  }

  async upsertPreferences(dto: UserPreferencesDTO): Promise<UserPreferences> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(dto, { onConflict: 'user_id' })
        .select()
        .single();
      
      if (error) {
        if (error.code === '42P01') {
          console.warn('Tabela user_preferences não existe - salvando em localStorage');
          this.saveToLocalStorage(dto);
          return { id: 'local', ...DEFAULT_USER_PREFERENCES, ...dto } as UserPreferences;
        }
        throw error;
      }
      
      this.clearLocalStorage();
      return data;
    } catch (err) {
      console.warn('Erro ao salvar preferências no banco, usando localStorage:', err);
      this.saveToLocalStorage(dto);
      return { id: 'local', ...DEFAULT_USER_PREFERENCES, ...dto } as UserPreferences;
    }
  }

  async updatePreferences(userId: string, updates: Partial<UserPreferencesDTO>): Promise<UserPreferences> {
    const existing = await this.getPreferences(userId);
    
    if (existing) {
      const merged = { ...existing, ...updates };
      return this.upsertPreferences(merged as UserPreferencesDTO);
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('empresa_id')
      .eq('user_id', userId)
      .single();
    
    const newPrefs: UserPreferencesDTO = {
      user_id: userId,
      empresa_id: profile?.empresa_id || '',
      ...DEFAULT_USER_PREFERENCES,
      ...updates,
    };
    
    return this.upsertPreferences(newPrefs);
  }

  private async migrateFromLocalStorage(userId: string): Promise<UserPreferences | null> {
    const localPrefs = this.getFromLocalStorage(userId);
    
    if (localPrefs) {
      try {
        const saved = await this.upsertPreferences({
          user_id: localPrefs.user_id,
          empresa_id: localPrefs.empresa_id,
          tema_preferido: localPrefs.tema_preferido,
          cor_primaria: localPrefs.cor_primaria,
          cor_secundaria: localPrefs.cor_secundaria,
          itens_por_pagina: localPrefs.itens_por_pagina,
          visualizacao_gantt: localPrefs.visualizacao_gantt,
          mostrar_linha_hoje: localPrefs.mostrar_linha_hoje,
          mostrar_dependencias: localPrefs.mostrar_dependencias,
          mostrar_caminho_critico: localPrefs.mostrar_caminho_critico,
          notificar_email: localPrefs.notificar_email,
          notificar_app: localPrefs.notificar_app,
          resumo_diario: localPrefs.resumo_diario,
          idioma: localPrefs.idioma,
          formato_data: localPrefs.formato_data,
          formato_hora: localPrefs.formato_hora,
          preferencias_extras: localPrefs.preferencias_extras,
        });
        this.clearLocalStorage();
        console.log('Preferências migradas de localStorage para banco');
        return saved;
      } catch (err) {
        console.warn('Falha ao migrar preferências para banco:', err);
        return localPrefs;
      }
    }
    
    return null;
  }

  private getFromLocalStorage(userId: string): UserPreferences | null {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      if (parsed.user_id !== userId) return null;
      
      return {
        id: 'local',
        ...DEFAULT_USER_PREFERENCES,
        ...parsed,
      } as UserPreferences;
    } catch {
      return null;
    }
  }

  private saveToLocalStorage(dto: UserPreferencesDTO): void {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(dto));
    } catch (err) {
      console.warn('Erro ao salvar em localStorage:', err);
    }
  }

  private clearLocalStorage(): void {
    try {
      localStorage.removeItem(LOCALSTORAGE_KEY);
    } catch {
      // ignore
    }
  }

  getDefaultPreferences(): typeof DEFAULT_USER_PREFERENCES {
    return { ...DEFAULT_USER_PREFERENCES };
  }
}

export const userPreferencesService = new UserPreferencesService();
