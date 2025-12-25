import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { takeoffService } from '../../../services/takeoffService';
import type { TakeoffMedicao, CreateMedicaoDTO, TakeoffItem } from '../../../types/takeoff.types';

interface TakeoffMedicaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medicao: TakeoffMedicao) => void;
  item: TakeoffItem;
  usuarioId?: string;
}

const TakeoffMedicaoModal: React.FC<TakeoffMedicaoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  usuarioId,
}) => {
  const [formData, setFormData] = useState({
    periodoInicio: format(new Date(), 'yyyy-MM-dd'),
    periodoFim: format(new Date(), 'yyyy-MM-dd'),
    qtdPeriodo: 0,
    observacoes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qtdRestante = item.qtdTakeoff - item.qtdExecutada;

  useEffect(() => {
    if (isOpen) {
      setFormData({
        periodoInicio: format(new Date(), 'yyyy-MM-dd'),
        periodoFim: format(new Date(), 'yyyy-MM-dd'),
        qtdPeriodo: 0,
        observacoes: '',
      });
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.qtdPeriodo || formData.qtdPeriodo <= 0) {
      setError('Quantidade deve ser maior que zero');
      return;
    }

    if (formData.qtdPeriodo > qtdRestante && qtdRestante > 0) {
      setError(`Quantidade excede o restante (${qtdRestante.toLocaleString('pt-BR')} ${item.unidade})`);
      return;
    }

    setIsLoading(true);
    try {
      const createData: CreateMedicaoDTO = {
        itemId: item.id,
        usuarioId,
        periodoInicio: new Date(formData.periodoInicio),
        periodoFim: new Date(formData.periodoFim),
        qtdPeriodo: formData.qtdPeriodo,
        observacoes: formData.observacoes || undefined,
      };

      const result = await takeoffService.createMedicao(createData);

      if (result) {
        onSave(result);
        onClose();
      } else {
        setError('Erro ao registrar medição. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao registrar medição:', err);
      setError('Erro ao registrar medição. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const progressoAtual = item.qtdTakeoff > 0 
    ? ((item.qtdExecutada / item.qtdTakeoff) * 100).toFixed(1) 
    : '0.0';
  
  const progressoAposRegistro = item.qtdTakeoff > 0 
    ? (((item.qtdExecutada + formData.qtdPeriodo) / item.qtdTakeoff) * 100).toFixed(1) 
    : '0.0';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-lg rounded-lg shadow-xl theme-surface"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 theme-text-secondary" />
            <h3 className="text-lg font-semibold theme-text">Registrar Medição</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--color-surface-secondary)' }}
          >
            <X className="w-4 h-4 theme-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {error && (
              <div 
                className="p-3 rounded-lg text-sm"
                style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
              >
                {error}
              </div>
            )}

            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
              <div className="text-sm font-medium theme-text mb-1">{item.descricao}</div>
              <div className="flex items-center gap-4 text-xs theme-text-secondary">
                <span>Take-off: {item.qtdTakeoff.toLocaleString('pt-BR')} {item.unidade}</span>
                <span>Executado: {item.qtdExecutada.toLocaleString('pt-BR')} {item.unidade}</span>
                <span>Restante: {qtdRestante.toLocaleString('pt-BR')} {item.unidade}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={formData.periodoInicio}
                  onChange={(e) => setFormData({ ...formData, periodoInicio: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={formData.periodoFim}
                  onChange={(e) => setFormData({ ...formData, periodoFim: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-1">
                Quantidade Executada no Período ({item.unidade})
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.qtdPeriodo}
                onChange={(e) => setFormData({ ...formData, qtdPeriodo: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
              />
              {qtdRestante > 0 && (
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, qtdPeriodo: qtdRestante })}
                    className="text-xs theme-text-secondary hover:theme-text underline"
                  >
                    Preencher restante ({qtdRestante.toLocaleString('pt-BR')})
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações sobre a medição (opcional)"
                rows={2}
                className="w-full px-3 py-2 text-sm border rounded-lg theme-text resize-none"
                style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
              />
            </div>

            {formData.qtdPeriodo > 0 && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <div className="text-xs theme-text-secondary mb-2">Progresso após registro:</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(parseFloat(progressoAposRegistro), 100)}%`,
                        backgroundColor: '#10B981'
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium theme-text">
                    {progressoAtual}% → {progressoAposRegistro}%
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg theme-text hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || formData.qtdPeriodo <= 0}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: '#374151' }}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar Medição
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TakeoffMedicaoModal;
