# 🏗️ Guia de Estrutura do Projeto VisionPlan

> Documentação completa da arquitetura e organização do projeto

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Padrões de Arquitetura](#padrões-de-arquitetura)
4. [Fluxo de Dados](#fluxo-de-dados)
5. [Convenções de Código](#convenções-de-código)
6. [Escalabilidade](#escalabilidade)

---

## 🎯 Visão Geral

O VisionPlan segue uma **arquitetura modular e escalável** baseada em:

- **Clean Architecture** - Separação de responsabilidades
- **Feature-Based Structure** - Organização por funcionalidade
- **Type-First Development** - TypeScript em todo o código
- **Component-Driven** - Componentes reutilizáveis e isolados

### Princípios de Design

```
┌─────────────────────────────────────┐
│     Presentation Layer (React)      │
│  Components, Pages, Hooks           │
├─────────────────────────────────────┤
│     Business Logic Layer            │
│  Stores, Services, Utils            │
├─────────────────────────────────────┤
│     Data Layer (Supabase)           │
│  Database, Auth, Storage, Realtime  │
└─────────────────────────────────────┘
```

---

## 📂 Estrutura de Pastas

### Raiz do Projeto

```
visionplan/
├── src/              # Código fonte da aplicação
├── docs/             # Documentação completa
├── public/           # Assets públicos (favicon, etc)
├── scripts/          # Scripts de automação e deploy
├── tests/            # Testes (unit, integration, e2e)
├── .env.example      # Template de variáveis de ambiente
├── package.json      # Dependências e scripts
├── tsconfig.json     # Configuração TypeScript
├── vite.config.ts    # Configuração Vite
└── README.md         # Documentação principal
```

### Pasta `src/` (Detalhada)

```
src/
├── 📂 components/           # Componentes React reutilizáveis
│   ├── 📂 ui/              # Componentes de UI base (atomic)
│   │   ├── Button.tsx      # Botão genérico
│   │   ├── Card.tsx        # Card container
│   │   ├── Input.tsx       # Input de formulário
│   │   ├── Badge.tsx       # Badge/Tag
│   │   ├── Modal.tsx       # Modal/Dialog
│   │   └── KPICard.tsx     # Card de KPI
│   │
│   ├── 📂 layout/          # Componentes de estrutura
│   │   ├── Header.tsx      # Cabeçalho da aplicação
│   │   ├── Sidebar.tsx     # Menu lateral
│   │   ├── Layout.tsx      # Layout base
│   │   └── MainLayout.tsx  # Layout principal com sidebar
│   │
│   └── 📂 features/        # Componentes de features complexas
│       ├── Dashboard.tsx   # Dashboard com métricas
│       └── ThemeCustomizer.tsx  # Customizador de temas
│
├── 📂 pages/               # Páginas/Rotas da aplicação
│   ├── LoginPage.tsx       # Página de login
│   ├── DashboardPage.tsx   # Dashboard principal
│   ├── KanbanPage.tsx      # Kanban pessoal
│   ├── AdminTemasPage.tsx  # Admin de temas
│   └── ConfiguracoesPage.tsx  # Configurações
│
├── 📂 stores/              # State Management (Zustand)
│   ├── authStore.ts        # Store de autenticação
│   ├── temaStore.ts        # Store de temas
│   └── appStore.ts         # Store geral da aplicação
│
├── 📂 services/            # Camada de serviços/APIs
│   ├── supabase.ts         # Cliente Supabase
│   ├── api.ts              # Cliente API REST
│   ├── authService.ts      # Serviços de autenticação
│   ├── userService.ts      # Serviços de usuário
│   └── realtimeService.ts  # Serviços real-time
│
├── 📂 hooks/               # Custom React Hooks
│   ├── useAuth.ts          # Hook de autenticação
│   ├── useTheme.ts         # Hook de temas
│   ├── useDebounce.ts      # Hook de debounce
│   ├── useLocalStorage.ts  # Hook de localStorage
│   └── useMediaQuery.ts    # Hook de media queries
│
├── 📂 utils/               # Funções utilitárias puras
│   ├── date.ts             # Helpers de data
│   ├── string.ts           # Helpers de string
│   ├── validation.ts       # Validações
│   ├── format.ts           # Formatações
│   └── helpers.ts          # Helpers gerais
│
├── 📂 types/               # TypeScript types e interfaces
│   ├── index.ts            # Types principais
│   ├── user.ts             # Types de usuário
│   ├── task.ts             # Types de tarefas
│   ├── theme.ts            # Types de temas
│   └── api.ts              # Types de API
│
├── 📂 constants/           # Constantes da aplicação
│   ├── routes.ts           # Rotas da aplicação
│   ├── colors.ts           # Cores padrão
│   ├── config.ts           # Configurações
│   └── messages.ts         # Mensagens do sistema
│
├── 📂 styles/              # Estilos globais
│   ├── globals.css         # Estilos globais
│   ├── tailwind.css        # Base do Tailwind
│   └── variables.css       # Variáveis CSS
│
├── 📂 config/              # Configurações da aplicação
│   ├── supabase.config.ts  # Config Supabase
│   ├── theme.config.ts     # Config de temas
│   └── app.config.ts       # Config geral
│
├── 📂 routes/              # Configuração de rotas
│   ├── routes.tsx          # Definição de rotas
│   ├── ProtectedRoute.tsx  # Rota protegida
│   └── RouteGuard.tsx      # Guard de rotas
│
├── 📂 assets/              # Assets estáticos
│   ├── 📂 images/          # Imagens
│   │   ├── logo.svg
│   │   └── placeholder.png
│   └── 📂 fonts/           # Fontes customizadas
│       └── custom-font.woff2
│
├── App.tsx                 # Componente raiz da aplicação
├── main.tsx                # Entry point (ReactDOM.render)
└── vite-env.d.ts          # TypeScript declarations para Vite
```

---

## 🏛️ Padrões de Arquitetura

### 1. Component Architecture

#### Hierarquia de Componentes

```
App
└── MainLayout
    ├── Header
    │   ├── UserMenu
    │   └── Notifications
    ├── Sidebar
    │   └── Navigation
    └── Page (DashboardPage)
        ├── Dashboard (feature)
        │   ├── KPICard (ui)
        │   ├── Chart (ui)
        │   └── Card (ui)
        └── Modal (ui)
```

#### Categorias de Componentes

**UI Components** (`src/components/ui/`)
- Componentes "burros" (dumb/presentational)
- Sem lógica de negócio
- Apenas props e renderização
- Totalmente reutilizáveis

```tsx
// ✅ Bom exemplo
export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

**Layout Components** (`src/components/layout/`)
- Estrutura visual da aplicação
- Posicionamento e organização
- Navegação

**Feature Components** (`src/components/features/`)
- Componentes "inteligentes" (smart/container)
- Lógica de negócio
- Integram stores e services
- Específicos de features

```tsx
// ✅ Feature component
export const Dashboard: React.FC = () => {
  const { data, loading } = useDashboardData();
  const { tema } = useTheme();
  
  if (loading) return <Loading />;
  
  return (
    <div>
      <KPICard data={data.kpi1} />
      <Chart data={data.chart} theme={tema} />
    </div>
  );
};
```

### 2. State Management Pattern

#### Zustand Stores

```
┌─────────────────────┐
│   authStore         │  ← Autenticação global
│   - user            │
│   - login()         │
│   - logout()        │
└─────────────────────┘

┌─────────────────────┐
│   temaStore         │  ← Temas customizáveis
│   - tema            │
│   - carregarTema()  │
│   - aplicarTema()   │
└─────────────────────┘

┌─────────────────────┐
│   appStore          │  ← Estado da aplicação
│   - sidebarOpen     │
│   - modalOpen       │
│   - toggleSidebar() │
└─────────────────────┘
```

#### Quando usar cada tipo de estado?

| Tipo de Estado | Onde | Exemplo |
|----------------|------|---------|
| **Local** | `useState` | Estado de formulário, toggle |
| **Compartilhado** | Zustand Store | Autenticação, tema, notificações |
| **Server** | React Query / SWR | Dados de API |
| **URL** | React Router | Filtros, paginação, tabs |

### 3. Service Layer Pattern

Toda comunicação externa passa pela camada de serviços:

```
Component → Hook → Store → Service → API/Database
```

**Exemplo:**

```tsx
// ❌ Ruim - Componente fazendo chamada direta
function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    supabase.from('users').select('*').then(setData);
  }, []);
  
  return <div>{data}</div>;
}

// ✅ Bom - Usando camada de serviços
function MyComponent() {
  const { users, loading } = useUsers(); // hook
  
  if (loading) return <Loading />;
  return <div>{users}</div>;
}

// hooks/useUsers.ts
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    userService.getAll() // service
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);
  
  return { users, loading };
};
```

---

## 🔄 Fluxo de Dados

### Fluxo de Leitura (Read)

```
1. Usuário acessa página
   ↓
