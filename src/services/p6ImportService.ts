import * as XLSX from 'xlsx';
import {
  P6ExcelData,
  P6TaskRow,
  P6PredecessorRow,
  P6ResourceRow,
  P6SheetInfo,
  P6ImportConfig,
  P6ImportResult,
  P6ImportValidationError,
  VisionPlanTaskTarget,
  VisionPlanDependencyTarget,
  P6_PREDECESSOR_TYPES,
  DEFAULT_COLUMN_MAPPINGS,
} from '../types/p6Import.types';
import { supabase } from './supabase';

class P6ImportService {
  private workbook: XLSX.WorkBook | null = null;
  private rawData: P6ExcelData = {};

  async parseExcelFile(file: File): Promise<P6SheetInfo[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          this.workbook = XLSX.read(data, { type: 'array', cellDates: true });
          
          const sheets: P6SheetInfo[] = this.workbook.SheetNames.map(name => {
            const ws = this.workbook!.Sheets[name];
            const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
            const columns = jsonData[0] as string[] || [];
            
            return {
              name,
              rowCount: jsonData.length - 1,
              columnCount: columns.length,
              columns,
              selected: ['TASK', 'TASKPRED'].includes(name),
            };
          });
          
          resolve(sheets);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  getSheetData<T>(sheetName: string): T[] {
    if (!this.workbook) return [];
    
    const ws = this.workbook.Sheets[sheetName];
    if (!ws) return [];
    
    return XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'yyyy-mm-dd' }) as T[];
  }

  getSheetPreview(sheetName: string, limit: number = 10): Record<string, unknown>[] {
    const data = this.getSheetData<Record<string, unknown>>(sheetName);
    return data.slice(0, limit);
  }

  getSheetColumns(sheetName: string): string[] {
    if (!this.workbook) return [];
    
    const ws = this.workbook.Sheets[sheetName];
    if (!ws) return [];
    
    const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
    return (jsonData[0] as string[]) || [];
  }

  loadAllSheets(): P6ExcelData {
    if (!this.workbook) return {};
    
    this.rawData = {
      TASK: this.getSheetData<P6TaskRow>('TASK'),
      TASKPRED: this.getSheetData<P6PredecessorRow>('TASKPRED'),
      RSRC: this.getSheetData<P6ResourceRow>('RSRC'),
      TASKRSRC: this.getSheetData('TASKRSRC'),
      PROJCOST: this.getSheetData('PROJCOST'),
      USERDATA: this.getSheetData('USERDATA'),
    };
    
    return this.rawData;
  }

  private parseDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    
    if (value instanceof Date) return value;
    
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
    }
    
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) return date;
    }
    
    return undefined;
  }

  private parseNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    
    if (typeof value === 'number') return value;
    
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(',', '.'));
      if (!isNaN(num)) return num;
    }
    
    return undefined;
  }

  private parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'y' || 
             value.toLowerCase() === 'yes' || 
             value.toLowerCase() === 'true' ||
             value === '1';
    }
    if (typeof value === 'number') return value === 1;
    return false;
  }

  private convertHoursToDays(hours: number | undefined, hoursPerDay: number = 8): number | undefined {
    if (hours === undefined) return undefined;
    return Math.round((hours / hoursPerDay) * 100) / 100;
  }

  transformTask(
    p6Task: P6TaskRow, 
    columnMappings: Record<string, string>,
    hoursPerDay: number = 8
  ): VisionPlanTaskTarget {
    const getMappedValue = (vpField: string): unknown => {
      const p6Key = Object.keys(columnMappings).find(k => columnMappings[k] === vpField);
      if (p6Key) {
        return p6Task[p6Key];
      }
      const defaultP6Key = Object.keys(DEFAULT_COLUMN_MAPPINGS).find(k => DEFAULT_COLUMN_MAPPINGS[k] === vpField);
      return defaultP6Key ? p6Task[defaultP6Key] : undefined;
    };

    const isMilestone = p6Task.task_type === 'TT_Mile' || 
                        p6Task.task_type === 'TT_FinMile' ||
                        p6Task.task_type === 'TT_StartMile';
    
    const isSummary = p6Task.task_type === 'TT_WBS' || 
                      p6Task.task_type === 'TT_Rsrc' ||
                      p6Task.task_type === 'TT_LOE';

    return {
      codigo: String(getMappedValue('task_code') || ''),
      nome: String(getMappedValue('task_name') || ''),
      wbs_id: getMappedValue('wbs_id') ? String(getMappedValue('wbs_id')) : undefined,
      data_inicio: this.parseDate(getMappedValue('target_start_date') || getMappedValue('start_date') || getMappedValue('early_start_date')),
      data_fim: this.parseDate(getMappedValue('target_end_date') || getMappedValue('end_date') || getMappedValue('early_end_date')),
      data_inicio_real: this.parseDate(getMappedValue('act_start_date')),
      data_fim_real: this.parseDate(getMappedValue('act_end_date')),
      data_inicio_baseline: this.parseDate(getMappedValue('primary_base_start_date') || getMappedValue('base_start_date')),
      data_fim_baseline: this.parseDate(getMappedValue('primary_base_end_date') || getMappedValue('base_end_date')),
      duracao_dias: this.convertHoursToDays(this.parseNumber(getMappedValue('total_drtn_hr_cnt')), hoursPerDay),
      duracao_restante_dias: this.convertHoursToDays(this.parseNumber(getMappedValue('remain_drtn_hr_cnt')), hoursPerDay),
      percentual_conclusao: this.parseNumber(getMappedValue('complete_pct')),
      custo_orcado: this.parseNumber(getMappedValue('target_cost') || getMappedValue('base_cost')),
      custo_real: this.parseNumber(getMappedValue('act_cost')),
      custo_restante: this.parseNumber(getMappedValue('remain_cost')),
      is_marco: isMilestone,
      is_resumo: isSummary,
      is_critico: this.parseBoolean(getMappedValue('critical_flag')),
      prioridade: getMappedValue('priority_type') ? String(getMappedValue('priority_type')) : undefined,
      tipo_duracao: getMappedValue('duration_type') ? String(getMappedValue('duration_type')) : undefined,
    };
  }

  transformPredecessor(p6Pred: P6PredecessorRow, hoursPerDay: number = 8): VisionPlanDependencyTarget {
    const predType = p6Pred.pred_type || 'FS';
    const lagHours = this.parseNumber(p6Pred.lag_hr_cnt) || 0;
    
    return {
      atividade_predecessora_codigo: String(p6Pred.pred_task_id || ''),
      atividade_sucessora_codigo: String(p6Pred.task_id || ''),
      tipo: P6_PREDECESSOR_TYPES[predType] || 'FS',
      lag_dias: this.convertHoursToDays(lagHours, hoursPerDay) || 0,
    };
  }

  validateTasks(tasks: VisionPlanTaskTarget[]): P6ImportValidationError[] {
    const errors: P6ImportValidationError[] = [];
    const codes = new Set<string>();
    
    tasks.forEach((task, index) => {
      if (!task.codigo || task.codigo.trim() === '') {
        errors.push({
          row: index + 2,
          column: 'task_code',
          value: task.codigo,
          message: 'Código da atividade é obrigatório',
          severity: 'error',
        });
      } else if (codes.has(task.codigo)) {
        errors.push({
          row: index + 2,
          column: 'task_code',
          value: task.codigo,
          message: 'Código duplicado',
          severity: 'error',
        });
      } else {
        codes.add(task.codigo);
      }
      
      if (!task.nome || task.nome.trim() === '') {
        errors.push({
          row: index + 2,
          column: 'task_name',
          value: task.nome,
          message: 'Nome da atividade é obrigatório',
          severity: 'error',
        });
      }
      
      if (task.data_inicio && task.data_fim && task.data_inicio > task.data_fim) {
        errors.push({
          row: index + 2,
          column: 'data_inicio/data_fim',
          value: `${task.data_inicio} > ${task.data_fim}`,
          message: 'Data início é posterior à data fim',
          severity: 'warning',
        });
      }
      
      if (task.percentual_conclusao !== undefined) {
        if (task.percentual_conclusao < 0 || task.percentual_conclusao > 100) {
          errors.push({
            row: index + 2,
            column: 'complete_pct',
            value: task.percentual_conclusao,
            message: 'Percentual deve estar entre 0 e 100',
            severity: 'warning',
          });
        }
      }
    });
    
    return errors;
  }

  validateDependencies(
    dependencies: VisionPlanDependencyTarget[], 
    taskCodes: Set<string>
  ): P6ImportValidationError[] {
    const errors: P6ImportValidationError[] = [];
    
    dependencies.forEach((dep, index) => {
      if (!taskCodes.has(dep.atividade_predecessora_codigo)) {
        errors.push({
          row: index + 2,
          column: 'pred_task_id',
          value: dep.atividade_predecessora_codigo,
          message: 'Atividade predecessora não encontrada',
          severity: 'warning',
        });
      }
      
      if (!taskCodes.has(dep.atividade_sucessora_codigo)) {
        errors.push({
          row: index + 2,
          column: 'task_id',
          value: dep.atividade_sucessora_codigo,
          message: 'Atividade sucessora não encontrada',
          severity: 'warning',
        });
      }
      
      if (dep.atividade_predecessora_codigo === dep.atividade_sucessora_codigo) {
        errors.push({
          row: index + 2,
          column: 'pred_task_id/task_id',
          value: dep.atividade_predecessora_codigo,
          message: 'Atividade não pode ser predecessora de si mesma',
          severity: 'error',
        });
      }
    });
    
    return errors;
  }

  async importToDatabase(
    config: P6ImportConfig,
    projetoId: string,
    empresaId: string,
    userId: string
  ): Promise<P6ImportResult> {
    const result: P6ImportResult = {
      success: false,
      tasksImported: 0,
      dependenciesImported: 0,
      resourcesImported: 0,
      errors: [],
      warnings: [],
    };

    try {
      const p6Tasks = this.getSheetData<P6TaskRow>('TASK');
      const p6Predecessors = this.getSheetData<P6PredecessorRow>('TASKPRED');

      const taskMappings = config.taskColumnMappings || DEFAULT_COLUMN_MAPPINGS;
      
      const transformedTasks = p6Tasks
        .filter(t => t.task_code && t.task_name)
        .map(t => this.transformTask(t, taskMappings, config.options.hoursPerDay));
      
      const transformedDeps = p6Predecessors
        .filter(p => p.pred_task_id && p.task_id && p.delete_record_flag !== 'Y')
        .map(p => this.transformPredecessor(p, config.options.hoursPerDay));

      const taskErrors = this.validateTasks(transformedTasks);
      const taskCodes = new Set(transformedTasks.map(t => t.codigo));
      const depErrors = this.validateDependencies(transformedDeps, taskCodes);
      
      const allErrors = [...taskErrors, ...depErrors];
      result.errors = allErrors.filter(e => e.severity === 'error');
      result.warnings = allErrors.filter(e => e.severity === 'warning');
      
      if (result.errors.length > 0) {
        return result;
      }

      const tasksToInsert = transformedTasks.map((task, index) => ({
        projeto_id: projetoId,
        empresa_id: empresaId,
        codigo: task.codigo,
        nome: task.nome,
        wbs_id: task.wbs_id,
        data_inicio_planejada: task.data_inicio?.toISOString().split('T')[0],
        data_fim_planejada: task.data_fim?.toISOString().split('T')[0],
        data_inicio_real: task.data_inicio_real?.toISOString().split('T')[0],
        data_fim_real: task.data_fim_real?.toISOString().split('T')[0],
        data_inicio_baseline: task.data_inicio_baseline?.toISOString().split('T')[0],
        data_fim_baseline: task.data_fim_baseline?.toISOString().split('T')[0],
        duracao_planejada_dias: task.duracao_dias,
        duracao_restante_dias: task.duracao_restante_dias,
        percentual_conclusao: task.percentual_conclusao || 0,
        custo_orcado: task.custo_orcado,
        custo_real: task.custo_real,
        is_marco: task.is_marco || false,
        is_resumo: task.is_resumo || false,
        is_critico: task.is_critico || false,
        ordem: index + 1,
        nivel: 1,
        origem: 'IMPORTACAO_P6',
        created_by: userId,
        updated_by: userId,
      }));

      if (config.options.overwriteExisting) {
        await supabase
          .from('atividades_cronograma')
          .delete()
          .eq('projeto_id', projetoId)
          .eq('origem', 'IMPORTACAO_P6');
      }

      const { data: insertedTasks, error: taskError } = await supabase
        .from('atividades_cronograma')
        .insert(tasksToInsert)
        .select('id, codigo');

      if (taskError) {
        result.errors.push({
          row: 0,
          column: 'database',
          value: null,
          message: `Erro ao inserir atividades: ${taskError.message}`,
          severity: 'error',
        });
        return result;
      }

      result.tasksImported = insertedTasks?.length || 0;

      if (insertedTasks && transformedDeps.length > 0) {
        const taskIdMap = new Map(insertedTasks.map(t => [t.codigo, t.id]));
        
        const depsToInsert = transformedDeps
          .filter(dep => 
            taskIdMap.has(dep.atividade_predecessora_codigo) && 
            taskIdMap.has(dep.atividade_sucessora_codigo)
          )
          .map(dep => ({
            projeto_id: projetoId,
            empresa_id: empresaId,
            atividade_predecessora_id: taskIdMap.get(dep.atividade_predecessora_codigo),
            atividade_sucessora_id: taskIdMap.get(dep.atividade_sucessora_codigo),
            tipo_dependencia: dep.tipo,
            lag_dias: dep.lag_dias,
            created_by: userId,
          }));

        if (depsToInsert.length > 0) {
          const { error: depError } = await supabase
            .from('dependencias_atividades')
            .insert(depsToInsert);

          if (depError) {
            result.warnings.push({
              row: 0,
              column: 'dependencies',
              value: null,
              message: `Erro ao inserir dependências: ${depError.message}`,
              severity: 'warning',
            });
          } else {
            result.dependenciesImported = depsToInsert.length;
          }
        }
      }

      result.success = true;
      return result;

    } catch (error) {
      result.errors.push({
        row: 0,
        column: 'system',
        value: null,
        message: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        severity: 'error',
      });
      return result;
    }
  }

  getDefaultMappings(): Record<string, string> {
    return { ...DEFAULT_COLUMN_MAPPINGS };
  }

  suggestMapping(p6Column: string): string | null {
    return DEFAULT_COLUMN_MAPPINGS[p6Column] || null;
  }

  clear(): void {
    this.workbook = null;
    this.rawData = {};
  }
}

export const p6ImportService = new P6ImportService();
