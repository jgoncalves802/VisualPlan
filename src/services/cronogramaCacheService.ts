/**
 * Serviço de Cache para o Cronograma
 * Minimiza requisições ao Supabase usando localStorage com TTL
 */

import { AtividadeMock, DependenciaAtividade } from '../types/cronograma';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const CACHE_PREFIX = 'visionplan_cache_';
const CACHE_TTL = {
  COLUMNS: 24 * 60 * 60 * 1000, // 24 horas
  ACTIVITIES: 5 * 60 * 1000,    // 5 minutos
  DEPENDENCIES: 5 * 60 * 1000,  // 5 minutos
  TEMPLATE: 7 * 24 * 60 * 60 * 1000, // 7 dias
};

// ============================================================================
// TIPOS
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface ColumnConfig {
  visible_columns: string[];
  column_order: string[];
}

interface ActivityTemplate {
  nome: string;
  tipo: 'Tarefa' | 'Marco' | 'Fase' | 'WBS';
  duracao_dias: number;
  progresso: number;
  status: string;
  prioridade: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const getCacheKey = (type: string, ...ids: string[]): string => {
  return `${CACHE_PREFIX}${type}_${ids.join('_')}`;
};

const isExpired = (timestamp: number, ttl: number): boolean => {
  return Date.now() - timestamp > ttl;
};

const safeJSONParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

// ============================================================================
// CACHE DE COLUNAS
// ============================================================================

export const getColumnConfigFromCache = (
  userId: string,
  projetoId: string
): ColumnConfig | null => {
  const key = getCacheKey('columns', userId, projetoId);
  const cached = localStorage.getItem(key);
  
  if (!cached) return null;
  
  const entry = safeJSONParse<CacheEntry<ColumnConfig> | null>(cached, null);
  if (!entry) return null;
  
  if (isExpired(entry.timestamp, CACHE_TTL.COLUMNS)) {
    return entry.data;
  }
  
  return entry.data;
};

export const setColumnConfigToCache = (
  userId: string,
  projetoId: string,
  config: ColumnConfig
): void => {
  const key = getCacheKey('columns', userId, projetoId);
  const entry: CacheEntry<ColumnConfig> = {
    data: config,
    timestamp: Date.now(),
    version: 1,
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Failed to save column config to cache:', e);
  }
};

export const isColumnConfigCacheExpired = (
  userId: string,
  projetoId: string
): boolean => {
  const key = getCacheKey('columns', userId, projetoId);
  const cached = localStorage.getItem(key);
  
  if (!cached) return true;
  
  const entry = safeJSONParse<CacheEntry<ColumnConfig> | null>(cached, null);
  if (!entry) return true;
  
  return isExpired(entry.timestamp, CACHE_TTL.COLUMNS);
};

// ============================================================================
// CACHE DE ATIVIDADES
// ============================================================================

interface ActivitiesCache {
  activities: AtividadeMock[];
  lastUpdated: string | null;
}

export const getActivitiesFromCache = (
  projetoId: string
): ActivitiesCache | null => {
  const key = getCacheKey('activities', projetoId);
  const cached = localStorage.getItem(key);
  
  if (!cached) return null;
  
  const entry = safeJSONParse<CacheEntry<ActivitiesCache> | null>(cached, null);
  if (!entry) return null;
  
  return entry.data;
};

export const setActivitiesToCache = (
  projetoId: string,
  activities: AtividadeMock[],
  lastUpdated: string | null = null
): void => {
  const key = getCacheKey('activities', projetoId);
  const entry: CacheEntry<ActivitiesCache> = {
    data: {
      activities,
      lastUpdated: lastUpdated || new Date().toISOString(),
    },
    timestamp: Date.now(),
    version: 1,
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Failed to save activities to cache:', e);
    clearOldCaches();
  }
};

export const isActivitiesCacheExpired = (projetoId: string): boolean => {
  const key = getCacheKey('activities', projetoId);
  const cached = localStorage.getItem(key);
  
  if (!cached) return true;
  
  const entry = safeJSONParse<CacheEntry<ActivitiesCache> | null>(cached, null);
  if (!entry) return true;
  
  return isExpired(entry.timestamp, CACHE_TTL.ACTIVITIES);
};

export const updateActivityInCache = (
  projetoId: string,
  activityId: string,
  changes: Partial<AtividadeMock>
): void => {
  const cache = getActivitiesFromCache(projetoId);
  if (!cache) return;
  
  const updatedActivities = cache.activities.map(a =>
    a.id === activityId ? { ...a, ...changes } : a
  );
  
  setActivitiesToCache(projetoId, updatedActivities, new Date().toISOString());
};

export const addActivityToCache = (
  projetoId: string,
  activity: AtividadeMock
): void => {
  const cache = getActivitiesFromCache(projetoId);
  const activities = cache?.activities || [];
  
  activities.push(activity);
  setActivitiesToCache(projetoId, activities, new Date().toISOString());
};

export const removeActivityFromCache = (
  projetoId: string,
  activityId: string
): void => {
  const cache = getActivitiesFromCache(projetoId);
  if (!cache) return;
  
  const updatedActivities = cache.activities.filter(a => a.id !== activityId);
  setActivitiesToCache(projetoId, updatedActivities, new Date().toISOString());
};

// ============================================================================
// CACHE DE DEPENDÊNCIAS
// ============================================================================

export const getDependenciesFromCache = (
  projetoId: string
): DependenciaAtividade[] | null => {
  const key = getCacheKey('dependencies', projetoId);
  const cached = localStorage.getItem(key);
  
  if (!cached) return null;
  
  const entry = safeJSONParse<CacheEntry<DependenciaAtividade[]> | null>(cached, null);
  if (!entry) return null;
  
  if (isExpired(entry.timestamp, CACHE_TTL.DEPENDENCIES)) {
    return entry.data;
  }
  
  return entry.data;
};

export const setDependenciesToCache = (
  projetoId: string,
  dependencies: DependenciaAtividade[]
): void => {
  const key = getCacheKey('dependencies', projetoId);
  const entry: CacheEntry<DependenciaAtividade[]> = {
    data: dependencies,
    timestamp: Date.now(),
    version: 1,
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Failed to save dependencies to cache:', e);
  }
};

// ============================================================================
// TEMPLATE DE ATIVIDADE (para inserção rápida)
// ============================================================================

const DEFAULT_ACTIVITY_TEMPLATE: ActivityTemplate = {
  nome: 'Nova Atividade',
  tipo: 'Tarefa',
  duracao_dias: 1,
  progresso: 0,
  status: 'A Fazer',
  prioridade: 'Média',
};

export const getActivityTemplate = (): ActivityTemplate => {
  const key = getCacheKey('activity_template');
  const cached = localStorage.getItem(key);
  
  if (!cached) return DEFAULT_ACTIVITY_TEMPLATE;
  
  const entry = safeJSONParse<CacheEntry<ActivityTemplate> | null>(cached, null);
  if (!entry) return DEFAULT_ACTIVITY_TEMPLATE;
  
  return entry.data;
};

export const setActivityTemplate = (template: Partial<ActivityTemplate>): void => {
  const current = getActivityTemplate();
  const key = getCacheKey('activity_template');
  const entry: CacheEntry<ActivityTemplate> = {
    data: { ...current, ...template },
    timestamp: Date.now(),
    version: 1,
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Failed to save activity template to cache:', e);
  }
};

// ============================================================================
// GERADOR DE ID TEMPORÁRIO (para inserção otimista)
// ============================================================================

let tempIdCounter = 0;

export const generateTempId = (): string => {
  tempIdCounter++;
  return `temp_${Date.now()}_${tempIdCounter}`;
};

export const isTempId = (id: string): boolean => {
  return id.startsWith('temp_');
};

// ============================================================================
// PENDING OPERATIONS (operações aguardando sincronização)
// ============================================================================

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  tempId?: string;
  realId?: string;
  data: any;
  timestamp: number;
  retries: number;
}

