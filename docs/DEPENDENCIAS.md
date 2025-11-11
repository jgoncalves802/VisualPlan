# 📦 Dependências do Projeto

## 🎯 Dependências Principais

### Frontend Core
```json
"react": "^18.2.0"                    # React framework
"react-dom": "^18.2.0"                # React DOM
"react-router-dom": "^6.20.0"         # Roteamento
```

### State Management & Data
```json
"zustand": "^4.4.7"                   # State management (leve e simples)
"@supabase/supabase-js": "^2.39.0"    # Cliente Supabase
```

### UI & Visualização
```json
"tailwindcss": "^3.3.6"               # Framework CSS
"lucide-react": "^0.294.0"            # Ícones
"classnames": "^2.3.2"                # Helper para classes CSS
"recharts": "^2.10.3"                 # Gráficos e charts
```

### 3D & Interação
```json
"three": "^0.160.0"                   # Three.js (3D)
"@react-three/fiber": "^8.15.0"       # React + Three.js
"@react-three/drei": "^9.92.0"        # Helpers para Three.js
"react-beautiful-dnd": "^13.1.1"      # Drag and Drop
```

### Utilitários
```json
"date-fns": "^3.0.0"                  # Manipulação de datas
```

---

## 🛠️ DevDependencies

### TypeScript
```json
"typescript": "^5.2.2"                           # TypeScript
"@types/react": "^18.2.43"                       # Types React
"@types/react-dom": "^18.2.17"                   # Types React DOM
"@types/react-beautiful-dnd": "^13.1.8"          # Types DnD
"@types/three": "^0.160.0"                       # Types Three.js
"@typescript-eslint/eslint-plugin": "^6.14.0"    # ESLint TypeScript
"@typescript-eslint/parser": "^6.14.0"           # Parser TypeScript
```

### Build & Dev Tools
```json
"vite": "^5.0.8"                      # Build tool (super rápido)
"@vitejs/plugin-react": "^4.2.1"      # Plugin Vite + React
```

### Linting & Code Quality
```json
"eslint": "^8.55.0"                           # Linter
"eslint-plugin-react-hooks": "^4.6.0"         # ESLint React Hooks
"eslint-plugin-react-refresh": "^0.4.5"       # ESLint React Refresh
```

### CSS
```json
"tailwindcss": "^3.3.6"               # Tailwind CSS
"postcss": "^8.4.32"                  # PostCSS
"autoprefixer": "^10.4.16"            # Autoprefixer
```

---

## ⚠️ Dependências Removidas

### react-gantt-timeline ❌

**Motivo:** Pacote não disponível na versão especificada (`^0.4.5`)

**Status:** Removido do `package.json`

**Impacto:** Nenhum - Não estava sendo usado no código

### 💡 Alternativas para Gantt Charts (se necessário no futuro):

#### 1. **gantt-task-react** ⭐ (Recomendado)
```bash
npm install gantt-task-react
```
- ✅ Ativamente mantido
- ✅ TypeScript support
- ✅ Customizável
- ✅ Performance

**Exemplo:**
```tsx
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

const tasks: Task[] = [
  {
    start: new Date(2024, 1, 1),
    end: new Date(2024, 1, 15),
    name: 'Tarefa 1',
    id: 'Task1',
    type: 'task',
    progress: 45,
  },
];

<Gantt tasks={tasks} viewMode={ViewMode.Day} />
```

#### 2. **react-gantt-chart**
```bash
npm install react-gantt-chart
```
- ✅ Simples de usar
- ✅ Leve
- ❌ Menos features

#### 3. **frappe-gantt**
```bash
npm install frappe-gantt
```
- ✅ Visual limpo
- ✅ Open source
- ❌ Não é específico para React

#### 4. **dhtmlx-gantt** (Comercial)
```bash
npm install dhtmlx-gantt
```
- ✅ Muito completo
- ✅ Enterprise grade
- ❌ Pago para uso comercial

---

## 📊 Análise de Dependências

### Tamanho do Bundle (estimado)

```
React + React DOM:        ~130 KB
React Router:             ~13 KB
Zustand:                  ~3 KB ⚡ (muito leve!)
Supabase:                 ~45 KB
Tailwind CSS:             ~10-20 KB (purged)
Recharts:                 ~250 KB
Three.js:                 ~600 KB
Lucide Icons:             ~5-10 KB (tree-shaken)
React Beautiful DnD:      ~40 KB
Date-fns:                 ~15 KB (tree-shaken)

Total (aproximado):       ~1.1 MB (sem otimizações)
Total (otimizado):        ~400-600 KB (com code splitting)
```

### Estratégias de Otimização

1. **Code Splitting**
   ```tsx
   const Dashboard = lazy(() => import('./pages/DashboardPage'));
   ```

2. **Tree Shaking**
   ```tsx
   // ✅ Bom - importa apenas o necessário
   import { format } from 'date-fns';
   
   // ❌ Ruim - importa tudo
   import * as dateFns from 'date-fns';
   ```

3. **Dynamic Imports**
   ```tsx
   const loadThreeJS = async () => {
     const THREE = await import('three');
     return THREE;
   };
   ```

---

## 🔄 Atualização de Dependências

### Comandos Úteis

```bash
# Ver dependências desatualizadas
npm outdated

# Atualizar todas (minor/patch)
npm update

# Atualizar todas (incluindo major)
npm install -g npm-check-updates
ncu -u
npm install

# Auditoria de segurança
npm audit

# Corrigir vulnerabilidades
npm audit fix
```

### Política de Atualização

- **Patch versions (0.0.X)**: ✅ Atualizar imediatamente
- **Minor versions (0.X.0)**: ✅ Atualizar após testes
- **Major versions (X.0.0)**: ⚠️ Avaliar breaking changes primeiro

---

## 📦 Gerenciamento de Pacotes

### npm vs yarn vs pnpm

**Recomendação:** Use o que estiver no projeto. Atualmente: **npm**

```bash
# npm (padrão)
npm install
npm run dev

# yarn (alternativa)
yarn install
yarn dev

# pnpm (mais rápido)
pnpm install
pnpm dev
```

---

## 🔒 Segurança

### Auditoria Regular

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente (se possível)
npm audit fix

# Forçar correções (pode quebrar)
npm audit fix --force
```

### Dependências de Produção vs Desenvolvimento

- **dependencies**: Necessárias em produção
- **devDependencies**: Apenas para desenvolvimento

⚠️ **Importante:** Nunca commitar `node_modules/`!

---

## 📚 Recursos

- [npm Documentation](https://docs.npmjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://docs.pmnd.rs/zustand)
- [Supabase](https://supabase.com/docs)

---

## 🆘 Troubleshooting

### Erro: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Peer dependency warning"
```bash
npm install --legacy-peer-deps
```

### Erro: Cache corrompido
```bash
npm cache clean --force
npm install
```

### Erro: Conflito de versões
```bash
# Ver árvore de dependências
npm ls <package-name>

# Forçar versão específica
npm install <package-name>@<version> --save-exact
```

---

<div align="center">

**VisionPlan v2.2.0**

*Dependências otimizadas e documentadas*

[Voltar ao README →](../README.md)

</div>

