import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  FolderTree,
  Calendar,
  ClipboardList,
  AlertTriangle,
  Target,
  ArrowRight,
  Play,
  Info,
  Layers
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  tips: string[];
  warningsToAvoid: string[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'projeto',
    title: '1. Selecione o Projeto',
    description: 'Sempre comece selecionando o projeto correto no seletor global.',
    icon: <FolderTree className="w-8 h-8 text-blue-500" />,
    details: [
      'O seletor de projeto fica no topo de cada página',
      'Todos os dados carregados serão do projeto selecionado',
      'Ao trocar de projeto, o sistema limpa automaticamente os dados anteriores',
      'Aguarde o carregamento completo antes de interagir'
    ],
    tips: [
      'Verifique sempre o nome do projeto no cabeçalho',
      'Se os dados parecerem incorretos, selecione o projeto novamente'
    ],
    warningsToAvoid: [
      'Evite trocar de projeto rapidamente sem aguardar o carregamento',
      'Não edite dados enquanto o sistema está carregando'
    ]
  },
  {
    id: 'eps-wbs',
    title: '2. Estruture a EPS/WBS',
    description: 'Crie a estrutura hierárquica do projeto antes de adicionar atividades.',
    icon: <Layers className="w-8 h-8 text-purple-500" />,
    details: [
      'EPS (Enterprise Project Structure) organiza projetos em níveis',
      'WBS (Work Breakdown Structure) decompõe o trabalho em pacotes',
      'Cada nó WBS pode conter atividades do cronograma',
      'A hierarquia é herdada automaticamente no Gantt'
    ],
    tips: [
      'Planeje a estrutura antes de criar no sistema',
      'Use códigos consistentes (ex: 1.1, 1.2, 1.2.1)',
      'Mantenha máximo 4-5 níveis de profundidade'
    ],
    warningsToAvoid: [
      'Não crie atividades sem antes definir a WBS',
      'Evite estruturas muito profundas que dificultam visualização'
    ]
  },
  {
    id: 'cronograma',
    title: '3. Monte o Cronograma',
    description: 'Adicione atividades ao cronograma dentro da estrutura WBS.',
    icon: <Calendar className="w-8 h-8 text-green-500" />,
    details: [
      'Selecione o cronograma específico no EPS Selector',
      'Adicione atividades clicando no botão "+" ou Enter',
      'Defina datas, durações e dependências',
      'O código da atividade é gerado automaticamente (A1010, A1020...)'
    ],
    tips: [
      'Use dependências para criar o fluxo lógico',
      'Verifique o caminho crítico para priorizar tarefas',
      'Mantenha durações realistas'
    ],
    warningsToAvoid: [
      'Não misture atividades de diferentes projetos',
      'Evite dependências circulares'
    ]
  },
  {
    id: 'takeoff',
    title: '4. Cadastre Quantitativos (Take-off)',
    description: 'Registre os quantitativos físicos do projeto para acompanhamento.',
    icon: <ClipboardList className="w-8 h-8 text-orange-500" />,
    details: [
      'Crie mapas de quantitativo por disciplina',
      'Importe dados via Excel usando o template',
      'Vincule itens às atividades do cronograma',
      'Registre medições para acompanhar progresso físico'
    ],
    tips: [
      'Use o template Excel para importação em massa',
      'Mantenha unidades consistentes (m, m², m³, kg)',
      'Atualize as medições semanalmente'
    ],
    warningsToAvoid: [
      'Não importe sem verificar o mapeamento de colunas',
      'Evite duplicar itens - use o campo código para controle'
    ]
  },
  {
    id: 'restricoes',
    title: '5. Gerencie Restrições',
    description: 'Identifique e trate restrições que impedem o avanço das atividades.',
    icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
    details: [
      'Cadastre restrições por categoria (6M: Mão de obra, Material, etc)',
      'Defina responsáveis e prazos',
      'Acompanhe o status no Kaizen (Análise Ishikawa)',
      'Vincule restrições às atividades afetadas'
    ],
    tips: [
      'Classifique corretamente para análises Pareto',
      'Defina ações 5W2H para cada restrição',
      'Revise semanalmente nas reuniões'
    ],
    warningsToAvoid: [
      'Não deixe restrições sem responsável definido',
      'Evite prazos genéricos - seja específico'
    ]
  },
  {
    id: 'lps',
    title: '6. Aplique o Last Planner System',
    description: 'Implemente o planejamento colaborativo semanal.',
    icon: <Target className="w-8 h-8 text-indigo-500" />,
    details: [
      'Crie a programação semanal com atividades do cronograma',
      'Produção aceita ou rejeita atividades propostas',
      'Faça check-in/check-out diário',
      'Calcule o PPC (Percentual de Plano Concluído)'
    ],
    tips: [
      'Envolva a equipe de produção na aceitação',
      'Registre motivos de não conclusão',
      'Use o histórico para melhorar planejamentos futuros'
    ],
    warningsToAvoid: [
      'Não altere a programação após aceitação da produção',
      'Evite atividades sem condições de prontidão'
    ]
  }
];

