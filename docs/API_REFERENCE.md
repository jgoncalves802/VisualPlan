# 📘 VisionPlan - API e Referência Rápida

## Guia de Consulta Rápida para Desenvolvedores

---

## 📑 Índice Rápido

1. [Hooks Customizados](#1-hooks-customizados)
2. [Funções Utilitárias](#2-funções-utilitárias)
3. [API Supabase - Referência](#3-api-supabase---referência)
4. [Componentes - Props Reference](#4-componentes---props-reference)
5. [Stores - API Reference](#5-stores---api-reference)
6. [Constantes e Configurações](#6-constantes-e-configurações)
7. [Snippets Úteis](#7-snippets-úteis)
8. [Comandos CLI](#8-comandos-cli)

---

## 1. Hooks Customizados

### useAuth

```typescript
import { useAuthStore } from '@/stores/authStore';

function MyComponent() {
  const { usuario, isAuthenticated, login, logout } = useAuthStore();
  
  // Verificar se está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Usar dados do usuário
  return <div>Olá, {usuario?.nome}</div>;
}
```

### useTema

```typescript
import { useTemaStore } from '@/stores/temaStore';

function MyComponent() {
  const { tema, setTema, resetTema } = useTemaStore();
  
  // Usar cor do tema
  return (
    <div style={{ backgroundColor: tema.primary }}>
      Conteúdo
    </div>
  );
}
```

### useRealtime (Custom Hook)

```typescript
// hooks/useRealtime.ts
import { useEffect } from 'react';
import { supabase } from '@/services/supabase';

export const useRealtime = (
  table: string,
  filter: string,
  callback: (payload: any) => void
) => {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table, filter },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, callback]);
};

// Uso
useRealtime(
  'atividades',
  `projetoId=eq.${projetoId}`,
  (payload) => {
    console.log('Mudança:', payload);
  }
);
```

### useDebounce

```typescript
// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Uso
const searchQuery = useDebounce(inputValue, 300);
useEffect(() => {
  buscarAtividades(searchQuery);
}, [searchQuery]);
```

---

## 2. Funções Utilitárias

### Date Utils

```typescript
// utils/date-utils.ts

// Formatar data para PT-BR
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

// Formatar data e hora
export const formatDateTime = (date: Date | string): string => {
  return new Date(date).toLocaleString('pt-BR');
};

// Diferença em dias
export const daysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Verificar se data está atrasada
export const isOverdue = (date: Date | string): boolean => {
  return new Date(date) < new Date();
};

// Semana do ano
export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};
```

### Formatters

```typescript
// utils/formatters.ts

// Formatar moeda (BRL)
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Formatar percentual
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Formatar número com separador de milhares
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

// Truncar texto
export const truncate = (text: string, length: number): string => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};
```

### Calculations

```typescript
// utils/calculations.ts

// Calcular SPI (Schedule Performance Index)
export const calculateSPI = (
  valorAgregado: number,
  valorPlanejado: number
): number => {
  if (valorPlanejado === 0) return 0;
  return valorAgregado / valorPlanejado;
};

// Calcular CPI (Cost Performance Index)
export const calculateCPI = (
  valorAgregado: number,
  custoReal: number
): number => {
  if (custoReal === 0) return 0;
  return valorAgregado / custoReal;
};

// Calcular % PAC
export const calculatePAC = (
  concluidas: number,
  planejadas: number
): number => {
  if (planejadas === 0) return 0;
  return (concluidas / planejadas) * 100;
};

// Calcular variação de cronograma
export const calculateScheduleVariance = (
  valorAgregado: number,
  valorPlanejado: number
): number => {
  return valorAgregado - valorPlanejado;
};

// Calcular variação de custo
export const calculateCostVariance = (
  valorAgregado: number,
  custoReal: number
): number => {
  return valorAgregado - custoReal;
};
```

---

## 3. API Supabase - Referência

### Select (Read)

```typescript
// Buscar todos
const { data, error } = await supabase
  .from('atividades')
  .select('*');

// Buscar com filtro
const { data, error } = await supabase
  .from('atividades')
  .select('*')
  .eq('projetoId', 'projeto-123');

// Buscar com relacionamentos
const { data, error } = await supabase
  .from('atividades')
  .select(`
    *,
    projeto:projetos(nome),
    restricoes(*)
  `);

// Buscar único
const { data, error } = await supabase
  .from('atividades')
  .select('*')
  .eq('id', 'atividade-123')
  .single();

// Buscar com ordenação
const { data, error } = await supabase
  .from('atividades')
  .select('*')
  .order('dataInicioPlanejada', { ascending: true });

// Buscar com limite
const { data, error } = await supabase
  .from('atividades')
  .select('*')
  .limit(10);

// Buscar com paginação
const { data, error } = await supabase
  .from('atividades')
  .select('*')
  .range(0, 9); // Primeira página (0-9)
```

### Insert (Create)

```typescript
// Inserir único
const { data, error } = await supabase
  .from('atividades')
  .insert({
    codigo: '1.2.3',
    nome: 'Nova Atividade',
    projetoId: 'projeto-123'
  })
  .select()
  .single();

// Inserir múltiplos
const { data, error } = await supabase
  .from('atividades')
  .insert([
    { codigo: '1.2.3', nome: 'Atividade 1' },
    { codigo: '1.2.4', nome: 'Atividade 2' }
  ])
  .select();
```

### Update

```typescript
// Atualizar por ID
const { data, error } = await supabase
  .from('atividades')
  .update({ 
    status: 'EM_ANDAMENTO',
    dataInicioReal: new Date().toISOString()
  })
  .eq('id', 'atividade-123')
  .select()
  .single();

// Atualizar múltiplos
const { data, error } = await supabase
  .from('atividades')
  .update({ status: 'PARALISADA' })
  .eq('projetoId', 'projeto-123')
  .in('id', ['id1', 'id2', 'id3']);
```

### Delete

```typescript
// Deletar por ID
const { error } = await supabase
  .from('atividades')
  .delete()
  .eq('id', 'atividade-123');

// Deletar múltiplos
const { error } = await supabase
  .from('atividades')
  .delete()
  .in('id', ['id1', 'id2', 'id3']);
```

### Storage

```typescript
// Upload
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload('path/to/file.pdf', file);

// Download
const { data, error } = await supabase.storage
  .from('bucket-name')
  .download('path/to/file.pdf');

// Get Public URL
const { data } = supabase.storage
  .from('bucket-name')
  .getPublicUrl('path/to/file.pdf');

// Delete
const { error } = await supabase.storage
  .from('bucket-name')
  .remove(['path/to/file.pdf']);
```

---

## 4. Componentes - Props Reference

### KPICard

```typescript
interface KPICardProps {
  title: string;                    // Título do KPI
  value: string | number;           // Valor principal
  icon: LucideIcon;                 // Ícone do Lucide
  trend?: {
    value: number;                  // % de variação
    isPositive: boolean;            // true = ↑, false = ↓
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;                // Texto adicional
}
```

**Exemplo**:
```tsx
<KPICard
  title="% PAC Médio"
  value="78.5%"
  icon={TrendingUp}
  color="primary"
  trend={{ value: 5.2, isPositive: true }}
  subtitle="Última semana"
/>
```

### Button

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
```

**Exemplo**:
```tsx
<Button 
  variant="primary" 
  size="md" 
  icon={Save}
  loading={isSaving}
  onClick={handleSave}
>
  Salvar
</Button>
```

### Card

```typescript
interface CardProps {
  children: React.ReactNode;
  hover?: boolean;              // Efeito hover
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

### Badge

```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}
```

**Exemplo**:
```tsx
<Badge variant="success">Concluída</Badge>
<Badge variant="warning">Em Andamento</Badge>
<Badge variant="danger">Atrasada</Badge>
```

---

## 5. Stores - API Reference

### authStore

```typescript
interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (usuario: Usuario, token: string) => void;
  logout: () => void;
  updateUsuario: (updates: Partial<Usuario>) => void;
}

// Métodos
const { usuario, isAuthenticated, login, logout } = useAuthStore();

// Login
login(usuarioData, 'jwt-token');

// Logout
logout();

// Atualizar usuário
updateUsuario({ nome: 'Novo Nome' });
```

### temaStore

```typescript
interface TemaState {
  tema: TemaEmpresa;
  setTema: (tema: Partial<TemaEmpresa>) => void;
  resetTema: () => void;
  aplicarTema: () => void;
}

// Métodos
const { tema, setTema, resetTema, aplicarTema } = useTemaStore();

// Alterar uma cor
setTema({ primary: '#ff0000' });

// Alterar múltiplas cores
setTema({ 
  primary: '#ff0000',
  secondary: '#00ff00'
});

// Resetar para padrão
resetTema();

// Aplicar tema (CSS Variables)
aplicarTema();
```

---

## 6. Constantes e Configurações

### Rotas

```typescript
// constants/routes.ts
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  KANBAN: '/kanban',
  GANTT: '/gantt',
  LPS: '/lps',
  BIM: '/bim',
  RELATORIOS: '/relatorios',
  ADMIN: '/admin',
  ADMIN_TEMAS: '/admin/temas',
  ADMIN_USUARIOS: '/admin/usuarios',
} as const;
```

### Status

```typescript
// constants/status.ts
export const STATUS_ATIVIDADE = {
  NAO_INICIADA: {
    label: 'Não Iniciada',
    color: 'gray',
    badge: 'neutral'
  },
  EM_ANDAMENTO: {
    label: 'Em Andamento',
    color: 'blue',
    badge: 'info'
  },
  CONCLUIDA: {
    label: 'Concluída',
    color: 'green',
    badge: 'success'
  },
  PARALISADA: {
    label: 'Paralisada',
    color: 'red',
    badge: 'danger'
  }
} as const;
```

### Permissões

```typescript
// constants/permissions.ts
export const PERMISSIONS = {
  // Administração
  MANAGE_USERS: 'manage:users',
  MANAGE_THEMES: 'manage:themes',
  MANAGE_COMPANIES: 'manage:companies',
  
  // Dashboard
  VIEW_DASHBOARD: 'view:dashboard',
  VIEW_ALL_PROJECTS: 'view:all-projects',
  
  // Cronograma
  EDIT_SCHEDULE: 'edit:schedule',
  CREATE_ACTIVITIES: 'create:activities',
  DELETE_ACTIVITIES: 'delete:activities',
  
  // LPS
  MANAGE_RESTRICTIONS: 'manage:restrictions',
  APPROVE_QUALITY: 'approve:quality',
  RELEASE_SCHEDULE: 'release:schedule',
  
  // Kanban
  UPDATE_OWN_TASKS: 'update:own-tasks',
  CHECKIN_ACTIVITIES: 'checkin:activities',
} as const;
```

---

## 7. Snippets Úteis

### Criar Novo Componente

```typescript
// MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  // props aqui
}

const MyComponent: React.FC<MyComponentProps> = ({ }) => {
  return (
    <div className="card">
      {/* conteúdo */}
    </div>
  );
};

export default MyComponent;
```

### Criar Nova Página

```typescript
// MyPage.tsx
import React from 'react';
import { useAuthStore } from '@/stores/authStore';

const MyPage: React.FC = () => {
  const { usuario } = useAuthStore();
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold theme-text">Título</h1>
        <p className="text-sm theme-text-secondary mt-1">Descrição</p>
      </div>
      
      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards */}
      </div>
    </div>
  );
};

export default MyPage;
```

### Criar Novo Store

```typescript
// myStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyState {
  data: any[];
  loading: boolean;
  setData: (data: any[]) => void;
  fetchData: () => Promise<void>;
}

export const useMyStore = create<MyState>()(
  persist(
    (set) => ({
      data: [],
      loading: false,
      
      setData: (data) => set({ data }),
      
      fetchData: async () => {
        set({ loading: true });
        try {
          // buscar dados
          const data = await api.getData();
          set({ data, loading: false });
        } catch (error) {
          console.error(error);
          set({ loading: false });
        }
      }
    }),
    {
      name: 'my-storage'
    }
  )
);
```

### Loading State

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  try {
    setLoading(true);
    await someAsyncAction();
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

return (
  <Button loading={loading} onClick={handleAction}>
    {loading ? 'Carregando...' : 'Ação'}
  </Button>
);
```

### Error Handling

```typescript
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  try {
    setError(null);
    await someAsyncAction();
  } catch (error) {
    setError(error.message || 'Erro desconhecido');
  }
};

return (
  <div>
    {error && (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )}
    <Button onClick={handleAction}>Ação</Button>
  </div>
);
```

---

## 8. Comandos CLI

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint

# Format (se configurado)
npm run format
```

### Git

```bash
# Commit com convenção
git commit -m "Add: nova funcionalidade"
git commit -m "Fix: correção de bug"
git commit -m "Update: atualização de código"
git commit -m "Refactor: refatoração"
git commit -m "Docs: documentação"
git commit -m "Style: formatação"

# Push
git push origin main

# Pull Request
gh pr create --title "Título" --body "Descrição"
```

### Supabase CLI (se instalado)

```bash
# Login
supabase login

# Link project
supabase link --project-ref <project-id>

# Migrations
supabase db push

# Generate types
supabase gen types typescript --local > src/types/supabase.ts
```

---

## 📝 Checklist de Desenvolvimento

### Antes de Criar Componente

- [ ] Definir props interface
- [ ] Definir tipos de retorno
- [ ] Planejar estado interno
- [ ] Listar dependências externas

### Antes de Commit

- [ ] Testar funcionalidade
- [ ] Verificar console (sem errors)
- [ ] Lint passed
- [ ] Tipos corretos (TypeScript)
- [ ] Código formatado

### Antes de Deploy

- [ ] Build successful
- [ ] Testes passando
- [ ] Variáveis de ambiente configuradas
- [ ] README atualizado
- [ ] Changelog atualizado

---

## 🎯 Atalhos VS Code

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

---

**VisionPlan v2.2.0** - API Reference & Quick Guide

Desenvolvido para acelerar o desenvolvimento! 🚀
