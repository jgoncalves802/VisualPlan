# 📖 VisionPlan - Documentação Técnica (Parte 2)

## Continuação: Seções 11-17

---

## 11. Fluxos de Trabalho

### 11.1 Fluxo de Autenticação

```
1. Usuário acessa /login
      ↓
2. Preenche email e senha
      ↓
3. Submit do formulário
      ↓
4. Chamada: supabase.auth.signInWithPassword()
      ↓
5. Supabase valida credenciais
      ↓
6. Retorna session + access_token
      ↓
7. Busca dados completos do usuário (tabela usuarios)
      ↓
8. Salva no authStore (usuario + token)
      ↓
9. Persiste no localStorage
      ↓
10. Redirect para /dashboard
      ↓
11. Layout renderiza com menu contextual
```

**Código**:
```typescript
const handleLogin = async (email: string, senha: string) => {
  try {
    setLoading(true);
    
    // 1. Autenticar com Supabase
    const { data: authData, error: authError } = await supabase.auth
      .signInWithPassword({ email, password: senha });
    
    if (authError) throw authError;
    
    // 2. Buscar dados completos do usuário
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError) throw userError;
    
    // 3. Salvar no store
    login(usuario, authData.session.access_token);
    
    // 4. Redirecionar
    navigate('/dashboard');
    
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    alert('Credenciais inválidas');
  } finally {
    setLoading(false);
  }
};
```

### 11.2 Fluxo de Gestão de Restrições (RF014)

**Ciclo Completo**:

```
1. IDENTIFICAÇÃO
   └─> Stakeholder identifica restrição
        ├─ Tipo: Material/Mão de Obra/etc.
        ├─ Origem: Proponente/Fiscalização/Contratada
        └─ Impeditiva: Sim/Não

2. CRIAÇÃO
   └─> Sistema cria registro na tabela 'restricoes'
        ├─ Status: ABERTA
        ├─ dataIdentificacao: now()
        └─ Se impeditiva = true:
             ├─ bloqueaCronograma = true
             ├─ dataInicioBloqueio = now()
             └─ Bloqueia atividade + dependências

3. AÇÃO AUTOMÁTICA
   └─> Sistema gera AcaoTratativa
        ├─ Atribui para: Contratada
        ├─ Status: PENDENTE
        └─ Notifica responsável

4. TRATAMENTO
   └─> Contratada executa ação
        ├─ Muda status: EM_ANDAMENTO
        ├─ Registra dataInicio
        └─ Executa tratativa

5. CONCLUSÃO
   └─> Contratada conclui ação
        ├─ Muda status: CONCLUIDA
        ├─ Registra dataConclusao
        └─ Calcula tempoTratativa

6. LIBERAÇÃO (Se impeditiva)
   └─> Fiscalização aprova liberação
        ├─ Registra dataFimBloqueio
        ├─ Calcula tempoParalisacao
        ├─ bloqueaCronograma = false
        └─ Remove bloqueio das atividades

7. RESOLUÇÃO
   └─> Sistema marca como RESOLVIDA
        └─ dataResolucao = now()
```

**Código**:
```typescript
// 1. Criar Restrição
const criarRestricao = async (data: CriarRestricaoDTO) => {
  const { data: restricao, error } = await supabase
    .from('restricoes')
    .insert({
      descricao: data.descricao,
      atividadeId: data.atividadeId,
      tipo: data.tipo,
      origem: data.origem,
      impeditiva: data.impeditiva,
      bloqueaCronograma: data.impeditiva,
      dataIdentificacao: new Date().toISOString(),
      dataInicioBloqueio: data.impeditiva ? new Date().toISOString() : null,
      criadoPorId: currentUser.id,
      status: data.impeditiva ? 'IMPEDITIVA' : 'ABERTA'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // 2. Criar Ação de Tratativa
  if (restricao.impeditiva) {
    await supabase
      .from('acoes_tratativa')
      .insert({
        restricaoId: restricao.id,
        descricao: `Resolver restrição: ${restricao.descricao}`,
        atribuidoParaId: getContratadaId(),
        status: 'PENDENTE'
      });
    
    // 3. Bloquear Cronograma
    await bloquearAtividade(data.atividadeId);
  }
  
  return restricao;
};

// Liberar Restrição (Fiscalização)
const liberarRestricao = async (restricaoId: string) => {
  const now = new Date().toISOString();
  
  // 1. Buscar restrição
  const { data: restricao } = await supabase
    .from('restricoes')
    .select('*')
    .eq('id', restricaoId)
    .single();
  
  // 2. Calcular tempo de paralisação
  const tempoParalisacao = restricao.dataInicioBloqueio 
    ? Math.floor(
        (new Date(now).getTime() - new Date(restricao.dataInicioBloqueio).getTime()) 
        / (1000 * 60 * 60)
      )
    : null;
  
  // 3. Atualizar restrição
  await supabase
    .from('restricoes')
    .update({
      status: 'RESOLVIDA',
      dataFimBloqueio: now,
      dataResolucao: now,
      tempoParalisacao,
      bloqueaCronograma: false
    })
    .eq('id', restricaoId);
  
  // 4. Desbloquear atividades
  await desbloquearAtividade(restricao.atividadeId);
};
```

