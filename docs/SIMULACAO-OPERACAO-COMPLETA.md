# 🎬 Simulação Completa de Uma Operação NEXO

**Data:** 2026-02-24
**Objetivo:** Demonstrar o fluxo completo: Upload → Análise → Aprovação → Tarefas → Execução

---

## 🎯 Cenário: Otimizar Listings de Bebês no Shopee

Você quer otimizar seus produtos de moda bebê no Shopee. Vamos fazer o sistema inteiro rodar!

---

## 📋 PARTE 1: Upload de Arquivo (Knowledge Base)

### Passo 1.1: Preparar arquivo de teste

Criar arquivo `market-data.csv`:
```csv
canal,categoria,preco_atual,preco_concorrente,taxa_conversao,imagens_qualidade
shopee,recem_nascido,89.90,79.90,2.1%,baixa
shopee,0-3_meses,120.00,99.90,1.8%,media
shopee,3-6_meses,150.00,129.90,2.5%,alta
shopee,6-12_meses,180.00,159.90,3.2%,alta
shopee,1-2_anos,220.00,199.90,2.8%,media
```

### Passo 1.2: Fazer upload via curl

```bash
curl -X POST http://localhost:3000/api/marketplace/knowledge-base/upload \
  -F "file=@market-data.csv" \
  -F 'marketplaces=["shopee"]' \
  -F "autoGenerateTasks=false"
```

**Esperado:**
```json
{
  "status": "success",
  "entry": {
    "id": "kb-123456",
    "filename": "market-data.csv",
    "summary": "Análise de preços e qualidade de imagens para moda bebê no Shopee"
  },
  "analysis": {
    "keyInsights": [
      "Preços competitivos em categorias 0-3 meses",
      "Qualidade de imagens impacta taxa de conversão",
      "Oportunidade em pricing para recém-nascidos"
    ],
    "recommendations": [
      "Reduzir preço em categoria recém-nascido para 79.90",
      "Melhorar qualidade de imagens para 3-6 meses",
      "Aumentar descrição com informações de tamanho"
    ]
  }
}
```

✅ **Resultado:** Knowledge Base entry criada com análise automática!

---

## 📊 PARTE 2: Criar Análise Estratégica

### Passo 2.1: Executar análise (multi-agente)

```bash
curl -X POST http://localhost:3000/api/marketplace/analysis/run \
  -H "Content-Type: application/json" \
  -d '{
    "channels": ["shopee"]
  }'
```

**Processo (internamente):**
- Sistema chama agente `Sunny` (especialista em Shopee)
- Sunny analisa dados de moda bebê
- Gera 5-7 oportunidades estratégicas
- Define 3 fases de implementação
- Cria métricas de sucesso

**Esperado (em 10-15 segundos):**
```json
{
  "planId": "plan-xyz789",
  "status": "pending",
  "channels": ["shopee"],
  "summary": "Plano estratégico para otimizar linha de moda bebê no Shopee",
  "createdAt": "2026-02-24T10:30:00Z"
}
```

✅ **Resultado:** Análise estratégica criada e salva em `marketplace_plans`!

---

## ✅ PARTE 3: Aprovar Análise

### Passo 3.1: Listar análises pendentes

```bash
curl http://localhost:3000/api/marketplace/analysis?status=pending
```

**Resposta:**
```json
{
  "plans": [
    {
      "id": "plan-xyz789",
      "title": "Análise shopee - Moda Bebê",
      "status": "pending",
      "channels": ["shopee"],
      "plan_data": {
        "summary": "...",
        "opportunities": [
          {
            "id": 1,
            "priority": "alta",
            "title": "Otimizar Preços em Recém-nascidos",
            "what": "Reduzir preço de 89.90 para 79.90",
            "why": "Aumentar competitividade",
            "how": "Atualizar listing no Shopee"
          },
          {
            "id": 2,
            "priority": "alta",
            "title": "Melhorar Qualidade de Imagens",
            "what": "Re-fotografar produtos com fundo branco",
            "why": "Taxa de conversão sobe 25-30%",
            "how": "Sessão de fotos profissional"
          },
          ...
        ],
        "phases": [
          {
            "number": 1,
            "name": "Otimizações Rápidas",
            "weeks": "Semanas 1-2",
            "tasks": ["Atualizar preços", "Revisar descrições"]
          },
          ...
        ]
      }
    }
  ],
  "pendingCount": 1
}
```

