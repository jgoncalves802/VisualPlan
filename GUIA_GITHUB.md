# 📦 Guia: Enviar Projeto para GitHub

> Como conectar o repositório local ao GitHub e fazer push

---

## ✅ Commit Criado!

Seu commit foi criado com sucesso:

```
Commit: 7650b37
Mensagem: feat: Reorganizacao completa da arquitetura do projeto para estrutura escalavel v2.2.0
Arquivos: 99 files changed, 24737 insertions(+)
```

---

## 🚀 Próximos Passos: Enviar para GitHub

### Opção 1: Criar Novo Repositório no GitHub

#### 1. Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `visionplan` (ou o nome que preferir)
3. Descrição: `Plataforma Integrada de Planejamento e Gestão de Obras (4D/LPS)`
4. Visibilidade: 
   - **Privado** (recomendado para projetos comerciais)
   - **Público** (se for open source)
5. **NÃO** marque nenhuma opção de inicialização (README, .gitignore, license)
6. Clique em **"Create repository"**

#### 2. Conectar Repositório Local ao GitHub

Após criar o repositório, o GitHub mostrará instruções. Use estes comandos:

```bash
# Adicionar remote do GitHub
git remote add origin https://github.com/jgoncalves802/VisualPlan.git

# OU se usar SSH:
git remote add origin git@github.com:SEU_USUARIO/visionplan.git

# Renomear branch para main (opcional, GitHub usa main como padrão)
git branch -M main

# Fazer push do commit
git push -u origin main
```

#### 3. Comandos Completos (Copie e Cole)

**Substitua `SEU_USUARIO` pelo seu usuário do GitHub:**

```bash
# HTTPS (requer senha)
git remote add origin https://github.com/SEU_USUARIO/visionplan.git
git branch -M main
git push -u origin main
```

**OU**

```bash
# SSH (requer chave SSH configurada)
git remote add origin git@github.com:SEU_USUARIO/visionplan.git
git branch -M main
git push -u origin main
```

---

### Opção 2: Repositório GitHub Já Existe

Se você já tem um repositório criado:

```bash
# Adicionar remote
git remote add origin https://github.com/SEU_USUARIO/visionplan.git

# Fazer push
git branch -M main
git push -u origin main --force  # Use --force apenas se necessário
```

---

## 📋 Checklist

Antes de fazer push, verifique:

- [ ] Repositório criado no GitHub
- [ ] `.gitignore` configurado (✅ já está)
- [ ] Sem credenciais ou dados sensíveis no código
- [ ] `.env` no `.gitignore` (✅ já está)
- [ ] `node_modules/` no `.gitignore` (✅ já está)

---

## 🔐 Autenticação GitHub

### Método 1: HTTPS (Token)

Se usar HTTPS, você precisará de um **Personal Access Token**:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Nome: "VisionPlan Deploy"
4. Scopes necessários:
   - ✅ `repo` (acesso completo)
5. Generate token
6. **Copie o token** (não será mostrado novamente!)
7. Use o token como senha ao fazer push

### Método 2: SSH (Recomendado)

Mais seguro e não precisa senha toda vez:

```bash
# Gerar chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "seu-email@example.com"

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub
# No Windows PowerShell:
type $env:USERPROFILE\.ssh\id_ed25519.pub

# Adicionar no GitHub:
# Settings → SSH and GPG keys → New SSH key
# Cole a chave pública
```

Depois use o remote SSH:
```bash
git remote add origin git@github.com:SEU_USUARIO/visionplan.git
```

---

## 📝 Comandos Úteis

### Verificar Status
```bash
# Ver status do repositório
git status

# Ver commits
git log --oneline

# Ver remotes configurados
git remote -v
```

### Fazer Novos Commits
```bash
# Adicionar mudanças
git add .

# Commit
git commit -m "feat: adiciona nova funcionalidade"

# Push
git push
```

### Trabalhar com Branches
```bash
# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Mudar de branch
git checkout main

# Push da branch
git push -u origin feature/nova-funcionalidade
```

---

## 🎨 Configurar README.md no GitHub

O arquivo `README.md` na raiz já está pronto e será exibido no GitHub automaticamente!

Ele inclui:
- ✅ Overview do projeto
- ✅ Badges
- ✅ Estrutura de pastas
- ✅ Tecnologias
- ✅ Instalação
- ✅ Scripts
- ✅ Documentação

---

## 🏷️ Adicionar Tags/Releases

Depois do primeiro push, você pode criar uma release:

```bash
# Criar tag
git tag -a v2.2.0 -m "Release v2.2.0 - Reestruturação completa"

# Push da tag
git push origin v2.2.0
```

No GitHub:
1. Vá para **Releases** → **Create a new release**
2. Tag: `v2.2.0`
3. Title: `v2.2.0 - Reestruturação Completa`
4. Description: Copie do `CHANGELOG.md`
5. Publish release

---

## 📊 Configurar GitHub Actions (Opcional)

Crie `.github/workflows/ci.yml` para CI/CD:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Build
      run: npm run build
```

---

## 🔒 Proteger Branch Main

No GitHub:
1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Marcar:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

---

## 📱 Configurar Dependabot (Opcional)

Crie `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

## 🎯 Exemplo Completo de Setup

```bash
# 1. Verificar commit
git log --oneline
# 7650b37 feat: Reorganizacao completa da arquitetura...

# 2. Adicionar remote (SUBSTITUA SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/visionplan.git

# 3. Verificar remote
git remote -v
# origin  https://github.com/SEU_USUARIO/visionplan.git (fetch)
# origin  https://github.com/SEU_USUARIO/visionplan.git (push)

# 4. Renomear branch para main
git branch -M main

# 5. Push inicial
git push -u origin main

# 6. Verificar no GitHub
# Abra: https://github.com/SEU_USUARIO/visionplan
```

---

## ✅ Verificação Final

Após o push, verifique no GitHub:

- [ ] README.md está sendo exibido
- [ ] Estrutura de pastas está correta
- [ ] `.gitignore` funcionando (node_modules/ não foi enviado)
- [ ] Todos os arquivos importantes estão lá

---

## 🆘 Problemas Comuns

### Erro: "Permission denied (publickey)"
```bash
# Verifique SSH
ssh -T git@github.com

# Se falhar, configure SSH ou use HTTPS
git remote set-url origin https://github.com/SEU_USUARIO/visionplan.git
```

### Erro: "Authentication failed"
```bash
# Use token ao invés de senha
# Ou configure SSH
```

### Erro: "Repository not found"
```bash
# Verifique se o repositório existe
# Verifique se o nome está correto
git remote -v
```

### Erro: "Failed to push some refs"
```bash
# Se for primeiro push e houver conflito
git push -u origin main --force

# ⚠️ Use --force apenas se tiver certeza!
```

---

## 📚 Recursos

- [GitHub Docs - Criar Repositório](https://docs.github.com/pt/get-started/quickstart/create-a-repo)
- [GitHub Docs - SSH](https://docs.github.com/pt/authentication/connecting-to-github-with-ssh)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Actions](https://docs.github.com/pt/actions)

---

<div align="center">

## 🎊 Pronto para Enviar ao GitHub! 🎊

**Siga os passos acima para enviar seu projeto**

---

### 🚀 Comando Rápido (substitua SEU_USUARIO):

```bash
git remote add origin https://github.com/SEU_USUARIO/visionplan.git
git branch -M main
git push -u origin main
```

---

**Qualquer dúvida, consulte este guia!**

</div>

---

**Criado em:** 11 de Novembro de 2024  
**Versão:** 2.2.0