### 11.3 Fluxo de Kanban (Check-in/Check-out)

```
1. Visualização
   └─> Usuário vê suas tarefas em 3 colunas
        ├─ A Fazer (status: A_FAZER)
        ├─ Fazendo (status: FAZENDO)
        └─ Concluído (status: CONCLUIDO)

2. Check-In
   └─> Colaborador clica "Check-In"
        ├─ Muda status: A_FAZER → FAZENDO
        ├─ Registra dataCheckIn = now()
        └─ Move card para coluna "Fazendo"

3. Execução
   └─> Colaborador trabalha na tarefa

4. Check-Out
   └─> Colaborador clica "Check-Out"
        ├─ Muda status: FAZENDO → CONCLUIDO
        ├─ Registra dataCheckOut = now()
        ├─ Calcula tempo de execução
        └─> Move card para coluna "Concluído"

5. Atualização Real-time
   └─> Outros usuários veem mudança instantaneamente
        (via WebSocket subscription)
```

**Código**:
```typescript
const handleCheckIn = async (tarefaId: string) => {
  const { error } = await supabase
    .from('tarefas_usuarios')
    .update({
      status: 'FAZENDO',
      dataCheckIn: new Date().toISOString()
    })
    .eq('id', tarefaId);
  
  if (error) {
    console.error('Erro ao fazer check-in:', error);
    return;
  }
  
  // Atualizar estado local
  setTarefas(tarefas.map(t => 
    t.id === tarefaId 
      ? { ...t, status: StatusTarefa.FAZENDO, dataCheckIn: new Date() }
      : t
  ));
};

const handleCheckOut = async (tarefaId: string) => {
  const { error } = await supabase
    .from('tarefas_usuarios')
    .update({
      status: 'CONCLUIDO',
      dataCheckOut: new Date().toISOString()
    })
    .eq('id', tarefaId);
  
  if (error) {
    console.error('Erro ao fazer check-out:', error);
    return;
  }
  
  // Atualizar estado local
  setTarefas(tarefas.map(t => 
    t.id === tarefaId 
      ? { ...t, status: StatusTarefa.CONCLUIDO, dataCheckOut: new Date() }
      : t
  ));
};
```

### 11.4 Fluxo LPS (Last Planner System)

```
┌─────────────────────────────────────────────────────────┐
│         CICLO SEMANAL LPS (7 dias)                      │
└─────────────────────────────────────────────────────────┘

Segunda-feira (Planejamento):
├─ 1. Look Ahead Planning (4-6 semanas)
│   ├─ Identificar atividades futuras
│   ├─ Detectar restrições
│   └─ Iniciar tratativas
│
├─ 2. Resolver Restrições
│   ├─ Verificar status de ações
│   ├─ Priorizar impeditivas
│   └─ Garantir prontidão
│
└─ 3. Pull Planning (PST)
    ├─ Selecionar atividades "prontas"
    ├─ Comprometimento da equipe
    └─ Definir metas semanais

Terça a Sexta (Execução):
├─ Check-ins diários
├─ Execução das atividades
├─ Check-outs ao concluir
└─ Monitoramento contínuo

Sexta-feira (Medição):
├─ 4. Calcular % PAC
│   └─ PAC = (Concluídas / Planejadas) × 100
│
├─ 5. Análise de Causas (5 Porquês)
│   └─ Para atividades não concluídas
│
└─ 6. Lições Aprendidas
    └─ Documentar aprendizados

Sábado/Domingo:
└─ Sistema prepara próximo ciclo
```

---

## 12. Segurança e Permissões

### 12.1 Matriz de Permissões

#### Por Camada de Governança

