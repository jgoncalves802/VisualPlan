import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { criteriosMedicaoService } from '../../../services/criteriosMedicaoService';
import type { CriterioImportRow, CriterioImportResult } from '../../../types/criteriosMedicao.types';

interface CriteriosMedicaoImportModalProps {
  isOpen: boolean;
  empresaId: string;
  projetoId?: string;
  onClose: () => void;
  onImportComplete?: () => void;
  onSuccess?: (result: CriterioImportResult) => void;
}

interface ColumnMapping {
  source: string;
  target: string;
}

interface PreviewRow {
  _rowIndex: number;
  _hasIssues: boolean;
  _selected: boolean;
  criterioMedicao: string;
  descritivoConcreto: string;
  etapa: number;
  descritivo: string;
  descritivoDocumento: string;
  percentual: number;
}

const TARGET_COLUMNS = [
  { key: 'criterioMedicao', label: 'Critério Medição', required: true },
  { key: 'descritivoConcreto', label: 'Descritivo Concreto', required: false },
  { key: 'etapa', label: 'Etapa', required: true, isNumeric: true },
  { key: 'descritivo', label: 'Descritivo', required: true },
  { key: 'descritivoDocumento', label: 'Descritivo Documento', required: false },
  { key: 'percentual', label: 'Percentual', required: true, isNumeric: true },
];

const autoMapColumn = (header: string): string => {
  const normalized = header.toLowerCase().trim();
  
  if (normalized.includes('critério') || normalized.includes('criterio') || normalized.includes('cms')) return 'criterioMedicao';
  if (normalized.includes('concreto') || normalized.includes('tipo') && normalized.includes('material')) return 'descritivoConcreto';
  if (normalized === 'etapa' || normalized.includes('etapa') || normalized === 'step') return 'etapa';
  if (normalized === 'descritivo' || normalized.includes('descrição') || normalized.includes('descricao') || normalized === 'desc') return 'descritivo';
  if (normalized.includes('documento') || normalized.includes('doc')) return 'descritivoDocumento';
  if (normalized.includes('percent') || normalized === '%' || normalized.includes('peso')) return 'percentual';
  
  return '';
};

