# ✅ Cronograma - Checklist de Implementação

> **Checklist prático fase por fase para implementar a página de cronograma**

---

## 📋 FASE 1: Fundação (Dias 1-5)

### Dia 1: Setup Inicial

- [ ] **Instalar Dependências**
  ```bash
  npm install gantt-task-react react-window xlsx jspdf html2canvas
  npm install --save-dev @types/react-window
  ```

- [ ] **Criar Branch**
  ```bash
  git checkout -b feature/cronograma
  ```

- [ ] **Criar Estrutura de Pastas**
  ```bash
  mkdir -p src/components/features/cronograma
  mkdir -p src/hooks
  ```

- [ ] **Criar Arquivos Base**
  ```bash
  touch src/stores/cronogramaStore.ts
  touch src/services/cronogramaService.ts
  touch src/types/cronograma.ts
  touch src/pages/CronogramaPage.tsx
  touch src/hooks/useCronograma.ts
  ```

### Dia 2: Types e Migrations

- [ ] **Criar types em `src/types/cronograma.ts`**
  - [ ] `TipoDependencia` enum
  - [ ] `DependenciaAtividade` interface
  - [ ] `FiltrosCronograma` interface
  - [ ] `CaminhoCritico` interface
  - [ ] `TaskGantt` interface

- [ ] **Criar Migration SQL**
  ```bash
  # No terminal do Supabase
  supabase migration new create_dependencias_atividades
  ```
  - [ ] Tabela `dependencias_atividades`
  - [ ] Índices
  - [ ] Constraints (unique, no self-dependency)
  - [ ] RLS policies

- [ ] **Aplicar Migration**
  ```bash
  supabase db push
  ```

### Dia 3: Store

- [ ] **Implementar `cronogramaStore.ts`**
  - [ ] Interface `CronogramaState`
  - [ ] Estado inicial
  - [ ] `carregarAtividades()`
  - [ ] `adicionarAtividade()`
  - [ ] `atualizarAtividade()`
  - [ ] `excluirAtividade()`
  - [ ] `setFiltros()`
  - [ ] `setVisualizacao()`
  - [ ] `setEscala()`
  - [ ] Persist config (visualizacao, escala, filtros)

- [ ] **Testar Store Isoladamente**
  ```bash
  npm test cronogramaStore
  ```

### Dia 4: Service

- [ ] **Implementar `cronogramaService.ts`**
  - [ ] `getAtividades(projetoId)`
  - [ ] `createAtividade(data)`
  - [ ] `updateAtividade(id, data)`
  - [ ] `deleteAtividade(id)`
  - [ ] `getDependencias(projetoId)`
  - [ ] `createDependencia(data)`
  - [ ] `deleteDependencia(id)`
  - [ ] `subscribeToAtividades(projetoId, callback)`

- [ ] **Testar Service com Postman/Insomnia**

### Dia 5: Hook

- [ ] **Implementar `useCronograma.ts`**
  - [ ] `useEffect` para carregar dados
  - [ ] `useMemo` para transformar Atividades → Tasks
  - [ ] `handleTaskChange()`
  - [ ] `handleTaskDelete()`
  - [ ] `handleTaskAdd()`
  - [ ] Aplicar filtros
  - [ ] Função helper `mapTipoToGantt()`
  - [ ] Função helper `getTaskStyles()`

**✅ Entregável Fase 1**: Store, Service e Hook funcionando e testados

---

## 📋 FASE 2: Componentes Base (Dias 6-12)

### Dia 6: Página Principal

- [ ] **Criar `CronogramaPage.tsx`**
  - [ ] Importar `MainLayout`
  - [ ] Usar hook `useCronograma()`
  - [ ] Loading state
  - [ ] Error state
  - [ ] Estrutura básica (toolbar, filtros, gantt)

- [ ] **Adicionar Rota**
  - [ ] Editar `src/routes/routes.tsx`
  - [ ] Adicionar rota `/cronograma/:projetoId`
  - [ ] Proteger com `ProtectedRoute`

- [ ] **Testar Navegação**
  - [ ] Acessar /cronograma/123
  - [ ] Verificar loading
  - [ ] Verificar estrutura renderizada

### Dia 7: Gantt Básico

- [ ] **Integrar gantt-task-react**
  ```tsx
  import { Gantt } from 'gantt-task-react';
  import 'gantt-task-react/dist/index.css';
  ```

- [ ] **Renderizar Gantt com Dados Mock**
  - [ ] Criar 3 tarefas mock
  - [ ] Props básicas: `tasks`, `viewMode`
  - [ ] Verificar visualização

- [ ] **Conectar com Dados Reais**
  - [ ] Usar `tasks` do hook
  - [ ] Testar com dados do Supabase

### Dia 8: Toolbar

