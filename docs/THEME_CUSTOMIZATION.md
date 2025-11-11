# Guia de Customização de Temas - VisionPlan

## 📖 Visão Geral

O VisionPlan possui um sistema avançado de customização de temas que permite aos **usuários ADMIN** personalizar completamente as cores e a identidade visual da aplicação para cada empresa/cliente.

## 🎨 Como Funciona

### Arquitetura do Sistema de Temas

1. **Variáveis CSS Dinâmicas**: A aplicação usa CSS Custom Properties (variáveis CSS) que são aplicadas no `:root`
2. **Zustand Store**: O estado do tema é gerenciado globalmente e persiste entre sessões
3. **Aplicação em Tempo Real**: As mudanças são aplicadas instantaneamente via JavaScript
4. **Persistência**: Temas são salvos no Supabase e carregados automaticamente

### Estrutura de um Tema

```typescript
interface ThemeColors {
  primary: {
    50: string;   // Tons mais claros
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;  // Cor principal
    600: string;
    700: string;
    800: string;
    900: string;  // Tons mais escuros
  };
  secondary: { /* mesma estrutura */ };
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  background: {
    main: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
}
```

## 🛠️ Como Customizar

### Passo 1: Acessar o Customizador

1. Faça login como **ADMIN**
2. Clique no seu avatar no canto superior direito
3. Selecione **"Customizar Tema"**

### Passo 2: Personalizar Cores

#### Cores Primárias
- **Principal (500)**: Cor principal da marca - usada em botões, links, ícones
- **Clara (300)**: Versão mais clara - usada em backgrounds hover
- **Escura (700)**: Versão mais escura - usada em estados ativos

**Exemplo: Construtora ABC** (Azul Royal)
```
Principal: #0066CC
Clara:     #4D94FF
Escura:    #004080
```

#### Cores de Status
- **Sucesso**: Verde - para indicadores positivos, atividades concluídas
- **Aviso**: Amarelo/Laranja - para alertas, atividades em atenção
- **Perigo**: Vermelho - para erros, restrições impeditivas
- **Informação**: Azul - para mensagens informativas

**Exemplo: Construtora ABC**
```
Sucesso:    #00CC66
Aviso:      #FF9900
Perigo:     #CC0033
Informação: #0099FF
```

#### Backgrounds e Texto
- **Fundo Principal**: Cor de fundo da aplicação (geralmente branco)
- **Fundo Secundário**: Cor de fundo de cards e seções
- **Texto Principal**: Cor do texto principal (geralmente preto/cinza escuro)
- **Texto Secundário**: Cor de textos menos importantes

### Passo 3: Upload de Logo

1. Clique em **"Upload Logo"**
2. Selecione a imagem (PNG ou SVG recomendado)
3. Tamanho ideal: 200x60px
4. Fundo transparente recomendado

### Passo 4: Preview e Salvar

1. Clique em **"Preview"** para visualizar as mudanças
2. Navegue pela aplicação para ver como ficou
3. Se gostar, clique em **"Salvar Tema"**
4. Se não gostar, clique em **"Cancelar Preview"** e ajuste

### Passo 5: Restaurar Padrão (Opcional)

Se quiser voltar ao tema padrão:
1. Clique em **"Restaurar Padrão"**
2. Confirme a ação

## 🎯 Exemplos de Temas

### Exemplo 1: Construtora Tecnológica (Azul Moderno)

```javascript
{
  primary: {
    500: '#0ea5e9',  // Sky Blue
    300: '#7dd3fc',
    700: '#0369a1'
  },
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  background: {
    main: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9'
  }
}
```

### Exemplo 2: Construtora Tradicional (Verde Corporativo)

```javascript
{
  primary: {
    500: '#059669',  // Emerald
    300: '#6ee7b7',
    700: '#047857'
  },
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#dc2626',
  info: '#3b82f6'
}
```

### Exemplo 3: Construtora Premium (Dourado/Preto)

```javascript
{
  primary: {
    500: '#d97706',  // Amber
    300: '#fbbf24',
    700: '#92400e'
  },
  success: '#059669',
  warning: '#f59e0b',
  danger: '#dc2626',
  background: {
    main: '#fafaf9',
    secondary: '#f5f5f4',
    tertiary: '#e7e5e4'
  }
}
```

