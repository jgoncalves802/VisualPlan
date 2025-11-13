/**
 * Funcionalidades Avançadas do DHTMLX Gantt
 * Baseado na documentação oficial: https://docs.dhtmlx.com/gantt/
 */

import gantt from 'dhtmlx-gantt';

/**
 * Configuração de colunas avançadas com suporte a custos e valores
 */
export interface AdvancedColumn {
  name: string;
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  tree?: boolean;
  editor?: any;
  template?: (task: any) => string;
  editable?: boolean;
  type?: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  options?: any[];
}

/**
 * Configurar layout com colunas à direita (rightside columns)
 * Baseado em: https://docs.dhtmlx.com/gantt/samples/?sample=%2710_layout/01_rightside_columns.html
 * 
 * Nota: O DHTMLX Gantt não suporta nativamente colunas à direita da timeline.
 * Esta função adiciona as colunas de custo/valores na grid principal,
 * mas com uma seção visualmente separada usando CSS.
 */
export function configureRightsideColumns(
  rightsideColumns: AdvancedColumn[] = [],
  gridWidth: number = 400
) {
  // Configurar layout básico do DHTMLX Gantt conforme documentação oficial
  // Estrutura: Grid (com scrollbar horizontal) | Resizer | Timeline (com scrollbar horizontal) | Scrollbar vertical
  // Documentação: https://docs.dhtmlx.com/gantt/samples/?sample='01_initialization/01_basic_init.html
  gantt.config.layout = {
    css: 'gantt_container',
    cols: [
      {
        width: gridWidth,
        min_width: 260,
        rows: [
          { view: 'grid', scrollX: 'gridScroll', scrollY: 'scrollVer' },
          { view: 'scrollbar', id: 'gridScroll', group: 'horizontal' },
        ],
      },
      { view: 'resizer', width: 6 },
      {
        rows: [
          { view: 'timeline', scrollX: 'scrollHor', scrollY: 'scrollVer' },
          { view: 'scrollbar', id: 'scrollHor', group: 'horizontal' },
        ],
      },
      { view: 'scrollbar', id: 'scrollVer' },
    ],
  };
  
  // Retornar as colunas para serem adicionadas à grid principal
  return rightsideColumns;
}

/**
 * Configurar Inline Editing
 * Baseado em: https://docs.dhtmlx.com/gantt/samples/?sample=%2705_grid/05_inline_editing.html
 */
export function configureInlineEditing(enabled: boolean = true) {
  if (!enabled) {
    gantt.config.editable = false;
    return;
  }

  gantt.config.editable = true;
  gantt.config.inline_editors = {
    text: {
      type: 'text',
      map_to: 'text',
    },
    number: {
      type: 'number',
      map_to: 'number',
    },
    date: {
      type: 'date',
      map_to: 'date',
    },
  };

  // Configurar editores inline para colunas customizadas
  gantt.config.editor_types = {
    text: {
      editor: {
        setValue: function (value: any) {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = value || '';
          input.className = 'vp-inline-editor';
          return input;
        },
        getValue: function (node: HTMLInputElement) {
          return node.value;
        },
        focus: function (node: HTMLInputElement) {
          node.focus();
          node.select();
        },
      },
    },
    number: {
      editor: {
        setValue: function (value: any) {
          const input = document.createElement('input');
          input.type = 'number';
          input.value = value || 0;
          input.className = 'vp-inline-editor';
          input.step = '0.01';
          return input;
        },
        getValue: function (node: HTMLInputElement) {
          return parseFloat(node.value) || 0;
        },
        focus: function (node: HTMLInputElement) {
          node.focus();
          node.select();
        },
      },
    },
    currency: {
      editor: {
        setValue: function (value: any) {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = formatCurrency(value);
          input.className = 'vp-inline-editor vp-currency-editor';
          input.addEventListener('blur', function () {
            const num = parseFloat(this.value.replace(/[^\d,.-]/g, '').replace(',', '.'));
            this.value = formatCurrency(num);
          });
          return input;
        },
        getValue: function (node: HTMLInputElement) {
          const num = parseFloat(node.value.replace(/[^\d,.-]/g, '').replace(',', '.'));
          return isNaN(num) ? 0 : num;
        },
        focus: function (node: HTMLInputElement) {
          node.focus();
          node.select();
        },
      },
    },
    select: {
      editor: {
        setValue: function (value: any, options: any[] = []) {
          const select = document.createElement('select');
          select.className = 'vp-inline-editor vp-select-editor';
          options.forEach((opt) => {
            const option = document.createElement('option');
            option.value = opt.value || opt;
            option.text = opt.label || opt;
            if (option.value === value) option.selected = true;
            select.appendChild(option);
          });
          return select;
        },
        getValue: function (node: HTMLSelectElement) {
          return node.value;
        },
        focus: function (node: HTMLSelectElement) {
          node.focus();
        },
      },
    },
  };
}

