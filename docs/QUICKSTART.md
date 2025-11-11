# ⚡ Início Rápido - VisionPlan v2.2

## 🚀 5 Minutos para Rodar

### 1️⃣ Instalar (30 segundos)

```bash
cd visionplan
npm install
```

### 2️⃣ Configurar Supabase (2 minutos)

1. Vá em https://supabase.com
2. Crie um novo projeto (grátis)
3. Copie as credenciais:

```bash
cp .env.example .env
```

Edite `.env`:
```env
VITE_SUPABASE_URL=https://xxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3️⃣ Rodar (10 segundos)

```bash
npm run dev
```

Abra: http://localhost:3000

## 🎨 Testar Sistema de Temas

### Opção 1: Via Interface (ADMIN)

1. Login como ADMIN
2. Ir em **Configurações** (menu lateral)
3. Seção **Personalização de Tema**
4. Clicar em um tema pré-definido
5. Ou escolher cores customizadas
6. **Salvar Tema**
7. 🎉 Ver a interface mudar!

### Opção 2: Via Código

```typescript
// Em qualquer componente
import { useAppStore } from './store/appStore';

const Component = () => {
  const setTema = useAppStore((state) => state.setTema);
  
  // Aplicar tema verde
  setTema({
    corPrimaria: '#10b981',
    corSecundaria: '#059669'
  });
};
```

## 📱 Testar Funcionalidades

### Dashboard (RF004)
```
http://localhost:3000/dashboard
```
- Ver KPIs em tempo real
- Clicar em "Modo Apresentação"

### Kanban (RF010-RF012)
```
http://localhost:3000/kanban
```
- Arrastar tarefas entre colunas
- Ver atualização automática

### Configurações
```
http://localhost:3000/configuracoes
```
- Mudar tema (ADMIN only)
- Ver informações do sistema

## 🎭 Usuários de Teste

Crie no Supabase Auth:

| Perfil | Email | Camada |
|--------|-------|--------|
| Admin | admin@teste.com | PROPONENTE |
| Fiscal | fiscal@teste.com | FISCALIZACAO |
| Contratada | obra@teste.com | CONTRATADA |

## 🗄️ Criar Banco de Dados

No SQL Editor do Supabase, cole o schema Prisma fornecido ou:

```sql
-- Tabela de empresas
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  empresa_id UUID REFERENCES empresas(id),
  camada_governanca TEXT NOT NULL,
  perfil_acesso TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ... mais tabelas (ver schema completo)
```

## 🎯 Fluxo de Teste Recomendado

### Teste 1: Login e Dashboard
1. Abrir http://localhost:3000
2. Fazer login
3. Ver Dashboard com KPIs
4. Clicar "Modo Apresentação"
5. Ver tela cheia
6. Sair do modo

### Teste 2: Kanban
1. Ir em Kanban (menu lateral)
2. Arrastar uma tarefa de "A Fazer" para "Fazendo"
3. Ver atualização do status
4. Arrastar para "Concluído"

### Teste 3: Temas (ADMIN)
1. Ir em Configurações
2. Seção "Personalização de Tema"
3. Clicar em "Verde Sustentável"
4. Ver toda interface ficar verde
5. Clicar em "Roxo Inovação"
6. Ver toda interface ficar roxa
7. Escolher cor customizada
8. Salvar tema

## 🔥 Demonstração Visual

### Tema Azul (Padrão)
```
Cor Primária: #0ea5e9 (Azul céu)
Cor Secundária: #0284c7 (Azul escuro)
```

### Tema Verde (Sustentável)
```
Cor Primária: #10b981 (Verde esmeralda)
Cor Secundária: #059669 (Verde escuro)
```

### Tema Laranja (Energia)
```
Cor Primária: #f97316 (Laranja vibrante)
Cor Secundária: #ea580c (Laranja escuro)
```

## 📊 Verificar se Está Funcionando

Abra o console do navegador (F12):

```javascript
// Verificar estado global
localStorage.getItem('visionplan-storage')

// Deve mostrar:
// {
//   "state": {
//     "tema": {
//       "corPrimaria": "#0ea5e9",
//       "corSecundaria": "#0284c7"
//     },
//     "usuario": {...},
//     ...
//   }
// }
```

## 🐛 Troubleshooting Rápido

### Erro: "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### Erro: "Supabase connection"
- Verificar `.env`
- Verificar credenciais no Supabase

### Tema não muda
```javascript
// Limpar localStorage
localStorage.clear()
// Recarregar página
location.reload()
```

### Porta 3000 ocupada
```bash
# Alterar porta em vite.config.ts
server: {
  port: 3001
}
```

## 📚 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `ENTREGA.md` | **Leia primeiro!** Visão geral completa |
| `INSTALL.md` | Guia de instalação detalhado |
| `ARCHITECTURE.md` | Arquitetura e funcionalidades |
| `README.md` | Documentação principal |

## 🎓 Próximos Passos

Após rodar:

1. ✅ Explorar Dashboard
2. ✅ Testar Kanban
3. ✅ Mudar tema (ADMIN)
4. 📖 Ler `ARCHITECTURE.md`
5. 🚀 Implementar mais funcionalidades

## 💡 Dica Pro

Para ver o tema em ação, abra duas janelas:

1. Janela 1: Dashboard
2. Janela 2: Configurações
3. Mude o tema na janela 2
4. Veja a janela 1 atualizar automaticamente! 🎨

## 🆘 Precisa de Ajuda?

1. Leia `ENTREGA.md` - Explicação completa
2. Leia `INSTALL.md` - Passo a passo detalhado
3. Veja exemplos no código
4. Abra uma issue no GitHub

## ⭐ Funcionalidades Destaque

✨ **Sistema de Temas**: Único e inovador  
🔄 **Real-time**: WebSockets do Supabase  
📱 **Responsivo**: Mobile-first design  
🎯 **TypeScript**: Type-safe end-to-end  
🚀 **Performance**: Otimizado com Vite  

---

**VisionPlan v2.2** - Comece em 5 minutos! ⚡

Bom desenvolvimento! 🚀
