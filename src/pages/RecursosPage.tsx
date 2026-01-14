import React, { useState, useMemo } from 'react';
import { useResources } from '../hooks/useResources';
import { useAuthStore } from '../stores/authStore';
import ProjetoSelector from '../components/ui/ProjetoSelector';
import { ResourceHistogram } from '../components/features/recursos/ResourceHistogram';
import { SCurveChart, SCurveDataPoint } from '../components/features/recursos/SCurveChart';
import { CommodityCurvesChart, CommodityDataPoint } from '../components/features/recursos/CommodityCurvesChart';
import { ResourceCurveEditor } from '../components/features/recursos/ResourceCurveEditor';
import { ResourceAssignmentModal } from '../components/features/cronograma/ResourceAssignmentModal';
import { ResourceFormModal } from '../components/features/recursos/ResourceFormModal';
import { Resource, ResourceCurve, resourceService } from '../services/resourceService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { 
  Users, 
  TrendingUp, 
  BarChart3, 
  Plus, 
  AlertTriangle,
  Hammer,
  Truck,
  Package,
  Briefcase,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  WORK: <Users className="w-4 h-4" />,
  MATERIAL: <Package className="w-4 h-4" />,
  COST: <BarChart3 className="w-4 h-4" />,
  GENERIC: <Briefcase className="w-4 h-4" />,
  BUDGET: <TrendingUp className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  WORK: 'bg-blue-100 text-blue-800',
  MATERIAL: 'bg-green-100 text-green-800',
  COST: 'bg-amber-100 text-amber-800',
  GENERIC: 'bg-purple-100 text-purple-800',
  BUDGET: 'bg-gray-100 text-gray-800',
};

const categoryLabels: Record<string, string> = {
  WORK: 'Mão de Obra',
  MATERIAL: 'Material',
  COST: 'Custo',
  GENERIC: 'Genérico',
  BUDGET: 'Orçamento',
};

