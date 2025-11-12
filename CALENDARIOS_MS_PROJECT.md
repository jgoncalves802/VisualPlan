# 📅 Calendários - Versão MS Project Completa

## 🎯 Implementação Baseada no MS Project

O modal de **Calendários** foi completamente redesenhado para replicar a funcionalidade e interface do **Microsoft Project**, oferecendo controle total sobre períodos de trabalho.

---

## ✨ Funcionalidades Implementadas

### 1. **Interface Dividida (MS Project Style)**

```
┌─────────────────────────────────────────────────────────┐
│  [Alterar Período de Trabalho]                 [X]     │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  SIDEBAR     │  ÁREA DE CONFIGURAÇÃO                    │
│  (Calendários)  (Horários e Exceções)                   │
│              │                                          │
│  • Padrão 5x8│  ✓ Segunda-feira                        │
│  • Intensivo │    De: 08:00  Até: 12:00                │
│  ★ 24x7      │    De: 13:00  Até: 17:00                │
│              │                                          │
│  [Novo...]   │  □ Domingo                               │
│  [Copiar...] │    Não trabalhando                       │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

---

### 2. **Configuração Detalhada de Dias da Semana**

#### Para cada dia da semana você pode:

✅ **Marcar como dia útil ou não útil**
- Checkbox para ativar/desativar trabalho

✅ **Definir múltiplos períodos de trabalho**
- **Período 1:** 08:00 - 12:00 (manhã)
- **Período 2:** 13:00 - 17:00 (tarde)
- **Período 3+:** Adicionar quantos períodos precisar

✅ **Calcular horas automaticamente**
- Total de horas exibido para cada dia
- Ex: 8h, 4h30min, etc.

---

### 3. **Períodos de Trabalho Personalizados**

#### Exemplos de Configurações:

**📋 Padrão 5x8:**
```
Segunda a Sexta:
  08:00 - 12:00 (4h)
  13:00 - 17:00 (4h)
  Total: 8h/dia

Sábado/Domingo: Não trabalhando
```

**📋 Turno Noturno:**
```
Segunda a Sexta:
  22:00 - 06:00 (8h)
  Total: 8h/dia

Sábado/Domingo: Não trabalhando
```

**📋 Plantão 12x36:**
```
Dia 1:
  07:00 - 19:00 (12h)
  Total: 12h

Dia 2: Não trabalhando
```

**📋 Horário Flexível:**
```
Segunda:
  08:00 - 12:00 (4h)
  14:00 - 18:00 (4h)
  
Terça:
  09:00 - 13:00 (4h)
  15:00 - 19:00 (4h)

Cada dia pode ter horários diferentes!
```

---

### 4. **Exceções (Feriados e Dias Especiais)**

#### Adicione dias que não seguem o padrão semanal:

✅ **Feriados nacionais**
```
25/12/2024 - Natal (Não trabalhando)
01/01/2025 - Ano Novo (Não trabalhando)
21/04/2025 - Tiradentes (Não trabalhando)
```

✅ **Dias especiais**
```
24/12/2024 - Véspera de Natal (Meio período: 08:00 - 12:00)
31/12/2024 - Véspera de Ano Novo (Meio período: 08:00 - 12:00)
```

✅ **Pontos facultativos**
```
Carnaval, Corpus Christi, etc.
```

---

### 5. **Gestão de Múltiplos Calendários**

#### Criar calendários para diferentes situações:

📅 **Calendário Padrão (Administrativo)**
- Segunda a Sexta: 8h/dia
- Para áreas de escritório

📅 **Calendário de Obra (Campo)**
- Segunda a Sábado: 8h/dia
- Para equipes de campo

📅 **Calendário Intensivo (Prazo Apertado)**
- Segunda a Sábado: 10h/dia
- Para fases críticas

📅 **Calendário 24x7 (Operação Contínua)**
- Todos os dias: 24h/dia
- Para operações ininterruptas

---

## 🎨 Interface Detalhada

### **Modo Visualização:**

```
┌─────────────────────────────────────────────────────┐
│ 📋 Padrão 5x8                                       │
│ Segunda a Sexta, 8 horas por dia                    │
│                                                     │
│ ⏰ Horários de Trabalho                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Dia          │ Horário              │ Horas     │ │
│ ├──────────────┼─────────────────────┼───────────┤ │
│ │ Segunda      │ 08:00-12:00, 13:00-17:00 │ 8h  │ │
│ │ Terça        │ 08:00-12:00, 13:00-17:00 │ 8h  │ │
│ │ Quarta       │ 08:00-12:00, 13:00-17:00 │ 8h  │ │
│ │ Quinta       │ 08:00-12:00, 13:00-17:00 │ 8h  │ │
│ │ Sexta        │ 08:00-12:00, 13:00-17:00 │ 8h  │ │
│ │ Sábado       │ Não trabalhando          │ -   │ │
│ │ Domingo      │ Não trabalhando          │ -   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Excluir] [Definir como Padrão] [Editar...]        │
└─────────────────────────────────────────────────────┘
```

### **Modo Edição:**

```
┌─────────────────────────────────────────────────────┐
│ Nome: [___________________________] *               │
│                                                     │
│ ✓ Segunda-feira                           8h       │
│   De: [08:00] Até: [12:00]                         │
│   De: [13:00] Até: [17:00]                         │
│   + Adicionar período                               │
│                                                     │
│ ✓ Terça-feira                             8h       │
│   De: [08:00] Até: [12:00]                         │
│   De: [13:00] Até: [17:00]                         │
│   + Adicionar período                               │
│                                                     │
│ □ Sábado                                  0h       │
│   Não trabalhando                                   │
│                                                     │
│ Exceções (Feriados):                                │
│   [Data] [Nome] [+]                                 │
│   • 25/12/2024 - Natal [🗑️]                        │
│   • 01/01/2025 - Ano Novo [🗑️]                     │
│                                                     │
│ [Cancelar]                          [✓ OK]          │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Como Usar

