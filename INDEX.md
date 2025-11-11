# 📑 Índice Geral do Projeto VisionPlan

> Navegação rápida para toda a documentação e código do projeto

---

## 🚀 Início Rápido

👋 **Primeira vez aqui?** Comece por:

1. 📖 [docs/LEIA_PRIMEIRO.md](docs/LEIA_PRIMEIRO.md) - **COMECE AQUI!**
2. 🚀 [docs/QUICKSTART.md](docs/QUICKSTART.md) - Instalação em 5 minutos
3. 📘 [README.md](README.md) - Overview do projeto
4. 🏗️ [STRUCTURE.md](STRUCTURE.md) - Guia de arquitetura

---

## 📚 Documentação

### 📖 Documentação Geral

| Arquivo | Descrição | Para Quem |
|---------|-----------|-----------|
| [docs/LEIA_PRIMEIRO.md](docs/LEIA_PRIMEIRO.md) | 👈 **Ponto de partida** - Índice mestre | Todos |
| [docs/RESUMO_VISUAL.txt](docs/RESUMO_VISUAL.txt) | Overview visual em ASCII art | Todos |
| [docs/ENTREGA_VISIONPLAN.md](docs/ENTREGA_VISIONPLAN.md) | Documento oficial de entrega | PO/Gerentes |
| [docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md) | Resumo executivo do projeto | Stakeholders |

### 👨‍💻 Documentação Técnica

| Arquivo | Descrição | Nível |
|---------|-----------|-------|
| [docs/README.md](docs/README.md) | Documentação técnica completa | Intermediário |
| [docs/DOCUMENTACAO_TECNICA.md](docs/DOCUMENTACAO_TECNICA.md) | Doc técnica detalhada (Parte 1) | Avançado |
| [docs/DOCUMENTACAO_TECNICA_PARTE2.md](docs/DOCUMENTACAO_TECNICA_PARTE2.md) | Doc técnica detalhada (Parte 2) | Avançado |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Referência rápida da API | Todos os devs |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura do sistema | Avançado |

### 🎨 Features e Configuração

| Arquivo | Descrição | Para Quem |
|---------|-----------|-----------|
| [docs/THEME_CUSTOMIZATION.md](docs/THEME_CUSTOMIZATION.md) | ⭐ Sistema de temas customizáveis | Admins/Devs |
| [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) | Configuração do Supabase | DevOps/Backend |
| [docs/DEPENDENCIAS.md](docs/DEPENDENCIAS.md) | Documentação de dependências | Devs |
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Guia de instalação rápida | Iniciantes |
| [docs/INSTALL.md](docs/INSTALL.md) | Guia de instalação detalhado | DevOps |
| [docs/GIT_SETUP.md](docs/GIT_SETUP.md) | Configuração do Git | Devs |

### 📂 Índices e Navegação

| Arquivo | Descrição |
|---------|-----------|
| [docs/INDEX.md](docs/INDEX.md) | Índice de navegação da documentação |
| [INDEX.md](INDEX.md) | 👈 Este arquivo - Índice geral |
| [STRUCTURE.md](STRUCTURE.md) | Guia completo de estrutura e arquitetura |

---

## 💻 Código Fonte

### 📂 Estrutura de Pastas

```
src/
├── components/        # Componentes React
│   ├── ui/           # Componentes de UI base
│   ├── layout/       # Componentes de layout
│   └── features/     # Componentes de features
├── pages/            # Páginas/Rotas
├── stores/           # State management (Zustand)
├── services/         # APIs e serviços
├── hooks/            # Custom React hooks
├── utils/            # Funções utilitárias
├── types/            # TypeScript types
├── constants/        # Constantes
├── styles/           # Estilos globais
├── config/           # Configurações
├── routes/           # Definição de rotas
└── assets/           # Imagens, fontes
```

### 📘 README de Módulos

Cada pasta principal tem seu próprio README explicativo:

