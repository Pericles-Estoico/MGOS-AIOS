#!/bin/bash

################################################################################
# 🚨 Alerts Script - Sistema de Alertas para SellersOps
# Envia notificações para Slack, Discord e Email
################################################################################

set -e

# ============================================================================
# CONFIGURAÇÃO DE ALERTAS
# ============================================================================

APP_NAME="sellerops"
APP_DIR="/var/www/sellerops"
ALERTS_CONFIG="${APP_DIR}/.alerts-config"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# CARREGAR CONFIGURAÇÕES
# ============================================================================

load_config() {
    if [ ! -f "${ALERTS_CONFIG}" ]; then
        create_default_config
    fi

    # Carregar variáveis do arquivo de config
    source "${ALERTS_CONFIG}" || true
}

create_default_config() {
    cat > "${ALERTS_CONFIG}" << 'EOF'
# ============================================
# Configuração de Alertas - SellersOps
# ============================================

# SLACK
SLACK_ENABLED=false
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# DISCORD
DISCORD_ENABLED=false
DISCORD_WEBHOOK="https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"

# EMAIL
EMAIL_ENABLED=false
EMAIL_TO="seu-email@example.com"
EMAIL_FROM="alerts@sellerops.com.br"

# TELEGRAM (Optional)
TELEGRAM_ENABLED=false
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
RESPONSE_TIME_THRESHOLD=5000

# ============================================
# INSTRUÇÕES PARA CONFIGURAR
# ============================================

# SLACK:
# 1. Ir para: https://api.slack.com/apps
# 2. Criar novo app
# 3. Ativar "Incoming Webhooks"
# 4. Clicar "Add New Webhook to Workspace"
# 5. Selecionar canal #alerts
# 6. Copiar URL em SLACK_WEBHOOK
# 7. Executar: source /var/www/sellerops/.alerts-config && sellerops-test-slack

# DISCORD:
# 1. Ir para canal do Discord
# 2. Settings → Webhooks
# 3. Criar novo webhook
# 4. Copiar URL em DISCORD_WEBHOOK
# 5. Executar: source /var/www/sellerops/.alerts-config && sellerops-test-discord

# EMAIL:
# 1. Instalar: apt install mailutils
# 2. Configurar sendmail ou postfix
# 3. Testar: sellerops-test-email

# TELEGRAM:
# 1. Criar bot com @BotFather no Telegram
# 2. Copiar token em TELEGRAM_BOT_TOKEN
# 3. Enviar mensagem para bot para obter CHAT_ID
# 4. Testar: sellerops-test-telegram
EOF

    chmod 600 "${ALERTS_CONFIG}"
    echo "Arquivo de config criado: ${ALERTS_CONFIG}"
    echo "Edite e configure os webhooks"
}

# ============================================================================
# FUNÇÕES DE LOGGING
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $@"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $@"
}

log_warn() {
    echo -e "${YELLOW}[⚠]${NC} $@"
}

log_error() {
    echo -e "${RED}[✗]${NC} $@"
}

# ============================================================================
# SLACK ALERTS
# ============================================================================

send_slack() {
    local level=$1
    local title=$2
    local message=$3

    if [ "${SLACK_ENABLED}" != "true" ] || [ -z "${SLACK_WEBHOOK}" ]; then
        return
    fi

    local color="danger"
    local emoji="🔴"

    case "${level}" in
        success)
            color="good"
            emoji="🟢"
            ;;
        warning)
            color="warning"
            emoji="🟡"
            ;;
        info)
            color="#0099FF"
            emoji="🔵"
            ;;
    esac

    curl -X POST "${SLACK_WEBHOOK}" \
        -H 'Content-Type: application/json' \
        -d "{
            \"attachments\": [
                {
                    \"color\": \"${color}\",
                    \"title\": \"${emoji} ${title}\",
                    \"text\": \"${message}\",
                    \"footer\": \"SellersOps Monitoring\",
                    \"ts\": $(date +%s)
                }
            ]
        }" 2>/dev/null

    log_success "Alerta Slack enviado"
}

test_slack() {
    if [ -z "${SLACK_WEBHOOK}" ]; then
        log_error "SLACK_WEBHOOK não configurado"
        return 1
    fi

    log_info "Testando conexão com Slack..."
    send_slack "success" "✅ Teste de Conexão Slack" "Sistema de alertas configurado com sucesso! $(date)"
    return 0
}

# ============================================================================
# DISCORD ALERTS
# ============================================================================

send_discord() {
    local level=$1
    local title=$2
    local message=$3

    if [ "${DISCORD_ENABLED}" != "true" ] || [ -z "${DISCORD_WEBHOOK}" ]; then
        return
    fi

    local color=15158332  # Red
    local emoji="🔴"

    case "${level}" in
        success)
            color=3066993    # Green
            emoji="🟢"
            ;;
        warning)
            color=16776960   # Yellow
            emoji="🟡"
            ;;
        info)
            color=255       # Blue
            emoji="🔵"
            ;;
    esac

    curl -X POST "${DISCORD_WEBHOOK}" \
        -H 'Content-Type: application/json' \
        -d "{
            \"embeds\": [
                {
                    \"title\": \"${emoji} ${title}\",
                    \"description\": \"${message}\",
                    \"color\": ${color},
                    \"footer\": {
                        \"text\": \"SellersOps Monitoring\"
                    },
                    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
                }
            ]
        }" 2>/dev/null

    log_success "Alerta Discord enviado"
}

