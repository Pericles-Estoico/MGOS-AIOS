# NEXO Orchestration - Testing Guide

**Completo guia para testar o sistema de orquestração NEXO em diferentes ambientes.**

## 🎯 Teste Rápido (Verificar se está deployado)

```bash
# Verificar se os endpoints existem e estão protegidos
curl https://www.sellerops.com.br/api/marketplace/orchestration/status
# Esperado: {"error":"Unauthorized"} com HTTP 401
```

Se receber 401 = ✅ **Sistema está deployado corretamente**

---

## 🌐 Teste no Navegador (Recomendado)

### Pré-requisitos:
- Estar logado em https://www.sellerops.com.br
- Ter acesso de admin ou head

### Passos:

1. **Abra o Console do Navegador:**
   ```
   Windows/Linux: Ctrl + Shift + I (ou F12)
   Mac: Cmd + Option + I
   ```

2. **Vá para a aba "Console"**

3. **Cole este script completo:**
   ```javascript
   // Cole o conteúdo de: scripts/test-nexo-browser.js
   ```

4. **Aperte Enter e observe os resultados:**
   ```
   ✅ Test 1: GET /api/marketplace/orchestration/status
   ✅ Test 2: GET /api/marketplace/orchestration/metrics
   ✅ Test 3: GET /api/marketplace/orchestration/metrics?agent=alex
   ✅ Test 4: GET /api/marketplace/orchestration/metrics?channel=amazon
   ⚠️ Test 5: POST /api/marketplace/orchestration/activate (requer admin)
   ```

### Ou use o script pronto:

```bash
# Copie o script para o console do navegador
cat scripts/test-nexo-browser.js

# Ou abra direto:
# https://www.sellerops.com.br
# DevTools (F12) → Console → Cole o script
```

---

## 💻 Teste Local (Desenvolvimento)

### Pré-requisitos:
```bash
npm install
export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Opção 1: Test Script Bash

```bash
# Teste todos os endpoints em localhost
bash scripts/test-nexo-orchestration.sh

# Esperado output:
# ✅ Health Check - Verify API is responding
# ✅ Authentication - Get NextAuth session
# ✅ Get Orchestration Status - Before activation
# ✅ Activate NEXO Orchestration
# ✅ Get Orchestration Status - After activation
# ✅ Get Performance Metrics - System-wide
# ✅ Get Performance Metrics - By agent (alex)
# ✅ Get Performance Metrics - By channel (amazon)
```

### Opção 2: TypeScript Local Test

```bash
# Executa testes contra o banco de dados real
npx ts-node scripts/test-nexo-local.ts

# Mostra:
# - Tarefas geradas por agente
# - Métricas de performance
# - Saúde do sistema
# - Recomendações de otimização
```

---

## 🚀 Teste de Ativação (Com Admin)

### Via Dashboard:

1. Login em https://www.sellerops.com.br
2. Vá para Settings → Marketplace Orchestration (quando UI estiver pronta)
3. Clique "Activate NEXO"
4. Selecione os canais:
   - Amazon
   - MercadoLivre
   - Shopee
   - Shein
   - TikTok Shop
   - Kaway
5. Observe as tarefas sendo geradas em tempo real

### Via API (cURL):

```bash
# Requer estar logado (uso de cookies/session)
curl -X POST https://www.sellerops.com.br/api/marketplace/orchestration/activate \
  -H "Content-Type: application/json" \
  -d '{
    "channels": ["amazon", "mercadolivre", "shopee"]
  }'

# Resposta esperada:
{
  "status": "success",
  "message": "Orchestration activated",
  "plan": {
    "planId": "plan-1708785000000",
    "totalTasksGenerated": 12,
    "status": "executing"
  }
}
```

---

## 📊 Teste de Métricas

### 1. Métricas do Sistema Inteiro:

```bash
curl https://www.sellerops.com.br/api/marketplace/orchestration/metrics

# Retorna:
{
  "status": "success",
  "system": {
    "systemHealth": "good",
    "totalAgents": 6,
    "activeAgents": 4,
    "totalTasksGenerated": 45,
    "totalTasksCompleted": 12,
    "bottlenecks": ["Alex com baixo desempenho"],
    "recommendations": ["Revise critérios de aprovação"]
  },
  "agents": [
    {
      "agentId": "alex",
      "agentName": "Alex",
      "performanceScore": 68,
      "tasksGenerated": 12,
      "approvalRate": 83.3,
      "completionRate": 41.7
    }
    // ... outros agentes
  ]
}
```

### 2. Métricas de Um Agente:

```bash
curl https://www.sellerops.com.br/api/marketplace/orchestration/metrics?agent=alex

