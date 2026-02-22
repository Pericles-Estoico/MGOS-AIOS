#!/bin/bash

################################################################################
# 🐕 Watchdog Script - Monitora app e faz auto-restart/deploy
# Como um "guardião" da aplicação
################################################################################

set -e

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

APP_NAME="sellerops"
APP_DIR="/var/www/sellerops"
WATCHDOG_LOG="${APP_DIR}/.deploy-logs/watchdog.log"
ALERTS_CONFIG="${APP_DIR}/.alerts-config"

CHECK_INTERVAL=30  # segundos
MAX_RESTART_ATTEMPTS=3
RESTART_COOLDOWN=60  # segundos

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Contadores
RESTART_COUNT=0
LAST_RESTART=0
CONSECUTIVE_FAILURES=0

# ============================================================================
# FUNÇÕES
# ============================================================================

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[${timestamp}]${NC} $@" | tee -a "${WATCHDOG_LOG}"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $@" | tee -a "${WATCHDOG_LOG}"
}

log_warn() {
    echo -e "${YELLOW}[⚠]${NC} $@" | tee -a "${WATCHDOG_LOG}"
}

log_error() {
    echo -e "${RED}[✗]${NC} $@" | tee -a "${WATCHDOG_LOG}"
}

# ============================================================================
# VERIFICAÇÕES
# ============================================================================

is_process_running() {
    pm2 list | grep -q "${APP_NAME}.*online"
}

is_port_listening() {
    netstat -tuln 2>/dev/null | grep -q ":3000 " || lsof -i :3000 &>/dev/null
}

is_http_responding() {
    local response=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout 5 "https://www.sellerops.com.br/" 2>/dev/null || echo "000")
    [ "${response}" = "200" ] || [ "${response}" = "301" ] || [ "${response}" = "302" ]
}

get_cpu_usage() {
    top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}' | cut -d'.' -f1
}

get_memory_usage() {
    free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}'
}

get_disk_usage() {
    df "${APP_DIR}" | awk 'NR==2 {print $5}' | sed 's/%//'
}

# ============================================================================
# ALERTAS
# ============================================================================

send_alert() {
    if [ -f "${ALERTS_CONFIG}" ]; then
        source "${ALERTS_CONFIG}" || true

        case "$1" in
            process-restart)
                if [ "${DISCORD_ENABLED}" = "true" ]; then
                    curl -X POST "${DISCORD_WEBHOOK}" \
                        -H 'Content-Type: application/json' \
                        -d "{\"embeds\": [{\"title\": \"🔄 Auto-Restart Acionado\", \"description\": \"Processo ${APP_NAME} foi reiniciado automaticamente\", \"color\": 16776960}]}" 2>/dev/null || true
                fi
                ;;
            process-down)
                if [ "${DISCORD_ENABLED}" = "true" ]; then
                    curl -X POST "${DISCORD_WEBHOOK}" \
                        -H 'Content-Type: application/json' \
                        -d "{\"embeds\": [{\"title\": \"🔴 Processo DOWN\", \"description\": \"Processo ${APP_NAME} parou de responder!\", \"color\": 15158332}]}" 2>/dev/null || true
                fi
                ;;
        esac
    fi
}

# ============================================================================
# RESTART AUTOMÁTICO
# ============================================================================

restart_process() {
    local current_time=$(date +%s)
    local time_since_last_restart=$((current_time - LAST_RESTART))

    # Verificar cooldown
    if [ ${time_since_last_restart} -lt ${RESTART_COOLDOWN} ]; then
        log_warn "⏳ Cooldown ativo (${RESTART_COOLDOWN}s). Aguardando..."
        return
    fi

    # Verificar limite de restarts
    if [ ${RESTART_COUNT} -ge ${MAX_RESTART_ATTEMPTS} ]; then
        log_error "❌ LIMITE DE RESTARTS ATINGIDO! Necessário intervenção manual"
        send_alert "process-down"
        exit 1
    fi

    log_warn "🔄 Reiniciando processo..."
    pm2 restart "${APP_NAME}" || {
        log_error "Falha ao reiniciar processo"
        return 1
    }

    log_success "✓ Processo reiniciado com sucesso"
    ((RESTART_COUNT++))
    LAST_RESTART=$(date +%s)
    send_alert "process-restart"

    # Aguardar 5s para app inicializar
    sleep 5

    return 0
}

