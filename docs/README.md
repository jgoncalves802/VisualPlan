# VisionPlan - Plataforma Integrada de Gestão de Obras (4D/LPS)

![VisionPlan](https://img.shields.io/badge/version-2.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.39-green)

## 📋 Sobre o Projeto

O VisionPlan é uma plataforma SaaS completa para planejamento e gestão de obras de construção civil, unificando funcionalidades de cronogramas (Gantt), visualização 4D (BIM), gestão de tarefas (Kanban) e metodologia Lean (LPS - Last Planner System) em uma única interface moderna e profissional.

### 🎯 Principais Características

- ✅ **Multi-empresa e Multi-usuário**: Suporte completo para múltiplas empresas e projetos
- 🎨 **Temas Customizáveis por Cliente**: Sistema de cores 100% personalizável
- 📊 **Dashboard Inteligente**: KPIs em tempo real com modo apresentação (RF035)
- 🔄 **LPS Integrado**: Gestão completa de restrições e ações de tratativa (RF014)
- 📋 **Kanban Colaborativo**: Gestão de tarefas com check-in/check-out (RF010-RF012)
- 🏗️ **Visualização 4D**: Integração BIM com cronograma (RF019-RF022)
- ⚡ **Real-time**: Atualizações instantâneas via WebSockets
- 🔐 **Governança em Camadas**: Proponente, Fiscalização e Contratada

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18.2** + **TypeScript 5.2** - Componentes tipados e reativos
- **Vite** - Build tool ultra-rápida
- **Tailwind CSS** - Estilização utilitária moderna
- **Zustand** - State management leve e performático
- **React Router v6** - Roteamento SPA
- **Recharts** - Gráficos e curvas S
- **Lucide React** - Ícones modernos
- **Three.js** / **@react-three/fiber** - Renderização 3D/BIM

### Backend & Infrastructure
- **Supabase** - Backend-as-a-Service completo
- **PostgreSQL 15+** - Banco relacional robusto
- **Real-time Subscriptions** - WebSockets para colaboração
- **Supabase Storage** - Armazenamento S3-compatible
- **Row Level Security (RLS)** - Segurança em nível de linha
- **Edge Functions** - Lógica serverless

## 📦 Instalação e Setup

### Pré-requisitos
```bash
Node.js 18+ 
npm ou yarn
Conta Supabase (plano gratuito disponível)
```

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/visionplan.git
cd visionplan
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite `.env` com suas credenciais Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
VITE_APP_NAME=VisionPlan
VITE_APP_VERSION=2.2.0
```

4. **Execute a aplicação**
```bash
npm run dev
```

🎉 Aplicação rodando em `http://localhost:3000`

## 🗄️ Configuração do Banco de Dados

O schema PostgreSQL completo está documentado em `/docs/schema.prisma`.

### Setup Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Acesse **SQL Editor**
3. Execute os scripts de migração (baseados no schema Prisma)
4. Configure Row Level Security (RLS) conforme documentação

Veja `SUPABASE_SETUP.md` para instruções detalhadas.

## 🎨 Sistema de Temas Personalizáveis ⭐

**Funcionalidade Exclusiva**: Cada empresa/cliente pode ter seu próprio tema de cores!

### Como Funciona

1. **Acesso Admin**: Usuários ADMIN acessam `/admin`
2. **12 Cores Customizáveis**:
   - `primary` - Cor primária da marca do cliente
   - `secondary` - Cor secundária
   - `accent` - Destaques importantes
   - `success`, `warning`, `danger`, `info` - Estados da aplicação
   - `background`, `surface` - Fundos e cards
   - `text`, `textSecondary` - Tipografia
   - `border` - Bordas e divisores

3. **Preview em Tempo Real**: Visualize mudanças instantaneamente
4. **Persistência**: Temas salvos automaticamente (localStorage + Zustand)
5. **CSS Variables**: Aplicação global via variáveis CSS customizadas

### Exemplo de Código

```typescript
import { useTemaStore } from './stores/temaStore';

const MeuComponente = () => {
  const { tema, setTema } = useTemaStore();
  
  return (
    <button 
      style={{ backgroundColor: tema.primary }}
      className="btn"
    >
      Botão com cor personalizada
    </button>
  );
};
```

### Classes Utilitárias

```html
<div className="theme-bg-primary">Fundo primário</div>
<div className="theme-text">Texto principal</div>
<div className="theme-border-primary">Borda primária</div>
```

Veja `THEME_CUSTOMIZATION.md` para documentação completa.

## 👥 Perfis e Permissões

### Camadas de Governança (RF002)

#### 1. Proponente (Cliente/Contratante)
- ✅ Visualização completa de todos os dados
- ✅ Criar restrições impeditivas manuais
- ✅ Aprovar mudanças de escopo (RF024)
- ✅ Enviar formalizações via e-mail (RF031)
- ✅ Acesso a todos os dashboards

#### 2. Fiscalização
- ✅ Aceitar/Reprovar qualidade (RF018)
- ✅ Liberar cronograma bloqueado
- ✅ Criar restrições impeditivas
- ✅ Validar conclusão de atividades
- ⚠️ **Único** autorizado a liberar bloqueios

#### 3. Contratada (Executora)
- ✅ Executar ações de tratativa (RF014)
- ✅ Atualizar status de atividades
- ✅ Check-in/Check-out (RF016)
- ✅ Planejar PST (RF015)
- ✅ Criar restrições impeditivas

### Perfis de Acesso

- **ADMIN** - Configuração do sistema e temas
- **DIRETOR** - Visão estratégica e KPIs
- **GERENTE_PROJETO** - Gestão completa do projeto
- **ENGENHEIRO_PLANEJAMENTO** - Cronograma e LPS
- **COORDENADOR_OBRA** - Execução e campo
- **MESTRE_OBRAS** - Supervisão direta
- **ENCARREGADO** - Tarefas específicas
- **COLABORADOR** - Kanban pessoal
- **FISCALIZACAO_LEAD** - Líder da fiscalização
- **FISCALIZACAO_TECNICO** - Técnico de qualidade

## 📊 Módulos e Funcionalidades

### 1. Dashboard (RF004, RF035) 📈
- **KPIs de Alto Nível**:
  - % PAC (Percentual de Atividades Concluídas)
  - Tempo Médio de Resolução de Restrições
  - SPI (Schedule Performance Index)
  - CPI (Cost Performance Index)
  - Restrições Impeditivas Ativas
  - Atividades em Atraso

- **Curvas S** (RF029):
  - Avanço Físico (Planejado vs Realizado)
  - Avanço Financeiro
  
- **Modo Apresentação** (RF035):
  - Tela cheia otimizada para reuniões
  - Remove elementos de navegação
  - Atualização automática de dados

### 2. Kanban (RF010-RF012) 📋
- Visualização por colaborador
- 3 colunas: A Fazer / Fazendo / Concluído
- Check-in/Check-out com timestamp
- Notificações em tempo real
- Ações de tratativa integradas

### 3. Gantt / Cronograma (RF005-RF009) 📅
- Estrutura WBS hierárquica
- Dependências (FS, SS, FF, SF)
- Caminho crítico destacado
- Gestão de recursos 5D
- Baseline para comparação
- Importação P6 e MS Project

### 4. LPS - Last Planner System (RF013-RF018) 🔄

#### Look Ahead Planning (RF013)
- Planejamento de 4-6 semanas
- Identificação de restrições
- Filtros por setor/disciplina

#### Gestão de Restrições (RF014) ⚠️
**Fluxo Completo**:
1. **Criação**: Qualquer camada pode criar
2. **Classificação**: 
   - Tipo: Material, Mão de Obra, Equipamento, etc.
   - Origem: Proponente, Fiscalização, Contratada, Sistema
   - Impeditiva: Bloqueia cronograma (Sim/Não)
3. **Ação Automática**: Sistema gera tarefa para Contratada
4. **Métricas**:
   - Tempo de Paralisação (início bloqueio → liberação)
   - Tempo de Tratativa (atribuição → conclusão)
5. **Liberação**: Exclusiva da Fiscalização

#### Pull Planning / PST (RF015-RF017)
- Interface touch-friendly para tablets
- Planejamento semanal colaborativo
- Check-in/Check-out de atividades
- Análise 5 Porquês para não conclusões
- Relatório PAC automático (RF026)

#### Qualidade (RF018) ✅
- Checklists por atividade
- Aceite/Reprovação pela Fiscalização
- **Reprovação → Restrição Impeditiva automática**
- Bloqueio de sequência até re-aprovação

### 5. BIM / 4D (RF019-RF022) 🏗️
- Importação de modelos IFC/FBX
- Mapeamento 4D (Elemento 3D ↔ Atividade)
- Visualização 3D fluida (Three.js)
- Simulação temporal da construção
- Filtros por pavimento/disciplina/status

### 6. Gestão de Riscos (RF023) 🎯
- Registro de riscos (Probabilidade × Impacto)
- Plano de resposta
- Vinculação a atividades
- Painel de monitoramento

### 7. Mudanças de Escopo (RF024) 📝
- Fluxo de aprovação
- Análise de impacto (Cronograma/Custo)
- Histórico completo
- Aprovação por perfis autorizados

### 8. Documentos de Campo (RF030) 📷
- Upload vinculado a Atividades/Setores
- Organização automática por Semana/Setor
- Tipos: Fotos, Vídeos, PDFs, etc.
- Hierarquia para auditoria

### 9. Administração (RF001-RF003) ⚙️
- Gestão de empresas multi-tenant
- Gestão de usuários e permissões
- **Customização de temas por cliente** 🎨
- Organograma visual (RF034)

## 🔐 Segurança

- ✅ Autenticação JWT via Supabase Auth
- ✅ Row Level Security (RLS) no PostgreSQL
- ✅ Permissões baseadas em camada de governança
- ✅ Criptografia end-to-end para dados sensíveis
- ✅ Conformidade LGPD/GDPR
- ✅ Logs de auditoria completos

## 📱 Responsividade

Otimizado para todos os dispositivos:
- 🖥️ Desktop (1920x1080+)
- 💻 Laptop (1366x768+)
- 📱 Tablet (768x1024+) - Ideal para canteiro
- 📱 Mobile (375x667+)

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento com hot-reload
npm run dev

# Build otimizada para produção
npm run build

# Preview da build de produção
npm run preview

# Lint e verificação de tipos
npm run lint

# Type checking
npm run type-check
```

## 🗂️ Estrutura do Projeto

```
visionplan/
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── common/          # Botões, Inputs, Modals
│   │   ├── layout/          # Layout, Sidebar, Header
│   │   ├── dashboard/       # KPICard, Charts
│   │   ├── kanban/          # KanbanBoard, Card
│   │   ├── gantt/           # GanttChart, Timeline
│   │   ├── lps/             # LookAhead, Restrictions
│   │   └── bim/             # BIMViewer, 3DControls
│   ├── pages/               # Páginas da aplicação
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── KanbanPage.tsx
│   │   ├── GanttPage.tsx
│   │   ├── LPSPage.tsx
│   │   ├── BIMPage.tsx
│   │   └── AdminTemasPage.tsx
│   ├── stores/              # Zustand stores
│   │   ├── authStore.ts     # Autenticação
│   │   ├── temaStore.ts     # Temas customizáveis
│   │   └── projetoStore.ts  # Estado do projeto atual
│   ├── services/            # Integrações e APIs
│   │   ├── supabase.ts      # Cliente Supabase
│   │   ├── api.ts           # Chamadas API
│   │   └── realtime.ts      # WebSockets
│   ├── types/               # TypeScript types
│   │   └── index.ts         # Interfaces e Enums
│   ├── utils/               # Funções utilitárias
│   │   ├── formatters.ts    # Formatação de dados
│   │   └── calculations.ts  # Cálculos SPI/CPI
│   ├── styles/              # Estilos globais
│   │   └── global.css       # CSS com variáveis de tema
│   ├── App.tsx              # Componente raiz com rotas
│   └── main.tsx             # Entry point
├── public/                  # Assets estáticos
├── docs/                    # Documentação adicional
│   ├── PRD.md               # Requisitos do produto
│   ├── schema.prisma        # Schema do banco
│   └── diagrams.md          # Diagramas Mermaid
├── .env.example             # Template de variáveis
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 📈 Roadmap

### Versão 2.3 (Q1 2025)
- [ ] Integração completa Primavera P6 (XER)
- [ ] Integração MS Project (XML/MPP)
- [ ] Exportação de relatórios PDF personalizados
- [ ] Mobile App nativo (React Native)
- [ ] Notificações push

### Versão 3.0 (Q2 2025)
- [ ] IA para predição de atrasos
- [ ] Realidade Aumentada (AR) no canteiro
- [ ] Integração ERP (SAP, TOTVS, Protheus)
- [ ] Analytics avançado com Power BI
- [ ] API pública para integrações

### Versão 3.5 (Q3 2025)
- [ ] Realidade Virtual (VR) para treinamento
- [ ] Blockchain para rastreabilidade
- [ ] IoT para monitoramento de equipamentos
- [ ] ML para otimização de cronograma

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Para contribuir:

1. 🍴 Fork o projeto
2. 🌿 Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. ✍️ Commit suas mudanças (`git commit -m 'Add: nova feature incrível'`)
4. 🚀 Push para a branch (`git push origin feature/MinhaFeature`)
5. 🎯 Abra um Pull Request

### Padrões de Commit
- `Add:` Nova funcionalidade
- `Fix:` Correção de bug
- `Update:` Atualização de código
- `Refactor:` Refatoração
- `Docs:` Documentação
- `Style:` Formatação/estilo

## 📄 Licença

Este projeto está sob a licença MIT. Veja `LICENSE` para detalhes.

## 📞 Suporte e Contato

- 📧 Email: suporte@visionplan.com.br
- 📚 Documentação: https://docs.visionplan.com.br
- 🐛 Issues: https://github.com/visionplan/visionplan/issues
- 💬 Discord: https://discord.gg/visionplan
- 🐦 Twitter: @visionplan

## 🙏 Agradecimentos

- Comunidade React e TypeScript
- Time Supabase
- Contribuidores open-source
- Beta testers e empresas parceiras

## 👨‍💻 Equipe

- **Product Owner**: [Nome]
- **Tech Lead**: [Nome]
- **Frontend**: [Nome]
- **Backend**: [Nome]
- **UX/UI**: [Nome]

---

<div align="center">

**VisionPlan** - Transformando o planejamento de obras com tecnologia 🏗️✨

[Website](https://visionplan.com.br) • [Docs](https://docs.visionplan.com.br) • [Demo](https://demo.visionplan.com.br)

Made with ❤️ in Brazil 🇧🇷

</div>
