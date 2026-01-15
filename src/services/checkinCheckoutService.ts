import { supabase } from './supabase';
import {
  ProgramacaoSemanal,
  ProgramacaoAtividade,
  CheckinCheckout,
  CreateProgramacaoSemanalInput,
  CreateProgramacaoAtividadeInput,
  UpdateCheckInInput,
  AtividadeParaProgramar,
  TakeoffItemVinculado,
  MetricasPPC,
  DiaSemana,
  Causa6M,
  DIAS_SEMANA,
  AceiteProgramacao,
  CreateAceiteInput,
  InterferenciaObra,
  CreateInterferenciaInput,
  StatusProgramacao,
} from '../types/checkinCheckout.types';
import { getWeek, getYear, startOfWeek, endOfWeek, format, addDays, parseISO, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { takeoffService } from './takeoffService';

export const checkinCheckoutService = {
  async getProgramacoesSemana(empresaId: string, projetoId?: string): Promise<ProgramacaoSemanal[]> {
    try {
      let query = supabase
        .from('programacao_semanal')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('ano', { ascending: false })
        .order('semana', { ascending: false });

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as ProgramacaoSemanal[];
    } catch (e) {
      console.error('Erro ao buscar programações semanais:', e);
      return [];
    }
  },

  async getProgramacaoById(id: string): Promise<ProgramacaoSemanal | null> {
    try {
      const { data, error } = await supabase
        .from('programacao_semanal')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ProgramacaoSemanal;
    } catch (e) {
      console.error('Erro ao buscar programação:', e);
      return null;
    }
  },

  async getProgramacaoAtual(empresaId: string, projetoId: string): Promise<ProgramacaoSemanal | null> {
    try {
      const hoje = new Date();
      const semana = getWeek(hoje, { weekStartsOn: 1, locale: ptBR });
      const ano = getYear(hoje);

      const { data, error } = await supabase
        .from('programacao_semanal')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('projeto_id', projetoId)
        .eq('semana', semana)
        .eq('ano', ano)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ProgramacaoSemanal | null;
    } catch (e) {
      console.error('Erro ao buscar programação atual:', e);
      return null;
    }
  },

  async createProgramacao(empresaId: string, input: CreateProgramacaoSemanalInput): Promise<ProgramacaoSemanal | null> {
    try {
      const { data, error } = await supabase
        .from('programacao_semanal')
        .insert({
          empresa_id: empresaId,
          ...input,
          status: 'PLANEJADA',
          ppc_semanal: 0,
          total_atividades: 0,
          atividades_concluidas: 0,
          atividades_com_restricao: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProgramacaoSemanal;
    } catch (e) {
      console.error('Erro ao criar programação:', e);
      return null;
    }
  },

  async updateProgramacao(id: string, updates: Partial<ProgramacaoSemanal>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('programacao_semanal')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Erro ao atualizar programação:', e);
      return false;
    }
  },

  async deleteProgramacao(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('programacao_semanal')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Erro ao excluir programação:', e);
      return false;
    }
  },

  async getAtividadesProgramacao(programacaoId: string): Promise<ProgramacaoAtividade[]> {
    try {
      const { data, error } = await supabase
        .from('programacao_atividades')
        .select('*')
        .eq('programacao_id', programacaoId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        prev_seg: Number(item.prev_seg) || 0,
        prev_ter: Number(item.prev_ter) || 0,
        prev_qua: Number(item.prev_qua) || 0,
        prev_qui: Number(item.prev_qui) || 0,
        prev_sex: Number(item.prev_sex) || 0,
        prev_sab: Number(item.prev_sab) || 0,
        prev_dom: Number(item.prev_dom) || 0,
        real_seg: Number(item.real_seg) || 0,
        real_ter: Number(item.real_ter) || 0,
        real_qua: Number(item.real_qua) || 0,
        real_qui: Number(item.real_qui) || 0,
        real_sex: Number(item.real_sex) || 0,
        real_sab: Number(item.real_sab) || 0,
        real_dom: Number(item.real_dom) || 0,
        ppc_atividade: Number(item.ppc_atividade) || 0,
      })) as ProgramacaoAtividade[];
    } catch (e) {
      console.error('Erro ao buscar atividades da programação:', e);
      return [];
    }
  },

  async addAtividadeProgramacao(empresaId: string, input: CreateProgramacaoAtividadeInput): Promise<ProgramacaoAtividade | null> {
    try {
      const { data, error } = await supabase
        .from('programacao_atividades')
        .insert({
          empresa_id: empresaId,
          ...input,
          status: 'PENDENTE',
          ppc_atividade: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProgramacaoAtividade;
    } catch (e) {
      console.error('Erro ao adicionar atividade:', e);
      return null;
    }
  },

  async addAtividadesBatch(empresaId: string, atividades: CreateProgramacaoAtividadeInput[]): Promise<ProgramacaoAtividade[]> {
    try {
      const toInsert = atividades.map((a, idx) => ({
        empresa_id: empresaId,
        ...a,
        ordem: a.ordem ?? idx,
        status: 'PENDENTE',
        ppc_atividade: 0,
      }));

      const { data, error } = await supabase
        .from('programacao_atividades')
        .insert(toInsert)
        .select();

      if (error) throw error;
      return (data || []) as ProgramacaoAtividade[];
    } catch (e) {
      console.error('Erro ao adicionar atividades em lote:', e);
      return [];
    }
  },

  async updateAtividade(id: string, updates: Partial<ProgramacaoAtividade>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('programacao_atividades')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Erro ao atualizar atividade:', e);
      return false;
    }
  },

  async deleteAtividade(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('programacao_atividades')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Erro ao excluir atividade:', e);
      return false;
    }
  },

  async updateCheckIn(empresaId: string, input: UpdateCheckInInput): Promise<boolean> {
    try {
      const { data: existing, error: findError } = await supabase
        .from('checkin_checkout')
        .select('id')
        .eq('programacao_atividade_id', input.programacao_atividade_id)
        .eq('data', input.data)
        .single();

      if (findError && findError.code !== 'PGRST116') throw findError;

      const checkInData = {
        programacao_atividade_id: input.programacao_atividade_id,
        empresa_id: empresaId,
        data: input.data,
        dia_semana: input.dia_semana,
        realizado: input.realizado,
        concluido: input.concluido,
        causa_nao_cumprimento: input.causa_nao_cumprimento || null,
        causa_descricao: input.causa_descricao || null,
        observacao: input.observacao || null,
        registrado_em: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from('checkin_checkout')
          .update(checkInData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const atividade = await this.getAtividadeById(input.programacao_atividade_id);
        const previsto = atividade ? (atividade as any)[`prev_${input.dia_semana}`] || 0 : 0;

        const { error } = await supabase
          .from('checkin_checkout')
          .insert({
            ...checkInData,
            previsto,
          });
        if (error) throw error;
      }

      const diaKey = `real_${input.dia_semana}` as keyof ProgramacaoAtividade;
      await supabase
        .from('programacao_atividades')
        .update({ [diaKey]: input.realizado })
        .eq('id', input.programacao_atividade_id);

      return true;
    } catch (e) {
      console.error('Erro ao atualizar check-in:', e);
      return false;
    }
  },

  async getAtividadeById(id: string): Promise<ProgramacaoAtividade | null> {
    try {
      const { data, error } = await supabase
        .from('programacao_atividades')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ProgramacaoAtividade;
    } catch (e) {
      console.error('Erro ao buscar atividade:', e);
      return null;
    }
  },

  async getCheckInsForProgramacao(programacaoId: string): Promise<CheckinCheckout[]> {
    try {
      const atividades = await this.getAtividadesProgramacao(programacaoId);
      const atividadeIds = atividades.map(a => a.id);

      if (atividadeIds.length === 0) return [];

      const { data, error } = await supabase
        .from('checkin_checkout')
        .select('*')
        .in('programacao_atividade_id', atividadeIds)
        .order('data', { ascending: true });

      if (error) throw error;
      return (data || []) as CheckinCheckout[];
    } catch (e) {
      console.error('Erro ao buscar check-ins:', e);
      return [];
    }
  },

  async calcularMetricasPPC(programacaoId: string): Promise<MetricasPPC> {
    try {
      const atividades = await this.getAtividadesProgramacao(programacaoId);

      const ppc_por_dia: Record<DiaSemana, number> = {
        seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0, dom: 0,
      };

      const causas_6m: Record<Causa6M, number> = {
        MATERIAL: 0, MAO_DE_OBRA: 0, MAQUINA: 0, METODO: 0, MEIO_AMBIENTE: 0, MEDIDA: 0, SEGURANCA: 0,
      };

      let totalAtividades = 0;
      let atividadesConcluidas = 0;
      let atividadesNaoConcluidas = 0;
      let atividadesComRestricao = 0;

      for (const dia of DIAS_SEMANA) {
        const prevKey = `prev_${dia}` as keyof ProgramacaoAtividade;
        const realKey = `real_${dia}` as keyof ProgramacaoAtividade;

        const atividadesNoDia = atividades.filter(a => (a[prevKey] as number) > 0);
        const concluidasNoDia = atividadesNoDia.filter(a => {
          const prev = a[prevKey] as number;
          const real = a[realKey] as number;
          return real >= prev;
        });

        if (atividadesNoDia.length > 0) {
          ppc_por_dia[dia] = (concluidasNoDia.length / atividadesNoDia.length) * 100;
        }
      }

      for (const atividade of atividades) {
        totalAtividades++;
        if (atividade.tem_restricao) atividadesComRestricao++;

        const totalPrev = (atividade.prev_seg || 0) + (atividade.prev_ter || 0) + (atividade.prev_qua || 0) +
          (atividade.prev_qui || 0) + (atividade.prev_sex || 0) + (atividade.prev_sab || 0) + (atividade.prev_dom || 0);
        const totalReal = (atividade.real_seg || 0) + (atividade.real_ter || 0) + (atividade.real_qua || 0) +
          (atividade.real_qui || 0) + (atividade.real_sex || 0) + (atividade.real_sab || 0) + (atividade.real_dom || 0);

        if (totalPrev > 0 && totalReal >= totalPrev) {
          atividadesConcluidas++;
        } else if (totalPrev > 0) {
          atividadesNaoConcluidas++;
        }
      }

      const checkIns = await this.getCheckInsForProgramacao(programacaoId);
      for (const checkIn of checkIns) {
        if (!checkIn.concluido && checkIn.causa_nao_cumprimento) {
          causas_6m[checkIn.causa_nao_cumprimento] = (causas_6m[checkIn.causa_nao_cumprimento] || 0) + 1;
        }
      }

      const ppc_semanal = totalAtividades > 0 ? (atividadesConcluidas / totalAtividades) * 100 : 0;

      await this.updateProgramacao(programacaoId, {
        ppc_semanal: Math.round(ppc_semanal * 100) / 100,
        total_atividades: totalAtividades,
        atividades_concluidas: atividadesConcluidas,
        atividades_com_restricao: atividadesComRestricao,
      });

      return {
        ppc_semanal: Math.round(ppc_semanal * 100) / 100,
        ppc_por_dia: Object.fromEntries(
          Object.entries(ppc_por_dia).map(([k, v]) => [k, Math.round(v * 100) / 100])
        ) as Record<DiaSemana, number>,
        total_atividades: totalAtividades,
        atividades_concluidas: atividadesConcluidas,
        atividades_nao_concluidas: atividadesNaoConcluidas,
        atividades_com_restricao: atividadesComRestricao,
        causas_6m,
      };
    } catch (e) {
      console.error('Erro ao calcular métricas PPC:', e);
      return {
        ppc_semanal: 0,
        ppc_por_dia: { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0, dom: 0 },
        total_atividades: 0,
        atividades_concluidas: 0,
        atividades_nao_concluidas: 0,
        atividades_com_restricao: 0,
        causas_6m: { MATERIAL: 0, MAO_DE_OBRA: 0, MAQUINA: 0, METODO: 0, MEIO_AMBIENTE: 0, MEDIDA: 0, SEGURANCA: 0 },
      };
    }
  },

  async getAtividadesDisponiveis(empresaId: string, projetoId: string): Promise<AtividadeParaProgramar[]> {
    try {
      const { data: atividades, error } = await supabase
        .from('atividades_cronograma')
        .select('id, codigo, nome, responsavel_nome, data_inicio, data_fim, duracao_dias')
        .eq('empresa_id', empresaId)
        .eq('projeto_id', projetoId)
        .in('status', ['nao_iniciada', 'em_andamento', 'pendente'])
        .order('data_inicio', { ascending: true });

      if (error) throw error;

      const { data: restricoes } = await supabase
        .from('restricoes_ishikawa')
        .select('id, descricao, atividade_id')
        .eq('empresa_id', empresaId)
        .neq('status', 'CONCLUIDA_NO_PRAZO');

      const restricoesMap = new Map<string, { id: string; descricao: string }>();
      (restricoes || []).forEach(r => {
        if (r.atividade_id) {
          restricoesMap.set(r.atividade_id, { id: r.id, descricao: r.descricao });
        }
      });

      const result: AtividadeParaProgramar[] = [];

      for (const a of (atividades || [])) {
        let duracaoDias = a.duracao_dias || 1;
        if (!duracaoDias && a.data_inicio && a.data_fim) {
          duracaoDias = Math.max(1, differenceInCalendarDays(parseISO(a.data_fim), parseISO(a.data_inicio)) + 1);
        }

        const vinculos = await takeoffService.getVinculosByAtividade(a.id);
        const itensTakeoff: TakeoffItemVinculado[] = vinculos.map(v => {
          const item = (v as any).takeoff_itens;
          const qtdTotal = item?.qtd_prevista || item?.qtd_takeoff || 0;
          const qtdDiaria = duracaoDias > 0 ? qtdTotal / duracaoDias : qtdTotal;

          return {
            id: v.id,
            itemId: v.itemId,
            descricao: item?.descricao || 'Item sem descrição',
            unidade: item?.unidade || 'un',
            qtdTotal,
            qtdDiaria: Math.round(qtdDiaria * 100) / 100,
            peso: v.peso,
          };
        });

        result.push({
          id: a.id,
          codigo: a.codigo,
          nome: a.nome,
          responsavel_nome: a.responsavel_nome,
          data_inicio: a.data_inicio,
          data_fim: a.data_fim,
          duracao_dias: duracaoDias,
          tem_restricao: restricoesMap.has(a.id),
          restricao_id: restricoesMap.get(a.id)?.id,
          restricao_descricao: restricoesMap.get(a.id)?.descricao,
          itens_takeoff: itensTakeoff.length > 0 ? itensTakeoff : undefined,
        });
      }

      return result;
    } catch (e) {
      console.error('Erro ao buscar atividades disponíveis:', e);
      return [];
    }
  },

  getWeekInfo(date: Date = new Date()) {
    const semana = getWeek(date, { weekStartsOn: 1, locale: ptBR });
    const ano = getYear(date);
    const inicio = startOfWeek(date, { weekStartsOn: 1 });
    const fim = endOfWeek(date, { weekStartsOn: 1 });

    return {
      semana,
      ano,
      data_inicio: format(inicio, 'yyyy-MM-dd'),
      data_fim: format(fim, 'yyyy-MM-dd'),
      label: `Semana ${semana}/${ano}`,
    };
  },

  getDatesForWeek(dataInicio: string): Record<DiaSemana, string> {
    const inicio = parseISO(dataInicio);
    return {
      seg: format(inicio, 'yyyy-MM-dd'),
      ter: format(addDays(inicio, 1), 'yyyy-MM-dd'),
      qua: format(addDays(inicio, 2), 'yyyy-MM-dd'),
      qui: format(addDays(inicio, 3), 'yyyy-MM-dd'),
      sex: format(addDays(inicio, 4), 'yyyy-MM-dd'),
      sab: format(addDays(inicio, 5), 'yyyy-MM-dd'),
      dom: format(addDays(inicio, 6), 'yyyy-MM-dd'),
    };
  },

  /**
   * Busca atividades do cronograma que caem na semana especificada.
   * Uma atividade cai na semana se seu período (data_inicio a data_fim) 
   * intercepta o período da semana.
   */
  async getAtividadesDaSemana(
    empresaId: string, 
    projetoId: string, 
    dataInicioSemana: string, 
    dataFimSemana: string
  ): Promise<AtividadeParaProgramar[]> {
    try {
      // Buscar atividades do cronograma que interceptam a semana
      // (atividade.data_inicio <= semana.fim) AND (atividade.data_fim >= semana.inicio)
      const { data: atividades, error } = await supabase
        .from('atividades_cronograma')
        .select('id, codigo, nome, responsavel_nome, data_inicio, data_fim, duracao_dias, progresso, status')
        .eq('empresa_id', empresaId)
        .eq('projeto_id', projetoId)
        .neq('tipo', 'marco')
        .neq('tipo', 'resumo')
        .lte('data_inicio', dataFimSemana)
        .gte('data_fim', dataInicioSemana)
        .order('data_inicio', { ascending: true });

      if (error) throw error;

      // Buscar restrições pendentes
      const { data: restricoes } = await supabase
        .from('restricoes_ishikawa')
        .select('id, descricao, atividade_id')
        .eq('empresa_id', empresaId)
        .neq('status', 'CONCLUIDA_NO_PRAZO');

      const restricoesMap = new Map<string, { id: string; descricao: string }>();
      (restricoes || []).forEach(r => {
        if (r.atividade_id) {
          restricoesMap.set(r.atividade_id, { id: r.id, descricao: r.descricao });
        }
      });

      const result: AtividadeParaProgramar[] = [];

      for (const a of (atividades || [])) {
        // Pular atividades já 100% concluídas
        if (a.progresso >= 100 || a.status === 'concluida') continue;

        let duracaoDias = a.duracao_dias || 1;
        if (!duracaoDias && a.data_inicio && a.data_fim) {
          duracaoDias = Math.max(1, differenceInCalendarDays(parseISO(a.data_fim), parseISO(a.data_inicio)) + 1);
        }

        // Buscar itens de take-off vinculados
        const vinculos = await takeoffService.getVinculosByAtividade(a.id);
        const itensTakeoff: TakeoffItemVinculado[] = vinculos.map(v => {
          const item = (v as any).takeoff_itens;
          const qtdTotal = item?.qtd_prevista || item?.qtd_takeoff || 0;
          const qtdDiaria = duracaoDias > 0 ? qtdTotal / duracaoDias : qtdTotal;

          return {
            id: v.id,
            itemId: v.itemId,
            descricao: item?.descricao || 'Item sem descrição',
            unidade: item?.unidade || 'un',
            qtdTotal,
            qtdDiaria: Math.round(qtdDiaria * 100) / 100,
            peso: v.peso,
          };
        });

        result.push({
          id: a.id,
          codigo: a.codigo,
          nome: a.nome,
          responsavel_nome: a.responsavel_nome,
          data_inicio: a.data_inicio,
          data_fim: a.data_fim,
          duracao_dias: duracaoDias,
          tem_restricao: restricoesMap.has(a.id),
          restricao_id: restricoesMap.get(a.id)?.id,
          restricao_descricao: restricoesMap.get(a.id)?.descricao,
          itens_takeoff: itensTakeoff.length > 0 ? itensTakeoff : undefined,
        });
      }

      return result;
    } catch (e) {
      console.error('Erro ao buscar atividades da semana:', e);
      return [];
    }
  },

  /**
   * Obtém ou cria automaticamente a programação para uma semana.
   * Se a programação não existe, cria e popula com atividades do cronograma.
   */
  async getOrCreateProgramacao(
    empresaId: string,
    projetoId: string,
    semana: number,
    ano: number,
    dataInicioSemana: string,
    dataFimSemana: string
  ): Promise<{ programacao: ProgramacaoSemanal | null; atividades: ProgramacaoAtividade[]; isNew: boolean }> {
    try {
      // Verificar se já existe programação para esta semana
      const { data: existente, error: fetchError } = await supabase
        .from('programacao_semanal')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('projeto_id', projetoId)
        .eq('semana', semana)
        .eq('ano', ano)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existente) {
        // Programação já existe, carregar atividades
        const ativs = await this.getAtividadesProgramacao(existente.id);
        return { programacao: existente as ProgramacaoSemanal, atividades: ativs, isNew: false };
      }

      // Criar nova programação
      const novaProg = await this.createProgramacao(empresaId, {
        projeto_id: projetoId,
        semana,
        ano,
        data_inicio: dataInicioSemana,
        data_fim: dataFimSemana,
      });

      if (!novaProg) {
        return { programacao: null, atividades: [], isNew: false };
      }

      // Buscar atividades do cronograma para esta semana
      const atividadesDaSemana = await this.getAtividadesDaSemana(
        empresaId, 
        projetoId, 
        dataInicioSemana, 
        dataFimSemana
      );

      // Adicionar atividades à programação
      const inputs: CreateProgramacaoAtividadeInput[] = atividadesDaSemana.map((a, idx) => ({
        programacao_id: novaProg.id,
        atividade_cronograma_id: a.id,
        codigo: a.codigo,
        nome: a.nome,
        responsavel_nome: a.responsavel_nome,
        tem_restricao: a.tem_restricao,
        restricao_id: a.restricao_id,
        restricao_descricao: a.restricao_descricao,
        ordem: idx,
      }));

      let novasAtividades: ProgramacaoAtividade[] = [];
      if (inputs.length > 0) {
        novasAtividades = await this.addAtividadesBatch(empresaId, inputs);
      }

      return { programacao: novaProg, atividades: novasAtividades, isNew: true };
    } catch (e) {
      console.error('Erro ao obter/criar programação:', e);
      return { programacao: null, atividades: [], isNew: false };
    }
  },

  // ============================================================================
  // Aceites da Programação
  // ============================================================================

  async getAceitesByProgramacao(programacaoId: string): Promise<AceiteProgramacao[]> {
    try {
      const { data, error } = await supabase
        .from('aceites_programacao')
        .select('*')
        .eq('programacao_id', programacaoId)
        .order('data_aceite', { ascending: false });

      if (error) throw error;
      return (data || []) as AceiteProgramacao[];
    } catch (e) {
      console.error('Erro ao buscar aceites:', e);
      return [];
    }
  },

  async registrarAceite(
    empresaId: string, 
    usuarioId: string, 
    usuarioNome: string,
    input: CreateAceiteInput
  ): Promise<AceiteProgramacao | null> {
    try {
      // Buscar setor do usuário
      const { data: perfil } = await supabase
        .from('usuarios')
        .select('setor')
        .eq('id', usuarioId)
        .single();

      const { data, error } = await supabase
        .from('aceites_programacao')
        .insert({
          empresa_id: empresaId,
          programacao_id: input.programacao_id,
          usuario_id: usuarioId,
          usuario_nome: usuarioNome,
          setor: perfil?.setor || 'Não informado',
          tipo_aceite: input.tipo_aceite,
          observacoes: input.observacoes,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar status da programação conforme o tipo de aceite
      let novoStatus: StatusProgramacao = 'PLANEJADA';
      switch (input.tipo_aceite) {
        case 'ENVIO_PRODUCAO':
          novoStatus = 'AGUARDANDO_ACEITE';
          break;
        case 'ACEITE_PRODUCAO':
          novoStatus = 'ACEITA';
          break;
        case 'REJEICAO_PRODUCAO':
        case 'RETORNO_PLANEJAMENTO':
          novoStatus = 'PLANEJADA';
          break;
      }

      await supabase
        .from('programacao_semanal')
        .update({ status: novoStatus })
        .eq('id', input.programacao_id);

      return data as AceiteProgramacao;
    } catch (e) {
      console.error('Erro ao registrar aceite:', e);
      return null;
    }
  },

  async enviarParaProducao(
    empresaId: string,
    usuarioId: string,
    usuarioNome: string,
    programacaoId: string,
    observacoes?: string
  ): Promise<boolean> {
    const aceite = await this.registrarAceite(empresaId, usuarioId, usuarioNome, {
      programacao_id: programacaoId,
      tipo_aceite: 'ENVIO_PRODUCAO',
      observacoes,
    });
    return aceite !== null;
  },

  async aceitarProgramacao(
    empresaId: string,
    usuarioId: string,
    usuarioNome: string,
    programacaoId: string,
    observacoes?: string
  ): Promise<boolean> {
    const aceite = await this.registrarAceite(empresaId, usuarioId, usuarioNome, {
      programacao_id: programacaoId,
      tipo_aceite: 'ACEITE_PRODUCAO',
      observacoes,
    });
    return aceite !== null;
  },

  async rejeitarProgramacao(
    empresaId: string,
    usuarioId: string,
    usuarioNome: string,
    programacaoId: string,
    observacoes: string
  ): Promise<boolean> {
    const aceite = await this.registrarAceite(empresaId, usuarioId, usuarioNome, {
      programacao_id: programacaoId,
      tipo_aceite: 'REJEICAO_PRODUCAO',
      observacoes,
    });
    return aceite !== null;
  },

  async retornarParaPlanejamento(
    empresaId: string,
    usuarioId: string,
    usuarioNome: string,
    programacaoId: string,
    observacoes: string
  ): Promise<boolean> {
    const aceite = await this.registrarAceite(empresaId, usuarioId, usuarioNome, {
      programacao_id: programacaoId,
      tipo_aceite: 'RETORNO_PLANEJAMENTO',
      observacoes,
    });
    return aceite !== null;
  },

  async iniciarExecucao(programacaoId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('programacao_semanal')
        .update({ status: 'EM_EXECUCAO' })
        .eq('id', programacaoId);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Erro ao iniciar execução:', e);
      return false;
    }
  },

  podeEditar(programacao: ProgramacaoSemanal): boolean {
    return programacao.status === 'PLANEJADA';
  },

  // ============================================================================
  // Interferências da Obra
  // ============================================================================

  async getInterferencias(
    empresaId: string, 
    projetoId?: string, 
    programacaoId?: string
  ): Promise<InterferenciaObra[]> {
    try {
      let query = supabase
        .from('interferencias_obra')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_ocorrencia', { ascending: false });

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }
      if (programacaoId) {
        query = query.eq('programacao_id', programacaoId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as InterferenciaObra[];
    } catch (e) {
      console.error('Erro ao buscar interferências:', e);
      return [];
    }
  },

  async getInterferenciaById(id: string): Promise<InterferenciaObra | null> {
    try {
      const { data, error } = await supabase
        .from('interferencias_obra')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as InterferenciaObra;
    } catch (e) {
      console.error('Erro ao buscar interferência:', e);
      return null;
    }
  },

  async registrarInterferencia(
    empresaId: string,
    usuarioId: string,
    usuarioNome: string,
    input: CreateInterferenciaInput
  ): Promise<InterferenciaObra | null> {
    try {
      const { data, error } = await supabase
        .from('interferencias_obra')
        .insert({
          empresa_id: empresaId,
          projeto_id: input.projeto_id,
          programacao_id: input.programacao_id,
          atividade_id: input.atividade_id,
          atividade_codigo: input.atividade_codigo,
          atividade_nome: input.atividade_nome,
          usuario_id: usuarioId,
          usuario_nome: usuarioNome,
          setor: input.setor,
          empresa_nome: input.empresa_nome,
          tipo_empresa: input.tipo_empresa,
          categoria: input.categoria,
          descricao: input.descricao,
          impacto: input.impacto,
          acao_tomada: input.acao_tomada,
          data_ocorrencia: input.data_ocorrencia,
          status: 'ABERTA',
          convertida_restricao: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as InterferenciaObra;
    } catch (e) {
      console.error('Erro ao registrar interferência:', e);
      return null;
    }
  },

  async atualizarInterferencia(
    id: string, 
    updates: Partial<InterferenciaObra>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('interferencias_obra')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Erro ao atualizar interferência:', e);
      return false;
    }
  },

  async converterEmRestricao(
    interferenciaId: string,
    restricaoId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('interferencias_obra')
        .update({
          convertida_restricao: true,
          restricao_id: restricaoId,
          status: 'CONVERTIDA_RESTRICAO',
        })
        .eq('id', interferenciaId);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Erro ao converter interferência em restrição:', e);
      return false;
    }
  },

  async resolverInterferencia(id: string, acaoTomada: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('interferencias_obra')
        .update({
          status: 'RESOLVIDA',
          acao_tomada: acaoTomada,
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Erro ao resolver interferência:', e);
      return false;
    }
  },
};
