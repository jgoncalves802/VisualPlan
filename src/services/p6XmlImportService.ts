import {
  P6XmlProject,
  P6XmlWbs,
  P6XmlActivity,
  P6XmlCalendar,
  P6XmlData,
  P6XmlImportResult,
  P6ImportValidationError,
} from '../types/p6Import.types';
import { supabase } from './supabase';

class P6XmlImportService {
  private xmlDoc: Document | null = null;
  private parsedData: P6XmlData = {
    projects: [],
    wbsNodes: [],
    activities: [],
    calendars: [],
  };

  async parseXmlFile(file: File): Promise<P6XmlData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const xmlString = e.target?.result as string;
          const parser = new DOMParser();
          this.xmlDoc = parser.parseFromString(xmlString, 'text/xml');
          
          const parseError = this.xmlDoc.querySelector('parsererror');
          if (parseError) {
            throw new Error('Erro ao parsear XML: ' + parseError.textContent);
          }
          
          this.parsedData = {
            projects: this.parseProjects(),
            wbsNodes: this.parseWbsNodes(),
            activities: this.parseActivities(),
            calendars: this.parseCalendars(),
          };
          
          resolve(this.parsedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo XML'));
      reader.readAsText(file);
    });
  }

  getParsedData(): P6XmlData {
    return this.parsedData;
  }

  private getElementText(parent: Element, tagName: string): string | undefined {
    const elements = parent.getElementsByTagName(tagName);
    if (elements.length === 0) return undefined;
    
    const element = elements[0];
    if (element.getAttribute('xsi:nil') === 'true') return undefined;
    
    const text = element.textContent?.trim();
    return text || undefined;
  }

  private getElementNumber(parent: Element, tagName: string): number | undefined {
    const text = this.getElementText(parent, tagName);
    if (!text) return undefined;
    const num = parseFloat(text);
    return isNaN(num) ? undefined : num;
  }

  private getElementDate(parent: Element, tagName: string): Date | undefined {
    const text = this.getElementText(parent, tagName);
    if (!text) return undefined;
    const date = new Date(text);
    return isNaN(date.getTime()) ? undefined : date;
  }

  private parseProjects(): P6XmlProject[] {
    if (!this.xmlDoc) return [];
    
    const projects: P6XmlProject[] = [];
    const projectElements = this.xmlDoc.getElementsByTagName('Project');
    
    for (let i = 0; i < projectElements.length; i++) {
      const el = projectElements[i];
      const objectId = this.getElementText(el, 'ObjectId');
      const id = this.getElementText(el, 'Id');
      const name = this.getElementText(el, 'Name');
      
      if (objectId && id && name) {
        projects.push({
          objectId,
          id,
          name,
          guid: this.getElementText(el, 'GUID'),
          dataDate: this.getElementDate(el, 'DataDate'),
          plannedStartDate: this.getElementDate(el, 'PlannedStartDate'),
          status: this.getElementText(el, 'Status'),
          wbsObjectId: this.getElementText(el, 'WBSObjectId'),
        });
      }
    }
    
    return projects;
  }

  private parseWbsNodes(): P6XmlWbs[] {
    if (!this.xmlDoc) return [];
    
    const wbsNodes: P6XmlWbs[] = [];
    const wbsElements = this.xmlDoc.getElementsByTagName('WBS');
    
    for (let i = 0; i < wbsElements.length; i++) {
      const el = wbsElements[i];
      const objectId = this.getElementText(el, 'ObjectId');
      const code = this.getElementText(el, 'Code');
      const name = this.getElementText(el, 'Name');
      const projectObjectId = this.getElementText(el, 'ProjectObjectId');
      
      if (objectId && code && name && projectObjectId) {
        wbsNodes.push({
          objectId,
          parentObjectId: this.getElementText(el, 'ParentObjectId'),
          projectObjectId,
          code,
          name,
          guid: this.getElementText(el, 'GUID'),
          sequenceNumber: this.getElementNumber(el, 'SequenceNumber') || 0,
          status: this.getElementText(el, 'Status'),
        });
      }
    }
    
    return wbsNodes;
  }

  private parseActivities(): P6XmlActivity[] {
    if (!this.xmlDoc) return [];
    
    const activities: P6XmlActivity[] = [];
    const activityElements = this.xmlDoc.getElementsByTagName('Activity');
    
    for (let i = 0; i < activityElements.length; i++) {
      const el = activityElements[i];
      const objectId = this.getElementText(el, 'ObjectId');
      const id = this.getElementText(el, 'Id');
      const name = this.getElementText(el, 'Name');
      const wbsObjectId = this.getElementText(el, 'WBSObjectId');
      const projectObjectId = this.getElementText(el, 'ProjectObjectId');
      
      if (objectId && id && name && wbsObjectId && projectObjectId) {
        activities.push({
          objectId,
          id,
          name,
          guid: this.getElementText(el, 'GUID'),
          wbsObjectId,
          projectObjectId,
          status: this.getElementText(el, 'Status'),
          type: this.getElementText(el, 'Type'),
          calendarObjectId: this.getElementText(el, 'CalendarObjectId'),
          startDate: this.getElementDate(el, 'StartDate'),
          finishDate: this.getElementDate(el, 'FinishDate'),
          plannedStartDate: this.getElementDate(el, 'PlannedStartDate'),
          plannedFinishDate: this.getElementDate(el, 'PlannedFinishDate'),
          actualStartDate: this.getElementDate(el, 'ActualStartDate'),
          actualFinishDate: this.getElementDate(el, 'ActualFinishDate'),
          plannedDuration: this.getElementNumber(el, 'PlannedDuration'),
          remainingDuration: this.getElementNumber(el, 'RemainingDuration'),
          actualDuration: this.getElementNumber(el, 'ActualDuration'),
          percentComplete: this.getElementNumber(el, 'PercentComplete'),
          durationPercentComplete: this.getElementNumber(el, 'DurationPercentComplete'),
          physicalPercentComplete: this.getElementNumber(el, 'PhysicalPercentComplete'),
        });
      }
    }
    
    return activities;
  }

  private parseCalendars(): P6XmlCalendar[] {
    if (!this.xmlDoc) return [];
    
    const calendars: P6XmlCalendar[] = [];
    const calendarElements = this.xmlDoc.getElementsByTagName('Calendar');
    
    for (let i = 0; i < calendarElements.length; i++) {
      const el = calendarElements[i];
      const objectId = this.getElementText(el, 'ObjectId');
      const name = this.getElementText(el, 'Name');
      
      if (objectId && name) {
        const holidays: Date[] = [];
        const holidayElements = el.getElementsByTagName('HolidayOrException');
        for (let j = 0; j < holidayElements.length; j++) {
          const dateText = this.getElementText(holidayElements[j], 'Date');
          if (dateText) {
            const date = new Date(dateText);
            if (!isNaN(date.getTime())) {
              holidays.push(date);
            }
          }
        }
        
        calendars.push({
          objectId,
          name,
          hoursPerDay: this.getElementNumber(el, 'HoursPerDay') || 8,
          hoursPerWeek: this.getElementNumber(el, 'HoursPerWeek') || 40,
          isDefault: this.getElementText(el, 'IsDefault') === '1',
          holidays,
        });
      }
    }
    
    return calendars;
  }

  async importToDatabase(
    projetoId: string,
    empresaId: string,
    scheduleNodeId: string,
    hoursPerDay: number = 9
  ): Promise<P6XmlImportResult> {
    const errors: P6ImportValidationError[] = [];
    const warnings: P6ImportValidationError[] = [];
    let wbsImported = 0;
    let activitiesImported = 0;

    const project = this.parsedData.projects[0];
    if (!project) {
      return {
        success: false,
        projectName: '',
        wbsImported: 0,
        activitiesImported: 0,
        errors: [{ row: 0, column: '', value: '', message: 'Nenhum projeto encontrado no XML', severity: 'error' }],
        warnings: [],
      };
    }

    try {
      const wbsObjectIdToNodeId = new Map<string, string>();
      wbsObjectIdToNodeId.set(project.wbsObjectId || '', scheduleNodeId);
      
      console.log('[P6XmlImport] Project WBS ObjectId:', project.wbsObjectId);
      console.log('[P6XmlImport] Schedule Node ID:', scheduleNodeId);
      console.log('[P6XmlImport] Total WBS nodes to import:', this.parsedData.wbsNodes.length);
      console.log('[P6XmlImport] Total Activities to import:', this.parsedData.activities.length);

      const sortedWbs = [...this.parsedData.wbsNodes].sort((a, b) => {
        const aDepth = this.getWbsDepth(a.objectId);
        const bDepth = this.getWbsDepth(b.objectId);
        if (aDepth !== bDepth) return aDepth - bDepth;
        return a.sequenceNumber - b.sequenceNumber;
      });

      for (const wbs of sortedWbs) {
        const parentNodeId = wbs.parentObjectId 
          ? wbsObjectIdToNodeId.get(wbs.parentObjectId) 
          : scheduleNodeId;

        if (!parentNodeId) {
          warnings.push({
            row: 0,
            column: 'WBS',
            value: wbs.code,
            message: `WBS pai não encontrado para: ${wbs.name}`,
            severity: 'warning',
          });
          continue;
        }

        const uniqueCode = `${wbs.code}_${Date.now().toString(36).slice(-4)}`;
        const { data: newNode, error: insertError } = await supabase
          .from('eps_nodes')
          .insert({
            nome: wbs.name,
            codigo: uniqueCode,
            parent_id: parentNodeId,
            empresa_id: empresaId,
            ordem: wbs.sequenceNumber,
            nivel: this.getWbsDepth(wbs.objectId) + 1,
            ativo: true,
            peso_estimado: null,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('[P6XmlImport] WBS insert error:', wbs.name, insertError.message);
          errors.push({
            row: 0,
            column: 'WBS',
            value: wbs.code,
            message: `Erro ao inserir WBS ${wbs.name}: ${insertError.message}`,
            severity: 'error',
          });
        } else if (newNode) {
          wbsObjectIdToNodeId.set(wbs.objectId, newNode.id);
          wbsImported++;
          console.log('[P6XmlImport] WBS inserted:', wbs.name, '->', newNode.id);
        }
      }
      
      console.log('[P6XmlImport] WBS ObjectId Map size:', wbsObjectIdToNodeId.size);

      const sortedActivities = [...this.parsedData.activities].sort((a, b) => {
        if (a.wbsObjectId !== b.wbsObjectId) {
          return a.wbsObjectId.localeCompare(b.wbsObjectId);
        }
        return a.id.localeCompare(b.id);
      });

      for (let i = 0; i < sortedActivities.length; i++) {
        const activity = sortedActivities[i];
        const wbsNodeId = wbsObjectIdToNodeId.get(activity.wbsObjectId);

        if (!wbsNodeId) {
          warnings.push({
            row: i,
            column: 'Activity',
            value: activity.id,
            message: `WBS não encontrada para atividade: ${activity.name}`,
            severity: 'warning',
          });
          continue;
        }

        const durationDays = activity.plannedDuration 
          ? Math.round(activity.plannedDuration / hoursPerDay) 
          : 1;

        const { error: insertError } = await supabase
          .from('atividades_cronograma')
          .insert({
            codigo: activity.id,
            nome: activity.name,
            projeto_id: projetoId,
            empresa_id: empresaId,
            wbs_id: wbsNodeId,
            data_inicio: activity.plannedStartDate || activity.startDate,
            data_fim: activity.plannedFinishDate || activity.finishDate,
            duracao_dias: durationDays,
            progresso: activity.percentComplete || 0,
            status: this.mapStatus(activity.status),
            tipo: durationDays === 0 ? 'Marco' : 'Tarefa',
          });

        if (insertError) {
          console.error('[P6XmlImport] Activity insert error:', activity.name, insertError.message);
          errors.push({
            row: i,
            column: 'Activity',
            value: activity.id,
            message: `Erro ao inserir atividade ${activity.name}: ${insertError.message}`,
            severity: 'error',
          });
        } else {
          activitiesImported++;
          if (activitiesImported <= 5) {
            console.log('[P6XmlImport] Activity inserted:', activity.name);
          }
        }
      }

      return {
        success: errors.length === 0,
        projectName: project.name,
        wbsImported,
        activitiesImported,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        projectName: project.name,
        wbsImported,
        activitiesImported,
        errors: [{
          row: 0,
          column: '',
          value: '',
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          severity: 'error',
        }],
        warnings,
      };
    }
  }

  private getWbsDepth(objectId: string): number {
    let depth = 0;
    let current = this.parsedData.wbsNodes.find(w => w.objectId === objectId);
    
    while (current?.parentObjectId) {
      const parent = this.parsedData.wbsNodes.find(w => w.objectId === current!.parentObjectId);
      if (parent) {
        depth++;
        current = parent;
      } else {
        break;
      }
    }
    
    return depth;
  }

  private mapStatus(p6Status?: string): string {
    switch (p6Status) {
      case 'Not Started':
        return 'NAO_INICIADA';
      case 'In Progress':
        return 'EM_ANDAMENTO';
      case 'Completed':
        return 'CONCLUIDA';
      default:
        return 'NAO_INICIADA';
    }
  }

  getProjectInfo(): { name: string; id: string; activitiesCount: number; wbsCount: number } | null {
    const project = this.parsedData.projects[0];
    if (!project) return null;

    return {
      name: project.name,
      id: project.id,
      activitiesCount: this.parsedData.activities.length,
      wbsCount: this.parsedData.wbsNodes.length,
    };
  }

  getWbsHierarchy(): { code: string; name: string; level: number; childCount: number }[] {
    const result: { code: string; name: string; level: number; childCount: number }[] = [];
    
    const buildHierarchy = (parentId: string | undefined, level: number) => {
      const children = this.parsedData.wbsNodes
        .filter(w => w.parentObjectId === parentId)
        .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      
      for (const wbs of children) {
        const grandchildren = this.parsedData.wbsNodes.filter(w => w.parentObjectId === wbs.objectId);
        result.push({
          code: wbs.code,
          name: wbs.name,
          level,
          childCount: grandchildren.length,
        });
        buildHierarchy(wbs.objectId, level + 1);
      }
    };
    
    const project = this.parsedData.projects[0];
    if (project) {
      buildHierarchy(project.wbsObjectId, 0);
    }
    
    return result;
  }
}

export const p6XmlImportService = new P6XmlImportService();
export default p6XmlImportService;