/**
 * Formatar valor monetário
 */
function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) : value;
  if (isNaN(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

/**
 * Criar colunas padrão de custos e valores
 */
export function createCostValueColumns(): AdvancedColumn[] {
  return [
    {
      name: 'custo_planejado',
      label: 'Custo Planejado',
      width: 130,
      align: 'right',
      tree: false,
      editable: true,
      type: 'currency',
      template: (task: any) => {
        const value = task.custo_planejado || 0;
        return formatCurrency(value);
      },
    },
    {
      name: 'custo_real',
      label: 'Custo Real',
      width: 130,
      align: 'right',
      tree: false,
      editable: true,
      type: 'currency',
      template: (task: any) => {
        const value = task.custo_real || 0;
        return formatCurrency(value);
      },
    },
    {
      name: 'valor_planejado',
      label: 'Valor Planejado',
      width: 130,
      align: 'right',
      tree: false,
      editable: true,
      type: 'currency',
      template: (task: any) => {
        const value = task.valor_planejado || 0;
        return formatCurrency(value);
      },
    },
    {
      name: 'valor_real',
      label: 'Valor Real',
      width: 130,
      align: 'right',
      tree: false,
      editable: true,
      type: 'currency',
      template: (task: any) => {
        const value = task.valor_real || 0;
        return formatCurrency(value);
      },
    },
    {
      name: 'quantidade_planejada',
      label: 'Qtd. Planejada',
      width: 120,
      align: 'right',
      tree: false,
      editable: true,
      type: 'number',
      template: (task: any) => {
        const qtd = task.quantidade_planejada || 0;
        const unidade = task.unidade_medida || '';
        return `${qtd.toLocaleString('pt-BR')} ${unidade}`.trim();
      },
    },
    {
      name: 'quantidade_real',
      label: 'Qtd. Real',
      width: 120,
      align: 'right',
      tree: false,
      editable: true,
      type: 'number',
      template: (task: any) => {
        const qtd = task.quantidade_real || 0;
        const unidade = task.unidade_medida || '';
        return `${qtd.toLocaleString('pt-BR')} ${unidade}`.trim();
      },
    },
    {
      name: 'custo_unitario',
      label: 'Custo Unitário',
      width: 130,
      align: 'right',
      tree: false,
      editable: true,
      type: 'currency',
      template: (task: any) => {
        const value = task.custo_unitario || 0;
        return formatCurrency(value);
      },
    },
  ];
}

/**
 * Configurar eventos de atualização de tarefa
 */
export function configureTaskUpdateEvents(
  onTaskUpdate?: (task: any, column: string, value: any) => void
) {
  if (!onTaskUpdate) return;

  gantt.attachEvent('onAfterTaskUpdate', (id: string, task: any) => {
    // Detectar qual coluna foi editada
    const updatedFields = Object.keys(task);
    updatedFields.forEach((field) => {
      if (field !== 'id' && field !== '$index') {
        onTaskUpdate(task, field, task[field]);
      }
    });
  });

  // Evento para inline editing
  gantt.attachEvent('onAfterCellUpdate', (id: string, column: string, value: any) => {
    const task = gantt.getTask(id);
    if (task) {
      onTaskUpdate(task, column, value);
    }
  });
}

/**
 * Configurar drag melhorado com validações
 * Baseado em: https://docs.dhtmlx.com/gantt/samples/?sample=%2708_api/01_dnd_events.html
 */
export function configureAdvancedDrag(
  options: {
    validateDates?: (task: any, start: Date, end: Date) => boolean;
    onDragStart?: (task: any) => void;
    onDragEnd?: (task: any, start: Date, end: Date) => void;
    showDatesOnDrag?: boolean;
  } = {}
) {
  const {
    validateDates,
    onDragStart,
    onDragEnd,
    showDatesOnDrag = true,
  } = options;

  // Mostrar datas durante o drag
  if (showDatesOnDrag) {
    gantt.attachEvent('onTaskDrag', (id: string, mode: string, e: MouseEvent) => {
      const task = gantt.getTask(id);
      if (task) {
        // Criar tooltip com datas
        const tooltip = document.createElement('div');
        tooltip.className = 'vp-drag-tooltip';
        tooltip.innerHTML = `
          <div><strong>${task.text}</strong></div>
          <div>Início: ${gantt.templates.tooltip_date_format(task.start_date)}</div>
          <div>Fim: ${gantt.templates.tooltip_date_format(task.end_date)}</div>
        `;
        document.body.appendChild(tooltip);

        const updateTooltip = (e: MouseEvent) => {
          tooltip.style.left = e.pageX + 10 + 'px';
          tooltip.style.top = e.pageY + 10 + 'px';
        };

        const removeTooltip = () => {
          if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
          document.removeEventListener('mousemove', updateTooltip);
          document.removeEventListener('mouseup', removeTooltip);
        };

        document.addEventListener('mousemove', updateTooltip);
        document.addEventListener('mouseup', removeTooltip);
      }
    });
  }

  // Validação de datas
  if (validateDates) {
    gantt.attachEvent('onBeforeTaskDrag', (id: string, mode: string) => {
      const task = gantt.getTask(id);
      if (task && onDragStart) {
        onDragStart(task);
      }
      return true;
    });

    gantt.attachEvent('onAfterTaskDrag', (id: string, mode: string, e: MouseEvent) => {
      const task = gantt.getTask(id);
      if (task) {
        const start = new Date(task.start_date);
        const end = new Date(task.end_date);

        if (validateDates && !validateDates(task, start, end)) {
          // Reverter drag se inválido
          gantt.undo();
          return false;
        }

        if (onDragEnd) {
          onDragEnd(task, start, end);
        }
      }
      return true;
    });
  }
}

/**
 * Adicionar coluna dinamicamente
 */
export function addColumn(column: AdvancedColumn, position?: number) {
  const currentColumns = gantt.config.columns || [];
  
  if (position !== undefined && position >= 0 && position <= currentColumns.length) {
    currentColumns.splice(position, 0, column);
  } else {
    currentColumns.push(column);
  }

  gantt.config.columns = currentColumns;
  gantt.render();
}

/**
 * Remover coluna dinamicamente
 */
export function removeColumn(columnName: string) {
  const currentColumns = gantt.config.columns || [];
  const filtered = currentColumns.filter((col: any) => col.name !== columnName);
  gantt.config.columns = filtered;
  gantt.render();
}

/**
 * Reordenar colunas
 */
export function reorderColumns(columnNames: string[]) {
  const currentColumns = gantt.config.columns || [];
  const columnMap = new Map(currentColumns.map((col: any) => [col.name, col]));
  
  const reordered = columnNames
    .map((name) => columnMap.get(name))
    .filter((col) => col !== undefined) as any[];

  // Adicionar colunas que não foram especificadas no final
  currentColumns.forEach((col: any) => {
    if (!columnNames.includes(col.name)) {
      reordered.push(col);
    }
  });

  gantt.config.columns = reordered;
  gantt.render();
}

