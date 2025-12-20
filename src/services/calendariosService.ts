import { supabase } from './supabaseClient';

export enum DiaTrabalho {
  DOMINGO = 0,
  SEGUNDA = 1,
  TERCA = 2,
  QUARTA = 3,
  QUINTA = 4,
  SEXTA = 5,
  SABADO = 6,
}

export enum TipoExcecao {
  FERIADO = 'FERIADO',
  FOLGA = 'FOLGA',
  TRABALHO_EXTRA = 'TRABALHO_EXTRA',
  MEIO_PERIODO = 'MEIO_PERIODO',
}

export interface ExcecaoCalendario {
  id: string;
  calendarioId: string;
  data: Date;
  tipo: TipoExcecao;
  descricao?: string;
  horasTrabalho: number;
}

export interface CalendarioProjeto {
  id: string;
  projetoId?: string;
  nome: string;
  descricao?: string;
  diasTrabalho: DiaTrabalho[];
  horarioInicio: string;
  horarioFim: string;
  horarioAlmocoInicio?: string;
  horarioAlmocoFim?: string;
  horasPorDia: number;
  padrao: boolean;
  ativo: boolean;
  excecoes?: ExcecaoCalendario[];
}

interface CalendarioDB {
  id: string;
  empresa_id: string;
  projeto_id: string | null;
  nome: string;
  descricao: string | null;
  dias_trabalho: number[];
  horario_inicio: string;
  horario_fim: string;
  horario_almoco_inicio: string | null;
  horario_almoco_fim: string | null;
  horas_por_dia: number;
  padrao: boolean;
  ativo: boolean;
}

interface ExcecaoDB {
  id: string;
  calendario_id: string;
  data: string;
  tipo: string;
  descricao: string | null;
  horas_trabalho: number;
}

const mapCalendarioFromDB = (data: CalendarioDB): CalendarioProjeto => ({
  id: data.id,
  projetoId: data.projeto_id || undefined,
  nome: data.nome,
  descricao: data.descricao || undefined,
  diasTrabalho: data.dias_trabalho as DiaTrabalho[],
  horarioInicio: data.horario_inicio,
  horarioFim: data.horario_fim,
  horarioAlmocoInicio: data.horario_almoco_inicio || undefined,
  horarioAlmocoFim: data.horario_almoco_fim || undefined,
  horasPorDia: data.horas_por_dia,
  padrao: data.padrao,
  ativo: data.ativo,
});

const mapExcecaoFromDB = (data: ExcecaoDB): ExcecaoCalendario => ({
  id: data.id,
  calendarioId: data.calendario_id,
  data: new Date(data.data),
  tipo: data.tipo as TipoExcecao,
  descricao: data.descricao || undefined,
  horasTrabalho: data.horas_trabalho,
});

const DEFAULT_CALENDARIOS: Omit<CalendarioProjeto, 'id'>[] = [
  {
    nome: 'Calendário Padrão 5x8',
    descricao: 'Segunda a Sexta, 8 horas por dia',
    diasTrabalho: [DiaTrabalho.SEGUNDA, DiaTrabalho.TERCA, DiaTrabalho.QUARTA, DiaTrabalho.QUINTA, DiaTrabalho.SEXTA],
    horarioInicio: '08:00',
    horarioFim: '17:00',
    horarioAlmocoInicio: '12:00',
    horarioAlmocoFim: '13:00',
    horasPorDia: 8,
    padrao: true,
    ativo: true,
  },
  {
    nome: 'Calendário 6x8',
    descricao: 'Segunda a Sábado, 8 horas por dia',
    diasTrabalho: [DiaTrabalho.SEGUNDA, DiaTrabalho.TERCA, DiaTrabalho.QUARTA, DiaTrabalho.QUINTA, DiaTrabalho.SEXTA, DiaTrabalho.SABADO],
    horarioInicio: '07:00',
    horarioFim: '16:00',
    horarioAlmocoInicio: '12:00',
    horarioAlmocoFim: '13:00',
    horasPorDia: 8,
    padrao: false,
    ativo: true,
  },
  {
    nome: 'Calendário 24/7',
    descricao: 'Operação contínua 24 horas, 7 dias por semana',
    diasTrabalho: [DiaTrabalho.DOMINGO, DiaTrabalho.SEGUNDA, DiaTrabalho.TERCA, DiaTrabalho.QUARTA, DiaTrabalho.QUINTA, DiaTrabalho.SEXTA, DiaTrabalho.SABADO],
    horarioInicio: '00:00',
    horarioFim: '23:59',
    horasPorDia: 24,
    padrao: false,
    ativo: true,
  },
];

