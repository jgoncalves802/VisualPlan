import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Target,
  FileText,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTemaStore } from '../stores/temaStore';
import { useAuthStore } from '../stores/authStore';
import { useProjetoStore } from '../stores/projetoStore';
import ProjetoSelector from '../components/ui/ProjetoSelector';
import {
  CategoriaIshikawa,
  StatusRestricaoIshikawa,
  RestricaoIshikawa,
  KPIKaizen,
  DadosIshikawa
} from '../types/gestao';
import { restricoesIshikawaService } from '../services/restricoesIshikawaService';
import KPICard from '../components/ui/KPICard';
import TimeNavigator, { TimeViewMode } from '../components/ui/TimeNavigator';

const CATEGORY_LABELS: Record<CategoriaIshikawa, string> = {
  [CategoriaIshikawa.METODO]: 'MÉTODO',
  [CategoriaIshikawa.MAO_DE_OBRA]: 'MÃO DE OBRA',
  [CategoriaIshikawa.MATERIAL]: 'MATERIAL',
  [CategoriaIshikawa.MAQUINA]: 'MÁQUINA',
  [CategoriaIshikawa.MEDIDA]: 'MEDIDA',
  [CategoriaIshikawa.MEIO_AMBIENTE]: 'MEIO AMBIENTE',
};

const CATEGORY_DESCRIPTIONS: Record<CategoriaIshikawa, string> = {
  [CategoriaIshikawa.METODO]: 'Procedimentos, projetos, erros de planejamento',
  [CategoriaIshikawa.MAO_DE_OBRA]: 'Equipe, treinamento, supervisão',
  [CategoriaIshikawa.MATERIAL]: 'Fornecedores, materiais, especificações',
  [CategoriaIshikawa.MAQUINA]: 'Equipamentos, manutenção, disponibilidade',
  [CategoriaIshikawa.MEDIDA]: 'Controle de qualidade, inspeções, não conformidades',
  [CategoriaIshikawa.MEIO_AMBIENTE]: 'Clima, licenças, fatores externos',
};

const CATEGORY_COLORS: Record<CategoriaIshikawa, string> = {
  [CategoriaIshikawa.METODO]: '#8B5CF6',
  [CategoriaIshikawa.MAO_DE_OBRA]: '#3B82F6',
  [CategoriaIshikawa.MATERIAL]: '#10B981',
  [CategoriaIshikawa.MAQUINA]: '#F59E0B',
  [CategoriaIshikawa.MEDIDA]: '#EC4899',
  [CategoriaIshikawa.MEIO_AMBIENTE]: '#06B6D4',
};

const STATUS_COLORS: Record<StatusRestricaoIshikawa, string> = {
  [StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO]: '#22C55E',
  [StatusRestricaoIshikawa.EM_EXECUCAO]: '#3B82F6',
  [StatusRestricaoIshikawa.NO_PRAZO]: '#EAB308',
  [StatusRestricaoIshikawa.ATRASADA]: '#F97316',
  [StatusRestricaoIshikawa.VENCIDA]: '#EF4444',
};

const STATUS_LABELS: Record<StatusRestricaoIshikawa, string> = {
  [StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO]: 'Concluída',
  [StatusRestricaoIshikawa.EM_EXECUCAO]: 'Em Execução',
  [StatusRestricaoIshikawa.NO_PRAZO]: 'No Prazo',
  [StatusRestricaoIshikawa.ATRASADA]: 'Atrasada',
  [StatusRestricaoIshikawa.VENCIDA]: 'Vencida',
};



interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoriaIshikawa | null;
  restrictions: RestricaoIshikawa[];
  dadosCategoria: DadosIshikawa | null;
}

