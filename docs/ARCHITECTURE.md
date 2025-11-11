# 🏗️ Arquitetura e Funcionalidades - VisionPlan v2.2

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  React 18 + TypeScript + Tailwind CSS          │   │
│  │  - Zustand (Estado Global)                      │   │
│  │  - React Router (Navegação)                     │   │
│  │  - Recharts (Gráficos)                          │   │
│  │  - Three.js (BIM 3D)                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PostgreSQL 15+ (Banco de Dados)               │   │
│  │  - 25+ Tabelas Relacionais                      │   │
│  │  - Row Level Security (RLS)                     │   │
│  │  - Triggers para Real-time                      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Supabase Auth (JWT)                           │   │
│  │  - Multi-tenant                                 │   │
│  │  - Camadas de Governança                        │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Real-time WebSockets                          │   │
│  │  - Dashboard KPIs                               │   │
│  │  - Kanban Sync                                  │   │
│  │  - Notificações                                 │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Storage (S3-Compatible)                       │   │
│  │  - Modelos BIM (IFC, FBX)                      │   │
│  │  - Documentos de Campo                          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Funcionalidades Implementadas

### ✅ 1. Sistema de Autenticação e Multi-Tenant (RF001, RF002)

**Camadas de Governança:**
- PROPONENTE (Governança estratégica)
- FISCALIZACAO (Qualidade e liberação)
- CONTRATADA (Execução)

**Perfis de Acesso:**
- 10 perfis diferentes
- Permissões granulares por camada

**Implementação:**
```typescript
// src/store/appStore.ts
interface AppState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
}
```

### ✅ 2. Dashboard com KPIs de Alto Nível (RF004)

**KPIs Principais:**
- % PAC Médio
- Tempo Médio de Resolução de Restrições
- SPI (Schedule Performance Index)
- CPI (Cost Performance Index)
- Restrições Impeditivas Ativas
- Atividades em Atraso

**Componente:**
```typescript
// src/pages/DashboardPage.tsx
<KPICard
  titulo="% PAC Médio"
  valor="78.5%"
  mudanca={5.2}
  cor={tema.corPrimaria}
/>
```

### ✅ 3. Modo Apresentação (RF035)

**Funcionalidade:**
- Tela cheia
- Remove sidebar e headers
- Otimizado para projeção em reuniões

**Implementação:**
```typescript
const toggleModoApresentacao = useAppStore(
  (state) => state.toggleModoApresentacao
);
```

### ✅ 4. Kanban de Tarefas (RF010-RF012)

**Colunas:**
- A Fazer
- Fazendo
- Concluído

**Tipos de Tarefas:**
- Atividades do Cronograma
- Ações de Tratativa de Restrições
- Tarefas Manuais

**Drag & Drop:**
- react-beautiful-dnd
- Check-in/Check-out automático
- Real-time sync entre usuários

**Componente:**
```typescript
// src/pages/KanbanPage.tsx
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId={coluna.id}>
    {/* Tarefas */}
  </Droppable>
</DragDropContext>
```

### ✅ 5. Sistema de Temas Customizáveis

**Funcionalidade Única:**
- Cada empresa/cliente pode ter seu próprio tema
- 5 temas pré-definidos
- Customização total de cores
- Apenas ADMIN pode alterar

**Implementação:**
```typescript
interface TemaEmpresa {
  corPrimaria: string;      // Ex: #0ea5e9
  corSecundaria: string;    // Ex: #0284c7
  logoUrl?: string;
}
```

**Aplicação Automática:**
- Botões
- Headers
- Ícones
- Gráficos
- Sidebar

**Página de Configuração:**
```typescript
// src/pages/ConfiguracoesPage.tsx
const setTema = useAppStore((state) => state.setTema);

setTema({
  corPrimaria: '#10b981',
  corSecundaria: '#059669',
});
```

### ✅ 6. Layout Responsivo com Sidebar

**Características:**
- Sidebar colapsável
- Navegação com React Router
- Ícones Lucide React
- Perfil do usuário visível
- Logout seguro

**Implementação:**
```typescript
// src/components/layout/Layout.tsx
const sidebarAberta = useAppStore((state) => state.sidebarAberta);
const toggleSidebar = useAppStore((state) => state.toggleSidebar);
```

## 🔄 Real-time com Supabase

### WebSocket Subscriptions

```typescript
// Exemplo: Real-time no Kanban
const subscription = supabase
  .channel('tarefas-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tarefas_usuarios',
      filter: `usuarioId=eq.${usuario?.id}`,
    },
    () => {
      carregarTarefas(); // Recarrega dados
    }
  )
  .subscribe();
```

