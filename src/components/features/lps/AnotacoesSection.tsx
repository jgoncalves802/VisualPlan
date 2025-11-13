/**
 * AnotacoesSection - Componente de seção de anotações do LPS
 * Lista de anotações/tarefas com responsáveis e status
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnotacaoLPS, RestricaoLPS } from '../../../types/lps';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

interface AnotacoesSectionProps {
  anotacoes: AnotacaoLPS[];
  restricoes: RestricaoLPS[];
  onAddAnotacao?: (descricao: string) => void;
  onEditAnotacao?: (id: string, descricao: string) => void;
  onDeleteAnotacao?: (id: string) => void;
  onAddRestricao?: (restricao: Omit<RestricaoLPS, 'id'>) => void;
  onEditRestricao?: (id: string, restricao: Partial<RestricaoLPS>) => void;
  onDeleteRestricao?: (id: string) => void;
}

export const AnotacoesSection: React.FC<AnotacoesSectionProps> = ({
  anotacoes,
  restricoes,
  onAddAnotacao,
  onEditAnotacao,
  onDeleteAnotacao,
  onAddRestricao,
  onEditRestricao,
  onDeleteRestricao,
}) => {
  const [showAddAnotacao, setShowAddAnotacao] = useState(false);
  const [novaAnotacao, setNovaAnotacao] = useState('');
  const [editandoAnotacao, setEditandoAnotacao] = useState<string | null>(null);
  const [textoEditando, setTextoEditando] = useState('');

  // Handler para adicionar anotação
  const handleAddAnotacao = () => {
    if (novaAnotacao.trim() && onAddAnotacao) {
      onAddAnotacao(novaAnotacao.trim());
      setNovaAnotacao('');
      setShowAddAnotacao(false);
    }
  };

  // Handler para editar anotação
  const handleEditAnotacao = (id: string, descricao: string) => {
    setEditandoAnotacao(id);
    setTextoEditando(descricao);
  };

  // Handler para salvar edição
  const handleSaveEdit = () => {
    if (editandoAnotacao && textoEditando.trim() && onEditAnotacao) {
      onEditAnotacao(editandoAnotacao, textoEditando.trim());
      setEditandoAnotacao(null);
      setTextoEditando('');
    }
  };

  // Handler para cancelar edição
  const handleCancelEdit = () => {
    setEditandoAnotacao(null);
    setTextoEditando('');
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-300">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-2">
        <h3 className="text-lg font-bold uppercase">Anotações</h3>
      </div>

      {/* Lista de anotações */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {anotacoes.map((anotacao) => (
          <div
            key={anotacao.id}
            className="bg-gray-50 border border-gray-200 rounded p-3 hover:bg-gray-100 transition-colors"
          >
            {editandoAnotacao === anotacao.id ? (
              <div className="space-y-2">
                <textarea
                  value={textoEditando}
                  onChange={(e) => setTextoEditando(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-900">* {anotacao.descricao}</div>
                  {anotacao.responsavel && (
                    <div className="text-xs text-gray-500 mt-1">
                      Responsável: {anotacao.responsavel}
                    </div>
                  )}
                  {anotacao.data_criacao && (
                    <div className="text-xs text-gray-400 mt-1">
                      {format(anotacao.data_criacao, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleEditAnotacao(anotacao.id, anotacao.descricao)}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-200 rounded"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteAnotacao?.(anotacao.id)}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-gray-200 rounded"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Botão para adicionar anotação */}
        {showAddAnotacao ? (
          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <textarea
              value={novaAnotacao}
              onChange={(e) => setNovaAnotacao(e.target.value)}
              placeholder="Digite a anotação..."
              className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
              rows={3}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleAddAnotacao();
                }
                if (e.key === 'Escape') {
                  setShowAddAnotacao(false);
                  setNovaAnotacao('');
                }
              }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddAnotacao}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setShowAddAnotacao(false);
                  setNovaAnotacao('');
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddAnotacao(true)}
            className="w-full p-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            <span className="text-sm">Adicionar Anotação</span>
          </button>
        )}
      </div>
    </div>
  );
};

