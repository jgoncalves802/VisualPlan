import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { X, Save, RotateCcw, TrendingUp, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ResourceCurve, CurveType } from '@/services/resourceService';

const DISTRIBUTION_POINTS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

interface ResourceCurveEditorProps {
  isOpen: boolean;
  onClose: () => void;
  curve?: ResourceCurve;
  onSave: (curve: Omit<ResourceCurve, 'id' | 'createdAt' | 'updatedAt'>) => void;
  empresaId: string;
}

const CURVE_PRESETS: Record<CurveType, { name: string; description: string; points: number[] }> = {
  LINEAR: {
    name: 'Linear',
    description: 'Distribuição uniforme ao longo do tempo',
    points: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
  },
  BELL: {
    name: 'Curva S (Bell)',
    description: 'Distribuição em formato de sino - típica de projetos',
    points: [0, 1, 3, 6, 11, 18, 27, 37, 48, 60, 70, 78, 85, 90, 94, 96, 98, 99, 99.5, 99.9, 100],
  },
  FRONT_LOADED: {
    name: 'Front-loaded',
    description: 'Maior esforço no início do período',
    points: [0, 10, 19, 27, 35, 42, 49, 55, 61, 66, 71, 76, 80, 84, 87, 90, 93, 95, 97, 99, 100],
  },
  BACK_LOADED: {
    name: 'Back-loaded',
    description: 'Maior esforço no final do período',
    points: [0, 1, 3, 5, 7, 10, 13, 16, 20, 24, 29, 34, 39, 45, 52, 60, 70, 80, 90, 97, 100],
  },
  TRIANGULAR: {
    name: 'Triangular',
    description: 'Pico no meio do período',
    points: [0, 2, 6, 12, 20, 30, 40, 50, 60, 70, 75, 78, 81, 84, 87, 90, 93, 95, 97, 99, 100],
  },
  TRAPEZOIDAL: {
    name: 'Trapezoidal',
    description: 'Distribuição em trapézio - estável no meio',
    points: [0, 4, 10, 18, 28, 40, 50, 58, 64, 70, 75, 80, 84, 88, 91, 93, 95, 97, 98, 99, 100],
  },
  CUSTOM: {
    name: 'Personalizada',
    description: 'Distribuição definida manualmente',
    points: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
  },
};