2. Page component renderiza
   ↓
3. Hook customizado é chamado
   ↓
4. Hook busca do Store (se já existe)
   ↓
5. Se não existe, chama Service
   ↓
6. Service faz requisição (Supabase/API)
   ↓
7. Dados retornam → Store → Hook → Component
   ↓
8. Component renderiza dados
```

### Fluxo de Escrita (Write)

```
1. Usuário interage (clique, submit)
   ↓
2. Event handler é chamado
   ↓
3. Handler chama função do Store
   ↓
4. Store chama Service
   ↓
5. Service faz requisição (POST/PUT/DELETE)
   ↓
6. Resposta retorna → Store atualiza estado
   ↓
7. Componentes subscritos re-renderizam
   ↓
8. UI reflete mudança
```

### Exemplo Completo

```tsx
// 1. Page
export const UsersPage = () => {
  const { users, loading, addUser } = useUsers();
  const [formData, setFormData] = useState({});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await addUser(formData);
  };
  
  return (
    <div>
      <UserForm onSubmit={handleSubmit} />
      <UserList users={users} loading={loading} />
    </div>
  );
};

// 2. Hook
export const useUsers = () => {
  const { users, loading, fetchUsers, addUser } = useUserStore();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  return { users, loading, addUser };
};

// 3. Store
export const useUserStore = create((set) => ({
  users: [],
  loading: false,
  
  fetchUsers: async () => {
    set({ loading: true });
    const users = await userService.getAll(); // 4. Service
    set({ users, loading: false });
  },
  
  addUser: async (data) => {
    const user = await userService.create(data);
    set((state) => ({ users: [...state.users, user] }));
  },
}));

