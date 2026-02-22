#!/bin/bash

################################################################################
# 🚀 SellersOps Deployment Script
# Deploy automático com verificações de saúde, logs e rollback
################################################################################

set -e  # Exit on error

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

APP_NAME="sellerops"
APP_DIR="/var/www/sellerops"
REPO_URL="https://github.com/Pericles-Estoico/MGOS-AIOS.git"
BRANCH="main"
LOG_DIR="${APP_DIR}/.deploy-logs"
BACKUP_DIR="${APP_DIR}/.backups"
PORT=3000
HEALTH_CHECK_URL="https://www.sellerops.com.br/api/health"
HEALTH_CHECK_TIMEOUT=30

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[${timestamp}] [${level}]${NC} ${message}" | tee -a "${LOG_DIR}/deploy.log"
}

log_info() { log "INFO" "$@"; }
log_success() { echo -e "${GREEN}[✓]${NC} $@" | tee -a "${LOG_DIR}/deploy.log"; }
log_error() { echo -e "${RED}[✗] ERROR:${NC} $@" | tee -a "${LOG_DIR}/deploy.log"; }
log_warn() { echo -e "${YELLOW}[⚠]${NC} $@" | tee -a "${LOG_DIR}/deploy.log"; }

# Criar diretórios de log e backup
mkdir -p "${LOG_DIR}" "${BACKUP_DIR}"

# ============================================================================
# VERIFICAÇÕES PRÉ-DEPLOYMENT
# ============================================================================

pre_deploy_checks() {
    log_info "═══════════════════════════════════════════════════════════"
    log_info "🔍 VERIFICAÇÕES PRÉ-DEPLOYMENT"
    log_info "═══════════════════════════════════════════════════════════"

    # Verificar se estamos no diretório correto
    if [ ! -d "${APP_DIR}" ]; then
        log_error "Diretório da app não existe: ${APP_DIR}"
        exit 1
    fi

    log_info "✓ Diretório da app existe: ${APP_DIR}"

    # Verificar se Git está instalado
    if ! command -v git &> /dev/null; then
        log_error "Git não está instalado"
        exit 1
    fi
    log_info "✓ Git está instalado"

    # Verificar se Node.js está instalado
    if ! command -v node &> /dev/null; then
        log_error "Node.js não está instalado"
        exit 1
    fi
    NODE_VERSION=$(node --version)
    log_info "✓ Node.js ${NODE_VERSION} está instalado"

    # Verificar se PM2 está instalado
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 não está instalado"
        exit 1
    fi
    log_info "✓ PM2 está instalado"

    # Verificar se a app está rodando
    if pm2 list | grep -q "${APP_NAME}"; then
        log_info "✓ App ${APP_NAME} está rodando no PM2"
    else
        log_warn "App ${APP_NAME} não está rodando no PM2"
    fi

    log_success "Todas as verificações pré-deployment passaram!"
}

# ============================================================================
# FAZER BACKUP DO CÓDIGO ATUAL
# ============================================================================

backup_current_code() {
    log_info "═══════════════════════════════════════════════════════════"
    log_info "💾 FAZENDO BACKUP DO CÓDIGO ATUAL"
    log_info "═══════════════════════════════════════════════════════════"

    cd "${APP_DIR}"

    # Pegar o hash do commit atual
    local current_commit=$(git rev-parse HEAD)
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    local backup_name="backup-${current_branch}-${current_commit:0:7}-$(date +%Y%m%d-%H%M%S)"
    local backup_path="${BACKUP_DIR}/${backup_name}"

    mkdir -p "${backup_path}"

    # Backup dos arquivos importantes
    log_info "Copiando arquivos para ${backup_path}..."
    cp -r .next "${backup_path}/" 2>/dev/null || true
    cp -r node_modules "${backup_path}/" 2>/dev/null || true
    cp package.json package-lock.json "${backup_path}/" 2>/dev/null || true

    # Salvar informações do backup
    cat > "${backup_path}/BACKUP_INFO.txt" << EOF
Backup criado em: $(date)
Commit: ${current_commit}
Branch: ${current_branch}
App: ${APP_NAME}
EOF

    log_success "Backup criado: ${backup_name}"
    echo "${backup_path}"
}

# ============================================================================
# PULL, BUILD E RESTART
# ============================================================================