### **1. Abrir o Modal:**
```
Menu → Gantt/Cronograma → Toolbar → Botão "Calendários" (roxo)
```

### **2. Criar Novo Calendário:**

**Passo 1:** Clique em **"Novo..."**

**Passo 2:** Digite o nome
```
Nome: Obra - Turno Manhã
```

**Passo 3:** Configure os dias úteis
```
✓ Segunda-feira
  De: 06:00  Até: 14:00
  Total: 8h

✓ Terça-feira
  De: 06:00  Até: 14:00
  Total: 8h

... (repita para outros dias)

□ Sábado (desmarcar se não trabalha)
□ Domingo (desmarcar se não trabalha)
```

**Passo 4:** Adicionar exceções (opcional)
```
25/12/2024 - Natal
01/01/2025 - Ano Novo
```

**Passo 5:** Clique em **"OK"**

### **3. Copiar Calendário Existente:**

**Passo 1:** Selecione um calendário da lista

**Passo 2:** Clique em **"Copiar..."**

**Passo 3:** Modifique conforme necessário

**Passo 4:** Clique em **"OK"**

### **4. Definir Calendário Padrão:**

**Passo 1:** Selecione o calendário

**Passo 2:** Clique em **"Definir como Padrão"**

**Resultado:** Estrela dourada ★ aparece ao lado do nome

---

## 💡 Conceitos Importantes

### **🕒 Horas Fora do Calendário = Sem Produção**

Todas as horas que estiverem **fora dos períodos definidos** são consideradas **sem produção**.

**Exemplo:**

```
Calendário: 08:00 - 17:00 (8h com 1h de almoço)

Tarefa de 16h:
• Início: 01/01 às 08:00
• Produção: 8h no dia 01/01
• Pausa: 17:00 até 08:00 do dia seguinte (SEM PRODUÇÃO)
• Produção: 8h no dia 02/01
• Fim: 02/01 às 17:00

Total: 2 dias corridos, 16h de trabalho efetivo
```

### **📅 Calendário vs. Atividade**

- **Calendário do Projeto:** Define o padrão geral
- **Calendário da Atividade:** Pode sobrepor o padrão

**Exemplo:**
```
Projeto: Segunda a Sexta (5 dias)
Atividade "Concretagem": Sábado incluído (6 dias)

Resultado: Essa atividade específica trabalha no sábado,
           mas as outras seguem o calendário do projeto.
```

---

## 📊 Cálculo Automático de Horas

O sistema calcula automaticamente:

✅ **Horas por dia**
```
Período 1: 08:00 - 12:00 = 4h
Período 2: 13:00 - 17:00 = 4h
Total: 8h
```

✅ **Horas por semana**
```
5 dias úteis × 8h = 40h/semana
```

✅ **Duração de tarefas**
```
Tarefa de 80h com calendário 8h/dia = 10 dias úteis
```

---

## 🎯 Casos de Uso

### **1. Obra em 2 Turnos:**

**Turno 1 (Manhã):**
```
Segunda a Sexta: 06:00 - 14:00
Sábado: 06:00 - 12:00
```

