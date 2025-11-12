# 🚀 Quick Start - DHTMLX Gantt no VisionPlan

## ⚡ Início Rápido

### 1. Acesse o Cronograma
```
Navegue para: Menu → "Gantt / Cronograma"
```

### 2. Explore a Nova Toolbar de Extensões
No topo da página do cronograma, você verá uma **barra azul** com todas as funcionalidades avançadas:

```
┌─────────────────────────────────────────────────────────────────┐
│  [←][→]  [−][+][⊡]  [⚡Crítico][⏰Auto]  [👁️Visualização]        │
│  [🔧Ferramentas]  [📥Exportar]  [⛶Tela Cheia]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Funcionalidades Principais

### ✏️ Desfazer/Refazer
- **Desfazer**: Ctrl+Z ou botão ←
- **Refazer**: Ctrl+Y ou botão →

### 🔍 Zoom
- **Zoom In**: Botão + ou tecla +
- **Zoom Out**: Botão - ou tecla -
- **Ajustar à Tela**: Botão ⊡

### ⚡ Caminho Crítico
1. Clique no botão **"Crítico"**
2. Tarefas críticas ficam vermelhas
3. Clique novamente para desativar

### ⏰ Auto-scheduling
1. Clique no botão **"Auto"**
2. O sistema recalcula datas automaticamente
3. Respeita dependências entre tarefas

---

## 👁️ Menu Visualização

### 📊 Linha de Base (Baseline)
```
Visualização → Linha de Base (Baseline)
```
- Mostra uma barra cinza sob cada tarefa
- Compara planejado vs. realizado

### 📍 Prazos Finais (Deadlines)
```
Visualização → Prazos Finais (Deadlines)
```
- Mostra um triângulo vermelho indicando o prazo
- Útil para alertas visuais

### 📏 Calcular Folga (Slack Time)
```
Visualização → Calcular Folga (Slack Time)
```
- Calcula quantos dias você pode atrasar sem impactar o projeto

### 📌 Adicionar Marcador
```
Visualização → Adicionar Marcador
```
- Marca uma data importante na timeline
- Exemplos: Reunião, Milestone, Evento

---

## 🔧 Menu Ferramentas

### Ordenar Tarefas
```
Ferramentas → Ordenar por → [opção]
```
Opções:
- Nome (A-Z)
- Data de Início
- Duração
- Progresso

### Agrupar Tarefas
```
Ferramentas → Agrupar por → [opção]
```
Opções:
- Nenhum (remover agrupamento)
- Status
- Responsável
- Tipo

**Exemplo de uso:**
1. Clique em "Ferramentas"
2. "Agrupar por" → "Status"
3. Tarefas são agrupadas automaticamente

---

## 📥 Menu Exportar

### Formatos Disponíveis
```
Exportar → [formato]
```

| Formato | Uso |
|---------|-----|
| **PDF** | Documento visual do cronograma |
| **PNG** | Imagem para apresentações |
| **Excel** | Planilha com dados |
| **MS Project** | Importar no Microsoft Project |
| **Primavera P6** | Importar no Primavera |
| **iCalendar** | Sincronizar com calendário |

---

## 🎹 Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+Z` | Desfazer |
| `Ctrl+Y` | Refazer |
| `+` | Zoom In |
| `-` | Zoom Out |
| `F11` | Tela Cheia |
| `Setas` | Navegar |
| `Enter` | Editar |
| `Delete` | Excluir |

---

## 🖱️ Interações com o Mouse

### Arrastar e Soltar
- **Arrastar tarefa** = Mover para outra data
- **Arrastar bordas** = Alterar duração
- **Arrastar barra de progresso** = Alterar % de conclusão
- **Arrastar entre tarefas** = Criar dependência

### Cliques
- **Clique simples** = Selecionar tarefa (mostra QuickInfo)
- **Duplo clique** = Abrir formulário de edição
- **Shift+Click** = Selecionar múltiplas tarefas
- **Ctrl+Click** = Adicionar à seleção

---

## 🎨 Personalização Visual

