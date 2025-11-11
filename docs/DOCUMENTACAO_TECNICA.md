# 📖 VisionPlan - Documentação Técnica Completa

## Versão 2.2.0 | Atualizado em: 11 de Novembro de 2024

---

## 📑 Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura da Aplicação](#2-arquitetura-da-aplicação)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Componentes Principais](#4-componentes-principais)
5. [Gerenciamento de Estado](#5-gerenciamento-de-estado)
6. [Sistema de Roteamento](#6-sistema-de-roteamento)
7. [Sistema de Temas Customizáveis](#7-sistema-de-temas-customizáveis)
8. [Integração com Backend](#8-integração-com-backend)
9. [Tipos e Interfaces](#9-tipos-e-interfaces)
10. [Estilos e Design System](#10-estilos-e-design-system)
11. [Fluxos de Trabalho](#11-fluxos-de-trabalho)
12. [Segurança e Permissões](#12-segurança-e-permissões)
13. [Performance e Otimizações](#13-performance-e-otimizações)
14. [Testes e Qualidade](#14-testes-e-qualidade)
15. [Deploy e Produção](#15-deploy-e-produção)
16. [Troubleshooting](#16-troubleshooting)
17. [Glossário](#17-glossário)

---

## 1. Visão Geral

### 1.1 O Que é o VisionPlan?

O **VisionPlan** é uma plataforma SaaS (Software as a Service) desenvolvida para revolucionar o planejamento e a gestão de obras de construção civil. A aplicação unifica funcionalidades tradicionalmente dispersas em múltiplas ferramentas:

- **Cronogramas** (substituindo MS Project/Primavera P6)
- **Visualização 4D** (substituindo Navisworks)
- **Gestão de Tarefas** (Kanban digital)
- **Metodologia Lean** (LPS - Last Planner System)

### 1.2 Objetivos do Sistema

- ✅ Centralizar gestão de projetos de construção
- ✅ Facilitar colaboração entre stakeholders
- ✅ Reduzir tempo de planejamento em 40%
- ✅ Aumentar % PAC (Plan Achievement Completion) para 75%+
- ✅ Fornecer visibilidade em tempo real do progresso

### 1.3 Público-Alvo

#### Usuários Finais
- Engenheiros de Planejamento
- Coordenadores de Obra
- Mestres de Obras
- Encarregados
- Colaboradores (campo)

#### Stakeholders (Camadas de Governança)
- **Proponente**: Cliente/Contratante (governança estratégica)
- **Fiscalização**: Qualidade e liberação formal
- **Contratada**: Executora (planejamento e execução)

### 1.4 Tecnologias Principais

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
    "3d": "Three.js 0.160 + @react-three/fiber"
  },
  "backend": {
    "platform": "Supabase",
    "database": "PostgreSQL 15+",
    "realtime": "WebSockets",
    "storage": "Supabase Storage (S3-compatible)",
    "auth": "Supabase Auth (JWT)"
  }
}
```

---

## 2. Arquitetura da Aplicação

### 2.1 Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  React SPA   │  │ React Native │  │   Browser    │     │
│  │  (Web App)   │  │  (Mobile)    │  │   Storage    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                  ┌──────────▼──────────┐
                  │   SUPABASE LAYER    │
                  │                     │
                  │  ┌───────────────┐ │
                  │  │ Auth (JWT)    │ │
                  │  ├───────────────┤ │
                  │  │ REST API      │ │
                  │  ├───────────────┤ │
                  │  │ Real-time     │ │
                  │  │ (WebSockets)  │ │
                  │  ├───────────────┤ │
                  │  │ Edge Functions│ │
                  │  ├───────────────┤ │
                  │  │ Storage (S3)  │ │
                  │  └───────────────┘ │
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │   DATA LAYER        │
                  │                     │
                  │  ┌───────────────┐ │
                  │  │ PostgreSQL    │ │
                  │  │ (Relational)  │ │
                  │  └───────────────┘ │
                  └─────────────────────┘
```

### 2.2 Padrão de Arquitetura

**Arquitetura Utilizada**: Clean Architecture + Component-Based

#### Camadas

1. **Presentation Layer** (UI Components)
   - Componentes React puros
   - Lógica de apresentação
   - Interação do usuário

2. **Business Logic Layer** (Stores)
   - Gerenciamento de estado (Zustand)
   - Lógica de negócio
   - Transformação de dados

3. **Data Access Layer** (Services)
   - Integração com APIs
   - Chamadas HTTP
   - WebSockets

4. **Infrastructure Layer** (Supabase)
   - Persistência de dados
   - Autenticação
   - Storage

### 2.3 Fluxo de Dados

```
User Action → Component → Store → Service → Supabase → PostgreSQL
                ↑                                            ↓
                └────────────── Response ───────────────────┘
                                  ↓
                          Real-time Update
                                  ↓
                      Other Connected Clients
```

### 2.4 Comunicação Real-time

```typescript
// Real-time Subscription Example
const channel = supabase
  .channel('atividades')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'atividades' },
    (payload) => {
      // Update UI automatically
      updateAtividade(payload.new);
    }
  )
  .subscribe();
```

---

## 3. Estrutura de Pastas

### 3.1 Visão Geral

```
visionplan/
├── public/                     # Assets estáticos
│   ├── favicon.ico
│   └── logo.svg
│
├── src/                        # Código-fonte principal
│   ├── components/             # Componentes React
│   │   ├── common/            # Componentes reutilizáveis
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Badge.tsx
│   │   │
│   │   ├── layout/            # Componentes de layout
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   │
│   │   ├── dashboard/         # Componentes do Dashboard
│   │   │   ├── KPICard.tsx
│   │   │   ├── ChartCard.tsx
│   │   │   └── ActivityTable.tsx
│   │   │
│   │   ├── kanban/            # Componentes Kanban
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   └── KanbanCard.tsx
│   │   │
│   │   ├── gantt/             # Componentes Gantt
│   │   │   ├── GanttChart.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── ActivityRow.tsx
│   │   │
│   │   ├── lps/               # Componentes LPS
│   │   │   ├── LookAhead.tsx
│   │   │   ├── RestrictionCard.tsx
│   │   │   └── PullPlanning.tsx
│   │   │
│   │   └── bim/               # Componentes BIM
│   │       ├── BIMViewer.tsx
│   │       ├── ModelTree.tsx
│   │       └── ElementInfo.tsx
│   │
│   ├── pages/                 # Páginas da aplicação
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── KanbanPage.tsx
│   │   ├── GanttPage.tsx
│   │   ├── LPSPage.tsx
│   │   ├── BIMPage.tsx
│   │   ├── RelatoriosPage.tsx
│   │   └── AdminTemasPage.tsx
│   │
│   ├── stores/                # Zustand stores
│   │   ├── authStore.ts
│   │   ├── temaStore.ts
│   │   ├── projetoStore.ts
│   │   └── notificacaoStore.ts
│   │
│   ├── services/              # Serviços e APIs
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   ├── realtime.ts
│   │   └── storage.ts
│   │
│   ├── types/                 # TypeScript types
│   │   ├── index.ts
│   │   ├── entities.ts
│   │   └── api.ts
│   │
│   ├── utils/                 # Funções utilitárias
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── calculations.ts
│   │   └── date-utils.ts
│   │
│   ├── hooks/                 # Custom React Hooks
│   │   ├── useAuth.ts
│   │   ├── useTema.ts
│   │   └── useRealtime.ts
│   │
│   ├── constants/             # Constantes da aplicação
│   │   ├── routes.ts
│   │   ├── permissions.ts
│   │   └── config.ts
│   │
│   ├── styles/                # Estilos globais
│   │   ├── global.css
│   │   └── variables.css
│   │
│   ├── App.tsx                # Componente raiz
│   ├── main.tsx               # Entry point
│   └── vite-env.d.ts          # Tipos Vite
│
├── .env.example               # Template de variáveis
├── .gitignore                 # Git ignore rules
├── package.json               # Dependências
├── tsconfig.json              # Config TypeScript
├── vite.config.ts             # Config Vite
├── tailwind.config.js         # Config Tailwind
├── postcss.config.js          # Config PostCSS
└── README.md                  # Documentação
```

### 3.2 Convenções de Nomenclatura

#### Arquivos
- **Componentes React**: `PascalCase.tsx` (ex: `KPICard.tsx`)
- **Stores**: `camelCase.ts` (ex: `authStore.ts`)
- **Services**: `camelCase.ts` (ex: `supabase.ts`)
- **Types**: `camelCase.ts` (ex: `index.ts`)
- **Utils**: `kebab-case.ts` (ex: `date-utils.ts`)

#### Variáveis e Funções
- **Variáveis**: `camelCase` (ex: `userName`)
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `API_URL`)
- **Funções**: `camelCase` (ex: `getUserData`)
- **Componentes**: `PascalCase` (ex: `KPICard`)
- **Interfaces**: `PascalCase` (ex: `Usuario`)
- **Enums**: `PascalCase` (ex: `StatusAtividade`)

---

## 4. Componentes Principais

### 4.1 Layout Components

#### 4.1.1 Layout.tsx

**Localização**: `src/components/layout/Layout.tsx`

**Propósito**: Componente principal que envolve todas as páginas, fornecendo estrutura consistente.

**Props**:
```typescript
interface LayoutProps {
  children: React.ReactNode;
}
```

**Estrutura**:
```tsx
<Layout>
  <Sidebar />
  <MainContent>
    <Header />
    <PageContent>{children}</PageContent>
  </MainContent>
</Layout>
```

**Features**:
- ✅ Sidebar responsiva e colapsável
- ✅ Header com notificações
- ✅ Menu contextual por perfil de usuário
- ✅ Overlay mobile
- ✅ Perfil do usuário visível
- ✅ Logout integrado

**Exemplo de Uso**:
```tsx
import Layout from './components/layout/Layout';

function App() {
  return (
    <Layout>
      <DashboardPage />
    </Layout>
  );
}
```

#### 4.1.2 Sidebar

**Features**:
- Menu dinâmico baseado em permissões
- Highlight da rota ativa
- Ícones Lucide React
- Colapsável (desktop e mobile)
- Transições suaves

**Itens do Menu**:
```typescript
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', 
    roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO'] },
  { icon: Calendar, label: 'Gantt / Cronograma', path: '/gantt',
    roles: ['ADMIN', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA'] },
  { icon: KanbanSquare, label: 'Kanban', path: '/kanban',
    roles: ['COLABORADOR', 'ENCARREGADO', 'MESTRE_OBRAS'] },
  // ... mais itens
];
```

### 4.2 Dashboard Components

#### 4.2.1 KPICard.tsx

**Localização**: `src/components/dashboard/KPICard.tsx`

**Propósito**: Exibir métricas-chave (KPIs) de forma visual e impactante.

**Props**:
```typescript
interface KPICardProps {
  title: string;                    // Título do KPI
  value: string | number;           // Valor principal
  icon: LucideIcon;                 // Ícone (Lucide)
  trend?: {                         // Tendência (opcional)
    value: number;                  // % de variação
    isPositive: boolean;            // Positivo/Negativo
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;                // Subtítulo (opcional)
}
```

**Exemplo de Uso**:
```tsx
<KPICard
  title="% PAC Médio"
  value="78.5%"
  icon={TrendingUp}
  color="primary"
  trend={{ value: 5.2, isPositive: true }}
  subtitle="Percentual de Atividades Concluídas"
/>
```

**Renderização**:
- Card com hover effect
- Ícone com cor temática
- Valor em destaque (text-3xl)
- Trend indicator (↑ ou ↓)
- Responsivo

#### 4.2.2 ChartCard

**Features**:
- Integração com Recharts
- Tipos: Line, Bar, Pie, Area
- Responsivo (ResponsiveContainer)
- Tooltips customizados
- Legendas

**Tipos de Gráficos Suportados**:
1. **Curva S**: `LineChart` (Planejado vs Realizado)
2. **Barras**: Restrições por tipo
3. **Pizza**: Distribuição de recursos
4. **Área**: Avanço acumulado

### 4.3 Kanban Components

#### 4.3.1 KanbanBoard

**Estrutura**:
```tsx
<KanbanBoard>
  <KanbanColumn status="A_FAZER">
    <KanbanCard task={task1} />
    <KanbanCard task={task2} />
  </KanbanColumn>
  
  <KanbanColumn status="FAZENDO">
    <KanbanCard task={task3} />
  </KanbanColumn>
  
  <KanbanColumn status="CONCLUIDO">
    <KanbanCard task={task4} />
  </KanbanColumn>
</KanbanBoard>
```

**Features**:
- 3 colunas fixas (A Fazer / Fazendo / Concluído)
- Drag & drop (preparado para react-beautiful-dnd)
- Cores dinâmicas por status
- Contador de tarefas por coluna

#### 4.3.2 KanbanCard

**Props**:
```typescript
interface KanbanCardProps {
  tarefa: TarefaUsuario;
  onCheckIn?: (id: string) => void;
  onCheckOut?: (id: string) => void;
}
```

**Features**:
- Título e descrição
- Badge de prioridade
- Data de criação
- Botões Check-in/Check-out contextuais
- Hover effect
- Cursor grab/grabbing

### 4.4 Common Components

#### 4.4.1 Button

**Variantes**:
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
}
```

**Exemplo**:
```tsx
<Button variant="primary" size="md" icon={Save}>
  Salvar
</Button>
```

#### 4.4.2 Card

**Props**:
```typescript
interface CardProps {
  children: React.ReactNode;
  hover?: boolean;              // Hover effect
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

#### 4.4.3 Badge

**Tipos**:
```typescript
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}
```

**Uso**:
```tsx
<Badge variant="success">Concluída</Badge>
<Badge variant="warning">Em Andamento</Badge>
<Badge variant="danger">Atrasada</Badge>
```

---

## 5. Gerenciamento de Estado

### 5.1 Zustand

**Por que Zustand?**
- ⚡ Leve e performático (2KB)
- 🎯 API simples e intuitiva
- 🔄 Sem boilerplate
- 💾 Persistência fácil
- 🧪 Fácil de testar

### 5.2 Auth Store

**Localização**: `src/stores/authStore.ts`

**Estado**:
```typescript
interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (usuario: Usuario, token: string) => void;
  logout: () => void;
  updateUsuario: (updates: Partial<Usuario>) => void;
}
```

**Implementação**:
```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      isAuthenticated: false,
      token: null,
      
      login: (usuario, token) => {
        set({ usuario, token, isAuthenticated: true });
      },
      
      logout: () => {
        set({ usuario: null, token: null, isAuthenticated: false });
      },
      
      updateUsuario: (updates) => {
        set((state) => ({
          usuario: state.usuario ? { ...state.usuario, ...updates } : null
        }));
      }
    }),
    {
      name: 'visionplan-auth'
    }
  )
);
```

**Uso em Componentes**:
```tsx
import { useAuthStore } from './stores/authStore';

function MyComponent() {
  const { usuario, isAuthenticated, logout } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div>
      <p>Bem-vindo, {usuario?.nome}</p>
      <button onClick={logout}>Sair</button>
    </div>
  );
}
```

### 5.3 Tema Store ⭐⭐⭐

**Localização**: `src/stores/temaStore.ts`

**Estado**:
```typescript
interface TemaState {
  tema: TemaEmpresa;
  setTema: (tema: Partial<TemaEmpresa>) => void;
  resetTema: () => void;
  aplicarTema: () => void;
}
```

**Tema Padrão**:
```typescript
const TEMA_PADRAO: TemaEmpresa = {
  primary: '#0ea5e9',
  secondary: '#6366f1',
  accent: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0'
};
```

**Aplicação de Tema**:
```typescript
aplicarTema: () => {
  const { tema } = get();
  const root = document.documentElement;
  
  // Aplicar CSS Variables
  root.style.setProperty('--color-primary', tema.primary);
  root.style.setProperty('--color-secondary', tema.secondary);
  // ... todas as 12 cores
}
```

**Uso**:
```tsx
const { tema, setTema } = useTemaStore();

// Aplicar cor customizada
<div style={{ backgroundColor: tema.primary }}>
  Conteúdo
</div>

// Alterar tema
setTema({ primary: '#ff0000' });
```

### 5.4 Projeto Store

**Estado**:
```typescript
interface ProjetoState {
  projetoAtual: Projeto | null;
  atividades: Atividade[];
  restricoes: Restricao[];
  setProjetoAtual: (projeto: Projeto) => void;
  addAtividade: (atividade: Atividade) => void;
  updateAtividade: (id: string, updates: Partial<Atividade>) => void;
  // ... mais métodos
}
```

---

## 6. Sistema de Roteamento

### 6.1 React Router v6

**Configuração**: `src/App.tsx`

**Estrutura de Rotas**:
```tsx
<BrowserRouter>
  <Routes>
    {/* Rota Pública */}
    <Route path="/login" element={<LoginPage />} />
    
    {/* Rotas Protegidas */}
    <Route path="/" element={
      <ProtectedRoute>
        <Layout><Navigate to="/dashboard" /></Layout>
      </ProtectedRoute>
    } />
    
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <Layout><DashboardPage /></Layout>
      </ProtectedRoute>
    } />
    
    <Route path="/kanban" element={
      <ProtectedRoute>
        <Layout><KanbanPage /></Layout>
      </ProtectedRoute>
    } />
    
    {/* ... mais rotas */}
  </Routes>
</BrowserRouter>
```

### 6.2 Protected Route

**Implementação**:
```tsx
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

### 6.3 Mapa de Rotas

| Rota | Componente | Permissões | Descrição |
|------|-----------|-----------|-----------|
| `/login` | LoginPage | Público | Autenticação |
| `/dashboard` | DashboardPage | Autenticado | KPIs e gráficos |
| `/kanban` | KanbanPage | Autenticado | Tarefas pessoais |
| `/gantt` | GanttPage | Planejamento | Cronograma |
| `/lps` | LPSPage | Planejamento | LPS e restrições |
| `/bim` | BIMPage | Planejamento | Visualização 4D |
| `/relatorios` | RelatoriosPage | Gerencial | Relatórios |
| `/admin` | AdminTemasPage | ADMIN | Customização |

---

## 7. Sistema de Temas Customizáveis ⭐⭐⭐

### 7.1 Visão Geral

O **Sistema de Temas** é o diferencial principal do VisionPlan, permitindo que cada empresa/cliente tenha sua própria identidade visual.

### 7.2 Cores Personalizáveis

```typescript
interface TemaEmpresa {
  // Cores Primárias
  primary: string;        // Cor principal da marca
  secondary: string;      // Cor secundária
  accent: string;         // Cor de destaque
  
  // Estados
  success: string;        // Verde - Sucesso
  warning: string;        // Amarelo - Aviso
  danger: string;         // Vermelho - Erro
  info: string;           // Azul - Informação
  
  // Interface
  background: string;     // Fundo principal
  surface: string;        // Cards e painéis
  text: string;           // Texto principal
  textSecondary: string;  // Texto secundário
  border: string;         // Bordas e divisores
}
```

### 7.3 Fluxo de Personalização

```
1. Admin acessa /admin
       ↓
2. Interface de cores (color pickers)
       ↓
3. Preview em tempo real
       ↓
4. Clica em "Salvar Tema"
       ↓
5. Store persiste (localStorage)
       ↓
6. CSS Variables aplicadas
       ↓
7. UI atualiza automaticamente
```

### 7.4 Implementação Técnica

#### CSS Variables

**Localização**: `src/styles/global.css`

```css
:root {
  --color-primary: #0ea5e9;
  --color-secondary: #6366f1;
  /* ... 12 cores totais */
}
```

#### Classes Utilitárias

```css
.theme-bg-primary {
  background-color: var(--color-primary);
}

.theme-text {
  color: var(--color-text);
}

.theme-border-primary {
  border-color: var(--color-primary);
}
```

#### Uso em Componentes

**Método 1**: Inline styles
```tsx
<div style={{ backgroundColor: tema.primary }}>
  Conteúdo
</div>
```

**Método 2**: Classes CSS
```tsx
<div className="theme-bg-primary theme-text">
  Conteúdo
</div>
```

**Método 3**: Styled (dinâmico)
```tsx
<button 
  className="btn"
  style={{ 
    backgroundColor: tema.primary,
    color: 'white'
  }}
>
  Botão
</button>
```

### 7.5 Interface de Administração

**Página**: `src/pages/AdminTemasPage.tsx`

**Features**:
- ✅ 12 color pickers
- ✅ Preview em tempo real
- ✅ Botão "Restaurar Padrão"
- ✅ Botão "Salvar Tema"
- ✅ Cards de demonstração
- ✅ Botões de preview
- ✅ Descrição de cada cor

**Exemplo de Color Picker**:
```tsx
<label>
  <span>Cor Primária</span>
  <p className="text-xs">Cor principal da marca</p>
  <input
    type="color"
    value={tempTema.primary}
    onChange={(e) => handleColorChange('primary', e.target.value)}
    className="w-full h-12 rounded-lg cursor-pointer"
  />
</label>
```

---

## 8. Integração com Backend

### 8.1 Supabase Client

**Localização**: `src/services/supabase.ts`

**Configuração**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

### 8.2 Operações CRUD

#### 8.2.1 Create

```typescript
// Criar nova atividade
const { data, error } = await supabase
  .from('atividades')
  .insert({
    codigo: '1.2.3',
    nome: 'Nova Atividade',
    projetoId: 'projeto-123',
    status: 'NAO_INICIADA'
  })
  .select()
  .single();
```

#### 8.2.2 Read

```typescript
// Buscar atividades de um projeto
const { data, error } = await supabase
  .from('atividades')
  .select(`
    *,
    projeto:projetos(nome),
    restricoes(*)
  `)
  .eq('projetoId', 'projeto-123')
  .order('dataInicioPlanejada', { ascending: true });
```

#### 8.2.3 Update

```typescript
// Atualizar status
const { data, error } = await supabase
  .from('atividades')
  .update({ 
    status: 'EM_ANDAMENTO',
    dataInicioReal: new Date().toISOString()
  })
  .eq('id', 'atividade-123')
  .select()
  .single();
```

#### 8.2.4 Delete

```typescript
// Deletar atividade
const { error } = await supabase
  .from('atividades')
  .delete()
  .eq('id', 'atividade-123');
```

### 8.3 Real-time Subscriptions

**Exemplo**: Atualização de atividades em tempo real

```typescript
useEffect(() => {
  const channel = supabase
    .channel('atividades-changes')
    .on('postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'atividades',
        filter: `projetoId=eq.${projetoId}`
      },
      (payload) => {
        console.log('Atividade atualizada:', payload.new);
        // Atualizar estado local
        updateAtividadeLocal(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [projetoId]);
```

### 8.4 Storage (Arquivos)

#### Upload de Arquivo

```typescript
// Upload de modelo BIM
const uploadModeloBIM = async (file: File, projetoId: string) => {
  const filePath = `${projetoId}/modelos/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('bim-models')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('bim-models')
    .getPublicUrl(filePath);
  
  return publicUrl;
};
```

#### Download de Arquivo

```typescript
// Download de documento
const downloadDocumento = async (path: string) => {
  const { data, error } = await supabase.storage
    .from('documentos')
    .download(path);
  
  if (error) throw error;
  
  // Criar URL para download
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = path.split('/').pop() || 'download';
  a.click();
};
```

### 8.5 Autenticação

#### Login

```typescript
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  
  // Buscar dados completos do usuário
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();
  
  // Salvar no store
  useAuthStore.getState().login(usuario, data.session.access_token);
};
```

#### Logout

```typescript
const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  
  useAuthStore.getState().logout();
};
```

#### Verificar Sessão

```typescript
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      // Usuário autenticado
      setUser(session.user);
    }
  });
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null);
    }
  );
  
  return () => subscription.unsubscribe();
}, []);
```

---

## 9. Tipos e Interfaces

### 9.1 Entidades Principais

**Localização**: `src/types/index.ts`

#### Usuario

```typescript
interface Usuario {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  empresaId: string;
  camadaGovernanca: CamadaGovernanca;
  perfilAcesso: PerfilAcesso;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

enum CamadaGovernanca {
  PROPONENTE = 'PROPONENTE',
  FISCALIZACAO = 'FISCALIZACAO',
  CONTRATADA = 'CONTRATADA'
}

enum PerfilAcesso {
  ADMIN = 'ADMIN',
  DIRETOR = 'DIRETOR',
  GERENTE_PROJETO = 'GERENTE_PROJETO',
  ENGENHEIRO_PLANEJAMENTO = 'ENGENHEIRO_PLANEJAMENTO',
  COORDENADOR_OBRA = 'COORDENADOR_OBRA',
  MESTRE_OBRAS = 'MESTRE_OBRAS',
  ENCARREGADO = 'ENCARREGADO',
  COLABORADOR = 'COLABORADOR',
  FISCALIZACAO_LEAD = 'FISCALIZACAO_LEAD',
  FISCALIZACAO_TECNICO = 'FISCALIZACAO_TECNICO'
}
```

#### Atividade

```typescript
interface Atividade {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  projetoId: string;
  atividadePaiId?: string;
  tipo: TipoAtividade;
  status: StatusAtividade;
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

enum TipoAtividade {
  TAREFA = 'TAREFA',
  MARCO = 'MARCO',
  FASE = 'FASE',
  PACOTE_TRABALHO = 'PACOTE_TRABALHO'
}

enum StatusAtividade {
  NAO_INICIADA = 'NAO_INICIADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  PARALISADA = 'PARALISADA',
  CANCELADA = 'CANCELADA'
}
```

#### Restrição

```typescript
interface Restricao {
  id: string;
  descricao: string;
  atividadeId: string;
  tipo: TipoRestricao;
  status: StatusRestricao;
  origem: OrigemRestricao;
  responsavel?: string;
  causaParalisacao?: string;
  impeditiva: boolean;
  bloqueaCronograma: boolean;
  dataIdentificacao: Date;
  dataInicioBloqueio?: Date;
  dataFimBloqueio?: Date;
  dataResolucao?: Date;
  tempoParalisacao?: number;      // em horas
  tempoTratativa?: number;         // em horas
  criadoPorId: string;
  createdAt: Date;
  updatedAt: Date;
}

enum TipoRestricao {
  PROJETO = 'PROJETO',
  MATERIAL = 'MATERIAL',
  MAO_OBRA = 'MAO_OBRA',
  EQUIPAMENTO = 'EQUIPAMENTO',
  CLIMA = 'CLIMA',
  FINANCEIRO = 'FINANCEIRO',
  QUALIDADE = 'QUALIDADE',
  SEGURANCA = 'SEGURANCA',
  OUTRO = 'OUTRO'
}

enum StatusRestricao {
  ABERTA = 'ABERTA',
  EM_TRATAMENTO = 'EM_TRATAMENTO',
  RESOLVIDA = 'RESOLVIDA',
  IMPEDITIVA = 'IMPEDITIVA'
}

enum OrigemRestricao {
  PROPONENTE = 'PROPONENTE',
  FISCALIZACAO = 'FISCALIZACAO',
  CONTRATADA = 'CONTRATADA',
  SISTEMA = 'SISTEMA'
}
```

### 9.2 Type Guards

```typescript
// Verificar se usuário é Admin
export const isAdmin = (usuario: Usuario): boolean => {
  return usuario.perfilAcesso === PerfilAcesso.ADMIN;
};

// Verificar camada de governança
export const isFiscalizacao = (usuario: Usuario): boolean => {
  return usuario.camadaGovernanca === CamadaGovernanca.FISCALIZACAO;
};

// Verificar se atividade está atrasada
export const isAtrasada = (atividade: Atividade): boolean => {
  if (!atividade.dataFimPlanejada) return false;
  return new Date() > new Date(atividade.dataFimPlanejada) &&
         atividade.status !== StatusAtividade.CONCLUIDA;
};
```

---

## 10. Estilos e Design System

### 10.1 Tailwind CSS

**Configuração**: `tailwind.config.js`

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
        // ... outras cores
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### 10.2 CSS Variables

**Definição**: `src/styles/global.css`

```css
:root {
  /* Cores Customizáveis */
  --color-primary: #0ea5e9;
  --color-secondary: #6366f1;
  --color-accent: #8b5cf6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;
  --color-background: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #1e293b;
  --color-text-secondary: #64748b;
  --color-border: #e2e8f0;
  
  /* Sombras */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Transições */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 10.3 Classes Utilitárias Customizadas

```css
/* Componentes */
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.card-hover {
  transition: all var(--transition-normal);
}

.card-hover:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Botões */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
  box-shadow: var(--shadow-md);
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-success {
  background-color: #d1fae5;
  color: #065f46;
}

.badge-warning {
  background-color: #fef3c7;
  color: #92400e;
}

.badge-danger {
  background-color: #fee2e2;
  color: #991b1b;
}
```

### 10.4 Animações

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn var(--transition-normal);
}

.animate-slide-in-up {
  animation: slideInUp var(--transition-normal);
}
```

### 10.5 Responsividade

**Breakpoints Tailwind**:
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

**Exemplo de Uso**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* 1 coluna mobile, 2 tablet, 4 desktop */}
</div>
```

---

Continua na próxima parte (11-17)...
