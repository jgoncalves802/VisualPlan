import React, { useState, useMemo } from 'react';
import {
  Plus,
  Settings,
  ChevronUp,
  Download,
  Save,
  AlertTriangle,
  X,
  Edit2,
  Eye,
  TrendingUp,
  DollarSign,
  Target,
  Briefcase,
  BarChart3,
  Info,
  History,
  ArrowUpDown,
  Check
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { useTemaStore } from '../stores/temaStore';
import KPICard from '../components/ui/KPICard';
import {
  StatusProjeto,
  CriterioPriorizacao,
  ProjetoPrioritizado,
  ScoreCriterio,
  getCorStatusProjeto,
  getLabelStatusProjeto
} from '../types/gestao';

const CRITERIOS_PADRAO: CriterioPriorizacao[] = [
  { id: 'roi', nome: 'ROI', descricao: 'Retorno sobre Investimento', peso: 20, inverso: false },
  { id: 'alinhamento', nome: 'Alinhamento Estratégico', descricao: 'Alinhamento com objetivos estratégicos', peso: 20, inverso: false },
  { id: 'urgencia', nome: 'Urgência', descricao: 'Urgência de execução', peso: 15, inverso: false },
  { id: 'complexidade', nome: 'Complexidade', descricao: 'Complexidade do projeto (menor é melhor)', peso: 15, inverso: true },
  { id: 'recursos', nome: 'Disponibilidade de Recursos', descricao: 'Disponibilidade de recursos necessários', peso: 15, inverso: false },
  { id: 'risco', nome: 'Risco', descricao: 'Nível de risco do projeto (menor é melhor)', peso: 15, inverso: true },
];

const MOCK_PROJETOS: ProjetoPrioritizado[] = [
  {
    id: '1',
    nome: 'Torre Comercial Alpha',
    descricao: 'Construção de torre comercial de 30 andares',
    gerente: 'João Silva',
    orcamento: 45000000,
    dataInicio: new Date('2024-01-15'),
    dataFim: new Date('2026-06-30'),
    status: StatusProjeto.NO_PRAZO,
    scores: [
      { criterioId: 'roi', score: 9 },
      { criterioId: 'alinhamento', score: 8 },
      { criterioId: 'urgencia', score: 7 },
      { criterioId: 'complexidade', score: 8 },
      { criterioId: 'recursos', score: 6 },
      { criterioId: 'risco', score: 7 },
    ],
    valorEstrategico: 85,
    roiEsperado: 18.5,
  },
  {
    id: '2',
    nome: 'Residencial Vista Verde',
    descricao: 'Condomínio residencial com 200 unidades',
    gerente: 'Maria Santos',
    orcamento: 28000000,
    dataInicio: new Date('2024-03-01'),
    dataFim: new Date('2025-12-31'),
    status: StatusProjeto.EM_RISCO,
    scores: [
      { criterioId: 'roi', score: 7 },
      { criterioId: 'alinhamento', score: 9 },
      { criterioId: 'urgencia', score: 8 },
      { criterioId: 'complexidade', score: 5 },
      { criterioId: 'recursos', score: 7 },
      { criterioId: 'risco', score: 6 },
    ],
    valorEstrategico: 78,
    roiEsperado: 15.2,
  },
  {
    id: '3',
    nome: 'Shopping Center Norte',
    descricao: 'Centro comercial com 150 lojas',
    gerente: 'Carlos Lima',
    orcamento: 85000000,
    dataInicio: new Date('2024-06-01'),
    dataFim: new Date('2027-12-31'),
    status: StatusProjeto.NO_PRAZO,
    scores: [
      { criterioId: 'roi', score: 10 },
      { criterioId: 'alinhamento', score: 10 },
      { criterioId: 'urgencia', score: 5 },
      { criterioId: 'complexidade', score: 9 },
      { criterioId: 'recursos', score: 8 },
      { criterioId: 'risco', score: 8 },
    ],
    valorEstrategico: 92,
    roiEsperado: 22.0,
  },
  {
    id: '4',
    nome: 'Hospital Regional',
    descricao: 'Hospital com 300 leitos',
    gerente: 'Ana Costa',
    orcamento: 120000000,
    dataInicio: new Date('2024-02-01'),
    dataFim: new Date('2028-06-30'),
    status: StatusProjeto.CRITICO,
    scores: [
      { criterioId: 'roi', score: 6 },
      { criterioId: 'alinhamento', score: 10 },
      { criterioId: 'urgencia', score: 10 },
      { criterioId: 'complexidade', score: 10 },
      { criterioId: 'recursos', score: 4 },
      { criterioId: 'risco', score: 9 },
    ],
    valorEstrategico: 88,
    roiEsperado: 8.5,
  },
  {
    id: '5',
    nome: 'Galpão Industrial',
    descricao: 'Centro logístico de 50.000m²',
    gerente: 'Pedro Souza',
    orcamento: 35000000,
    dataInicio: new Date('2024-07-01'),
    dataFim: new Date('2025-10-31'),
    status: StatusProjeto.NO_PRAZO,
    scores: [
      { criterioId: 'roi', score: 8 },
      { criterioId: 'alinhamento', score: 7 },
      { criterioId: 'urgencia', score: 6 },
      { criterioId: 'complexidade', score: 4 },
      { criterioId: 'recursos', score: 9 },
      { criterioId: 'risco', score: 3 },
    ],
    valorEstrategico: 65,
    roiEsperado: 16.8,
  },
  {
    id: '6',
    nome: 'Escola Técnica',
    descricao: 'Centro educacional profissionalizante',
    gerente: 'Fernanda Gomes',
    orcamento: 18000000,
    dataInicio: new Date('2024-04-01'),
    dataFim: new Date('2025-08-31'),
    status: StatusProjeto.NO_PRAZO,
    scores: [
      { criterioId: 'roi', score: 5 },
      { criterioId: 'alinhamento', score: 8 },
      { criterioId: 'urgencia', score: 7 },
      { criterioId: 'complexidade', score: 3 },
      { criterioId: 'recursos', score: 8 },
      { criterioId: 'risco', score: 2 },
    ],
    valorEstrategico: 70,
    roiEsperado: 7.2,
  },
  {
    id: '7',
    nome: 'Retrofit Edifício Central',
    descricao: 'Modernização de edifício histórico',
    gerente: 'Roberto Dias',
    orcamento: 22000000,
    dataInicio: new Date('2024-08-01'),
    dataFim: new Date('2025-12-31'),
    status: StatusProjeto.EM_RISCO,
    scores: [
      { criterioId: 'roi', score: 6 },
      { criterioId: 'alinhamento', score: 6 },
      { criterioId: 'urgencia', score: 4 },
      { criterioId: 'complexidade', score: 7 },
      { criterioId: 'recursos', score: 5 },
      { criterioId: 'risco', score: 7 },
    ],
    valorEstrategico: 55,
    roiEsperado: 11.5,
  },
  {
    id: '8',
    nome: 'Parque Industrial',
    descricao: 'Complexo industrial com 10 galpões',
    gerente: 'Lucas Ferreira',
    orcamento: 65000000,
    dataInicio: new Date('2024-09-01'),
    dataFim: new Date('2027-03-31'),
    status: StatusProjeto.NO_PRAZO,
    scores: [
      { criterioId: 'roi', score: 9 },
      { criterioId: 'alinhamento', score: 8 },
      { criterioId: 'urgencia', score: 5 },
      { criterioId: 'complexidade', score: 6 },
      { criterioId: 'recursos', score: 7 },
      { criterioId: 'risco', score: 5 },
    ],
    valorEstrategico: 75,
    roiEsperado: 19.2,
  },
  {
    id: '9',
    nome: 'Centro Esportivo',
    descricao: 'Complexo esportivo multiuso',
    gerente: 'Marina Oliveira',
    orcamento: 42000000,
    dataInicio: new Date('2024-05-01'),
    dataFim: new Date('2026-09-30'),
    status: StatusProjeto.EM_RISCO,
    scores: [
      { criterioId: 'roi', score: 4 },
      { criterioId: 'alinhamento', score: 7 },
      { criterioId: 'urgencia', score: 6 },
      { criterioId: 'complexidade', score: 6 },
      { criterioId: 'recursos', score: 5 },
      { criterioId: 'risco', score: 6 },
    ],
    valorEstrategico: 60,
    roiEsperado: 6.8,
  },
  {
    id: '10',
    nome: 'Condomínio Luxo',
    descricao: 'Residencial de alto padrão com 50 unidades',
    gerente: 'Thiago Martins',
    orcamento: 95000000,
    dataInicio: new Date('2024-10-01'),
    dataFim: new Date('2027-06-30'),
    status: StatusProjeto.NO_PRAZO,
    scores: [
      { criterioId: 'roi', score: 10 },
      { criterioId: 'alinhamento', score: 9 },
      { criterioId: 'urgencia', score: 4 },
      { criterioId: 'complexidade', score: 7 },
      { criterioId: 'recursos', score: 6 },
      { criterioId: 'risco', score: 6 },
    ],
    valorEstrategico: 82,
    roiEsperado: 24.5,
  },
];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getScoreLabel = (score: number): string => {
  if (score <= 3) return 'Baixo';
  if (score <= 6) return 'Médio';
  if (score <= 8) return 'Alto';
  return 'Muito Alto';
};

const getScoreColor = (score: number): string => {
  if (score <= 3) return '#EF4444';
  if (score <= 6) return '#EAB308';
  if (score <= 8) return '#3B82F6';
  return '#22C55E';
};

interface ScoreModalProps {
  projeto: ProjetoPrioritizado;
  criterios: CriterioPriorizacao[];
  onClose: () => void;
  onSave: (projetoId: string, scores: ScoreCriterio[], observacoes?: string) => void;
}

const ScoreModal: React.FC<ScoreModalProps> = ({ projeto, criterios, onClose, onSave }) => {
  const { tema } = useTemaStore();
  const [scores, setScores] = useState<Record<string, number>>(
    projeto.scores.reduce((acc, s) => ({ ...acc, [s.criterioId]: s.score }), {})
  );
  const [observacoes, setObservacoes] = useState(projeto.observacoes || '');
  const [showHistory, setShowHistory] = useState(false);

  const calcularScoreTotal = (): number => {
    let total = 0;
    criterios.forEach((c) => {
      const score = scores[c.id] || 0;
      const adjustedScore = c.inverso ? 11 - score : score;
      total += adjustedScore * (c.peso / 100);
    });
    return Math.round(total * 10) / 10;
  };

  const handleSave = () => {
    const newScores: ScoreCriterio[] = Object.entries(scores).map(([criterioId, score]) => ({
      criterioId,
      score,
      dataAtualizacao: new Date(),
    }));
    onSave(projeto.id, newScores, observacoes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold" style={{ color: tema.text }}>Avaliar Projeto</h2>
            <p className="text-sm" style={{ color: tema.textSecondary }}>{projeto.nome}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} style={{ color: tema.textSecondary }} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-lg" style={{ backgroundColor: tema.background }}>
            <div>
              <p className="text-sm font-medium" style={{ color: tema.textSecondary }}>Gerente</p>
              <p className="font-medium" style={{ color: tema.text }}>{projeto.gerente}</p>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: tema.textSecondary }}>Orçamento</p>
              <p className="font-medium" style={{ color: tema.text }}>{formatCurrency(projeto.orcamento)}</p>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: tema.textSecondary }}>Status</p>
              <span
                className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                style={{ backgroundColor: getCorStatusProjeto(projeto.status) }}
              >
                {getLabelStatusProjeto(projeto.status)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: tema.text }}>Critérios de Avaliação</h3>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              style={{ color: tema.primary }}
            >
              <History size={16} />
              Histórico
            </button>
          </div>

          <div className="space-y-4">
            {criterios.map((criterio) => (
              <div key={criterio.id} className="p-4 rounded-lg border" style={{ borderColor: tema.border }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: tema.text }}>{criterio.nome}</span>
                    {criterio.inverso && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${tema.warning}20`, color: tema.warning }}>
                        Inverso
                      </span>
                    )}
                    <div className="group relative">
                      <Info size={14} style={{ color: tema.textSecondary }} className="cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {criterio.descricao}
                        <div className="mt-1 pt-1 border-t border-gray-700">
                          <div>1-3: Baixo | 4-6: Médio</div>
                          <div>7-8: Alto | 9-10: Muito Alto</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm" style={{ color: tema.textSecondary }}>Peso: {criterio.peso}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={scores[criterio.id] || 5}
                    onChange={(e) => setScores({ ...scores, [criterio.id]: parseInt(e.target.value) })}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: tema.primary }}
                  />
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <span
                      className="text-lg font-bold w-8 text-center"
                      style={{ color: getScoreColor(scores[criterio.id] || 5) }}
                    >
                      {scores[criterio.id] || 5}
                    </span>
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${getScoreColor(scores[criterio.id] || 5)}20`, color: getScoreColor(scores[criterio.id] || 5) }}>
                      {getScoreLabel(scores[criterio.id] || 5)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: `${tema.primary}10` }}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold" style={{ color: tema.text }}>Score Total Calculado</span>
              <span className="text-3xl font-bold" style={{ color: tema.primary }}>{calcularScoreTotal()}</span>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2" style={{ color: tema.text }}>
              Observações / Justificativa
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg border focus:ring-2 focus:outline-none"
              style={{ borderColor: tema.border, backgroundColor: tema.surface }}
              placeholder="Adicione notas sobre a avaliação..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: tema.border }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border font-medium"
            style={{ borderColor: tema.border, color: tema.text }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: tema.primary }}
          >
            <Save size={18} />
            Salvar Avaliação
          </button>
        </div>
      </div>
    </div>
  );
};

