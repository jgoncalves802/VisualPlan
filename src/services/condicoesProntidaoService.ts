import { supabase } from './supabase';
import { parseDateOnly } from '../utils/dateHelpers';
import {
  CondicaoProntidao,
  TipoCondicaoProntidao,
  StatusCondicaoProntidao,
  ResumoProntidao,
} from '../types/lps';

const STORAGE_KEY = 'visionplan_condicoes_prontidao';

const getLocalCondicoes = (): CondicaoProntidao[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((c: Record<string, unknown>) => ({
        ...c,
        createdAt: new Date(c.createdAt as string),
        updatedAt: new Date(c.updatedAt as string),
        dataPrevista: c.dataPrevista ? parseDateOnly(c.dataPrevista as string) ?? undefined : undefined,
        dataAtendida: c.dataAtendida ? parseDateOnly(c.dataAtendida as string) ?? undefined : undefined,
      }));
    }
  } catch (e) {
    console.error('Erro ao ler condições do localStorage:', e);
  }
  return [];
};

const saveLocalCondicoes = (condicoes: CondicaoProntidao[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(condicoes));
  } catch (e) {
    console.error('Erro ao salvar condições no localStorage:', e);
  }
};

const generateId = () => `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface CondicaoProntidaoDB {
  id: string;
  empresa_id: string;
  atividade_id: string;
  tipo_condicao: string;
  status: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  data_prevista?: string;
  data_atendida?: string;
  observacoes?: string;
  restricao_id?: string;
  created_at: string;
  updated_at: string;
}

const mapFromDB = (data: CondicaoProntidaoDB): CondicaoProntidao => ({
  id: data.id,
  empresaId: data.empresa_id,
  atividadeId: data.atividade_id,
  tipoCondicao: data.tipo_condicao as TipoCondicaoProntidao,
  status: data.status as StatusCondicaoProntidao,
  responsavelId: data.responsavel_id,
  responsavelNome: data.responsavel_nome,
  dataPrevista: parseDateOnly(data.data_prevista as string) ?? undefined,
  dataAtendida: parseDateOnly(data.data_atendida as string) ?? undefined,
  observacoes: data.observacoes,
  restricaoId: data.restricao_id,
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
});

const mapToDB = (data: Partial<CondicaoProntidao>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  
  if (data.empresaId !== undefined) result.empresa_id = data.empresaId;
  if (data.atividadeId !== undefined) result.atividade_id = data.atividadeId;
  if (data.tipoCondicao !== undefined) result.tipo_condicao = data.tipoCondicao;
  if (data.status !== undefined) result.status = data.status;
  if (data.responsavelId !== undefined) result.responsavel_id = data.responsavelId;
  if (data.responsavelNome !== undefined) result.responsavel_nome = data.responsavelNome;
  if (data.dataPrevista !== undefined) {
    result.data_prevista = data.dataPrevista ? formatDateForDB(data.dataPrevista) : null;
  }
  if (data.dataAtendida !== undefined) {
    result.data_atendida = data.dataAtendida ? formatDateForDB(data.dataAtendida) : null;
  }
  if (data.observacoes !== undefined) result.observacoes = data.observacoes;
  if (data.restricaoId !== undefined) result.restricao_id = data.restricaoId;
  
  return result;
};

const formatDateForDB = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const condicoesProntidaoService = {
  async getByAtividade(atividadeId: string, empresaId: string): Promise<CondicaoProntidao[]> {
    try {
      const { data, error, status } = await supabase
        .from('condicoes_prontidao')
        .select('*')
        .eq('atividade_id', atividadeId)
        .eq('empresa_id', empresaId)
        .order('tipo_condicao');

      if (error || status === 404) {
        console.warn('Tabela condicoes_prontidao não disponível, usando localStorage');
        const localCondicoes = getLocalCondicoes();
        return localCondicoes.filter(c => c.atividadeId === atividadeId && c.empresaId === empresaId);
      }

      return (data || []).map(mapFromDB);
    } catch (error) {
      console.error('Erro ao buscar condições de prontidão:', error);
      const localCondicoes = getLocalCondicoes();
      return localCondicoes.filter(c => c.atividadeId === atividadeId && c.empresaId === empresaId);
    }
  },

  async getResumoProntidao(atividadeId: string, empresaId: string): Promise<ResumoProntidao> {
    const condicoes = await this.getByAtividade(atividadeId, empresaId);
    
    const condicoesAtendidas = condicoes.filter(c => c.status === StatusCondicaoProntidao.ATENDIDA).length;
    const condicoesPendentes = condicoes.filter(c => c.status === StatusCondicaoProntidao.PENDENTE).length;
    const condicoesNaoAplicaveis = condicoes.filter(c => c.status === StatusCondicaoProntidao.NAO_APLICAVEL).length;
    const totalCondicoes = condicoes.length;
    const condicoesRelevantes = totalCondicoes - condicoesNaoAplicaveis;
    
    return {
      atividadeId,
      totalCondicoes,
      condicoesAtendidas,
      condicoesPendentes,
      condicoesNaoAplicaveis,
      percentualProntidao: condicoesRelevantes > 0 ? Math.round((condicoesAtendidas / condicoesRelevantes) * 100) : 100,
      prontaParaExecucao: condicoesPendentes === 0,
      condicoes,
    };
  },

  async inicializarCondicoes(atividadeId: string, empresaId: string): Promise<CondicaoProntidao[]> {
    const existentes = await this.getByAtividade(atividadeId, empresaId);
    if (existentes.length > 0) return existentes;

    const tiposCondicao = Object.values(TipoCondicaoProntidao);
    const novasCondicoes: Partial<CondicaoProntidao>[] = tiposCondicao.map(tipo => ({
      empresaId,
      atividadeId,
      tipoCondicao: tipo,
      status: StatusCondicaoProntidao.PENDENTE,
    }));

    const { data, error, status } = await supabase
      .from('condicoes_prontidao')
      .insert(novasCondicoes.map(mapToDB))
      .select();

    if (error || status === 404) {
      console.warn('Tabela condicoes_prontidao não disponível, criando condições localmente');
      const now = new Date();
      const localCondicoes: CondicaoProntidao[] = tiposCondicao.map(tipo => ({
        id: generateId(),
        empresaId,
        atividadeId,
        tipoCondicao: tipo,
        status: StatusCondicaoProntidao.PENDENTE,
        createdAt: now,
        updatedAt: now,
      }));
      
      const allCondicoes = [...getLocalCondicoes(), ...localCondicoes];
      saveLocalCondicoes(allCondicoes);
      return localCondicoes;
    }

    return (data || []).map(mapFromDB);
  },

  async update(id: string, updates: Partial<CondicaoProntidao>): Promise<CondicaoProntidao | null> {
    if (id.startsWith('local-')) {
      const allCondicoes = getLocalCondicoes();
      const index = allCondicoes.findIndex(c => c.id === id);
      if (index >= 0) {
        const updated: CondicaoProntidao = {
          ...allCondicoes[index],
          ...updates,
          updatedAt: new Date(),
        };
        allCondicoes[index] = updated;
        saveLocalCondicoes(allCondicoes);
        return updated;
      }
      return null;
    }
    
    try {
      const updateData = mapToDB(updates);
      updateData.updated_at = new Date().toISOString();

      const { data, error, status } = await supabase
        .from('condicoes_prontidao')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || status === 404) {
        console.warn('Tabela condicoes_prontidao não disponível, atualizando no localStorage');
        const allCondicoes = getLocalCondicoes();
        const index = allCondicoes.findIndex(c => c.id === id);
        if (index >= 0) {
          const updated: CondicaoProntidao = {
            ...allCondicoes[index],
            ...updates,
            updatedAt: new Date(),
          };
          allCondicoes[index] = updated;
          saveLocalCondicoes(allCondicoes);
          return updated;
        }
        return null;
      }

      return data ? mapFromDB(data) : null;
    } catch (error) {
      console.error('Erro ao atualizar condição de prontidão:', error);
      return null;
    }
  },

  async atualizarStatus(
    id: string,
    status: StatusCondicaoProntidao,
    observacoes?: string
  ): Promise<CondicaoProntidao | null> {
    const updates: Partial<CondicaoProntidao> = { status };
    
    if (status === StatusCondicaoProntidao.ATENDIDA) {
      updates.dataAtendida = new Date();
    }
    
    if (observacoes !== undefined) {
      updates.observacoes = observacoes;
    }
    
    return this.update(id, updates);
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('condicoes_prontidao')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar condição de prontidão:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar condição de prontidão:', error);
      return false;
    }
  },

  async deleteByAtividade(atividadeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('condicoes_prontidao')
        .delete()
        .eq('atividade_id', atividadeId);

      if (error) {
        console.error('Erro ao deletar condições de prontidão:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar condições de prontidão:', error);
      return false;
    }
  },

  async vincularRestricao(condicaoId: string, restricaoId: string): Promise<boolean> {
    const result = await this.update(condicaoId, { restricaoId });
    return result !== null;
  },
};
