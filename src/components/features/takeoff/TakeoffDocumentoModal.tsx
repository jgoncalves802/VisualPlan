import React, { useState, useEffect } from 'react';
import { X, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { takeoffService } from '../../../services/takeoffService';
import type { TakeoffDocumento, CreateDocumentoDTO, TakeoffDisciplina } from '../../../types/takeoff.types';

const TIPOS_DOCUMENTO = [
  { value: 'isometrico', label: 'Isométrico' },
  { value: 'diagrama', label: 'Diagrama' },
  { value: 'layout', label: 'Layout' },
  { value: 'fabricacao', label: 'Fabricação' },
  { value: 'montagem', label: 'Montagem' },
  { value: 'detalhamento', label: 'Detalhamento' },
  { value: 'lista_material', label: 'Lista de Material' },
  { value: 'outros', label: 'Outros' },
];

const STATUS_OPTIONS = [
  { value: 'emitido', label: 'Emitido' },
  { value: 'em_revisao', label: 'Em Revisão' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'as_built', label: 'As-Built' },
];

interface TakeoffDocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (documento: TakeoffDocumento) => void;
  projetoId: string;
  disciplinas: TakeoffDisciplina[];
  selectedDisciplinaId?: string | null;
  documento?: TakeoffDocumento | null;
}

const TakeoffDocumentoModal: React.FC<TakeoffDocumentoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projetoId,
  disciplinas,
  selectedDisciplinaId,
  documento,
}) => {
  const isEditing = !!documento;
  const [formData, setFormData] = useState({
    codigo: '',
    titulo: '',
    disciplinaId: selectedDisciplinaId || '',
    revisao: 'A',
    tipo: 'isometrico',
    status: 'emitido',
    dataEmissao: format(new Date(), 'yyyy-MM-dd'),
    observacoes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (documento) {
        setFormData({
          codigo: documento.codigo || '',
          titulo: documento.titulo || '',
          disciplinaId: documento.disciplinaId || selectedDisciplinaId || '',
          revisao: documento.revisao || 'A',
          tipo: documento.tipo || 'isometrico',
          status: documento.status || 'emitido',
          dataEmissao: documento.dataEmissao ? format(new Date(documento.dataEmissao), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          observacoes: documento.observacoes || '',
        });
      } else {
        setFormData({
          codigo: '',
          titulo: '',
          disciplinaId: selectedDisciplinaId || '',
          revisao: 'A',
          tipo: 'isometrico',
          status: 'emitido',
          dataEmissao: format(new Date(), 'yyyy-MM-dd'),
          observacoes: '',
        });
      }
      setError(null);
    }
  }, [isOpen, selectedDisciplinaId, documento]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.codigo.trim()) {
      setError('Código é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && documento) {
        const updateData = {
          disciplinaId: formData.disciplinaId || null,
          codigo: formData.codigo,
          titulo: formData.titulo || null,
          revisao: formData.revisao,
          tipo: formData.tipo,
          status: formData.status,
          dataEmissao: new Date(formData.dataEmissao),
          observacoes: formData.observacoes || null,
        };

        const result = await takeoffService.updateDocumento(documento.id, projetoId, updateData);

        if (result) {
          onSave(result);
          onClose();
        } else {
          setError('Erro ao atualizar documento. Tente novamente.');
        }
      } else {
        const createData: CreateDocumentoDTO = {
          projetoId,
          disciplinaId: formData.disciplinaId || undefined,
          codigo: formData.codigo,
          titulo: formData.titulo || undefined,
          revisao: formData.revisao,
          tipo: formData.tipo,
          dataEmissao: new Date(formData.dataEmissao),
          observacoes: formData.observacoes || undefined,
        };

        const result = await takeoffService.createDocumento(createData);

        if (result) {
          onSave(result);
          onClose();
        } else {
          setError('Erro ao cadastrar documento. Tente novamente.');
        }
      }
    } catch (err) {
      console.error('Erro ao salvar documento:', err);
      setError(isEditing ? 'Erro ao atualizar documento. Tente novamente.' : 'Erro ao cadastrar documento. Tente novamente.');
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
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 theme-text-secondary" />
            <h3 className="text-lg font-semibold theme-text">{isEditing ? 'Editar Documento' : 'Cadastrar Documento'}</h3>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="Ex: ISO-TUB-001"
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text uppercase"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Revisão
                </label>
                <input
                  type="text"
                  value={formData.revisao}
                  onChange={(e) => setFormData({ ...formData, revisao: e.target.value.toUpperCase() })}
                  placeholder="Ex: A"
                  maxLength={5}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text uppercase"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-1">
                Título
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Isométrico Linha 01-P-001"
                className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Disciplina
                </label>
                <select
                  value={formData.disciplinaId}
                  onChange={(e) => setFormData({ ...formData, disciplinaId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                >
                  <option value="">Todas</option>
                  {disciplinas.map((disc) => (
                    <option key={disc.id} value={disc.id}>
                      {disc.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                >
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Data Emissão
                </label>
                <input
                  type="date"
                  value={formData.dataEmissao}
                  onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações (opcional)"
                rows={2}
                className="w-full px-3 py-2 text-sm border rounded-lg theme-text resize-none"
                style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
              />
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
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TakeoffDocumentoModal;
