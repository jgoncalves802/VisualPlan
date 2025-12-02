import { useState } from 'react';
import { Save, X, Check, Loader2 } from 'lucide-react';
import { baselineService, type BaselineType } from '../../../services/baselineService';
import type { AtividadeMock, DependenciaAtividade } from '../../../types/cronograma';

interface SaveBaselineButtonProps {
  empresaId: string;
  projetoId: string;
  atividades: AtividadeMock[];
  dependencias: DependenciaAtividade[];
  onBaselineSaved?: () => void;
  disabled?: boolean;
}

export function SaveBaselineButton({
  empresaId,
  projetoId,
  atividades,
  dependencias,
  onBaselineSaved,
  disabled = false
}: SaveBaselineButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'ORIGINAL' as BaselineType,
    setAsCurrentBaseline: true
  });

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      setError('Nome da baseline é obrigatório');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await baselineService.createBaseline(
        empresaId,
        projetoId,
        formData.nome,
        atividades,
        dependencias,
        {
          descricao: formData.descricao || undefined,
          tipo: formData.tipo,
          setAsCurrentBaseline: formData.setAsCurrentBaseline
        }
      );

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsModalOpen(false);
        setFormData({ nome: '', descricao: '', tipo: 'ORIGINAL', setAsCurrentBaseline: true });
        onBaselineSaved?.();
      }, 1500);
    } catch (err) {
      console.error('Error saving baseline:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar baseline');
    } finally {
      setSaving(false);
    }
  };

  const baselineTypes: { value: BaselineType; label: string; description: string }[] = [
    { value: 'ORIGINAL', label: 'Original', description: 'Baseline inicial do projeto' },
    { value: 'REVISION', label: 'Revisão', description: 'Revisão aprovada do cronograma' },
    { value: 'WHAT_IF', label: 'What-If', description: 'Cenário hipotético para análise' },
    { value: 'APPROVED', label: 'Aprovada', description: 'Baseline oficialmente aprovada' }
  ];

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || atividades.length === 0}
        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title="Salvar Baseline"
      >
        <Save className="w-4 h-4" />
        <span className="text-sm font-medium">Salvar Baseline</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-purple-50">
              <h2 className="text-lg font-semibold text-gray-800">Salvar Baseline</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {success ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-lg font-medium text-green-600">Baseline salva com sucesso!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {atividades.length} atividades capturadas
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Uma baseline captura o estado atual do cronograma para comparação futura.
                      Serão salvas <strong>{atividades.length}</strong> atividades e{' '}
                      <strong>{dependencias.length}</strong> dependências.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Baseline *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Baseline Original, Revisão 01..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descrição ou observações sobre esta baseline..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Baseline
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {baselineTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, tipo: type.value }))}
                          className={`p-2 text-left rounded-lg border-2 transition-colors ${
                            formData.tipo === type.value
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className={`text-sm font-medium ${
                            formData.tipo === type.value ? 'text-purple-700' : 'text-gray-700'
                          }`}>
                            {type.label}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.setAsCurrentBaseline}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        setAsCurrentBaseline: e.target.checked 
                      }))}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      Definir como baseline atual (para comparação de variância)
                    </span>
                  </label>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {!success && (
              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.nome.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Baseline
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
