# 🗄️ Stores (State Management)

Gerenciamento de estado global usando **Zustand**.

## 📂 Stores Disponíveis

### `authStore.ts` - Autenticação

Gerencia estado de autenticação do usuário.

```typescript
interface AuthStore {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

**Uso:**
```tsx
import { useAuthStore } from '@/stores/authStore';

function MyComponent() {
  const { user, login, logout } = useAuthStore();
  
  return (
    <div>
      {user ? (
        <>
          <p>Bem-vindo, {user.email}</p>
          <button onClick={logout}>Sair</button>
        </>
      ) : (
        <button onClick={() => login('email', 'pass')}>Entrar</button>
      )}
    </div>
  );
}
```

### `temaStore.ts` - Temas

Gerencia temas customizáveis da aplicação.

```typescript
interface TemaStore {
  tema: Tema | null;
  loading: boolean;
  carregarTema: (clienteId: string) => Promise<void>;
  aplicarTema: (tema: Tema) => void;
  resetarTema: () => void;
}
```

**Uso:**
```tsx
import { useTemaStore } from '@/stores/temaStore';

function ThemeButton() {
  const { tema, carregarTema } = useTemaStore();
  
  return (
    <button 
      style={{ backgroundColor: tema?.primary }}
      onClick={() => carregarTema('cliente-123')}
    >
      Carregar Tema
    </button>
  );
}
```

### `appStore.ts` - Estado da Aplicação

Gerencia estado geral da aplicação (sidebar, modais, etc).

```typescript
interface AppStore {
  sidebarOpen: boolean;
  modalOpen: boolean;
  toggleSidebar: () => void;
  openModal: () => void;
  closeModal: () => void;
}
```

## 🎯 Por que Zustand?

- ✅ **Simples** - API minimalista e fácil de usar
- ✅ **Performático** - Re-renders otimizados
- ✅ **TypeScript** - Suporte nativo
- ✅ **DevTools** - Integração com Redux DevTools
- ✅ **Sem Boilerplate** - Menos código que Redux

## 📏 Convenções

### Estrutura de Store

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface MyStore {
  // Estado
  count: number;
  items: Item[];
  
  // Ações
  increment: () => void;
  addItem: (item: Item) => void;
  reset: () => void;
}

export const useMyStore = create<MyStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        count: 0,
        items: [],
        
        // Ações
        increment: () => set((state) => ({ 
          count: state.count + 1 
        })),
        
        addItem: (item) => set((state) => ({ 
          items: [...state.items, item] 
        })),
        
        reset: () => set({ count: 0, items: [] }),
      }),
      { name: 'my-store' }
    )
  )
);
```

### Boas Práticas

1. **Tipagem Forte** - Sempre defina interface para o store
2. **Ações Puras** - Use `set` para atualizar estado
3. **Imutabilidade** - Nunca mute estado diretamente
4. **Persist** - Use middleware persist para dados importantes
5. **DevTools** - Use devtools em desenvolvimento
6. **Seletores** - Use seletores para performance

### Seletores

```tsx
// ❌ Ruim - Re-renderiza em qualquer mudança
const store = useMyStore();

// ✅ Bom - Re-renderiza apenas quando count muda
const count = useMyStore((state) => state.count);

// ✅ Ótimo - Seletor customizado
const useCount = () => useMyStore((state) => state.count);
```

## 🔄 Async Actions

Para ações assíncronas:

```typescript
export const useDataStore = create<DataStore>((set) => ({
  data: null,
  loading: false,
  error: null,
  
  fetchData: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api.getData(id);
      set({ data, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
}));
```

## 🧪 Testes

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyStore } from './myStore';

describe('MyStore', () => {
  beforeEach(() => {
    useMyStore.getState().reset();
  });
  
  it('increments count', () => {
    const { result } = renderHook(() => useMyStore());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

## 📚 Recursos

- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/practice-with-no-store-actions)

