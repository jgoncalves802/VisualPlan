/**
 * WBSSection - Componente de seção de WBS (Work Breakdown Structure)
 * Exibe a estrutura hierárquica das fases do projeto
 * Substitui a seção de Anotações no painel lateral do LPS
 */

import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Package, FileText } from 'lucide-react';
import { WBSLPS, AtividadeLPS, RestricaoLPS } from '../../../types/lps';

interface WBSSectionProps {
  wbsList: WBSLPS[];
  atividades: AtividadeLPS[];
  restricoes: RestricaoLPS[];
  selectedWbs?: WBSLPS | null;
  onSelectWbs?: (wbs: WBSLPS | null) => void;
  onOpenAnotacoes?: () => void;
}

interface WBSTreeItemProps {
  wbs: WBSLPS;
  children?: WBSLPS[];
  allChildren: WBSLPS[];
  atividades: AtividadeLPS[];
  restricoes: RestricaoLPS[];
  level: number;
  isSelected: boolean;
  onSelect: (wbs: WBSLPS) => void;
}

const WBSTreeItem: React.FC<WBSTreeItemProps> = ({
  wbs,
  children = [],
  allChildren,
  atividades,
  restricoes,
  level,
  isSelected,
  onSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = children.length > 0;

  const atividadesCount = atividades.filter((a) => a.wbs_id === wbs.id).length;
  const restricoesCount = restricoes.filter((r) => r.wbs_id === wbs.id).length;

  const getChildrenOfWbs = (parentId: string) => {
    return allChildren.filter((w) => w.parent_id === parentId);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded transition-colors ${
          isSelected
            ? 'bg-blue-100 text-blue-800'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onSelect(wbs)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-gray-500" />
            ) : (
              <ChevronRight size={14} className="text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {hasChildren ? (
          isExpanded ? (
            <FolderOpen size={16} style={{ color: wbs.cor || '#6B7280' }} />
          ) : (
            <Folder size={16} style={{ color: wbs.cor || '#6B7280' }} />
          )
        ) : (
          <Package size={16} style={{ color: wbs.cor || '#6B7280' }} />
        )}

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-gray-500">{wbs.codigo}</span>
          <span className="text-sm truncate">{wbs.nome}</span>
        </div>

        <div className="flex items-center gap-1">
          {atividadesCount > 0 && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              {atividadesCount}
            </span>
          )}
          {restricoesCount > 0 && (
            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
              {restricoesCount}
            </span>
          )}
        </div>

        {wbs.progresso !== undefined && (
          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${wbs.progresso}%`,
                backgroundColor: wbs.cor || '#10B981',
              }}
            />
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <WBSTreeItem
              key={child.id}
              wbs={child}
              children={getChildrenOfWbs(child.id)}
              allChildren={allChildren}
              atividades={atividades}
              restricoes={restricoes}
              level={level + 1}
              isSelected={isSelected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const WBSSection: React.FC<WBSSectionProps> = ({
  wbsList,
  atividades,
  restricoes,
  selectedWbs,
  onSelectWbs,
  onOpenAnotacoes,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(selectedWbs?.id);

  const selectedId = selectedWbs !== undefined ? selectedWbs?.id : internalSelectedId;

  const rootWbs = useMemo(() => {
    return wbsList.filter((w) => !w.parent_id).sort((a, b) => a.ordem - b.ordem);
  }, [wbsList]);

  const getChildrenOfWbs = (parentId: string) => {
    return wbsList.filter((w) => w.parent_id === parentId).sort((a, b) => a.ordem - b.ordem);
  };

  const handleSelect = (wbs: WBSLPS) => {
    const newId = selectedId === wbs.id ? undefined : wbs.id;
    setInternalSelectedId(newId);
    if (onSelectWbs) {
      onSelectWbs(newId ? wbs : null);
    }
  };

  const handleClearFilter = () => {
    setInternalSelectedId(undefined);
    if (onSelectWbs) {
      onSelectWbs(null);
    }
  };

  const totalAtividades = atividades.length;
  const atividadesComWbs = atividades.filter((a) => a.wbs_id).length;
  const totalRestricoes = restricoes.length;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-300">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
        <h3 className="text-lg font-bold uppercase">Fases do Projeto (WBS)</h3>
        {onOpenAnotacoes && (
          <button
            onClick={onOpenAnotacoes}
            className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-400 rounded text-sm transition-colors"
            title="Gerenciar Anotações"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">Anotações</span>
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="px-3 py-2 bg-gray-50 border-b text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {atividadesComWbs}/{totalAtividades} atividades
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            {totalRestricoes} restrições
          </span>
        </div>
        {selectedId && (
          <button
            onClick={handleClearFilter}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* WBS Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {rootWbs.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            Nenhuma WBS cadastrada
          </div>
        ) : (
          rootWbs.map((wbs) => (
            <WBSTreeItem
              key={wbs.id}
              wbs={wbs}
              children={getChildrenOfWbs(wbs.id)}
              allChildren={wbsList}
              atividades={atividades}
              restricoes={restricoes}
              level={0}
              isSelected={selectedId === wbs.id}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>

      {/* Legend */}
      <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">N</span>
            Atividades
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">N</span>
            Restrições
          </span>
        </div>
      </div>
    </div>
  );
};