export function ResourceCurveEditor({
  isOpen,
  onClose,
  curve,
  onSave,
  empresaId,
}: ResourceCurveEditorProps) {
  const [nome, setNome] = useState(curve?.nome || '');
  const [descricao, setDescricao] = useState(curve?.descricao || '');
  const [curveType, setCurveType] = useState<CurveType>(curve?.curveType || 'LINEAR');
  const [distributionPoints, setDistributionPoints] = useState<number[]>(
    curve?.distributionPoints || CURVE_PRESETS.LINEAR.points
  );
  const [isDirty, setIsDirty] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (curve) {
      setNome(curve.nome);
      setDescricao(curve.descricao || '');
      setCurveType(curve.curveType);
      setDistributionPoints(curve.distributionPoints);
    }
  }, [curve]);

  const validatePoints = useCallback((points: number[]): string | null => {
    if (points.length !== 21) {
      return 'A curva deve ter exatamente 21 pontos';
    }
    if (points[0] !== 0) {
      return 'O primeiro ponto deve ser 0%';
    }
    if (points[20] !== 100) {
      return 'O último ponto deve ser 100%';
    }
    for (let i = 1; i < points.length; i++) {
      if (points[i] < points[i - 1]) {
        return `O ponto ${i * 5}% (${points[i]}%) é menor que o anterior (${points[i - 1]}%)`;
      }
    }
    return null;
  }, []);

  const handlePresetSelect = useCallback((type: CurveType) => {
    const preset = CURVE_PRESETS[type];
    setCurveType(type);
    setDistributionPoints([...preset.points]);
    setShowTypeSelector(false);
    setIsDirty(true);
    setValidationError(null);
  }, []);

  const handlePointChange = useCallback((index: number, value: number) => {
    setDistributionPoints(prev => {
      const newPoints = [...prev];
      newPoints[index] = Math.max(0, Math.min(100, value));
      setIsDirty(true);
      setValidationError(validatePoints(newPoints));
      return newPoints;
    });
    if (curveType !== 'CUSTOM') {
      setCurveType('CUSTOM');
    }
  }, [curveType, validatePoints]);

  const handleReset = useCallback(() => {
    const preset = CURVE_PRESETS[curveType];
    setDistributionPoints([...preset.points]);
    setIsDirty(false);
    setValidationError(null);
  }, [curveType]);

  const handleSave = useCallback(() => {
    const error = validatePoints(distributionPoints);
    if (error) {
      setValidationError(error);
      return;
    }

    const codigo = curve?.codigo || `CURVE-${Date.now().toString(36).toUpperCase()}`;
    
    onSave({
      empresaId,
      codigo,
      nome,
      descricao,
      curveType,
      distributionPoints,
      isSystemDefault: false,
      cor: '#8B5CF6',
      ativo: true,
    });
  }, [empresaId, nome, descricao, curveType, distributionPoints, onSave, validatePoints, curve]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = padding.top + (chartHeight * i / 10);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 20; i++) {
      const x = padding.left + (chartWidth * i / 20);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * (5 - i) / 5);
      ctx.fillText(`${i * 20}%`, padding.left - 5, y + 3);
    }
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const x = padding.left + (chartWidth * i / 4);
      ctx.fillText(`${i * 25}%`, x, height - padding.bottom + 15);
    }
    
    ctx.beginPath();
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    distributionPoints.forEach((point, index) => {
      const x = padding.left + (chartWidth * index / 20);
      const y = padding.top + chartHeight - (chartHeight * point / 100);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    ctx.fillStyle = '#3B82F6';
    distributionPoints.forEach((point, index) => {
      const x = padding.left + (chartWidth * index / 20);
      const y = padding.top + chartHeight - (chartHeight * point / 100);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.beginPath();
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    
    const linearPoints = CURVE_PRESETS.LINEAR.points;
    linearPoints.forEach((point, index) => {
      const x = padding.left + (chartWidth * index / 20);
      const y = padding.top + chartHeight - (chartHeight * point / 100);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.setLineDash([]);
    
  }, [distributionPoints]);

  const derivativeData = useMemo(() => {
    const derivatives: number[] = [];
    for (let i = 1; i < distributionPoints.length; i++) {
      const delta = distributionPoints[i] - distributionPoints[i - 1];
      derivatives.push(delta);
    }
    return derivatives;
  }, [distributionPoints]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div ref={containerRef} className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-purple-700">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                {curve ? 'Editar Curva de Distribuição' : 'Nova Curva de Distribuição'}
              </h2>
              <p className="text-sm text-purple-100">
                Defina como os recursos serão distribuídos ao longo do tempo
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Curva *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Curva S - Projeto Padrão"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Curva
              </label>
              <button
                onClick={() => setShowTypeSelector(!showTypeSelector)}
                className="w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between hover:bg-gray-50"
              >
                <span>{CURVE_PRESETS[curveType].name}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              
              {showTypeSelector && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
                  {Object.entries(CURVE_PRESETS).map(([type, preset]) => (
                    <button
                      key={type}
                      onClick={() => handlePresetSelect(type as CurveType)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b last:border-0 ${
                        type === curveType ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{preset.name}</div>
                        <div className="text-xs text-gray-500">{preset.description}</div>
                      </div>
                      {type === curveType && <Check className="w-4 h-4 text-purple-600 mt-1" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional da curva"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Visualização da Curva</h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-blue-500 rounded"></span>
                  Curva atual
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-gray-400 rounded border-dashed border-b"></span>
                  Linear (referência)
                </span>
              </div>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <canvas
                ref={canvasRef}
                className="w-full h-48"
                style={{ display: 'block' }}
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Pontos de Distribuição (% acumulado)
              </h3>
              <button
                onClick={handleReset}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Resetar para padrão
              </button>
            </div>
            
            {validationError && (
              <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4" />
                {validationError}
              </div>
            )}
            
            <div className="grid grid-cols-7 gap-2">
              {DISTRIBUTION_POINTS.map((pct, index) => (
                <div key={pct} className="text-center">
                  <label className="block text-[10px] text-gray-500 mb-1">{pct}%</label>
                  <input
                    type="number"
                    value={distributionPoints[index]}
                    onChange={(e) => handlePointChange(index, parseFloat(e.target.value) || 0)}
                    disabled={index === 0 || index === 20}
                    className={`w-full px-1 py-1 text-xs text-center border rounded ${
                      index === 0 || index === 20
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                    }`}
                    min={0}
                    max={100}
                    step={0.1}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Taxa de Variação por Período (derivada)
            </h3>
            <div className="flex items-end gap-1 h-16 bg-gray-50 border rounded-lg p-2">
              {derivativeData.map((delta, index) => {
                const maxDelta = Math.max(...derivativeData);
                const height = maxDelta > 0 ? (delta / maxDelta) * 100 : 0;
                const isHigh = delta > 10;
                
                return (
                  <div
                    key={index}
                    className={`flex-1 rounded-t ${isHigh ? 'bg-purple-500' : 'bg-purple-300'}`}
                    style={{ height: `${Math.max(4, height)}%` }}
                    title={`${index * 5}%-${(index + 1) * 5}%: ${delta.toFixed(1)}%`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>Início</span>
              <span>Fim</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isDirty && (
              <span className="text-amber-600">Alterações não salvas</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!nome.trim() || !!validationError}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Salvar Curva
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResourceCurveEditor;