interface FlowDiagramProps {
  currentStep: number;
}

const FlowDiagram: React.FC<FlowDiagramProps> = ({ currentStep }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Play className="w-5 h-5 text-blue-500" />
        Fluxo de Trabalho Recomendado
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {TUTORIAL_STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div 
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                ${index === currentStep 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : index < currentStep
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }
              `}
            >
              {index < currentStep ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-current text-white text-xs">
                  {index + 1}
                </span>
              )}
              <span className="text-sm font-medium">{step.title.replace(/^\d+\.\s*/, '')}</span>
            </div>
            {index < TUTORIAL_STEPS.length - 1 && (
              <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const TutorialPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentTutorial = TUTORIAL_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentTutorial.id]));
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tutorial de Uso - VisionPlan
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Aprenda o fluxo correto para gerenciar seus projetos sem erros
            </p>
          </div>
        </div>

        <FlowDiagram currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Etapas do Tutorial
              </h3>
              <nav className="space-y-2">
                {TUTORIAL_STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(index)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                      ${index === currentStep 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                        : completedSteps.has(step.id)
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    {completedSteps.has(step.id) ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className={`
                        w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${index === currentStep 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }
                      `}>
                        {index + 1}
                      </div>
                    )}
                    <span className="text-sm truncate">{step.title.replace(/^\d+\.\s*/, '')}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  {currentTutorial.icon}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentTutorial.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentTutorial.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    O que fazer
                  </h3>
                  <ul className="space-y-2">
                    {currentTutorial.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <ChevronRight className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Dicas
                  </h3>
                  <ul className="space-y-2">
                    {currentTutorial.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-green-700 dark:text-green-400">
                        <span className="text-green-500">-</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Evite
                  </h3>
                  <ul className="space-y-2">
                    {currentTutorial.warningsToAvoid.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                        <span className="text-amber-500">-</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${currentStep === 0
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Anterior
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {currentStep + 1} de {TUTORIAL_STEPS.length}
                  </span>
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentStep === TUTORIAL_STEPS.length - 1}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${currentStep === TUTORIAL_STEPS.length - 1
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    }
                  `}
                >
                  {currentStep === TUTORIAL_STEPS.length - 1 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Concluído
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">
            Regras de Ouro para Evitar Erros
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-300 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-200">Sempre selecione o projeto primeiro</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">O projeto selecionado determina todos os dados exibidos</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-300 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-200">Aguarde o carregamento completo</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">Nunca edite enquanto dados estão sendo carregados</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-300 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-200">Verifique os dados antes de salvar</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">Confira se os dados pertencem ao projeto correto</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-300 font-bold">4</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-200">Use o fluxo recomendado</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">Projeto - EPS/WBS - Cronograma - Take-off - Restrições - LPS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