export const calendariosService = {
  async getAll(empresaId: string, projetoId?: string): Promise<CalendarioProjeto[]> {
    let query = supabase
      .from('calendarios_projeto')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('padrao', { ascending: false });

    if (projetoId) {
      query = query.or(`projeto_id.eq.${projetoId},projeto_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela calendarios_projeto não encontrada, retornando calendários padrão');
        return DEFAULT_CALENDARIOS.map((c, i) => ({ ...c, id: `default-${i}` }));
      }
      console.error('Erro ao buscar calendários:', error);
      return DEFAULT_CALENDARIOS.map((c, i) => ({ ...c, id: `default-${i}` }));
    }

    if (!data || data.length === 0) {
      return DEFAULT_CALENDARIOS.map((c, i) => ({ ...c, id: `default-${i}` }));
    }

    return data.map(mapCalendarioFromDB);
  },

  async getById(id: string): Promise<CalendarioProjeto | null> {
    const { data, error } = await supabase
      .from('calendarios_projeto')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        return null;
      }
      console.error('Erro ao buscar calendário:', error);
      return null;
    }

    return mapCalendarioFromDB(data);
  },

  async getDefault(empresaId: string): Promise<CalendarioProjeto | null> {
    const { data, error } = await supabase
      .from('calendarios_projeto')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('padrao', true)
      .eq('ativo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        return { ...DEFAULT_CALENDARIOS[0], id: 'default-0' };
      }
      console.error('Erro ao buscar calendário padrão:', error);
      return { ...DEFAULT_CALENDARIOS[0], id: 'default-0' };
    }

    return mapCalendarioFromDB(data);
  },

  async create(calendario: Omit<CalendarioProjeto, 'id'>, empresaId: string): Promise<CalendarioProjeto | null> {
    const dbData = {
      empresa_id: empresaId,
      projeto_id: calendario.projetoId || null,
      nome: calendario.nome,
      descricao: calendario.descricao || null,
      dias_trabalho: calendario.diasTrabalho,
      horario_inicio: calendario.horarioInicio,
      horario_fim: calendario.horarioFim,
      horario_almoco_inicio: calendario.horarioAlmocoInicio || null,
      horario_almoco_fim: calendario.horarioAlmocoFim || null,
      horas_por_dia: calendario.horasPorDia,
      padrao: calendario.padrao,
      ativo: calendario.ativo,
    };

    const { data, error } = await supabase
      .from('calendarios_projeto')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar calendário:', error);
      throw error;
    }

    return mapCalendarioFromDB(data);
  },

  async update(id: string, calendario: Partial<CalendarioProjeto>): Promise<CalendarioProjeto | null> {
    const updateData: Record<string, unknown> = {};
    
    if (calendario.nome !== undefined) updateData.nome = calendario.nome;
    if (calendario.descricao !== undefined) updateData.descricao = calendario.descricao;
    if (calendario.diasTrabalho !== undefined) updateData.dias_trabalho = calendario.diasTrabalho;
    if (calendario.horarioInicio !== undefined) updateData.horario_inicio = calendario.horarioInicio;
    if (calendario.horarioFim !== undefined) updateData.horario_fim = calendario.horarioFim;
    if (calendario.horarioAlmocoInicio !== undefined) updateData.horario_almoco_inicio = calendario.horarioAlmocoInicio;
    if (calendario.horarioAlmocoFim !== undefined) updateData.horario_almoco_fim = calendario.horarioAlmocoFim;
    if (calendario.horasPorDia !== undefined) updateData.horas_por_dia = calendario.horasPorDia;
    if (calendario.padrao !== undefined) updateData.padrao = calendario.padrao;
    if (calendario.ativo !== undefined) updateData.ativo = calendario.ativo;

    const { data, error } = await supabase
      .from('calendarios_projeto')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar calendário:', error);
      throw error;
    }

    return mapCalendarioFromDB(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('calendarios_projeto')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir calendário:', error);
      throw error;
    }

    return true;
  },

  async getExcecoes(calendarioId: string): Promise<ExcecaoCalendario[]> {
    const { data, error } = await supabase
      .from('excecoes_calendario')
      .select('*')
      .eq('calendario_id', calendarioId)
      .order('data', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205') {
        return [];
      }
      console.error('Erro ao buscar exceções:', error);
      return [];
    }

    return (data || []).map(mapExcecaoFromDB);
  },

  async addExcecao(excecao: Omit<ExcecaoCalendario, 'id'>): Promise<ExcecaoCalendario | null> {
    const dbData = {
      calendario_id: excecao.calendarioId,
      data: excecao.data.toISOString().split('T')[0],
      tipo: excecao.tipo,
      descricao: excecao.descricao || null,
      horas_trabalho: excecao.horasTrabalho,
    };

    const { data, error } = await supabase
      .from('excecoes_calendario')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar exceção:', error);
      throw error;
    }

    return mapExcecaoFromDB(data);
  },

  async removeExcecao(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('excecoes_calendario')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao remover exceção:', error);
      throw error;
    }

    return true;
  },

  async initializeDefaultCalendarios(empresaId: string): Promise<CalendarioProjeto[]> {
    const existing = await this.getAll(empresaId);
    if (existing.length > 0 && !existing[0].id.startsWith('default-')) {
      return existing;
    }

    const created: CalendarioProjeto[] = [];
    for (const calendario of DEFAULT_CALENDARIOS) {
      try {
        const result = await this.create(calendario, empresaId);
        if (result) created.push(result);
      } catch {
        console.warn('Erro ao criar calendário padrão:', calendario.nome);
      }
    }

    return created.length > 0 ? created : existing;
  },

  calculateWorkHours(calendario: CalendarioProjeto, startDate: Date, endDate: Date): number {
    let totalHours = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay() as DiaTrabalho;
      if (calendario.diasTrabalho.includes(dayOfWeek)) {
        totalHours += calendario.horasPorDia;
      }
      current.setDate(current.getDate() + 1);
    }

    return totalHours;
  },

  isWorkDay(calendario: CalendarioProjeto, date: Date): boolean {
    const dayOfWeek = date.getDay() as DiaTrabalho;
    return calendario.diasTrabalho.includes(dayOfWeek);
  },
};
