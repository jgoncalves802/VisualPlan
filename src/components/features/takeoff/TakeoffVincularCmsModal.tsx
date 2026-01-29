import React, { useState, useEffect } from 'react';
import { X, Loader2, FileCheck2 } from 'lucide-react';
import { criteriosMedicaoService } from '../../../services/criteriosMedicaoService';
import type { CriterioMedicao } from '../../../types/criteriosMedicao.types';

interface TakeoffVincularCmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projetoId: string;
  itemIds: string[];
}

const TakeoffVincularCmsModal: React.FC<TakeoffVincularCmsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projetoId,
  itemIds,
}) => {
  const [criterios, setCriterios] = useState<CriterioMedicao[]>([]);
  const [selectedCriterioId, setSelectedCriterioId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCriterios, setIsLoadingCriterios] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

  useEffect(() => {
    const loadCriterios = async () => {
      if (!projetoId) return;
      setIsLoadingCriterios(true);
      try {
        const lista = await criteriosMedicaoService.getCriterios({ projetoId, status: 'ativo' });
        setCriterios(lista);
      } catch (err) {
        console.error('Erro ao carregar critérios:', err);
      } finally {
        setIsLoadingCriterios(false);
      }
    };
    if (isOpen) {
      loadCriterios();
      setSelectedCriterioId('');
      setError(null);
      setResult(null);
    }
  }, [projetoId, isOpen]);

  if (!isOpen) return null;

  const handleVincular = async () => {
    if (!selectedCriterioId) {
      setError('Selecione um critério de medição');
      return;
    }

    setIsLoading(true);
    setError(null);
    let successCount = 0;
    let errorCount = 0;

    for (const itemId of itemIds) {
      try {
        await criteriosMedicaoService.vincularItemCriterio(itemId, selectedCriterioId);
        successCount++;
      } catch (err) {
        console.error('Erro ao vincular item:', itemId, err);
        errorCount++;
      }
    }

    setResult({ success: successCount, errors: errorCount });
    setIsLoading(false);

    if (successCount > 0) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-md rounded-lg shadow-xl theme-surface overflow-hidden flex flex-col"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <h3 className="text-lg font-semibold theme-text">Vincular Critério de Medição</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-surface-secondary)' }}
          >
            <X className="w-4 h-4 theme-text-secondary" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div 
              className="p-3 rounded-lg text-sm"
              style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
            >
              {error}
            </div>
          )}

          {result && (
            <div 
              className="p-3 rounded-lg text-sm"
              style={{ 
                backgroundColor: result.errors > 0 ? '#FEF3C7' : '#D1FAE5', 
                color: result.errors > 0 ? '#D97706' : '#059669' 
              }}
            >
              {result.success} item(ns) vinculado(s) com sucesso
              {result.errors > 0 && `, ${result.errors} erro(s)`}
            </div>
          )}

          <div className="text-sm theme-text-secondary">
            <p>Selecione o critério de medição para vincular aos <strong>{itemIds.length}</strong> item(ns) selecionado(s):</p>
          </div>

          <div>
            <label className="block text-sm font-medium theme-text-secondary mb-1">
              Critério de Medição *
            </label>
            <select
              value={selectedCriterioId}
              onChange={(e) => setSelectedCriterioId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
              style={{ 
                backgroundColor: 'var(--color-surface-secondary)', 
                borderColor: 'var(--color-border)' 
              }}
              disabled={isLoadingCriterios || isLoading}
            >
              <option value="">
                {isLoadingCriterios ? 'Carregando...' : 'Selecione um critério'}
              </option>
              {criterios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} - {c.descritivo}
                </option>
              ))}
            </select>
            {criterios.length === 0 && !isLoadingCriterios && (
              <p className="text-xs mt-1" style={{ color: '#EF4444' }}>
                Nenhum critério cadastrado para este projeto.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg theme-text hover:opacity-80 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleVincular}
            disabled={isLoading || isLoadingCriterios || criterios.length === 0 || !selectedCriterioId}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: '#374151' }}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Vincular
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeoffVincularCmsModal;
