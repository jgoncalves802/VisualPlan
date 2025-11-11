# 📅 Plano de Implementação: Página de Cronograma

> **Plano completo para criação da funcionalidade de Cronograma (Gantt Chart) no VisionPlan**

**Versão:** 1.0  
**Data de Criação:** 11 de Novembro de 2024  
**Criado por:** Planejamento com AI Sequential Thinking  
**Status:** 📋 Planejamento Aprovado

---

## 📑 Índice

1. [Visão Geral](#1-visão-geral)
2. [Análise do Contexto Atual](#2-análise-do-contexto-atual)
3. [Requisitos Funcionais](#3-requisitos-funcionais)
4. [Arquitetura Técnica](#4-arquitetura-técnica)
5. [Tecnologias e Bibliotecas](#5-tecnologias-e-bibliotecas)
6. [Schema de Dados](#6-schema-de-dados)
7. [Plano de Implementação (Fases)](#7-plano-de-implementação-fases)
8. [Implementação Técnica Detalhada](#8-implementação-técnica-detalhada)
9. [Desafios e Soluções](#9-desafios-e-soluções)
10. [User Stories](#10-user-stories)
11. [Métricas de Sucesso](#11-métricas-de-sucesso)
12. [Riscos e Mitigações](#12-riscos-e-mitigações)
13. [Cronograma e Recursos](#13-cronograma-e-recursos)
14. [Próximos Passos Imediatos](#14-próximos-passos-imediatos)

---

## 1. Visão Geral

### 1.1 Objetivo

Implementar uma funcionalidade completa de **Cronograma (Gantt Chart)** no VisionPlan, permitindo que usuários:
- Criem e gerenciem cronogramas de projetos de construção
- Visualizem atividades em formato Gantt interativo
- Gerenciem dependências entre tarefas
- Identifiquem o caminho crítico automaticamente
- Colaborem em tempo real
- Exportem para PDF, Excel e MS Project

### 1.2 Benefícios Esperados

- ✅ **Substituir ferramentas legadas**: MS Project, Primavera P6
- ✅ **Reduzir tempo de planejamento**: 40% de redução
- ✅ **Aumentar % PAC**: Meta de 75%+
- ✅ **Melhorar colaboração**: Real-time sync entre equipes
- ✅ **Centralizar informações**: Tudo em uma plataforma

### 1.3 Escopo

**In-Scope:**
- ✅ Visualização Gantt interativa
- ✅ CRUD de atividades
- ✅ Dependências (FS, SS, FF, SF) com lag
- ✅ Cálculo automático de caminho crítico
- ✅ Filtros e busca
- ✅ Real-time collaboration
- ✅ Exportação (PDF, Excel)
- ✅ Responsividade (Desktop, Tablet)

**Out-of-Scope (Futuro):**
- ❌ Nivelamento de recursos
- ❌ Análise de valor agregado (EVM)
- ❌ Simulação Monte Carlo
- ❌ Import de MS Project/Primavera

---

## 2. Análise do Contexto Atual

### 2.1 Stack Tecnológico Existente

```typescript
{
  "frontend": {
    "framework": "React 18.2",
    "language": "TypeScript 5.2",
    "buildTool": "Vite 5.0",
    "styling": "Tailwind CSS 3.3",
    "stateManagement": "Zustand 4.4",
    "routing": "React Router v6",
    "charts": "Recharts 2.10",
    "icons": "Lucide React 0.294",
    "3d": "Three.js 0.160"
  },
  "backend": {
    "platform": "Supabase",
    "database": "PostgreSQL 15+",
    "realtime": "WebSockets",
    "auth": "JWT"
  }
}
```

### 2.2 Estrutura de Pastas Atual

```
src/
├── components/
│   ├── ui/              # Componentes base (Button, Card, etc)
│   ├── layout/          # Layouts (Header, Sidebar)
│   └── features/        # Features complexas (Dashboard, ThemeCustomizer)
├── pages/               # Páginas (Dashboard, Kanban, Login)
├── stores/              # Zustand stores (auth, tema, app)
├── services/            # API calls (supabase)
├── hooks/               # Custom hooks
├── types/               # TypeScript types
├── utils/               # Utilitários
├── constants/           # Constantes
└── styles/              # Estilos globais
```

### 2.3 Types Já Existentes

Em `src/types/index.ts`:

```typescript
interface Atividade {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  projetoId: string;
  atividadePaiId?: string;
  tipo: TipoAtividade; // TAREFA, MARCO, FASE, PACOTE_TRABALHO
  status: StatusAtividade; // NAO_INICIADA, EM_ANDAMENTO, CONCLUIDA, PARALISADA, CANCELADA
  nivelWBS: number;
  dataInicioPlanejada?: Date;
  dataFimPlanejada?: Date;
  dataInicioReal?: Date;
  dataFimReal?: Date;
  duracao?: number;
  percentualConcluido: number;
  custoOrcado?: number;
  custoReal?: number;
  caminhoCritico: boolean;
  setorId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

✅ **Conclusão**: Base de dados já está preparada!

---

## 3. Requisitos Funcionais

### RF-CRON-001: Visualização de Cronograma (Gantt Chart)

**Descrição**: Sistema deve exibir atividades em formato de Gantt Chart interativo.

**Critérios de Aceitação**:
- [ ] Exibe barras horizontais representando duração de atividades
- [ ] Linha do tempo configurável (dias, semanas, meses)
- [ ] Zoom in/out funcional
- [ ] Scroll horizontal e vertical suave
- [ ] Hoje (today marker) destacado
- [ ] Cores diferenciadas por status e caminho crítico

**Prioridade**: 🔴 Crítica

---

### RF-CRON-002: Gestão de Atividades

**Descrição**: Usuários podem criar, editar e excluir atividades.

**Critérios de Aceitação**:
- [ ] Modal de criação com campos: nome, duração, datas, responsável
- [ ] Modal de edição com mesmos campos
- [ ] Confirmação antes de excluir
- [ ] Drag & drop para reordenar
- [ ] Redimensionar duração arrastando extremidades da barra
- [ ] Validações: duração > 0, datas válidas, etc.

**Prioridade**: 🔴 Crítica

---

### RF-CRON-003: Dependências entre Atividades

**Descrição**: Sistema permite definir relações de precedência.

**Tipos de Dependência**:
- **FS (Finish-to-Start)**: Tarefa B inicia quando A termina
- **SS (Start-to-Start)**: Tarefas iniciam juntas
- **FF (Finish-to-Finish)**: Tarefas terminam juntas
- **SF (Start-to-Finish)**: B termina quando A inicia (raro)

**Lag**: Atraso (positivo) ou antecipação (negativo) em dias

**Critérios de Aceitação**:
- [ ] Interface para adicionar dependência (modal ou drag & drop)
- [ ] Linhas visuais conectam tarefas dependentes
- [ ] Sistema valida e impede dependências circulares
- [ ] Recálculo automático ao mudar dependências

**Prioridade**: 🟡 Alta

---

### RF-CRON-004: Caminho Crítico

**Descrição**: Sistema identifica e destaca atividades do caminho crítico.

**Critérios de Aceitação**:
- [ ] Cálculo automático usando CPM (Critical Path Method)
- [ ] Atividades críticas destacadas em vermelho
- [ ] Exibe folga total (total float)
- [ ] Exibe folga livre (free float)
- [ ] Recalcula ao mudar durações ou dependências

**Prioridade**: 🟡 Alta

---

### RF-CRON-005: Filtros e Visualizações

**Descrição**: Usuários podem filtrar e personalizar visualização.

**Filtros**:
- Por status (não iniciada, em andamento, concluída)
- Por responsável
- Por setor
- Por nível WBS
- Apenas caminho crítico
- Apenas atrasadas

**Visualizações**:
- Modo Gantt (padrão)
- Modo Lista
- Modo Kanban (integrar com página existente)

**Critérios de Aceitação**:
- [ ] Barra de filtros visível
- [ ] Filtros aplicam instantaneamente
- [ ] Contador de atividades filtradas
- [ ] Botão "Limpar filtros"

**Prioridade**: 🟢 Média

---

### RF-CRON-006: Real-time Collaboration

**Descrição**: Múltiplos usuários podem editar simultaneamente.

**Critérios de Aceitação**:
- [ ] Mudanças sincronizam em tempo real via WebSockets
- [ ] Indicadores de presença (avatares de quem está online)
- [ ] Highlight de tarefa sendo editada por outro usuário
- [ ] Notificações de mudanças importantes
- [ ] Resolução de conflitos com timestamps

**Prioridade**: 🟢 Média

---

### RF-CRON-007: Exportação

**Descrição**: Sistema exporta cronograma para diferentes formatos.

**Formatos**:
- PDF (visualização, impressão)
- Excel (edição posterior, análises)
- MS Project XML (interoperabilidade)

**Critérios de Aceitação**:
- [ ] Botão "Exportar" na toolbar
- [ ] PDF mantém formatação visual
- [ ] Excel inclui todas as colunas de dados
- [ ] Exportação processa em <5s para 100 atividades

**Prioridade**: 🟢 Média

---

## 4. Arquitetura Técnica

### 4.1 Estrutura de Componentes

```
src/
├── pages/
│   └── CronogramaPage.tsx                    # 📄 Página principal
│
├── components/features/cronograma/
│   ├── GanttChart.tsx                        # 📊 Componente Gantt principal
│   ├── GanttTimeline.tsx                     # 📅 Linha do tempo (headers)
│   ├── GanttTask.tsx                         # 📌 Barra de tarefa individual
│   ├── GanttDependencies.tsx                 # 🔗 Linhas de dependência
│   ├── TaskModal.tsx                         # ✏️ Modal criar/editar
│   ├── CronogramaToolbar.tsx                 # 🛠️ Barra de ferramentas
│   ├── CronogramaFilters.tsx                 # 🔍 Filtros
│   ├── TaskList.tsx                          # 📋 Lista lateral de tarefas
│   └── ExportMenu.tsx                        # 📤 Menu de exportação
│
├── hooks/
│   ├── useCronograma.ts                      # 🎣 Hook principal
│   ├── useGanttCalculations.ts               # 🧮 Cálculos (CPM, folgas)
│   ├── useCronogramaRealtime.ts              # ⚡ Real-time sync
│   └── useCronogramaExport.ts                # 📤 Exportação
│
├── stores/
│   └── cronogramaStore.ts                    # 🗄️ State management
│
├── services/
│   └── cronogramaService.ts                  # 🔌 API calls
│
└── types/
    └── cronograma.ts                         # 📝 Types específicos
```

### 4.2 Fluxo de Dados

```
┌──────────────────────────────────────────────────────────┐
│                    USER INTERACTION                       │
│  (Click, Drag, Type, etc)                                │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────┐
│                  CronogramaPage.tsx                       │
│  - Orquestra componentes                                 │
│  - Usa hook useCronograma()                              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────┐
│               useCronograma() Hook                        │
│  - Busca dados do store                                  │
│  - Chama actions do store                                │
│  - Gerencia loading/error states                         │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────┐
│              cronogramaStore (Zustand)                    │
│  - Estado global                                         │
│  - Atividades, dependências, filtros                     │
│  - Actions: CRUD, filtrar, calcular                      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────┐
│            cronogramaService                              │
│  - Chamadas à API Supabase                               │
│  - CRUD operations                                       │
│  - Real-time subscriptions                               │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────┐
│                   SUPABASE                                │
│  - PostgreSQL database                                   │
│  - WebSockets (real-time)                                │
│  - Edge Functions (CPM calc)                             │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Tecnologias e Bibliotecas

### 5.1 Biblioteca Gantt

**Opção Escolhida**: `gantt-task-react`

**Razões**:
- ✅ TypeScript nativo
- ✅ Leve (~50KB)
- ✅ Altamente customizável
- ✅ Suporta dependências visuais
- ✅ Drag & drop integrado
- ✅ Zoom e scroll
- ✅ Ativamente mantido

**Instalação**:
```bash
npm install gantt-task-react
```

**Alternativas Avaliadas**:
- ❌ react-gantt-chart: Muito básico
- ❌ DHTMLX Gantt: Pago
- ❌ Custom (D3.js): Muito tempo de desenvolvimento

### 5.2 Bibliotecas Adicionais

```json
{
  "gantt-task-react": "^0.3.9",     // Gantt chart
  "react-window": "^1.8.10",         // Virtualização (performance)
  "date-fns": "^3.0.0",              // ✅ JÁ INSTALADO
  "xlsx": "^0.18.5",                 // Exportação Excel
  "jspdf": "^2.5.1",                 // Exportação PDF
  "html2canvas": "^1.4.1"            // Screenshot para PDF
}
```

**Comando de Instalação**:
```bash
npm install gantt-task-react react-window xlsx jspdf html2canvas
npm install --save-dev @types/react-window
```

---

## 6. Schema de Dados

### 6.1 Tabelas Existentes

✅ **atividades** (já existe)
```sql
CREATE TABLE atividades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  atividade_pai_id UUID REFERENCES atividades(id) ON DELETE SET NULL,
  tipo TEXT CHECK (tipo IN ('TAREFA', 'MARCO', 'FASE', 'PACOTE_TRABALHO')),
  status TEXT CHECK (status IN ('NAO_INICIADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'PARALISADA', 'CANCELADA')),
  nivel_wbs INTEGER NOT NULL,
  data_inicio_planejada TIMESTAMP,
  data_fim_planejada TIMESTAMP,
  data_inicio_real TIMESTAMP,
  data_fim_real TIMESTAMP,
  duracao INTEGER,
  percentual_concluido INTEGER DEFAULT 0,
  custo_orcado DECIMAL(15,2),
  custo_real DECIMAL(15,2),
  caminho_critico BOOLEAN DEFAULT FALSE,
  setor_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6.2 Novas Tabelas Necessárias

#### 6.2.1 dependencias_atividades

```sql
CREATE TABLE dependencias_atividades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  atividade_id UUID NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  predecessora_id UUID NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  tipo_dependencia TEXT NOT NULL CHECK (tipo_dependencia IN ('FS', 'SS', 'FF', 'SF')),
  lag INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(atividade_id, predecessora_id),
  CONSTRAINT no_self_dependency CHECK (atividade_id != predecessora_id)
);

-- Índices
CREATE INDEX idx_dependencias_atividade ON dependencias_atividades(atividade_id);
CREATE INDEX idx_dependencias_predecessora ON dependencias_atividades(predecessora_id);
```

#### 6.2.2 recursos_atividades (opcional, fase 2)

```sql
CREATE TABLE recursos_atividades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  atividade_id UUID NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  percentual_alocacao INTEGER DEFAULT 100 CHECK (percentual_alocacao BETWEEN 1 AND 100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(atividade_id, usuario_id)
);
```

### 6.3 Row Level Security (RLS)

```sql
-- RLS para dependencias_atividades
ALTER TABLE dependencias_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver dependências de seus projetos"
  ON dependencias_atividades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM atividades a
      JOIN projetos p ON a.projeto_id = p.id
      WHERE a.id = dependencias_atividades.atividade_id
      AND p.empresa_id = auth.jwt() ->> 'empresa_id'
    )
  );

CREATE POLICY "Usuários podem gerenciar dependências de seus projetos"
  ON dependencias_atividades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM atividades a
      JOIN projetos p ON a.projeto_id = p.id
      WHERE a.id = dependencias_atividades.atividade_id
      AND p.empresa_id = auth.jwt() ->> 'empresa_id'
    )
  );
```

---

## 7. Plano de Implementação (Fases)

### FASE 1: Fundação (3-5 dias) 🏗️

**Objetivo**: Preparar infraestrutura base

**Tarefas**:
- [ ] Instalar dependências (gantt-task-react, react-window, xlsx, jspdf)
- [ ] Criar migration SQL para `dependencias_atividades`
- [ ] Configurar RLS para novas tabelas
- [ ] Criar types em `src/types/cronograma.ts`
- [ ] Criar `cronogramaStore.ts` (estrutura básica)
- [ ] Criar `cronogramaService.ts` (CRUD básico)
- [ ] Criar `useCronograma.ts` hook

**Entregáveis**:
- ✅ Migrations aplicadas
- ✅ Types definidos
- ✅ Store e service criados

**Critérios de Sucesso**:
- npm install sem erros
- Types compilam sem erros
- Store inicializa corretamente

---

### FASE 2: Componentes Base (5-7 dias) 🧩

**Objetivo**: Criar interface básica funcional

**Tarefas**:
- [ ] Criar `CronogramaPage.tsx` (estrutura e layout)
- [ ] Criar `CronogramaToolbar.tsx` (botões: adicionar, zoom, visualização)
- [ ] Criar `TaskList.tsx` (lista lateral de tarefas)
- [ ] Criar `TaskModal.tsx` (criar/editar atividade)
- [ ] Integrar `gantt-task-react`
- [ ] Implementar transformação Atividade → Task
- [ ] Implementar CRUD básico de atividades
- [ ] Conectar com stores e services

**Entregáveis**:
- ✅ Página de cronograma navegável
- ✅ Gantt exibindo atividades mock
- ✅ Modal de criação funcionando

**Critérios de Sucesso**:
- Usuário consegue acessar /cronograma
- Gantt renderiza sem erros
- Consegue criar nova atividade

---

### FASE 3: Funcionalidades Avançadas (5-7 dias) 🚀

**Objetivo**: Implementar features principais

**Tarefas**:
- [ ] Implementar drag & drop para reordenar
- [ ] Implementar redimensionamento de barras
- [ ] Criar sistema de dependências
- [ ] Implementar linhas visuais de dependência
- [ ] Criar `CronogramaFilters.tsx`
- [ ] Implementar busca de tarefas
- [ ] Adicionar indicadores visuais (cores por status)
- [ ] Implementar zoom e scroll
- [ ] Adicionar modo lista alternativo

**Entregáveis**:
- ✅ Drag & drop funcional
- ✅ Dependências visuais
- ✅ Filtros funcionando

**Critérios de Sucesso**:
- Usuário consegue criar dependências
- Filtros aplicam corretamente
- Performance >30 FPS ao arrastar

---

### FASE 4: Caminho Crítico e Cálculos (3-5 dias) 🧮

**Objetivo**: Implementar algoritmo CPM

**Tarefas**:
- [ ] Implementar algoritmo CPM (Critical Path Method)
- [ ] Criar Edge Function no Supabase para cálculos pesados
- [ ] Implementar cálculo de folgas (total float, free float)
- [ ] Criar visualização de caminho crítico
- [ ] Adicionar indicadores de Early Start, Late Finish
- [ ] Implementar recálculo automático
- [ ] Adicionar cache de resultados

**Entregáveis**:
- ✅ Caminho crítico identificado
- ✅ Folgas calculadas
- ✅ Atividades críticas destacadas

**Critérios de Sucesso**:
- CPM calcula corretamente (validar com exemplo conhecido)
- Performance: <500ms para 500 atividades
- Recálculo automático ao mudar durações

---

### FASE 5: Real-time e Colaboração (3-5 dias) ⚡

**Objetivo**: Sincronização em tempo real

**Tarefas**:
- [ ] Implementar WebSocket subscriptions
- [ ] Criar `useCronogramaRealtime.ts` hook
- [ ] Implementar optimistic UI updates
- [ ] Adicionar indicadores de presença
- [ ] Criar sistema de locking temporário
- [ ] Implementar resolução de conflitos
- [ ] Adicionar notificações de mudanças
- [ ] Testar com múltiplos usuários simultâneos

**Entregáveis**:
- ✅ Real-time sync funcionando
- ✅ Indicadores de presença
- ✅ Conflitos resolvidos

**Critérios de Sucesso**:
- Mudanças sincronizam em <1s
- Taxa de sincronização >95%
- Zero perda de dados

---

### FASE 6: Exportação e Polish (3-4 dias) 📤

**Objetivo**: Exportação e refinamentos

**Tarefas**:
- [ ] Implementar exportação para PDF
- [ ] Implementar exportação para Excel
- [ ] Implementar impressão
- [ ] Criar `ExportMenu.tsx`
- [ ] Adicionar loading states
- [ ] Melhorar UX (tooltips, mensagens)
- [ ] Otimizar performance
- [ ] Adicionar testes unitários
- [ ] Documentar componentes (JSDoc)
- [ ] Criar guia de usuário

**Entregáveis**:
- ✅ Exportação PDF funcional
- ✅ Exportação Excel funcional
- ✅ Testes passando

**Critérios de Sucesso**:
- PDF mantém formatação
- Excel permite edição
- Cobertura de testes >80%

---

## 8. Implementação Técnica Detalhada

### 8.1 cronogramaStore.ts

```typescript
// src/stores/cronogramaStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Atividade } from '@/types';
import type { DependenciaAtividade, FiltrosCronograma, CaminhoCritico } from '@/types/cronograma';
import { cronogramaService } from '@/services/cronogramaService';

interface CronogramaState {
  // Estado
  atividades: Atividade[];
  dependencias: DependenciaAtividade[];
  atividadeSelecionada: Atividade | null;
  filtros: FiltrosCronograma;
  visualizacao: 'gantt' | 'lista';
  escala: 'dia' | 'semana' | 'mes';
  caminhoCritico: CaminhoCritico | null;
  loading: boolean;
  error: string | null;
  
  // Actions - Atividades
  carregarAtividades: (projetoId: string) => Promise<void>;
  adicionarAtividade: (atividade: Partial<Atividade>) => Promise<void>;
  atualizarAtividade: (id: string, updates: Partial<Atividade>) => Promise<void>;
  excluirAtividade: (id: string) => Promise<void>;
  setAtividadeSelecionada: (atividade: Atividade | null) => void;
  
  // Actions - Dependências
  carregarDependencias: (projetoId: string) => Promise<void>;
  adicionarDependencia: (dep: DependenciaAtividade) => Promise<void>;
  removerDependencia: (id: string) => Promise<void>;
  
  // Actions - Cálculos
  calcularCaminhoCritico: (projetoId: string) => Promise<void>;
  
  // Actions - UI
  setFiltros: (filtros: Partial<FiltrosCronograma>) => void;
  setVisualizacao: (visualizacao: 'gantt' | 'lista') => void;
  setEscala: (escala: 'dia' | 'semana' | 'mes') => void;
  limparFiltros: () => void;
}

export const useCronogramaStore = create<CronogramaState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      atividades: [],
      dependencias: [],
      atividadeSelecionada: null,
      filtros: {
        status: [],
        responsavel: [],
        setor: [],
        busca: '',
        apenasCriticas: false,
        apenasAtrasadas: false,
      },
      visualizacao: 'gantt',
      escala: 'semana',
      caminhoCritico: null,
      loading: false,
      error: null,
      
      // Implementação das actions...
      carregarAtividades: async (projetoId) => {
        set({ loading: true, error: null });
        try {
          const atividades = await cronogramaService.getAtividades(projetoId);
          set({ atividades, loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },
      
      adicionarAtividade: async (atividade) => {
        try {
          const nova = await cronogramaService.createAtividade(atividade);
          set((state) => ({
            atividades: [...state.atividades, nova],
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      atualizarAtividade: async (id, updates) => {
        try {
          const atualizada = await cronogramaService.updateAtividade(id, updates);
          set((state) => ({
            atividades: state.atividades.map((a) =>
              a.id === id ? atualizada : a
            ),
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      excluirAtividade: async (id) => {
        try {
          await cronogramaService.deleteAtividade(id);
          set((state) => ({
            atividades: state.atividades.filter((a) => a.id !== id),
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      setAtividadeSelecionada: (atividade) => {
        set({ atividadeSelecionada: atividade });
      },
      
      carregarDependencias: async (projetoId) => {
        try {
          const dependencias = await cronogramaService.getDependencias(projetoId);
          set({ dependencias });
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      adicionarDependencia: async (dep) => {
        try {
          const nova = await cronogramaService.createDependencia(dep);
          set((state) => ({
            dependencias: [...state.dependencias, nova],
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      removerDependencia: async (id) => {
        try {
          await cronogramaService.deleteDependencia(id);
          set((state) => ({
            dependencias: state.dependencias.filter((d) => d.id !== id),
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      calcularCaminhoCritico: async (projetoId) => {
        try {
          const resultado = await cronogramaService.calcularCaminhoCritico(projetoId);
          set({ caminhoCritico: resultado });
          
          // Atualizar flag caminhoCritico nas atividades
          set((state) => ({
            atividades: state.atividades.map((a) => ({
              ...a,
              caminhoCritico: resultado.caminhoCritico.includes(a.id),
            })),
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      setFiltros: (filtros) => {
        set((state) => ({
          filtros: { ...state.filtros, ...filtros },
        }));
      },
      
      setVisualizacao: (visualizacao) => {
        set({ visualizacao });
      },
      
      setEscala: (escala) => {
        set({ escala });
      },
      
      limparFiltros: () => {
        set({
          filtros: {
            status: [],
            responsavel: [],
            setor: [],
            busca: '',
            apenasCriticas: false,
            apenasAtrasadas: false,
          },
        });
      },
    }),
    {
      name: 'cronograma-storage',
      partialize: (state) => ({
        visualizacao: state.visualizacao,
        escala: state.escala,
        filtros: state.filtros,
      }),
    }
  )
);
```

### 8.2 cronogramaService.ts

```typescript
// src/services/cronogramaService.ts
import { supabase } from './supabase';
import type { Atividade } from '@/types';
import type { DependenciaAtividade, CaminhoCritico } from '@/types/cronograma';

export const cronogramaService = {
  // ============================================================================
  // CRUD Atividades
  // ============================================================================
  
  async getAtividades(projetoId: string): Promise<Atividade[]> {
    const { data, error } = await supabase
      .from('atividades')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('nivel_wbs, codigo');
    
    if (error) throw error;
    return data;
  },
  
  async createAtividade(atividade: Partial<Atividade>): Promise<Atividade> {
    const { data, error } = await supabase
      .from('atividades')
      .insert(atividade)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async updateAtividade(
    id: string,
    updates: Partial<Atividade>
  ): Promise<Atividade> {
    const { data, error } = await supabase
      .from('atividades')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async deleteAtividade(id: string): Promise<void> {
    const { error } = await supabase
      .from('atividades')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
  
  // ============================================================================
  // Dependências
  // ============================================================================
  
  async getDependencias(projetoId: string): Promise<DependenciaAtividade[]> {
    const { data, error } = await supabase
      .from('dependencias_atividades')
      .select(`
        *,
        atividade:atividades!dependencias_atividades_atividade_id_fkey(projeto_id)
      `)
      .eq('atividade.projeto_id', projetoId);
    
    if (error) throw error;
    return data;
  },
  
  async createDependencia(
    dep: Omit<DependenciaAtividade, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DependenciaAtividade> {
    // Validar dependência circular antes de criar
    const { data: circular } = await supabase.rpc('check_circular_dependency', {
      p_atividade_id: dep.atividadeId,
      p_predecessora_id: dep.predecessoraId,
    });
    
    if (circular) {
      throw new Error('Dependência circular detectada!');
    }
    
    const { data, error } = await supabase
      .from('dependencias_atividades')
      .insert({
        atividade_id: dep.atividadeId,
        predecessora_id: dep.predecessoraId,
        tipo_dependencia: dep.tipoDependencia,
        lag: dep.lag || 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async deleteDependencia(id: string): Promise<void> {
    const { error } = await supabase
      .from('dependencias_atividades')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
  
  // ============================================================================
  // Cálculo de Caminho Crítico
  // ============================================================================
  
  async calcularCaminhoCritico(projetoId: string): Promise<CaminhoCritico> {
    // Chamar Edge Function para cálculo pesado
    const { data, error } = await supabase.functions.invoke('calcular-cpm', {
      body: { projetoId },
    });
    
    if (error) throw error;
    return data as CaminhoCritico;
  },
  
  // ============================================================================
  // Real-time Subscription
  // ============================================================================
  
  subscribeToAtividades(
    projetoId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`atividades-${projetoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'atividades',
          filter: `projeto_id=eq.${projetoId}`,
        },
        callback
      )
      .subscribe();
  },
};
```

### 8.3 Types (cronograma.ts)

```typescript
// src/types/cronograma.ts
export enum TipoDependencia {
  FS = 'FS', // Finish-to-Start
  SS = 'SS', // Start-to-Start
  FF = 'FF', // Finish-to-Finish
  SF = 'SF', // Start-to-Finish
}

export interface DependenciaAtividade {
  id: string;
  atividadeId: string;
  predecessoraId: string;
  tipoDependencia: TipoDependencia;
  lag: number; // dias (positivo = atraso, negativo = antecipação)
  createdAt: Date;
  updatedAt: Date;
}

export interface FiltrosCronograma {
  status: string[];
  responsavel: string[];
  setor: string[];
  busca: string;
  apenasCriticas: boolean;
  apenasAtrasadas: boolean;
}

export interface CaminhoCritico {
  caminhoCritico: string[]; // IDs das atividades no caminho crítico
  folgaTotal: Record<string, number>; // ID → dias de folga
  folgaLivre: Record<string, number>;
  dataInicioMaisCedo: Record<string, Date>;
  dataFimMaisTarde: Record<string, Date>;
  duracaoProjeto: number; // dias
}

export interface ExportOptions {
  formato: 'pdf' | 'excel' | 'msproject';
  incluirGrafico: boolean;
  incluirDependencias: boolean;
  incluirRecursos: boolean;
}

// Tipos para gantt-task-react
import { Task as GanttTask } from 'gantt-task-react';

export interface TaskGantt extends GanttTask {
  atividadeId: string;
  status: string;
  caminhoCritico: boolean;
}
```

### 8.4 Componente Principal (CronogramaPage.tsx)

```typescript
// src/pages/CronogramaPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Gantt } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { useCronogramaStore } from '@/stores/cronogramaStore';
import { useCronograma } from '@/hooks/useCronograma';
import { CronogramaToolbar } from '@/components/features/cronograma/CronogramaToolbar';
import { CronogramaFilters } from '@/components/features/cronograma/CronogramaFilters';
import { TaskList } from '@/components/features/cronograma/TaskList';
import { TaskModal } from '@/components/features/cronograma/TaskModal';
import { MainLayout } from '@/components/layout/MainLayout';

export const CronogramaPage: React.FC = () => {
  const { projetoId } = useParams<{ projetoId: string }>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  
  const {
    tasks,
    loading,
    error,
    visualizacao,
    escala,
    handleTaskChange,
    handleTaskDelete,
    handleTaskAdd,
    handleDependencyAdd,
  } = useCronograma(projetoId!);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-500">Erro: {error}</div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <CronogramaToolbar
          onAddTask={() => setModalOpen(true)}
          onExport={() => {/* Implementar */}}
          onToggleView={() => {/* Implementar */}}
        />
        
        {/* Filters */}
        <CronogramaFilters />
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {visualizacao === 'gantt' ? (
            <Gantt
              tasks={tasks}
              viewMode={escala === 'dia' ? 'Day' : escala === 'semana' ? 'Week' : 'Month'}
              onDateChange={handleTaskChange}
              onTaskDelete={handleTaskDelete}
              onProgressChange={handleTaskChange}
              onDoubleClick={(task) => {
                setEditingTask(task.id);
                setModalOpen(true);
              }}
              listCellWidth="155px"
              columnWidth={escala === 'dia' ? 65 : escala === 'semana' ? 45 : 30}
            />
          ) : (
            <TaskList
              tasks={tasks}
              onEdit={(id) => {
                setEditingTask(id);
                setModalOpen(true);
              }}
              onDelete={handleTaskDelete}
            />
          )}
        </div>
        
        {/* Modal */}
        {modalOpen && (
          <TaskModal
            taskId={editingTask}
            onClose={() => {
              setModalOpen(false);
              setEditingTask(null);
            }}
            onSave={handleTaskAdd}
          />
        )}
      </div>
    </MainLayout>
  );
};
```

### 8.5 Hook Personalizado (useCronograma.ts)

```typescript
// src/hooks/useCronograma.ts
import { useEffect, useMemo } from 'react';
import { useCronogramaStore } from '@/stores/cronogramaStore';
import { ViewMode, Task } from 'gantt-task-react';
import { format } from 'date-fns';

export const useCronograma = (projetoId: string) => {
  const {
    atividades,
    dependencias,
    filtros,
    visualizacao,
    escala,
    loading,
    error,
    carregarAtividades,
    carregarDependencias,
    atualizarAtividade,
    adicionarAtividade,
    excluirAtividade,
    calcularCaminhoCritico,
  } = useCronogramaStore();
  
  // Carregar dados ao montar
  useEffect(() => {
    if (projetoId) {
      carregarAtividades(projetoId);
      carregarDependencias(projetoId);
      calcularCaminhoCritico(projetoId);
    }
  }, [projetoId]);
  
  // Transformar Atividades → Tasks do Gantt
  const tasks = useMemo<Task[]>(() => {
    return atividades
      .filter((ativ) => {
        // Aplicar filtros
        if (filtros.busca && !ativ.nome.toLowerCase().includes(filtros.busca.toLowerCase())) {
          return false;
        }
        if (filtros.status.length > 0 && !filtros.status.includes(ativ.status)) {
          return false;
        }
        if (filtros.apenasCriticas && !ativ.caminhoCritico) {
          return false;
        }
        // Outros filtros...
        return true;
      })
      .map((ativ) => ({
        id: ativ.id,
        name: ativ.nome,
        type: mapTipoToGantt(ativ.tipo),
        start: new Date(ativ.dataInicioPlanejada || Date.now()),
        end: new Date(ativ.dataFimPlanejada || Date.now()),
        progress: ativ.percentualConcluido || 0,
        dependencies: dependencias
          .filter((dep) => dep.atividadeId === ativ.id)
          .map((dep) => dep.predecessoraId),
        styles: getTaskStyles(ativ),
        project: ativ.atividadePaiId || undefined,
        isDisabled: false,
      }));
  }, [atividades, dependencias, filtros]);
  
  // Handlers
  const handleTaskChange = async (task: Task) => {
    await atualizarAtividade(task.id, {
      dataInicioPlanejada: task.start,
      dataFimPlanejada: task.end,
      percentualConcluido: task.progress,
    });
  };
  
  const handleTaskDelete = async (task: Task) => {
    if (confirm(`Excluir atividade "${task.name}"?`)) {
      await excluirAtividade(task.id);
    }
  };
  
  const handleTaskAdd = async (data: Partial<Atividade>) => {
    await adicionarAtividade({
      ...data,
      projetoId,
    });
  };
  
  return {
    tasks,
    loading,
    error,
    visualizacao,
    escala,
    handleTaskChange,
    handleTaskDelete,
    handleTaskAdd,
  };
};

// Helpers
function mapTipoToGantt(tipo: string): 'task' | 'milestone' | 'project' {
  switch (tipo) {
    case 'MARCO':
      return 'milestone';
    case 'FASE':
    case 'PACOTE_TRABALHO':
      return 'project';
    default:
      return 'task';
  }
}

function getTaskStyles(ativ: Atividade) {
  if (ativ.caminhoCritico) {
    return {
      backgroundColor: '#ef4444',
      backgroundSelectedColor: '#dc2626',
    };
  }
  
  switch (ativ.status) {
    case 'CONCLUIDA':
      return {
        backgroundColor: '#10b981',
        backgroundSelectedColor: '#059669',
      };
    case 'EM_ANDAMENTO':
      return {
        backgroundColor: '#3b82f6',
        backgroundSelectedColor: '#2563eb',
      };
    case 'PARALISADA':
      return {
        backgroundColor: '#f59e0b',
        backgroundSelectedColor: '#d97706',
      };
    default:
      return {
        backgroundColor: '#94a3b8',
        backgroundSelectedColor: '#64748b',
      };
  }
}
```

---

## 9. Desafios e Soluções

### 9.1 Performance com Muitas Tarefas

**DESAFIO**: Renderizar >1000 atividades pode causar lag

**SOLUÇÕES**:

1. **Virtualização com react-window**
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={tasks.length}
  itemSize={35}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <TaskRow task={tasks[index]} />
    </div>
  )}
</FixedSizeList>
```

2. **Memoização Agressiva**
```typescript
const tasks = useMemo(() => {
  return transformTasks(atividades);
}, [atividades]);

const filteredTasks = useMemo(() => {
  return filterTasks(tasks, filtros);
}, [tasks, filtros]);
```

3. **Web Workers para Cálculos Pesados**
```typescript
// workers/cpm.worker.ts
self.addEventListener('message', (e) => {
  const result = calcularCPM(e.data);
  self.postMessage(result);
});

// No componente
const worker = new Worker('/workers/cpm.worker.ts');
worker.postMessage(atividades);
worker.onmessage = (e) => {
  setCaminhoCritico(e.data);
};
```

4. **Lazy Loading e Paginação**
- Carregar apenas atividades visíveis no viewport
- Implementar scroll infinito

---

### 9.2 Cálculo de Caminho Crítico

**DESAFIO**: Algoritmo CPM é computacionalmente pesado

**SOLUÇÃO**: Edge Function do Supabase

```sql
-- Function SQL para CPM
CREATE OR REPLACE FUNCTION calcular_cpm(p_projeto_id UUID)
RETURNS JSON AS $$
DECLARE
  resultado JSON;
BEGIN
  -- Implementação do algoritmo CPM
  -- 1. Forward Pass (calcular Early Start e Early Finish)
  -- 2. Backward Pass (calcular Late Start e Late Finish)
  -- 3. Identificar caminho crítico (folga = 0)
  
  -- Retornar resultado em JSON
  SELECT json_build_object(
    'caminhoCritico', ARRAY[/* IDs */],
    'folgaTotal', json_object(/* ... */),
    'folgaLivre', json_object(/* ... */),
    -- ...
  ) INTO resultado;
  
  RETURN resultado;
END;
$$ LANGUAGE plpgsql;
```

**Otimizações**:
- Cache de resultados (invalidar ao mudar durações/dependências)
- Cálculo incremental (recalcular apenas atividades afetadas)
- Debounce de recálculos (esperar 500ms após última mudança)

---

### 9.3 Real-time Collaboration (Conflitos)

**DESAFIO**: Múltiplos usuários editando simultaneamente

**SOLUÇÃO**: Optimistic Updates + Conflict Resolution

```typescript
// Optimistic update
const handleTaskChange = async (task: Task) => {
  // 1. Atualizar UI imediatamente
  setTasks((prev) =>
    prev.map((t) => (t.id === task.id ? task : t))
  );
  
  // 2. Enviar para servidor
  try {
    await cronogramaService.updateAtividade(task.id, task);
  } catch (error) {
    // 3. Reverter em caso de erro
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? originalTask : t))
    );
    showError('Conflito detectado. Recarregando...');
    reloadTasks();
  }
};
```

**Locking Temporário**:
```typescript
// Marcar tarefa como "sendo editada"
const lockTask = async (taskId: string, userId: string) => {
  await supabase
    .from('task_locks')
    .insert({
      task_id: taskId,
      user_id: userId,
      locked_at: new Date(),
    });
};

// Exibir indicador visual
{lockedBy && (
  <div className="locked-indicator">
    <UserAvatar user={lockedBy} />
    <span>Editando...</span>
  </div>
)}
```

---

### 9.4 Dependências Complexas

**DESAFIO**: Validar e visualizar dependências complexas (FS, SS, FF, SF + Lag)

**SOLUÇÃO**:

1. **Validação de Dependências Circulares**
```sql
-- Function recursiva para detectar ciclos
CREATE OR REPLACE FUNCTION check_circular_dependency(
  p_atividade_id UUID,
  p_predecessora_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  is_circular BOOLEAN;
BEGIN
  WITH RECURSIVE dependencias AS (
    SELECT atividade_id, predecessora_id
    FROM dependencias_atividades
    WHERE predecessora_id = p_atividade_id
    
    UNION ALL
    
    SELECT d.atividade_id, d.predecessora_id
    FROM dependencias_atividades d
    INNER JOIN dependencias ON dependencias.atividade_id = d.predecessora_id
  )
  SELECT EXISTS(
    SELECT 1 FROM dependencias WHERE predecessora_id = p_predecessora_id
  ) INTO is_circular;
  
  RETURN is_circular;
END;
$$ LANGUAGE plpgsql;
```

2. **Visualização Clara**
```typescript
// Diferentes estilos de linha para cada tipo
const getDependencyStyle = (tipo: TipoDependencia) => {
  switch (tipo) {
    case 'FS':
      return { stroke: '#3b82f6', strokeWidth: 2 };
    case 'SS':
      return { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5,5' };
    case 'FF':
      return { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '10,5' };
    case 'SF':
      return { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '2,2' };
  }
};
```

---

### 9.5 Responsividade

**DESAFIO**: Gantt é desktop-first, precisa funcionar em mobile

**SOLUÇÃO**: Visualizações Adaptativas

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

return (
  <>
    {isMobile && <TaskListMobile tasks={tasks} />}
    {isTablet && <GanttSimplified tasks={tasks} />}
    {!isMobile && !isTablet && <GanttFull tasks={tasks} />}
  </>
);
```

**Mobile**: Lista com detalhes ao clicar
**Tablet**: Gantt simplificado (sem sidebar)
**Desktop**: Gantt completo

---

## 10. User Stories

### US-001: Criar Cronograma de Projeto

**Como**: Engenheiro de Planejamento  
**Quero**: Criar um cronograma com múltiplas atividades  
**Para**: Planejar a execução do projeto

**Critérios de Aceitação**:
- [ ] Posso adicionar atividades com nome, duração, datas
- [ ] Posso definir hierarquia (WBS)
- [ ] Posso atribuir responsáveis
- [ ] Sistema salva automaticamente
- [ ] Validações impedem dados inválidos

**Tarefas Técnicas**:
1. Criar TaskModal.tsx com formulário
2. Implementar validações (Yup ou Zod)
3. Conectar com cronogramaService.createAtividade
4. Adicionar feedback visual (toast de sucesso)

---

### US-002: Visualizar Caminho Crítico

**Como**: Coordenador de Obra  
**Quero**: Ver quais atividades são críticas  
**Para**: Focar esforços nas tarefas mais importantes

**Critérios de Aceitação**:
- [ ] Atividades críticas destacadas em vermelho
- [ ] Exibe folga total e livre ao passar mouse
- [ ] Recalcula automaticamente ao mudar durações
- [ ] Botão "Mostrar/Ocultar Caminho Crítico"

**Tarefas Técnicas**:
1. Implementar algoritmo CPM
2. Criar Edge Function calcular-cpm
3. Adicionar estilos para atividades críticas
4. Implementar tooltip com informações de folga

---

### US-003: Gerenciar Dependências

**Como**: Engenheiro de Planejamento  
**Quero**: Definir dependências entre atividades  
**Para**: Modelar a sequência lógica de execução

**Critérios de Aceitação**:
- [ ] Posso criar dependências FS, SS, FF, SF
- [ ] Posso definir lag (positivo ou negativo)
- [ ] Sistema valida e impede dependências circulares
- [ ] Linhas visuais conectam tarefas dependentes
- [ ] Posso excluir dependências facilmente

**Tarefas Técnicas**:
1. Criar DependencyModal.tsx
2. Implementar validação de ciclos (SQL function)
3. Renderizar linhas SVG conectando tarefas
4. Adicionar drag & drop para criar dependências

---

### US-004: Atualizar Progresso

**Como**: Mestre de Obras  
**Quero**: Atualizar percentual de conclusão  
**Para**: Refletir o andamento real da obra

**Critérios de Aceitação**:
- [ ] Slider ou input para % concluído (0-100)
- [ ] Atualiza visualmente a barra no Gantt
- [ ] Sincroniza em tempo real com outros usuários
- [ ] Registra histórico de progresso

**Tarefas Técnicas**:
1. Adicionar slider no TaskModal
2. Implementar onProgressChange no Gantt
3. Setup WebSocket subscription
4. Criar tabela historico_progresso

---

### US-005: Exportar Cronograma

**Como**: Gerente de Projeto  
**Quero**: Exportar para PDF ou Excel  
**Para**: Compartilhar com stakeholders

**Critérios de Aceitação**:
- [ ] PDF mantém formatação visual (Gantt + dados)
- [ ] Excel permite edição posterior
- [ ] Inclui dados de datas, recursos, progresso
- [ ] Processo leva <10s para 200 atividades

**Tarefas Técnicas**:
1. Criar ExportMenu.tsx
2. Implementar exportação PDF (jspdf + html2canvas)
3. Implementar exportação Excel (xlsx)
4. Adicionar loading indicator

---

## 11. Métricas de Sucesso

### 11.1 Performance

| Métrica | Alvo | Crítico |
|---------|------|---------|
| Carregamento inicial (100 atividades) | <2s | <5s |
| Carregamento inicial (1000 atividades) | <5s | <10s |
| Renderização Gantt | <1s | <2s |
| Interação (drag & drop) | <100ms | <300ms |
| Recálculo CPM (500 atividades) | <500ms | <2s |
| Sincronização real-time | <1s | <3s |
| Exportação PDF (100 atividades) | <3s | <10s |

### 11.2 Usabilidade

| Métrica | Alvo |
|---------|------|
| Tempo para criar primeiro cronograma | <10min |
| Taxa de erro em ações principais | <5% |
| NPS (Net Promoter Score) | >50 |
| Tarefas completadas com sucesso | >90% |
| Tempo para encontrar funcionalidade | <30s |

### 11.3 Confiabilidade

| Métrica | Alvo |
|---------|------|
| Uptime | >99.5% |
| Taxa de sincronização real-time | >95% |
| Perda de dados | 0% |
| Falhas de exportação | <1% |

### 11.4 Qualidade de Código

| Métrica | Alvo |
|---------|------|
| Cobertura de testes | >80% |
| TypeScript strict mode | 100% |
| ESLint warnings | 0 |
| Lighthouse Score (Performance) | >90 |
| Lighthouse Score (Accessibility) | >95 |

### 11.5 Acessibilidade

- [ ] WCAG 2.1 Level AA compliance
- [ ] Navegação por teclado completa
- [ ] Screen reader compatible
- [ ] Contraste de cores adequado (WCAG AA)
- [ ] Labels e ARIA attributes

---

## 12. Riscos e Mitigações

### RISCO 1: Performance Degradada

**Probabilidade**: 🟡 Média  
**Impacto**: 🔴 Alto

**Descrição**: Aplicação fica lenta com >1000 atividades

**Mitigação**:
- ✅ Implementar virtualização desde o início
- ✅ Testar com datasets grandes (1000, 5000 atividades)
- ✅ Usar Web Workers para cálculos pesados
- ✅ Implementar lazy loading e paginação

---

### RISCO 2: Complexidade do CPM

**Probabilidade**: 🟡 Média  
**Impacto**: 🟡 Médio

**Descrição**: Algoritmo CPM é complexo e pode ter bugs

**Mitigação**:
- ✅ Usar biblioteca testada (jsnetworkx) ou Edge Function
- ✅ Escrever testes unitários extensivos
- ✅ Validar com exemplos conhecidos de livros de GP
- ✅ Adicionar logs detalhados para debug

---

### RISCO 3: Conflitos de Edição Simultânea

**Probabilidade**: 🟢 Baixa  
**Impacto**: 🟡 Médio

**Descrição**: Dois usuários editam mesma tarefa simultaneamente

**Mitigação**:
- ✅ Implementar locking temporário
- ✅ Usar timestamps para resolução de conflitos
- ✅ Adicionar indicadores visuais de presença
- ✅ Implementar undo/redo

---

### RISCO 4: Curva de Aprendizado

**Probabilidade**: 🟡 Média  
**Impacto**: 🟡 Médio

**Descrição**: Usuários têm dificuldade em usar a interface

**Mitigação**:
- ✅ Criar tour guiado (intro.js ou similares)
- ✅ Adicionar tooltips em todas as funcionalidades
- ✅ Criar vídeos tutoriais
- ✅ Disponibilizar documentação detalhada
- ✅ Realizar testes de usabilidade

---

### RISCO 5: Dependências Circulares

**Probabilidade**: 🟢 Baixa  
**Impacto**: 🔴 Alto

**Descrição**: Usuário cria dependência circular por engano

**Mitigação**:
- ✅ Validação no frontend antes de enviar
- ✅ Validação no backend (SQL function)
- ✅ Mensagem de erro clara
- ✅ Sugerir correção automaticamente

---

## 13. Cronograma e Recursos

### 13.1 Timeline

```
FASE 1: Fundação             [===] 3-5 dias   (Dias 1-5)
FASE 2: Componentes Base     [=====] 5-7 dias (Dias 6-12)
FASE 3: Features Avançadas   [=====] 5-7 dias (Dias 13-19)
FASE 4: CPM e Cálculos      [====] 3-5 dias  (Dias 20-24)
FASE 5: Real-time           [====] 3-5 dias  (Dias 25-29)
FASE 6: Exportação e Polish [===] 3-4 dias   (Dias 30-33)
                            ─────────────────────────────
TOTAL:                      22-33 dias (~5-7 semanas)
```

### 13.2 Recursos Necessários

**Equipe**:
- 1 Frontend Developer (fulltime) - React + TypeScript
- 1 Backend Developer (parttime) - Supabase + SQL
- 1 QA Engineer (parttime) - Testes
- 1 Designer (consulta) - UX/UI
- 1 Tech Lead (supervisão)

**Infraestrutura**:
- Supabase (plano Pro recomendado)
- Servidor de staging
- CI/CD pipeline (GitHub Actions)

**Ferramentas**:
- Figma (design)
- Linear ou Jira (gestão de tarefas)
- Postman (testar APIs)
- BrowserStack (testes cross-browser)

---

## 14. Próximos Passos Imediatos

### ✅ Checklist de Início

- [ ] **1. Aprovação do Plano**
  - [ ] Revisar com stakeholders
  - [ ] Obter aprovação de orçamento
  - [ ] Definir prioridades

- [ ] **2. Setup de Ambiente**
  - [ ] Instalar dependências
  ```bash
  npm install gantt-task-react react-window xlsx jspdf html2canvas
  npm install --save-dev @types/react-window
  ```
  - [ ] Configurar ambiente de staging
  - [ ] Setup CI/CD

- [ ] **3. Preparação de Dados**
  - [ ] Criar migrations SQL
  ```bash
  # Criar arquivo de migration
  supabase migration new create_dependencias_atividades
  ```
  - [ ] Aplicar migrations
  - [ ] Configurar RLS
  - [ ] Seed de dados de teste

- [ ] **4. Início do Desenvolvimento**
  - [ ] Criar branch feature/cronograma
  - [ ] Setup de estrutura de pastas
  - [ ] Criar types iniciais
  - [ ] Implementar store básico

---

### 📅 Primeira Sprint (Semana 1)

**Goal**: Infraestrutura e componentes base funcionando

**Tarefas**:
1. ✅ Instalar dependências
2. ✅ Criar migrations
3. ✅ Criar types
4. ✅ Implementar cronogramaStore
5. ✅ Implementar cronogramaService
6. ✅ Criar CronogramaPage (estrutura)
7. ✅ Integrar gantt-task-react
8. ✅ Exibir atividades mock no Gantt

**Entregável**: Página /cronograma acessível com Gantt básico

---

### 📞 Pontos de Contato

**Daily Standup**: 9h (15min)
- O que fiz ontem
- O que vou fazer hoje
- Bloqueios

**Sprint Review**: Sexta-feira (1h)
- Demo de funcionalidades
- Feedback de stakeholders

**Retrospectiva**: Sexta-feira (30min)
- O que funcionou bem
- O que pode melhorar
- Action items

---

## 15. Conclusão

### Resumo Executivo

Este plano detalha a implementação completa de uma funcionalidade de **Cronograma (Gantt Chart)** para o VisionPlan, uma plataforma SaaS de gestão de obras.

**Principais Destaques**:

✅ **Arquitetura Sólida**: Utiliza stack moderna (React, TypeScript, Supabase) já implementada  
✅ **Biblioteca Testada**: gantt-task-react reduz tempo de desenvolvimento  
✅ **Escalável**: Preparado para >1000 atividades com virtualização  
✅ **Real-time**: Colaboração simultânea via WebSockets  
✅ **Completo**: Cobre CRUD, dependências, CPM, filtros, exportação  

**Timeline**: 22-33 dias (~5-7 semanas)  
**Custo Estimado**: 1 desenvolvedor fulltime + suporte  
**ROI Esperado**: Substituir MS Project/Primavera P6, reduzir tempo de planejamento em 40%

---

### Decisões-Chave Tomadas

1. ✅ **Biblioteca Gantt**: gantt-task-react (MVP), avaliar custom depois
2. ✅ **Performance**: Virtualização + Web Workers + Edge Functions
3. ✅ **Real-time**: Supabase WebSockets com optimistic updates
4. ✅ **Faseamento**: 6 fases priorizando funcionalidades básicas primeiro
5. ✅ **Cálculo CPM**: Edge Function no Supabase para performance

---

### Próximo Passo

**COMEÇAR FASE 1 IMEDIATAMENTE** 🚀

```bash
# 1. Instalar dependências
npm install gantt-task-react react-window xlsx jspdf html2canvas

# 2. Criar branch
git checkout -b feature/cronograma

# 3. Criar estrutura de pastas
mkdir -p src/components/features/cronograma
mkdir -p src/hooks
touch src/stores/cronogramaStore.ts
touch src/services/cronogramaService.ts
touch src/types/cronograma.ts

# 4. Começar desenvolvimento!
```

---

<div align="center">

## 🎉 **PLANO COMPLETO E PRONTO PARA EXECUÇÃO!** 🎉

**VisionPlan - Cronograma**

*Planejado com AI Sequential Thinking*

---

**Próxima Ação:** Revisar com equipe e iniciar Fase 1

[Voltar ao Índice →](#-índice)

</div>

---

**Documento mantido por**: Equipe VisionPlan  
**Última atualização**: 11 de Novembro de 2024  
**Versão**: 1.0  
**Status**: 📋 Pronto para Aprovação

