import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { takeoffService } from '../../../services/takeoffService';
import type { TakeoffItem, CreateItemDTO, UpdateItemDTO, TakeoffColunaConfig, StatusItem } from '../../../types/takeoff.types';

const UNIDADES_COMUNS = ['m', 'm²', 'm³', 'un', 'kg', 'ton', 'pç', 'cj', 'vb', 'ml'];
const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

interface TakeoffItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: TakeoffItem) => void;
  item?: TakeoffItem | null;
  mapaId: string;
  disciplinaId?: string | null;
}

const TakeoffItemModal: React.FC<TakeoffItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  mapaId,
  disciplinaId,
}) => {
  const [formData, setFormData] = useState({
    descricao: '',
    unidade: 'm',
    qtdPrevista: 0,
    qtdTakeoff: 0,
    qtdExecutada: 0,
    pesoUnitario: 0,
    custoUnitario: 0,
    area: '',
    edificacao: '',
    tag: '',
    linha: '',
    tipoMaterial: '',
    dimensao: '',
    status: 'pendente' as StatusItem,
    observacoes: '',
    valoresCustom: {} as Record<string, string>,
  });
  const [colunasCustom, setColunasCustom] = useState<TakeoffColunaConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!item;

  useEffect(() => {
    const loadColunasCustom = async () => {
      if (disciplinaId) {
        const colunas = await takeoffService.getColunasConfig(disciplinaId);
        setColunasCustom(colunas);
      }
    };
    if (isOpen && disciplinaId) {
      loadColunasCustom();
    }
  }, [disciplinaId, isOpen]);

  useEffect(() => {
    if (item) {
      setFormData({
        descricao: item.descricao,
        unidade: item.unidade,
        qtdPrevista: item.qtdPrevista,
        qtdTakeoff: item.qtdTakeoff,
        qtdExecutada: item.qtdExecutada,
        pesoUnitario: item.pesoUnitario,
        custoUnitario: item.custoUnitario,
        area: item.area || '',
        edificacao: item.edificacao || '',
        tag: item.tag || '',
        linha: item.linha || '',
        tipoMaterial: item.tipoMaterial || '',
        dimensao: item.dimensao || '',
        status: item.status,
        observacoes: item.observacoes || '',
        valoresCustom: item.valoresCustom || {},
      });
    } else {
      setFormData({
        descricao: '',
        unidade: 'm',
        qtdPrevista: 0,
        qtdTakeoff: 0,
        qtdExecutada: 0,
        pesoUnitario: 0,
        custoUnitario: 0,
        area: '',
        edificacao: '',
        tag: '',
        linha: '',
        tipoMaterial: '',
        dimensao: '',
        status: 'pendente',
        observacoes: '',
        valoresCustom: {},
      });
    }
    setError(null);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.descricao.trim()) {
      setError('Descrição é obrigatória');
      return;
    }

    setIsLoading(true);
    try {
      let result: TakeoffItem | null;
      
      if (isEditing && item) {
        const updateData: UpdateItemDTO = {
          descricao: formData.descricao,
          unidade: formData.unidade,
          qtdPrevista: formData.qtdPrevista,
          qtdTakeoff: formData.qtdTakeoff,
          qtdExecutada: formData.qtdExecutada,
          pesoUnitario: formData.pesoUnitario,
          custoUnitario: formData.custoUnitario,
          area: formData.area || undefined,
          edificacao: formData.edificacao || undefined,
          tag: formData.tag || undefined,
          linha: formData.linha || undefined,
          tipoMaterial: formData.tipoMaterial || undefined,
          dimensao: formData.dimensao || undefined,
          status: formData.status,
          observacoes: formData.observacoes || undefined,
          valoresCustom: Object.keys(formData.valoresCustom).length > 0 ? formData.valoresCustom : undefined,
        };
        result = await takeoffService.updateItem(item.id, updateData);
      } else {
        const createData: CreateItemDTO = {
          mapaId,
          descricao: formData.descricao,
          unidade: formData.unidade,
          qtdPrevista: formData.qtdPrevista,
          qtdTakeoff: formData.qtdTakeoff,
          pesoUnitario: formData.pesoUnitario,
          custoUnitario: formData.custoUnitario,
          area: formData.area || undefined,
          edificacao: formData.edificacao || undefined,
          tag: formData.tag || undefined,
          linha: formData.linha || undefined,
          tipoMaterial: formData.tipoMaterial || undefined,
          dimensao: formData.dimensao || undefined,
          observacoes: formData.observacoes || undefined,
          valoresCustom: Object.keys(formData.valoresCustom).length > 0 ? formData.valoresCustom : undefined,
        };
        result = await takeoffService.createItem(createData);
      }

      if (result) {
        onSave(result);
        onClose();
      } else {
        setError('Erro ao salvar item. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao salvar item:', err);
      setError('Erro ao salvar item. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCustomValueChange = (codigo: string, valor: string) => {
    setFormData({
      ...formData,
      valoresCustom: { ...formData.valoresCustom, [codigo]: valor },
    });
  };

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
          <h3 className="text-lg font-semibold theme-text">
            {isEditing ? 'Editar Item' : 'Novo Item de Take-off'}
          </h3>
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

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-1">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Tubo Aço Carbono ASTM A106 Gr.B"
                className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Unidade
                </label>
                <select
                  value={formData.unidade}
                  onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                >
                  {UNIDADES_COMUNS.map((un) => (
                    <option key={un} value={un}>{un}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Qtd. Prevista
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.qtdPrevista}
                  onChange={(e) => setFormData({ ...formData, qtdPrevista: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Qtd. Take-off
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.qtdTakeoff}
                  onChange={(e) => setFormData({ ...formData, qtdTakeoff: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    Qtd. Executada
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.qtdExecutada}
                    onChange={(e) => setFormData({ ...formData, qtdExecutada: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                    style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Peso Unit. (kg)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.pesoUnitario}
                  onChange={(e) => setFormData({ ...formData, pesoUnitario: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Custo Unit. (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.custoUnitario}
                  onChange={(e) => setFormData({ ...formData, custoUnitario: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                    className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                    style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Área
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="Ex: A01"
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Edificação
                </label>
                <input
                  type="text"
                  value={formData.edificacao}
                  onChange={(e) => setFormData({ ...formData, edificacao: e.target.value })}
                  placeholder="Ex: Prédio 01"
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  TAG
                </label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="Ex: TUB-001"
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Linha
                </label>
                <input
                  type="text"
                  value={formData.linha}
                  onChange={(e) => setFormData({ ...formData, linha: e.target.value })}
                  placeholder="Ex: 01-P-001"
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Tipo Material
                </label>
                <input
                  type="text"
                  value={formData.tipoMaterial}
                  onChange={(e) => setFormData({ ...formData, tipoMaterial: e.target.value })}
                  placeholder="Ex: Aço Carbono"
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1">
                  Dimensão
                </label>
                <input
                  type="text"
                  value={formData.dimensao}
                  onChange={(e) => setFormData({ ...formData, dimensao: e.target.value })}
                  placeholder="Ex: 6&quot; SCH 40"
                  className="w-full px-3 py-2 text-sm border rounded-lg theme-text"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            {colunasCustom.length > 0 && (
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">
                  Campos Customizados da Disciplina
                </label>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                  {colunasCustom.map((col) => (
                    <div key={col.id}>
                      <label className="block text-xs theme-text-secondary mb-1">
                        {col.nome} {col.unidade ? `(${col.unidade})` : ''}
                      </label>
                      {col.tipo === 'select' && col.opcoes ? (
                        <select
                          value={formData.valoresCustom[col.codigo] || ''}
                          onChange={(e) => handleCustomValueChange(col.codigo, e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border rounded theme-text"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        >
                          <option value="">Selecione</option>
                          {col.opcoes.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={col.tipo === 'number' || col.tipo === 'decimal' ? 'number' : 'text'}
                          step={col.tipo === 'decimal' ? Math.pow(10, -col.casasDecimais) : undefined}
                          value={formData.valoresCustom[col.codigo] || ''}
                          onChange={(e) => handleCustomValueChange(col.codigo, e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border rounded theme-text"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais (opcional)"
                rows={2}
                className="w-full px-3 py-2 text-sm border rounded-lg theme-text resize-none"
                style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
              />
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
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: '#374151' }}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TakeoffItemModal;
