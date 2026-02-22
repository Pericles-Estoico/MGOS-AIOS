#!/bin/bash

################################################################################
# 📊 Monitoring Script - Monitoramento em Tempo Real de SellersOps
# Monitora CPU, memória, logs, app status e envia alertas
################################################################################

set -e

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

APP_NAME="sellerops"
APP_DIR="/var/www/sellerops"
PORT=3000
LOG_DIR="${APP_DIR}/.deploy-logs"
MONITORING_LOG="${LOG_DIR}/monitoring.log"

# Thresholds de alerta
CPU_THRESHOLD=80          # % CPU
MEMORY_THRESHOLD=85       # % Memória
DISK_THRESHOLD=90         # % Disco
RESPONSE_TIME_THRESHOLD=5000  # ms

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# ALERTAS - Configuração
# ============================================================================

# SLACK
SLACK_WEBHOOK=""  # Adicione seu webhook aqui
SLACK_ENABLED=false

# DISCORD
DISCORD_WEBHOOK=""  # Adicione seu webhook aqui
DISCORD_ENABLED=false

# EMAIL
EMAIL_ENABLED=false
EMAIL_TO="seu-email@example.com"
EMAIL_FROM="monitoring@sellerops.com.br"

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[${timestamp}]${NC} $@" | tee -a "${MONITORING_LOG}"
}

alert_critical() {
    echo -e "${RED}[CRÍTICO]${NC} $@" | tee -a "${MONITORING_LOG}"
    send_alert "CRÍTICO" "$@"
}

alert_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $@" | tee -a "${MONITORING_LOG}"
    send_alert "AVISO" "$@"
}

alert_success() {
    echo -e "${GREEN}[OK]${NC} $@" | tee -a "${MONITORING_LOG}"
}

# ============================================================================
# ENVIAR ALERTAS
# ============================================================================

send_alert() {
    local severity=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Slack
    if [ "${SLACK_ENABLED}" = true ] && [ ! -z "${SLACK_WEBHOOK}" ]; then
        send_slack_alert "${severity}" "${message}"
    fi

    # Discord
    if [ "${DISCORD_ENABLED}" = true ] && [ ! -z "${DISCORD_WEBHOOK}" ]; then
        send_discord_alert "${severity}" "${message}"
    fi

    # Email
    if [ "${EMAIL_ENABLED}" = true ]; then
        send_email_alert "${severity}" "${message}"
    fi
}

send_slack_alert() {
    local severity=$1
    local message=$2
    local color="danger"

    [ "${severity}" = "AVISO" ] && color="warning"
    [ "${severity}" = "INFO" ] && color="good"

    curl -X POST "${SLACK_WEBHOOK}" \
        -H 'Content-Type: application/json' \
        -d "{
            \"attachments\": [
                {
                    \"color\": \"${color}\",
                    \"title\": \"[${severity}] SellersOps Monitoring\",
                    \"text\": \"${message}\",
                    \"ts\": $(date +%s)
                }
            ]
        }" 2>/dev/null || true
}

send_discord_alert() {
    local severity=$1
    local message=$2
    local color=15158332  # Red

    [ "${severity}" = "AVISO" ] && color=16776960    # Yellow
    [ "${severity}" = "INFO" ] && color=3066993      # Green

    curl -X POST "${DISCORD_WEBHOOK}" \
        -H 'Content-Type: application/json' \
        -d "{
            \"embeds\": [
                {
                    \"title\": \"[${severity}] SellersOps Monitoring\",
                    \"description\": \"${message}\",
                    \"color\": ${color},
                    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
                }
            ]
        }" 2>/dev/null || true
}

send_email_alert() {
    local severity=$1
    local message=$2

    # Requer 'mail' ou 'sendmail' instalado
    echo "SellersOps Monitoring Alert

Severity: ${severity}
Time: $(date '+%Y-%m-%d %H:%M:%S')
Message: ${message}

---
Monitoring System
sellerops.com.br" | mail -s "[${severity}] SellersOps Alert" "${EMAIL_TO}" 2>/dev/null || true
}

# ============================================================================
# VERIFICAÇÕES DE SAÚDE
# ============================================================================