// 4. Service
export const userService = {
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    return data;
  },
  
  async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};
```

---

## 📏 Convenções de Código

### Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| **Componentes** | PascalCase | `UserCard`, `LoginPage` |
| **Hooks** | camelCase com `use` | `useAuth`, `useTheme` |
| **Stores** | camelCase com `Store` | `authStore`, `userStore` |
| **Services** | camelCase com `Service` | `userService`, `apiService` |
| **Types** | PascalCase | `User`, `Theme`, `KPIData` |
| **Constants** | UPPER_SNAKE_CASE | `API_URL`, `MAX_ITEMS` |
| **Utils** | camelCase | `formatDate`, `validateEmail` |

### Estrutura de Arquivos

#### Componente

```tsx
// UserCard.tsx
import React from 'react';
import { User } from '@/types';
import { formatDate } from '@/utils';

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onEdit 
}) => {
  return (
    <div className="card">
      <h3>{user.name}</h3>
      <p>{formatDate(user.createdAt)}</p>
      {onEdit && (
        <button onClick={() => onEdit(user)}>Editar</button>
      )}
    </div>
  );
};
```

#### Hook

```tsx
// useAuth.ts
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const { user, login, logout } = useAuthStore();
  
  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };
};
```

### Imports

Ordem recomendada:

```tsx
// 1. Bibliotecas externas
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Imports internos (alias @/)
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services';
import { User } from '@/types';
import { formatDate } from '@/utils';

