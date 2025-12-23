import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTakeoffStore } from '../../../stores/takeoffStore';

interface TakeoffMapaModalProps {
  projetoId: string;
  disciplinaId: string;
  onClose: () => void;
}

const TakeoffMapaModal: React.FC<TakeoffMapaModalProps> = ({ projetoId, disciplinaId, onClose }) => {
  const { createMapa, disciplinas } = useTakeoffStore();
  const [nome, setNome] = useState('');
  const [versao, setVersao] = useState('1.0');
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disciplina = disciplinas.find(d => d.id === disciplinaId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setIsSubmitting(true);
    try {
      const mapa = await createMapa({
        projetoId,
        disciplinaId,
        nome: nome.trim(),
        versao,
        descricao: descricao.trim() || undefined,
      });

      if (mapa) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Novo Mapa de Controle</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disciplina
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: disciplina?.cor || '#3B82F6' }}
              />
              <span className="text-sm text-gray-700">{disciplina?.nome}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Mapa *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Mapa de Controle - Área 2300"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Versão
            </label>
            <input
              type="text"
              value={versao}
              onChange={(e) => setVersao(e.target.value)}
              placeholder="1.0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional do mapa..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !nome.trim()}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar Mapa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TakeoffMapaModal;