### Triggers no PostgreSQL

```sql
-- Exemplo: Trigger para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_atividades_updated_at
  BEFORE UPDATE ON atividades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 🎨 Sistema de Design

### Cores Padrão (CSS Variables)

```css
:root {
  --color-primary-500: 14 165 233;
  --color-primary-600: 2 132 199;
  --color-success: 16 185 129;
  --color-warning: 245 158 11;
  --color-danger: 239 68 68;
}
```

### Componentes Reutilizáveis

```css
/* Botões */
.btn-primary {
  @apply px-4 py-2 rounded-lg bg-blue-600 text-white;
}

/* Cards */
.card {
  @apply bg-white rounded-lg shadow-md border border-gray-200;
}

/* KPIs */
.kpi-card {
  @apply card p-6 hover:shadow-lg transition-shadow;
}
```

## 📊 Estrutura de Dados

### Hierarquia WBS

```
Projeto 1.0
├── Fundação 1.1
│   ├── Escavação 1.1.1
│   │   ├── Mobilização 1.1.1.1
│   │   ├── Execução 1.1.1.2
│   │   └── Transporte 1.1.1.3
│   └── Contenção 1.1.2
├── Estrutura 1.2
│   ├── Lajes 1.2.1
│   ├── Pilares 1.2.2
│   └── Vigas 1.2.3
└── Acabamento 1.3
    ├── Revestimento 1.3.1
    └── Pintura 1.3.2
```

### Relacionamentos Principais

```
Empresa → Projetos → Atividades → Restrições → Ações de Tratativa
   │         │           │
   └──→ Usuários    └──→ Tarefas
```

## 🔐 Segurança

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS:

```sql
-- Exemplo: Usuários só veem dados da sua empresa
CREATE POLICY "usuarios_empresa_policy"
ON usuarios FOR ALL
USING (empresaId = (
  SELECT empresaId FROM usuarios 
  WHERE id = auth.uid()
));
```

### Permissões por Camada

```typescript
// Exemplo: Verificação de permissão
const podeEditarTema = usuario?.perfilAcesso === 'ADMIN';

const podeCriarRestricaoImpeditiva = [
  'PROPONENTE',
  'FISCALIZACAO',
  'CONTRATADA'
].includes(usuario?.camadaGovernanca);
```

## 📈 Performance

### Otimizações Implementadas

1. **Code Splitting**: React Router lazy loading
2. **Memoization**: React.memo e useMemo
3. **Virtual Scrolling**: Para listas grandes
4. **Image Optimization**: Lazy loading de imagens
5. **Bundle Size**: < 500KB gzipped

### Métricas Alvo

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: > 90

## 🧪 Testes

### Estrutura de Testes

```
/tests
  /unit          # Testes unitários
  /integration   # Testes de integração
  /e2e           # Testes end-to-end
```

### Exemplo de Teste

```typescript
describe('KanbanPage', () => {
  it('deve mover tarefa entre colunas', async () => {
    const { getByText, getByTestId } = render(<KanbanPage />);
    
    const tarefa = getByText('Minha Tarefa');
    const colunaFazendo = getByTestId('coluna-fazendo');
    
    // Drag & drop
    await dragAndDrop(tarefa, colunaFazendo);
    
    expect(tarefa).toBeInTheDocument();
    expect(tarefa.closest('[data-testid="coluna-fazendo"]')).toBeTruthy();
  });
});
```

## 🚀 Próximos Passos (Roadmap)

### v2.3 (Q1 2025)
- [ ] Cronograma Gantt Interativo (RF006)
- [ ] Gestão de Restrições Completa (RF014)
- [ ] Look Ahead Planning (RF013)

### v2.4 (Q2 2025)
- [ ] Visualização BIM 4D (RF019-RF022)
- [ ] Pull Planning / PST (RF015)
- [ ] Relatórios PAC (RF026)

### v2.5 (Q3 2025)
- [ ] Gestão de Riscos (RF023)
- [ ] Mudanças de Escopo (RF024)
- [ ] Lições Aprendidas (RF025)

### v3.0 (Q4 2025)
- [ ] Mobile App (React Native)
- [ ] Integrações com ERPs
- [ ] IA para Otimização de Cronograma

## 📚 Documentação Adicional

- `README.md` - Visão geral do projeto
- `INSTALL.md` - Guia de instalação
- `API.md` - Documentação da API
- `/docs` - Documentação completa

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

**VisionPlan v2.2** - Construindo o futuro da gestão de obras