test_discord() {
    if [ -z "${DISCORD_WEBHOOK}" ]; then
        log_error "DISCORD_WEBHOOK não configurado"
        return 1
    fi

    log_info "Testando conexão com Discord..."
    send_discord "success" "✅ Teste de Conexão Discord" "Sistema de alertas configurado com sucesso! $(date)"
    return 0
}

# ============================================================================
# EMAIL ALERTS
# ============================================================================

send_email() {
    local level=$1
    local title=$2
    local message=$3

    if [ "${EMAIL_ENABLED}" != "true" ]; then
        return
    fi

    if ! command -v mail &> /dev/null; then
        log_warn "Comando 'mail' não encontrado, instale com: apt install mailutils"
        return
    fi

    local subject="[${level}] ${title}"

    echo -e "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')\n\n${message}\n\n---\nSellersOps Monitoring System" | \
        mail -s "${subject}" -r "${EMAIL_FROM}" "${EMAIL_TO}"

    log_success "Alerta Email enviado para ${EMAIL_TO}"
}

test_email() {
    if [ -z "${EMAIL_TO}" ]; then
        log_error "EMAIL_TO não configurado"
        return 1
    fi

    if ! command -v mail &> /dev/null; then
        log_error "Comando 'mail' não encontrado"
        log_warn "Instale com: sudo apt install mailutils"
        return 1
    fi

    log_info "Testando envio de email para ${EMAIL_TO}..."
    send_email "info" "Teste de Email" "Conexão com sistema de alertas funcionando! $(date)"
    return 0
}

# ============================================================================
# TELEGRAM ALERTS
# ============================================================================

send_telegram() {
    local level=$1
    local title=$2
    local message=$3

    if [ "${TELEGRAM_ENABLED}" != "true" ] || [ -z "${TELEGRAM_BOT_TOKEN}" ] || [ -z "${TELEGRAM_CHAT_ID}" ]; then
        return
    fi

    local emoji="🔴"
    case "${level}" in
        success) emoji="🟢" ;;
        warning) emoji="🟡" ;;
        info) emoji="🔵" ;;
    esac

    local text="${emoji} *${title}*\n\n${message}\n\n_$(date '+%Y-%m-%d %H:%M:%S')_"

    curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}&text=${text}&parse_mode=Markdown" 2>/dev/null

    log_success "Alerta Telegram enviado"
}

test_telegram() {
    if [ -z "${TELEGRAM_BOT_TOKEN}" ] || [ -z "${TELEGRAM_CHAT_ID}" ]; then
        log_error "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurado"
        return 1
    fi

    log_info "Testando conexão com Telegram..."
    send_telegram "success" "Teste de Conexão Telegram" "Sistema de alertas configurado com sucesso!"
    return 0
}

# ============================================================================
# ALERTAS PREDEFINIDOS
# ============================================================================

alert_deployment_started() {
    local branch=$1
    local commit=$2

    send_slack "info" "🚀 Deployment Iniciado" "Branch: ${branch}\nCommit: ${commit}\nTempo: $(date)"
    send_discord "info" "🚀 Deployment Iniciado" "Branch: ${branch}\nCommit: ${commit}\nTempo: $(date)"
}

alert_deployment_success() {
    local branch=$1
    local duration=$2

    send_slack "success" "✅ Deployment Sucesso" "Branch: ${branch}\nDuração: ${duration}s\nTempo: $(date)"
    send_discord "success" "✅ Deployment Sucesso" "Branch: ${branch}\nDuração: ${duration}s\nTempo: $(date)"
}

alert_deployment_failed() {
    local branch=$1
    local error=$2

    send_slack "danger" "❌ Deployment Falhou" "Branch: ${branch}\nErro: ${error}\nTempo: $(date)"
    send_discord "danger" "❌ Deployment Falhou" "Branch: ${branch}\nErro: ${error}\nTempo: $(date)"
    send_email "danger" "Deployment Falhou" "Branch: ${branch}\n\nErro:\n${error}"
}

alert_process_down() {
    send_slack "danger" "🔴 Processo ${APP_NAME} DOWN" "O processo não está mais rodando!\nTempo: $(date)"
    send_discord "danger" "🔴 Processo ${APP_NAME} DOWN" "O processo não está mais rodando!\nTempo: $(date)"
    send_email "danger" "Alerta Crítico" "O processo ${APP_NAME} parou de responder!"
}

alert_high_cpu() {
    local usage=$1

    send_slack "warning" "⚠️ CPU Alta" "Uso de CPU: ${usage}%\nLimite: ${CPU_THRESHOLD}%\nTempo: $(date)"
    send_discord "warning" "⚠️ CPU Alta" "Uso de CPU: ${usage}%\nLimite: ${CPU_THRESHOLD}%"
}

