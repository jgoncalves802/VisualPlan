# 📄 Páginas

Esta pasta contém todas as páginas/rotas da aplicação.

## 📋 Páginas Disponíveis

| Arquivo | Rota | Descrição | Auth |
|---------|------|-----------|------|
| `LoginPage.tsx` | `/login` | Página de login | Pública |
| `DashboardPage.tsx` | `/dashboard` | Dashboard principal | Protegida |
| `KanbanPage.tsx` | `/kanban` | Kanban pessoal | Protegida |
| `AdminTemasPage.tsx` | `/admin/temas` | Admin de temas | Admin |
| `ConfiguracoesPage.tsx` | `/configuracoes` | Configurações | Protegida |

## 🏗️ Estrutura de Página

```tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';

export const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  useEffect(() => {
    // Lógica de inicialização
  }, []);
  
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold">Minha Página</h1>
        {/* Conteúdo */}
      </div>
    </MainLayout>
  );
};
```

## 📏 Convenções

### Nomenclatura
- PascalCase com sufixo `Page`: `MyPage.tsx`
- Nome descritivo da funcionalidade
- Um componente de página por arquivo

### Responsabilidades

Uma página deve:
- ✅ Usar um layout (`MainLayout`, etc)
- ✅ Orquestrar componentes menores
- ✅ Gerenciar estado da página
- ✅ Fazer fetching de dados
- ✅ Lidar com navegação

Uma página NÃO deve:
- ❌ Conter lógica de negócio complexa (use hooks/stores)
- ❌ Ter componentes muito grandes (extraia para components/)
- ❌ Duplicar código (use componentes reutilizáveis)

### Estrutura Recomendada

```tsx
export const MyPage: React.FC = () => {
  // 1. Hooks
  const navigate = useNavigate();
  const { data } = useMyStore();
  const { loading } = useCustomHook();
  
  // 2. Estado local
  const [filter, setFilter] = useState('');
  
  // 3. Effects
  useEffect(() => {
    // Setup
  }, []);
  
  // 4. Handlers
  const handleClick = () => {
    // ...
  };
  
  // 5. Render
  if (loading) return <Loading />;
  
  return (
    <MainLayout>
      {/* Conteúdo */}
    </MainLayout>
  );
};
```

## 🔐 Rotas Protegidas

Para rotas que requerem autenticação, use o `ProtectedRoute`:

```tsx
// routes.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MyPage } from '@/pages/MyPage';

<Route 
  path="/my-page" 
  element={
    <ProtectedRoute>
      <MyPage />
    </ProtectedRoute>
  } 
/>
```

## 📱 Responsividade

Todas as páginas devem ser responsivas:

```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Conteúdo responsivo */}
  </div>
</div>
```

## 🎨 Layouts

Use layouts apropriados:

- `MainLayout` - Layout padrão com header e sidebar
- `AuthLayout` - Layout para páginas de autenticação
- `EmptyLayout` - Sem header/sidebar

## 📊 SEO e Meta Tags

```tsx
import { Helmet } from 'react-helmet-async';

export const MyPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Minha Página | VisionPlan</title>
        <meta name="description" content="Descrição da página" />
      </Helmet>
      
      <MainLayout>
        {/* Conteúdo */}
      </MainLayout>
    </>
  );
};
```

## 🧪 Testes

```tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MyPage } from './MyPage';

describe('MyPage', () => {
  it('renders correctly', () => {
    render(
      <BrowserRouter>
        <MyPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Minha Página')).toBeInTheDocument();
  });
});
```

## 📚 Recursos

- [React Router](https://reactrouter.com/)
- [React Helmet](https://github.com/nfl/react-helmet)

