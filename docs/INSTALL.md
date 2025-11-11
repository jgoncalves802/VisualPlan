# 🚀 Guia de Instalação e Deploy - VisionPlan v2.2

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (https://supabase.com)
- Git instalado
- Editor de código (VS Code recomendado)

## 🛠️ Instalação Local

### 1. Clonar/Extrair o Projeto

```bash
cd visionplan
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui
VITE_APP_NAME=VisionPlan
VITE_APP_VERSION=2.2.0
```

**Como obter as credenciais do Supabase:**

1. Acesse https://supabase.com
2. Crie uma nova organização/projeto
3. Vá em Settings → API
4. Copie o "Project URL" e o "anon public" key

### 4. Configurar Banco de Dados no Supabase

#### Opção A: Interface Web do Supabase

1. Acesse seu projeto no Supabase
2. Vá em "SQL Editor"
3. Cole o schema SQL completo (disponível em `/database/schema.sql`)
4. Execute o script

#### Opção B: CLI do Supabase

```bash
npm install -g supabase
supabase login
supabase db push
```

### 5. Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em: http://localhost:3000

## 🗄️ Schema do Banco de Dados

O schema completo está no arquivo Prisma fornecido. Principais tabelas:

- `empresas` - Multi-tenant
- `usuarios` - Com camadas de governança
- `projetos` - Projetos de obras
- `atividades` - WBS/EAP
- `restricoes` - Gestão de restrições (RF014)
- `tarefas_usuarios` - Kanban (RF010)
- `planos_semanais_trabalho` - LPS (RF015)
- E mais 20+ tabelas...

## 🎨 Customização de Temas (ADMIN)

### Como Configurar Tema para um Cliente

1. Faça login como ADMIN
2. Vá em **Configurações → Personalização**
3. Escolha um tema pré-definido OU
4. Selecione cores customizadas:
   - Cor Primária: Cor principal da marca
   - Cor Secundária: Cor complementar
5. Clique em **Salvar Tema**

O tema é salvo no banco de dados vinculado à empresa e aplicado automaticamente para todos os usuários daquela empresa.

### Temas Pré-definidos Disponíveis

- **Azul Profissional** (padrão)
- **Verde Sustentável**
- **Laranja Energia**
- **Roxo Inovação**
- **Vermelho Ação**

## 👥 Criando Usuários

### Via Supabase Auth (Recomendado)

1. No dashboard do Supabase, vá em Authentication → Users
2. Clique em "Add User"
3. Preencha email e senha temporária
4. Após criar no Auth, insira na tabela `usuarios`:

```sql
INSERT INTO usuarios (
  nome,
  email,
  empresaId,
  camadaGovernanca,
  perfilAcesso
) VALUES (
  'João Silva',
  'joao@empresa.com',
  'uuid-da-empresa',
  'CONTRATADA',
  'ENGENHEIRO_PLANEJAMENTO'
);
```

### Camadas de Governança

- **PROPONENTE**: Governança estratégica
- **FISCALIZACAO**: Qualidade e liberação
- **CONTRATADA**: Execução

### Perfis de Acesso

- ADMIN
- DIRETOR
- GERENTE_PROJETO
- ENGENHEIRO_PLANEJAMENTO
- COORDENADOR_OBRA
- MESTRE_OBRAS
- ENCARREGADO
- COLABORADOR
- FISCALIZACAO_LEAD
- FISCALIZACAO_TECNICO

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão em `/dist`

## 🌐 Deploy

### Opção 1: Vercel (Recomendado)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Configure as variáveis de ambiente no dashboard da Vercel.

### Opção 2: Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Opção 3: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

```bash
docker build -t visionplan:latest .
docker run -p 3000:3000 visionplan:latest
```

## 🔐 Segurança

### Row Level Security (RLS) no Supabase

Habilite RLS para todas as tabelas:

```sql
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
-- Repita para todas as tabelas
```

### Políticas de Acesso Exemplo

```sql
-- Usuários só veem dados da sua empresa
CREATE POLICY "usuarios_empresa"
ON usuarios FOR ALL
USING (empresaId = auth.uid());

-- Fiscalização pode criar restrições impeditivas
CREATE POLICY "fiscalizacao_restricoes"
ON restricoes FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM usuarios 
    WHERE camadaGovernanca = 'FISCALIZACAO'
  )
);
```

## 🧪 Testes

### Dados de Teste

Execute o script de seed:

```bash
npm run seed
```

Isso criará:
- 1 empresa exemplo
- 3 usuários (um de cada camada)
- 1 projeto
- 10 atividades
- 5 restrições
- 10 tarefas no Kanban

### Credenciais de Teste

- **Admin**: admin@visionplan.com / admin123
- **Fiscalização**: fiscal@visionplan.com / fiscal123
- **Contratada**: contratada@visionplan.com / contratada123

## 📱 Real-time

O VisionPlan usa Supabase Realtime para atualizações em tempo real:

- Dashboard atualiza KPIs automaticamente
- Kanban sincroniza entre usuários
- Notificações instantâneas

## 🔧 Troubleshooting

### Erro: "Invalid Supabase URL"

Verifique se as variáveis de ambiente estão corretas no `.env`

### Erro: "Permission denied"

Configure as políticas RLS no Supabase

### Tema não aplica

Limpe o localStorage:
```javascript
localStorage.clear()
```

## 📞 Suporte

- Documentação: https://docs.visionplan.com
- Email: suporte@visionplan.com
- GitHub Issues: https://github.com/empresa/visionplan/issues

## 📄 Licença

Propriedade da [Sua Empresa]. Todos os direitos reservados.

---

**VisionPlan v2.2** - Gestão de Obras com IA e Real-time
