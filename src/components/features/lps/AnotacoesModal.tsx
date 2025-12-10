/**
 * AnotacoesModal - Modal para gerenciamento de anotações do LPS
 * Exibe lista de anotações com opções de adicionar, editar e excluir
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnotacaoLPS } from '../../../types/lps';
import { X, Plus, Edit2, Trash2, FileText } from 'lucide-react';

interface AnotacoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  anotacoes: AnotacaoLPS[];
  onAddAnotacao?: (descricao: string) => void;
  onEditAnotacao?: (id: string, descricao: string) => void;
  onDeleteAnotacao?: (id: string) => void;
}

export const AnotacoesModal: React.FC<AnotacoesModalProps> = ({
  isOpen,
  onClose,
  anotacoes,
  onAddAnotacao,
  onEditAnotacao,
  onDeleteAnotacao,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [novaAnotacao, setNovaAnotacao] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEditando, setTextoEditando] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (novaAnotacao.trim() && onAddAnotacao) {
      onAddAnotacao(novaAnotacao.trim());
      setNovaAnotacao('');
      setShowAddForm(false);
    }
  };

  const handleStartEdit = (id: string, descricao: string) => {
    setEditandoId(id);
    setTextoEditando(descricao);
  };

  const handleSaveEdit = () => {
    if (editandoId && textoEditando.trim() && onEditAnotacao) {
      onEditAnotacao(editandoId, textoEditando.trim());
      setEditandoId(null);
      setTextoEditando('');
    }
  };

  const handleCancelEdit = () => {
    setEditandoId(null);
    setTextoEditando('');
  };

  const handleDelete = (id: string) => {
    if (onDeleteAnotacao && confirm('Tem certeza que deseja excluir esta anotação?')) {
      onDeleteAnotacao(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} />
            <h2 className="text-lg font-bold">Gerenciar Anotações</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-500 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {anotacoes.length} anotação(ões) registrada(s)
          </span>
          {onAddAnotacao && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
            >
              <Plus size={14} />
              Nova Anotação
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {showAddForm && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
              <textarea
                value={novaAnotacao}
                onChange={(e) => setNovaAnotacao(e.target.value)}
                placeholder="Digite a descrição da anotação..."
                className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={!novaAnotacao.trim()}
                  className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNovaAnotacao('');
                  }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {anotacoes.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <FileText size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma anotação registrada</p>
              <p className="text-xs mt-1">Clique em "Nova Anotação" para adicionar</p>
            </div>
          ) : (
            anotacoes.map((anotacao) => (
              <div
                key={anotacao.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                {editandoId === anotacao.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={textoEditando}
                      onChange={(e) => setTextoEditando(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={!textoEditando.trim()}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{anotacao.descricao}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {anotacao.responsavel && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Responsável:</span>
                            {anotacao.responsavel}
                          </span>
                        )}
                        {anotacao.data_criacao && (
                          <span>
                            {format(anotacao.data_criacao, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      {anotacao.tags && anotacao.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {anotacao.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {onEditAnotacao && (
                        <button
                          onClick={() => handleStartEdit(anotacao.id, anotacao.descricao)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {onDeleteAnotacao && (
                        <button
                          onClick={() => handleDelete(anotacao.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
