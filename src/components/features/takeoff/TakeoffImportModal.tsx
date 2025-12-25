import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTakeoffStore } from '../../../stores/takeoffStore';
import type { CreateItemDTO } from '../../../types/takeoff.types';

interface TakeoffImportModalProps {
  mapaId: string;
  onClose: () => void;
}

interface ColumnMapping {
  source: string;
  target: keyof CreateItemDTO | '';
}

const TARGET_COLUMNS: { key: keyof CreateItemDTO; label: string }[] = [
  { key: 'area', label: 'Área' },
  { key: 'edificacao', label: 'Edificação' },
  { key: 'tag', label: 'TAG' },
  { key: 'linha', label: 'Linha' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'tipoMaterial', label: 'Tipo Material' },
  { key: 'dimensao', label: 'Dimensão' },
  { key: 'unidade', label: 'Unidade' },
  { key: 'qtdPrevista', label: 'Qtd Prevista' },
  { key: 'qtdTakeoff', label: 'Qtd Take-off' },
  { key: 'pesoUnitario', label: 'Peso Unitário' },
  { key: 'custoUnitario', label: 'Custo Unitário' },
  { key: 'itemPq', label: 'Item PQ' },
  { key: 'observacoes', label: 'Observações' },
];

const TakeoffImportModal: React.FC<TakeoffImportModalProps> = ({ mapaId, onClose }) => {
  const { createItensBatch } = useTakeoffStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      setSourceColumns(headers);
      
      const autoMappings: ColumnMapping[] = headers.map((header) => {
        const normalized = header.toLowerCase().trim();
        let target: keyof CreateItemDTO | '' = '';
        
        if (normalized.includes('área') || normalized.includes('area')) target = 'area';
        else if (normalized.includes('edificação') || normalized.includes('edificacao')) target = 'edificacao';
        else if (normalized.includes('tag')) target = 'tag';
        else if (normalized.includes('linha')) target = 'linha';
        else if (normalized.includes('descrição') || normalized.includes('descricao')) target = 'descricao';
        else if (normalized.includes('tipo') && normalized.includes('material')) target = 'tipoMaterial';
        else if (normalized.includes('dimensão') || normalized.includes('dimensao')) target = 'dimensao';
        else if (normalized.includes('unid')) target = 'unidade';
        else if (normalized.includes('prev')) target = 'qtdPrevista';
        else if (normalized.includes('take') || normalized.includes('quant')) target = 'qtdTakeoff';
        else if (normalized.includes('peso') && normalized.includes('unit')) target = 'pesoUnitario';
        else if (normalized.includes('custo') || normalized.includes('preço') || normalized.includes('preco')) target = 'custoUnitario';
        else if (normalized.includes('pq') || normalized.includes('item')) target = 'itemPq';
        else if (normalized.includes('obs')) target = 'observacoes';
        
        return { source: header, target };
      });
      
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

  const updateMapping = (sourceCol: string, targetKey: keyof CreateItemDTO | '') => {
    setMappings((prev) =>
      prev.map((m) => (m.source === sourceCol ? { ...m, target: targetKey } : m))
    );
  };

  const handlePreview = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[selectedSheet];
      const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

      const mappedData = jsonData.slice(0, 10).map((row) => {
        const mapped: Record<string, unknown> = {};
        mappings.forEach(({ source, target }) => {
          if (target && row[source] !== undefined) {
            mapped[target] = row[source];
          }
        });
        return mapped;
      });

      setPreviewData(mappedData);
      setStep('preview');
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setStep('importing');
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[selectedSheet];
      const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

      const itensToCreate: CreateItemDTO[] = [];
      const errors: string[] = [];

      jsonData.forEach((row, index) => {
        const item: Partial<CreateItemDTO> = { mapaId };
        
        mappings.forEach(({ source, target }) => {
          if (target && row[source] !== undefined) {
            const value = row[source];
            if (['qtdPrevista', 'qtdTakeoff', 'pesoUnitario', 'custoUnitario'].includes(target)) {
              (item as Record<string, unknown>)[target] = Number(value) || 0;
            } else {
              (item as Record<string, unknown>)[target] = String(value || '');
            }
          }
        });

        if (!item.descricao) {
          errors.push(`Linha ${index + 2}: Descrição obrigatória`);
          return;
        }
        if (!item.unidade) {
          item.unidade = 'un';
        }

        itensToCreate.push(item as CreateItemDTO);
      });

      const imported = await createItensBatch(itensToCreate);
      
      setImportResult({
        success: imported,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 theme-text-secondary" />
            <h2 className="text-lg font-semibold">Importar Excel</h2>
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

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Mapeamento de Colunas</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mappings.map(({ source, target }) => (
                    <div key={source} className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg">
                      <span className="flex-1 text-sm font-medium truncate" title={source}>
                        {source}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <select
                        value={target}
                        onChange={(e) => updateMapping(source, e.target.value as keyof CreateItemDTO | '')}
                        className="flex-1 px-3 py-1.5 text-sm border rounded-lg"
                      >
                        <option value="">-- Ignorar --</option>
                        {TARGET_COLUMNS.map((col) => (
                          <option key={col.key} value={col.key}>{col.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                Prévia das primeiras 10 linhas
              </div>
              
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {mappings.filter(m => m.target).map(({ target }) => (
                        <th key={target} className="px-3 py-2 text-left font-medium text-gray-600">
                          {TARGET_COLUMNS.find(c => c.key === target)?.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i} className="border-t">
                        {mappings.filter(m => m.target).map(({ target }) => (
                          <td key={target} className="px-3 py-2 text-gray-700">
                            {String(row[target!] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      <p className="text-sm font-medium text-red-600 mb-2">
                        {importResult.errors.length} erros:
                      </p>
                      <ul className="text-sm text-red-500 list-disc list-inside max-h-40 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>... e mais {importResult.errors.length - 10} erros</li>
                        )}
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
                onClick={handlePreview}
                disabled={isProcessing || !mappings.some(m => m.target)}
                className="px-4 py-2 text-sm rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 theme-text"
                style={{ backgroundColor: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border)' }}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Prévia
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
                  onClick={handleImport}
                  className="px-4 py-2 text-sm rounded-lg hover:opacity-90 flex items-center gap-2 theme-text"
                  style={{ backgroundColor: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border)' }}
                >
                  Importar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeoffImportModal;
