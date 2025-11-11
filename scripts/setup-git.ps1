# =============================================================================
# VisionPlan - Script de Setup Git e GitHub (Windows PowerShell)
# =============================================================================
# Execute este script no PowerShell após baixar o projeto
# =============================================================================

Write-Host "🚀 VisionPlan - Setup Git & GitHub" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto VisionPlan" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Diretório correto detectado" -ForegroundColor Green
Write-Host ""

# 2. Configurar Git
Write-Host "📝 Configurando Git..." -ForegroundColor Yellow
$gitName = Read-Host "Digite seu nome para o Git"
$gitEmail = Read-Host "Digite seu email para o Git"

git config user.name "$gitName"
git config user.email "$gitEmail"

Write-Host "✅ Git configurado!" -ForegroundColor Green
Write-Host ""

# 3. Inicializar repositório (se não existir)
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Inicializando repositório Git..." -ForegroundColor Yellow
    git init
    git branch -M main
    Write-Host "✅ Repositório Git inicializado!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Repositório Git já existe" -ForegroundColor Cyan
}
Write-Host ""

# 4. Adicionar todos os arquivos
Write-Host "📦 Adicionando arquivos ao Git..." -ForegroundColor Yellow
git add .
Write-Host "✅ Arquivos adicionados!" -ForegroundColor Green
Write-Host ""

# 5. Fazer commit inicial
Write-Host "💾 Fazendo commit inicial..." -ForegroundColor Yellow
git commit -m "Initial commit: VisionPlan v2.2.0

- Aplicação completa React + TypeScript
- Sistema de temas customizáveis (12 cores)
- Dashboard com KPIs e gráficos
- Kanban com check-in/check-out
- Autenticação e rotas protegidas
- Integração Supabase
- Documentação completa (+40k palavras)
- Layout responsivo
- 100% TypeScript

Features:
✅ Dashboard profissional com modo apresentação
✅ Sistema de temas customizáveis por cliente
✅ Kanban colaborativo
✅ Gerenciamento de estado (Zustand)
✅ Real-time preparado (WebSockets)
✅ Design system moderno (Tailwind CSS)

Documentação incluída:
📖 README.md - Documentação principal
🚀 QUICKSTART.md - Instalação rápida
🔧 DOCUMENTACAO_TECNICA.md - Implementação profunda
📘 API_REFERENCE.md - Referência rápida
🎨 THEME_CUSTOMIZATION.md - Sistema de temas
⚙️ SUPABASE_SETUP.md - Backend setup"

Write-Host "✅ Commit realizado!" -ForegroundColor Green
Write-Host ""

# 6. Configurar repositório remoto no GitHub
Write-Host "🌐 Configurando repositório remoto no GitHub" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Você precisa criar um repositório no GitHub primeiro!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Passos:"
Write-Host "1. Acesse: https://github.com/new"
Write-Host "2. Nome do repositório: visionplan"
Write-Host "3. Descrição: Plataforma Integrada de Planejamento e Gestão de Obras (4D/LPS)"
Write-Host "4. Marque como: Private (ou Public, sua escolha)"
Write-Host "5. NÃO inicialize com README (já temos)"
Write-Host "6. Clique em 'Create repository'"
Write-Host ""

$githubReady = Read-Host "Já criou o repositório no GitHub? (s/n)"

if ($githubReady -eq "s" -or $githubReady -eq "S") {
    $githubUser = Read-Host "Digite seu usuário do GitHub"
    
    # Adicionar remote
    git remote add origin "https://github.com/$githubUser/visionplan.git"
    
    Write-Host "✅ Remote configurado!" -ForegroundColor Green
    Write-Host ""
    
    # Perguntar se quer fazer push
    $doPush = Read-Host "Deseja fazer push para o GitHub agora? (s/n)"
    
    if ($doPush -eq "s" -or $doPush -eq "S") {
        Write-Host "🚀 Fazendo push para GitHub..." -ForegroundColor Yellow
        git push -u origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 Projeto publicado no GitHub!" -ForegroundColor Green
            Write-Host "🔗 URL: https://github.com/$githubUser/visionplan" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️  Erro ao fazer push. Verifique suas credenciais." -ForegroundColor Yellow
            Write-Host "Tente executar manualmente: git push -u origin main"
        }
    } else {
        Write-Host ""
        Write-Host "ℹ️  Para fazer push depois, execute:" -ForegroundColor Cyan
        Write-Host "   git push -u origin main"
    }
} else {
    Write-Host ""
    Write-Host "ℹ️  Quando criar o repositório, execute:" -ForegroundColor Cyan
    Write-Host "   git remote add origin https://github.com/SEU_USUARIO/visionplan.git"
    Write-Host "   git push -u origin main"
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ Setup Git concluído!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos passos:"
Write-Host "1. Instalar dependências: npm install"
Write-Host "2. Configurar .env: copy .env.example .env"
Write-Host "3. Executar aplicação: npm run dev"
Write-Host ""
Write-Host "📚 Documentação:"
Write-Host "- LEIA_PRIMEIRO.md - Índice da documentação"
Write-Host "- QUICKSTART.md - Início rápido"
Write-Host "- README.md - Documentação completa"
Write-Host ""
Write-Host "🎨 Customização de Temas:"
Write-Host "- THEME_CUSTOMIZATION.md - Sistema de 12 cores"
Write-Host ""
Write-Host "🌟 VisionPlan v2.2.0 - Pronto para uso!" -ForegroundColor Green
Write-Host ""