const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  isOpen,
  onClose,
  category,
  restrictions,
  dadosCategoria
}) => {
  
  if (!isOpen || !category || !dadosCategoria) return null;

  const statusDistribution = [
    { name: 'Concluídas', value: dadosCategoria.concluidas, color: STATUS_COLORS[StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO] },
    { name: 'Em Execução', value: dadosCategoria.emExecucao, color: STATUS_COLORS[StatusRestricaoIshikawa.EM_EXECUCAO] },
    { name: 'No Prazo', value: dadosCategoria.noPrazo, color: STATUS_COLORS[StatusRestricaoIshikawa.NO_PRAZO] },
    { name: 'Atrasadas', value: dadosCategoria.atrasadas, color: STATUS_COLORS[StatusRestricaoIshikawa.ATRASADA] },
    { name: 'Vencidas', value: dadosCategoria.vencidas, color: STATUS_COLORS[StatusRestricaoIshikawa.VENCIDA] },
  ].filter(item => item.value > 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: CATEGORY_COLORS[category] }}>
          <div>
            <h2 className="text-xl font-bold text-white">{CATEGORY_LABELS[category]}</h2>
            <p className="text-sm text-white opacity-80">{CATEGORY_DESCRIPTIONS[category]}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X size={24} className="text-white" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1 bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribuição por Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{dadosCategoria.concluidas}</div>
                  <div className="text-xs text-green-700">Concluídas</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{dadosCategoria.emExecucao}</div>
                  <div className="text-xs text-blue-700">Em Execução</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600">{dadosCategoria.atrasadas}</div>
                  <div className="text-xs text-orange-700">Atrasadas</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{dadosCategoria.vencidas}</div>
                  <div className="text-xs text-red-700">Vencidas</div>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-3">Restrições ({restrictions.length})</h3>
          <div className="space-y-2">
            {restrictions.map((rest) => (
              <div
                key={rest.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:shadow-md transition-shadow"
                style={{ borderLeftWidth: 4, borderLeftColor: STATUS_COLORS[rest.status] }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500">{rest.codigo}</span>
                    {rest.reincidente && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Reincidente</span>
                    )}
                    {rest.impactoCaminhoCritico && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">Crítico</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 mt-1">{rest.descricao}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{rest.atividadeNome}</span>
                    <span>•</span>
                    <span>{rest.responsavel}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${STATUS_COLORS[rest.status]}20`, color: STATUS_COLORS[rest.status] }}
                  >
                    {STATUS_LABELS[rest.status]}
                  </span>
                  {rest.diasAtraso > 0 && (
                    <p className="text-xs text-red-600 mt-1">{rest.diasAtraso} dias atraso</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface IshikawaDiagramProps {
  dadosPorCategoria: DadosIshikawa[];
  onCategoryClick: (category: CategoriaIshikawa) => void;
  totalRestricoes: number;
}

const IshikawaDiagram: React.FC<IshikawaDiagramProps> = ({
  dadosPorCategoria,
  onCategoryClick,
  totalRestricoes
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<CategoriaIshikawa | null>(null);
  const { tema } = useTemaStore();
  
  const isDarkMode = tema.background === '#1a1a2e' || tema.background === '#0f172a';
  
  const spineColor = isDarkMode ? '#64748b' : '#374151';
  
  const topCategories = [
    { cat: CategoriaIshikawa.METODO, label: 'Método' },
    { cat: CategoriaIshikawa.MATERIAL, label: 'Material' },
    { cat: CategoriaIshikawa.MAQUINA, label: 'Máquina' },
  ];
  const bottomCategories = [
    { cat: CategoriaIshikawa.MAO_DE_OBRA, label: 'Mão de Obra' },
    { cat: CategoriaIshikawa.MEIO_AMBIENTE, label: 'Meio Ambiente' },
    { cat: CategoriaIshikawa.MEDIDA, label: 'Medida' },
  ];
  
  const getCategoryData = (cat: CategoriaIshikawa) => dadosPorCategoria.find(d => d.categoria === cat);

  const renderBranch = (
    category: CategoriaIshikawa,
    label: string,
    spineX: number,
    spineY: number,
    isTop: boolean
  ) => {
    const dados = getCategoryData(category);
    const isHovered = hoveredCategory === category;
    const categoryColor = CATEGORY_COLORS[category];
    
    const mainBoneLength = 140;
    const angle = isTop ? -50 : 50;
    const angleRad = (angle * Math.PI) / 180;
    
    const endX = spineX - Math.cos(angleRad) * mainBoneLength;
    const endY = spineY + Math.sin(angleRad) * mainBoneLength;
    
    const labelX = isTop ? endX - 50 : endX - 50;
    const labelY = isTop ? endY - 20 : endY + 20;
    
    return (
      <g 
        key={category}
        className="cursor-pointer"
        onClick={() => onCategoryClick(category)}
        onMouseEnter={() => setHoveredCategory(category)}
        onMouseLeave={() => setHoveredCategory(null)}
      >
        <line
          x1={spineX}
          y1={spineY}
          x2={endX}
          y2={endY}
          stroke={isHovered ? categoryColor : spineColor}
          strokeWidth={isHovered ? 5 : 4}
          strokeLinecap="round"
        />
        
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-55}
            y={-14}
            width={110}
            height={28}
            rx={14}
            fill={categoryColor}
            stroke={isHovered ? 'white' : 'transparent'}
            strokeWidth={2}
            filter={isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'}
          />
          <text
            x={0}
            y={5}
            textAnchor="middle"
            fill="white"
            fontSize={12}
            fontWeight="600"
          >
            {label}
          </text>
        </g>
        
        {dados && (
          <g transform={`translate(${labelX + 70}, ${labelY})`}>
            <circle
              r={16}
              fill={dados.vencidas > 0 || dados.atrasadas > 0 ? '#EF4444' : categoryColor}
              stroke="white"
              strokeWidth={2}
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
            />
            <text
              textAnchor="middle"
              y={5}
              fill="white"
              fontSize={12}
              fontWeight="bold"
            >
              {dados.total}
            </text>
          </g>
        )}
        
        {isHovered && dados && (
          <g transform={`translate(${labelX}, ${isTop ? labelY - 85 : labelY + 55})`}>
            <rect
              x={-75}
              y={-5}
              width={150}
              height={70}
              rx={8}
              fill={isDarkMode ? '#1e293b' : 'white'}
              stroke={categoryColor}
              strokeWidth={2}
              filter="drop-shadow(0 4px 12px rgba(0,0,0,0.2))"
            />
            <text x={-65} y={14} fontSize={11} fill="#22C55E" fontWeight="500">
              Concluídas: {dados.concluidas}
            </text>
            <text x={-65} y={30} fontSize={11} fill="#3B82F6" fontWeight="500">
              Em Execução: {dados.emExecucao}
            </text>
            <text x={-65} y={46} fontSize={11} fill="#EAB308" fontWeight="500">
              No Prazo: {dados.noPrazo}
            </text>
            <text x={25} y={14} fontSize={11} fill="#F97316" fontWeight="500">
              Atrasadas: {dados.atrasadas}
            </text>
            <text x={25} y={30} fontSize={11} fill="#EF4444" fontWeight="500">
              Vencidas: {dados.vencidas}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="w-full h-full rounded-xl overflow-visible" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }}>
      <svg viewBox="0 0 1000 450" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="12"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 12 4, 0 8" fill="#DC2626" />
          </marker>
        </defs>
        
        <line 
          x1={50} 
          y1={225} 
          x2={800} 
          y2={225} 
          stroke={spineColor}
          strokeWidth={6}
          markerEnd="url(#arrowhead)"
          strokeLinecap="round"
        />
        
        {topCategories.map(({ cat, label }, i) => {
          const spineX = 180 + i * 220;
          return renderBranch(cat, label, spineX, 225, true);
        })}
        
        {bottomCategories.map(({ cat, label }, i) => {
          const spineX = 180 + i * 220;
          return renderBranch(cat, label, spineX, 225, false);
        })}
        
        <g transform="translate(820, 225)">
          <rect
            x={0}
            y={-40}
            width={130}
            height={80}
            rx={8}
            fill="#DC2626"
            filter="drop-shadow(0 4px 12px rgba(220, 38, 38, 0.4))"
          />
          <text
            x={65}
            y={-10}
            textAnchor="middle"
            fill="white"
            fontSize={13}
            fontWeight="600"
          >
            PROBLEMA
          </text>
          <text
            x={65}
            y={25}
            textAnchor="middle"
            fill="white"
            fontSize={26}
            fontWeight="bold"
          >
            {totalRestricoes}
          </text>
        </g>
        
        <text
          x={500}
          y={420}
          textAnchor="middle"
          fill={isDarkMode ? '#64748b' : '#94a3b8'}
          fontSize={11}
          fontStyle="italic"
        >
          Clique em uma categoria para ver detalhes
        </text>
      </svg>
    </div>
  );
};

const AnaliseIshikawaPage: React.FC = () => {
  const { tema } = useTemaStore();
  const { usuario } = useAuthStore();
  const { projetoSelecionado } = useProjetoStore();
  const [restrictions, setRestrictions] = useState<RestricaoIshikawa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [epsList, setEpsList] = useState<Array<{ id: string; nome: string }>>([]);
  const [wbsMap, setWbsMap] = useState<Record<string, Array<{ id: string; nome: string }>>>({});
  const [activitiesMap, setActivitiesMap] = useState<Record<string, Array<{ id: string; nome: string }>>>({});
  
  const [periodoAtual, setPeriodoAtual] = useState(() => {
    const hoje = new Date();
    const inicio = startOfWeek(hoje, { locale: ptBR });
    const fim = endOfWeek(hoje, { locale: ptBR });
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    return { inicio, fim };
  });
  const [timeViewMode, setTimeViewMode] = useState<TimeViewMode>('semana');
  
  const [selectedEPS, setSelectedEPS] = useState<string>('');
  const [selectedWBS, setSelectedWBS] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [statusFilters, setStatusFilters] = useState<StatusRestricaoIshikawa[]>([]);
  const [tableExpanded, setTableExpanded] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<CategoriaIshikawa | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const availableWBS = selectedEPS ? wbsMap[selectedEPS] || [] : [];
  const availableActivities = selectedWBS ? activitiesMap[selectedWBS] || [] : [];

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const empresaId = usuario?.empresaId || 'a0000001';
      
      const [restrictionsData, epsData] = await Promise.all([
        restricoesIshikawaService.getAll(empresaId, projetoSelecionado?.id),
        restricoesIshikawaService.getEPSDisponiveis(empresaId),
      ]);
      
      setRestrictions(restrictionsData);
      setEpsList(epsData);
      
      const wbsPromises = epsData.map(async (eps) => {
        const wbsNodes = await restricoesIshikawaService.getWBSByEPS(eps.id);
        return { epsId: eps.id, wbsNodes };
      });
      
      const wbsResults = await Promise.all(wbsPromises);
      const newWbsMap: Record<string, Array<{ id: string; nome: string }>> = {};
      wbsResults.forEach(result => {
        newWbsMap[result.epsId] = result.wbsNodes;
      });
      setWbsMap(newWbsMap);
      
      const allWbsNodes = wbsResults.flatMap(r => r.wbsNodes);
      const activitiesPromises = allWbsNodes.map(async (wbs) => {
        const activities = await restricoesIshikawaService.getAtividadesByWBS(wbs.id);
        return { wbsId: wbs.id, activities };
      });
      
      const activitiesResults = await Promise.all(activitiesPromises);
      const newActivitiesMap: Record<string, Array<{ id: string; nome: string }>> = {};
      activitiesResults.forEach(result => {
        newActivitiesMap[result.wbsId] = result.activities;
      });
      setActivitiesMap(newActivitiesMap);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setRestrictions([]);
      setEpsList([]);
    } finally {
      setIsLoading(false);
    }
  }, [usuario?.empresaId, projetoSelecionado?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRestrictions = useMemo(() => {
    return restrictions.filter(r => {
      if (selectedEPS && r.epsId !== selectedEPS) return false;
      if (selectedWBS && r.wbsId !== selectedWBS) return false;
      if (selectedActivity && r.atividadeId !== selectedActivity) return false;
      if (statusFilters.length > 0 && !statusFilters.includes(r.status)) return false;
      if (!isWithinInterval(r.dataPrevista, { start: periodoAtual.inicio, end: periodoAtual.fim })) return false;
      return true;
    });
  }, [restrictions, selectedEPS, selectedWBS, selectedActivity, statusFilters, periodoAtual]);

  const dadosPorCategoria = useMemo((): DadosIshikawa[] => {
    const categories = Object.values(CategoriaIshikawa);
    return categories.map(cat => {
      const catRestrictions = filteredRestrictions.filter(r => r.categoria === cat);
      return {
        categoria: cat,
        total: catRestrictions.length,
        concluidas: catRestrictions.filter(r => r.status === StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO).length,
        emExecucao: catRestrictions.filter(r => r.status === StatusRestricaoIshikawa.EM_EXECUCAO).length,
        noPrazo: catRestrictions.filter(r => r.status === StatusRestricaoIshikawa.NO_PRAZO).length,
        atrasadas: catRestrictions.filter(r => r.status === StatusRestricaoIshikawa.ATRASADA).length,
        vencidas: catRestrictions.filter(r => r.status === StatusRestricaoIshikawa.VENCIDA).length,
        percentualProblemas: catRestrictions.length > 0
          ? ((catRestrictions.filter(r => r.status === StatusRestricaoIshikawa.ATRASADA || r.status === StatusRestricaoIshikawa.VENCIDA).length / catRestrictions.length) * 100)
          : 0,
        restricoes: catRestrictions,
      };
    });
  }, [filteredRestrictions]);

  const kpis = useMemo((): KPIKaizen => {
    const concluidas = filteredRestrictions.filter(r => r.status === StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO);
    const atrasadas = filteredRestrictions.filter(r => r.status === StatusRestricaoIshikawa.ATRASADA || r.status === StatusRestricaoIshikawa.VENCIDA);
    const criticas = filteredRestrictions.filter(r => r.impactoCaminhoCritico);
    const reincidentes = filteredRestrictions.filter(r => r.reincidente);
    
    const tmr = concluidas.length > 0
      ? concluidas.reduce((acc, r) => {
          const dias = r.dataConclusao
            ? Math.ceil((r.dataConclusao.getTime() - r.dataCriacao.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          return acc + dias;
        }, 0) / concluidas.length
      : 0;

    return {
      tmr: Math.round(tmr * 10) / 10,
      trc: filteredRestrictions.length > 0 ? Math.round((criticas.length / filteredRestrictions.length) * 100) : 0,
      irp: filteredRestrictions.length > 0 ? Math.round((reincidentes.length / filteredRestrictions.length) * 100) : 0,
      eficacia: filteredRestrictions.length > 0 ? Math.round((concluidas.length / filteredRestrictions.length) * 100) : 0,
      totalRestricoes: filteredRestrictions.length,
      restricoesConcluidas: concluidas.length,
      restricoesAtrasadas: atrasadas.filter(r => r.status === StatusRestricaoIshikawa.ATRASADA).length,
      restricoesVencidas: atrasadas.filter(r => r.status === StatusRestricaoIshikawa.VENCIDA).length,
    };
  }, [filteredRestrictions]);

  const paretoData = useMemo(() => {
    const sorted = [...dadosPorCategoria].sort((a, b) => b.total - a.total);
    let cumulative = 0;
    const total = sorted.reduce((acc, d) => acc + d.total, 0);
    
    return sorted.map(d => {
      cumulative += d.total;
      return {
        categoria: CATEGORY_LABELS[d.categoria],
        quantidade: d.total,
        acumulado: total > 0 ? Math.round((cumulative / total) * 100) : 0,
        fill: CATEGORY_COLORS[d.categoria],
      };
    });
  }, [dadosPorCategoria]);

  const trendData = useMemo(() => {
    const monthMap = new Map<string, { total: number; concluidas: number; atrasadas: number }>();
    
    restrictions.forEach(r => {
      const date = r.dataCriacao;
      const monthKey = `${date.toLocaleString('pt-BR', { month: 'short' })}/${String(date.getFullYear()).slice(2)}`;
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { total: 0, concluidas: 0, atrasadas: 0 });
      }
      
      const stats = monthMap.get(monthKey)!;
      stats.total += 1;
      
      if (r.status === StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO) {
        stats.concluidas += 1;
      } else if (r.status === StatusRestricaoIshikawa.ATRASADA || r.status === StatusRestricaoIshikawa.VENCIDA) {
        stats.atrasadas += 1;
      }
    });
    
    const sortedMonths = Array.from(monthMap.entries())
      .sort((a, b) => {
        const [monthA, yearA] = a[0].split('/');
        const [monthB, yearB] = b[0].split('/');
        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        return months.indexOf(monthA.toLowerCase()) - months.indexOf(monthB.toLowerCase());
      })
      .slice(-6);
    
    return sortedMonths.map(([mes, stats]) => ({
      mes: mes.charAt(0).toUpperCase() + mes.slice(1),
      total: stats.total,
      concluidas: stats.concluidas,
      atrasadas: stats.atrasadas,
    }));
  }, [restrictions]);

  const handleCategoryClick = (category: CategoriaIshikawa) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setSelectedEPS('');
    setSelectedWBS('');
    setSelectedActivity('');
    setStatusFilters([]);
    const hoje = new Date();
    const inicio = startOfWeek(hoje, { locale: ptBR });
    const fim = endOfWeek(hoje, { locale: ptBR });
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    setPeriodoAtual({ inicio, fim });
    setTimeViewMode('semana');
  };

  const toggleStatusFilter = (status: StatusRestricaoIshikawa) => {
    setStatusFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const sortedRestrictions = useMemo(() => {
    return [...filteredRestrictions].sort((a, b) => b.scoreImpacto - a.scoreImpacto);
  }, [filteredRestrictions]);

  const selectedCategoryData = selectedCategory
    ? dadosPorCategoria.find(d => d.categoria === selectedCategory)
    : null;
  
  const selectedCategoryRestrictions = selectedCategory
    ? filteredRestrictions.filter(r => r.categoria === selectedCategory)
    : [];

  const isDarkMode = tema.background === '#1a1a2e' || tema.background === '#0f172a';

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center" style={{ backgroundColor: tema.background }}>
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: tema.primary }} />
          <p className="text-sm" style={{ color: tema.textSecondary }}>Carregando restrições...</p>
        </div>
      </div>
    );
  }

  if (restrictions.length === 0) {
    return (
      <div className="p-6 min-h-screen" style={{ backgroundColor: tema.background }}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: tema.text }}>
            Análise Ishikawa - Causa e Efeito
          </h1>
          <p className="text-sm mt-1" style={{ color: tema.textSecondary }}>
            Análise de Restrições por Categoria (Metodologia Kaizen - 6M)
          </p>
        </div>
        <div className="rounded-xl shadow-sm border p-12 text-center" style={{ backgroundColor: tema.surface, borderColor: tema.border }}>
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 opacity-50" style={{ color: tema.textSecondary }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: tema.text }}>Nenhuma restrição cadastrada</h2>
          <p className="text-sm mb-4" style={{ color: tema.textSecondary }}>
            Não há restrições registradas no sistema. As restrições Ishikawa são identificadas durante o acompanhamento do projeto e categorizadas pela metodologia 6M (Método, Mão de Obra, Material, Máquina, Medida, Meio Ambiente).
          </p>
          <p className="text-xs" style={{ color: tema.textSecondary }}>
            Acesse o módulo LPS ou Cronograma para registrar restrições que serão automaticamente classificadas aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ backgroundColor: tema.background }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: tema.text }}>
            Análise Ishikawa - Causa e Efeito
          </h1>
          <p className="text-sm mt-1" style={{ color: tema.textSecondary }}>
            Análise de Restrições por Categoria (Metodologia Kaizen - 6M)
          </p>
        </div>
        <ProjetoSelector compact />
      </div>

      <TimeNavigator
        periodo={periodoAtual}
        onPeriodoChange={setPeriodoAtual}
        viewMode={timeViewMode}
        onViewModeChange={setTimeViewMode}
      />

      <div className="rounded-xl shadow-sm border p-4" style={{ backgroundColor: tema.surface, borderColor: tema.border }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: tema.textSecondary }}>EPS</label>
            <select
              value={selectedEPS}
              onChange={(e) => {
                setSelectedEPS(e.target.value);
                setSelectedWBS('');
                setSelectedActivity('');
              }}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: tema.border, backgroundColor: tema.surface, color: tema.text }}
            >
              <option value="">Todos os EPS</option>
              {epsList.map(eps => (
                <option key={eps.id} value={eps.id}>{eps.nome}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: tema.textSecondary }}>WBS</label>
            <select
              value={selectedWBS}
              onChange={(e) => {
                setSelectedWBS(e.target.value);
                setSelectedActivity('');
              }}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: tema.border, backgroundColor: tema.surface, color: tema.text }}
              disabled={!selectedEPS}
            >
              <option value="">Todos os WBS</option>
              {availableWBS.map(wbs => (
                <option key={wbs.id} value={wbs.id}>{wbs.nome}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: tema.textSecondary }}>Atividade</label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: tema.border, backgroundColor: tema.surface, color: tema.text }}
              disabled={!selectedWBS}
            >
              <option value="">Todas as Atividades</option>
              {availableActivities.map(act => (
                <option key={act.id} value={act.id}>{act.nome}</option>
              ))}
            </select>
          </div>
          
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: tema.border }}>
          <span className="text-sm font-medium" style={{ color: tema.text }}>Status:</span>
          <div className="flex flex-wrap gap-2">
            {Object.values(StatusRestricaoIshikawa).map(status => (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilters.includes(status) ? 'ring-2 ring-offset-1' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: `${STATUS_COLORS[status]}20`,
                  color: STATUS_COLORS[status],
                  boxShadow: statusFilters.includes(status) ? `0 0 0 2px ${STATUS_COLORS[status]}` : 'none',
                }}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
          
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
            style={{ color: tema.textSecondary }}
          >
            <RefreshCw size={16} />
            Limpar Filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="TMR"
          value={`${kpis.tmr} dias`}
          icon={Clock}
          color={kpis.tmr <= 5 ? 'success' : kpis.tmr <= 7 ? 'warning' : 'danger'}
          subtitle="Tempo Médio Remoção | Meta: < 5 dias"
        />
        <KPICard
          title="TRC"
          value={`${kpis.trc}%`}
          icon={AlertTriangle}
          color={kpis.trc <= 15 ? 'success' : kpis.trc <= 25 ? 'warning' : 'danger'}
          subtitle="Taxa Restrições Críticas | Meta: < 15%"
        />
        <KPICard
          title="IRP"
          value={`${kpis.irp}%`}
          icon={RefreshCw}
          color={kpis.irp <= 5 ? 'success' : kpis.irp <= 10 ? 'warning' : 'danger'}
          subtitle="Índice Reincidência | Meta: < 5%"
        />
        <KPICard
          title="Eficácia Tratativa"
          value={`${kpis.eficacia}%`}
          icon={Target}
          color={kpis.eficacia >= 85 ? 'success' : kpis.eficacia >= 70 ? 'warning' : 'danger'}
          subtitle={`Meta: > 85% | ${kpis.restricoesConcluidas}/${kpis.totalRestricoes}`}
        />
      </div>

      <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: tema.surface, borderColor: tema.border }}>
        <div className="p-4 border-b" style={{ borderColor: tema.border }}>
          <h2 className="text-lg font-bold" style={{ color: tema.text }}>Diagrama Ishikawa - 6M</h2>
          <p className="text-xs" style={{ color: tema.textSecondary }}>Método, Mão de Obra, Material, Máquina, Medida, Meio Ambiente</p>
        </div>
        <div className="p-4" style={{ height: 480 }}>
          <IshikawaDiagram
            dadosPorCategoria={dadosPorCategoria}
            onCategoryClick={handleCategoryClick}
            totalRestricoes={filteredRestrictions.length}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: tema.surface, borderColor: tema.border }}>
          <div className="p-4 border-b" style={{ borderColor: tema.border }}>
            <h2 className="text-lg font-bold" style={{ color: tema.text }}>Pareto - Categorias</h2>
          </div>
          <div className="p-4" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e5e7eb'} />
                <XAxis dataKey="categoria" tick={{ fontSize: 10, fill: tema.textSecondary }} angle={-15} textAnchor="end" height={50} />
                <YAxis yAxisId="left" orientation="left" tick={{ fill: tema.textSecondary }} />
                <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tick={{ fill: tema.textSecondary }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: tema.surface, 
                    borderColor: tema.border,
                    color: tema.text 
                  }} 
                />
                <Legend />
                <Bar yAxisId="left" dataKey="quantidade" name="Quantidade" radius={[4, 4, 0, 0]}>
                  {paretoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="acumulado" stroke="#6366f1" strokeWidth={2} name="Acumulado %" dot={{ fill: '#6366f1' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: tema.surface, borderColor: tema.border }}>
          <div className="p-4 border-b" style={{ borderColor: tema.border }}>
            <h2 className="text-lg font-bold" style={{ color: tema.text }}>Tendência Mensal</h2>
          </div>
          <div className="p-4" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e5e7eb'} />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: tema.textSecondary }} />
                <YAxis tick={{ fill: tema.textSecondary }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: tema.surface, 
                    borderColor: tema.border,
                    color: tema.text 
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} name="Total" dot={{ fill: '#6366f1' }} />
                <Line type="monotone" dataKey="concluidas" stroke="#22c55e" strokeWidth={2} name="Concluídas" dot={{ fill: '#22c55e' }} />
                <Line type="monotone" dataKey="atrasadas" stroke="#ef4444" strokeWidth={2} name="Atrasadas" dot={{ fill: '#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: tema.surface, borderColor: tema.border }}>
        <button
          onClick={() => setTableExpanded(!tableExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          style={{ backgroundColor: isDarkMode ? 'transparent' : undefined }}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} style={{ color: tema.primary }} />
            <h2 className="text-lg font-bold" style={{ color: tema.text }}>
              Ranking de Restrições por Impacto ({sortedRestrictions.length})
            </h2>
          </div>
          {tableExpanded ? <ChevronUp size={20} style={{ color: tema.textSecondary }} /> : <ChevronDown size={20} style={{ color: tema.textSecondary }} />}
        </button>
        
        {tableExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb' }}>
                <tr>
                  <th className="text-left p-3 font-medium" style={{ color: tema.textSecondary }}>Código</th>
                  <th className="text-left p-3 font-medium" style={{ color: tema.textSecondary }}>Descrição</th>
                  <th className="text-left p-3 font-medium" style={{ color: tema.textSecondary }}>Categoria</th>
                  <th className="text-left p-3 font-medium" style={{ color: tema.textSecondary }}>Status</th>
                  <th className="text-left p-3 font-medium" style={{ color: tema.textSecondary }}>Atividade</th>
                  <th className="text-left p-3 font-medium" style={{ color: tema.textSecondary }}>Responsável</th>
                  <th className="text-center p-3 font-medium" style={{ color: tema.textSecondary }}>Score</th>
                  <th className="text-center p-3 font-medium" style={{ color: tema.textSecondary }}>Flags</th>
                </tr>
              </thead>
              <tbody>
                {sortedRestrictions.slice(0, 15).map((rest, idx) => (
                  <tr 
                    key={rest.id} 
                    className="border-t hover:bg-gray-50 transition-colors"
                    style={{ borderColor: tema.border, backgroundColor: isDarkMode && idx % 2 === 0 ? '#1e293b' : 'transparent' }}
                  >
                    <td className="p-3 font-mono text-xs" style={{ color: tema.textSecondary }}>{rest.codigo}</td>
                    <td className="p-3 max-w-xs truncate" style={{ color: tema.text }}>{rest.descricao}</td>
                    <td className="p-3">
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: CATEGORY_COLORS[rest.categoria] }}
                      >
                        {CATEGORY_LABELS[rest.categoria]}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${STATUS_COLORS[rest.status]}20`, color: STATUS_COLORS[rest.status] }}
                      >
                        {STATUS_LABELS[rest.status]}
                      </span>
                    </td>
                    <td className="p-3 text-xs" style={{ color: tema.textSecondary }}>{rest.atividadeNome}</td>
                    <td className="p-3 text-xs" style={{ color: tema.textSecondary }}>{rest.responsavel}</td>
                    <td className="p-3 text-center">
                      <span 
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-white ${
                          rest.scoreImpacto >= 50 ? 'bg-red-500' : rest.scoreImpacto >= 30 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}
                      >
                        {rest.scoreImpacto}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {rest.impactoCaminhoCritico && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded" title="Caminho Crítico">CC</span>
                        )}
                        {rest.reincidente && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded" title="Reincidente">R</span>
                        )}
                        {rest.diasAtraso > 0 && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded" title={`${rest.diasAtraso} dias de atraso`}>
                            {rest.diasAtraso}d
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CategoryDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        category={selectedCategory}
        restrictions={selectedCategoryRestrictions}
        dadosCategoria={selectedCategoryData || null}
      />
    </div>
  );
};

export default AnaliseIshikawaPage;
