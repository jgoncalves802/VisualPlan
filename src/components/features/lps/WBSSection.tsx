/**
 * WBSSection - Componente de seção de WBS (Work Breakdown Structure)
 * Exibe a estrutura hierárquica das fases do projeto em layout vertical
 * Similar ao conceito de fases da segunda imagem rotacionada 90 graus
 */

import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Building2, FileText, Circle } from 'lucide-react';
import { WBSLPS, AtividadeLPS, RestricaoLPS } from '../../../types/lps';

interface WBSSectionProps {
  wbsList: WBSLPS[];
  atividades: AtividadeLPS[];
  restricoes: RestricaoLPS[];
  selectedWbs?: WBSLPS | null;
  onSelectWbs?: (wbs: WBSLPS | null) => void;
  onOpenAnotacoes?: () => void;
}

interface WBSPhaseItemProps {
  wbs: WBSLPS;
  children: WBSLPS[];
  allWbs: WBSLPS[];
  atividades: AtividadeLPS[];
  restricoes: RestricaoLPS[];
  selectedId?: string;
  onSelect: (wbs: WBSLPS) => void;
}

const WBSPhaseItem: React.FC<WBSPhaseItemProps> = ({
  wbs,
  children,
  allWbs,
  atividades,
  restricoes,
  selectedId,
  onSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === wbs.id;

  const getAllDescendantIds = (parentId: string): string[] => {
    const directChildren = allWbs.filter((w) => w.parent_id === parentId);
    let ids: string[] = [parentId];
    directChildren.forEach((child) => {
      ids = [...ids, ...getAllDescendantIds(child.id)];
    });
    return ids;
  };

  const descendantIds = getAllDescendantIds(wbs.id);
  const atividadesCount = atividades.filter((a) => descendantIds.includes(a.wbs_id || '')).length;
  const restricoesCount = restricoes.filter((r) => descendantIds.includes(r.wbs_id || '')).length;

  const getChildrenOfWbs = (parentId: string) => {
    return allWbs.filter((w) => w.parent_id === parentId).sort((a, b) => a.ordem - b.ordem);
  };

  const getNivelLabel = (nivel: number) => {
    if (nivel === 0) return 'Projeto';
    if (nivel === 1) return 'Fase';
    return 'Pacote';
  };

  return (
    <div className="mb-1">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'bg-blue-100 border-l-4 border-blue-600'
            : 'hover:bg-gray-50 border-l-4 border-transparent'
        }`}
        onClick={() => onSelect(wbs)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-500" />
            ) : (
              <ChevronRight size={16} className="text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}

        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: wbs.cor || '#6B7280' }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">{wbs.codigo}</span>
            <span
              className={`text-sm font-medium truncate ${
                isSelected ? 'text-blue-900' : 'text-gray-800'
              }`}
            >
              {wbs.nome}
            </span>
          </div>
          {wbs.nivel <= 1 && (
            <div className="text-xs text-gray-400 mt-0.5">{getNivelLabel(wbs.nivel)}</div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {atividadesCount > 0 && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              {atividadesCount}
            </span>
          )}
          {restricoesCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
              {restricoesCount}
            </span>
          )}
        </div>

        {wbs.progresso !== undefined && wbs.nivel <= 1 && (
          <div className="w-10 flex-shrink-0">
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${wbs.progresso}%`,
                  backgroundColor: wbs.cor || '#10B981',
                }}
              />
            </div>
            <div className="text-[10px] text-gray-400 text-center mt-0.5">{wbs.progresso}%</div>
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-4 pl-2 border-l-2 border-gray-200">
          {children.map((child) => (
            <WBSPhaseItem
              key={child.id}
              wbs={child}
              children={getChildrenOfWbs(child.id)}
              allWbs={allWbs}
              atividades={atividades}
              restricoes={restricoes}
              selectedId={selectedId}
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
  const selectedId = selectedWbs?.id;

  const rootWbs = useMemo(() => {
    return wbsList.filter((w) => w.nivel === 0).sort((a, b) => a.ordem - b.ordem);
  }, [wbsList]);

  const level1Wbs = useMemo(() => {
    if (rootWbs.length === 0) {
      return wbsList.filter((w) => w.nivel === 1 && !w.parent_id).sort((a, b) => a.ordem - b.ordem);
    }
    return [];
  }, [wbsList, rootWbs]);

  const getChildrenOfWbs = (parentId: string) => {
    return wbsList.filter((w) => w.parent_id === parentId).sort((a, b) => a.ordem - b.ordem);
  };

  const handleSelect = (wbs: WBSLPS) => {
    if (selectedId === wbs.id) {
      if (onSelectWbs) onSelectWbs(null);
    } else {
      if (onSelectWbs) onSelectWbs(wbs);
    }
  };

  const handleClearFilter = () => {
    if (onSelectWbs) onSelectWbs(null);
  };

  const totalAtividades = atividades.length;
  const atividadesComWbs = atividades.filter((a) => a.wbs_id).length;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={20} />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide">Fases do Projeto</h3>
            <p className="text-xs text-indigo-200">WBS - Estrutura Analítica</p>
          </div>
        </div>
        {onOpenAnotacoes && (
          <button
            onClick={onOpenAnotacoes}
            className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
            title="Gerenciar Anotações"
          >
            <FileText size={12} />
            Notas
          </button>
        )}
      </div>

      <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-gray-600">
          <span className="flex items-center gap-1">
            <Circle size={8} className="fill-green-500 text-green-500" />
            {atividadesComWbs}/{totalAtividades} atividades
          </span>
          <span className="flex items-center gap-1">
            <Circle size={8} className="fill-amber-500 text-amber-500" />
            {restricoes.length} restrições
          </span>
        </div>
        {selectedId && (
          <button
            onClick={handleClearFilter}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {rootWbs.length === 0 && level1Wbs.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            <Building2 size={32} className="mx-auto mb-2 opacity-50" />
            <p>Nenhuma WBS cadastrada</p>
          </div>
        ) : (
          <>
            {rootWbs.map((wbs) => (
              <WBSPhaseItem
                key={wbs.id}
                wbs={wbs}
                children={getChildrenOfWbs(wbs.id)}
                allWbs={wbsList}
                atividades={atividades}
                restricoes={restricoes}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            ))}
            {level1Wbs.map((wbs) => (
              <WBSPhaseItem
                key={wbs.id}
                wbs={wbs}
                children={getChildrenOfWbs(wbs.id)}
                allWbs={wbsList}
                atividades={atividades}
                restricoes={restricoes}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            ))}
          </>
        )}
      </div>

      <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
                N
              </span>
              Atividades
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">
                N
              </span>
              Restrições
            </span>
          </div>
          <span className="text-gray-400">Clique para filtrar</span>
        </div>
      </div>
    </div>
  );
};
