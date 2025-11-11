# 🎣 Custom Hooks

Hooks customizados para lógica reutilizável.

## 📋 O que são Custom Hooks?

Custom Hooks permitem extrair lógica de componentes em funções reutilizáveis. São funções JavaScript que:
- Começam com `use` (convenção React)
- Podem usar outros hooks
- Retornam valores e/ou funções

## 🎯 Quando Criar um Custom Hook?

Crie um custom hook quando:
- ✅ Lógica é usada em múltiplos componentes
- ✅ Há efeitos complexos para extrair
- ✅ Precisa encapsular estado e comportamento
- ✅ Quer melhorar legibilidade

## 📝 Exemplos de Hooks

### `useAuth.ts` - Autenticação

```typescript
import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const { user, login, logout, loading } = useAuthStore();
  
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  
  return {
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    loading,
  };
};
```

**Uso:**
```tsx
function MyComponent() {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <Login />;
  return <p>Olá, {user.name}</p>;
}
```

### `useTheme.ts` - Temas

```typescript
import { useTemaStore } from '@/stores/temaStore';

export const useTheme = () => {
  const { tema, carregarTema, aplicarTema } = useTemaStore();
  
  const colors = {
    primary: tema?.primary || '#3B82F6',
    secondary: tema?.secondary || '#10B981',
    // ... outras cores
  };
  
  return {
    tema,
    colors,
    carregarTema,
    aplicarTema,
  };
};
```

### `useDebounce.ts` - Debounce

```typescript
import { useEffect, useState } from 'react';

export const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
};
```

**Uso:**
```tsx
function SearchInput() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  useEffect(() => {
    // Busca apenas depois de 500ms sem digitar
    fetchResults(debouncedSearch);
  }, [debouncedSearch]);
  
  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
}
```

### `useLocalStorage.ts` - Local Storage

```typescript
import { useState, useEffect } from 'react';

export const useLocalStorage = <T,>(
  key: string, 
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue];
};
```

### `useMediaQuery.ts` - Media Queries

```typescript
import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  
  return matches;
};
```

**Uso:**
```tsx
function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

## 📏 Convenções

### Nomenclatura
- Sempre comece com `use`: `useMyHook`
- camelCase
- Nome descritivo da funcionalidade

### Estrutura

```typescript
import { useState, useEffect } from 'react';

interface UseMyHookOptions {
  option1?: string;
  option2?: number;
}

interface UseMyHookReturn {
  data: any;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useMyHook = (
  param: string,
  options?: UseMyHookOptions
): UseMyHookReturn => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const refetch = () => {
    // ...
  };
  
  useEffect(() => {
    // ...
  }, [param]);
  
  return { data, loading, error, refetch };
};
```

### Boas Práticas

1. **TypeScript** - Sempre tipagem forte
2. **Documentação** - JSDoc para hooks complexos
3. **Deps Array** - Cuidado com dependências
4. **Cleanup** - Sempre limpe efeitos
5. **Testes** - Teste hooks isoladamente

## 🧪 Testes

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('returns data correctly', () => {
    const { result } = renderHook(() => useMyHook('test'));
    
    expect(result.current.data).toBeDefined();
  });
  
  it('handles loading state', async () => {
    const { result } = renderHook(() => useMyHook('test'));
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
```

## 📚 Recursos

- [React Hooks Docs](https://react.dev/reference/react)
- [usehooks.com](https://usehooks.com/)
- [React Hooks Testing Library](https://react-hooks-testing-library.com/)

