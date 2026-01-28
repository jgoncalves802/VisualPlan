import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Package,
  Layers,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { criteriosMedicaoService } from '../../../services/criteriosMedicaoService';
import type { EAPItemNode } from '../../../types/criteriosMedicao.types';

interface CriteriosMedicaoEAPViewProps {
  mapaId: string;
  mapaNome: string;
  projetoId: string;
}

interface EAPNodeItemProps {
  node: EAPItemNode;
  level: number;
}

const EAPNodeItem: React.FC<EAPNodeItemProps> = ({ node, level }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = level * 20 + 12;

  const getIcon = () => {
    switch (node.tipo) {
      case 'mapa':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'item':
        return <Layers className="w-4 h-4 text-green-600" />;
      case 'etapa':
        return <FileText className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 theme-text-secondary" />;
    }
  };

  const getProgressColor = (percentual: number): string => {
    if (percentual >= 100) return '#10B981';
    if (percentual >= 75) return '#3B82F6';
    if (percentual >= 50) return '#F59E0B';
    if (percentual >= 25) return '#F97316';
    return '#EF4444';
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 hover:opacity-80 transition-opacity cursor-pointer"
        style={{
          paddingLeft: `${paddingLeft}px`,
          backgroundColor: level === 0 ? 'var(--color-surface-secondary)' : 'transparent',
        }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 theme-text-secondary flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 theme-text-secondary flex-shrink-0" />
          )
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}

        {getIcon()}

        <div className="flex-1 min-w-0">
          <span className={`text-sm ${level === 0 ? 'font-medium' : ''} theme-text truncate`}>
            {node.codigo && <span className="text-xs theme-text-secondary mr-2">[{node.codigo}]</span>}
            {node.descricao}
          </span>
          {node.tipo === 'etapa' && node.percentualPeso !== undefined && (
            <span className="text-xs theme-text-secondary ml-2">(Peso: {node.percentualPeso}%)</span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {node.qtdPrevista !== undefined && node.unidade && (
            <span className="text-xs theme-text-secondary">
              {node.qtdPrevista.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {node.unidade}
            </span>
          )}

          <div className="w-20 flex items-center gap-2">
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-border)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(node.percentualAvanco || 0, 100)}%`,
                  backgroundColor: getProgressColor(node.percentualAvanco || 0),
                }}
              />
            </div>
            <span className="text-xs font-medium theme-text min-w-[3rem] text-right">
              {(node.percentualAvanco || 0).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <EAPNodeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const CriteriosMedicaoEAPView: React.FC<CriteriosMedicaoEAPViewProps> = ({
  mapaId,
  mapaNome,
  projetoId,
}) => {
  const [loading, setLoading] = useState(true);
  const [eapData, setEapData] = useState<EAPItemNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEAPData();
  }, [mapaId, projetoId]);

  const loadEAPData = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await criteriosMedicaoService.getEAPMapa(mapaId);
      const data: EAPItemNode = {
        id: mapaId,
        tipo: 'mapa',
        descricao: mapaNome,
        percentualAvanco: items.length > 0 
          ? items.reduce((acc, i) => acc + (i.percentualAvanco || 0), 0) / items.length 
          : 0,
        children: items,
      };
      setEapData(data);
    } catch (err) {
      console.error('Erro ao carregar EAP:', err);
      setError('Erro ao carregar estrutura EAP');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin theme-text-secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!eapData || (eapData.children && eapData.children.length === 0)) {
    return (
      <div className="text-center py-12">
        <Layers className="w-16 h-16 mx-auto mb-4 theme-text-secondary opacity-30" />
        <h3 className="text-lg font-medium theme-text mb-2">Estrutura EAP</h3>
        <p className="text-sm theme-text-secondary">
          Nenhum item com critério de medição encontrado neste mapa
        </p>
      </div>
    );
  }

  return (
    <div className="theme-surface rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}
      >
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 theme-text-secondary" />
          <div>
            <h3 className="text-sm font-medium theme-text">Estrutura EAP - Avanço Físico</h3>
            <p className="text-xs theme-text-secondary">{mapaNome}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold theme-text">
            {(eapData.percentualAvanco || 0).toFixed(1)}%
          </span>
          <p className="text-xs theme-text-secondary">Avanço Total</p>
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        <EAPNodeItem node={eapData} level={0} />
      </div>
    </div>
  );
};

export default CriteriosMedicaoEAPView;