// 3. Imports relativos (evitar quando possível)
import { localHelper } from './helpers';

// 4. Estilos
import './styles.css';
```

---

## 📈 Escalabilidade

### Adicionando Novas Features

#### 1. Criar estrutura de pastas

```
src/
├── components/features/
│   └── MyFeature/
│       ├── MyFeature.tsx
│       ├── MyFeature.test.tsx
│       └── MyFeature.css
├── pages/
│   └── MyFeaturePage.tsx
├── hooks/
│   └── useMyFeature.ts
├── stores/
│   └── myFeatureStore.ts
├── services/
│   └── myFeatureService.ts
└── types/
    └── myFeature.ts
```

#### 2. Implementar types

```tsx
// types/myFeature.ts
export interface MyFeature {
  id: string;
  name: string;
  createdAt: Date;
}

export interface MyFeatureCreate {
  name: string;
}
```

#### 3. Criar service

```tsx
// services/myFeatureService.ts
export const myFeatureService = {
  async getAll(): Promise<MyFeature[]> {
    // ...
  },
  async create(data: MyFeatureCreate): Promise<MyFeature> {
    // ...
  },
};
```

#### 4. Criar store

```tsx
// stores/myFeatureStore.ts
export const useMyFeatureStore = create<MyFeatureStore>((set) => ({
  items: [],
  loading: false,
  fetchItems: async () => {
    set({ loading: true });
    const items = await myFeatureService.getAll();
    set({ items, loading: false });
  },
}));
```

#### 5. Criar hook

```tsx
// hooks/useMyFeature.ts
export const useMyFeature = () => {
  const { items, loading, fetchItems } = useMyFeatureStore();
  
  useEffect(() => {
    fetchItems();
  }, []);
  
  return { items, loading };
};
```

#### 6. Criar componente

```tsx
// components/features/MyFeature.tsx
export const MyFeature: React.FC = () => {
  const { items, loading } = useMyFeature();
  
  if (loading) return <Loading />;
  
  return (
    <div>
      {items.map(item => (
        <Card key={item.id}>{item.name}</Card>
      ))}
    </div>
  );
};
```

#### 7. Criar página

```tsx
// pages/MyFeaturePage.tsx
export const MyFeaturePage: React.FC = () => {
  return (
    <MainLayout>
      <h1>My Feature</h1>
      <MyFeature />
    </MainLayout>
  );
};
```

#### 8. Adicionar rota

```tsx
// routes/routes.tsx
<Route 
  path="/my-feature" 
  element={
    <ProtectedRoute>
      <MyFeaturePage />
    </ProtectedRoute>
  } 
/>
```

### Migração para Monorepo

Para escalar ainda mais, considere migrar para monorepo:

```
visionplan/
├── apps/
│   ├── web/              # Aplicação web
│   ├── mobile/           # App mobile
│   └── admin/            # Painel admin
├── packages/
│   ├── ui/               # Biblioteca de componentes
│   ├── shared/           # Código compartilhado
│   ├── types/            # Types compartilhados
│   └── utils/            # Utils compartilhados
└── package.json
```

Ferramentas recomendadas:
- [Nx](https://nx.dev/)
- [Turborepo](https://turbo.build/)
- [Lerna](https://lerna.js.org/)

---

## 📚 Recursos

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)

---

<div align="center">

**VisionPlan** - Arquitetura Escalável e Profissional

*Última atualização: Novembro 2024*

</div>

