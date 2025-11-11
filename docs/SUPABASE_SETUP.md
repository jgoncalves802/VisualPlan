# Guia de Configuração do Supabase para VisionPlan

## 1. Criação do Projeto

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Escolha uma região próxima aos seus usuários
4. Anote a **URL do projeto** e a **anon key**

## 2. Configuração do Banco de Dados

### 2.1. Executar o Schema

No Supabase Dashboard, vá para **SQL Editor** e execute o schema SQL gerado a partir do Prisma.

O schema inclui todas as tabelas necessárias:
- empresas
- usuarios
- projetos
- atividades
- restricoes
- acoes_tratativa
- planos_semanais_trabalho
- tarefas_usuarios
- notificacoes
- modelos_bim
- elementos_bim
- checklists_qualidade
- riscos
- mudancas_escopo
- licoes_aprendidas
- documentos
- historico_atividades
- E mais...

### 2.2. Tabela de Temas Customizados

Adicione a tabela para o sistema de temas:

```sql
CREATE TABLE temas_customizados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  colors JSONB NOT NULL,
  logo TEXT,
  logo_secundario TEXT,
  favicon TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_temas_empresa ON temas_customizados(empresa_id);
CREATE INDEX idx_temas_ativo ON temas_customizados(ativo);

-- Apenas um tema ativo por empresa
CREATE UNIQUE INDEX idx_temas_empresa_ativo ON temas_customizados(empresa_id) 
WHERE ativo = true;
```

## 3. Configuração de Autenticação

### 3.1. Habilitar Provedores

No Dashboard do Supabase, vá para **Authentication > Providers**:

1. **Email**: Já está habilitado por padrão
2. Configure políticas de senha:
   - Mínimo 8 caracteres
   - Requer letra maiúscula
   - Requer número
   - Requer caractere especial

### 3.2. Row Level Security (RLS)

Execute as políticas de segurança:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
-- ... (repetir para todas as tabelas)

-- Política: Usuários podem ver apenas dados da sua empresa
CREATE POLICY "usuarios_podem_ver_propria_empresa" ON empresas
FOR SELECT USING (
  id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- Política: Usuários podem ver projetos da sua empresa
CREATE POLICY "usuarios_podem_ver_projetos_empresa" ON projetos
FOR SELECT USING (
  empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  )
);

-- Política: Admins podem gerenciar temas
CREATE POLICY "admins_podem_gerenciar_temas" ON temas_customizados
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND perfil_acesso = 'ADMIN'
    AND empresa_id = temas_customizados.empresa_id
  )
);

-- Adicione políticas similares para todas as tabelas
```

## 4. Configuração de Storage

### 4.1. Criar Buckets

No Dashboard, vá para **Storage** e crie os seguintes buckets:

1. **modelos-bim**: Para arquivos IFC, FBX, DWG
   - Público: Não
   - Tamanho máximo: 500 MB por arquivo

2. **documentos**: Para PDFs, fotos, vídeos
   - Público: Não
   - Tamanho máximo: 100 MB por arquivo

3. **logos**: Para logos das empresas
   - Público: Sim
   - Tamanho máximo: 5 MB por arquivo

### 4.2. Políticas de Storage

```sql
-- Usuários podem fazer upload de logos (apenas ADMINs)
CREATE POLICY "admins_podem_upload_logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' AND
  auth.uid() IN (
    SELECT id FROM usuarios WHERE perfil_acesso = 'ADMIN'
  )
);

-- Todos podem ver logos
CREATE POLICY "logos_publicos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

