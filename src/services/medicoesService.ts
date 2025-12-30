import { supabase } from './supabase';
import { parseDateOnly } from '../utils/dateHelpers';
import type {
  MedicoesConfig,
  MedicoesPeriodo,
  MedicoesAvanco,
  MedicoesAprovacao,
  MedicoesRestricao,
  CreateConfigDTO,
  UpdateConfigDTO,
  CreatePeriodoDTO,
  UpdatePeriodoDTO,
  CreateAvancoDTO,
  CreateAprovacaoDTO,
  PeriodoGerado,
  StatusAvanco
} from '../types/medicoes.types';
import { addMonths, setDate, format, isAfter, isBefore, startOfDay } from 'date-fns';

const mapConfigFromDB = (row: Record<string, unknown>): MedicoesConfig => ({
  id: row.id as string,
  projetoId: row.projeto_id as string,
  empresaId: row.empresa_id as string,
  diaInicioPeriodo: row.dia_inicio_periodo as number,
  diaFimPeriodo: row.dia_fim_periodo as number,
  prazoContratualInicio: parseDateOnly(row.prazo_contratual_inicio as string) ?? undefined,
  prazoContratualFim: parseDateOnly(row.prazo_contratual_fim as string) ?? undefined,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

const mapPeriodoFromDB = (row: Record<string, unknown>): MedicoesPeriodo => ({
  id: row.id as string,
  projetoId: row.projeto_id as string,
  empresaId: row.empresa_id as string,
  numero: row.numero as number,
  dataInicio: parseDateOnly(row.data_inicio as string) ?? new Date(),
  dataFim: parseDateOnly(row.data_fim as string) ?? new Date(),
  status: row.status as MedicoesPeriodo['status'],
  valorPrevisto: Number(row.valor_previsto) || 0,
  valorMedido: Number(row.valor_medido) || 0,
  valorAprovado: Number(row.valor_aprovado) || 0,
  observacoes: row.observacoes as string | undefined,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

const mapAvancoFromDB = (row: Record<string, unknown>): MedicoesAvanco => ({
  id: row.id as string,
  periodoId: row.periodo_id as string,
  empresaId: row.empresa_id as string,
  origem: row.origem as MedicoesAvanco['origem'],
  atividadeId: row.atividade_id as string | undefined,
  itemId: row.item_id as string | undefined,
  descricao: row.descricao as string,
  qtdAnterior: Number(row.qtd_anterior) || 0,
  qtdAvancada: Number(row.qtd_avancada) || 0,
  qtdAcumulada: Number(row.qtd_acumulada) || 0,
  percentualAnterior: Number(row.percentual_anterior) || 0,
  percentualAvancado: Number(row.percentual_avancado) || 0,
  percentualAcumulado: Number(row.percentual_acumulado) || 0,
  registradoPor: row.registrado_por as string | undefined,
  registradoEm: new Date(row.registrado_em as string),
  status: row.status as MedicoesAvanco['status'],
  observacoes: row.observacoes as string | undefined,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

const mapAprovacaoFromDB = (row: Record<string, unknown>): MedicoesAprovacao => ({
  id: row.id as string,
  avancoId: row.avanco_id as string,
  empresaId: row.empresa_id as string,
  nivel: row.nivel as MedicoesAprovacao['nivel'],
  aprovadorId: row.aprovador_id as string | undefined,
  aprovadorNome: row.aprovador_nome as string | undefined,
  acao: row.acao as MedicoesAprovacao['acao'],
  comentario: row.comentario as string | undefined,
  dataAcao: new Date(row.data_acao as string),
  createdAt: new Date(row.created_at as string),
});

const mapRestricaoFromDB = (row: Record<string, unknown>): MedicoesRestricao => ({
  id: row.id as string,
  periodoId: row.periodo_id as string,
  restricaoId: row.restricao_id as string,
  empresaId: row.empresa_id as string,
  categoria: row.categoria as string | undefined,
  descricao: row.descricao as string | undefined,
  status: row.status as string | undefined,
  impactoMedicao: row.impacto_medicao as string | undefined,
  createdAt: new Date(row.created_at as string),
});

export const medicoesService = {
  async getConfig(projetoId: string): Promise<MedicoesConfig | null> {
    const { data, error } = await supabase
      .from('medicoes_config')
      .select('*')
      .eq('projeto_id', projetoId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar config:', error);
      throw error;
    }

    return data ? mapConfigFromDB(data) : null;
  },

  async createConfig(dto: CreateConfigDTO): Promise<MedicoesConfig> {
    const { data, error } = await supabase
      .from('medicoes_config')
      .insert({
        projeto_id: dto.projetoId,
        empresa_id: dto.empresaId,
        dia_inicio_periodo: dto.diaInicioPeriodo ?? 1,
        dia_fim_periodo: dto.diaFimPeriodo ?? 25,
        prazo_contratual_inicio: dto.prazoContratualInicio ? format(dto.prazoContratualInicio, 'yyyy-MM-dd') : null,
        prazo_contratual_fim: dto.prazoContratualFim ? format(dto.prazoContratualFim, 'yyyy-MM-dd') : null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapConfigFromDB(data);
  },

  async updateConfig(projetoId: string, dto: UpdateConfigDTO): Promise<MedicoesConfig> {
    const updates: Record<string, unknown> = {};
    if (dto.diaInicioPeriodo !== undefined) updates.dia_inicio_periodo = dto.diaInicioPeriodo;
    if (dto.diaFimPeriodo !== undefined) updates.dia_fim_periodo = dto.diaFimPeriodo;
    if (dto.prazoContratualInicio !== undefined) {
      updates.prazo_contratual_inicio = dto.prazoContratualInicio ? format(dto.prazoContratualInicio, 'yyyy-MM-dd') : null;
    }
    if (dto.prazoContratualFim !== undefined) {
      updates.prazo_contratual_fim = dto.prazoContratualFim ? format(dto.prazoContratualFim, 'yyyy-MM-dd') : null;
    }

    const { data, error } = await supabase
      .from('medicoes_config')
      .update(updates)
      .eq('projeto_id', projetoId)
      .select()
      .single();

    if (error) throw error;
    return mapConfigFromDB(data);
  },

  async upsertConfig(dto: CreateConfigDTO): Promise<MedicoesConfig> {
    const existing = await this.getConfig(dto.projetoId);
    if (existing) {
      return this.updateConfig(dto.projetoId, {
        diaInicioPeriodo: dto.diaInicioPeriodo,
        diaFimPeriodo: dto.diaFimPeriodo,
        prazoContratualInicio: dto.prazoContratualInicio,
        prazoContratualFim: dto.prazoContratualFim,
      });
    }
    return this.createConfig(dto);
  },

  generatePeriodos(
    diaInicio: number,
    diaFim: number,
    prazoInicio: Date,
    prazoFim: Date
  ): PeriodoGerado[] {
    const periodos: PeriodoGerado[] = [];
    let currentDate = startOfDay(prazoInicio);
    let numero = 1;

    while (isBefore(currentDate, prazoFim) || currentDate.getTime() === prazoFim.getTime()) {
      let periodoInicio = setDate(currentDate, diaInicio);
      let periodoFim = setDate(currentDate, diaFim);

      if (diaFim < diaInicio) {
        periodoFim = setDate(addMonths(currentDate, 1), diaFim);
      }

      if (isAfter(periodoInicio, prazoFim)) break;

      if (isBefore(periodoInicio, prazoInicio)) {
        periodoInicio = prazoInicio;
      }

      if (isAfter(periodoFim, prazoFim)) {
        periodoFim = prazoFim;
      }

      periodos.push({
        numero,
        dataInicio: periodoInicio,
        dataFim: periodoFim,
      });

      currentDate = addMonths(currentDate, 1);
      numero++;

      if (numero > 120) break;
    }

    return periodos;
  },

  async getPeriodos(projetoId: string): Promise<MedicoesPeriodo[]> {
    const { data, error } = await supabase
      .from('medicoes_periodos')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('numero', { ascending: true });

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar períodos:', error);
      return [];
    }

    return (data || []).map(mapPeriodoFromDB);
  },

  async getPeriodo(periodoId: string): Promise<MedicoesPeriodo | null> {
    const { data, error } = await supabase
      .from('medicoes_periodos')
      .select('*')
      .eq('id', periodoId)
      .single();

    if (error) {
      console.error('Erro ao buscar período:', error);
      return null;
    }

    return mapPeriodoFromDB(data);
  },

  async createPeriodo(dto: CreatePeriodoDTO): Promise<MedicoesPeriodo> {
    const { data, error } = await supabase
      .from('medicoes_periodos')
      .insert({
        projeto_id: dto.projetoId,
        empresa_id: dto.empresaId,
        numero: dto.numero,
        data_inicio: format(dto.dataInicio, 'yyyy-MM-dd'),
        data_fim: format(dto.dataFim, 'yyyy-MM-dd'),
        valor_previsto: dto.valorPrevisto ?? 0,
        observacoes: dto.observacoes,
      })
      .select()
      .single();

    if (error) throw error;
    return mapPeriodoFromDB(data);
  },

  async createPeriodosBatch(periodos: CreatePeriodoDTO[]): Promise<MedicoesPeriodo[]> {
    if (periodos.length === 0) return [];

    const rows = periodos.map(dto => ({
      projeto_id: dto.projetoId,
      empresa_id: dto.empresaId,
      numero: dto.numero,
      data_inicio: format(dto.dataInicio, 'yyyy-MM-dd'),
      data_fim: format(dto.dataFim, 'yyyy-MM-dd'),
      valor_previsto: dto.valorPrevisto ?? 0,
      observacoes: dto.observacoes,
    }));

    const { data, error } = await supabase
      .from('medicoes_periodos')
      .insert(rows)
      .select();

    if (error) throw error;
    return (data || []).map(mapPeriodoFromDB);
  },

  async updatePeriodo(periodoId: string, dto: UpdatePeriodoDTO): Promise<MedicoesPeriodo> {
    const updates: Record<string, unknown> = {};
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.valorMedido !== undefined) updates.valor_medido = dto.valorMedido;
    if (dto.valorAprovado !== undefined) updates.valor_aprovado = dto.valorAprovado;
    if (dto.observacoes !== undefined) updates.observacoes = dto.observacoes;

    const { data, error } = await supabase
      .from('medicoes_periodos')
      .update(updates)
      .eq('id', periodoId)
      .select()
      .single();

    if (error) throw error;
    return mapPeriodoFromDB(data);
  },

  async deletePeriodo(periodoId: string): Promise<void> {
    const { error } = await supabase
      .from('medicoes_periodos')
      .delete()
      .eq('id', periodoId);

    if (error) throw error;
  },

  async deletePeriodosByProjeto(projetoId: string): Promise<void> {
    const { error } = await supabase
      .from('medicoes_periodos')
      .delete()
      .eq('projeto_id', projetoId);

    if (error) throw error;
  },

  async getAvancos(periodoId: string): Promise<MedicoesAvanco[]> {
    const { data, error } = await supabase
      .from('medicoes_avancos')
      .select('*')
      .eq('periodo_id', periodoId)
      .order('registrado_em', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar avanços:', error);
      return [];
    }

    return (data || []).map(mapAvancoFromDB);
  },

  async createAvanco(dto: CreateAvancoDTO): Promise<MedicoesAvanco> {
    const { data, error } = await supabase
      .from('medicoes_avancos')
      .insert({
        periodo_id: dto.periodoId,
        empresa_id: dto.empresaId,
        origem: dto.origem,
        atividade_id: dto.atividadeId,
        item_id: dto.itemId,
        descricao: dto.descricao,
        qtd_anterior: dto.qtdAnterior ?? 0,
        qtd_avancada: dto.qtdAvancada ?? 0,
        qtd_acumulada: dto.qtdAcumulada ?? (dto.qtdAnterior ?? 0) + (dto.qtdAvancada ?? 0),
        percentual_anterior: dto.percentualAnterior ?? 0,
        percentual_avancado: dto.percentualAvancado ?? 0,
        percentual_acumulado: dto.percentualAcumulado ?? (dto.percentualAnterior ?? 0) + (dto.percentualAvancado ?? 0),
        registrado_por: dto.registradoPor,
        observacoes: dto.observacoes,
      })
      .select()
      .single();

    if (error) throw error;
    return mapAvancoFromDB(data);
  },

  async updateAvancoStatus(avancoId: string, status: StatusAvanco): Promise<MedicoesAvanco> {
    const { data, error } = await supabase
      .from('medicoes_avancos')
      .update({ status })
      .eq('id', avancoId)
      .select()
      .single();

    if (error) throw error;
    return mapAvancoFromDB(data);
  },

  async getAprovacoes(avancoId: string): Promise<MedicoesAprovacao[]> {
    const { data, error } = await supabase
      .from('medicoes_aprovacoes')
      .select('*')
      .eq('avanco_id', avancoId)
      .order('data_acao', { ascending: true });

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar aprovações:', error);
      return [];
    }

    return (data || []).map(mapAprovacaoFromDB);
  },

  async createAprovacao(dto: CreateAprovacaoDTO): Promise<MedicoesAprovacao> {
    const { data, error } = await supabase
      .from('medicoes_aprovacoes')
      .insert({
        avanco_id: dto.avancoId,
        empresa_id: dto.empresaId,
        nivel: dto.nivel,
        aprovador_id: dto.aprovadorId,
        aprovador_nome: dto.aprovadorNome,
        acao: dto.acao,
        comentario: dto.comentario,
      })
      .select()
      .single();

    if (error) throw error;

    if (dto.acao === 'aprovado') {
      const statusMap: Record<string, StatusAvanco> = {
        supervisor: 'supervisor_aprovado',
        fiscal: 'fiscal_aprovado',
        proponente: 'aprovado',
      };
      await this.updateAvancoStatus(dto.avancoId, statusMap[dto.nivel]);
    } else if (dto.acao === 'rejeitado') {
      await this.updateAvancoStatus(dto.avancoId, 'rejeitado');
    }

    return mapAprovacaoFromDB(data);
  },

  async getRestricoesPeriodo(periodoId: string): Promise<MedicoesRestricao[]> {
    const { data, error } = await supabase
      .from('medicoes_restricoes')
      .select('*')
      .eq('periodo_id', periodoId);

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar restrições:', error);
      return [];
    }

    return (data || []).map(mapRestricaoFromDB);
  },

  async vincularRestricao(
    periodoId: string,
    restricaoId: string,
    empresaId: string,
    dados: { categoria?: string; descricao?: string; status?: string; impactoMedicao?: string }
  ): Promise<MedicoesRestricao> {
    const { data, error } = await supabase
      .from('medicoes_restricoes')
      .insert({
        periodo_id: periodoId,
        restricao_id: restricaoId,
        empresa_id: empresaId,
        categoria: dados.categoria,
        descricao: dados.descricao,
        status: dados.status,
        impacto_medicao: dados.impactoMedicao,
      })
      .select()
      .single();

    if (error) throw error;
    return mapRestricaoFromDB(data);
  },

  async registrarAvancoCronograma(
    periodoId: string,
    empresaId: string,
    atividadeId: string,
    descricao: string,
    percentualAnterior: number,
    percentualAvancado: number,
    registradoPor?: string,
    observacoes?: string
  ): Promise<MedicoesAvanco> {
    return this.createAvanco({
      periodoId,
      empresaId,
      origem: 'cronograma',
      atividadeId,
      descricao,
      percentualAnterior,
      percentualAvancado,
      percentualAcumulado: percentualAnterior + percentualAvancado,
      registradoPor,
      observacoes,
    });
  },

  async registrarAvancoMapaControle(
    periodoId: string,
    empresaId: string,
    itemId: string,
    descricao: string,
    qtdAnterior: number,
    qtdAvancada: number,
    registradoPor?: string,
    observacoes?: string
  ): Promise<MedicoesAvanco> {
    const qtdAcumulada = qtdAnterior + qtdAvancada;
    return this.createAvanco({
      periodoId,
      empresaId,
      origem: 'mapa_controle',
      itemId,
      descricao,
      qtdAnterior,
      qtdAvancada,
      qtdAcumulada,
      registradoPor,
      observacoes,
    });
  },

  async getPeriodoAtivo(projetoId: string): Promise<MedicoesPeriodo | null> {
    const hoje = new Date();
    const periodos = await this.getPeriodos(projetoId);
    
    return periodos.find(p => {
      const inicio = new Date(p.dataInicio);
      const fim = new Date(p.dataFim);
      return hoje >= inicio && hoje <= fim;
    }) || null;
  },

  async sincronizarRestricoesMateriais(periodoId: string, empresaId: string): Promise<number> {
    const { data: restricoes, error } = await supabase
      .from('restricoes_ishikawa')
      .select('id, descricao, status, categoria_6m')
      .eq('empresa_id', empresaId)
      .eq('categoria_6m', 'material');

    if (error) {
      console.error('Erro ao buscar restrições:', error);
      return 0;
    }

    if (!restricoes || restricoes.length === 0) return 0;

    const existentes = await this.getRestricoesPeriodo(periodoId);
    const existentesIds = new Set(existentes.map(r => r.restricaoId));

    let count = 0;
    for (const r of restricoes) {
      if (!existentesIds.has(r.id)) {
        await this.vincularRestricao(periodoId, r.id, empresaId, {
          categoria: r.categoria_6m,
          descricao: r.descricao,
          status: r.status,
        });
        count++;
      }
    }

    return count;
  },
};
