import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Target, Calendar, Check, Plus, Trash2, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Baseline {
  id: string;
  numero: number;
  nome: string;
  descricao?: string;
  dataCaptura: string;
  isPrimary: boolean;
  createdBy?: string;
  taskCount?: number;
}

interface BaselineSelectorProps {
  baselines: Baseline[];
  selectedBaseline: Baseline | null;
  onSelect: (baseline: Baseline | null) => void;
  onCreateBaseline?: () => void;
  onDeleteBaseline?: (id: string) => void;
  onSetPrimary?: (id: string) => void;
  loading?: boolean;
  className?: string;
}

export function BaselineSelector({
  baselines,
  selectedBaseline,
  onSelect,
  onCreateBaseline,
  onDeleteBaseline,
  onSetPrimary,
  loading = false,
  className = ''
}: BaselineSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const primaryBaseline = baselines.find(b => b.isPrimary);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        title="Selecionar baseline"
      >
        <Target className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-gray-700">
          {loading ? 'Carregando...' : selectedBaseline ? `BL${selectedBaseline.numero}` : 'Sem Baseline'}
        </span>
        {selectedBaseline?.isPrimary && (
          <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">
            Primary
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !loading && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Baselines do Projeto</h3>
              {onCreateBaseline && (
                <button
                  onClick={() => {
                    onCreateBaseline();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Baselines permitem comparar o progresso com o plano original
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            <div
              className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                !selectedBaseline 
                  ? 'bg-blue-50 border-l-4 border-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Target className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <span className="font-medium text-gray-700">Sem Baseline</span>
                  <p className="text-xs text-gray-500">Visualização atual do cronograma</p>
                </div>
              </div>
              {!selectedBaseline && (
                <Check className="w-5 h-5 text-blue-500" />
              )}
            </div>

            {baselines.map(baseline => (
              <div
                key={baseline.id}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group ${
                  selectedBaseline?.id === baseline.id 
                    ? 'bg-purple-50 border-l-4 border-purple-500' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  onSelect(baseline);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      baseline.isPrimary 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <span className="font-bold text-sm">{baseline.numero}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{baseline.nome}</span>
                      {baseline.isPrimary && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {format(new Date(baseline.dataCaptura), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                      {baseline.taskCount !== undefined && (
                        <span className="text-gray-400">
                          | {baseline.taskCount} tarefas
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onSetPrimary && !baseline.isPrimary && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetPrimary(baseline.id);
                      }}
                      className="p-1.5 text-purple-600 hover:bg-purple-100 rounded"
                      title="Definir como Primary"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  )}
                  {onDeleteBaseline && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Excluir baseline "${baseline.nome}"?`)) {
                          onDeleteBaseline(baseline.id);
                        }
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                      title="Excluir baseline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {selectedBaseline?.id === baseline.id && (
                    <Check className="w-5 h-5 text-purple-500 ml-1" />
                  )}
                </div>
              </div>
            ))}

            {baselines.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma baseline criada</p>
                <p className="text-xs mt-1">Crie uma baseline para rastrear variações</p>
              </div>
            )}
          </div>

          {primaryBaseline && selectedBaseline?.id !== primaryBaseline.id && (
            <div className="p-3 border-t border-gray-100 bg-purple-50">
              <button
                onClick={() => {
                  onSelect(primaryBaseline);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 text-sm text-purple-700 font-medium"
              >
                <Lock className="w-4 h-4" />
                Usar Primary Baseline (BL{primaryBaseline.numero})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
