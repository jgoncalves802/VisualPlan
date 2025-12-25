import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { takeoffService } from '../../../services/takeoffService';
import type { TakeoffDisciplina, CreateDisciplinaDTO, UpdateDisciplinaDTO } from '../../../types/takeoff.types';

const CORES_DISPONIVEIS = [
  { nome: 'Azul', valor: '#3B82F6' },
  { nome: 'Âmbar', valor: '#F59E0B' },
  { nome: 'Vermelho', valor: '#EF4444' },
  { nome: 'Verde', valor: '#10B981' },
  { nome: 'Ciano', valor: '#06B6D4' },
  { nome: 'Roxo', valor: '#8B5CF6' },
  { nome: 'Rosa', valor: '#EC4899' },
  { nome: 'Laranja', valor: '#F97316' },
  { nome: 'Lima', valor: '#84CC16' },
  { nome: 'Índigo', valor: '#6366F1' },
];

const ICONES_DISPONIVEIS = [
  { nome: 'Tubo', valor: 'tube' },
  { nome: 'Raio', valor: 'zap' },
  { nome: 'Martelo', valor: 'hammer' },
  { nome: 'Suporte', valor: 'git-branch' },
  { nome: 'Prédio', valor: 'building' },
  { nome: 'Engrenagem', valor: 'settings' },
  { nome: 'Caixa', valor: 'box' },
  { nome: 'Ferramenta', valor: 'wrench' },
];

interface TakeoffDisciplinaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (disciplina: TakeoffDisciplina) => void;
  disciplina?: TakeoffDisciplina | null;
  empresaId: string;
}

const TakeoffDisciplinaModal: React.FC<TakeoffDisciplinaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  disciplina,
  empresaId,
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    descricao: '',
    cor: '#3B82F6',
    icone: 'box',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!disciplina;

  useEffect(() => {
    if (disciplina) {
      setFormData({
        nome: disciplina.nome,
        codigo: disciplina.codigo,
        descricao: disciplina.descricao || '',
        cor: disciplina.cor,
        icone: disciplina.icone,
      });
    } else {
      setFormData({
        nome: '',
        codigo: '',
        descricao: '',
        cor: '#3B82F6',
        icone: 'box',
      });
    }
    setError(null);
  }, [disciplina, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    if (!formData.codigo.trim()) {
      setError('Código é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      let result: TakeoffDisciplina | null;
      
      if (isEditing && disciplina) {
        const updateData: UpdateDisciplinaDTO = {
          nome: formData.nome,
          codigo: formData.codigo,
          descricao: formData.descricao || undefined,
          cor: formData.cor,
          icone: formData.icone,
        };
        result = await takeoffService.updateDisciplina(disciplina.id, updateData);
      } else {
        const createData: CreateDisciplinaDTO = {
          empresaId,
          nome: formData.nome,
          codigo: formData.codigo.toUpperCase(),
          descricao: formData.descricao || undefined,
          cor: formData.cor,
          icone: formData.icone,
        };
        result = await takeoffService.createDisciplina(createData);
      }

      if (result) {
        onSave(result);
        onClose();
      } else {
        setError('Erro ao salvar disciplina. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao salvar disciplina:', err);
      setError('Erro ao salvar disciplina. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
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
        className="w-full max-w-lg rounded-lg shadow-xl theme-surface"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-semibold theme-text">
            {isEditing ? 'Editar Disciplina' : 'Nova Disciplina'}
          </h3>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Tubulação"
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="Ex: TUB"
                  maxLength={5}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text uppercase"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-1">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição da disciplina (opcional)"
                rows={2}
                className="w-full px-3 py-2 text-sm border rounded-lg theme-text resize-none"
                style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                Cor
              </label>
              <div className="flex flex-wrap gap-2">
                {CORES_DISPONIVEIS.map((cor) => (
                  <button
                    key={cor.valor}
                    type="button"
                    onClick={() => setFormData({ ...formData, cor: cor.valor })}
                    className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                    style={{ 
                      backgroundColor: cor.valor,
                      border: formData.cor === cor.valor ? '3px solid var(--color-text)' : '2px solid transparent',
                      boxShadow: formData.cor === cor.valor ? '0 0 0 2px var(--color-surface)' : 'none'
                    }}
                    title={cor.nome}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                Ícone
              </label>
              <div className="flex flex-wrap gap-2">
                {ICONES_DISPONIVEIS.map((icone) => (
                  <button
                    key={icone.valor}
                    type="button"
                    onClick={() => setFormData({ ...formData, icone: icone.valor })}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: formData.icone === icone.valor ? 'var(--color-text)' : 'var(--color-surface-secondary)',
                      color: formData.icone === icone.valor ? 'var(--color-surface)' : 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {icone.nome}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: formData.cor }}
              >
                {formData.codigo.substring(0, 2) || '?'}
              </div>
              <div>
                <div className="text-sm font-medium theme-text">{formData.nome || 'Nome da Disciplina'}</div>
                <div className="text-xs theme-text-secondary">{formData.codigo || 'CÓD'}</div>
              </div>
            </div>
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
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: '#374151' }}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Disciplina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TakeoffDisciplinaModal;
