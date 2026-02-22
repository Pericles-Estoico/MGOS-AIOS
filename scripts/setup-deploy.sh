#!/bin/bash

################################################################################
# 🔧 Setup Script - Instala o sistema de deployment no VPS
# Execute este script UMA VEZ no VPS para configurar tudo
################################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[SETUP]${NC} $@"; }
success() { echo -e "${GREEN}[✓]${NC} $@"; }
error() { echo -e "${RED}[✗]${NC} $@"; exit 1; }
warn() { echo -e "${YELLOW}[⚠]${NC} $@"; }

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

APP_DIR="/var/www/sellerops"
REPO_URL="https://github.com/Pericles-Estoico/MGOS-AIOS.git"

# ============================================================================
# VERIFICAÇÕES INICIAIS
# ============================================================================

log "════════════════════════════════════════════════════════════"
log "🔧 SETUP INICIAL - SellersOps Deployment System"
log "════════════════════════════════════════════════════════════"
log ""

# Verificar se estamos rodando como root
if [ "$EUID" -ne 0 ]; then
   error "Este script precisa rodar com sudo. Execute: sudo bash $0"
fi

log "✓ Executando com privilégios sudo"

# Verificar se o diretório da app existe
if [ ! -d "${APP_DIR}" ]; then
    error "Diretório não encontrado: ${APP_DIR}"
fi

log "✓ Diretório da app existe"

# ============================================================================
# INSTALAR DEPENDÊNCIAS
# ============================================================================

log ""
log "════════════════════════════════════════════════════════════"
log "📦 INSTALANDO DEPENDÊNCIAS"
log "════════════════════════════════════════════════════════════"

# Verificar e instalar Git
if ! command -v git &> /dev/null; then
    log "Git não encontrado, instalando..."
    apt update > /dev/null 2>&1
    apt install -y git > /dev/null 2>&1
    success "Git instalado"
else
    success "Git já está instalado"
fi

# Verificar e instalar Node.js
if ! command -v node &> /dev/null; then
    log "Node.js não encontrado, instalando..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt install -y nodejs > /dev/null 2>&1
    success "Node.js instalado ($(node --version))"
else
    success "Node.js já está instalado ($(node --version))"
fi

# Verificar e instalar PM2
if ! npm list -g pm2 &> /dev/null; then
    log "PM2 não encontrado, instalando..."
    npm install -g pm2 > /dev/null 2>&1
    success "PM2 instalado"
else
    success "PM2 já está instalado"
fi

# ============================================================================
# CRIAR ESTRUTURA DE DIRETÓRIOS
# ============================================================================

log ""
log "════════════════════════════════════════════════════════════"
log "📁 CRIANDO ESTRUTURA DE DIRETÓRIOS"
log "════════════════════════════════════════════════════════════"

cd "${APP_DIR}"

# Criar diretórios
mkdir -p scripts .deploy-logs .backups
chmod 755 scripts .deploy-logs .backups

success "Diretórios criados"

# ============================================================================
# COPIAR DEPLOY SCRIPT
# ============================================================================

log ""
log "════════════════════════════════════════════════════════════"
log "📜 INSTALANDO DEPLOY SCRIPT"
log "════════════════════════════════════════════════════════════"

# Se o repositório já existe, fazer pull para pegar o script
if [ -d "${APP_DIR}/.git" ]; then
    log "Repositório Git encontrado, fazendo pull..."
    cd "${APP_DIR}"
    git fetch origin main > /dev/null 2>&1
    git pull origin main > /dev/null 2>&1
    success "Repositório atualizado"
else
    error "Repositório Git não encontrado. Primeiro clone o repositório."
fi

# Verificar se o script foi obtido
if [ ! -f "${APP_DIR}/scripts/deploy.sh" ]; then
    error "Script deploy.sh não encontrado após pull"
fi

# Tornar executável
chmod +x "${APP_DIR}/scripts/deploy.sh"
success "Deploy script instalado e executável"

# ============================================================================
# CONFIGURAR PM2
# ============================================================================

log ""
log "════════════════════════════════════════════════════════════"
log "⚙️  CONFIGURANDO PM2"
log "════════════════════════════════════════════════════════════"

# Inicializar PM2 como serviço do sistema
pm2 startup > /dev/null 2>&1 || true
pm2 save > /dev/null 2>&1 || true

success "PM2 configurado como serviço do sistema"

# ============================================================================
# CRIAR ALIAS PARA FÁCIL ACESSO
# ============================================================================

log ""
log "════════════════════════════════════════════════════════════"
log "🔗 CRIANDO ATALHOS"
log "════════════════════════════════════════════════════════════"

# Criar arquivo de profile para adicionar alias
cat >> /root/.bashrc << 'EOF'