# ============================================================================
# MONITORAR SAÚDE
# ============================================================================

check_health() {
    log "🔍 Verificando saúde da aplicação..."

    local status=0

    # Check 1: Processo rodando?
    if ! is_process_running; then
        log_error "❌ Processo não está rodando"
        ((CONSECUTIVE_FAILURES++))
        return 1
    else
        log_success "✓ Processo está rodando"
        CONSECUTIVE_FAILURES=0
    fi

    # Check 2: Porta listening?
    if ! is_port_listening; then
        log_warn "⚠️ Porta 3000 não está listening"
        ((CONSECUTIVE_FAILURES++))
        return 1
    else
        log_success "✓ Porta 3000 está listening"
    fi

    # Check 3: HTTP respondendo?
    if ! is_http_responding; then
        log_error "❌ HTTP não respondendo (esperado 200/301/302)"
        ((CONSECUTIVE_FAILURES++))
        return 1
    else
        log_success "✓ HTTP respondendo"
        CONSECUTIVE_FAILURES=0
    fi

    # Check 4: Recursos?
    local cpu=$(get_cpu_usage)
    local memory=$(get_memory_usage)
    local disk=$(get_disk_usage)

    if [ ${cpu} -gt 90 ]; then
        log_warn "⚠️ CPU CRÍTICA: ${cpu}%"
        status=1
    else
        log_success "✓ CPU: ${cpu}%"
    fi

    if [ ${memory} -gt 90 ]; then
        log_error "❌ MEMÓRIA CRÍTICA: ${memory}%"
        status=1
    else
        log_success "✓ Memória: ${memory}%"
    fi

    if [ ${disk} -gt 95 ]; then
        log_error "❌ DISCO CRÍTICO: ${disk}%"
        status=1
    else
        log_success "✓ Disco: ${disk}%"
    fi

    return ${status}
}

# ============================================================================
# VERIFICAÇÕES PERIÓDICAS
# ============================================================================

run_periodic_checks() {
    log ""
    log "════════════════════════════════════════════════════════════"
    log "📊 VERIFICAÇÃO DE SAÚDE - $(date '+%Y-%m-%d %H:%M:%S')"
    log "════════════════════════════════════════════════════════════"

    if check_health; then
        log_success "✅ Aplicação está SAUDÁVEL"
        RESTART_COUNT=0  # Reset restart count se app está ok
        return 0
    else
        log_error "❌ PROBLEMAS DETECTADOS"

        if [ ${CONSECUTIVE_FAILURES} -ge 2 ]; then
            log_warn "Múltiplas falhas detectadas (${CONSECUTIVE_FAILURES}), tentando restart..."
            restart_process
        fi

        return 1
    fi
}

# ============================================================================
# MODO DAEMON (BACKGROUND)
# ============================================================================

run_daemon() {
    log ""
    log "════════════════════════════════════════════════════════════"
    log "🐕 WATCHDOG INICIANDO EM MODO DAEMON"
    log "════════════════════════════════════════════════════════════"
    log "Intervalo de checagem: ${CHECK_INTERVAL} segundos"
    log "Max restart attempts: ${MAX_RESTART_ATTEMPTS}"
    log "Restart cooldown: ${RESTART_COOLDOWN} segundos"
    log ""

    # Criar arquivo PID
    local pid_file="${APP_DIR}/.watchdog.pid"
    echo $$ > "${pid_file}"

    trap 'rm -f "${pid_file}"; log "Watchdog parado"; exit 0' INT TERM

    while true; do
        run_periodic_checks || true
        sleep "${CHECK_INTERVAL}"
    done
}

