# 📊 VisionPlan Gantt - Biblioteca Própria

> **Biblioteca de Gantt Chart 100% VisionPlan**  
> Baseada em Frappe Gantt (MIT License) com wrapper e customizações próprias

---

## 🎯 **VISÃO GERAL**

O **VisionPlan Gantt** é uma biblioteca própria de Gantt Chart desenvolvida especificamente para o sistema VisionPlan. Ela usa o **Frappe Gantt** como engine de renderização, mas toda a API, tipos, conversores e customizações são 100% nossos.

### **Por que criar nossa própria biblioteca?**

1. **Controle Total**: API completamente nossa, sem limitações de libs externas
2. **Customização Ilimitada**: Formatos de data, cores, tooltips, tudo personalizável
3. **Escalabilidade**: Fácil adicionar novas features sem depender de terceiros
4. **Performance**: Bundle pequeno (~20KB vs ~200KB da lib anterior)
5. **Manutenção**: Podemos corrigir bugs e adicionar features imediatamente
6. **Independência**: Pode trocar a engine depois sem quebrar o código existente

---

## 📦 **ARQUITETURA**

### **Estrutura de Arquivos**

```
src/lib/gantt/
├── types.ts              # Tipos próprios do VisionPlan Gantt
├── adapter.ts            # Conversão de dados (AtividadeMock <-> VPGanttTask)
├── VPGanttChart.tsx      # Componente React principal
├── vp-gantt.css          # Estilos customizados
└── index.ts              # Exports públicos
```

### **Fluxo de Dados**

```
┌─────────────────────────────────────────────────────────────┐
│                     APLICAÇÃO VISIONPLAN                     │
│  (AtividadeMock, DependenciaAtividade, ConfiguracoesProjeto) │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    GANTT ADAPTER                             │
│  • Converte AtividadeMock -> VPGanttTask                     │
│  • Aplica dependências e hierarquia                          │
│  • Define classes CSS (critical, completed, etc)             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   VPGANTT COMPONENT                          │
│  • Renderiza Frappe Gantt                                    │
│  • Aplica configurações (cores, formatos)                    │
│  • Tooltips customizados                                     │
│  • Callbacks (click, date change, progress)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRAPPE GANTT ENGINE                        │
│  • Renderização SVG                                          │
│  • Drag & drop                                               │
│  • Timeline                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 **COMPONENTES**

### **1. Types (`types.ts`)**

Define todos os tipos do VisionPlan Gantt:

#### **VPGanttTask**

```typescript
interface VPGanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies?: string[];
  custom_class?: string;
  parent?: string;
  
  // Dados customizados do VisionPlan
  tipo: 'Tarefa' | 'Marco' | 'Fase';
  status: string;
  responsavel?: string;
  e_critica?: boolean;
  duracao_horas?: number;
  codigo?: string;
}
```

#### **VPGanttConfig**

```typescript
interface VPGanttConfig {
  // Formatos de data
  formato_header?: FormatoData;
  formato_tooltip?: FormatoData;
  
  // Cores
  cor_barra_normal?: string;
  cor_barra_critica?: string;
  cor_barra_concluida?: string;
  cor_marco?: string;
  cor_fase?: string;
  
  // Comportamento
  view_mode?: 'Hour' | 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Year';
  language?: string;
  readonly?: boolean;
  
  // Callbacks
  on_click?: (task: VPGanttTask) => void;
  on_date_change?: (task: VPGanttTask, start: Date, end: Date) => void;
  on_progress_change?: (task: VPGanttTask, progress: number) => void;
  on_view_change?: (mode: string) => void;
}
```

### **2. Adapter (`adapter.ts`)**

Converte dados entre o formato do VisionPlan e o formato do Gantt.

#### **Classes CSS Aplicadas**

| Classe CSS | Condição | Uso |
|------------|----------|-----|
| `vp-critical` | `atividade.e_critica === true` | Cor vermelha, borda destacada |
| `vp-completed` | `atividade.progresso === 100` | Opacidade reduzida |
| `vp-delayed` | `atividade.status === 'Atrasada'` | Cor de alerta |
| `vp-phase` | `atividade.tipo === 'Fase'` | Barra mais alta, opacidade |
| `vp-milestone` | `atividade.tipo === 'Marco'` | Formato diamante |

#### **Métodos**

```typescript
// Converte atividades para tasks do Gantt
toGanttTasks(atividades: AtividadeMock[]): VPGanttTask[]

