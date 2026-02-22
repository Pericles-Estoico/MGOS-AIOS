# 📊 Monitoring & Alerts Guide - SellersOps

Guia completo para monitorar a aplicação e configurar alertas automáticos.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Scripts Disponíveis](#scripts-disponíveis)
3. [Configuração de Alertas](#configuração-de-alertas)
4. [Monitoramento em Tempo Real](#monitoramento-em-tempo-real)
5. [Watchdog - Auto-Restart](#watchdog---auto-restart)
6. [Integração com GitHub Deploy](#integração-com-github-deploy)
7. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral

Sistema completo de **Monitoramento + Alertas + Auto-Restart**:

```
┌─────────────────────────────────────────────────────┐
│          SellersOps Monitoring System                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🐕 WATCHDOG                                        │
│  └─ Monitora app continuamente                      │
│  └─ Auto-restart se cair                            │
│  └─ Emite alertas                                   │
│                                                     │
│  📊 MONITORING                                      │
│  └─ CPU, Memória, Disco                             │
│  └─ HTTP Status e Response Time                     │
│  └─ Logs de erro                                    │
│  └─ Dashboard em tempo real                         │
│                                                     │
│  🚨 ALERTAS                                         │
│  └─ Slack 💬                                        │
│  └─ Discord 🎮                                      │
│  └─ Email 📧                                        │
│  └─ Telegram 📱                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Scripts Disponíveis

### 1. **`monitoring.sh`** - Monitoramento
Verifica saúde da aplicação e sistema

```bash
./scripts/monitoring.sh [comando] [opções]

Comandos:
  continuous [INTERVAL]  - Monitoramento contínuo
  once|check|single      - Uma verificação
  report|full            - Relatório completo
```

### 2. **`alerts.sh`** - Sistema de Alertas
Envia notificações para múltiplos canais

```bash
./scripts/alerts.sh [comando] [opções]

Exemplos:
  alerts.sh slack info "Título" "Mensagem"
  alerts.sh discord warning "Aviso" "Descrição"
  alerts.sh test-slack
  alerts.sh test-discord
```

### 3. **`watchdog.sh`** - Guardião Automático
Monitora e reinicia a app automaticamente

```bash
./scripts/watchdog.sh [comando]

Comandos:
  start               - Iniciar em background
  daemon              - Rodar em primeiro plano
  interactive|monitor - Monitorar interativamente
  status              - Ver status
  stop                - Parar watchdog
```

---

## ⚙️ Configuração de Alertas

### Passo 1: Criar Arquivo de Configuração

No VPS, o arquivo é criado automaticamente:

```bash
cat /var/www/sellerops/.alerts-config
```

### Passo 2: Configurar Slack

**No Slack:**
1. Ir para: https://api.slack.com/apps
2. Clicar "Create New App"
3. Selecionar "From scratch"
4. Nome: `SellersOps Monitoring`
5. Workspace: seu workspace
6. Ativar "Incoming Webhooks"
7. Clicar "Add New Webhook to Workspace"
8. Selecionar canal: `#alerts`
9. Copiar URL do webhook

**No VPS, editar config:**

```bash
ssh raiz@srv1346992.hstgr.cloud

# Editar arquivo
nano /var/www/sellerops/.alerts-config

# Ou:
source /var/www/sellerops/.alerts-config

# Adicionar webhook
SLACK_ENABLED=true
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Testar:**

```bash
/var/www/sellerops/scripts/alerts.sh test-slack
# Você deve receber mensagem no Slack em ~1s
```

### Passo 3: Configurar Discord

**No Discord:**
1. Clicar em canal
2. Settings ⚙️ → Webhooks
3. "New Webhook"
4. Nome: `SellersOps`
5. Clicar "Copy Webhook URL"

**No VPS:**

```bash
nano /var/www/sellerops/.alerts-config

# Adicionar:
DISCORD_ENABLED=true
DISCORD_WEBHOOK="https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"
```

**Testar:**

```bash
/var/www/sellerops/scripts/alerts.sh test-discord
```

### Passo 4: Configurar Email (Opcional)

**Instalar mailutils:**

```bash
apt install -y mailutils
```

**No VPS, editar config:**

```bash
nano /var/www/sellerops/.alerts-config

# Adicionar:
EMAIL_ENABLED=true
EMAIL_TO="seu-email@example.com"
EMAIL_FROM="alerts@sellerops.com.br"
```

**Testar:**

```bash
/var/www/sellerops/scripts/alerts.sh test-email
```

### Passo 5: Configurar Telegram (Opcional)

**No Telegram:**
1. Abrir @BotFather
2. `/newbot`
3. Nome: SellersOps Monitoring
4. Username: sellerops_monitoring_bot
5. Copiar token

**Obter CHAT_ID:**
1. Enviar mensagem qualquer para o bot
2. Ir para: `https://api.telegram.org/bot{TOKEN}/getUpdates`
3. Copiar `chat.id`

**No VPS:**

```bash
nano /var/www/sellerops/.alerts-config

# Adicionar:
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN="seu-bot-token"
TELEGRAM_CHAT_ID="seu-chat-id"
```

**Testar:**

```bash
/var/www/sellerops/scripts/alerts.sh test-telegram
```

---

## 🔍 Monitoramento em Tempo Real

### Modo Contínuo (Dashboard)

```bash
ssh raiz@srv1346992.hstgr.cloud

# Monitorar a cada 60 segundos (padrão)
/var/www/sellerops/scripts/monitoring.sh continuous

# Ou a cada 30 segundos
/var/www/sellerops/scripts/monitoring.sh continuous 30

# Sair: Ctrl+C
```

**Saída:**

```
═══════════════════════════════════════════════════════════
        📊 SellersOps - Monitoring Dashboard
        2026-02-22 14:30:45
═══════════════════════════════════════════════════════════

🔍 Verificando status do processo...
[✓] Processo PM2 está ONLINE

🔍 Verificando se porta 3000 está aberta...
[✓] Porta 3000 está LISTENING

🔍 Verificando resposta HTTP...
[✓] HTTP Response: 200 ✓

🔍 Verificando tempo de resposta...
[✓] Tempo de resposta: 245ms ✓

🔍 Verificando uso de CPU...
[✓] Uso de CPU: 12% ✓

🔍 Verificando uso de memória...
[✓] Uso de memória: 45% ✓

🔍 Verificando espaço em disco...
[✓] Espaço em disco: 65% ✓

🔍 Verificando conexão com banco de dados...
[✓] Conexão com banco de dados: OK ✓

🔍 Verificando erros recentes...
[✓] Nenhum erro encontrado nos logs ✓

⏳ Próxima verificação em 60 segundos...
```

### Verificação Única (Rápida)

```bash
/var/www/sellerops/scripts/monitoring.sh once
```

### Relatório Completo

```bash
/var/www/sellerops/scripts/monitoring.sh report
```

---

## 🐕 Watchdog - Auto-Restart

Monitora continuamente e reinicia a app se cair.

### Iniciar Watchdog em Background

```bash
ssh raiz@srv1346992.hstgr.cloud

# Iniciar
/var/www/sellerops/scripts/watchdog.sh start

# Ver status
/var/www/sellerops/scripts/watchdog.sh status

# Parar
/var/www/sellerops/scripts/watchdog.sh stop
```

### Rodar Interativamente (para testes)

```bash
/var/www/sellerops/scripts/watchdog.sh interactive

# Ou:
/var/www/sellerops/scripts/watchdog.sh monitor
```

### Configurar para Iniciar Automaticamente

```bash
ssh raiz@srv1346992.hstgr.cloud

# Criar script de inicialização
cat > /etc/init.d/sellerops-watchdog << 'EOF'
#!/bin/bash
### BEGIN INIT INFO
# Provides:          sellerops-watchdog
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Description:       SellersOps Watchdog
### END INIT INFO

case "$1" in
    start)
        /var/www/sellerops/scripts/watchdog.sh start
        ;;
    stop)
        /var/www/sellerops/scripts/watchdog.sh stop
        ;;
    restart)
        /var/www/sellerops/scripts/watchdog.sh restart
        ;;
esac
EOF

chmod +x /etc/init.d/sellerops-watchdog
update-rc.d sellerops-watchdog defaults

# Verificar
/etc/init.d/sellerops-watchdog start
/etc/init.d/sellerops-watchdog status
```

### Comportamento do Watchdog

```
┌─────────────────────────────────────────────┐
│ 🐕 WATCHDOG RODANDO                         │
├─────────────────────────────────────────────┤
│                                             │
│ A cada 30 segundos:                         │
│ 1️⃣  Verifica se processo está rodando      │
│ 2️⃣  Verifica se porta está aberta          │
│ 3️⃣  Verifica se HTTP responde              │
│ 4️⃣  Verifica CPU, memória, disco           │
│                                             │
│ SE FALHAR (2x):                             │
│ 1️⃣  Emite alerta (Slack/Discord)           │
│ 2️⃣  Tenta reiniciar (máx 3x)               │
│ 3️⃣  Aguarda 60s entre restarts             │
│ 4️⃣  Se falha persistirem → alerta crítico  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔄 Integração com GitHub Deploy

Conectar alertas ao script de deployment:

### Modificar `deploy.sh`

```bash
# No início do script, adicionar:
source /var/www/sellerops/.alerts-config 2>/dev/null || true

# Após iniciar deployment:
/var/www/sellerops/scripts/alerts.sh deployment-started "main" "$(git rev-parse --short HEAD)"

# Se sucesso:
/var/www/sellerops/scripts/alerts.sh deployment-success "main" "${duration}"

# Se falha:
/var/www/sellerops/scripts/alerts.sh deployment-failed "main" "${error_message}"
```

**Resultado:** Quando você faz deploy, recebe notificação automática no Slack/Discord!

---

## 💡 Exemplos Práticos

### Exemplo 1: App caiu, watchdog detecta e reinicia

```
[14:30:45] 🔍 Verificando saúde da aplicação...
[14:30:46] ❌ Processo não está rodando
[14:30:47] Múltiplas falhas detectadas (2), tentando restart...
[14:30:48] 🔄 Reiniciando processo...
[14:30:50] ✓ Processo reiniciado com sucesso
[14:30:55] 🔍 Verificando saúde da aplicação...
[14:30:56] ✓ Processo está rodando
[14:30:57] ✓ Porta 3000 está listening
[14:30:58] ✓ HTTP respondendo
[14:31:00] ✅ Aplicação está SAUDÁVEL

# Neste momento, Discord/Slack recebem:
# "🔄 Auto-Restart Acionado - Processo sellerops foi reiniciado"
```

### Exemplo 2: Monitorar continuamente

```bash
# Terminal 1 - Watchdog em background
/var/www/sellerops/scripts/watchdog.sh start

# Terminal 2 - Monitoramento visual
/var/www/sellerops/scripts/monitoring.sh continuous 30

# Terminal 3 - Ver logs
tail -f /var/www/sellerops/.deploy-logs/watchdog.log
```

### Exemplo 3: Testar alertas

```bash
# Testar Slack
/var/www/sellerops/scripts/alerts.sh test-slack

# Testar Discord
/var/www/sellerops/scripts/alerts.sh test-discord

# Enviar alerta customizado
/var/www/sellerops/scripts/alerts.sh discord warning "⚠️ Teste" "Isso é um alerta de teste"
```

### Exemplo 4: Ver logs

```bash
# Logs do watchdog
tail -f /var/www/sellerops/.deploy-logs/watchdog.log

# Logs de monitoramento
tail -f /var/www/sellerops/.deploy-logs/monitoring.log

# Logs de deployment
tail -f /var/www/sellerops/.deploy-logs/deploy.log
```

---

## 📝 Aliases Úteis

Adicionados automaticamente pelo `setup-deploy.sh`:

```bash
# Monitoramento
sellerops-logs              # Ver logs PM2 em tempo real
sellerops-status            # Status da app
sellerops-info              # Informações detalhadas
sellerops-deploy-logs       # Ver logs de deployment

# Watchdog
sellerops-watchdog-start    # Iniciar watchdog
sellerops-watchdog-stop     # Parar watchdog
sellerops-watchdog-status   # Status do watchdog
```

---

## 🔧 Troubleshooting

### Alertas não estão sendo enviados

```bash
# 1. Verificar configuração
cat /var/www/sellerops/.alerts-config

# 2. Testar conexão
/var/www/sellerops/scripts/alerts.sh test-slack

# 3. Verificar logs
tail -f /var/www/sellerops/.deploy-logs/watchdog.log
```

### Watchdog não está rodando

```bash
# 1. Verificar status
/var/www/sellerops/scripts/watchdog.sh status

# 2. Ver logs
tail -20 /var/www/sellerops/.deploy-logs/watchdog.log

# 3. Reiniciar
/var/www/sellerops/scripts/watchdog.sh restart
```

### Monitoramento mostrando valores estranhos

```bash
# 1. Rodar uma verificação única
/var/www/sellerops/scripts/monitoring.sh once

# 2. Gerar relatório completo
/var/www/sellerops/scripts/monitoring.sh report

# 3. Verificar comandos manualmente
top -bn1 | head
free -h
df -h /var/www/sellerops
```

---

## 📊 Dashboard Recomendado

Para monitoramento visual, use:

1. **PM2 Plus** (gratuito)
   ```bash
   pm2 web  # Acessa em http://localhost:9615
   ```

2. **Grafana** (avançado)
   Integrar com Prometheus para métricas

3. **Discord Channel** (simples)
   Configure alerts e veja tudo em um canal privado

---

## 🎯 Próximos Passos

1. ✅ Instalar scripts (via `setup-deploy.sh`)
2. ✅ Configurar Slack/Discord
3. ✅ Testar alertas
4. ✅ Iniciar watchdog em background
5. ✅ Monitorar durante o primeiro deploy
6. ✅ Ajustar thresholds conforme necessário

---

**Last Updated:** 2026-02-22
**Status:** ✅ Completo e pronto para usar