# ============================================================================
# MODO INTERATIVO
# ============================================================================

run_interactive() {
    log ""
    log "════════════════════════════════════════════════════════════"
    log "🐕 WATCHDOG MODO INTERATIVO"
    log "════════════════════════════════════════════════════════════"
    log "Pressione Ctrl+C para sair"
    log ""

    trap 'log "Watchdog parado"; exit 0' INT

    while true; do
        clear
        echo -e "${BLUE}"
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║        🐕 SellersOps Watchdog - Verificação de Saúde      ║"
        echo "║        $(date '+%Y-%m-%d %H:%M:%S')                               ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo -e "${NC}"
        echo ""

        run_periodic_checks || true

        echo ""
        log "⏳ Próxima verificação em ${CHECK_INTERVAL}s... (Ctrl+C para sair)"
        sleep "${CHECK_INTERVAL}"
    done
}

# ============================================================================
# GERENCIAMENTO
# ============================================================================

start_watchdog() {
    local pid_file="${APP_DIR}/.watchdog.pid"

    if [ -f "${pid_file}" ]; then
        local existing_pid=$(cat "${pid_file}")
        if ps -p "${existing_pid}" > /dev/null 2>&1; then
            log_error "Watchdog já está rodando (PID: ${existing_pid})"
            return 1
        fi
    fi

    nohup "$0" daemon > /dev/null 2>&1 &
    log_success "Watchdog iniciado em background (PID: $!)"
}

stop_watchdog() {
    local pid_file="${APP_DIR}/.watchdog.pid"

    if [ ! -f "${pid_file}" ]; then
        log_error "Watchdog não está rodando"
        return 1
    fi

    local pid=$(cat "${pid_file}")
    kill "${pid}" 2>/dev/null || true
    rm -f "${pid_file}"
    log_success "Watchdog parado"
}

status_watchdog() {
    local pid_file="${APP_DIR}/.watchdog.pid"

    if [ ! -f "${pid_file}" ]; then
        log_warn "Watchdog não está rodando"
        return 1
    fi

    local pid=$(cat "${pid_file}")
    if ps -p "${pid}" > /dev/null 2>&1; then
        log_success "Watchdog está rodando (PID: ${pid})"
        return 0
    else
        log_error "Watchdog não está rodando (arquivo PID órfão)"
        rm -f "${pid_file}"
        return 1
    fi
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    mkdir -p "$(dirname "${WATCHDOG_LOG}")"

    case "${1:-interactive}" in
        daemon)
            run_daemon
            ;;
        interactive|monitor)
            run_interactive
            ;;
        start)
            start_watchdog
            ;;
        stop)
            stop_watchdog
            ;;
        status)
            status_watchdog
            ;;
        restart)
            stop_watchdog || true
            sleep 2
            start_watchdog
            ;;
        once|check)
            run_periodic_checks
            ;;
        *)
            echo "Uso: $0 [comando]"
            echo ""
            echo "Modos de execução:"
            echo "  daemon          - Rodar em background (recomendado)"
            echo "  interactive     - Rodar interativo no terminal"
            echo "  monitor         - Alias para 'interactive'"
            echo ""
            echo "Gerenciamento:"
            echo "  start           - Iniciar watchdog em background"
            echo "  stop            - Parar watchdog"
            echo "  status          - Ver status do watchdog"
            echo "  restart         - Reiniciar watchdog"
            echo ""
            echo "Testes:"
            echo "  once|check      - Uma verificação única"
            echo ""
            echo "Exemplos:"
            echo "  $0 start        - Iniciar em background"
            echo "  $0 daemon       - Rodar em primeiro plano"
            echo "  $0 interactive  - Monitorar interativamente"
            exit 1
            ;;
    esac
}

main "$@"