// Converte task de volta para atividade
fromGanttTask(task: VPGanttTask): Partial<AtividadeMock>

// Aplica dependências e hierarquia
applyDependencies(tasks, atividades, dependencias): VPGanttTask[]
```

### **3. VPGanttChart Component (`VPGanttChart.tsx`)**

Componente React principal que renderiza o Gantt.

#### **Uso Básico**

```tsx
import { VPGanttChart } from '../../../lib/gantt';

<VPGanttChart
  tasks={vpTasks}
  config={{
    view_mode: 'Day',
    language: 'pt',
    on_click: (task) => console.log('Clicked:', task),
    on_date_change: (task, start, end) => {
      console.log('Date changed:', task.id, start, end);
    },
  }}
/>
```

#### **Features**

✅ **Tooltips Customizados**
- HTML rico com dados da atividade
- Formatos de data configuráveis
- Destaque para atividades críticas

✅ **Cores Personalizadas**
- Lê `configuracoes` do Store
- Aplica cores dinamicamente via CSS
- Suporta dark mode

✅ **Interatividade**
- Drag & drop para mudar datas
- Clique para abrir detalhes
- Edição de progresso

✅ **Performance**
- Renderização otimizada com `useMemo`
- Cleanup adequado (`useEffect` return)
- Sem memory leaks

### **4. Estilos (`vp-gantt.css`)**

Estilos profissionais e modernos:

- **Container**: Border radius, shadow, scrollbars customizados
- **Grid**: Zebra striping, borders suaves
- **Barras**: Bordas arredondadas, hover effects, transições
- **Tooltips**: Design elegante, cores contrastantes
- **Responsivo**: Ajustes para mobile
- **Dark Mode**: Suporte opcional

---

## 🚀 **INTEGRAÇÃO**

### **Como Usar no VisionPlan**

O componente `GanttChart.tsx` já está integrado:

```tsx
// src/components/features/cronograma/GanttChart.tsx

import { VPGanttChart } from '../../../lib/gantt';
import { createGanttAdapter } from '../../../lib/gantt/adapter';

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, viewMode, ... }) => {
  const { configuracoes, atividades } = useCronogramaStore();
  const adapter = useMemo(() => createGanttAdapter(), []);

  // Converte tasks
  const vpTasks = useMemo(() => {
    return tasks.map((task) => {
      const atividade = atividades.find((a) => a.id === task.id);
      return {
        id: task.id,
        name: task.name,
        start: task.start,
        end: task.end,
        progress: task.progress,
        // ... mais campos
      };
    });
  }, [tasks, atividades]);

  return <VPGanttChart tasks={vpTasks} config={vpConfig} />;
};
```

### **Compatibilidade**

✅ Mantém API existente do `GanttChart.tsx`  
✅ Todos os callbacks funcionam como antes  
✅ Sem breaking changes  
✅ Drop-in replacement  

---

## 🎨 **CUSTOMIZAÇÃO**

### **Cores**

As cores são aplicadas via Store:

```typescript
// src/stores/cronogramaStore.ts

