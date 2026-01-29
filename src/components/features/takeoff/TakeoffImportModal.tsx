import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Plus,
  Edit3,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTakeoffStore } from '../../../stores/takeoffStore';
import { takeoffService } from '../../../services/takeoffService';
import { criteriosMedicaoService } from '../../../services/criteriosMedicaoService';
import type { CreateItemDTO, TakeoffColunaConfig } from '../../../types/takeoff.types';
import type { CriterioMedicao } from '../../../types/criteriosMedicao.types';

interface TakeoffImportModalProps {
  mapaId: string;
  disciplinaId: string;
  projetoId: string;
  onClose: () => void;
  colunasConfig?: TakeoffColunaConfig[];
  onCreateColumn?: (codigo: string, nome: string, tipo: string) => Promise<void>;
}

interface ColumnMapping {
  source: string;
  target: string;
  createNew?: boolean;
  newColumnName?: string;
}

interface TargetColumn {
  key: string;
  label: string;
  isCustom?: boolean;
  isNumeric?: boolean;
}

interface PreviewRow {
  _rowIndex: number;
  _hasIssues: boolean;
  _selected: boolean;
  [key: string]: unknown;
}

const DEFAULT_COLUMNS: TargetColumn[] = [
  { key: 'area', label: 'Área' },
  { key: 'edificacao', label: 'Edificação' },
  { key: 'tag', label: 'TAG' },
  { key: 'linha', label: 'Linha' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'tipoMaterial', label: 'Tipo Material' },
  { key: 'dimensao', label: 'Dimensão' },
  { key: 'unidade', label: 'Unidade' },
  { key: 'qtdPrevista', label: 'Qtd Prevista', isNumeric: true },
  { key: 'qtdTakeoff', label: 'Qtd Take-off', isNumeric: true },
  { key: 'pesoUnitario', label: 'Peso Unitário', isNumeric: true },
  { key: 'custoUnitario', label: 'Custo Unitário', isNumeric: true },
  { key: 'itemPq', label: 'Item PQ' },
  { key: 'observacoes', label: 'Observações' },
  { key: 'criterioMedicao', label: 'Critério de Medição (CMS)' },
];

const NUMERIC_FIELD_PATTERNS: Record<string, RegExp[]> = {
  qtdPrevista: [/prev/i, /orçad/i, /orcad/i, /planej/i],
  qtdTakeoff: [/^qt\.?$/i, /^qtd\.?$/i, /^quant/i, /take/i, /quantidade/i],
  pesoUnitario: [/peso\s*unit/i, /peso\s*u\./i, /^peso$/i],
  custoUnitario: [/custo/i, /preço/i, /preco/i, /valor\s*unit/i, /^valor$/i],
};

const autoMapColumn = (header: string): string => {
  const normalized = header.toLowerCase().trim();
  
  if (normalized.includes('área') || normalized.includes('area')) return 'area';
  if (normalized.includes('edificação') || normalized.includes('edificacao')) return 'edificacao';
  if (normalized === 'tag' || normalized.includes('tag equip')) return 'tag';
  if (normalized.includes('linha') && !normalized.includes('disciplina')) return 'linha';
  
  if (
    normalized.includes('descrição') || 
    normalized.includes('descricao') || 
    normalized.includes('desc') ||
    normalized === 'nome' ||
    (normalized === 'item' && !normalized.includes('pq')) ||
    normalized === 'servico' ||
    normalized === 'serviço' ||
    normalized === 'atividade' ||
    normalized === 'material'
  ) return 'descricao';
  
  if (normalized.includes('tipo') && normalized.includes('material')) return 'tipoMaterial';
  if (normalized.includes('dimensão') || normalized.includes('dimensao') || normalized.includes('especificacao') || normalized.includes('especificação')) return 'dimensao';
  if (normalized.includes('unid') || normalized === 'un' || normalized === 'und') return 'unidade';
  
  for (const [field, patterns] of Object.entries(NUMERIC_FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) return field;
    }
  }
  
  if (normalized.includes('pq') || (normalized.includes('item') && normalized.includes('pq'))) return 'itemPq';
  if (normalized.includes('obs')) return 'observacoes';
  if (normalized.includes('cms') || normalized.includes('critério') || normalized.includes('criterio') || normalized.includes('medição') || normalized.includes('medicao')) return 'criterioMedicao';
  
  return '';
};

