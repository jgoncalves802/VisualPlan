# 🧩 Componentes

Esta pasta contém todos os componentes React do projeto, organizados por categoria.

## 📂 Estrutura

```
components/
├── ui/           # Componentes de UI base (reutilizáveis)
├── layout/       # Componentes de estrutura de layout
└── features/     # Componentes específicos de features
```

## 📋 Categorias

### `ui/` - Componentes de UI Base

Componentes genéricos e reutilizáveis que podem ser usados em qualquer parte da aplicação.

**Exemplos:**
- `Button.tsx` - Botões com variantes (primary, secondary, etc)
- `Card.tsx` - Cards para exibição de conteúdo
- `Input.tsx` - Campos de entrada
- `Badge.tsx` - Badges para status/tags
- `Modal.tsx` - Modais/Dialogs
- `KPICard.tsx` - Cards de KPI

**Características:**
- ✅ Totalmente reutilizáveis
- ✅ Sem lógica de negócio
- ✅ Props bem definidas
- ✅ Bem documentados

### `layout/` - Componentes de Layout

Componentes que definem a estrutura visual da aplicação.

**Exemplos:**
- `Header.tsx` - Cabeçalho principal
- `Sidebar.tsx` - Menu lateral
- `Layout.tsx` - Layout base
- `MainLayout.tsx` - Layout principal da aplicação

**Características:**
- ✅ Define estrutura de páginas
- ✅ Controla navegação
- ✅ Gerencia posicionamento

### `features/` - Componentes de Features

Componentes específicos de funcionalidades da aplicação.

**Exemplos:**
- `Dashboard.tsx` - Dashboard de métricas
- `ThemeCustomizer.tsx` - Customizador de temas

**Características:**
- ✅ Específicos de features
- ✅ Podem ter lógica complexa
- ✅ Integram múltiplos componentes UI

## 📏 Convenções

### Nomenclatura
- PascalCase para componentes: `MyComponent.tsx`
- Um componente por arquivo
- Nome do arquivo = nome do componente

### Estrutura de Arquivo

```tsx
import React from 'react';
import { SomeType } from '@/types';

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  onClick 
}) => {
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={onClick}>Click</button>
    </div>
  );
};
```

### Boas Práticas

1. **Props Interface** - Sempre defina interface para props
2. **TypeScript** - Use tipagem forte
3. **Export Named** - Use `export const` ao invés de `export default`
4. **Comentários** - Documente componentes complexos
5. **Pequeno e Focado** - Cada componente deve ter uma responsabilidade

## 🎨 Estilização

- Use Tailwind CSS para estilização
- Classes utilitárias quando possível
- CSS modules para estilos complexos
- Suporte a tema via `temaStore`

## 🧪 Testes

Componentes devem ter testes em `tests/unit/components/`

```tsx
// MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## 📚 Recursos

- [React Docs](https://react.dev)
- [TypeScript React Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS](https://tailwindcss.com)

