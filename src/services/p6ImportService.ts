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
  VISIONPLAN_TASK_COLUMNS,
  autoMapP6Column,
  generateAutoMappings,
} from '../types/p6Import.types';
import { supabase } from './supabase';

const VISIONPLAN_DATE_FIELDS = VISIONPLAN_TASK_COLUMNS
  .filter(c => c.dataType === 'date')
  .map(c => c.key);

const VISIONPLAN_NUMBER_FIELDS = VISIONPLAN_TASK_COLUMNS
  .filter(c => c.dataType === 'number')
  .map(c => c.key);

const VISIONPLAN_BOOLEAN_FIELDS = VISIONPLAN_TASK_COLUMNS
  .filter(c => c.dataType === 'boolean')
  .map(c => c.key);

const HOURS_TO_DAYS_FIELDS = [
  'duracao_dias', 'duracao_restante_dias', 'duracao_horas', 'duracao_restante_horas',
  'duracao_baseline', 'duracao_real', 'folga_total', 'folga_livre', 'folga_restante',
  'horas_trabalho', 'horas_trabalho_restante'
];

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private isValidUUID(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private parseWbsPath(wbsPath: string | undefined): { levels: string[], fullPath: string } | null {
    if (!wbsPath || typeof wbsPath !== 'string') return null;
    
    // Remove prefix if present (e.g., "M450_2.4.1" -> "2.4.1")
    let path = wbsPath;
    if (path.includes('_')) {
      const parts = path.split('_');
      path = parts.slice(1).join('_'); // Take everything after first underscore
    }
    
    // Split by dots to get hierarchy levels
    const levels = path.split('.').filter(l => l.trim() !== '');
    if (levels.length === 0) return null;
    
    return { levels, fullPath: wbsPath };
  }

  private buildWbsHierarchy(
    tasks: Array<{ codigo: string; wbs_caminho?: string; nome: string }>
  ): Map<string, { id: string; parentId: string | null; name: string; level: number; edt: string }> {
    const wbsNodes = new Map<string, { id: string; parentId: string | null; name: string; level: number; edt: string }>();
    
    // Collect all unique WBS paths and their levels
    const allPaths = new Set<string>();
    
    tasks.forEach(task => {
      const parsed = this.parseWbsPath(task.wbs_caminho);
      if (!parsed) return;
      
      // Add all intermediate levels
      for (let i = 1; i <= parsed.levels.length; i++) {
        const pathKey = parsed.levels.slice(0, i).join('.');
        allPaths.add(pathKey);
      }
    });
    
    // Sort paths by depth (shorter paths first) to ensure parents are created before children
    const sortedPaths = Array.from(allPaths).sort((a, b) => {
      const aDepth = a.split('.').length;
      const bDepth = b.split('.').length;
      if (aDepth !== bDepth) return aDepth - bDepth;
      return a.localeCompare(b);
    });
    
    // Create WBS nodes with UUIDs
    sortedPaths.forEach(pathKey => {
      const levels = pathKey.split('.');
      const parentPath = levels.slice(0, -1).join('.');
      const parentId = parentPath ? wbsNodes.get(parentPath)?.id || null : null;
      
      // Generate a deterministic UUID-like ID based on path
      const id = `wbs-${this.generatePathHash(pathKey)}`;
      
      wbsNodes.set(pathKey, {
        id,
        parentId,
        name: `WBS ${pathKey}`,
        level: levels.length,
        edt: pathKey,
      });
    });
    
    return wbsNodes;
  }

  private generatePathHash(path: string): string {
    // Create a simple hash from the path for consistent IDs
    let hash = 0;
    for (let i = 0; i < path.length; i++) {
      const char = path.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hexHash}-0000-4000-8000-${hexHash.padEnd(12, '0').substring(0, 12)}`;
  }

  transformTask(
    p6Task: P6TaskRow, 
    columnMappings: Record<string, string>,
    hoursPerDay: number = 8
  ): VisionPlanTaskTarget {
    const getP6ValueForVPField = (vpField: string): unknown => {
      const p6Key = Object.keys(columnMappings).find(k => columnMappings[k] === vpField);
      if (p6Key) {
        return p6Task[p6Key];
      }
      return undefined;
    };

    const isMilestone = p6Task.task_type === 'TT_Mile' || 
                        p6Task.task_type === 'TT_FinMile' ||
                        p6Task.task_type === 'TT_StartMile';
    
    const isSummary = p6Task.task_type === 'TT_WBS' || 
                      p6Task.task_type === 'TT_Rsrc' ||
                      p6Task.task_type === 'TT_LOE';

    const result: VisionPlanTaskTarget = {
      codigo: String(getP6ValueForVPField('codigo') || p6Task.task_code || ''),
      nome: String(getP6ValueForVPField('nome') || p6Task.task_name || ''),
    };

    Object.entries(columnMappings).forEach(([p6Key, vpField]) => {
      if (!vpField || vpField === '' || vpField === 'codigo' || vpField === 'nome') return;
      
      const p6Value = p6Task[p6Key];
      if (p6Value === undefined || p6Value === null || p6Value === '') return;

      if (VISIONPLAN_DATE_FIELDS.includes(vpField)) {
        const parsed = this.parseDate(p6Value);
        if (parsed) (result as Record<string, unknown>)[vpField] = parsed;
      } else if (VISIONPLAN_BOOLEAN_FIELDS.includes(vpField)) {
        (result as Record<string, unknown>)[vpField] = this.parseBoolean(p6Value);
      } else if (VISIONPLAN_NUMBER_FIELDS.includes(vpField)) {
        let parsed = this.parseNumber(p6Value);
        if (parsed !== undefined && HOURS_TO_DAYS_FIELDS.includes(vpField)) {
          parsed = this.convertHoursToDays(parsed, hoursPerDay);
        }
        if (parsed !== undefined) (result as Record<string, unknown>)[vpField] = parsed;
      } else {
        (result as Record<string, unknown>)[vpField] = String(p6Value);
      }
    });

    if (result.is_marco === undefined) result.is_marco = isMilestone;
    if (result.is_resumo === undefined) result.is_resumo = isSummary;
    if (result.is_critico === undefined) result.is_critico = this.parseBoolean(p6Task.critical_flag);

    // Fallback: try to get wbs_caminho directly from p6Task if not mapped
    if (!result.wbs_caminho) {
      // Try common column names for WBS path
      const wbsPath = p6Task.wbs_path || 
                      p6Task['WBS Path'] || 
                      p6Task['wbs path'] ||
                      p6Task['WBS_Path'] ||
                      p6Task['projwbs__wbs_short_name'] ||
                      p6Task['PROJWBS__wbs_short_name'] ||
                      p6Task['wbs_short_name'];
      if (wbsPath) {
        result.wbs_caminho = String(wbsPath);
      }
    }

    return result;
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
    console.log('[P6Import] Iniciando importação:', { projetoId, empresaId, userId });
    
    const result: P6ImportResult = {
      success: false,
      tasksImported: 0,
      dependenciesImported: 0,
      resourcesImported: 0,
      errors: [],
      warnings: [],
    };

    if (!projetoId || projetoId === '') {
      result.errors.push({
        row: 0,
        column: 'projeto_id',
        value: projetoId,
        message: 'Projeto não selecionado. Selecione um projeto antes de importar.',
        severity: 'error',
      });
      return result;
    }

    try {
      const p6Tasks = this.getSheetData<P6TaskRow>('TASK');
      console.log('[P6Import] Tasks P6 encontradas:', p6Tasks.length);
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

      console.log('[P6Import] Tasks transformadas:', transformedTasks.length);
      console.log('[P6Import] Primeira task:', transformedTasks[0]);
      console.log('[P6Import] WBS caminhos encontrados:', transformedTasks.filter(t => t.wbs_caminho).length);
      if (transformedTasks.length > 0 && transformedTasks[0]) {
        console.log('[P6Import] Primeira task wbs_caminho:', transformedTasks[0].wbs_caminho);
      }
      
      // Filter tasks with valid start dates
      const validTasks = transformedTasks.filter((task) => {
        const hasValidStartDate = task.data_inicio instanceof Date && !isNaN(task.data_inicio.getTime());
        if (!hasValidStartDate) {
          console.log('[P6Import] Task sem data de início:', task.codigo, task.data_inicio);
          result.warnings.push({
            row: 0,
            column: 'data_inicio',
            value: task.codigo,
            message: `Atividade ${task.codigo} ignorada: data de início inválida`,
            severity: 'warning',
          });
        }
        return hasValidStartDate;
      });

      if (validTasks.length === 0) {
        result.errors.push({
          row: 0,
          column: 'tasks',
          value: null,
          message: 'Nenhuma atividade válida para importar. Verifique se as datas de início estão mapeadas corretamente.',
          severity: 'error',
        });
        return result;
      }

      // Build WBS hierarchy from wbs_caminho
      const wbsHierarchy = this.buildWbsHierarchy(
        validTasks.map(t => ({ codigo: t.codigo, wbs_caminho: t.wbs_caminho, nome: t.nome }))
      );
      console.log('[P6Import] WBS Hierarchy criada:', wbsHierarchy.size, 'nós');

      if (config.options.overwriteExisting) {
        await supabase
          .from('atividades_cronograma')
          .delete()
          .eq('projeto_id', projetoId)
          .eq('origem', 'IMPORTACAO_P6');
      }

      // Create a map to store inserted WBS node IDs
      const wbsIdMap = new Map<string, string>();
      
      // Insert WBS nodes first (sorted by level to ensure parents exist before children)
      const sortedWbsNodes = Array.from(wbsHierarchy.entries())
        .sort((a, b) => a[1].level - b[1].level);
      
      for (const [pathKey, wbsNode] of sortedWbsNodes) {
        const parentIdFromMap = wbsNode.parentId ? wbsIdMap.get(
          Array.from(wbsHierarchy.entries()).find(([_, v]) => v.id === wbsNode.parentId)?.[0] || ''
        ) : null;
        
        const wbsToInsert = {
          projeto_id: projetoId,
          empresa_id: empresaId,
          codigo: `WBS-${pathKey}`.substring(0, 50),
          nome: `WBS ${pathKey}`.substring(0, 255),
          edt: pathKey.substring(0, 100),
          data_inicio: new Date().toISOString().split('T')[0],
          data_fim: new Date().toISOString().split('T')[0],
          duracao_dias: 1,
          progresso: 0,
          status: 'PLANEJADA',
          tipo: 'WBS',
          parent_id: parentIdFromMap,
        };
        
        const { data: insertedWbs, error: wbsError } = await supabase
          .from('atividades_cronograma')
          .insert(wbsToInsert)
          .select('id, codigo, edt')
          .single();
        
        if (insertedWbs) {
          wbsIdMap.set(pathKey, insertedWbs.id);
          console.log('[P6Import] WBS inserido:', pathKey, insertedWbs.id);
        } else if (wbsError) {
          console.log('[P6Import] Erro ao inserir WBS:', pathKey, wbsError.message);
        }
      }

      console.log('[P6Import] WBS nodes inseridos:', wbsIdMap.size);

      // Now insert tasks with parent_id pointing to their WBS parent
      const tasksToInsert = validTasks.map((task) => {
        const duracaoDias = task.duracao_dias 
          ? Math.max(1, Math.round(Number(task.duracao_dias))) 
          : 1;
        const folgaTotal = task.folga_total !== undefined && task.folga_total !== null
          ? Math.round(Number(task.folga_total))
          : null;
        const progresso = task.percentual_conclusao !== undefined
          ? Math.min(100, Math.max(0, Number(task.percentual_conclusao) || 0))
          : 0;

        const dataInicio = task.data_inicio!.toISOString().split('T')[0];
        const dataFim = task.data_fim instanceof Date && !isNaN(task.data_fim.getTime())
          ? task.data_fim.toISOString().split('T')[0]
          : dataInicio;

        // Determine parent_id from WBS path
        let parentId: string | null = null;
        if (task.wbs_caminho) {
          const parsed = this.parseWbsPath(task.wbs_caminho);
          if (parsed && parsed.levels.length > 0) {
            const fullPath = parsed.levels.join('.');
            parentId = wbsIdMap.get(fullPath) || null;
            console.log('[P6Import] Task', task.codigo, 'WBS path:', fullPath, 'parent_id:', parentId);
          }
        }

        return {
          projeto_id: projetoId,
          empresa_id: empresaId,
          codigo: String(task.codigo || '').substring(0, 50),
          nome: String(task.nome || '').substring(0, 255),
          edt: task.wbs_caminho ? String(task.wbs_caminho).substring(0, 100) : null,
          parent_id: parentId,
          data_inicio: dataInicio,
          data_fim: dataFim,
          duracao_dias: duracaoDias,
          progresso: progresso,
          custo_planejado: task.custo_orcado ? Number(task.custo_orcado) : null,
          custo_real: task.custo_real ? Number(task.custo_real) : null,
          e_critica: task.is_critico || false,
          folga_total: folgaTotal,
          prioridade: task.prioridade ? String(task.prioridade).substring(0, 20) : null,
          status: 'PLANEJADA',
          tipo: task.is_marco ? 'Marco' : (task.is_resumo ? 'WBS' : 'Tarefa'),
        };
      });

      console.log('[P6Import] Tasks para inserir:', tasksToInsert.length);
      if (tasksToInsert.length > 0) {
        console.log('[P6Import] Exemplo de task a inserir:', tasksToInsert[0]);
      }

      const { data: insertedTasks, error: taskError } = await supabase
        .from('atividades_cronograma')
        .insert(tasksToInsert)
        .select('id, codigo');

      console.log('[P6Import] Resultado da inserção:', { insertedTasks: insertedTasks?.length, error: taskError });

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
            atividade_origem_id: taskIdMap.get(dep.atividade_predecessora_codigo),
            atividade_destino_id: taskIdMap.get(dep.atividade_sucessora_codigo),
            tipo: String(dep.tipo || 'FS').substring(0, 20),
            lag_dias: Math.round(Number(dep.lag_dias) || 0),
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
    return autoMapP6Column(p6Column);
  }

  generateAutoMappingsForSheet(sheetName: string = 'TASK'): Record<string, string> {
    const columns = this.getSheetColumns(sheetName);
    return generateAutoMappings(columns);
  }

  clear(): void {
    this.workbook = null;
    this.rawData = {};
  }
}

export const p6ImportService = new P6ImportService();