const TakeoffImportModal: React.FC<TakeoffImportModalProps> = ({ 
  mapaId, 
  disciplinaId,
  projetoId,
  onClose, 
  colunasConfig = [],
  onCreateColumn,
}) => {
  const { loadColunasConfig, loadItens } = useTakeoffStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [criterioMap, setCriterioMap] = useState<Map<string, string>>(new Map());

  const [targetColumns, setTargetColumns] = useState<TargetColumn[]>(() => {
    const defaultKeys = new Set(DEFAULT_COLUMNS.map(c => c.key.toLowerCase()));
    const customColumns: TargetColumn[] = colunasConfig
      .filter(c => !defaultKeys.has(c.codigo.toLowerCase()))
      .map(c => ({
        key: c.codigo,
        label: c.nome,
        isCustom: true,
      }));
    return [...DEFAULT_COLUMNS, ...customColumns];
  });

  useEffect(() => {
    const defaultKeys = new Set(DEFAULT_COLUMNS.map(c => c.key.toLowerCase()));
    const customColumns: TargetColumn[] = colunasConfig
      .filter(c => !defaultKeys.has(c.codigo.toLowerCase()))
      .map(c => ({
        key: c.codigo,
        label: c.nome,
        isCustom: true,
      }));
    setTargetColumns([...DEFAULT_COLUMNS, ...customColumns]);
  }, [colunasConfig]);

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'decision' | 'importing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [allPreviewData, setAllPreviewData] = useState<PreviewRow[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [newColumnModal, setNewColumnModal] = useState<{ source: string } | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  
  const ROWS_PER_PAGE = 20;

  useEffect(() => {
    const loadCriterios = async () => {
      if (!projetoId) return;
      try {
        const lista = await criteriosMedicaoService.getCriterios({ projetoId, status: 'ativo' });
        const map = new Map<string, string>();
        for (const c of lista) {
          map.set(c.codigo.toLowerCase(), c.id);
          map.set(c.descritivo.toLowerCase(), c.id);
        }
        setCriterioMap(map);
      } catch (err) {
        console.error('Erro ao carregar critérios:', err);
      }
    };
    loadCriterios();
  }, [projetoId]);

  const filteredData = useMemo(() => {
    if (showOnlyIssues) {
      return allPreviewData.filter(row => row._hasIssues);
    }
    return allPreviewData;
  }, [allPreviewData, showOnlyIssues]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredData.slice(start, start + ROWS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  const stats = useMemo(() => {
    const total = allPreviewData.length;
    const withIssues = allPreviewData.filter(r => r._hasIssues).length;
    const selected = allPreviewData.filter(r => r._selected).length;
    const complete = total - withIssues;
    return { total, withIssues, complete, selected };
  }, [allPreviewData]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      setSheets(workbook.SheetNames);
      
      if (workbook.SheetNames.length > 0) {
        setSelectedSheet(workbook.SheetNames[0]);
        loadSheetColumns(workbook, workbook.SheetNames[0]);
      }
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      alert('Erro ao ler o arquivo Excel');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSheetColumns = (workbook: XLSX.WorkBook, sheetName: string) => {
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    
    if (jsonData.length > 0) {
      const headers = (jsonData[0] as string[]).filter(Boolean);
      
      const autoMappings: ColumnMapping[] = headers.map((header) => ({
        source: header,
        target: autoMapColumn(header),
      }));
      
      setMappings(autoMappings);
      setStep('mapping');
    }
  };

  const handleSheetChange = async (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (file) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      loadSheetColumns(workbook, sheetName);
    }
  };

  const updateMapping = (sourceCol: string, targetKey: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.source === sourceCol ? { ...m, target: targetKey, createNew: false } : m))
    );
  };

  const handleCreateNewColumn = async () => {
    if (!newColumnModal || !newColumnName.trim()) return;
    
    let codigo = newColumnName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    if (!codigo) {
      codigo = `custom_${Date.now()}`;
    }
    
    const existingKeys = new Set(targetColumns.map(c => c.key.toLowerCase()));
    if (existingKeys.has(codigo.toLowerCase())) {
      codigo = `${codigo}_${Date.now()}`;
    }
    
    if (onCreateColumn) {
      try {
        await onCreateColumn(codigo, newColumnName.trim(), 'text');
        await loadColunasConfig(disciplinaId);
      } catch (error) {
        console.error('Erro ao criar coluna:', error);
      }
    }
    
    const newColumn: TargetColumn = {
      key: codigo,
      label: newColumnName.trim(),
      isCustom: true,
    };
    setTargetColumns(prev => [...prev, newColumn]);
    
    setMappings(prev => prev.map(m => 
      m.source === newColumnModal.source 
        ? { ...m, target: codigo, createNew: false } 
        : m
    ));
    
    setNewColumnModal(null);
    setNewColumnName('');
  };

  const isDescricaoMapped = useMemo(() => {
    return mappings.some(m => m.target === 'descricao');
  }, [mappings]);

  const unmappedColumns = useMemo(() => {
    return mappings.filter(m => !m.target);
  }, [mappings]);

  const handleGeneratePreview = async () => {
    if (!file) return;
    
    if (!isDescricaoMapped) {
      alert('Por favor, mapeie uma coluna para o campo "Descrição". Este campo é obrigatório para a importação.');
      return;
    }
    
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[selectedSheet];
      const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

      const defaultKeys = new Set(DEFAULT_COLUMNS.map(c => c.key));
      const numericFields = ['qtdPrevista', 'qtdTakeoff', 'pesoUnitario', 'custoUnitario'];

      const previewRows: PreviewRow[] = jsonData.map((row, index) => {
        const mapped: PreviewRow = { 
          _rowIndex: index, 
          _hasIssues: false, 
          _selected: true,
        };
        
        mappings.forEach(({ source, target }) => {
          if (target && row[source] !== undefined) {
            const value = row[source];
            if (defaultKeys.has(target) && numericFields.includes(target)) {
              mapped[target] = Number(value) || 0;
            } else {
              mapped[target] = String(value ?? '');
            }
          }
        });
        
        const hasEmptyDescription = !mapped.descricao || String(mapped.descricao).trim() === '';
        const hasAnyValue = Object.entries(mapped)
          .filter(([k]) => !k.startsWith('_'))
          .some(([, v]) => {
            if (typeof v === 'number') return v !== 0;
            if (typeof v === 'string') return v.trim() !== '';
            return v !== null && v !== undefined;
          });
        const isEmptyRow = !hasAnyValue;
        
        mapped._hasIssues = hasEmptyDescription;
        mapped._selected = !isEmptyRow;
        
        return mapped;
      });

      setAllPreviewData(previewRows);
      setCurrentPage(1);
      setStep('preview');
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCellEdit = useCallback((rowIndex: number, field: string, value: string) => {
    setAllPreviewData(prev => prev.map(row => {
      if (row._rowIndex === rowIndex) {
        const numericFields = ['qtdPrevista', 'qtdTakeoff', 'pesoUnitario', 'custoUnitario'];
        const newValue = numericFields.includes(field) ? (Number(value) || 0) : value;
        const updated = { ...row, [field]: newValue };
        
        const hasEmptyDescription = !updated.descricao || String(updated.descricao).trim() === '';
        updated._hasIssues = hasEmptyDescription;
        
        const hasAnyValue = Object.entries(updated)
          .filter(([k]) => !k.startsWith('_'))
          .some(([, v]) => {
            if (typeof v === 'number') return v !== 0;
            if (typeof v === 'string') return v.trim() !== '';
            return v !== null && v !== undefined;
          });
        if (!hasAnyValue) {
          updated._selected = false;
        }
        
        return updated;
      }
      return row;
    }));
    setEditingCell(null);
  }, []);

  const toggleRowSelection = useCallback((rowIndex: number) => {
    setAllPreviewData(prev => prev.map(row => 
      row._rowIndex === rowIndex ? { ...row, _selected: !row._selected } : row
    ));
  }, []);

  const selectAll = useCallback((selected: boolean) => {
    setAllPreviewData(prev => prev.map(row => ({ ...row, _selected: selected })));
  }, []);

  const selectOnlyComplete = useCallback(() => {
    setAllPreviewData(prev => prev.map(row => ({ ...row, _selected: !row._hasIssues })));
  }, []);

  const handleProceedToDecision = () => {
    setStep('decision');
  };

  const handleImport = async (mode: 'all' | 'selected' | 'complete') => {
    setStep('importing');
    setIsProcessing(true);

    const defaultKeys = new Set(DEFAULT_COLUMNS.map(c => c.key));
    const excludeFromItem = new Set(['criterioMedicao']);

    try {
      let rowsToImport = allPreviewData;
      
      if (mode === 'selected') {
        rowsToImport = allPreviewData.filter(r => r._selected);
      } else if (mode === 'complete') {
        rowsToImport = allPreviewData.filter(r => !r._hasIssues);
      }
      
      rowsToImport = rowsToImport.filter(r => r.descricao && String(r.descricao).trim() !== '');

      const criterioCodesPerRow: (string | null)[] = [];
      const itensToCreate: CreateItemDTO[] = rowsToImport.map(row => {
        const item: Partial<CreateItemDTO> = { mapaId };
        const valoresCustom: Record<string, string> = {};
        let criterioCode: string | null = null;
        
        Object.entries(row).forEach(([key, value]) => {
          if (key.startsWith('_')) return;
          
          if (key === 'criterioMedicao') {
            criterioCode = value ? String(value).trim() : null;
            return;
          }
          
          if (excludeFromItem.has(key)) return;
          
          if (defaultKeys.has(key)) {
            (item as Record<string, unknown>)[key] = value;
          } else if (value !== undefined && value !== '') {
            valoresCustom[key] = String(value);
          }
        });
        
        criterioCodesPerRow.push(criterioCode);
        
        if (Object.keys(valoresCustom).length > 0) {
          item.valoresCustom = valoresCustom;
        }
        
        if (!item.unidade) {
          item.unidade = 'un';
        }
        
        return item as CreateItemDTO;
      });

      const insertedItems = await takeoffService.createItensBatchWithIds(itensToCreate);
      
      let vinculadosCount = 0;
      let semCriterioCount = 0;
      
      for (const inserted of insertedItems) {
        const criterioCode = criterioCodesPerRow[inserted.index];
        if (criterioCode) {
          const criterioId = criterioMap.get(criterioCode.toLowerCase());
          if (criterioId) {
            try {
              await criteriosMedicaoService.vincularItemCriterio(inserted.id, criterioId);
              vinculadosCount++;
            } catch (err) {
              console.error('Erro ao vincular critério:', err);
            }
          } else {
            semCriterioCount++;
          }
        } else {
          semCriterioCount++;
        }
      }

      await loadItens({ mapaId });
      
      const skipped = allPreviewData.length - rowsToImport.length;
      
      const errors: string[] = [];
      if (skipped > 0) {
        errors.push(`${skipped} linha(s) não importada(s)`);
      }
      if (semCriterioCount > 0) {
        errors.push(`${semCriterioCount} item(ns) sem critério vinculado (vincule manualmente)`);
      }
      if (vinculadosCount > 0) {
        errors.push(`${vinculadosCount} item(ns) vinculado(s) ao critério automaticamente`);
      }
      
      setImportResult({
        success: insertedItems.length,
        errors,
      });
    } catch (error) {
      console.error('Erro ao importar:', error);
      setImportResult({
        success: 0,
        errors: ['Erro ao processar importação'],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const activeMappings = useMemo(() => mappings.filter(m => m.target), [mappings]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 theme-text-secondary" />
            <h2 className="text-lg font-semibold">Importar Excel</h2>
            {step !== 'upload' && (
              <span className="text-sm text-gray-500">
                {step === 'mapping' && '• Mapeamento'}
                {step === 'preview' && '• Prévia'}
                {step === 'decision' && '• Confirmação'}
                {step === 'importing' && '• Importando'}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {step === 'upload' && (
            <div className="text-center py-12">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-gray-500 transition-colors"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Clique para selecionar ou arraste o arquivo
                </p>
                <p className="text-sm text-gray-500">Formatos aceitos: .xlsx, .xls</p>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Planilha:</label>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  {sheets.map((sheet) => (
                    <option key={sheet} value={sheet}>{sheet}</option>
                  ))}
                </select>
              </div>

              {!isDescricaoMapped && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">
                    <strong>Campo obrigatório:</strong> Mapeie uma coluna para "Descrição" para continuar.
                  </span>
                </div>
              )}

              {unmappedColumns.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                  <Plus className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">
                    <strong>{unmappedColumns.length} coluna(s) não mapeada(s).</strong> Você pode criar novas colunas personalizadas para elas.
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Mapeamento de Colunas</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mappings.map(({ source, target }) => (
                    <div key={source} className={`flex items-center gap-4 p-2 rounded-lg ${!target ? 'bg-amber-50' : 'bg-gray-50'}`}>
                      <span className="flex-1 text-sm font-medium truncate" title={source}>
                        {source}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <select
                        value={target}
                        onChange={(e) => updateMapping(source, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border rounded-lg"
                      >
                        <option value="">-- Ignorar --</option>
                        <optgroup label="Campos Padrão">
                          {DEFAULT_COLUMNS.map((col) => (
                            <option key={col.key} value={col.key}>{col.label}</option>
                          ))}
                        </optgroup>
                        {targetColumns.filter(c => c.isCustom).length > 0 && (
                          <optgroup label="Colunas Personalizadas">
                            {targetColumns.filter(c => c.isCustom).map((col) => (
                              <option key={col.key} value={col.key}>{col.label}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      {!target && (
                        <button
                          onClick={() => {
                            setNewColumnModal({ source });
                            setNewColumnName(source);
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          title="Criar nova coluna personalizada"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Total: <strong>{stats.total}</strong></span>
                    <span className="text-green-600">Completos: <strong>{stats.complete}</strong></span>
                    <span className="text-amber-600">Com problemas: <strong>{stats.withIssues}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowOnlyIssues(!showOnlyIssues)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border ${
                      showOnlyIssues ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-gray-300'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    {showOnlyIssues ? 'Mostrando problemas' : 'Filtrar problemas'}
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left w-10">
                        <input
                          type="checkbox"
                          checked={allPreviewData.every(r => r._selected)}
                          onChange={(e) => selectAll(e.target.checked)}
                          className="rounded"
                        />
                      </th>
                      <th className="px-2 py-2 text-left w-12 text-gray-500">#</th>
                      {activeMappings.map(({ target }) => (
                        <th key={target} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                          {targetColumns.find(c => c.key === target)?.label || target}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row) => (
                      <tr 
                        key={row._rowIndex} 
                        className={`border-t ${row._hasIssues ? 'bg-amber-50' : ''} ${!row._selected ? 'opacity-50' : ''}`}
                      >
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={row._selected}
                            onChange={() => toggleRowSelection(row._rowIndex)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-2 py-2 text-gray-400 text-xs">{row._rowIndex + 1}</td>
                        {activeMappings.map(({ target }) => {
                          const value = row[target];
                          const isEmpty = value === '' || value === null || value === undefined;
                          const isEditing = editingCell?.row === row._rowIndex && editingCell?.col === target;
                          
                          return (
                            <td 
                              key={target} 
                              className={`px-3 py-2 ${isEmpty && target === 'descricao' ? 'bg-red-100' : isEmpty ? 'bg-gray-100' : ''}`}
                              onClick={() => !isEditing && setEditingCell({ row: row._rowIndex, col: target })}
                            >
                              {isEditing ? (
                                <input
                                  type="text"
                                  defaultValue={String(value ?? '')}
                                  autoFocus
                                  className="w-full px-1 py-0.5 border rounded text-sm"
                                  onBlur={(e) => handleCellEdit(row._rowIndex, target, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleCellEdit(row._rowIndex, target, e.currentTarget.value);
                                    } else if (e.key === 'Escape') {
                                      setEditingCell(null);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="flex items-center gap-1 group cursor-pointer">
                                  <span className={isEmpty ? 'text-gray-400 italic' : 'text-gray-700'}>
                                    {isEmpty ? '(vazio)' : String(value)}
                                  </span>
                                  <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'decision' && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Como deseja importar?</h3>
                <p className="text-gray-600">Escolha uma das opções abaixo:</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <button
                  onClick={() => handleImport('all')}
                  className="p-6 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="text-2xl font-bold text-blue-600 mb-2">{stats.total}</div>
                  <div className="font-medium text-gray-800">Importar Todos</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Inclui itens com campos vazios (descrição será obrigatória)
                  </div>
                </button>
                
                <button
                  onClick={() => handleImport('complete')}
                  className="p-6 border-2 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                >
                  <div className="text-2xl font-bold text-green-600 mb-2">{stats.complete}</div>
                  <div className="font-medium text-gray-800">Apenas Completos</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Somente itens sem campos vazios obrigatórios
                  </div>
                </button>
                
                <button
                  onClick={() => handleImport('selected')}
                  className="p-6 border-2 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
                >
                  <div className="text-2xl font-bold text-purple-600 mb-2">{stats.selected}</div>
                  <div className="font-medium text-gray-800">Selecionados</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Apenas itens marcados na prévia
                  </div>
                </button>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => setStep('preview')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Voltar para editar seleção
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-12">
              {isProcessing ? (
                <>
                  <Loader2 className="w-12 h-12 theme-text-secondary animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700">Importando itens...</p>
                </>
              ) : importResult ? (
                <>
                  {importResult.success > 0 ? (
                    <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  ) : (
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  )}
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {importResult.success} itens importados com sucesso
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-4 text-left max-w-md mx-auto">
                      <p className="text-sm font-medium text-amber-600 mb-2">
                        Observações:
                      </p>
                      <ul className="text-sm text-amber-500 list-disc list-inside">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {file && `Arquivo: ${file.name}`}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {importResult ? 'Fechar' : 'Cancelar'}
            </button>
            
            {step === 'mapping' && (
              <button
                onClick={handleGeneratePreview}
                disabled={isProcessing || !isDescricaoMapped}
                className="px-4 py-2 text-sm rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 bg-blue-600 text-white"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Gerar Prévia
              </button>
            )}
            
            {step === 'preview' && (
              <>
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Voltar
                </button>
                <button
                  onClick={selectOnlyComplete}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border"
                >
                  Selecionar Completos
                </button>
                <button
                  onClick={handleProceedToDecision}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Continuar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {newColumnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Criar Nova Coluna</h3>
            <p className="text-sm text-gray-600 mb-4">
              Criar coluna personalizada para: <strong>{newColumnModal.source}</strong>
            </p>
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Nome da coluna"
              className="w-full px-3 py-2 border rounded-lg mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setNewColumnModal(null);
                  setNewColumnName('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewColumn}
                disabled={!newColumnName.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Criar e Mapear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeoffImportModal;