| Funcionalidade | Proponente | Fiscalização | Contratada |
|----------------|-----------|--------------|------------|
| Visualizar Dashboard Completo | ✅ | ✅ | ✅ |
| Criar Restrição Impeditiva | ✅ | ✅ | ✅ |
| Aprovar Mudança de Escopo | ✅ | ❌ | ❌ |
| Aceitar/Reprovar Qualidade | ❌ | ✅ | ❌ |
| Liberar Cronograma Bloqueado | ❌ | ✅ | ❌ |
| Executar Ações de Tratativa | ❌ | ❌ | ✅ |
| Atualizar Status Atividades | ❌ | ❌ | ✅ |
| Check-in/Check-out | ❌ | ❌ | ✅ |
| Planejar PST | ❌ | ❌ | ✅ |
| Customizar Tema | ✅ ADMIN | ❌ | ❌ |

#### Por Perfil de Acesso

```typescript
const PERMISSIONS = {
  ADMIN: [
    'view:all',
    'edit:all',
    'delete:all',
    'manage:users',
    'manage:themes',
    'manage:companies'
  ],
  
  DIRETOR: [
    'view:dashboard',
    'view:reports',
    'approve:scope-changes',
    'view:kpis'
  ],
  
  ENGENHEIRO_PLANEJAMENTO: [
    'view:dashboard',
    'edit:schedule',
    'create:activities',
    'manage:restrictions',
    'view:lps',
    'import:p6-msproject'
  ],
  
  COLABORADOR: [
    'view:kanban',
    'update:own-tasks',
    'checkin:activities',
    'checkout:activities'
  ],
  
  FISCALIZACAO_LEAD: [
    'view:all',
    'approve:quality',
    'reject:quality',
    'release:schedule',
    'create:imperative-restriction'
  ]
};
```

### 12.2 Row Level Security (RLS)

**Exemplo de Políticas RLS no Supabase**:

```sql
-- Política: Usuários só veem dados da própria empresa
CREATE POLICY "usuarios_mesma_empresa"
  ON usuarios
  FOR SELECT
  USING (empresaId = (SELECT empresaId FROM usuarios WHERE id = auth.uid()));

-- Política: Apenas Fiscalização pode aprovar qualidade
CREATE POLICY "fiscalizacao_aprovar_qualidade"
  ON aceites_qualidade
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND camadaGovernanca = 'FISCALIZACAO'
    )
  );

-- Política: Usuário só vê próprias tarefas no Kanban
CREATE POLICY "tarefas_proprio_usuario"
  ON tarefas_usuarios
  FOR SELECT
  USING (usuarioId = auth.uid());
```

### 12.3 Proteção de Rotas

```typescript
// Componente ProtectedRoute
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredPermissions?: string[];
}> = ({ children, requiredPermissions = [] }) => {
  const { isAuthenticated, usuario } = useAuthStore();
  
  // Verificar autenticação
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Verificar permissões
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.every(permission =>
      usuario?.permissions?.includes(permission)
    );
    
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  return <>{children}</>;
};

// Uso
<Route path="/admin" element={
  <ProtectedRoute requiredPermissions={['manage:themes']}>
    <Layout><AdminTemasPage /></Layout>
  </ProtectedRoute>
} />
```

### 12.4 Validação de Dados

```typescript
// Validação de entrada
const validarCriarAtividade = (data: any): ValidationResult => {
  const errors: string[] = [];
  
  if (!data.codigo || data.codigo.trim() === '') {
    errors.push('Código da atividade é obrigatório');
  }
  
  if (!data.nome || data.nome.trim() === '') {
    errors.push('Nome da atividade é obrigatório');
  }
  
  if (data.dataInicioPlanejada && data.dataFimPlanejada) {
    if (new Date(data.dataInicioPlanejada) > new Date(data.dataFimPlanejada)) {
      errors.push('Data de início deve ser anterior à data de fim');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

### 12.5 Sanitização de Dados

```typescript
// Prevenir XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Uso em componentes
<input
  value={nome}
  onChange={(e) => setNome(sanitizeInput(e.target.value))}
/>
```

---

## 13. Performance e Otimizações

### 13.1 Code Splitting

```typescript
// Lazy loading de páginas
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const KanbanPage = lazy(() => import('./pages/KanbanPage'));
const GanttPage = lazy(() => import('./pages/GanttPage'));

// Uso com Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/kanban" element={<KanbanPage />} />
  </Routes>
</Suspense>
```

### 13.2 Memoização

```typescript
// React.memo para componentes
const KPICard = React.memo<KPICardProps>(({ title, value, icon, color }) => {
  return (
    <div className="card">
      {/* ... conteúdo */}
    </div>
  );
});