interface ComparisonModalProps {
  projetos: ProjetoPrioritizado[];
  criterios: CriterioPriorizacao[];
  onClose: () => void;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ projetos, criterios, onClose }) => {
  const { tema } = useTemaStore();

  const radarData = criterios.map((c) => {
    const dataPoint: Record<string, any> = { criterio: c.nome };
    projetos.forEach((p) => {
      const scoreObj = p.scores.find((s) => s.criterioId === c.id);
      dataPoint[p.nome] = scoreObj?.score || 0;
    });
    return dataPoint;
  });

  const COLORS = [tema.primary, tema.secondary, tema.accent];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: tema.border }}>
          <h2 className="text-xl font-bold" style={{ color: tema.text }}>Comparação de Projetos</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} style={{ color: tema.textSecondary }} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {projetos.map((p, idx) => (
              <div key={p.id} className="p-4 rounded-lg border" style={{ borderColor: COLORS[idx], borderWidth: 2 }}>
                <h3 className="font-bold mb-2" style={{ color: COLORS[idx] }}>{p.nome}</h3>
                <p className="text-sm" style={{ color: tema.textSecondary }}>{p.gerente}</p>
                <p className="text-sm font-medium mt-2" style={{ color: tema.text }}>{formatCurrency(p.orcamento)}</p>
              </div>
            ))}
          </div>

          <div className="h-96 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke={tema.border} />
                <PolarAngleAxis dataKey="criterio" tick={{ fill: tema.textSecondary, fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: tema.textSecondary }} />
                {projetos.map((p, idx) => (
                  <Radar
                    key={p.id}
                    name={p.nome}
                    dataKey={p.nome}
                    stroke={COLORS[idx]}
                    fill={COLORS[idx]}
                    fillOpacity={0.2}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {projetos.map((p, idx) => {
              const strengths = criterios
                .map((c) => {
                  const score = p.scores.find((s) => s.criterioId === c.id)?.score || 0;
                  return { criterio: c, score };
                })
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

              const weaknesses = criterios
                .map((c) => {
                  const score = p.scores.find((s) => s.criterioId === c.id)?.score || 0;
                  return { criterio: c, score };
                })
                .sort((a, b) => a.score - b.score)
                .slice(0, 3);

              return (
                <div key={p.id} className="space-y-4">
                  <h4 className="font-bold" style={{ color: COLORS[idx] }}>{p.nome}</h4>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${tema.success}10` }}>
                    <p className="text-sm font-medium mb-2" style={{ color: tema.success }}>Pontos Fortes</p>
                    {strengths.map((s) => (
                      <div key={s.criterio.id} className="flex justify-between text-sm">
                        <span style={{ color: tema.text }}>{s.criterio.nome}</span>
                        <span className="font-medium" style={{ color: tema.success }}>{s.score}/10</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${tema.danger}10` }}>
                    <p className="text-sm font-medium mb-2" style={{ color: tema.danger }}>Pontos de Atenção</p>
                    {weaknesses.map((s) => (
                      <div key={s.criterio.id} className="flex justify-between text-sm">
                        <span style={{ color: tema.text }}>{s.criterio.nome}</span>
                        <span className="font-medium" style={{ color: tema.danger }}>{s.score}/10</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const PortfolioPage: React.FC = () => {
  const { tema } = useTemaStore();
  const [criterios, setCriterios] = useState<CriterioPriorizacao[]>(CRITERIOS_PADRAO);
  const [projetos, setProjetos] = useState<ProjetoPrioritizado[]>(MOCK_PROJETOS);
  const [showCriteriaPanel, setShowCriteriaPanel] = useState(false);
  const [selectedProjeto, setSelectedProjeto] = useState<ProjetoPrioritizado | null>(null);
  const [comparisonProjetos, setComparisonProjetos] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('scoreTotal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'comparison'>('chart');

  const pesoTotal = useMemo(() => criterios.reduce((sum, c) => sum + c.peso, 0), [criterios]);

  const calcularScoreTotal = (projeto: ProjetoPrioritizado): number => {
    let total = 0;
    criterios.forEach((c) => {
      const scoreObj = projeto.scores.find((s) => s.criterioId === c.id);
      const score = scoreObj?.score || 0;
      const adjustedScore = c.inverso ? 11 - score : score;
      total += adjustedScore * (c.peso / 100);
    });
    return Math.round(total * 10) / 10;
  };

  const projetosComScore = useMemo(() => {
    return projetos.map((p) => ({
      ...p,
      scoreTotal: calcularScoreTotal(p),
    }));
  }, [projetos, criterios]);

  const projetosOrdenados = useMemo(() => {
    return [...projetosComScore].sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortColumn === 'scoreTotal') {
        aVal = a.scoreTotal || 0;
        bVal = b.scoreTotal || 0;
      } else if (sortColumn === 'orcamento') {
        aVal = a.orcamento;
        bVal = b.orcamento;
      } else if (sortColumn === 'nome') {
        aVal = a.nome;
        bVal = b.nome;
      } else {
        const aScore = a.scores.find((s) => s.criterioId === sortColumn)?.score || 0;
        const bScore = b.scores.find((s) => s.criterioId === sortColumn)?.score || 0;
        aVal = aScore;
        bVal = bScore;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [projetosComScore, sortColumn, sortDirection]);

  const bubbleChartData = useMemo(() => {
    return projetosComScore.map((p) => ({
      x: p.scoreTotal || 0,
      y: p.valorEstrategico || 0,
      z: p.orcamento / 1000000,
      nome: p.nome,
      status: p.status,
      orcamento: p.orcamento,
      id: p.id,
    }));
  }, [projetosComScore]);

  const summaryStats = useMemo(() => {
    const altaPrioridade = projetosOrdenados.filter((_, idx) => idx < 3).length;
    const investimentoTotal = projetos.reduce((sum, p) => sum + p.orcamento, 0);
    const roiMedio = projetos.reduce((sum, p) => sum + (p.roiEsperado || 0), 0) / projetos.length;

    return {
      totalProjetos: projetos.length,
      altaPrioridade,
      investimentoTotal,
      roiMedio: Math.round(roiMedio * 10) / 10,
    };
  }, [projetos, projetosOrdenados]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleUpdateCriterio = (id: string, peso: number) => {
    setCriterios(criterios.map((c) => (c.id === id ? { ...c, peso } : c)));
  };

  const handleSaveScores = (projetoId: string, scores: ScoreCriterio[], observacoes?: string) => {
    setProjetos(
      projetos.map((p) =>
        p.id === projetoId ? { ...p, scores, observacoes } : p
      )
    );
  };

  const toggleComparison = (projetoId: string) => {
    if (comparisonProjetos.includes(projetoId)) {
      setComparisonProjetos(comparisonProjetos.filter((id) => id !== projetoId));
    } else if (comparisonProjetos.length < 3) {
      setComparisonProjetos([...comparisonProjetos, projetoId]);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-lg shadow-lg border" style={{ backgroundColor: tema.surface, borderColor: tema.border }}>
          <p className="font-bold mb-1" style={{ color: tema.text }}>{data.nome}</p>
          <p className="text-sm" style={{ color: tema.textSecondary }}>
            Score: <span className="font-medium" style={{ color: tema.primary }}>{data.x.toFixed(1)}</span>
          </p>
          <p className="text-sm" style={{ color: tema.textSecondary }}>
            Valor Estratégico: <span className="font-medium">{data.y}</span>
          </p>
          <p className="text-sm" style={{ color: tema.textSecondary }}>
            Orçamento: <span className="font-medium">{formatCurrency(data.orcamento)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: tema.text }}>
            Priorização de Portfólio
          </h1>
          <p className="text-sm" style={{ color: tema.textSecondary }}>
            Matriz de Priorização Multi-Critério
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCriteriaPanel(!showCriteriaPanel)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium"
            style={{ borderColor: tema.border, color: tema.text }}
          >
            <Settings size={18} />
            Configurar Critérios
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium"
            style={{ borderColor: tema.border, color: tema.text }}
          >
            <Download size={18} />
            Exportar Relatório
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: tema.primary }}
          >
            <Plus size={18} />
            Adicionar Projeto
          </button>
        </div>
      </div>

      {showCriteriaPanel && (
        <div className="card p-6 animate-slide-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: tema.text }}>
              Configuração de Critérios
            </h3>
            <button onClick={() => setShowCriteriaPanel(false)}>
              <ChevronUp size={20} style={{ color: tema.textSecondary }} />
            </button>
          </div>

          {pesoTotal !== 100 && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg mb-4"
              style={{ backgroundColor: `${tema.warning}20`, color: tema.warning }}
            >
              <AlertTriangle size={18} />
              <span className="text-sm font-medium">
                A soma dos pesos deve ser igual a 100%. Atual: {pesoTotal}%
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {criterios.map((criterio) => (
              <div key={criterio.id} className="p-4 rounded-lg border" style={{ borderColor: tema.border }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: tema.text }}>{criterio.nome}</span>
                    {criterio.inverso && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${tema.warning}20`, color: tema.warning }}>
                        Inverso
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold" style={{ color: tema.primary }}>{criterio.peso}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={criterio.peso}
                  onChange={(e) => handleUpdateCriterio(criterio.id, parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: tema.primary }}
                />
                <p className="text-xs mt-1" style={{ color: tema.textSecondary }}>{criterio.descricao}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: tema.primary }}
              disabled={pesoTotal !== 100}
            >
              <Save size={18} />
              Salvar Configuração
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total de Projetos"
          value={summaryStats.totalProjetos}
          icon={Briefcase}
          color="primary"
        />
        <KPICard
          title="Alta Prioridade"
          value={summaryStats.altaPrioridade}
          icon={Target}
          color="success"
        />
        <KPICard
          title="Investimento Total"
          value={formatCurrency(summaryStats.investimentoTotal)}
          icon={DollarSign}
          color="info"
        />
        <KPICard
          title="ROI Médio Esperado"
          value={`${summaryStats.roiMedio}%`}
          icon={TrendingUp}
          color="warning"
        />
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: tema.border }}>
        {[
          { id: 'chart', label: 'Visualização', icon: BarChart3 },
          { id: 'table', label: 'Ranking', icon: ArrowUpDown },
          { id: 'comparison', label: 'Comparação', icon: Eye },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-current' : 'border-transparent'
            }`}
            style={{
              color: activeTab === tab.id ? tema.primary : tema.textSecondary,
              borderColor: activeTab === tab.id ? tema.primary : 'transparent',
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'chart' && (
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: tema.text }}>
            Matriz de Priorização
          </h3>
          <div className="relative h-[500px]">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-green-50 dark:bg-green-900/10 flex items-start justify-end p-4">
                <span className="text-xs font-medium text-green-600">Alta Prioridade</span>
              </div>
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-50 dark:bg-blue-900/10 flex items-start justify-start p-4">
                <span className="text-xs font-medium text-blue-600">Revisar Estratégia</span>
              </div>
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-yellow-50 dark:bg-yellow-900/10 flex items-end justify-end p-4">
                <span className="text-xs font-medium text-yellow-600">Oportunidades</span>
              </div>
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gray-50 dark:bg-gray-900/10 flex items-end justify-start p-4">
                <span className="text-xs font-medium text-gray-600">Baixa Prioridade</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={tema.border} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Score"
                  domain={[0, 10]}
                  label={{ value: 'Score Composto', position: 'bottom', fill: tema.textSecondary }}
                  tick={{ fill: tema.textSecondary }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Valor Estratégico"
                  domain={[0, 100]}
                  label={{ value: 'Valor Estratégico', angle: -90, position: 'left', fill: tema.textSecondary }}
                  tick={{ fill: tema.textSecondary }}
                />
                <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Orçamento (M)" />
                <Tooltip content={<CustomTooltip />} />
                <Scatter
                  data={bubbleChartData}
                  onClick={(data) => {
                    const projeto = projetos.find((p) => p.id === data.id);
                    if (projeto) setSelectedProjeto(projeto);
                  }}
                  cursor="pointer"
                >
                  {bubbleChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCorStatusProjeto(entry.status)} fillOpacity={0.8} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getCorStatusProjeto(StatusProjeto.NO_PRAZO) }} />
              <span className="text-sm" style={{ color: tema.textSecondary }}>No Prazo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getCorStatusProjeto(StatusProjeto.EM_RISCO) }} />
              <span className="text-sm" style={{ color: tema.textSecondary }}>Em Risco</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getCorStatusProjeto(StatusProjeto.CRITICO) }} />
              <span className="text-sm" style={{ color: tema.textSecondary }}>Crítico</span>
            </div>
            <span className="text-sm" style={{ color: tema.textSecondary }}>• Tamanho = Orçamento</span>
          </div>
        </div>
      )}

      {activeTab === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: tema.background }}>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: tema.textSecondary }}>
                    Rank
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:opacity-80"
                    style={{ color: tema.textSecondary }}
                    onClick={() => handleSort('nome')}
                  >
                    <div className="flex items-center gap-1">
                      Projeto
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-medium cursor-pointer hover:opacity-80"
                    style={{ color: tema.textSecondary }}
                    onClick={() => handleSort('scoreTotal')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Score Total
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                  {criterios.map((c) => (
                    <th
                      key={c.id}
                      className="px-4 py-3 text-center text-sm font-medium cursor-pointer hover:opacity-80"
                      style={{ color: tema.textSecondary }}
                      onClick={() => handleSort(c.id)}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {c.nome.split(' ')[0]}
                        <ArrowUpDown size={14} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-medium" style={{ color: tema.textSecondary }}>
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium" style={{ color: tema.textSecondary }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {projetosOrdenados.map((projeto, index) => {
                  const rank = index + 1;
                  const rowBg =
                    rank <= 3 ? `${tema.success}10` : rank <= 6 ? `${tema.warning}10` : tema.surface;

                  return (
                    <tr
                      key={projeto.id}
                      className="border-t hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: rowBg, borderColor: tema.border }}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            rank <= 3 ? 'text-white' : ''
                          }`}
                          style={{
                            backgroundColor: rank <= 3 ? tema.success : rank <= 6 ? tema.warning : tema.border,
                            color: rank <= 3 || rank <= 6 ? 'white' : tema.text,
                          }}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium" style={{ color: tema.text }}>{projeto.nome}</p>
                          <p className="text-xs" style={{ color: tema.textSecondary }}>{projeto.gerente}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-lg font-bold" style={{ color: tema.primary }}>
                          {projeto.scoreTotal?.toFixed(1)}
                        </span>
                      </td>
                      {criterios.map((c) => {
                        const scoreObj = projeto.scores.find((s) => s.criterioId === c.id);
                        const score = scoreObj?.score || 0;
                        return (
                          <td key={c.id} className="px-4 py-3 text-center">
                            <span
                              className="inline-block px-2 py-1 rounded text-sm font-medium"
                              style={{ backgroundColor: `${getScoreColor(score)}20`, color: getScoreColor(score) }}
                            >
                              {score}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: getCorStatusProjeto(projeto.status) }}
                        >
                          {getLabelStatusProjeto(projeto.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedProjeto(projeto)}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Editar Scores"
                          >
                            <Edit2 size={16} style={{ color: tema.primary }} />
                          </button>
                          <button
                            onClick={() => toggleComparison(projeto.id)}
                            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              comparisonProjetos.includes(projeto.id) ? 'ring-2 ring-blue-500' : ''
                            }`}
                            title="Adicionar à comparação"
                          >
                            {comparisonProjetos.includes(projeto.id) ? (
                              <Check size={16} style={{ color: tema.success }} />
                            ) : (
                              <Eye size={16} style={{ color: tema.textSecondary }} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: tema.text }}>Comparação de Projetos</h3>
              <p className="text-sm" style={{ color: tema.textSecondary }}>
                Selecione até 3 projetos para comparar
              </p>
            </div>
            {comparisonProjetos.length >= 2 && (
              <button
                onClick={() => setShowComparison(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: tema.primary }}
              >
                <Eye size={18} />
                Ver Comparação ({comparisonProjetos.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {projetosOrdenados.map((projeto) => (
              <div
                key={projeto.id}
                onClick={() => toggleComparison(projeto.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  comparisonProjetos.includes(projeto.id) ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                }`}
                style={{
                  borderColor: comparisonProjetos.includes(projeto.id) ? tema.primary : tema.border,
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium" style={{ color: tema.text }}>{projeto.nome}</h4>
                  {comparisonProjetos.includes(projeto.id) && (
                    <Check size={20} style={{ color: tema.success }} />
                  )}
                </div>
                <p className="text-sm mb-2" style={{ color: tema.textSecondary }}>{projeto.gerente}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: tema.text }}>
                    {formatCurrency(projeto.orcamento)}
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: tema.primary }}
                  >
                    {projeto.scoreTotal?.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedProjeto && (
        <ScoreModal
          projeto={selectedProjeto}
          criterios={criterios}
          onClose={() => setSelectedProjeto(null)}
          onSave={handleSaveScores}
        />
      )}

      {showComparison && comparisonProjetos.length >= 2 && (
        <ComparisonModal
          projetos={projetos.filter((p) => comparisonProjetos.includes(p.id))}
          criterios={criterios}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
};

export default PortfolioPage;