## 💻 Uso Programático

### Acessar o Tema Atual

```typescript
import { useThemeStore } from '@/store';

function MeuComponente() {
  const { currentTheme, customTheme } = useThemeStore();
  
  return (
    <div style={{ backgroundColor: currentTheme.primary[500] }}>
      Usando cor primária do tema
    </div>
  );
}
```

### Aplicar Cor Dinâmica via CSS

```css
.meu-elemento {
  background-color: var(--color-primary-500);
  color: var(--color-text-primary);
  border: 1px solid var(--color-secondary-300);
}
```

### Criar Componente com Tema

```typescript
function CardCustomizado() {
  return (
    <div 
      className="p-4 rounded-lg"
      style={{
        backgroundColor: 'var(--color-bg-main)',
        borderLeft: '4px solid var(--color-primary-500)'
      }}
    >
      <h3 style={{ color: 'var(--color-primary-700)' }}>
        Título do Card
      </h3>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Conteúdo do card
      </p>
    </div>
  );
}
```

## 🔧 Configuração Avançada

### Criar Tema Programaticamente

```typescript
import { useThemeStore } from '@/store';

const criarTemaCustomizado = () => {
  const { setCustomTheme } = useThemeStore.getState();
  
  const novoTema = {
    id: 'tema-construtora-xyz',
    empresaId: 'empresa-id',
    nome: 'Construtora XYZ',
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      // ... resto das cores
    },
    logo: 'url-da-logo',
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  setCustomTheme(novoTema);
};
```

### Salvar Tema no Supabase

```typescript
import supabase from '@/lib/supabase';

const salvarTema = async (tema: CustomTheme) => {
  const { data, error } = await supabase
    .from('temas_customizados')
    .upsert({
      empresa_id: tema.empresaId,
      nome: tema.nome,
      colors: tema.colors,
      logo: tema.logo,
      ativo: true,
    });
  
  if (error) {
    console.error('Erro ao salvar tema:', error);
    return;
  }
  
  console.log('Tema salvo com sucesso!', data);
};
```

### Carregar Tema da Empresa

```typescript
const carregarTemaEmpresa = async (empresaId: string) => {
  const { data, error } = await supabase
    .from('temas_customizados')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .single();
  
  if (data) {
    const { setCustomTheme } = useThemeStore.getState();
    setCustomTheme(data);
  }
};
```

## 📱 Dark Mode

O sistema também suporta Dark Mode:

```typescript
const { isDarkMode, toggleDarkMode } = useThemeStore();

// Alternar dark mode
toggleDarkMode();
```

As cores são automaticamente ajustadas no dark mode para garantir legibilidade.

## ✅ Boas Práticas

### Contraste
- Sempre teste o contraste entre texto e fundo
- Use ferramentas como [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Mínimo recomendado: 4.5:1 para texto normal

### Consistência
- Use a paleta de cores de forma consistente
- Cores primárias para ações principais
- Cores secundárias para ações secundárias
- Cores de status apenas para seus respectivos propósitos

### Acessibilidade
- Não dependa apenas de cores para transmitir informação
- Use ícones e textos descritivos
- Teste com daltonismo simulado

### Performance
- Evite mudar temas frequentemente durante a sessão
- As mudanças são aplicadas via CSS, então são performáticas
- Logos devem ser otimizadas (max 5MB, idealmente < 100KB)

## 🐛 Troubleshooting

### Tema não aplica
1. Verifique se o usuário é ADMIN
2. Confirme que o tema foi salvo
3. Recarregue a página (F5)
4. Limpe o cache do navegador

### Cores não aparecem
1. Verifique se as variáveis CSS estão corretas
2. Inspecione o elemento no DevTools
3. Confirme que `applyTheme()` foi chamado

### Logo não carrega
1. Verifique o formato (PNG, JPG, SVG)
2. Confirme o tamanho do arquivo
3. Verifique permissões do bucket no Supabase

## 📚 Recursos Adicionais

- [Paletas de Cores](https://coolors.co/)
- [Gerador de Temas Tailwind](https://tailwindcss.com/docs/customizing-colors)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Hunt](https://colorhunt.co/)

---

**Lembre-se**: Um bom tema não apenas tem cores bonitas, mas também comunica a identidade da marca e garante uma excelente experiência para todos os usuários! 🎨✨