### Passo 3.2: Aprovar a análise

```bash
curl -X PATCH http://localhost:3000/api/marketplace/analysis/plan-xyz789 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "reason": "Aprovado pelo usuário"
  }'
```

**Processo (internamente):**
1. Status muda de "pending" → "approved"
2. Sistema tenta enfileirar com Redis
3. Se Redis falhar → cria Phase 1 tasks **sincronamente**
4. 3-5 Phase 1 tasks são criadas
5. Retorna `jobId` para polling

**Esperado:**
```json
{
  "status": "approved",
  "message": "Plano aprovado. Tarefas sendo processadas...",
  "jobId": "sync-plan-xyz789-1708748400000",
  "pollUrl": "/api/marketplace/jobs/sync-plan-xyz789-1708748400000"
}
```

✅ **Resultado:** Análise aprovada, Phase 1 tasks criadas!

---

## 🎯 PARTE 4: Verificar Phase 1 Tasks Criadas

### Passo 4.1: Listar tasks criadas

```bash
curl http://localhost:3000/api/tasks?status=pending&channel=shopee
```

**Esperado:**
```json
{
  "tasks": [
    {
      "id": "task-001",
      "title": "Otimizar Preços - Recém-nascidos",
      "description": "Reduzir preço de 89.90 para 79.90 para aumentar competitividade",
      "channel": "shopee",
      "status": "pending",
      "priority": "high",
      "phase": 1,
      "createdAt": "2026-02-24T10:32:00Z"
    },
    {
      "id": "task-002",
      "title": "Otimizar Qualidade de Imagens",
      "description": "Re-fotografar produtos com fundo branco para melhorar taxa de conversão",
      "channel": "shopee",
      "status": "pending",
      "priority": "high",
      "phase": 1,
      "createdAt": "2026-02-24T10:32:00Z"
    },
    {
      "id": "task-003",
      "title": "Revisar Descrições de Produtos",
      "description": "Atualizar descrições com informações de tamanho e material",
      "channel": "shopee",
      "status": "pending",
      "priority": "medium",
      "phase": 1,
      "createdAt": "2026-02-24T10:32:00Z"
    }
  ],
  "total": 3
}
```

✅ **Resultado:** 3 Phase 1 tasks criadas e prontas!

---

## 🚀 PARTE 5: Atribuir Task a um Agente

### Passo 5.1: Atribuir task

```bash
curl -X PATCH http://localhost:3000/api/tasks/task-001 \
  -H "Content-Type: application/json" \
  -d '{
    "assignedTo": "sunny",
    "status": "assigned"
  }'
```

**Esperado:**
```json
{
  "id": "task-001",
  "title": "Otimizar Preços - Recém-nascidos",
  "status": "assigned",
  "assignedTo": "sunny",
  "priority": "high"
}
```

✅ **Resultado:** Task atribuída ao agente Sunny!

---

## ⚡ PARTE 6: Iniciar Execução da Task

### Passo 6.1: Marcar como "em execução"

```bash
curl -X PATCH http://localhost:3000/api/tasks/task-001 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

**Esperado:**
```json
{
  "id": "task-001",
  "status": "in_progress",
  "startedAt": "2026-02-24T10:35:00Z",
  "agent": "sunny"
}
```

### Passo 6.2: Simular execução com resultado

```bash
curl -X POST http://localhost:3000/api/tasks/task-001/complete \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "result": {
      "action": "price_updated",
      "channel": "shopee",
      "product": "Roupa Recém-nascido",
      "oldPrice": 89.90,
      "newPrice": 79.90,
      "expectedImpact": "15-20% aumento em conversões",
      "executedAt": "2026-02-24T10:40:00Z"
    }
  }'
