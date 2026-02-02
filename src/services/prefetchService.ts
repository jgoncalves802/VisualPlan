import { supabase } from './supabase';
import { useEpsStore } from '../stores/epsStore';

interface PrefetchStatus {
  isLoading: boolean;
  progress: number;
  message: string;
  error: string | null;
}

let prefetchStatus: PrefetchStatus = {
  isLoading: false,
  progress: 0,
  message: '',
  error: null,
};

const listeners: Set<(status: PrefetchStatus) => void> = new Set();

export function subscribeToPrefetchStatus(callback: (status: PrefetchStatus) => void) {
  listeners.add(callback);
  callback(prefetchStatus);
  return () => listeners.delete(callback);
}

function updateStatus(updates: Partial<PrefetchStatus>) {
  prefetchStatus = { ...prefetchStatus, ...updates };
  listeners.forEach(cb => cb(prefetchStatus));
}

export async function prefetchUserData(empresaId: string, _usuarioId: string): Promise<void> {
  if (prefetchStatus.isLoading) return;
  
  updateStatus({ isLoading: true, progress: 0, message: 'Carregando projetos...', error: null });
  
  try {
    const { data: projetos, error: projetosError } = await supabase
      .from('eps_nodes')
      .select('id, nome, codigo, parent_id')
      .eq('empresa_id', empresaId)
      .eq('nivel', 0)
      .order('nome');
    
    if (projetosError) throw projetosError;
    
    updateStatus({ progress: 20, message: `${projetos?.length || 0} projetos encontrados` });
    
    if (projetos && projetos.length > 0) {
      const recentProjectId = sessionStorage.getItem('visionplan_last_project');
      const projectToPreload = recentProjectId || projetos[0].id;
      
      updateStatus({ progress: 40, message: 'Carregando cronograma...' });
      
      const { data: atividades } = await supabase
        .from('atividades')
        .select('*')
        .eq('projeto_id', projectToPreload)
        .limit(500);
      
      if (atividades && atividades.length > 0) {
        sessionStorage.setItem(`cronograma_cache_${projectToPreload}`, JSON.stringify({
          data: atividades,
          timestamp: Date.now(),
          version: 1,
        }));
      }
      
      updateStatus({ progress: 60, message: 'Carregando take-off...' });
      
      const { data: takeoffItems } = await supabase
        .from('takeoff_items')
        .select('id, tag, descricao, quantidade, unidade, disciplina_id, mapa_id')
        .eq('projeto_id', projectToPreload)
        .limit(500);
      
      if (takeoffItems && takeoffItems.length > 0) {
        sessionStorage.setItem(`takeoff_cache_${projectToPreload}`, JSON.stringify({
          data: takeoffItems,
          timestamp: Date.now(),
          version: 1,
        }));
      }
      
      updateStatus({ progress: 80, message: 'Carregando WBS...' });
      
      await useEpsStore.getState().loadNodes(empresaId);
      
      updateStatus({ progress: 100, message: 'Dados carregados!', isLoading: false });
    } else {
      updateStatus({ progress: 100, message: 'Nenhum projeto encontrado', isLoading: false });
    }
  } catch (error) {
    console.error('Prefetch error:', error);
    updateStatus({
      isLoading: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar dados',
      message: 'Erro no pré-carregamento',
    });
  }
}

export function getCachedCronograma(projetoId: string): any[] | null {
  try {
    const cached = sessionStorage.getItem(`cronograma_cache_${projetoId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      if (age < 5 * 60 * 1000) {
        return parsed.data;
      }
      sessionStorage.removeItem(`cronograma_cache_${projetoId}`);
    }
  } catch {
  }
  return null;
}

export function getCachedTakeoff(projetoId: string): any[] | null {
  try {
    const cached = sessionStorage.getItem(`takeoff_cache_${projetoId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      if (age < 5 * 60 * 1000) {
        return parsed.data;
      }
      sessionStorage.removeItem(`takeoff_cache_${projetoId}`);
    }
  } catch {
  }
  return null;
}

export function clearPrefetchCache() {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith('cronograma_cache_') || key.startsWith('takeoff_cache_')) {
      sessionStorage.removeItem(key);
    }
  });
}

export function getPrefetchStatus(): PrefetchStatus {
  return prefetchStatus;
}
