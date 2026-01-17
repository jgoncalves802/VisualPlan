import React, { useState, useCallback } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Settings,
  Table,
  Eye,
  Download,
} from 'lucide-react';
import { p6ImportService } from '../../../services/p6ImportService';
import { epsService, EpsNode } from '../../../services/epsService';
import {
  P6SheetInfo,
  P6ImportResult,
  P6_TASK_COLUMNS,
  VISIONPLAN_TASK_COLUMNS,
  VISIONPLAN_COLUMN_CATEGORIES,
  VisionPlanColumnDefinition,
} from '../../../types/p6Import.types';
import { Search } from 'lucide-react';

interface P6ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projetoId?: string;
  empresaId: string;
  userId: string;
  onImportComplete: (result: P6ImportResult, newProjetoId?: string) => void;
}

type ImportStep = 'upload' | 'project' | 'sheets' | 'mapping' | 'preview' | 'importing' | 'result';

interface ColumnMappingState {
  [p6Column: string]: string;
}

interface SearchableColumnSelectProps {
  value: string;
  onChange: (value: string) => void;
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

const SearchableColumnSelect: React.FC<SearchableColumnSelectProps> = ({ value, onChange, dataType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const compatibleColumns = VISIONPLAN_TASK_COLUMNS.filter(vpc => 
    vpc.dataType === dataType
  );

  const filteredColumns = searchTerm
    ? compatibleColumns.filter(vpc =>
        vpc.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vpc.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vpc.description && vpc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        VISIONPLAN_COLUMN_CATEGORIES[vpc.category as keyof typeof VISIONPLAN_COLUMN_CATEGORIES]?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : compatibleColumns;

  const groupedColumns = filteredColumns.reduce((acc, col) => {
    const category = col.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(col);
    return acc;
  }, {} as Record<string, VisionPlanColumnDefinition[]>);

  const selectedColumn = VISIONPLAN_TASK_COLUMNS.find(c => c.key === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border rounded-lg text-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {selectedColumn ? (
            <>
              {selectedColumn.label} {selectedColumn.required && <span className="text-red-500">*</span>}
            </>
          ) : '-- Ignorar --'}
        </span>
        <ChevronRight size={16} className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-80 bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b sticky top-0 bg-white">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar campo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-64">
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${!value ? 'bg-blue-50 text-blue-700' : ''}`}
            >
              -- Ignorar --
            </button>

            {Object.entries(groupedColumns).map(([category, columns]) => (
              <div key={category}>
                <div className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wide sticky top-0">
                  {VISIONPLAN_COLUMN_CATEGORIES[category as keyof typeof VISIONPLAN_COLUMN_CATEGORIES] || category}
                </div>
                {columns.map(col => (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => { onChange(col.key); setIsOpen(false); setSearchTerm(''); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex flex-col ${value === col.key ? 'bg-blue-50 text-blue-700' : ''}`}
                  >
                    <span className="font-medium">
                      {col.label} {col.required && <span className="text-red-500">*</span>}
                    </span>
                    {col.description && (
                      <span className="text-xs text-gray-500">{col.description}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}

            {Object.keys(groupedColumns).length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                Nenhum campo encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const P6ImportModal: React.FC<P6ImportModalProps> = ({
  isOpen,
  onClose,
  projetoId: initialProjetoId,
  empresaId,
  userId,
  onImportComplete,
}) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<P6SheetInfo[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>(['TASK', 'TASKPRED']);
  const [columnMappings, setColumnMappings] = useState<ColumnMappingState>({});
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [importResult, setImportResult] = useState<P6ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState({
    overwriteExisting: false,
    createMissingWBS: true,
    importBaselines: true,
    importResources: false,
    dateFormat: 'yyyy-mm-dd',
    hoursPerDay: 8,
  });
  const [mappingSearch, setMappingSearch] = useState('');
  
  const [selectedProjetoId, setSelectedProjetoId] = useState<string>(initialProjetoId || '');
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [existingProjects, setExistingProjects] = useState<EpsNode[]>([]);
  const [projectMode, setProjectMode] = useState<'existing' | 'new'>('existing');
  const [detectedProjectName, setDetectedProjectName] = useState<string>('');

  React.useEffect(() => {
    if (isOpen && empresaId) {
      epsService.getEpsOnlyTree(empresaId).then(setExistingProjects);
    }
  }, [isOpen, empresaId]);

  React.useEffect(() => {
    if (initialProjetoId) {
      setSelectedProjetoId(initialProjetoId);
      setProjectMode('existing');
    }
  }, [initialProjetoId]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      setError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sheetInfos = await p6ImportService.parseExcelFile(selectedFile);
      setFile(selectedFile);
      setSheets(sheetInfos);
      setSelectedSheets(sheetInfos.filter(s => s.selected).map(s => s.name));
      
      const preview = p6ImportService.getSheetPreview('TASK', 1);
      if (preview.length > 0) {
        const firstRow = preview[0];
        let projName = '';
        for (const key of Object.keys(firstRow)) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('proj_name') || lowerKey.includes('project name') || lowerKey === 'project__proj_name') {
            projName = String(firstRow[key] || '');
            break;
          }
        }
        if (projName && projName.trim() !== '') {
          setDetectedProjectName(projName);
          setNewProjectName(projName);
        }
      }
      
      if (!initialProjetoId && !selectedProjetoId) {
        setStep('project');
      } else {
        setStep('sheets');
      }
    } catch (err) {
      setError('Erro ao ler arquivo Excel. Verifique se o arquivo não está corrompido.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    if (!droppedFile.name.match(/\.(xlsx|xls)$/i)) {
      setError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sheetInfos = await p6ImportService.parseExcelFile(droppedFile);
      setFile(droppedFile);
      setSheets(sheetInfos);
      setSelectedSheets(sheetInfos.filter(s => s.selected).map(s => s.name));
      
      const preview = p6ImportService.getSheetPreview('TASK', 1);
      if (preview.length > 0) {
        const firstRow = preview[0];
        let projName = '';
        for (const key of Object.keys(firstRow)) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('proj_name') || lowerKey.includes('project name') || lowerKey === 'project__proj_name') {
            projName = String(firstRow[key] || '');
            break;
          }
        }
        if (projName && projName.trim() !== '') {
          setDetectedProjectName(projName);
          setNewProjectName(projName);
        }
      }
      
      if (!initialProjetoId && !selectedProjetoId) {
        setStep('project');
      } else {
        setStep('sheets');
      }
    } catch (err) {
      setError('Erro ao ler arquivo Excel. Verifique se o arquivo não está corrompido.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [initialProjetoId, selectedProjetoId]);

  const handleSheetToggle = (sheetName: string) => {
    setSelectedSheets(prev =>
      prev.includes(sheetName)
        ? prev.filter(s => s !== sheetName)
        : [...prev, sheetName]
    );
  };

  const handleMappingChange = (p6Column: string, vpColumn: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [p6Column]: vpColumn,
    }));
  };

  const handleGoToMapping = () => {
    const autoMappings = p6ImportService.generateAutoMappingsForSheet('TASK');
    setColumnMappings(autoMappings);
    setStep('mapping');
  };

  const handleGoToPreview = () => {
    const preview = p6ImportService.getSheetPreview('TASK', 5);
    setPreviewData(preview);
    setStep('preview');
  };

  const handleImport = async () => {
    setStep('importing');
    setLoading(true);
    setError(null);

    try {
      const result = await p6ImportService.importToDatabase(
        {
          sheetsToImport: selectedSheets,
          columnMappings: {
            tasks: [],
            predecessors: [],
            resources: [],
          },
          taskColumnMappings: columnMappings,
          options,
        },
        selectedProjetoId || initialProjetoId || '',
        empresaId,
        userId
      );

      setImportResult(result);
      setStep('result');
      
      if (result.success) {
        onImportComplete(result, selectedProjetoId || initialProjetoId);
      }
    } catch (err) {
      setError('Erro durante a importação. Tente novamente.');
      console.error(err);
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    p6ImportService.clear();
    setStep('upload');
    setFile(null);
    setSheets([]);
    setSelectedSheets(['TASK', 'TASKPRED']);
    setColumnMappings({});
    setPreviewData([]);
    setImportResult(null);
    setError(null);
    onClose();
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'upload', label: 'Upload' },
      { key: 'project', label: 'Projeto' },
      { key: 'sheets', label: 'Planilhas' },
      { key: 'mapping', label: 'Mapeamento' },
      { key: 'preview', label: 'Preview' },
      { key: 'result', label: 'Resultado' },
    ];

    const currentIndex = steps.findIndex(s => s.key === step || (step === 'importing' && s.key === 'result'));

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, index) => (
          <React.Fragment key={s.key}>
            <div className={`flex items-center gap-2 ${index <= currentIndex ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index < currentIndex ? 'bg-blue-600 text-white' : 
                  index === currentIndex ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' : 
                  'bg-gray-100 text-gray-400'}`}>
                {index < currentIndex ? <Check size={16} /> : index + 1}
              </div>
              <span className="hidden sm:inline text-sm">{s.label}</span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight size={16} className="text-gray-300" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setError('Por favor, informe o nome do cronograma');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const newProject = await epsService.create({
        empresaId,
        codigo: newProjectName.trim().substring(0, 20).toUpperCase().replace(/\s+/g, '_'),
        nome: newProjectName.trim(),
        descricao: `Cronograma importado do P6 - ${new Date().toLocaleDateString()}`,
      });
      
      setSelectedProjetoId(newProject.id);
      setStep('sheets');
    } catch (err) {
      setError('Erro ao criar o projeto. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderProjectStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione ou Crie um Cronograma</h3>
        <p className="text-sm text-gray-600">
          {detectedProjectName 
            ? `Nome detectado no arquivo: "${detectedProjectName}"`
            : 'Escolha um projeto existente ou crie um novo para importar os dados'
          }
        </p>
      </div>
      
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setProjectMode('existing')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            projectMode === 'existing' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Projeto Existente
        </button>
        <button
          onClick={() => setProjectMode('new')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            projectMode === 'new' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Criar Novo
        </button>
      </div>
      
      {projectMode === 'existing' ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Selecione o Projeto:</label>
          <select
            value={selectedProjetoId}
            onChange={(e) => setSelectedProjetoId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Selecione um projeto --</option>
            {existingProjects.map(proj => (
              <option key={proj.id} value={proj.id}>{proj.nome} ({proj.codigo})</option>
            ))}
          </select>
          
          <button
            onClick={() => selectedProjetoId && setStep('sheets')}
            disabled={!selectedProjetoId}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Nome do Cronograma:</label>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Ex: Plataforma Offshore A"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={handleCreateProject}
            disabled={loading || !newProjectName.trim()}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Criar e Continuar
          </button>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={() => setStep('upload')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
      </div>
    </div>
  );

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('p6-file-input')?.click()}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={48} className="text-blue-500 animate-spin" />
            <p className="text-gray-600">Processando arquivo...</p>
          </div>
        ) : (
          <>
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Arraste seu arquivo Excel do Primavera P6 aqui
            </p>
            <p className="text-sm text-gray-500 mb-4">ou clique para selecionar</p>
            <p className="text-xs text-gray-400">Formatos suportados: .xlsx, .xls</p>
          </>
        )}
        <input
          id="p6-file-input"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Dica:</h4>
        <p className="text-sm text-blue-700">
          Exporte seu cronograma do Primavera P6 usando a opção "Export to Excel" com todas as colunas que deseja importar.
          O sistema suporta as planilhas TASK, TASKPRED, RSRC e TASKRSRC.
        </p>
      </div>
    </div>
  );

  const renderSheetsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <FileSpreadsheet size={24} className="text-green-600" />
        <div>
          <p className="font-medium">{file?.name}</p>
          <p className="text-sm text-gray-500">{sheets.length} planilhas encontradas</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Selecione as planilhas para importar:</h4>
        {sheets.map(sheet => (
          <label
            key={sheet.name}
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
              ${selectedSheets.includes(sheet.name) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
          >
            <input
              type="checkbox"
              checked={selectedSheets.includes(sheet.name)}
              onChange={() => handleSheetToggle(sheet.name)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <Table size={20} className="text-gray-500" />
            <div className="flex-1">
              <p className="font-medium">{sheet.name}</p>
              <p className="text-sm text-gray-500">
                {sheet.rowCount} linhas, {sheet.columnCount} colunas
              </p>
            </div>
          </label>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <Settings size={18} />
          Opções de Importação
        </h4>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.overwriteExisting}
            onChange={(e) => setOptions(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm">Substituir atividades existentes (mesma origem P6)</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.importBaselines}
            onChange={(e) => setOptions(prev => ({ ...prev, importBaselines: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm">Importar datas de baseline</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-sm">Horas por dia:</span>
          <input
            type="number"
            value={options.hoursPerDay}
            onChange={(e) => setOptions(prev => ({ ...prev, hoursPerDay: parseInt(e.target.value) || 8 }))}
            className="w-16 px-2 py-1 border rounded text-sm"
            min={1}
            max={24}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setStep('upload')}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
        >
          <ChevronLeft size={18} />
          Voltar
        </button>
        <button
          onClick={handleGoToMapping}
          disabled={!selectedSheets.includes('TASK')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Próximo
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  const renderMappingStep = () => {
    const p6Columns = p6ImportService.getSheetColumns('TASK');
    const importantP6Columns = P6_TASK_COLUMNS.filter(c => p6Columns.includes(c.key));
    
    const filteredP6Columns = mappingSearch
      ? importantP6Columns.filter(col =>
          col.key.toLowerCase().includes(mappingSearch.toLowerCase()) ||
          col.label.toLowerCase().includes(mappingSearch.toLowerCase())
        )
      : importantP6Columns;

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Configure o mapeamento das colunas do Primavera P6 para os campos do VisionPlan.
          As colunas já foram pré-configuradas com base no padrão do P6.
        </p>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar colunas P6..."
            value={mappingSearch}
            onChange={(e) => setMappingSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-4">
          <span>Total de colunas P6: <strong>{importantP6Columns.length}</strong></span>
          <span>Colunas VisionPlan: <strong>{VISIONPLAN_TASK_COLUMNS.length}</strong></span>
          <span>Mapeadas: <strong>{Object.values(columnMappings).filter(v => v).length}</strong></span>
        </div>

        <div className="max-h-96 overflow-y-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="text-left p-3 font-medium w-1/3">Coluna P6</th>
                <th className="text-center p-3 font-medium w-8">→</th>
                <th className="text-left p-3 font-medium">Campo VisionPlan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredP6Columns.map(p6Col => (
                <tr key={p6Col.key} className="hover:bg-gray-50">
                  <td className="p-3">
                    <div>
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p6Col.key}</span>
                      <p className="text-gray-600 text-xs mt-1">{p6Col.label}</p>
                    </div>
                  </td>
                  <td className="p-3 text-center text-gray-400">→</td>
                  <td className="p-3">
                    <SearchableColumnSelect
                      value={columnMappings[p6Col.key] || ''}
                      onChange={(value) => handleMappingChange(p6Col.key, value)}
                      dataType={p6Col.dataType}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between pt-4">
          <button
            onClick={() => setStep('sheets')}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            Voltar
          </button>
          <button
            onClick={handleGoToPreview}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Eye size={18} />
            Preview
          </button>
        </div>
      </div>
    );
  };

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Preview dos dados (primeiras 5 linhas)</h4>
        <span className="text-sm text-gray-500">
          Total: {p6ImportService.getSheetData('TASK').length} atividades
        </span>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">WBS</th>
              <th className="p-2 text-left">Início</th>
              <th className="p-2 text-left">Fim</th>
              <th className="p-2 text-right">Duração</th>
              <th className="p-2 text-right">%</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {previewData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-2 font-mono">{String(row.task_code || '-')}</td>
                <td className="p-2 max-w-[200px] truncate">{String(row.task_name || '-')}</td>
                <td className="p-2">{String(row.wbs_name || '-')}</td>
                <td className="p-2">{row.target_start_date ? String(row.target_start_date).split('T')[0] : '-'}</td>
                <td className="p-2">{row.target_end_date ? String(row.target_end_date).split('T')[0] : '-'}</td>
                <td className="p-2 text-right">{row.total_drtn_hr_cnt ? `${Math.round(Number(row.total_drtn_hr_cnt) / options.hoursPerDay)}d` : '-'}</td>
                <td className="p-2 text-right">{row.complete_pct !== undefined ? `${row.complete_pct}%` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSheets.includes('TASKPRED') && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm">
            <strong>{p6ImportService.getSheetData('TASKPRED').length}</strong> dependências serão importadas
          </p>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Confirmação</h4>
            <p className="text-sm text-yellow-700 mt-1">
              {options.overwriteExisting 
                ? 'As atividades existentes com origem P6 serão substituídas.'
                : 'Novas atividades serão adicionadas ao cronograma.'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setStep('mapping')}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
        >
          <ChevronLeft size={18} />
          Voltar
        </button>
        <button
          onClick={handleImport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Download size={18} />
          Importar Dados
        </button>
      </div>
    </div>
  );

  const renderImportingStep = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
      <p className="text-lg font-medium">Importando dados...</p>
      <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
    </div>
  );

  const renderResultStep = () => {
    if (!importResult) return null;

    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-3">
            {importResult.success ? (
              <Check size={24} className="text-green-600" />
            ) : (
              <AlertCircle size={24} className="text-red-600" />
            )}
            <div>
              <h4 className={`font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {importResult.success ? 'Importação concluída com sucesso!' : 'Importação falhou'}
              </h4>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{importResult.tasksImported}</p>
            <p className="text-sm text-blue-800">Atividades</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{importResult.dependenciesImported}</p>
            <p className="text-sm text-purple-800">Dependências</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{importResult.resourcesImported}</p>
            <p className="text-sm text-orange-800">Recursos</p>
          </div>
        </div>

        {importResult.errors.length > 0 && (
          <div className="border border-red-200 rounded-lg overflow-hidden">
            <div className="bg-red-50 p-3 border-b border-red-200">
              <h4 className="font-medium text-red-800 flex items-center gap-2">
                <AlertCircle size={18} />
                Erros ({importResult.errors.length})
              </h4>
            </div>
            <div className="max-h-40 overflow-y-auto p-3 space-y-2">
              {importResult.errors.map((err, i) => (
                <div key={i} className="text-sm text-red-700">
                  Linha {err.row}: {err.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {importResult.warnings.length > 0 && (
          <div className="border border-yellow-200 rounded-lg overflow-hidden">
            <div className="bg-yellow-50 p-3 border-b border-yellow-200">
              <h4 className="font-medium text-yellow-800 flex items-center gap-2">
                <AlertTriangle size={18} />
                Avisos ({importResult.warnings.length})
              </h4>
            </div>
            <div className="max-h-40 overflow-y-auto p-3 space-y-2">
              {importResult.warnings.map((warn, i) => (
                <div key={i} className="text-sm text-yellow-700">
                  Linha {warn.row}: {warn.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Concluir
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={24} className="text-green-600" />
            <h2 className="text-xl font-semibold">Importar do Primavera P6</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {renderStepIndicator()}

          {step === 'upload' && renderUploadStep()}
          {step === 'project' && renderProjectStep()}
          {step === 'sheets' && renderSheetsStep()}
          {step === 'mapping' && renderMappingStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'importing' && renderImportingStep()}
          {step === 'result' && renderResultStep()}
        </div>
      </div>
    </div>
  );
};