```

**Esperado:**
```json
{
  "id": "task-001",
  "status": "completed",
  "result": {
    "action": "price_updated",
    "newPrice": 79.90,
    "expectedImpact": "15-20%"
  },
  "completedAt": "2026-02-24T10:40:00Z"
}
```

✅ **Resultado:** Task executada com sucesso!

---

## 📈 PARTE 7: Ver Resultados & Métricas

### Passo 7.1: Verificar status da análise

```bash
curl http://localhost:3000/api/marketplace/analysis/plan-xyz789
```

**Esperado:**
```json
{
  "status": "executing",
  "title": "Análise shopee - Moda Bebê",
  "phase1_tasks_created": true,
  "phase1_tasks_count": 3,
  "phase1_completed": 1,
  "phase1_success_rate": 33.3,
  "metrics": [
    {
      "label": "Preço Médio",
      "baseline": 130.00,
      "current": 120.00,
      "goal": 115.00,
      "progress": 45
    },
    {
      "label": "Taxa de Conversão",
      "baseline": 2.3,
      "current": 2.8,
      "goal": 3.5,
      "progress": 33
    }
  ]
}
```

### Passo 7.2: Ver dashboard de métricas

```bash
curl http://localhost:3000/api/marketplace/orchestration/metrics
```

**Esperado:**
```json
{
  "system": {
    "activeAgents": 6,
    "totalAgents": 6,
    "totalTasksGenerated": 3,
    "totalTasksCompleted": 1,
    "systemHealth": "good",
    "uptime": "24h"
  },
  "channels": {
    "shopee": {
      "tasksGenerated": 3,
      "tasksCompleted": 1,
      "successRate": 33.3,
      "avgCompletionTime": 5
    }
  }
}
```

✅ **Resultado:** Métricas em tempo real mostrando progresso!

---

## 🎉 PARTE 8: Completar Phase 1 e Ir para Phase 2

### Passo 8.1: Completar as outras 2 tasks (task-002 e task-003)

Repetir Passo 6 para cada task...

### Passo 8.2: Quando Phase 1 estiver 100% completo

```bash
curl -X POST http://localhost:3000/api/marketplace/orchestration/phase-transition \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan-xyz789",
    "toPhase": 2
  }'
```

**Esperado:**
```json
{
  "status": "success",
  "planId": "plan-xyz789",
  "phase": 2,
  "message": "Phase 1 concluída! Phase 2 tasks geradas.",
  "phase2TasksCreated": 5
}
```

✅ **Resultado:** Sistema avança automaticamente para Phase 2!

---

## 📊 RESUMO DO FLUXO COMPLETO

```
1. Upload arquivo → Knowledge Base criada ✅
                        ↓
2. Análise estratégica → Plano criado ✅
                        ↓
3. Aprovação → Phase 1 tasks criadas ✅
                        ↓
4. Atribuição → Tasks atribuídas a agentes ✅
                        ↓
5. Execução → Agentes executam tasks ✅
                        ↓
6. Coleta de resultados → Métricas atualizadas ✅
                        ↓
7. Phase 1 completa → Phase 2 criada automaticamente ✅
                        ↓
8. Repetir para Phase 2 e 3...
```

---

## 🛠️ COMANDOS RÁPIDOS (Copiar & Colar)

```bash
# 1. Auto-approve análises pendentes
curl -X POST http://localhost:3000/api/marketplace/recover/auto-approve

# 2. Listar análises
curl http://localhost:3000/api/marketplace/analysis

# 3. Listar Phase 1 tasks
curl "http://localhost:3000/api/tasks?status=pending&phase=1"

# 4. Ver métricas do sistema
curl http://localhost:3000/api/marketplace/orchestration/metrics

# 5. Ver dashboard NEXO Master
curl http://localhost:3000/api/marketplace/orchestration/metrics

# 6. Diagnóstico
curl http://localhost:3000/api/marketplace/diagnostics/analysis
```

---

## 🎯 Esperado no Final

Depois de executar TODA essa simulação:

✅ 1 análise aprovada
✅ 3 Phase 1 tasks criadas
✅ 3 Phase 1 tasks executadas
✅ Métricas mostram progresso
✅ Sistema pronto para Phase 2

**Total de tempo:** ~15-20 minutos (incluindo wait times)

---

**Status:** 🟢 Pronto para simular
**Última atualização:** 2026-02-24
