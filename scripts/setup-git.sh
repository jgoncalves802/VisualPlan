#!/bin/bash

# =============================================================================
# VisionPlan - Script de Setup Git e GitHub
# =============================================================================
# Este script configura o repositório Git e prepara para GitHub
# Execute após baixar o projeto localmente
# =============================================================================

echo "🚀 VisionPlan - Setup Git & GitHub"
echo "=================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto VisionPlan"
    exit 1
fi

echo "✅ Diretório correto detectado"
echo ""

# 2. Configurar Git (se necessário)
echo "📝 Configurando Git..."
read -p "Digite seu nome para o Git: " git_name
read -p "Digite seu email para o Git: " git_email

git config user.name "$git_name"
git config user.email "$git_email"

echo -e "${GREEN}✅ Git configurado!${NC}"
echo ""

# 3. Inicializar repositório (se não existir)
if [ ! -d ".git" ]; then
    echo "🔧 Inicializando repositório Git..."
    git init
    git branch -M main
    echo -e "${GREEN}✅ Repositório Git inicializado!${NC}"
else
    echo "ℹ️  Repositório Git já existe"
fi
echo ""

# 4. Adicionar todos os arquivos
echo "📦 Adicionando arquivos ao Git..."
git add .
echo -e "${GREEN}✅ Arquivos adicionados!${NC}"
echo ""

# 5. Fazer commit inicial
echo "💾 Fazendo commit inicial..."
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

echo -e "${GREEN}✅ Commit realizado!${NC}"
echo ""

# 6. Configurar repositório remoto no GitHub
echo "🌐 Configurando repositório remoto no GitHub"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Você precisa criar um repositório no GitHub primeiro!${NC}"
echo ""
echo "Passos:"
echo "1. Acesse: https://github.com/new"
echo "2. Nome do repositório: visionplan"
echo "3. Descrição: Plataforma Integrada de Planejamento e Gestão de Obras (4D/LPS)"
echo "4. Marque como: Private (ou Public, sua escolha)"
echo "5. NÃO inicialize com README (já temos)"
echo "6. Clique em 'Create repository'"
echo ""

read -p "Já criou o repositório no GitHub? (s/n): " github_ready

if [ "$github_ready" = "s" ] || [ "$github_ready" = "S" ]; then
    read -p "Digite seu usuário do GitHub: " github_user
    
    # Adicionar remote
    git remote add origin "https://github.com/$github_user/visionplan.git"
    
    echo -e "${GREEN}✅ Remote configurado!${NC}"
    echo ""
    
    # Perguntar se quer fazer push
    read -p "Deseja fazer push para o GitHub agora? (s/n): " do_push
    
    if [ "$do_push" = "s" ] || [ "$do_push" = "S" ]; then
        echo "🚀 Fazendo push para GitHub..."
        git push -u origin main
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Push realizado com sucesso!${NC}"
            echo ""
            echo "🎉 Projeto publicado no GitHub!"
            echo "🔗 URL: https://github.com/$github_user/visionplan"
        else
            echo -e "${YELLOW}⚠️  Erro ao fazer push. Verifique suas credenciais.${NC}"
            echo "Tente executar manualmente: git push -u origin main"
        fi
    else
        echo ""
        echo "ℹ️  Para fazer push depois, execute:"
        echo "   git push -u origin main"
    fi
else
    echo ""
    echo "ℹ️  Quando criar o repositório, execute:"
    echo "   git remote add origin https://github.com/SEU_USUARIO/visionplan.git"
    echo "   git push -u origin main"
fi

echo ""
echo "=================================="
echo "✅ Setup Git concluído!"
echo "=================================="
echo ""
echo "📋 Próximos passos:"
echo "1. Instalar dependências: npm install"
echo "2. Configurar .env: cp .env.example .env"
echo "3. Executar aplicação: npm run dev"
echo ""
echo "📚 Documentação:"
echo "- LEIA_PRIMEIRO.md - Índice da documentação"
echo "- QUICKSTART.md - Início rápido"
echo "- README.md - Documentação completa"
echo ""
echo "🎨 Customização de Temas:"
echo "- THEME_CUSTOMIZATION.md - Sistema de 12 cores"
echo ""
echo "🆘 Precisa de ajuda?"
echo "- Leia: DOCUMENTACAO_TECNICA.md"
echo "- Consulte: API_REFERENCE.md"
echo ""
echo "🌟 VisionPlan v2.2.0 - Pronto para uso!"
echo ""
