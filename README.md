# 🏗️ VisionPlan

> **Plataforma Profissional de Gestão de Obras com Sistema de Temas Customizáveis**

[![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)](https://github.com/yourusername/visionplan)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias](#tecnologias)
- [Começando](#começando)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Documentação](#documentação)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## 🎯 Sobre o Projeto

VisionPlan é uma plataforma moderna e escalável de gestão de obras que combina planejamento 4D, metodologia LPS (Last Planner System) e um sistema inovador de temas customizáveis.

### ✨ Features Principais

- 🎨 **Sistema de Temas Customizáveis** - 12 cores personalizáveis por cliente
- 📊 **Dashboard Profissional** - KPIs, gráficos e modo apresentação
- 📋 **Kanban Pessoal** - Gerenciamento de tarefas com drag & drop
- 🔐 **Autenticação Completa** - Login seguro com Supabase
- ⚡ **Real-time** - Atualizações instantâneas via WebSockets
- 📱 **Responsivo** - Funciona perfeitamente em mobile, tablet e desktop
- 🌐 **100% TypeScript** - Type-safe em todo o código

---

## 📁 Estrutura do Projeto

```
visionplan/
├── 📂 src/                          # Código fonte
│   ├── 📂 components/              # Componentes React
│   │   ├── 📂 ui/                  # Componentes de UI base
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── KPICard.tsx
│   │   ├── 📂 layout/              # Componentes de layout
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── MainLayout.tsx
│   │   └── 📂 features/            # Componentes de features
│   │       ├── Dashboard.tsx
│   │       └── ThemeCustomizer.tsx
│   ├── 📂 pages/                   # Páginas da aplicação
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── KanbanPage.tsx
│   │   ├── AdminTemasPage.tsx
│   │   └── ConfiguracoesPage.tsx
│   ├── 📂 stores/                  # State Management (Zustand)
│   │   ├── authStore.ts
│   │   ├── temaStore.ts
│   │   └── appStore.ts
│   ├── 📂 services/                # Serviços e APIs
│   │   └── supabase.ts
│   ├── 📂 hooks/                   # Custom React Hooks
│   ├── 📂 utils/                   # Funções utilitárias
│   ├── 📂 types/                   # TypeScript types
│   ├── 📂 constants/               # Constantes da aplicação
│   ├── 📂 styles/                  # Estilos globais
│   ├── 📂 config/                  # Configurações
│   ├── 📂 routes/                  # Configuração de rotas
│   │   └── routes.tsx
│   ├── 📂 assets/                  # Assets estáticos
│   │   ├── 📂 images/
│   │   └── 📂 fonts/
│   ├── App.tsx                     # Componente principal
│   ├── main.tsx                    # Entry point
│   └── vite-env.d.ts              # TypeScript declarations
├── 📂 docs/                        # Documentação completa
│   ├── LEIA_PRIMEIRO.md           # 👈 Comece aqui!
│   ├── README.md                  # Documentação técnica
│   ├── QUICKSTART.md              # Guia de instalação rápida
│   ├── API_REFERENCE.md           # Referência da API
│   ├── THEME_CUSTOMIZATION.md     # Sistema de temas
│   ├── DOCUMENTACAO_TECNICA.md    # Documentação técnica (Parte 1)
│   ├── DOCUMENTACAO_TECNICA_PARTE2.md  # Parte 2
│   ├── SUPABASE_SETUP.md          # Setup do Supabase
│   ├── ARCHITECTURE.md            # Arquitetura do sistema
│   └── ...
├── 📂 public/                      # Arquivos públicos
├── 📂 scripts/                     # Scripts de automação
│   ├── setup-git.sh
│   └── setup-git.ps1
├── 📂 tests/                       # Testes
│   ├── 📂 unit/                   # Testes unitários
│   ├── 📂 integration/            # Testes de integração
│   └── 📂 e2e/                    # Testes end-to-end
├── .env.example                   # Exemplo de variáveis de ambiente
├── .gitignore                     # Git ignore
├── .eslintrc.json                 # ESLint config
├── .prettierrc                    # Prettier config
├── .editorconfig                  # Editor config
├── package.json                   # Dependências
├── tsconfig.json                  # TypeScript config
├── tsconfig.node.json             # TypeScript config (Node)
├── vite.config.ts                 # Vite config
├── tailwind.config.js             # Tailwind config
├── postcss.config.js              # PostCSS config
└── README.md                      # Este arquivo
```

---

## 🛠️ Tecnologias

### Frontend
- **React 18.2** - Biblioteca UI
- **TypeScript 5.2** - Linguagem
- **Vite 5.0** - Build tool
- **Tailwind CSS 3.3** - Framework CSS
- **Zustand 4.4** - State management
- **React Router v6** - Roteamento
- **Recharts 2.10** - Gráficos
- **Lucide React** - Ícones
- **React Beautiful DnD** - Drag and drop

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL 15+** - Banco de dados
- **WebSockets** - Real-time
- **Row Level Security** - Segurança

### DevOps
- **ESLint** - Linting
- **Prettier** - Formatação
- **Git** - Controle de versão

---

## 🚀 Começando

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase (gratuita)

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/yourusername/visionplan.git
cd visionplan

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais Supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev

# 5. Abra http://localhost:3000 no navegador
```

### Configuração Detalhada

Para instruções detalhadas de instalação e configuração, consulte:
- 📖 [QUICKSTART.md](docs/QUICKSTART.md) - Guia de instalação rápida
- 🔧 [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) - Configuração do Supabase

---

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build
npm run build           # Build de produção
npm run preview         # Preview do build

# Qualidade de Código
npm run lint            # Executa ESLint
npm run format          # Formata código com Prettier
npm run type-check      # Verifica tipos TypeScript

# Testes
npm run test            # Executa testes
npm run test:watch      # Testes em modo watch
npm run test:coverage   # Cobertura de testes
```

---

## 📚 Documentação

A documentação completa está organizada na pasta `docs/`:

### 🎯 Para Iniciantes
1. **[LEIA_PRIMEIRO.md](docs/LEIA_PRIMEIRO.md)** 👈 **COMECE AQUI!**
2. [QUICKSTART.md](docs/QUICKSTART.md) - Instalação em 5 minutos
3. [RESUMO_VISUAL.txt](docs/RESUMO_VISUAL.txt) - Overview visual

### 👨‍💻 Para Desenvolvedores
1. [README.md](docs/README.md) - Documentação técnica completa
2. [API_REFERENCE.md](docs/API_REFERENCE.md) - Referência da API
3. [DOCUMENTACAO_TECNICA.md](docs/DOCUMENTACAO_TECNICA.md) - Documentação técnica (Parte 1)
4. [DOCUMENTACAO_TECNICA_PARTE2.md](docs/DOCUMENTACAO_TECNICA_PARTE2.md) - Parte 2

### 🎨 Features Específicas
1. [THEME_CUSTOMIZATION.md](docs/THEME_CUSTOMIZATION.md) - Sistema de temas ⭐
2. [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) - Configuração backend
3. [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura do sistema

### 📋 Gestão
1. [ENTREGA_VISIONPLAN.md](docs/ENTREGA_VISIONPLAN.md) - Documento de entrega
2. [PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md) - Resumo do projeto

---

## 🏗️ Arquitetura

O projeto segue uma arquitetura modular e escalável:

```
┌─────────────────────────────────────────┐
│          React Application              │
├─────────────────────────────────────────┤
│  Pages → Components → Stores → Services │
├─────────────────────────────────────────┤
│         Supabase Backend                │
│  Auth | Database | Storage | Realtime   │
└─────────────────────────────────────────┘
```

### Princípios de Design
- ✅ **Separation of Concerns** - Cada módulo tem responsabilidade única
- ✅ **DRY (Don't Repeat Yourself)** - Componentes reutilizáveis
- ✅ **Type Safety** - 100% TypeScript
- ✅ **Performance First** - Code splitting e lazy loading
- ✅ **Mobile First** - Design responsivo

Para mais detalhes, consulte [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga estes passos:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes de Contribuição
- Siga o estilo de código existente (ESLint + Prettier)
- Adicione testes para novas features
- Atualize a documentação
- Mantenha commits pequenos e focados

---

## 📊 Status do Projeto

```
✅ Autenticação e Autorização
✅ Dashboard com KPIs e Gráficos
✅ Sistema de Temas Customizáveis
✅ Kanban Pessoal
✅ Layout Responsivo
✅ Documentação Completa
🚧 Testes Automatizados (em andamento)
🚧 CI/CD Pipeline (em andamento)
📅 Mobile App (planejado)
📅 PWA (planejado)
```

---

## 🐛 Reportar Bugs

Encontrou um bug? Por favor, abra uma [issue](https://github.com/yourusername/visionplan/issues) com:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Ambiente (browser, OS, versão)

---

## 💡 Suporte

Precisa de ajuda? 

1. Consulte a [documentação completa](docs/LEIA_PRIMEIRO.md)
2. Procure em [issues existentes](https://github.com/yourusername/visionplan/issues)
3. Abra uma nova issue
4. Entre em contato: suporte@visionplan.com

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Equipe

Desenvolvido com ❤️ pela equipe VisionPlan.

---

## 🌟 Agradecimentos

- [React](https://reactjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- Toda a comunidade open source

---

<div align="center">

**VisionPlan v2.2.0** 🏗️

*Gestão de Obras Profissional e Escalável*

[Documentação](docs/LEIA_PRIMEIRO.md) • [Issues](https://github.com/yourusername/visionplan/issues) • [Website](https://visionplan.com)

</div>