| Arquivo | Descrição |
|---------|-----------|
| [src/components/README.md](src/components/README.md) | Guia de componentes React |
| [src/stores/README.md](src/stores/README.md) | Guia de state management |
| [src/pages/README.md](src/pages/README.md) | Guia de páginas |
| [src/hooks/README.md](src/hooks/README.md) | Guia de custom hooks |
| [src/services/README.md](src/services/README.md) | Guia de serviços e APIs |

---

## ⚙️ Arquivos de Configuração

### Principais

| Arquivo | Descrição |
|---------|-----------|
| [package.json](package.json) | Dependências e scripts npm |
| [tsconfig.json](tsconfig.json) | Configuração TypeScript |
| [vite.config.ts](vite.config.ts) | Configuração Vite |
| [tailwind.config.js](tailwind.config.js) | Configuração Tailwind CSS |
| [postcss.config.js](postcss.config.js) | Configuração PostCSS |

### Linting e Formatação

| Arquivo | Descrição |
|---------|-----------|
| [.eslintrc.json](.eslintrc.json) | Configuração ESLint |
| [.prettierrc](.prettierrc) | Configuração Prettier |
| [.prettierignore](.prettierignore) | Arquivos ignorados pelo Prettier |
| [.editorconfig](.editorconfig) | Configuração de editor |

### Ambiente

| Arquivo | Descrição |
|---------|-----------|
| [.env.example](.env.example) | Template de variáveis de ambiente |
| [.gitignore](.gitignore) | Arquivos ignorados pelo Git |

---

## 🧪 Testes

```
tests/
├── unit/             # Testes unitários
├── integration/      # Testes de integração
└── e2e/              # Testes end-to-end
```

---

## 📜 Scripts

```
scripts/
├── setup-git.sh      # Setup Git (Linux/Mac)
└── setup-git.ps1     # Setup Git (Windows)
```

---

## 🗂️ Navegação por Tarefa