- [ ] **Criar `CronogramaToolbar.tsx`**
  - [ ] Botão "Adicionar Atividade"
  - [ ] Botão "Exportar"
  - [ ] Selector de visualização (Gantt/Lista)
  - [ ] Selector de escala (Dia/Semana/Mês)
  - [ ] Botão "Atualizar"

- [ ] **Integrar com Store**
  - [ ] `setVisualizacao()`
  - [ ] `setEscala()`

### Dia 9: Task List

- [ ] **Criar `TaskList.tsx`**
  - [ ] Tabela de atividades
  - [ ] Colunas: Nome, Datas, Status, Progresso, Ações
  - [ ] Botões Editar e Excluir
  - [ ] Ordenação por colunas

- [ ] **Visualização Alternativa**
  - [ ] Toggle Gantt/Lista na toolbar
  - [ ] Renderizar condicionalmente

### Dia 10-11: Task Modal

- [ ] **Criar `TaskModal.tsx`**
  - [ ] Estrutura do modal (usar Modal do ui/)
  - [ ] Formulário de criação
    - [ ] Input: Nome (required)
    - [ ] Input: Código
    - [ ] Textarea: Descrição
    - [ ] Select: Tipo (Tarefa, Marco, Fase)
    - [ ] DatePicker: Data Início
    - [ ] DatePicker: Data Fim
    - [ ] Input: Duração (dias)
    - [ ] Select: Responsável
    - [ ] Select: Status
  - [ ] Validações
  - [ ] Botões Salvar/Cancelar

- [ ] **Integrar com Store**
  - [ ] Modo criação: `adicionarAtividade()`
  - [ ] Modo edição: `atualizarAtividade()`
  - [ ] Carregar dados ao editar

- [ ] **Feedback Visual**
  - [ ] Loading ao salvar
  - [ ] Toast de sucesso
  - [ ] Toast de erro

### Dia 12: CRUD Completo

- [ ] **Testar Fluxo Completo**
  - [ ] Criar atividade
  - [ ] Editar atividade
  - [ ] Excluir atividade
  - [ ] Atualizar lista automaticamente

- [ ] **Edge Cases**
  - [ ] Validações de campos
  - [ ] Datas inválidas
  - [ ] Durações negativas

**✅ Entregável Fase 2**: Interface funcional com CRUD completo

---

## 📋 FASE 3: Features Avançadas (Dias 13-19)

### Dia 13: Drag & Drop

- [ ] **Configurar gantt-task-react**
  - [ ] Prop: `onDateChange`
  - [ ] Prop: `onProgressChange`
  - [ ] Prop: `onTaskDelete`

- [ ] **Implementar Handlers**
  - [ ] Atualizar store ao arrastar
  - [ ] Optimistic update
  - [ ] Sincronizar com backend

### Dia 14: Filtros

- [ ] **Criar `CronogramaFilters.tsx`**
  - [ ] Multi-select: Status
  - [ ] Select: Responsável
  - [ ] Select: Setor
  - [ ] Input: Busca (com debounce)
  - [ ] Checkbox: Apenas críticas
  - [ ] Checkbox: Apenas atrasadas
  - [ ] Botão: Limpar filtros

- [ ] **Integrar com Store**
  - [ ] `setFiltros()`
  - [ ] Aplicar filtros em `useMemo`

- [ ] **Contador de Resultados**
  - [ ] "Exibindo X de Y atividades"

### Dia 15-16: Dependências (Parte 1)

- [ ] **Criar `DependencyModal.tsx`**
  - [ ] Select: Atividade origem
  - [ ] Select: Atividade destino
  - [ ] Select: Tipo (FS, SS, FF, SF)
  - [ ] Input: Lag (dias)
  - [ ] Botão: Adicionar

- [ ] **Validações**
  - [ ] Impedir auto-dependência
  - [ ] Detectar dependências circulares
  - [ ] Mensagem de erro clara

- [ ] **Integrar com Store**
  - [ ] `adicionarDependencia()`
  - [ ] `removerDependencia()`

### Dia 17: Dependências (Parte 2)

- [ ] **Visualização de Linhas**
  - [ ] Renderizar SVG conectando tarefas
  - [ ] Diferentes estilos por tipo (FS=sólido, SS=tracejado, etc)
  - [ ] Cores baseadas em status

- [ ] **Interação**
  - [ ] Tooltip ao passar mouse na linha
  - [ ] Click para editar/excluir

### Dia 18: Indicadores Visuais

- [ ] **Cores por Status**
  - [ ] Não iniciada: Cinza
  - [ ] Em andamento: Azul
  - [ ] Concluída: Verde
  - [ ] Paralisada: Laranja
  - [ ] Atrasada: Vermelho

- [ ] **Ícones**
  - [ ] Marco: Diamante
  - [ ] Crítica: Ícone de alerta
  - [ ] Atrasada: Ícone de relógio