export const getPendingOperations = (projetoId: string): PendingOperation[] => {
  const key = getCacheKey('pending_ops', projetoId);
  const cached = localStorage.getItem(key);
  return safeJSONParse<PendingOperation[]>(cached, []);
};

export const addPendingOperation = (
  projetoId: string,
  operation: Omit<PendingOperation, 'timestamp' | 'retries'>
): void => {
  const operations = getPendingOperations(projetoId);
  operations.push({
    ...operation,
    timestamp: Date.now(),
    retries: 0,
  });
  
  const key = getCacheKey('pending_ops', projetoId);
  try {
    localStorage.setItem(key, JSON.stringify(operations));
  } catch (e) {
    console.warn('Failed to save pending operation:', e);
  }
};

export const removePendingOperation = (projetoId: string, operationId: string): void => {
  const operations = getPendingOperations(projetoId);
  const filtered = operations.filter(op => op.id !== operationId);
  
  const key = getCacheKey('pending_ops', projetoId);
  try {
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to remove pending operation:', e);
  }
};

export const updateTempIdToReal = (
  projetoId: string,
  tempId: string,
  realId: string
): void => {
  const cache = getActivitiesFromCache(projetoId);
  if (!cache) return;
  
  const updatedActivities = cache.activities.map(a =>
    a.id === tempId ? { ...a, id: realId } : a
  );
  
  setActivitiesToCache(projetoId, updatedActivities, new Date().toISOString());
};

// ============================================================================
// LIMPEZA DE CACHE
// ============================================================================

export const clearProjectCache = (projetoId: string): void => {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(projetoId)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

export const clearAllCache = (): void => {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

export const clearOldCaches = (): void => {
  const keysToRemove: string[] = [];
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const entry = JSON.parse(cached) as CacheEntry<unknown>;
          if (now - entry.timestamp > maxAge) {
            keysToRemove.push(key);
          }
        }
      } catch {
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

// ============================================================================
// DEBOUNCE PARA BATCH UPDATES
// ============================================================================

type UpdateCallback = (updates: Map<string, Partial<AtividadeMock>>) => Promise<void>;

class BatchUpdateManager {
  private pendingUpdates: Map<string, Partial<AtividadeMock>> = new Map();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private callback: UpdateCallback | null = null;
  private debounceMs: number = 500;
  
  setCallback(callback: UpdateCallback): void {
    this.callback = callback;
  }
  
  setDebounceMs(ms: number): void {
    this.debounceMs = ms;
  }
  
  queueUpdate(activityId: string, changes: Partial<AtividadeMock>): void {
    const existing = this.pendingUpdates.get(activityId) || {};
    this.pendingUpdates.set(activityId, { ...existing, ...changes });
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);
  }
  
  async flush(): Promise<void> {
    if (this.pendingUpdates.size === 0) return;
    
    const updates = new Map(this.pendingUpdates);
    this.pendingUpdates.clear();
    
    if (this.callback) {
      try {
        await this.callback(updates);
      } catch (error) {
        console.error('Batch update failed:', error);
        updates.forEach((changes, id) => {
          this.pendingUpdates.set(id, { ...this.pendingUpdates.get(id), ...changes });
        });
      }
    }
  }
  
  hasPendingUpdates(): boolean {
    return this.pendingUpdates.size > 0;
  }
  
  cancel(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingUpdates.clear();
  }
}

export const batchUpdateManager = new BatchUpdateManager();
