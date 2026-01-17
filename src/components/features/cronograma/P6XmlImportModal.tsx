import React, { useState, useCallback } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, ChevronRight, FolderTree } from 'lucide-react';
import { p6XmlImportService } from '../../../services/p6XmlImportService';
import { P6XmlData, P6XmlImportResult } from '../../../types/p6Import.types';
import { supabase } from '../../../services/supabase';

interface P6XmlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projetoId?: string;
  empresaId: string;
  onImportComplete: (projetoId?: string) => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'results';

export const P6XmlImportModal: React.FC<P6XmlImportModalProps> = ({
  isOpen,
  onClose,
  projetoId,
  empresaId,
  onImportComplete,
}) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [parsedData, setParsedData] = useState<P6XmlData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<P6XmlImportResult | null>(null);
  
  const [scheduleName, setScheduleName] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(9);
  const [createdProjetoId, setCreatedProjetoId] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.toLowerCase().endsWith('.xml')) {
      setError('Por favor, selecione um arquivo XML.');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    setCreatedProjetoId(null);
    
    try {
      const data = await p6XmlImportService.parseXmlFile(selectedFile);
      setParsedData(data);
      
      const projectInfo = p6XmlImportService.getProjectInfo();
      if (projectInfo) {
        setScheduleName(projectInfo.name);
      }
      
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo XML');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleImport = async () => {
    if (!parsedData || !scheduleName.trim()) return;
    
    setStep('importing');
    setError(null);
    
    try {
      let targetProjetoId = projetoId;
      
      if (!targetProjetoId) {
        const { data: newProject, error: projectError } = await supabase
          .from('projetos')
          .insert({
            nome: scheduleName,
            empresa_id: empresaId,
            status: 'PLANEJAMENTO',
          })
          .select('id')
          .single();
        
        if (projectError) throw new Error(`Erro ao criar projeto: ${projectError.message}`);
        targetProjetoId = newProject.id;
        setCreatedProjetoId(newProject.id);
      }
      
      const { data: scheduleNode, error: nodeError } = await supabase
        .from('eps_nodes')
        .insert({
          nome: scheduleName,
          codigo: parsedData.projects[0]?.id || 'SCHEDULE',
          tipo: 'CRONOGRAMA',
          parent_id: null,
          empresa_id: empresaId,
          projeto_id: targetProjetoId,
          ordem: 0,
        })
        .select('id')
        .single();
      
      if (nodeError) throw new Error(`Erro ao criar nó do cronograma: ${nodeError.message}`);
      
      const result = await p6XmlImportService.importToDatabase(
        targetProjetoId!,
        empresaId,
        scheduleNode.id,
        hoursPerDay
      );
      
      setImportResult(result);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro durante importação');
      setStep('preview');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setParsedData(null);
    setError(null);
    setImportResult(null);
    setScheduleName('');
    setCreatedProjetoId(null);
    onClose();
  };

  const handleFinish = () => {
    onImportComplete(createdProjetoId || projetoId);
    handleClose();
  };

  if (!isOpen) return null;

  const projectInfo = p6XmlImportService.getProjectInfo();
  const wbsHierarchy = p6XmlImportService.getWbsHierarchy();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Importar XML do Primavera P6
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          {(['upload', 'preview', 'importing', 'results'] as ImportStep[]).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
              <div className={`flex items-center gap-2 text-sm ${
                step === s 
                  ? 'text-blue-600 font-medium' 
                  : i < ['upload', 'preview', 'importing', 'results'].indexOf(step)
                    ? 'text-green-600'
                    : 'text-gray-400'
              }`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === s 
                    ? 'bg-blue-100 text-blue-600' 
                    : i < ['upload', 'preview', 'importing', 'results'].indexOf(step)
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {i + 1}
                </span>
                <span className="hidden sm:inline">
                  {s === 'upload' && 'Upload'}
                  {s === 'preview' && 'Preview'}
                  {s === 'importing' && 'Importando'}
                  {s === 'results' && 'Resultados'}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'upload' && (
            <div className="text-center py-8">
              <div className="mb-4">
                <FileText className="w-16 h-16 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Selecione o arquivo XML do P6
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Exporte seu projeto do Primavera P6 em formato XML e faça o upload aqui.
              </p>
              
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                <Upload className="w-5 h-5" />
                <span>Selecionar arquivo XML</span>
                <input
                  type="file"
                  accept=".xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              
              {isLoading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processando arquivo...</span>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && projectInfo && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Projeto P6
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {projectInfo.name}
                  </p>
                  <p className="text-sm text-gray-500">{projectInfo.id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                      Atividades
                    </h4>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {projectInfo.activitiesCount}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                      Níveis WBS
                    </h4>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {projectInfo.wbsCount}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Cronograma
                </label>
                <input
                  type="text"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nome do cronograma no VisionPlan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Horas por Dia (para conversão de duração)
                </label>
                <input
                  type="number"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  min={1}
                  max={24}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {wbsHierarchy.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <FolderTree className="w-4 h-4" />
                    Estrutura WBS (primeiros 10 níveis)
                  </h4>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full text-sm">
                      <tbody>
                        {wbsHierarchy.slice(0, 10).map((wbs, i) => (
                          <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="px-3 py-2" style={{ paddingLeft: `${(wbs.level + 1) * 16}px` }}>
                              <span className="text-gray-500 mr-2">{wbs.code}</span>
                              <span className="text-gray-900 dark:text-white">{wbs.name}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {wbsHierarchy.length > 10 && (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center bg-gray-50 dark:bg-gray-900">
                        ... e mais {wbsHierarchy.length - 10} níveis WBS
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Importando dados...
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Criando estrutura WBS e atividades no VisionPlan
              </p>
            </div>
          )}

          {step === 'results' && importResult && (
            <div className="space-y-6">
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                importResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
              }`}>
                <CheckCircle className="w-6 h-6" />
                <div>
                  <h4 className="font-medium">
                    {importResult.success ? 'Importação concluída!' : 'Importação concluída com avisos'}
                  </h4>
                  <p className="text-sm">
                    Projeto: {importResult.projectName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {importResult.wbsImported}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">Níveis WBS importados</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {importResult.activitiesImported}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Atividades importadas</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-2">
                    Erros ({importResult.errors.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-sm text-red-700 dark:text-red-400">
                        {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {importResult.warnings.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-600 mb-2">
                    Avisos ({importResult.warnings.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                    {importResult.warnings.slice(0, 5).map((warn, i) => (
                      <p key={i} className="text-sm text-yellow-700 dark:text-yellow-400">
                        {warn.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {step !== 'results' && step !== 'importing' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              Cancelar
            </button>
          )}
          
          {step === 'preview' && (
            <button
              onClick={handleImport}
              disabled={!scheduleName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importar
            </button>
          )}
          
          {step === 'results' && (
            <button
              onClick={handleFinish}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default P6XmlImportModal;
