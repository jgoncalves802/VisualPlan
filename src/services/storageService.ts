/**
 * Storage Service - Abstração para gerenciamento de cache
 * 
 * projectDataStorage: sessionStorage - isolado por aba do navegador
 * - Dados de projeto (cronograma, atividades, dependências)
 * - Cache que pode causar conflito entre projetos
 * - Limpo automaticamente ao fechar a aba
 * 
 * userPreferencesStorage: localStorage - persistente entre sessões
 * - Preferências visuais do usuário (tema, largura de colunas)
 * - Configurações que devem persistir entre sessões
 */

export const projectDataStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('[projectDataStorage] Error reading:', key, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn('[projectDataStorage] Error writing:', key, error);
    }
  },
  
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('[projectDataStorage] Error removing:', key, error);
    }
  },
  
  clear: (): void => {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('[projectDataStorage] Error clearing storage:', error);
    }
  },
  
  getAllKeys: (): string[] => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } catch (error) {
      console.warn('[projectDataStorage] Error getting keys:', error);
      return [];
    }
  },
  
  getKeysMatching: (pattern: string): string[] => {
    return projectDataStorage.getAllKeys().filter(key => key.includes(pattern));
  }
};

export const userPreferencesStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('[userPreferencesStorage] Error reading:', key, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('[userPreferencesStorage] Error writing:', key, error);
    }
  },
  
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('[userPreferencesStorage] Error removing:', key, error);
    }
  }
};
