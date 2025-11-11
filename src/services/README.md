# 🔌 Services

Camada de serviços para comunicação com APIs e serviços externos.

## 📋 O que são Services?

Services encapsulam toda lógica de comunicação externa:
- APIs REST
- WebSockets
- Supabase
- Firebase
- Etc.

## 🎯 Benefícios

- ✅ **Separação de Responsabilidades** - Lógica de API isolada
- ✅ **Reutilização** - Use em múltiplos lugares
- ✅ **Testabilidade** - Fácil de mockar
- ✅ **Manutenção** - Mudanças centralizadas
- ✅ **Type Safety** - TypeScript garantido

## 📂 Services Disponíveis

### `supabase.ts` - Cliente Supabase

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## 📝 Exemplos de Services

### `api.ts` - API REST

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirecionar para login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### `userService.ts` - Serviço de Usuários

```typescript
import { supabase } from './supabase';
import { User, UserUpdate } from '@/types';

export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    return data;
  },
  
  async getById(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async create(user: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async update(id: string, updates: UserUpdate): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};
```

**Uso:**
```tsx
import { userService } from '@/services/userService';

async function loadUsers() {
  try {
    const users = await userService.getAll();
    console.log(users);
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
  }
}
```

### `authService.ts` - Autenticação

```typescript
import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },
  
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
  
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  },
};
```

### `realtimeService.ts` - Real-time

```typescript
import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const realtimeService = {
  subscribe(
    table: string,
    callback: (payload: any) => void
  ): RealtimeChannel {
    return supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe();
  },
  
  unsubscribe(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
  },
};
```

**Uso:**
```tsx
import { useEffect } from 'react';
import { realtimeService } from '@/services/realtimeService';

function RealtimeComponent() {
  useEffect(() => {
    const channel = realtimeService.subscribe('tasks', (payload) => {
      console.log('Mudança detectada:', payload);
    });
    
    return () => {
      realtimeService.unsubscribe(channel);
    };
  }, []);
  
  return <div>Monitorando mudanças...</div>;
}
```

## 📏 Convenções

### Nomenclatura
- camelCase com sufixo `Service`: `userService`
- Métodos descritivos: `getAll`, `getById`, `create`, etc.

### Estrutura

```typescript
import { supabase } from './supabase';
import { MyType } from '@/types';

export const myService = {
  // GET
  async getAll(): Promise<MyType[]> {
    // ...
  },
  
  async getById(id: string): Promise<MyType> {
    // ...
  },
  
  // POST
  async create(data: Partial<MyType>): Promise<MyType> {
    // ...
  },
  
  // PUT/PATCH
  async update(id: string, data: Partial<MyType>): Promise<MyType> {
    // ...
  },
  
  // DELETE
  async delete(id: string): Promise<void> {
    // ...
  },
};
```

### Tratamento de Erros

```typescript
export const myService = {
  async getData() {
    try {
      const { data, error } = await supabase
        .from('table')
        .select('*');
      
      if (error) {
        console.error('Erro ao buscar dados:', error);
        throw new Error('Falha ao buscar dados');
      }
      
      return data;
    } catch (error) {
      // Log ou reportar erro
      throw error;
    }
  },
};
```

## 🧪 Testes

```typescript
import { vi } from 'vitest';
import { userService } from './userService';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        data: [{ id: '1', name: 'Test' }],
        error: null,
      })),
    })),
  },
}));

describe('userService', () => {
  it('gets all users', async () => {
    const users = await userService.getAll();
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Test');
  });
});
```

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [Axios Docs](https://axios-http.com/)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