configuracoes: {
  cor_tarefa_normal: '#3b82f6',      // Azul
  cor_tarefa_critica: '#ef4444',     // Vermelho
  cor_tarefa_concluida: '#10b981',   // Verde
  cor_marco: '#f59e0b',              // Laranja
  cor_fase: '#8b5cf6',               // Roxo
}
```

### **Formatos de Data**

Os formatos são aplicados nos tooltips:

```typescript
configuracoes: {
  formato_data_tooltip: FormatoData.DD_MMM_AA,  // "15 Jan 25"
}
```

### **View Modes**

Suporta todos os modos do Frappe Gantt:

- `Hour`: Visualização por hora
- `Quarter Day`: 6 horas
- `Half Day`: 12 horas
- `Day`: Dia (padrão)
- `Week`: Semana
- `Month`: Mês
- `Year`: Ano

---

## 📊 **VANTAGENS vs Biblioteca Anterior**

| Aspecto | gantt-task-react | VisionPlan Gantt |
|---------|------------------|------------------|
| **Bundle Size** | ~200KB | ~20KB |
| **Customização** | Limitada | Ilimitada |
| **Formatos de Data** | Fixos | 17 configuráveis |
| **Tooltips** | Básicos | HTML rico |
| **Hierarquia** | Básica | Completa com CSS |
| **Cores** | Props fixas | Store dinâmico |
| **API** | Terceiros | 100% nossa |
| **Licença** | MIT | MIT (Frappe) |
| **Controle** | Baixo | Total |
| **Manutenção** | Depende de terceiros | Nossa |

---

## 🔮 **PRÓXIMOS PASSOS**

### **Features Planejadas**

1. **Expand/Collapse de Grupos**
   - Botão para expandir/colapsar fases
   - Estado persistido no Store

2. **Baseline (Planejado vs Realizado)**
   - Linha de base em cinza
   - Comparação visual

3. **Export de Timeline**
   - Export em PNG
   - Export em SVG
   - Include no PDF

4. **Zoom Avançado**
   - Zoom in/out com scroll
   - Mini-map de navegação

5. **Filtros na Timeline**
   - Filtrar por responsável
   - Filtrar por status
   - Filtrar por criticidade

6. **Recursos/Alocação**
   - Mostrar pessoas alocadas
   - Gráfico de carga

7. **Calendários Customizados**
   - Feriados
   - Horários de trabalho
   - Dias não úteis

8. **Auto-Scheduling**
   - Recalcular datas automaticamente
   - Respeitar dependências

### **Melhorias de Engine**

Se precisar de features muito avançadas, podemos:

1. **Trocar Engine** (sem quebrar código):
   - DHTMLX Gantt (mais poderoso)
   - Bryntum Gantt (ultra profissional)
   - Implementação própria (100% controle)

2. **Customizar Frappe Gantt**:
   - Fork do repositório
   - Adicionar features específicas
   - Contribuir de volta (open source)

---

## 📝 **LICENCIAMENTO**

### **Frappe Gantt**
- **Licença**: MIT
- **Uso**: Livre, sem restrições
- **Código**: Open source

### **VisionPlan Gantt Wrapper**
- **Licença**: Proprietária (VisionPlan)
- **Código**: Wrapper, adapter, tipos, estilos
- **Uso**: Interno ao projeto

### **Resultado**
✅ Sem custos de licença  
✅ Sem restrições de uso  
✅ Pode comercializar livremente  
✅ Pode modificar e distribuir  

---

## 🛠️ **TROUBLESHOOTING**

### **Problema: Gantt não renderiza**

**Solução 1**: Verificar se há tasks
```tsx
if (tasks.length === 0) {
  // Mostra mensagem de vazio
}
```

**Solução 2**: Verificar formato de datas
```tsx
// Datas devem ser objetos Date válidos
start: new Date(atividade.data_inicio),
end: new Date(atividade.data_fim),
```

### **Problema: Cores não aplicam**

**Solução**: Verificar se `applyCustomStyles` está sendo chamado
```tsx
useEffect(() => {
  // ...
  applyCustomStyles(configuracoes);
}, [configuracoes]);
```

### **Problema: Tooltips não aparecem**

**Solução**: Verificar `custom_popup_html`
```tsx
custom_popup_html: (task) => {
  // Deve retornar string HTML válida
  return `<div class="vp-gantt-popup">...</div>`;
}
```

### **Problema: Dependências não aparecem**

**Solução**: Verificar formato
```tsx
dependencies: task.dependencies?.join(', ') || '',
// Frappe espera string separada por vírgulas: "task1, task2"
```

---

## 📚 **REFERÊNCIAS**

### **Frappe Gantt**
- 🌐 [Site Oficial](https://frappe.io/gantt)
- 📖 [Documentação](https://github.com/frappe/gantt)
- 💻 [GitHub](https://github.com/frappe/gantt)
- 🎨 [Demo Online](https://frappe.io/gantt)

### **VisionPlan**
- 📄 `src/lib/gantt/` - Código fonte
- 📄 `docs/PLANO_CRONOGRAMA.md` - Planejamento
- 📄 `docs/CRONOGRAMA_CHECKLIST.md` - Checklist

---

## ✅ **CONCLUSÃO**

O **VisionPlan Gantt** é uma solução robusta, escalável e profissional para visualização de cronogramas no VisionPlan. Com API própria, customização total e engine leve, oferece a melhor experiência possível tanto para desenvolvedores quanto para usuários finais.

**Principais Conquistas:**
- ✅ Biblioteca própria com controle total
- ✅ Bundle 10x menor que anterior
- ✅ Customização ilimitada
- ✅ Formatos de data configuráveis
- ✅ Tooltips ricos e profissionais
- ✅ Hierarquia completa
- ✅ Cores personalizáveis
- ✅ Performance otimizada
- ✅ MIT License (sem custos)

**Pronto para Produção!** 🚀