deploy() {
    log_info "═══════════════════════════════════════════════════════════"
    log_info "🔄 INICIANDO DEPLOYMENT"
    log_info "═══════════════════════════════════════════════════════════"

    cd "${APP_DIR}"

    # Step 1: Fetch das atualizações
    log_info "📥 Fazendo fetch do repositório remoto..."
    git fetch origin "${BRANCH}" || {
        log_error "Falha ao fazer fetch"
        return 1
    }
    log_success "Fetch realizado com sucesso"

    # Step 2: Verificar se há atualizações
    local local_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse origin/${BRANCH})

    if [ "${local_commit}" = "${remote_commit}" ]; then
        log_warn "Código local já está atualizado com ${BRANCH}"
        log_info "Nenhuma atualização necessária"
        return 0
    fi

    log_info "📊 Atualizações disponíveis:"
    git log --oneline "${local_commit}..origin/${BRANCH}" | tee -a "${LOG_DIR}/deploy.log"

    # Step 3: Pull do código
    log_info "⬇️  Fazendo pull do branch ${BRANCH}..."
    git pull origin "${BRANCH}" || {
        log_error "Falha ao fazer pull"
        return 1
    }
    log_success "Pull realizado com sucesso"

    # Step 4: Instalar dependências
    log_info "📦 Instalando dependências..."
    npm install --legacy-peer-deps || {
        log_error "Falha ao instalar dependências"
        return 1
    }
    log_success "Dependências instaladas"

    # Step 5: Build
    log_info "🔨 Compilando aplicação..."
    npm run build || {
        log_error "Falha na compilação"
        return 1
    }
    log_success "Compilação realizada com sucesso"

    # Step 6: Restart da app
    log_info "🔄 Reiniciando app ${APP_NAME}..."
    pm2 restart "${APP_NAME}" || {
        log_error "Falha ao reiniciar PM2"
        return 1
    }
    log_success "App reiniciada com sucesso"

    # Step 7: Aguardar app estar pronta
    log_info "⏳ Aguardando app ficar pronta..."
    sleep 5

    return 0
}

# ============================================================================
# HEALTH CHECK
# ============================================================================

health_check() {
    log_info "═══════════════════════════════════════════════════════════"
    log_info "🏥 VERIFICAÇÃO DE SAÚDE"
    log_info "═══════════════════════════════════════════════════════════"

    local max_attempts=6
    local attempt=1

    while [ ${attempt} -le ${max_attempts} ]; do
        log_info "Tentativa ${attempt}/${max_attempts}..."

        # Verificar se PM2 processo está rodando
        if pm2 list | grep -q "${APP_NAME}.*online"; then
            log_success "Processo PM2 está online"

            # Aguardar um pouco para a app inicializar
            sleep 3

            return 0
        fi

        log_warn "App ainda não está pronta, aguardando..."
        sleep 5
        ((attempt++))
    done

    log_error "Timeout: App não ficou pronta após 30 segundos"
    return 1
}

# ============================================================================
# ROLLBACK
# ============================================================================

rollback() {
    local backup_path=$1

    log_error "════════════════════════════════════════════════════════════"
    log_error "⚠️  EXECUTANDO ROLLBACK"
    log_error "════════════════════════════════════════════════════════════"

    if [ -z "${backup_path}" ] || [ ! -d "${backup_path}" ]; then
        log_error "Caminho de backup inválido: ${backup_path}"
        return 1
    fi

    cd "${APP_DIR}"

    log_info "Restaurando arquivos de ${backup_path}..."
    cp -r "${backup_path}/.next" ./ 2>/dev/null || true
    cp -r "${backup_path}/node_modules" ./ 2>/dev/null || true

    log_info "Reiniciando app com backup..."
    pm2 restart "${APP_NAME}" || {
        log_error "Falha ao reiniciar após rollback"
        return 1
    }

    sleep 5

    log_success "Rollback completado"
}

# ============================================================================
# ENVIAR NOTIFICAÇÃO
# ============================================================================

send_notification() {
    local status=$1
    local message=$2

    # Você pode integrar com Slack, Discord, email, etc aqui
    # Por exemplo:
    # curl -X POST https://hooks.slack.com/... -d "text=${message}"

    log_info "📢 Notificação: ${message}"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    local start_time=$(date +%s)

    log_info "╔═══════════════════════════════════════════════════════════╗"
    log_info "║   🚀 SellersOps Deployment Script                        ║"
    log_info "║   App: ${APP_NAME}                                        ║"
    log_info "║   Branch: ${BRANCH}                                       ║"
    log_info "║   Timestamp: $(date '+%Y-%m-%d %H:%M:%S')                 ║"
    log_info "╚═══════════════════════════════════════════════════════════╝"
    log_info ""

    # Step 1: Pre-deployment checks
    pre_deploy_checks || exit 1

    # Step 2: Backup
    local backup_path=$(backup_current_code) || exit 1

    # Step 3: Deploy
    if ! deploy; then
        log_error "Deployment falhou, executando rollback..."
        rollback "${backup_path}" || true
        send_notification "FAILED" "❌ Deployment de ${APP_NAME} FALHOU e foi feito rollback"
        exit 1
    fi

    # Step 4: Health check
    if ! health_check; then
        log_error "Health check falhou, executando rollback..."
        rollback "${backup_path}" || true
        send_notification "FAILED" "❌ Health check FALHOU após deployment, rollback executado"
        exit 1
    fi

    # Success!
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_info "═══════════════════════════════════════════════════════════"
    log_success "🎉 DEPLOYMENT COMPLETADO COM SUCESSO!"
    log_info "═══════════════════════════════════════════════════════════"
    log_info "⏱️  Tempo total: ${duration} segundos"
    log_info ""

    # Informações finais
    log_info "Informações da app:"
    pm2 info "${APP_NAME}" | tee -a "${LOG_DIR}/deploy.log"

    send_notification "SUCCESS" "✅ Deployment de ${APP_NAME} completado com sucesso em ${duration}s"

    exit 0
}

# ============================================================================
# EXECUTAR
# ============================================================================

main "$@"