check_process_status() {
    log "🔍 Verificando status do processo..."

    if pm2 list | grep -q "${APP_NAME}.*online"; then
        alert_success "Processo PM2 está ONLINE"
        return 0
    elif pm2 list | grep -q "${APP_NAME}.*stopped"; then
        alert_critical "⚠️ Processo ${APP_NAME} foi PARADO!"
        pm2 start "${APP_NAME}" || alert_critical "Falha ao reiniciar ${APP_NAME}"
        return 1
    elif pm2 list | grep -q "${APP_NAME}.*errored"; then
        alert_critical "🔴 Processo ${APP_NAME} está em estado ERROR!"
        return 1
    else
        alert_critical "❌ Processo ${APP_NAME} NÃO ENCONTRADO no PM2!"
        return 1
    fi
}

check_port_listening() {
    log "🔍 Verificando se porta ${PORT} está aberta..."

    if netstat -tuln 2>/dev/null | grep -q ":${PORT} "; then
        alert_success "Porta ${PORT} está LISTENING"
        return 0
    else
        alert_critical "⚠️ Porta ${PORT} NÃO ESTÁ LISTENING!"
        return 1
    fi
}

check_http_response() {
    log "🔍 Verificando resposta HTTP..."

    local response=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout 5 "https://www.sellerops.com.br/" 2>/dev/null || echo "000")

    if [ "${response}" = "200" ] || [ "${response}" = "301" ] || [ "${response}" = "302" ]; then
        alert_success "HTTP Response: ${response} ✓"
        return 0
    else
        alert_critical "❌ HTTP Response: ${response} (esperado 200)"
        return 1
    fi
}

check_response_time() {
    log "🔍 Verificando tempo de resposta..."

    local response_time=$(curl -s -w "%{time_total}" -o /dev/null --connect-timeout 10 "https://www.sellerops.com.br/" 2>/dev/null | awk '{print $1 * 1000}' || echo "0")
    local response_time_int=${response_time%.*}

    if [ ${response_time_int} -lt ${RESPONSE_TIME_THRESHOLD} ]; then
        alert_success "Tempo de resposta: ${response_time_int}ms ✓"
        return 0
    else
        alert_warning "⚠️ Tempo de resposta LENTO: ${response_time_int}ms (limite: ${RESPONSE_TIME_THRESHOLD}ms)"
        return 1
    fi
}

check_disk_space() {
    log "🔍 Verificando espaço em disco..."

    local disk_usage=$(df "${APP_DIR}" | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ ${disk_usage} -gt ${DISK_THRESHOLD} ]; then
        alert_critical "⚠️ Disco CHEIO: ${disk_usage}% (limite: ${DISK_THRESHOLD}%)"
        return 1
    elif [ ${disk_usage} -gt 70 ]; then
        alert_warning "⚠️ Disco acima de 70%: ${disk_usage}%"
        return 1
    else
        alert_success "Espaço em disco: ${disk_usage}% ✓"
        return 0
    fi
}

check_cpu_usage() {
    log "🔍 Verificando uso de CPU..."

    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}' | cut -d'.' -f1)

    if [ ${cpu_usage} -gt ${CPU_THRESHOLD} ]; then
        alert_critical "⚠️ CPU ALTA: ${cpu_usage}% (limite: ${CPU_THRESHOLD}%)"
        return 1
    elif [ ${cpu_usage} -gt 60 ]; then
        alert_warning "⚠️ CPU elevada: ${cpu_usage}%"
        return 1
    else
        alert_success "Uso de CPU: ${cpu_usage}% ✓"
        return 0
    fi
}

check_memory_usage() {
    log "🔍 Verificando uso de memória..."

    local memory_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')

    if [ ${memory_usage} -gt ${MEMORY_THRESHOLD} ]; then
        alert_critical "⚠️ MEMÓRIA ALTA: ${memory_usage}% (limite: ${MEMORY_THRESHOLD}%)"
        return 1
    elif [ ${memory_usage} -gt 70 ]; then
        alert_warning "⚠️ Memória elevada: ${memory_usage}%"
        return 1
    else
        alert_success "Uso de memória: ${memory_usage}% ✓"
        return 0
    fi
}

check_recent_errors() {
    log "🔍 Verificando erros recentes..."

    # Verificar se há erros nos logs do PM2
    local error_count=$(pm2 logs "${APP_NAME}" --err 2>/dev/null | tail -20 | grep -i "error\|exception\|failed" | wc -l)

    if [ ${error_count} -gt 0 ]; then
        alert_warning "⚠️ ${error_count} erro(s) encontrado(s) nos logs"
        return 1
    else
        alert_success "Nenhum erro encontrado nos logs ✓"
        return 0
    fi
}