# Retorna métricas detalhadas apenas de Alex:
{
  "metrics": {
    "agentId": "alex",
    "agentName": "Alex",
    "tasksGenerated": 12,
    "tasksApproved": 10,
    "tasksCompleted": 5,
    "approvalRate": 83.3,
    "completionRate": 41.7,
    "averageExecutionTime": 240,
    "performanceScore": 68,
    "lastActivity": "2026-02-24T12:45:30.000Z"
  }
}
```

### 3. Métricas de Um Canal:

```bash
curl https://www.sellerops.com.br/api/marketplace/orchestration/metrics?channel=amazon

# Retorna:
{
  "metrics": {
    "channel": "amazon",
    "totalTasks": 45,
    "completionRate": 26.7,
    "avgCompletionTime": 12.5,
    "activeAgents": 1,
    "topAgent": "alex",
    "recommendations": [
      "⚠️ Baixa taxa de conclusão. Verifique gargalos no workflow.",
      "📈 Aumente volume de tarefas. Ative mais agentes."
    ]
  }
}
```

---

## 🔍 Entendendo os Resultados

### Performance Score (0-100):
```
80+ = ✅ Excelente (agente está otimizado)
60-79 = ⚠️ Bom (mas pode melhorar)
<60 = ❌ Crítico (precisa de otimização)
```

Fórmula: `(approvalRate * 0.5) + (completionRate * 0.3) + (executionTime * 0.2)`

### System Health:
```
Excellent ✅ = approval ≥85% AND completion ≥85%
Good ✅     = approval ≥70% AND completion ≥70%
Fair ⚠️     = approval 60-70% OR completion 60-70%
Poor ❌     = approval <60% OR completion <60%
```

### Bottlenecks:
- **Agentes com score < 50** = Identificados como gargalos
- **Taxa de aprovação < 70%** = Critérios de aprovação muito rigorosos
- **Taxa de conclusão < 60%** = Workflow de execução lento

---

## 🐛 Troubleshooting

### "401 Unauthorized"
**Causa:** Não está autenticado
**Solução:** Login primeiro em https://www.sellerops.com.br

### "403 Forbidden" (no endpoint activate)
**Causa:** Seu papel (role) não é admin/head
**Solução:** Contate admin para elevar seu rol

### "0 tasks generated"
**Causa:** Agentes não geraram tarefas
**Solução:** Verifique:
- OpenAI API está configurada
- Agent prompts estão corretos
- Marketplace data está disponível

### Performance score = 0
**Causa:** Nenhuma tarefa foi completada ainda
**Solução:** Aguarde tarefas serem processadas

---

## 📈 Monitoramento Contínuo

### Para DevOps:

```bash
# Monitorar saúde a cada 5 minutos
while true; do
  curl -s https://www.sellerops.com.br/api/marketplace/orchestration/metrics \
    | jq '.system.systemHealth'
  sleep 300
done
```

### Para Analistas:

1. **Gerar relatório diário:**
   ```bash
   curl https://www.sellerops.com.br/api/marketplace/orchestration/status \
     | jq '.report' > nexo_report_$(date +%Y%m%d).md
   ```

2. **Acompanhar por agente:**
   ```bash
   for agent in alex marina sunny tren viral premium; do
     echo "=== $agent ==="
     curl https://www.sellerops.com.br/api/marketplace/orchestration/metrics?agent=$agent \
       | jq '.metrics'
   done
   ```

---

## ✅ Checklist de Validação

- [ ] Health check retorna 200
- [ ] Endpoints retornam 401 sem autenticação
- [ ] Endpoints retornam 200 com autenticação
- [ ] Status mostra todos 6 agentes
- [ ] Métricas calculam scores corretamente
- [ ] Ativação (com admin) cria tarefas
- [ ] Relatórios gerados em markdown
- [ ] Recommendações aparecem no report
- [ ] Gargalos são identificados
- [ ] Sistema health é calculado

---

## 📞 Próximas Etapas

1. **Dashboard UI** (Phase 2)
   - Visualização em tempo real
   - Gráficos de performance
   - Alertas de gargalos

2. **Execução de Tarefas** (Phase 3)
   - Rastreamento de status
   - Integração com APIs dos marketplaces
   - Notificações

3. **Otimização Avançada** (Phase 4)
   - Machine learning
   - Adaptive agent weights
   - A/B testing

---

**Documentação:** `docs/NEXO-ORCHESTRATION-IMPLEMENTATION.md`
**Código:** `lib/marketplace-orchestration/`
**APIs:** `app/api/marketplace/orchestration/`