-- Usuários da empresa podem ver modelos BIM
CREATE POLICY "usuarios_podem_ver_bim_empresa" ON storage.objects
FOR SELECT USING (
  bucket_id = 'modelos-bim' AND
  (storage.foldername(name))[1] IN (
    SELECT empresa_id::text FROM usuarios WHERE id = auth.uid()
  )
);
```

## 5. Configuração de Real-time

### 5.1. Habilitar Real-time

No Dashboard, vá para **Database > Replication**:

1. Habilite replicação para as seguintes tabelas:
   - `atividades`
   - `restricoes`
   - `acoes_tratativa`
   - `tarefas_usuarios`
   - `notificacoes`
   - `planos_semanais_trabalho`

### 5.2. Configurar Broadcasts

```sql
-- Trigger para notificar mudanças em atividades
CREATE OR REPLACE FUNCTION notify_atividade_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'atividade_changed',
    json_build_object(
      'operation', TG_OP,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER atividade_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON atividades
FOR EACH ROW EXECUTE FUNCTION notify_atividade_change();
```

## 6. Edge Functions (Opcional)

### 6.1. Função para Cálculo de PAC

```typescript
// supabase/functions/calculate-pac/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { planoSemanalId } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Buscar atividades do PST
  const { data: atividades } = await supabase
    .from('atividades_plano_semanal')
    .select('*')
    .eq('plano_semanal_id', planoSemanalId)
  
  const totalPlanejadas = atividades?.length || 0
  const totalConcluidas = atividades?.filter(a => a.status === 'CONCLUIDA').length || 0
  const percentualPAC = totalPlanejadas > 0 ? (totalConcluidas / totalPlanejadas) * 100 : 0
  
  // Atualizar plano semanal
  await supabase
    .from('planos_semanais_trabalho')
    .update({ percentual_pac: percentualPAC })
    .eq('id', planoSemanalId)
  
  return new Response(
    JSON.stringify({ percentualPAC }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

### 6.2. Deploy da Edge Function

```bash
supabase functions deploy calculate-pac
```

## 7. Dados Iniciais (Seed)

### 7.1. Empresa e Usuário ADMIN

```sql
-- Inserir empresa de exemplo
INSERT INTO empresas (id, nome, cnpj, ativo) VALUES 
('11111111-1111-1111-1111-111111111111', 'Empresa Demo', '00.000.000/0001-00', true);

-- Inserir funções padrão
INSERT INTO funcoes (nome, descricao) VALUES 
('Engenheiro Civil', 'Responsável técnico pela obra'),
('Mestre de Obras', 'Supervisão das equipes'),
('Encarregado', 'Gestão de frente de trabalho'),
('Servente', 'Serviços gerais'),
('Pedreiro', 'Alvenaria e revestimentos');

-- Inserir usuário ADMIN
-- Nota: A senha deve ser criada via Supabase Auth
-- Após criar o usuário no Auth, vincular com:
INSERT INTO usuarios (
  id, 
  nome, 
  email, 
  empresa_id, 
  camada_governanca, 
  perfil_acesso, 
  ativo
) VALUES (
  '<auth_user_id>',
  'Admin Sistema',
  'admin@visionplan.com',
  '11111111-1111-1111-1111-111111111111',
  'PROPONENTE',
  'ADMIN',
  true
);
```

## 8. Variáveis de Ambiente

No arquivo `.env` da aplicação:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

## 9. Testes

### 9.1. Testar Autenticação

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'teste@example.com',
  password: 'SenhaSegura123!',
})
```

### 9.2. Testar Real-time

```javascript
const channel = supabase
  .channel('atividades-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'atividades' },
    (payload) => console.log('Mudança:', payload)
  )
  .subscribe()
```

### 9.3. Testar Upload

```javascript
const { data, error } = await supabase.storage
  .from('logos')
  .upload('empresa-1/logo.png', file)
```

## 10. Monitoramento

No Dashboard do Supabase:

1. **Database > Logs**: Monitore queries
2. **API > Logs**: Veja requests
3. **Storage > Usage**: Acompanhe uso de storage
4. **Auth > Users**: Gerencie usuários

## 11. Backup

Configure backups automáticos:

1. Vá para **Settings > Backups**
2. Habilite backups diários
3. Configure retenção de 7 dias

## 12. Produção

Antes de ir para produção:

1. ✅ Configure domínio customizado
2. ✅ Ative SSL
3. ✅ Revise todas as políticas RLS
4. ✅ Configure rate limiting
5. ✅ Ative 2FA para admins
6. ✅ Configure monitoring e alertas
7. ✅ Teste disaster recovery

---

Para mais informações, consulte a [documentação oficial do Supabase](https://supabase.com/docs).