// useMemo para cálculos pesados
const atividadesAtrasadas = useMemo(() => {
  return atividades.filter(a => 
    new Date(a.dataFimPlanejada) < new Date() &&
    a.status !== 'CONCLUIDA'
  );
}, [atividades]);

// useCallback para funções
const handleUpdateAtividade = useCallback((id: string, updates: Partial<Atividade>) => {
  setAtividades(atividades.map(a => 
    a.id === id ? { ...a, ...updates } : a
  ));
}, [atividades]);
```

### 13.3 Virtualização de Listas

```typescript
// Para listas grandes (>100 itens)
import { FixedSizeList } from 'react-window';

const AtividadesList = ({ atividades }: { atividades: Atividade[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} className="border-b">
      <AtividadeRow atividade={atividades[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={atividades.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### 13.4 Debounce e Throttle

```typescript
// Debounce para busca
import { debounce } from 'lodash';

const handleSearch = debounce((query: string) => {
  buscarAtividades(query);
}, 300);

// Throttle para scroll
import { throttle } from 'lodash';

const handleScroll = throttle(() => {
  if (window.scrollY > 100) {
    setShowScrollTop(true);
  }
}, 100);
```

### 13.5 Imagens Otimizadas

```typescript
// Lazy loading de imagens
<img 
  src={imageUrl} 
  loading="lazy"
  alt="Descrição"
/>

// Placeholder enquanto carrega
const [imageLoaded, setImageLoaded] = useState(false);

<div className="relative">
  {!imageLoaded && <Skeleton />}
  <img
    src={imageUrl}
    onLoad={() => setImageLoaded(true)}
    className={imageLoaded ? 'opacity-100' : 'opacity-0'}
  />
</div>
```

### 13.6 Bundle Size

**Análise**:
```bash
npm run build
npm run analyze  # Requer vite-plugin-visualizer
```

**Otimizações**:
- ✅ Tree-shaking automático (Vite)
- ✅ Code splitting por rota
- ✅ Lazy loading de componentes pesados
- ✅ Compressão Gzip/Brotli
- ✅ Minificação de CSS e JS

---

## 14. Testes e Qualidade

### 14.1 Estrutura de Testes

```
src/
├── components/
│   ├── KPICard.tsx
│   └── KPICard.test.tsx        # Teste unitário
├── pages/
│   ├── DashboardPage.tsx
│   └── DashboardPage.test.tsx  # Teste de integração
└── services/
    ├── api.ts
    └── api.test.ts              # Teste de serviço
```

### 14.2 Testes Unitários (Jest + React Testing Library)

```typescript
// KPICard.test.tsx
import { render, screen } from '@testing-library/react';
import { TrendingUp } from 'lucide-react';
import KPICard from './KPICard';

describe('KPICard', () => {
  it('deve renderizar título e valor corretamente', () => {
    render(
      <KPICard
        title="% PAC"
        value="78.5%"
        icon={TrendingUp}
        color="primary"
      />
    );
    
    expect(screen.getByText('% PAC')).toBeInTheDocument();
    expect(screen.getByText('78.5%')).toBeInTheDocument();
  });
  
  it('deve exibir trend quando fornecido', () => {
    render(
      <KPICard
        title="% PAC"
        value="78.5%"
        icon={TrendingUp}
        trend={{ value: 5.2, isPositive: true }}
      />
    );
    
    expect(screen.getByText(/5.2%/)).toBeInTheDocument();
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });
});
```

### 14.3 Testes de Integração

```typescript
// DashboardPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { useAuthStore } from '../stores/authStore';

// Mock do store
jest.mock('../stores/authStore');

describe('DashboardPage', () => {
  beforeEach(() => {
    (useAuthStore as jest.Mock).mockReturnValue({
      usuario: {
        id: '1',
        nome: 'Teste',
        perfilAcesso: 'ENGENHEIRO_PLANEJAMENTO'
      }
    });
  });
  
  it('deve renderizar KPIs corretamente', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('% PAC Médio')).toBeInTheDocument();
      expect(screen.getByText('Tempo Médio Resolução')).toBeInTheDocument();
    });
  });
});
```

### 14.4 Testes E2E (Playwright)

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('deve fazer login com sucesso', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  await page.fill('input[type="email"]', 'teste@email.com');
  await page.fill('input[type="password"]', 'senha123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('text=Dashboard')).toBeVisible();
});
```

### 14.5 Lint e Formatação

**ESLint**:
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

**Prettier**:
```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

## 15. Deploy e Produção

### 15.1 Build de Produção

```bash
# Build otimizado
npm run build

# Resultado em ./dist
dist/
├── index.html
├── assets/
│   ├── index-abc123.js     # JS minificado e hash
│   └── index-def456.css    # CSS minificado e hash
└── favicon.ico
```

### 15.2 Variáveis de Ambiente

**Desenvolvimento** (`.env.local`):
```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-key
VITE_APP_ENV=development
```

**Produção** (`.env.production`):
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-key
VITE_APP_ENV=production
```

### 15.3 Deploy em Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy de produção
vercel --prod
```

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 15.4 Deploy em Netlify

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 15.5 Docker

**Dockerfile**:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  visionplan:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_KEY}
```

---

## 16. Troubleshooting

### 16.1 Problemas Comuns

#### Erro: "Module not found"

**Causa**: Dependência não instalada

**Solução**:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Erro: "Vite HMR disconnected"

**Causa**: Porta em conflito ou firewall

**Solução**:
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3001,  // Mudar porta
    hmr: {
      overlay: false
    }
  }
})
```

#### Erro: "Supabase session expired"

**Causa**: Token expirado

**Solução**:
```typescript
// Implementar refresh automático
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    // Atualizar store
  }
});
```

#### Erro: "CORS policy blocked"

**Causa**: URL não permitida no Supabase

**Solução**:
1. Acessar Supabase Dashboard
2. Settings → API
3. Adicionar URL em "Site URL"

### 16.2 Debug

#### React DevTools

```typescript
// Instalar extensão do Chrome
// Inspecionar componentes e props
```

#### Zustand DevTools

```typescript
import { devtools } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // ... estado
      }),
      { name: 'auth-storage' }
    ),
    { name: 'AuthStore' }  // Nome no DevTools
  )
);
```

#### Network Monitoring

```typescript
// Log de todas as chamadas Supabase
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});

// Interceptar chamadas fetch
const originalFetch = window.fetch;
window.fetch = (...args) => {
  console.log('Fetch:', args[0]);
  return originalFetch(...args);
};
```

---

## 17. Glossário

### Termos Técnicos

- **SPA** (Single Page Application): Aplicação que roda em uma única página HTML
- **SSR** (Server-Side Rendering): Renderização no servidor
- **CSR** (Client-Side Rendering): Renderização no navegador
- **JWT** (JSON Web Token): Token de autenticação
- **RBAC** (Role-Based Access Control): Controle de acesso baseado em papéis
- **RLS** (Row Level Security): Segurança em nível de linha
- **ORM** (Object-Relational Mapping): Mapeamento objeto-relacional
- **BaaS** (Backend as a Service): Backend como serviço
- **CDN** (Content Delivery Network): Rede de entrega de conteúdo
- **CI/CD**: Integração e Deploy Contínuos

### Termos de Construção

- **PAC** (Plan Achievement Completion): % de atividades concluídas
- **LPS** (Last Planner System): Sistema do último planejador
- **PST** (Plano Semanal de Trabalho): Planejamento semanal detalhado
- **WBS** (Work Breakdown Structure): Estrutura Analítica do Projeto
- **EAP**: Estrutura Analítica do Projeto (WBS em português)
- **SPI** (Schedule Performance Index): Índice de desempenho de cronograma
- **CPI** (Cost Performance Index): Índice de desempenho de custo
- **BIM** (Building Information Modeling): Modelagem da Informação da Construção
- **4D**: BIM + Tempo (cronograma)
- **5D**: 4D + Custo
- **IFC** (Industry Foundation Classes): Formato padrão de arquivo BIM

### Siglas da Aplicação

- **RF**: Requisito Funcional
- **RNF**: Requisito Não-Funcional
- **KPI** (Key Performance Indicator): Indicador-chave de desempenho
- **CRUD**: Create, Read, Update, Delete

---

## 📚 Referências

### Documentação Oficial

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)

### Tutoriais Relacionados

- [React Router Tutorial](https://reactrouter.com/en/main/start/tutorial)
- [Supabase Auth with React](https://supabase.com/docs/guides/auth/auth-helpers/react)
- [Recharts Examples](https://recharts.org/en-US/examples)

---

## 📞 Suporte

### Canais de Comunicação

- **Email**: suporte@visionplan.com.br
- **Documentação**: https://docs.visionplan.com.br
- **Issues**: GitHub Issues
- **Slack**: Canal #visionplan-dev

### Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

**VisionPlan v2.2.0** - Documentação Técnica Completa

Última atualização: 11 de Novembro de 2024

---