# ============= SellersOps Deployment Aliases =============
alias sellerops-deploy='cd /var/www/sellerops && ./scripts/deploy.sh'
alias sellerops-logs='pm2 logs sellerops'
alias sellerops-status='pm2 list | grep sellerops'
alias sellerops-info='pm2 info sellerops'
alias sellerops-restart='pm2 restart sellerops'
alias sellerops-stop='pm2 stop sellerops'
alias sellerops-start='pm2 start sellerops'
alias sellerops-deploy-logs='tail -f /var/www/sellerops/.deploy-logs/deploy.log'
# ========================================================
EOF

source /root/.bashrc

success "Aliases criados"

# ============================================================================
# CRIAR WEBHOOK SECRET (opcional)
# ============================================================================

log ""
log "════════════════════════════════════════════════════════════"
log "🔐 CONFIGURANDO WEBHOOK SECRET (opcional)"
log "════════════════════════════════════════════════════════════"

if [ ! -f "${APP_DIR}/.webhook-secret" ]; then
    # Gerar secret aleatório
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    echo "${WEBHOOK_SECRET}" > "${APP_DIR}/.webhook-secret"
    chmod 600 "${APP_DIR}/.webhook-secret"

    success "Webhook secret gerado: ${WEBHOOK_SECRET}"
    warn "Salve este secret no GitHub Webhook (Settings → Webhooks)"
else
    success "Webhook secret já existe"
fi

# ============================================================================
# CRIAR ARQUIVO DE LOG INICIAL
# ============================================================================

log ""
log "════════════════════════════════════════════════════════════"
log "📝 CRIANDO ARQUIVO DE LOG"
log "════════════════════════════════════════════════════════════"

cat > "${APP_DIR}/.deploy-logs/README.md" << 'EOF'
# 📊 Deploy Logs

Logs do sistema de deployment automático da SellersOps.

## Arquivos

- `deploy.log` - Log de todos os deployments
- `cron.log` - Log de deployments via cron (se configurado)

## Como ver

```bash
# Logs em tempo real
tail -f deploy.log

# Últimas 50 linhas
tail -50 deploy.log

# Buscar por palavra-chave
grep "ERROR" deploy.log
grep "SUCCESS" deploy.log
```

## Limpeza de logs antigos (opcional)

```bash
# Manter apenas últimos 30 dias
find . -name "*.log" -mtime +30 -delete
```
EOF

success "Arquivo de configuração de logs criado"

# ============================================================================
# CRIAR SCRIPT DE BACKUP AUTOMÁTICO (BONUS)
# ============================================================================

log ""
log "════════════════════════════════════════════════════════════"
log "💾 CRIANDO SCRIPT DE BACKUP AUTOMÁTICO"
log "════════════════════════════════════════════════════════════"

cat > "${APP_DIR}/scripts/cleanup-backups.sh" << 'EOF'
#!/bin/bash
# Remove backups com mais de 7 dias

BACKUP_DIR="/var/www/sellerops/.backups"
DAYS=7

find "${BACKUP_DIR}" -type d -mtime +${DAYS} -exec rm -rf {} \; 2>/dev/null || true

echo "[$(date)] Cleanup de backups executado - Removidos backups com mais de ${DAYS} dias"
EOF

chmod +x "${APP_DIR}/scripts/cleanup-backups.sh"

success "Script de cleanup de backups criado"

# ============================================================================
# RESUMO FINAL
# ============================================================================

log ""
log "════════════════════════════════════════════════════════════"
log "🎉 SETUP COMPLETADO COM SUCESSO!"
log "════════════════════════════════════════════════════════════"
log ""

cat << 'EOF'
✅ Instalado:
  • Deploy script em /var/www/sellerops/scripts/deploy.sh
  • Diretórios de logs e backups
  • PM2 como serviço do sistema
  • Aliases para fácil acesso

📝 Arquivos criados:
  • /var/www/sellerops/scripts/deploy.sh          (Deploy script)
  • /var/www/sellerops/scripts/cleanup-backups.sh (Limpeza automática)
  • /var/www/sellerops/.deploy-logs/              (Diretório de logs)
  • /var/www/sellerops/.backups/                  (Diretório de backups)
  • /var/www/sellerops/.webhook-secret            (Secret do webhook)

🚀 PRÓXIMOS PASSOS:

1. Testar o deployment:
   $ sellerops-deploy

2. Ver logs em tempo real:
   $ sellerops-logs

3. Verificar status:
   $ sellerops-status

4. (Opcional) Configurar auto-deploy no GitHub:
   Ir para: https://github.com/Pericles-Estoico/MGOS-AIOS/settings/hooks
   Adicionar webhook com:
   - URL: https://www.sellerops.com.br/api/deploy
   - Secret: $(cat /var/www/sellerops/.webhook-secret)
   - Events: Push events

5. (Opcional) Configurar cron job para deploy automático a cada 15 min:
   $ crontab -e
   Adicionar: */15 * * * * /var/www/sellerops/scripts/deploy.sh >> /var/www/sellerops/.deploy-logs/cron.log 2>&1

📚 Documentação completa:
   Veja: /var/www/sellerops/docs/deployment/DEPLOY-SCRIPT-GUIDE.md

✨ Pronto para usar!
EOF

log ""
log "════════════════════════════════════════════════════════════"

exit 0