**Turno 2 (Tarde):**
```
Segunda a Sexta: 14:00 - 22:00
Sábado: Não trabalha
```

### **2. Projeto Internacional (Fuso Horário):**

**Brasil (GMT-3):**
```
Segunda a Sexta: 09:00 - 18:00
```

**Europa (GMT+1):**
```
Segunda a Sexta: 08:00 - 17:00
```

### **3. Manutenção Preventiva:**

**Calendário Normal:**
```
Segunda a Sexta: 08:00 - 17:00
```

**Exceção - Manutenção (1º sábado do mês):**
```
Sábado: 08:00 - 12:00 (4h)
```

---

## 📂 Persistência

✅ **Todos os calendários são salvos no `localStorage`**

✅ **Calendários padrão do sistema não podem ser excluídos**

✅ **Calendário padrão marcado com ★**

✅ **Ao criar nova tarefa, usa o calendário padrão automaticamente**

---

## 🎨 Elementos Visuais

### **Cores e Ícones:**

| Elemento | Cor | Significado |
|----------|-----|-------------|
| 📅 Calendário Selecionado | Azul | Calendário ativo na edição |
| ★ Estrela Dourada | Amarelo | Calendário padrão |
| ✓ Checkbox Marcado | Verde | Dia de trabalho |
| □ Checkbox Desmarcado | Cinza | Dia sem trabalho |
| 🔴 Exceção | Vermelho | Feriado/Dia especial |
| 🗑️ Trash | Vermelho | Excluir item |

---

## 🔧 Recursos Técnicos

### **Arquivos Modificados:**

1. **`src/components/features/cronograma/CalendariosModal.tsx`**
   - Reescrito completamente
   - **771 linhas** de código
   - Interface baseada no MS Project
   - Suporte a múltiplos períodos por dia
   - Sistema de exceções completo

### **Recursos Implementados:**

✅ Estado local para múltiplos períodos
✅ Cálculo automático de horas
✅ Validação de formulário
✅ Interface responsiva
✅ Modo visualização + edição
✅ Copiar calendário
✅ Sistema de exceções (feriados)
✅ Persistência no localStorage

---

## 📊 Estatísticas

```
┌─────────────────────────────────────┐
│ 📈 ESTATÍSTICAS DO CALENDÁRIOS      │
├─────────────────────────────────────┤
│ Linhas de código: 771               │
│ Interfaces: 3                       │
│ Estados locais: 6                   │
│ Funcionalidades: 15+                │
│ Compatibilidade: MS Project         │
│ Status: 100% Funcional              │
└─────────────────────────────────────┘
```

---

## ✅ Checklist de Funcionalidades

### **Gestão de Calendários:**
- [x] Criar novo calendário
- [x] Editar calendário existente
- [x] Copiar calendário
- [x] Excluir calendário
- [x] Definir calendário padrão
- [x] Visualizar lista de calendários

### **Configuração de Dias:**
- [x] Marcar/desmarcar dia como útil
- [x] Adicionar múltiplos períodos de trabalho
- [x] Remover períodos de trabalho
- [x] Editar horário de início/fim
- [x] Calcular horas automaticamente
- [x] Suporte a horários 24h

### **Exceções:**
- [x] Adicionar feriado
- [x] Adicionar dia especial
- [x] Remover exceção
- [x] Nomear exceções
- [x] Marcar exceção como trabalhando/não trabalhando

### **Interface:**
- [x] Layout de 2 colunas (MS Project)
- [x] Modo visualização
- [x] Modo edição
- [x] Sidebar com lista de calendários
- [x] Área principal de configuração
- [x] Footer informativo
- [x] Ícones e cores adequados
- [x] Responsivo

---

## 🎉 Resultado Final

```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║  ✅ CALENDÁRIOS - VERSÃO MS PROJECT COMPLETA     ║
║                                                   ║
║  ✅ Interface idêntica ao MS Project             ║
║  ✅ Múltiplos períodos por dia                   ║
║  ✅ Exceções (feriados)                          ║
║  ✅ Cálculo automático de horas                  ║
║  ✅ Gestão completa de calendários               ║
║  ✅ Copiar calendários                           ║
║  ✅ Calendário padrão                            ║
║                                                   ║
║  🚀 Sistema Profissional e Completo!             ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

**Desenvolvido com ❤️ para o VisionPlan**  
**Data:** 12 de Novembro de 2025  
**Status:** ✅ PRODUÇÃO  
**Versão:** 4.0 - MS Project Edition