### 🎯 Quero instalar o projeto
1. [docs/QUICKSTART.md](docs/QUICKSTART.md)
2. [.env.example](.env.example)
3. [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

### 🏗️ Quero entender a arquitetura
1. [STRUCTURE.md](STRUCTURE.md) ⭐
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. [docs/DOCUMENTACAO_TECNICA.md](docs/DOCUMENTACAO_TECNICA.md)

### 🎨 Quero customizar temas
1. [docs/THEME_CUSTOMIZATION.md](docs/THEME_CUSTOMIZATION.md) ⭐
2. [src/stores/README.md](src/stores/README.md) → `temaStore`

### 🧩 Quero criar um componente
1. [src/components/README.md](src/components/README.md)
2. [docs/API_REFERENCE.md](docs/API_REFERENCE.md) → Snippets

### 📄 Quero criar uma página
1. [src/pages/README.md](src/pages/README.md)
2. [STRUCTURE.md](STRUCTURE.md) → Adicionando Features

### 🗄️ Quero gerenciar estado
1. [src/stores/README.md](src/stores/README.md)
2. [docs/API_REFERENCE.md](docs/API_REFERENCE.md) → Stores

### 🎣 Quero criar um hook
1. [src/hooks/README.md](src/hooks/README.md)
2. [docs/API_REFERENCE.md](docs/API_REFERENCE.md) → Hooks

### 🔌 Quero integrar com API
1. [src/services/README.md](src/services/README.md)
2. [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

### 🔐 Quero entender autenticação
1. [docs/DOCUMENTACAO_TECNICA.md](docs/DOCUMENTACAO_TECNICA.md) → Auth
2. [src/stores/README.md](src/stores/README.md) → `authStore`

### 🚀 Quero fazer deploy
1. [docs/DOCUMENTACAO_TECNICA_PARTE2.md](docs/DOCUMENTACAO_TECNICA_PARTE2.md) → Deploy
2. [.env.example](.env.example)

### 🐛 Tenho um problema
1. [docs/DOCUMENTACAO_TECNICA_PARTE2.md](docs/DOCUMENTACAO_TECNICA_PARTE2.md) → Troubleshooting
2. [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

---

## 📊 Estatísticas do Projeto

```
📝 Linhas de Código:      ~3.500 linhas
🧩 Componentes React:     15+ componentes
📄 Páginas:               5 páginas
💾 Stores (Zustand):      3 stores
📚 Documentação:          ~50.000 palavras
🎨 Tema Customizável:     12 cores
⚙️ TypeScript:            100% tipado
📖 READMEs:               6 READMEs modulares
```

---

## 🎯 Roadmap de Leitura

### Para Iniciantes
```
1. INDEX.md (você está aqui) ✅
2. docs/LEIA_PRIMEIRO.md
3. docs/RESUMO_VISUAL.txt
4. docs/QUICKSTART.md
5. README.md
```

### Para Desenvolvedores
```
1. INDEX.md ✅
2. README.md
3. STRUCTURE.md ⭐
4. docs/DOCUMENTACAO_TECNICA.md
5. src/components/README.md
6. src/stores/README.md
7. docs/API_REFERENCE.md
```

### Para Arquitetos
```
1. INDEX.md ✅
2. STRUCTURE.md ⭐⭐⭐
3. docs/ARCHITECTURE.md
4. docs/DOCUMENTACAO_TECNICA.md
5. docs/DOCUMENTACAO_TECNICA_PARTE2.md
```

---

## 🔗 Links Rápidos

### Documentação Principal
- 👉 [Comece Aqui](docs/LEIA_PRIMEIRO.md)
- 📘 [README Principal](README.md)
- 🏗️ [Guia de Estrutura](STRUCTURE.md)
- 🚀 [Quick Start](docs/QUICKSTART.md)

### Desenvolvimento
- 🧩 [Componentes](src/components/README.md)
- 🗄️ [State Management](src/stores/README.md)
- 🎣 [Hooks](src/hooks/README.md)
- 🔌 [Services](src/services/README.md)

### Configuração
- ⚙️ [Variáveis de Ambiente](.env.example)
- 🎨 [Temas](docs/THEME_CUSTOMIZATION.md)
- 🗄️ [Supabase](docs/SUPABASE_SETUP.md)

---

## 📞 Suporte

Precisa de ajuda? Consulte nesta ordem:

1. **Este índice** - Encontre o documento certo
2. **[API_REFERENCE.md](docs/API_REFERENCE.md)** - Referência rápida
3. **[STRUCTURE.md](STRUCTURE.md)** - Arquitetura e padrões
4. **Troubleshooting** - [DOCUMENTACAO_TECNICA_PARTE2.md](docs/DOCUMENTACAO_TECNICA_PARTE2.md)
5. **Issues** - Reporte bugs no GitHub

---

## 🌟 Destaques

### ⭐ Documentos Mais Importantes

1. **[docs/LEIA_PRIMEIRO.md](docs/LEIA_PRIMEIRO.md)** - Seu guia inicial
2. **[STRUCTURE.md](STRUCTURE.md)** - Arquitetura completa do projeto
3. **[docs/THEME_CUSTOMIZATION.md](docs/THEME_CUSTOMIZATION.md)** - Diferencial do produto
4. **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)** - Para uso diário

### 🎨 Features Principais

- **Sistema de Temas Customizáveis** - [Documentação](docs/THEME_CUSTOMIZATION.md)
- **Dashboard Profissional** - [Componente](src/components/features/Dashboard.tsx)
- **Kanban Real-time** - [Página](src/pages/KanbanPage.tsx)
- **Autenticação Completa** - [Store](src/stores/authStore.ts)

---

<div align="center">

**VisionPlan v2.2.0** 🏗️

*Plataforma Profissional de Gestão de Obras*

📚 **+50.000 palavras** | 🎨 **12 cores customizáveis** | ⚡ **100% TypeScript**

[Começar Agora →](docs/QUICKSTART.md)

---

*Última atualização: Novembro 2024*

</div>