### Dia 19: Zoom e Navegação

- [ ] **Controles de Zoom**
  - [ ] Botões +/-
  - [ ] Slider
  - [ ] Shortcuts (Ctrl+scroll)

- [ ] **Navegação**
  - [ ] Botão "Ir para Hoje"
  - [ ] Minimap (opcional)

**✅ Entregável Fase 3**: Interações completas e intuitivas

---

## 📋 FASE 4: Caminho Crítico (Dias 20-24)

### Dia 20-21: Algoritmo CPM

- [ ] **Criar Edge Function**
  ```bash
  supabase functions new calcular-cpm
  ```

- [ ] **Implementar CPM**
  - [ ] Forward Pass (Early Start/Finish)
  - [ ] Backward Pass (Late Start/Finish)
  - [ ] Calcular folgas
  - [ ] Identificar caminho crítico

- [ ] **Testar Algoritmo**
  - [ ] Casos de teste conhecidos
  - [ ] Validar resultados

### Dia 22: Integração CPM

- [ ] **Service Method**
  - [ ] `calcularCaminhoCritico(projetoId)`
  - [ ] Chamar Edge Function
  - [ ] Tratar resposta

- [ ] **Store Integration**
  - [ ] Salvar resultado em `caminhoCritico`
  - [ ] Atualizar flag `caminhoCritico` nas atividades

- [ ] **Recálculo Automático**
  - [ ] Trigger ao mudar duração
  - [ ] Trigger ao mudar dependências
  - [ ] Debounce de 500ms

### Dia 23: Visualização

- [ ] **Destacar Atividades Críticas**
  - [ ] Cor vermelha
  - [ ] Borda mais grossa
  - [ ] Ícone de alerta

- [ ] **Tooltip com Informações**
  - [ ] Folga total
  - [ ] Folga livre
  - [ ] Early Start/Late Finish

### Dia 24: Toggle e Filtro

- [ ] **Botão "Mostrar Apenas Críticas"**
  - [ ] Na toolbar
  - [ ] Filtrar tarefas
  - [ ] Manter contexto visual

- [ ] **Estatísticas**
  - [ ] "X atividades no caminho crítico"
  - [ ] Duração total do projeto

**✅ Entregável Fase 4**: Caminho crítico funcional e visual

---

## 📋 FASE 5: Real-time (Dias 25-29)

### Dia 25: WebSocket Setup

- [ ] **Criar `useCronogramaRealtime.ts`**
  - [ ] Subscribe a atividades
  - [ ] Subscribe a dependências
  - [ ] Cleanup on unmount

- [ ] **Service Integration**
  - [ ] `subscribeToAtividades()`
  - [ ] `subscribeToDependencias()`

### Dia 26: Sync Logic

- [ ] **Handle Insert**
  - [ ] Adicionar nova atividade ao store
  - [ ] Animação de entrada

- [ ] **Handle Update**
  - [ ] Atualizar atividade existente
  - [ ] Merge inteligente (evitar sobrescrever edição local)

- [ ] **Handle Delete**
  - [ ] Remover atividade do store
  - [ ] Animação de saída

### Dia 27: Optimistic Updates

- [ ] **Update Atividade**
  - [ ] Atualizar UI imediatamente
  - [ ] Enviar para backend
  - [ ] Reverter em caso de erro

- [ ] **Conflict Resolution**
  - [ ] Usar timestamps
  - [ ] Priorizar edição mais recente
  - [ ] Notificar usuário de conflito

### Dia 28: Indicadores de Presença

- [ ] **Mostrar Usuários Online**
  - [ ] Lista de avatares no header
  - [ ] Tooltip com nome

- [ ] **Highlight de Edição**
  - [ ] Borda pulsante na tarefa
  - [ ] "Usuário X está editando..."

### Dia 29: Notificações

- [ ] **Toast de Mudanças**
  - [ ] "Atividade X foi atualizada"
  - [ ] Botão "Ver mudança"

- [ ] **Log de Atividades**
  - [ ] Sidebar com histórico
  - [ ] Últimas 20 mudanças

**✅ Entregável Fase 5**: Colaboração em tempo real funcionando

---

## 📋 FASE 6: Exportação e Polish (Dias 30-33)

### Dia 30: Exportação PDF

- [ ] **Criar `ExportMenu.tsx`**
  - [ ] Botão "Exportar"
  - [ ] Menu: PDF / Excel / MS Project

- [ ] **Implementar Export PDF**
  ```typescript
  import jsPDF from 'jspdf';
  import html2canvas from 'html2canvas';
  ```
  - [ ] Capturar screenshot do Gantt
  - [ ] Adicionar tabela de dados
  - [ ] Adicionar cabeçalho/rodapé
  - [ ] Configurar página (A4 landscape)

- [ ] **Download do Arquivo**
  - [ ] Nome: `cronograma-{projeto}-{data}.pdf`

