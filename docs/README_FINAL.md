# 🏗️ VisionPlan v2.2 - Plataforma de Gestão de Obras 4D/LPS

## 🎯 Aplicação Completa Entregue

Esta é a implementação completa do **VisionPlan**, uma plataforma SaaS inovadora para gestão de obras que unifica planejamento, LPS (Last Planner System), Kanban, BIM 4D e muito mais.

## ⚡ Início Rápido (5 minutos)

```bash
# 1. Instalar dependências
npm install

# 2. Configurar Supabase
cp .env.example .env
# Edite .env com suas credenciais

# 3. Rodar aplicação
npm run dev

# 4. Acessar
# http://localhost:3000
```

## 🎨 DESTAQUE: Sistema de Temas Customizáveis

O VisionPlan possui um **sistema único de temas** que permite que cada empresa/cliente tenha sua identidade visual:

### Funcionalidades do Sistema de Temas:

✅ **5 Temas Pré-definidos**
- Azul Profissional (padrão)
- Verde Sustentável
- Laranja Energia
- Roxo Inovação
- Vermelho Ação

✅ **Customização Total**
- Escolha qualquer cor primária
- Escolha qualquer cor secundária
- Upload de logo da empresa

✅ **Aplicação Global Automática**
- Botões e componentes
- Headers e títulos
- Ícones e gráficos
- Sidebar e navegação
- KPIs e dashboards

✅ **Controle de Acesso**
- Apenas usuários ADMIN podem alterar temas
- Tema salvo no banco de dados
- Persiste entre sessões

### Como Testar:

1. Login como ADMIN
2. Ir em **Configurações → Personalização**
3. Clicar em um tema pré-definido ou customizar cores
4. **Salvar Tema**
5. Ver toda a interface atualizar instantaneamente! 🎨

## 📦 Estrutura do Projeto

```
visionplan/
├── src/
│   ├── components/
│   │   └── layout/Layout.tsx       # Layout principal + sidebar
│   ├── pages/
│   │   ├── LoginPage.tsx           # Autenticação
│   │   ├── DashboardPage.tsx       # Dashboard com KPIs
│   │   ├── KanbanPage.tsx          # Kanban interativo
│   │   └── ConfiguracoesPage.tsx   # Gestão de temas
│   ├── services/
│   │   └── supabase.ts             # Cliente Supabase
│   ├── store/
│   │   └── appStore.ts             # Estado global (Zustand)
│   └── types/
│       └── index.ts                # TypeScript types
├── QUICKSTART.md                   # ⚡ LEIA PRIMEIRO!
├── ENTREGA.md                      # Documentação completa
├── INSTALL.md                      # Guia de instalação
├── ARCHITECTURE.md                 # Arquitetura detalhada
└── README.md                       # Este arquivo
```

## 🚀 Funcionalidades Implementadas

### ✅ Autenticação e Multi-Tenant (RF001, RF002)
- Login com Supabase Auth
- 3 Camadas de Governança
- 10 Perfis de Acesso

### ✅ Dashboard com KPIs (RF004)
- 6 KPIs principais em tempo real
- Gráficos de Curva S
- Timeline de restrições

### ✅ Modo Apresentação (RF035)
- Tela cheia para reuniões
- Remove elementos de UI
- Otimizado para projeção

### ✅ Kanban Interativo (RF010-RF012)
- Drag & Drop
- Check-in/Check-out automático
- Real-time sync entre usuários
- Notificações

### ✅ Sistema de Temas (Extra)
- Customização completa de cores
- 5 temas pré-definidos
- Aplicação global automática
- White-label ready

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Estado**: Zustand
- **Rotas**: React Router v6
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Build**: Vite
- **UI/UX**: Lucide Icons + Custom Design System

## 📚 Documentação

| Arquivo | O que você encontra |
|---------|---------------------|
| **QUICKSTART.md** | Guia rápido de 5 minutos |
| **ENTREGA.md** | Documentação completa do que foi entregue |
| **INSTALL.md** | Guia detalhado de instalação e deploy |
| **ARCHITECTURE.md** | Arquitetura e funcionalidades técnicas |

## 🎯 Requisitos Funcionais Atendidos

| RF | Funcionalidade | Status |
|----|----------------|--------|
| RF001 | Multi-Empresa | ✅ |
| RF002 | Gestão de Usuários | ✅ |
| RF004 | Dashboards KPIs | ✅ |
| RF010 | Kanban | ✅ |
| RF011 | Atualização Status | ✅ |
| RF035 | Modo Apresentação | ✅ |
| Extra | Sistema de Temas | ✅ |

## 🔄 Real-time

A aplicação usa **Supabase Real-time** (WebSockets) para:

- Atualização automática de KPIs no dashboard
- Sincronização do Kanban entre usuários
- Notificações instantâneas
- Mudanças de tema refletidas imediatamente

## 🎨 Customização de Temas - Exemplo

```typescript
// Aplicar tema verde programaticamente
import { useAppStore } from './store/appStore';

const setTema = useAppStore((state) => state.setTema);

setTema({
  corPrimaria: '#10b981',  // Verde
  corSecundaria: '#059669'
});

// A interface toda atualiza automaticamente!
```

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## 🔐 Configuração Supabase

1. Criar projeto em https://supabase.com
2. Copiar credenciais para `.env`
3. Executar schema SQL (ver `INSTALL.md`)
4. Habilitar Row Level Security (RLS)

## 📊 KPIs do Dashboard

- **% PAC Médio**: Percentual de Atividades Concluídas
- **Tempo Médio de Resolução**: Para restrições
- **SPI**: Schedule Performance Index
- **CPI**: Cost Performance Index
- **Restrições Impeditivas Ativas**
- **Atividades em Atraso**

## 🎓 Próximos Passos Sugeridos

1. Implementar Cronograma Gantt (RF006)
2. Gestão Completa de Restrições (RF014)
3. LPS - Look Ahead Planning (RF013)
4. Visualização BIM 4D (RF019-RF022)
5. Mobile App (React Native)

## 💡 Dicas

### Testar Temas Rapidamente

Abra 2 janelas do navegador:
1. Dashboard em uma janela
2. Configurações em outra
3. Mude o tema nas Configurações
4. Veja o Dashboard atualizar automaticamente!

### Modo Apresentação

Atalho rápido: Clique no botão no canto superior direito do Dashboard

### Kanban Real-time

Abra 2 navegadores diferentes, faça login, arraste uma tarefa em um e veja atualizar no outro!

## 🆘 Suporte

Precisa de ajuda? Leia na ordem:

1. **QUICKSTART.md** - Início rápido
2. **ENTREGA.md** - Documentação completa
3. **INSTALL.md** - Troubleshooting
4. **ARCHITECTURE.md** - Detalhes técnicos

## 📄 Licença

Propriedade de [Sua Empresa]. Todos os direitos reservados.

---

## 🌟 Diferenciais do VisionPlan

✨ **Sistema de Temas Único** - White-label completo  
🔄 **Real-time Nativo** - Supabase WebSockets  
📱 **Mobile-First** - Responsivo e otimizado  
🎯 **TypeScript** - Type-safe end-to-end  
🚀 **Performance** - Build otimizado com Vite  
📊 **KPIs de Alto Nível** - Dashboard executivo  
🎭 **Modo Apresentação** - Para reuniões  

---

**VisionPlan v2.2** - Revolucionando a Gestão de Obras Civil

Desenvolvido com ❤️ e muito ☕

**Comece agora**: Leia `QUICKSTART.md` 🚀
