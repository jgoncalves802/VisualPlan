import React, { useState, useEffect } from 'react';
import { X, Loader2, Link2, Search } from 'lucide-react';
import { takeoffService } from '../../../services/takeoffService';
import { supabase } from '../../../services/supabase';
import type { TakeoffVinculo, CreateVinculoDTO, TakeoffItem } from '../../../types/takeoff.types';

interface Atividade {
  id: string;
  nome: string;
  wbsPath?: string;
  dataInicio?: Date;
  dataFim?: Date;
  progresso?: number;
}

interface TakeoffVinculoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vinculo: TakeoffVinculo) => void;
  item: TakeoffItem;
  projetoId: string;
}

const TakeoffVinculoModal: React.FC<TakeoffVinculoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  projetoId,
}) => {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [filteredAtividades, setFilteredAtividades] = useState<Atividade[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAtividadeId, setSelectedAtividadeId] = useState<string | null>(null);
  const [peso, setPeso] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAtividades, setIsLoadingAtividades] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAtividades = async () => {
      if (!projetoId || !isOpen) return;
      
      setIsLoadingAtividades(true);
      try {
        const { data, error } = await supabase
          .from('atividades_cronograma')
          .select('id, nome, edt, data_inicio, data_fim, progresso, tipo')
          .eq('projeto_id', projetoId)
          .neq('tipo', 'Marco')
          .order('edt');

        if (error) {
          console.error('Erro ao carregar atividades:', error);
          setAtividades([]);
        } else {
          const mapped = (data || []).map((row) => ({
            id: row.id,
            nome: row.nome,
            wbsPath: row.edt,
            dataInicio: row.data_inicio ? new Date(row.data_inicio) : undefined,
            dataFim: row.data_fim ? new Date(row.data_fim) : undefined,
            progresso: row.progresso,
          }));
          setAtividades(mapped);
          setFilteredAtividades(mapped);
        }
      } catch (err) {
        console.error('Erro ao carregar atividades:', err);
        setAtividades([]);
      } finally {
        setIsLoadingAtividades(false);
      }
    };

    loadAtividades();
  }, [projetoId, isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = atividades.filter(
        (a) =>
          a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.wbsPath?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAtividades(filtered);
    } else {
      setFilteredAtividades(atividades);
    }
  }, [searchTerm, atividades]);

  useEffect(() => {
    if (isOpen) {
      setSelectedAtividadeId(null);
      setPeso(100);
      setSearchTerm('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAtividadeId) {
      setError('Selecione uma atividade');
      return;
    }

    if (peso <= 0 || peso > 100) {
      setError('Peso deve ser entre 1 e 100');
      return;
    }

    setIsLoading(true);
    try {
      const createData: CreateVinculoDTO = {
        itemId: item.id,
        atividadeId: selectedAtividadeId,
        peso,
      };

      const result = await takeoffService.createVinculo(createData);

      if (result) {
        onSave(result);
        onClose();
      } else {
        setError('Erro ao criar vínculo. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao criar vínculo:', err);
      setError('Erro ao criar vínculo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const selectedAtividade = atividades.find((a) => a.id === selectedAtividadeId);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl theme-surface overflow-hidden flex flex-col"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <Link2 className="w-5 h-5 theme-text-secondary" />
            <h3 className="text-lg font-semibold theme-text">Vincular ao Cronograma</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--color-surface-secondary)' }}
          >
            <X className="w-4 h-4 theme-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
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
                <span>Progresso: {item.percentualExecutado.toFixed(1)}%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                Selecione a Atividade do Cronograma
              </label>
              
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-secondary" />
                <input
                  type="text"
                  placeholder="Buscar atividade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>

              <div 
                className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {isLoadingAtividades ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin theme-text-secondary" />
                  </div>
                ) : filteredAtividades.length === 0 ? (
                  <div className="p-4 text-center theme-text-secondary text-sm">
                    {atividades.length === 0 
                      ? 'Nenhuma atividade encontrada no cronograma deste projeto'
                      : 'Nenhuma atividade corresponde à busca'
                    }
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {filteredAtividades.map((atividade) => (
                      <button
                        key={atividade.id}
                        type="button"
                        onClick={() => setSelectedAtividadeId(atividade.id)}
                        className={`w-full p-3 text-left transition-colors ${
                          selectedAtividadeId === atividade.id ? 'border-l-2' : ''
                        }`}
                        style={{
                          backgroundColor: selectedAtividadeId === atividade.id 
                            ? 'var(--color-surface-secondary)' 
                            : 'transparent',
                          borderColor: selectedAtividadeId === atividade.id 
                            ? 'var(--color-text)' 
                            : 'transparent',
                        }}
                      >
                        <div className="text-sm font-medium theme-text">{atividade.nome}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs theme-text-secondary">
                          {atividade.wbsPath && <span>WBS: {atividade.wbsPath}</span>}
                          {atividade.progresso !== undefined && (
                            <span>Progresso: {atividade.progresso}%</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedAtividade && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <div className="text-xs theme-text-secondary mb-1">Atividade selecionada:</div>
                <div className="text-sm font-medium theme-text">{selectedAtividade.nome}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-1">
                Peso do Vínculo (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={peso}
                  onChange={(e) => setPeso(parseInt(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={peso}
                  onChange={(e) => setPeso(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 px-3 py-2 text-sm border rounded-lg theme-text text-center"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <p className="mt-1 text-xs theme-text-secondary">
                Define quanto este item contribui para o progresso da atividade vinculada
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
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
              disabled={isLoading || !selectedAtividadeId}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: '#374151' }}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar Vínculo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TakeoffVinculoModal;