const generateTemplate = () => {
  const workbook = XLSX.utils.book_new();
  
  const dados = [
    ['CRITÉRIO MEDIÇÃO', 'DESCRITIVO CONCRETO', 'ETAPA', 'DESCRITIVO', 'DESCRITIVO DOCUMENTO', 'PERCENTUAL'],
    ['CMS C.65.45.000', 'Concreto Armado', 1, 'Forma', 'DOC-FORMA-001', 10],
    ['CMS C.65.45.000', 'Concreto Armado', 2, 'Armação', 'DOC-ARM-001', 60],
    ['CMS C.65.45.000', 'Concreto Armado', 3, 'Concretagem', 'DOC-CONC-001', 15],
    ['CMS C.65.45.000', 'Concreto Armado', 4, 'Cura', 'DOC-CURA-001', 15],
  ];
  
  const wsDados = XLSX.utils.aoa_to_sheet(dados);
  wsDados['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 10 },
    { wch: 25 },
    { wch: 25 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsDados, 'Dados');
  
  const instrucoes = [
    ['INSTRUÇÕES PARA PREENCHIMENTO DO MODELO DE CRITÉRIOS DE MEDIÇÃO'],
    [''],
    ['COLUNA', 'DESCRIÇÃO', 'OBRIGATÓRIO'],
    ['CRITÉRIO MEDIÇÃO', 'Código único do critério (ex: CMS C.65.45.000)', 'Sim'],
    ['DESCRITIVO CONCRETO', 'Descrição do tipo de material/serviço', 'Não'],
    ['ETAPA', 'Número sequencial da etapa (1, 2, 3...)', 'Sim'],
    ['DESCRITIVO', 'Descrição da etapa', 'Sim'],
    ['DESCRITIVO DOCUMENTO', 'Código do documento de referência', 'Não'],
    ['PERCENTUAL', 'Percentual de peso da etapa (soma deve ser 100%)', 'Sim'],
    [''],
    ['OBSERVAÇÕES:'],
    ['- Cada critério pode ter múltiplas etapas'],
    ['- A soma dos percentuais de cada critério deve totalizar 100%'],
    ['- Use o mesmo código de critério para agrupar etapas'],
    ['- O número da etapa define a ordem de execução'],
  ];
  
  const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoes);
  wsInstrucoes['!cols'] = [{ wch: 25 }, { wch: 50 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, wsInstrucoes, 'Instruções');
  
  XLSX.writeFile(workbook, 'Modelo_Criterios_Medicao.xlsx');
};

const CriteriosMedicaoImportModal: React.FC<CriteriosMedicaoImportModalProps> = ({
  isOpen,
  empresaId,
  projetoId,
  onClose,
  onImportComplete,
  onSuccess,
}) => {
  if (!isOpen) return null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [allPreviewData, setAllPreviewData] = useState<PreviewRow[]>([]);
  const [importResult, setImportResult] = useState<CriterioImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  
  const ROWS_PER_PAGE = 20;

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      
      setSheets(workbook.SheetNames);
      setSelectedSheet(workbook.SheetNames[0]);
      
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];
      
      if (jsonData.length > 0) {
        const fileHeaders = Object.keys(jsonData[0]);
        setRawData(jsonData);
        
        const autoMappings = fileHeaders.map(header => ({
          source: header,
          target: autoMapColumn(header),
        }));
        setMappings(autoMappings);
        
        setStep('mapping');
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!file) return;
    
    setSelectedSheet(sheetName);
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
      
      if (jsonData.length > 0) {
        const fileHeaders = Object.keys(jsonData[0]);
        setRawData(jsonData);
        
        const autoMappings = fileHeaders.map(header => ({
          source: header,
          target: autoMapColumn(header),
        }));
        setMappings(autoMappings);
      }
    } catch (error) {
      console.error('Erro ao processar planilha:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (sourceColumn: string, targetColumn: string) => {
    setMappings(prev => 
      prev.map(m => m.source === sourceColumn ? { ...m, target: targetColumn } : m)
    );
  };

  const processPreviewData = () => {
    const preview: PreviewRow[] = rawData.map((row, index) => {
      const mapped: PreviewRow = {
        _rowIndex: index + 1,
        _hasIssues: false,
        _selected: true,
        criterioMedicao: '',
        descritivoConcreto: '',
        etapa: 0,
        descritivo: '',
        descritivoDocumento: '',
        percentual: 0,
      };

      for (const mapping of mappings) {
        if (mapping.target && row[mapping.source] !== undefined) {
          const value = row[mapping.source];
          if (mapping.target === 'etapa' || mapping.target === 'percentual') {
            mapped[mapping.target] = Number(value) || 0;
          } else {
            mapped[mapping.target as keyof PreviewRow] = String(value || '') as never;
          }
        }
      }

      if (!mapped.criterioMedicao || !mapped.descritivo || !mapped.etapa || !mapped.percentual) {
        mapped._hasIssues = true;
      }

      return mapped;
    });

    setAllPreviewData(preview);
    setCurrentPage(1);
    setStep('preview');
  };

  const validateMappings = () => {
    const requiredFields = TARGET_COLUMNS.filter(c => c.required).map(c => c.key);
    const mappedTargets = mappings.filter(m => m.target).map(m => m.target);
    return requiredFields.every(field => mappedTargets.includes(field));
  };

  const handleImport = async () => {
    setStep('importing');
    setIsProcessing(true);

    try {
      const selectedRows = allPreviewData.filter(row => row._selected && !row._hasIssues);
      
      const importRows: CriterioImportRow[] = selectedRows.map(row => ({
        criterioMedicao: row.criterioMedicao,
        descritivoConcreto: row.descritivoConcreto || undefined,
        etapa: row.etapa,
        descritivo: row.descritivo,
        descritivoDocumento: row.descritivoDocumento || undefined,
        percentual: row.percentual,
      }));

      const result = await criteriosMedicaoService.importarCriterios(empresaId, importRows, projetoId);
      setImportResult(result);
      setStep('result');
      
      if (onSuccess) {
        onSuccess(result);
      }
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Erro ao importar:', error);
      setImportResult({
        success: false,
        criteriosImportados: 0,
        etapasImportadas: 0,
        erros: [error instanceof Error ? error.message : 'Erro desconhecido'],
        criterios: [],
      });
      setStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const issueCount = allPreviewData.filter(row => row._hasIssues).length;
  const validCount = allPreviewData.filter(row => row._selected && !row._hasIssues).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="theme-surface rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b theme-divide">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold theme-text">Importar Critérios de Medição</h2>
              <p className="text-sm theme-text-secondary">
                {step === 'upload' && 'Selecione o arquivo Excel com os critérios'}
                {step === 'mapping' && 'Configure o mapeamento das colunas'}
                {step === 'preview' && 'Revise os dados antes de importar'}
                {step === 'importing' && 'Importando critérios...'}
                {step === 'result' && 'Resultado da importação'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors w-full max-w-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium theme-text mb-2">
                  Arraste um arquivo Excel ou clique para selecionar
                </p>
                <p className="text-sm theme-text-secondary">
                  Formatos suportados: .xlsx, .xls
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={generateTemplate}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar modelo em branco
                </button>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              {file && (
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <span className="font-medium">{file.name}</span>
                  
                  {sheets.length > 1 && (
                    <select
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      className="ml-auto px-3 py-1.5 border rounded-lg text-sm"
                    >
                      {sheets.map(sheet => (
                        <option key={sheet} value={sheet}>{sheet}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Coluna do Arquivo</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        <ArrowRight className="w-4 h-4 mx-auto" />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Campo de Destino</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Exemplo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {mappings.map((mapping, index) => (
                      <tr key={mapping.source} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-medium">{mapping.source}</td>
                        <td className="px-4 py-3 text-center">
                          <ArrowRight className="w-4 h-4 mx-auto text-gray-400" />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={mapping.target}
                            onChange={(e) => handleMappingChange(mapping.source, e.target.value)}
                            className="w-full px-3 py-1.5 border rounded-lg text-sm"
                          >
                            <option value="">-- Ignorar --</option>
                            {TARGET_COLUMNS.map(col => (
                              <option key={col.key} value={col.key}>
                                {col.label} {col.required && '*'}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[200px]">
                          {rawData[0]?.[mapping.source] !== undefined 
                            ? String(rawData[0][mapping.source]) 
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!validateMappings() && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">
                    Mapeie todos os campos obrigatórios: Critério Medição, Etapa, Descritivo e Percentual
                  </span>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm theme-text-secondary">
                    {validCount} de {allPreviewData.length} registros válidos
                  </span>
                  {issueCount > 0 && (
                    <button
                      onClick={() => setShowOnlyIssues(!showOnlyIssues)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                        showOnlyIssues ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {issueCount} com problemas
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">#</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Critério</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Descritivo Concreto</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700">Etapa</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Descritivo</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Doc</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700">%</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedData.map((row) => (
                      <tr 
                        key={row._rowIndex} 
                        className={row._hasIssues ? 'bg-red-50' : 'hover:bg-gray-50'}
                      >
                        <td className="px-3 py-2 text-gray-500">{row._rowIndex}</td>
                        <td className="px-3 py-2 font-medium">{row.criterioMedicao || '-'}</td>
                        <td className="px-3 py-2">{row.descritivoConcreto || '-'}</td>
                        <td className="px-3 py-2 text-center">{row.etapa || '-'}</td>
                        <td className="px-3 py-2 max-w-[200px] truncate">{row.descritivo || '-'}</td>
                        <td className="px-3 py-2">{row.descritivoDocumento || '-'}</td>
                        <td className="px-3 py-2 text-center">{row.percentual ? `${row.percentual}%` : '-'}</td>
                        <td className="px-3 py-2 text-center">
                          {row._hasIssues ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                          ) : (
                            <Check className="w-4 h-4 text-green-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-lg font-medium theme-text">Importando critérios de medição...</p>
              <p className="text-sm theme-text-secondary">Aguarde, isso pode levar alguns segundos</p>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-3">
                  {importResult.success ? (
                    <Check className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <p className={`font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {importResult.success ? 'Importação concluída!' : 'Importação com erros'}
                    </p>
                    <p className={`text-sm ${importResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {importResult.criteriosImportados} critérios e {importResult.etapasImportadas} etapas importados
                    </p>
                  </div>
                </div>
              </div>

              {importResult.erros.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-red-700">Erros encontrados:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                    {importResult.erros.map((erro, index) => (
                      <li key={index}>{erro}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.criterios.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Critérios importados:</h4>
                  <div className="space-y-2">
                    {importResult.criterios.map(criterio => (
                      <div key={criterio.id} className="flex items-center gap-2 text-sm">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{criterio.codigo}</span>
                        <span>{criterio.descritivo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t theme-divide bg-gray-50">
          <button
            onClick={() => {
              if (step === 'mapping') setStep('upload');
              else if (step === 'preview') setStep('mapping');
              else onClose();
            }}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {step === 'result' ? 'Fechar' : 'Voltar'}
          </button>

          {step === 'mapping' && (
            <button
              onClick={processPreviewData}
              disabled={!validateMappings() || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 'preview' && (
            <button
              onClick={handleImport}
              disabled={validCount === 0 || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importar {validCount} registro{validCount !== 1 ? 's' : ''}
            </button>
          )}

          {step === 'result' && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CriteriosMedicaoImportModal;