### Dia 31: Exportação Excel

- [ ] **Implementar Export Excel**
  ```typescript
  import XLSX from 'xlsx';
  ```
  - [ ] Criar worksheet com colunas
  - [ ] Exportar todas as atividades
  - [ ] Incluir dependências
  - [ ] Formatação (cores, larguras)

- [ ] **Download do Arquivo**
  - [ ] Nome: `cronograma-{projeto}-{data}.xlsx`

### Dia 32: Testes

- [ ] **Testes Unitários**
  - [ ] `cronogramaStore.test.ts`
  - [ ] `cronogramaService.test.ts`
  - [ ] `useCronograma.test.ts`

- [ ] **Testes de Integração**
  - [ ] Criar atividade E2E
  - [ ] Editar atividade E2E
  - [ ] Criar dependência E2E

- [ ] **Testes de Performance**
  - [ ] 100 atividades
  - [ ] 500 atividades
  - [ ] 1000 atividades

### Dia 33: Polish e Documentação

- [ ] **UX Improvements**
  - [ ] Adicionar tooltips
  - [ ] Melhorar mensagens de erro
  - [ ] Loading skeletons
  - [ ] Empty states

- [ ] **Acessibilidade**
  - [ ] ARIA labels
  - [ ] Navegação por teclado
  - [ ] Contraste de cores

- [ ] **Documentação**
  - [ ] JSDoc em componentes
  - [ ] README com screenshots
  - [ ] Guia de usuário

- [ ] **Code Review**
  - [ ] Refatorar código duplicado
  - [ ] Otimizar performance
  - [ ] ESLint 0 warnings

**✅ Entregável Fase 6**: Feature completa, testada e documentada

---

## 🎯 Checklist Final de Qualidade

### Performance

- [ ] Carregamento <2s (100 atividades)
- [ ] Carregamento <5s (1000 atividades)
- [ ] FPS >30 ao arrastar
- [ ] CPM calcula <500ms

### Funcionalidade

- [ ] CRUD completo funciona
- [ ] Dependências funcionam
- [ ] Caminho crítico correto
- [ ] Real-time sincroniza
- [ ] Exportações geram arquivos válidos

### Qualidade

- [ ] Cobertura de testes >80%
- [ ] TypeScript sem erros
- [ ] ESLint sem warnings
- [ ] Lighthouse >90

### UX

- [ ] Loading states em todas as ações
- [ ] Feedback visual claro
- [ ] Mensagens de erro úteis
- [ ] Responsivo (desktop + tablet)

### Segurança

- [ ] RLS configurado
- [ ] Validações no backend
- [ ] Inputs sanitizados
- [ ] Nenhum dado sensível exposto

---

## 🚀 Deploy Checklist

- [ ] **Staging**
  - [ ] Deploy em ambiente de staging
  - [ ] Testes com usuários beta
  - [ ] Coletar feedback

- [ ] **Produção**
  - [ ] Migrations aplicadas
  - [ ] Edge Functions deployed
  - [ ] Feature flag habilitada
  - [ ] Monitoramento ativo

- [ ] **Pós-Deploy**
  - [ ] Monitorar erros (Sentry)
  - [ ] Monitorar performance
  - [ ] Coletar métricas de uso
  - [ ] Planejar iterações

---

## 📊 Tracking de Progresso

### Progress Bar

```
Fase 1: Fundação              [████████░] 88% (4/5 dias)
Fase 2: Componentes Base      [██████░░░] 66% (4/7 dias)
Fase 3: Features Avançadas    [████░░░░░] 44% (3/7 dias)
Fase 4: Caminho Crítico       [░░░░░░░░░]  0% (0/5 dias)
Fase 5: Real-time             [░░░░░░░░░]  0% (0/5 dias)
Fase 6: Exportação & Polish   [░░░░░░░░░]  0% (0/4 dias)
                              ───────────────────────────
                              Total: 33% (11/33 dias)
```

### Atualizar Diariamente

```bash
# No final de cada dia, atualize este checklist
# Marque [x] nas tarefas completas
# Atualize a progress bar
```

---

<div align="center">

## 🎉 **BOA SORTE NA IMPLEMENTAÇÃO!** 🎉

**Use este checklist diariamente para tracking**

---

**Documentação Completa**: [docs/PLANO_CRONOGRAMA.md](docs/PLANO_CRONOGRAMA.md)  
**Resumo Executivo**: [docs/CRONOGRAMA_RESUMO_EXECUTIVO.md](docs/CRONOGRAMA_RESUMO_EXECUTIVO.md)

---

**Próximo**: Começar Fase 1 - Dia 1 ☝️

</div>

---

**Criado em**: 11 de Novembro de 2024  
**Versão**: 1.0  
**Mantenha este arquivo atualizado durante o desenvolvimento!**