check_database_connection() {
    log "🔍 Verificando conexão com banco de dados..."

    # Verificar se pode fazer curl para um endpoint que usa DB
    local response=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout 5 "https://www.sellerops.com.br/api/health" 2>/dev/null || echo "000")

    if [ "${response}" = "200" ]; then
        alert_success "Conexão com banco de dados: OK ✓"
        return 0
    else
        alert_warning "⚠️ Health check retornou: ${response}"
        return 1
    fi
}

# ============================================================================
# RELATÓRIO COMPLETO
# ============================================================================

generate_full_report() {
    log ""
    log "════════════════════════════════════════════════════════════"
    log "📊 RELATÓRIO DE MONITORAMENTO COMPLETO"
    log "════════════════════════════════════════════════════════════"
    log ""

    # Informações do sistema
    log "📌 INFORMAÇÕES DO SISTEMA:"
    log "   Hostname: $(hostname)"
    log "   Data/Hora: $(date '+%Y-%m-%d %H:%M:%S')"
    log "   Uptime: $(uptime | awk -F'up' '{print $2}' | awk -F',' '{print $1 }')"
    log ""

    # Status da app
    log "🚀 STATUS DA APLICAÇÃO:"
    pm2 info "${APP_NAME}" 2>/dev/null | grep -E "status|uptime|pid|memory|cpu" | tee -a "${MONITORING_LOG}" || log "Erro ao obter info do PM2"
    log ""

    # Recursos
    log "💻 RECURSOS DO SISTEMA:"
    log "   CPU: $(nproc) cores"
    log "   RAM Total: $(free -h | grep Mem | awk '{print $2}')"
    log "   Espaço em disco: $(df -h "${APP_DIR}" | awk 'NR==2 {print $2}')"
    log ""

    # Últimas alterações
    log "📝 ÚLTIMOS COMMITS:"
    cd "${APP_DIR}"
    git log --oneline -5 2>/dev/null | tee -a "${MONITORING_LOG}"
    log ""

    log "════════════════════════════════════════════════════════════"
    log ""
}

# ============================================================================
# MODO CONTÍNUO
# ============================================================================

continuous_monitoring() {
    local interval=${1:-60}  # Padrão: 60 segundos

    log "🚀 Iniciando monitoramento contínuo (intervalo: ${interval}s)"
    log "Pressione Ctrl+C para parar"
    log ""

    trap 'echo ""; log "Monitoramento parado"; exit 0' INT

    while true; do
        clear

        # Header
        echo -e "${CYAN}"
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║        📊 SellersOps - Monitoring Dashboard               ║"
        echo "║        $(date '+%Y-%m-%d %H:%M:%S')                               ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo -e "${NC}"

        # Executar todas as verificações
        check_process_status
        echo ""

        check_port_listening
        echo ""

        check_http_response
        echo ""

        check_response_time
        echo ""

        check_cpu_usage
        echo ""

        check_memory_usage
        echo ""

        check_disk_space
        echo ""

        check_database_connection
        echo ""

        check_recent_errors
        echo ""

        log "⏳ Próxima verificação em ${interval} segundos..."
        sleep "${interval}"
    done
}

# ============================================================================
# MODO SINGLE CHECK
# ============================================================================

single_check() {
    log ""
    log "════════════════════════════════════════════════════════════"
    log "🔍 VERIFICAÇÃO DE SAÚDE RÁPIDA"
    log "════════════════════════════════════════════════════════════"
    log ""

    local status=0

    check_process_status || status=1
    echo ""

    check_port_listening || status=1
    echo ""

    check_http_response || status=1
    echo ""

    check_cpu_usage || status=1
    echo ""

    check_memory_usage || status=1
    echo ""

    check_disk_space || status=1
    echo ""

    log "════════════════════════════════════════════════════════════"

    return ${status}
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    mkdir -p "${LOG_DIR}"

    case "${1:-continuous}" in
        continuous)
            continuous_monitoring "${2:-60}"
            ;;
        once|check|single)
            single_check
            ;;
        report|full)
            generate_full_report
            ;;
        *)
            echo "Uso: $0 [comando] [opções]"
            echo ""
            echo "Comandos:"
            echo "  continuous [INTERVALO]  - Monitoramento contínuo (padrão: 60s)"
            echo "  once|check|single       - Uma verificação única"
            echo "  report|full             - Gerar relatório completo"
            echo ""
            echo "Exemplos:"
            echo "  $0 continuous 30        - Monitorar a cada 30 segundos"
            echo "  $0 once                 - Verificar uma vez e sair"
            echo "  $0 report               - Gerar relatório completo"
            exit 1
            ;;
    esac
}

main "$@"