### Tipos de Tarefas e Cores
- **📋 Tarefa** = Azul
- **📁 Fase/Projeto** = Roxo (mais escuro)
- **📍 Marco** = Diamante laranja
- **⚠️ Crítica** = Vermelho

### Status
- **✅ Concluída** = Verde
- **⏳ Em Andamento** = Azul
- **🚫 Atrasada** = Vermelho
- **⏸️ Não Iniciada** = Cinza

---

## 📊 WBS (Estrutura de Decomposição)

### Códigos EDT Automáticos
Cada tarefa recebe automaticamente um código EDT:
```
1         - Projeto Principal
1.1       - Fase 1
1.1.1     - Tarefa 1 da Fase 1
1.1.2     - Tarefa 2 da Fase 1
1.2       - Fase 2
1.2.1     - Tarefa 1 da Fase 2
```

### Hierarquia Visual
- **Ícones**:
  - 📁 = Fase/Pasta
  - 📋 = Tarefa
  - 📍 = Marco
- **Indentação** = Mostra níveis hierárquicos
- **+/−** = Expandir/Colapsar grupos

---

## 🕐 Calendários de Trabalho

### Calendários Disponíveis
1. **Padrão 5x8** (Seg-Sex, 8h/dia)
2. **Intensivo 6x8** (Seg-Sáb, 8h/dia)
3. **24x7** (Todos os dias, 24h)

### Como Usar
1. Ao criar/editar uma tarefa
2. Selecione o "Calendário do Trabalho"
3. A duração será calculada respeitando o calendário

---

## 💡 Dicas e Truques

### 1. Caminho Crítico sempre Visível
```
Mantenha o "Crítico" ativado para sempre ver as tarefas mais importantes
```

### 2. Use Baselines para Comparar
```
Defina baseline_start e baseline_end nas tarefas
Ative "Linha de Base" para ver o planejado vs. realizado
```

### 3. Agrupe por Status para Revisões
```
Durante reuniões de status, agrupe por "Status"
Facilita ver o que está atrasado, concluído, etc.
```

### 4. Exporte para Apresentações
```
Use "Exportar → PNG" para criar imagens para slides
Use "Exportar → PDF" para documentos formais
```

### 5. Calcule Folga Regularmente
```
Use "Calcular Folga" para identificar onde você tem margem
Tarefas com folga = 0 são críticas!
```

---

## 🐛 Solução de Problemas

### Problema: Não consigo arrastar tarefas
**Solução**: Verifique se "permitir_edicao_drag" está ativado nas configurações.

### Problema: Caminho crítico não aparece
**Solução**: Certifique-se de que as tarefas têm dependências definidas.

### Problema: Auto-scheduling não funciona
**Solução**: Verifique se as tarefas têm links (dependências) entre elas.

### Problema: Exportação falha
**Solução**: Verifique a conexão com a internet (algumas exportações precisam de API externa).

---

## 📞 Suporte

### Documentação Completa
```
Leia: DHTMLX_GANTT_FUNCIONALIDADES_COMPLETAS.md
```

### Documentação Oficial DHTMLX
- [docs.dhtmlx.com/gantt](https://docs.dhtmlx.com/gantt/)

### Fórum DHTMLX
- [forum.dhtmlx.com](https://forum.dhtmlx.com/)

---

## ✅ Checklist de Verificação

Antes de começar um novo projeto, verifique:

- [ ] Todas as tarefas têm datas de início e fim
- [ ] Tarefas têm dependências definidas (FS, SS, FF, SF)
- [ ] Responsáveis atribuídos
- [ ] Calendário de trabalho configurado
- [ ] Baseline definida (se aplicável)
- [ ] Deadlines marcadas (se aplicável)

---

## 🎉 Comece Agora!

1. ✅ Acesse a aba "Gantt / Cronograma"
2. ✅ Explore a Toolbar de Extensões
3. ✅ Crie algumas tarefas
4. ✅ Adicione dependências
5. ✅ Ative o "Caminho Crítico"
6. ✅ Exporte para PDF

**Divirta-se! 🚀**

---

**VisionPlan - Sistema Profissional de Gerenciamento de Projetos**