export function RecursosPage() {
  const { usuario } = useAuthStore();
  const empresaId = usuario?.empresaId || '';
  
  const { resources, allocations, isLoading, error, refresh } = useResources(empresaId);
  
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showCurveEditor, setShowCurveEditor] = useState(false);
  const [editingCurve, setEditingCurve] = useState<ResourceCurve | undefined>();
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | undefined>();
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const matchesSearch = r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           r.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      const category = r.resourceType?.categoria || '';
      const matchesCategory = !categoryFilter || category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [resources, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
    const totalResources = resources.length;
    const totalAllocations = allocations.length;
    const byCategory = resources.reduce((acc, r) => {
      const cat = r.resourceType?.categoria || 'GENERIC';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const overallocated = allocations.filter(a => a.unidades > 100).length;
    
    return { totalResources, totalAllocations, byCategory, overallocated };
  }, [resources, allocations]);

  const histogramAllocations = useMemo(() => {
    return allocations.map(a => ({
      id: a.id,
      resourceId: a.resourceId,
      atividadeId: a.atividadeId,
      atividadeNome: 'Atividade',
      dataInicio: a.dataInicio,
      dataFim: a.dataFim,
      unidades: a.unidades,
      unitsPerTime: 8,
    }));
  }, [allocations]);

  const scurveData: SCurveDataPoint[] = useMemo(() => {
    const today = new Date();
    const data: SCurveDataPoint[] = [];
    let plannedCumulative = 0;
    let actualCumulative = 0;
    let earnedValueCumulative = 0;
    
    for (let i = -30; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dailyPlanned = 5000 + Math.random() * 2000;
      const dailyActual = i <= 0 ? dailyPlanned * (0.8 + Math.random() * 0.4) : 0;
      const dailyEarned = i <= 0 ? dailyPlanned * (0.7 + Math.random() * 0.5) : 0;
      
      plannedCumulative += dailyPlanned;
      actualCumulative += dailyActual;
      earnedValueCumulative += dailyEarned;
      
      data.push({
        date: date.toISOString().split('T')[0],
        plannedCumulative,
        actualCumulative,
        earnedValueCumulative,
      });
    }
    
    return data;
  }, []);

  const commodityData: CommodityDataPoint[] = useMemo(() => {
    const today = new Date();
    const data: CommodityDataPoint[] = [];
    let laborCum = 0, materialCum = 0, equipmentCum = 0, subCum = 0, otherCum = 0, totalCum = 0;
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - 6 + i);
      
      const labor = 50000 + Math.random() * 30000;
      const material = 80000 + Math.random() * 40000;
      const equipment = 20000 + Math.random() * 15000;
      const subcontractor = 30000 + Math.random() * 20000;
      const other = 5000 + Math.random() * 3000;
      const total = labor + material + equipment + subcontractor + other;
      
      laborCum += labor;
      materialCum += material;
      equipmentCum += equipment;
      subCum += subcontractor;
      otherCum += other;
      totalCum += total;
      
      data.push({
        date: date.toISOString().split('T')[0],
        labor,
        material,
        equipment,
        subcontractor,
        other,
        total,
        laborCumulative: laborCum,
        materialCumulative: materialCum,
        equipmentCumulative: equipmentCum,
        subcontractorCumulative: subCum,
        otherCumulative: otherCum,
        totalCumulative: totalCum,
      });
    }
    
    return data;
  }, []);

  const handleSaveCurve = async (curve: Omit<ResourceCurve, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await resourceService.createResourceCurve(curve);
      setShowCurveEditor(false);
      setEditingCurve(undefined);
      refresh();
    } catch (err) {
      console.error('Error saving curve:', err);
    }
  };

  const handleResourceClick = (resource: Resource) => {
    setSelectedResourceId(resource.id);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Erro ao carregar recursos</p>
          <Button onClick={() => refresh()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Hammer className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Gestão de Recursos</h1>
                <p className="text-sm text-gray-500">Alocação, histograma e curvas de recursos</p>
              </div>
            </div>
            <ProjetoSelector compact />
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowCurveEditor(true)}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Nova Curva
            </Button>
            <Button variant="secondary" onClick={() => setShowAssignmentModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Alocação
            </Button>
            <Button onClick={() => { setEditingResource(undefined); setShowResourceForm(true); }}>
              <Users className="w-4 h-4 mr-2" />
              Novo Recurso
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 p-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalResources}</p>
              <p className="text-sm text-gray-500">Recursos</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAllocations}</p>
              <p className="text-sm text-gray-500">Alocações</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.byCategory['WORK'] || 0}
              </p>
              <p className="text-sm text-gray-500">Mão de Obra</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.overallocated > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${stats.overallocated > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.overallocated}</p>
              <p className="text-sm text-gray-500">Sobre-alocados</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="recursos">Recursos</TabsTrigger>
            <TabsTrigger value="histograma">Histograma</TabsTrigger>
            <TabsTrigger value="curva-s">Curva S</TabsTrigger>
            <TabsTrigger value="commodities">Commodities</TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral" className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Histograma de Recursos</h3>
                <ResourceHistogram
                  resources={resources}
                  allocations={histogramAllocations}
                  startDate={new Date()}
                  selectedResourceId={selectedResourceId || undefined}
                  onResourceSelect={setSelectedResourceId}
                />
              </Card>
              
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Curva S - Valor Agregado</h3>
                <SCurveChart
                  data={scurveData}
                  title=""
                  unit="cost"
                  showForecast={false}
                />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recursos" className="flex-1 overflow-auto">
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar recursos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={categoryFilter || ''}
                    onChange={(e) => setCategoryFilter(e.target.value || null)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Todas categorias</option>
                    <option value="WORK">Mão de Obra</option>
                    <option value="MATERIAL">Material</option>
                    <option value="COST">Custo</option>
                    <option value="GENERIC">Genérico</option>
                  </select>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                {filteredResources.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum recurso encontrado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {filteredResources.map(resource => {
                      const category = resource.resourceType?.categoria || 'GENERIC';
                      const color = resource.resourceType?.cor || '#6B7280';
                      const cost = resource.custoPorHora || 0;
                      
                      return (
                        <div
                          key={resource.id}
                          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleResourceClick(resource)}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: color + '20' }}
                            >
                              {categoryIcons[category] || <Users className="w-5 h-5" style={{ color }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{resource.nome}</p>
                              <p className="text-xs text-gray-500">{resource.codigo}</p>
                              <Badge className={`mt-2 ${categoryColors[category] || 'bg-gray-100 text-gray-800'}`}>
                                {categoryLabels[category] || category}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                            <span className="text-gray-500">Custo/h:</span>
                            <span className="font-medium">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="histograma" className="flex-1 overflow-auto">
            <Card className="h-full p-4">
              <ResourceHistogram
                resources={resources}
                allocations={histogramAllocations}
                startDate={new Date()}
                selectedResourceId={selectedResourceId || undefined}
                onResourceSelect={setSelectedResourceId}
              />
            </Card>
          </TabsContent>

          <TabsContent value="curva-s" className="flex-1 overflow-auto">
            <Card className="h-full p-4">
              <SCurveChart
                data={scurveData}
                title="Curva S - Análise de Valor Agregado"
                unit="cost"
                showForecast={true}
                showEarnedValue={true}
                dataDate={new Date().toISOString().split('T')[0]}
              />
            </Card>
          </TabsContent>

          <TabsContent value="commodities" className="flex-1 overflow-auto">
            <Card className="h-full p-4">
              <CommodityCurvesChart
                data={commodityData}
                title="Curvas de Commodities"
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showCurveEditor && (
        <ResourceCurveEditor
          isOpen={showCurveEditor}
          onClose={() => {
            setShowCurveEditor(false);
            setEditingCurve(undefined);
          }}
          curve={editingCurve}
          onSave={handleSaveCurve}
          empresaId={empresaId}
        />
      )}

      {showAssignmentModal && (
        <ResourceAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
          }}
          atividadeId=""
          atividadeNome="Nova Alocação"
          empresaId={empresaId}
          startDate={new Date().toISOString().split('T')[0]}
          endDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          duration={7}
          onSave={() => {
            setShowAssignmentModal(false);
            refresh();
          }}
        />
      )}

      {showResourceForm && (
        <ResourceFormModal
          isOpen={showResourceForm}
          onClose={() => {
            setShowResourceForm(false);
            setEditingResource(undefined);
          }}
          onSave={() => {
            setShowResourceForm(false);
            setEditingResource(undefined);
            refresh();
          }}
          empresaId={empresaId}
          editingResource={editingResource}
        />
      )}
    </div>
  );
}

export default RecursosPage;