alert_high_memory() {
    local usage=$1

    send_slack "warning" "⚠️ Memória Alta" "Uso de Memória: ${usage}%\nLimite: ${MEMORY_THRESHOLD}%\nTempo: $(date)"
    send_discord "warning" "⚠️ Memória Alta" "Uso de Memória: ${usage}%\nLimite: ${MEMORY_THRESHOLD}%"
}

alert_high_disk() {
    local usage=$1

    send_slack "danger" "⚠️ Disco Cheio" "Uso de Disco: ${usage}%\nLimite: ${DISK_THRESHOLD}%\nTempo: $(date)"
    send_discord "danger" "⚠️ Disco Cheio" "Uso de Disco: ${usage}%\nLimite: ${DISK_THRESHOLD}%"
    send_email "danger" "Alerta de Disco" "O disco está ${usage}% cheio!"
}

# ============================================================================
# MANAGE ALERTS
# ============================================================================

manage_alerts() {
    case "${1}" in
        enable-slack)
            sed -i 's/SLACK_ENABLED=.*/SLACK_ENABLED=true/' "${ALERTS_CONFIG}"
            log_success "Slack alertas ATIVADOS"
            ;;
        disable-slack)
            sed -i 's/SLACK_ENABLED=.*/SLACK_ENABLED=false/' "${ALERTS_CONFIG}"
            log_success "Slack alertas DESATIVADOS"
            ;;
        enable-discord)
            sed -i 's/DISCORD_ENABLED=.*/DISCORD_ENABLED=true/' "${ALERTS_CONFIG}"
            log_success "Discord alertas ATIVADOS"
            ;;
        disable-discord)
            sed -i 's/DISCORD_ENABLED=.*/DISCORD_ENABLED=false/' "${ALERTS_CONFIG}"
            log_success "Discord alertas DESATIVADOS"
            ;;
        enable-email)
            sed -i 's/EMAIL_ENABLED=.*/EMAIL_ENABLED=true/' "${ALERTS_CONFIG}"
            log_success "Email alertas ATIVADOS"
            ;;
        disable-email)
            sed -i 's/EMAIL_ENABLED=.*/EMAIL_ENABLED=false/' "${ALERTS_CONFIG}"
            log_success "Email alertas DESATIVADOS"
            ;;
        config)
            cat "${ALERTS_CONFIG}"
            ;;
        edit)
            ${EDITOR:-nano} "${ALERTS_CONFIG}"
            ;;
        *)
            return 1
            ;;
    esac
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    load_config

    case "${1}" in
        # Alertas diretos
        slack)
            send_slack "${2:-info}" "$3" "$4"
            ;;
        discord)
            send_discord "${2:-info}" "$3" "$4"
            ;;
        email)
            send_email "${2:-info}" "$3" "$4"
            ;;
        telegram)
            send_telegram "${2:-info}" "$3" "$4"
            ;;

        # Testes
        test-slack)
            test_slack
            ;;
        test-discord)
            test_discord
            ;;
        test-email)
            test_email
            ;;
        test-telegram)
            test_telegram
            ;;

        # Alertas predefinidos
        deployment-started)
            alert_deployment_started "$2" "$3"
            ;;
        deployment-success)
            alert_deployment_success "$2" "$3"
            ;;
        deployment-failed)
            alert_deployment_failed "$2" "$3"
            ;;
        process-down)
            alert_process_down
            ;;
        high-cpu)
            alert_high_cpu "$2"
            ;;
        high-memory)
            alert_high_memory "$2"
            ;;
        high-disk)
            alert_high_disk "$2"
            ;;

        # Gerenciamento
        enable-slack|disable-slack|enable-discord|disable-discord|enable-email|disable-email|config|edit)
            manage_alerts "$@"
            ;;

        *)
            echo "Uso: $0 [comando] [opções]"
            echo ""
            echo "Alertas diretos:"
            echo "  slack <level> <title> <message>     - Enviar alerta Slack"
            echo "  discord <level> <title> <message>   - Enviar alerta Discord"
            echo "  email <level> <title> <message>     - Enviar alerta Email"
            echo "  telegram <level> <title> <message>  - Enviar alerta Telegram"
            echo ""
            echo "Testes:"
            echo "  test-slack                          - Testar Slack"
            echo "  test-discord                        - Testar Discord"
            echo "  test-email                          - Testar Email"
            echo "  test-telegram                       - Testar Telegram"
            echo ""
            echo "Alertas predefinidos:"
            echo "  deployment-started <branch> <commit>"
            echo "  deployment-success <branch> <duration>"
            echo "  deployment-failed <branch> <error>"
            echo "  process-down"
            echo "  high-cpu <percentage>"
            echo "  high-memory <percentage>"
            echo "  high-disk <percentage>"
            echo ""
            echo "Gerenciamento:"
            echo "  config                              - Ver configuração"
            echo "  edit                                - Editar configuração"
            echo "  enable-slack|disable-slack          - Ativar/desativar Slack"
            echo "  enable-discord|disable-discord      - Ativar/desativar Discord"
            echo "  enable-email|disable-email          - Ativar/desativar Email"
            exit 1
            ;;
    esac
}

main "$@"
