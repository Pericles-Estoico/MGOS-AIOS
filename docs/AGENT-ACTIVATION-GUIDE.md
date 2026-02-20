# 🤖 Agent Activation Guide — Marketplace Master

**Data:** Fevereiro 20, 2026
**Status:** ✅ Pronto para Ativação
**Version:** 1.0.0

---

## 📋 Visão Geral

Este guia cobre a ativação autônoma dos 7 agentes marketplace:

1. **@marketplace-master (Nexo)** — Orquestrador Master
2. **@marketplace-amazon** — Títulos GEO, A+ Content, Anúncios
3. **@marketplace-shopee** — Flash Sales, Vídeos, Visibilidade
4. **@marketplace-mercadolivre** — Descrições Geo, Anúncios
5. **@marketplace-shein** — Otimização de Tendências
6. **@marketplace-tiktokshop** — Comércio ao Vivo, Criadores
7. **@marketplace-kaway** — Posicionamento Premium, Ofertas

---

## 🎯 Modos de Operação

### 1. Manual Mode (Default)

```
Admin/Head → Dashboard → Cria tarefa manualmente
                     ↓
              Seleciona agente
                     ↓
        Tarefa fica em "pending"
                     ↓
        Admin aprova no dashboard
                     ↓
            Agente executa
```

**Quando usar:** Controle fino, aprovação humana necessária

### 2. Autonomous Mode (Recomendado)

```
Agente → API POST /api/orchestration/tasks
              ↓
    Tarefa criada "awaiting_approval"
              ↓
    Sistema valida (automático)
              ↓
  Tarefa movida para "approved"
              ↓
       Agente executa
```

**Quando usar:** Escalabilidade, processamento de volume alto

### 3. Scheduled Mode (Beta)

```
Cron Job (diário) → Busca tarefas pendentes
                 ↓
          Aprova em lote
                 ↓
       Agentes executam
```

**Quando usar:** Processamento batch, operações noturnas

---

## 🚀 Ativação Autônoma

### Step 1: Configurar Agent Tokens

Cada agente precisa de um token único para autenticação:

```bash
# .env.production
MARKETPLACE_AMAZON_TOKEN=amazon_token_$(openssl rand -hex 16)
MARKETPLACE_SHOPEE_TOKEN=shopee_token_$(openssl rand -hex 16)
MARKETPLACE_MERCADOLIVRE_TOKEN=mercadolivre_token_$(openssl rand -hex 16)
MARKETPLACE_SHEIN_TOKEN=shein_token_$(openssl rand -hex 16)
MARKETPLACE_TIKTOKSHOP_TOKEN=tiktokshop_token_$(openssl rand -hex 16)
MARKETPLACE_KAWAY_TOKEN=kaway_token_$(openssl rand -hex 16)

# Gerar tokens
for agent in amazon shopee mercadolivre shein tiktokshop kaway; do
  TOKEN=$(openssl rand -hex 32)
  echo "MARKETPLACE_${agent^^}_TOKEN=$TOKEN"
done
```

### Step 2: Registrar Agents no Sistema

```typescript
// lib/agent-registry.ts
export const AGENT_REGISTRY = {
  'marketplace-amazon': {
    id: 'marketplace-amazon',
    name: 'Amazon Agent',
    token: process.env.MARKETPLACE_AMAZON_TOKEN,
    scopes: ['create:tasks', 'read:own-tasks'],
    rateLimit: { requests: 100, windowMs: 3600000 }, // 100 req/hour
    autoApproveCategories: ['optimization', 'analysis'],
    requireApprovalCategories: ['scaling'],
  },
  'marketplace-shopee': {
    id: 'marketplace-shopee',
    name: 'Shopee Agent',
    token: process.env.MARKETPLACE_SHOPEE_TOKEN,
    scopes: ['create:tasks', 'read:own-tasks'],
    rateLimit: { requests: 100, windowMs: 3600000 },
    autoApproveCategories: ['best-practice'],
    requireApprovalCategories: ['scaling', 'optimization'],
  },
  'marketplace-mercadolivre': {
    id: 'marketplace-mercadolivre',
    name: 'MercadoLivre Agent',
    token: process.env.MARKETPLACE_MERCADOLIVRE_TOKEN,
    scopes: ['create:tasks', 'read:own-tasks'],
    rateLimit: { requests: 100, windowMs: 3600000 },
    autoApproveCategories: ['analysis'],
    requireApprovalCategories: ['optimization', 'scaling'],
  },
  'marketplace-shein': {
    id: 'marketplace-shein',
    name: 'SHEIN Agent',
    token: process.env.MARKETPLACE_SHEIN_TOKEN,
    scopes: ['create:tasks', 'read:own-tasks'],
    rateLimit: { requests: 80, windowMs: 3600000 },
    autoApproveCategories: ['best-practice'],
    requireApprovalCategories: ['optimization', 'scaling'],
  },
  'marketplace-tiktokshop': {
    id: 'marketplace-tiktokshop',
    name: 'TikTok Shop Agent',
    token: process.env.MARKETPLACE_TIKTOKSHOP_TOKEN,
    scopes: ['create:tasks', 'read:own-tasks'],
    rateLimit: { requests: 80, windowMs: 3600000 },
    autoApproveCategories: ['best-practice'],
    requireApprovalCategories: ['scaling'],
  },
  'marketplace-kaway': {
    id: 'marketplace-kaway',
    name: 'Kaway Agent',
    token: process.env.MARKETPLACE_KAWAY_TOKEN,
    scopes: ['create:tasks', 'read:own-tasks'],
    rateLimit: { requests: 80, windowMs: 3600000 },
    autoApproveCategories: ['optimization'],
    requireApprovalCategories: ['scaling'],
  },
};
```

### Step 3: Atualizar API para Modo Autônomo

```typescript
// app/api/orchestration/tasks/route.ts
import { AGENT_REGISTRY } from '@/lib/agent-registry';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  // Validar token
  const agent = Object.values(AGENT_REGISTRY).find(a => a.token === token);
  if (!agent) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();

  // Criar tarefa
  const taskData = {
    id: crypto.randomUUID(),
    marketplace: body.marketplace,
    title: body.title,
    description: body.description,
    category: body.category,
    priority: body.priority,
    estimated_hours: body.estimatedHours,
    created_by: agent.id,
    status: 'pending',
    created_at: new Date(),
  };

  // Salvar no Supabase
  const { data: task, error } = await supabase
    .from('marketplace_tasks')
    .insert([taskData])
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Autonomous Mode: Auto-approve se permitido
  if (isAutoApproveAllowed(agent, body.category)) {
    await supabase
      .from('marketplace_tasks')
      .update({
        status: 'approved',
        approved_at: new Date(),
        approved_by: 'autonomous-system',
      })
      .eq('id', task.id);

    // Log auditoria
    await logAudit('approve', task.id, 'autonomous-system', {
      reason: 'Auto-approved based on agent configuration',
    });
  }

  return Response.json(task, { status: 201 });
}

function isAutoApproveAllowed(agent: Agent, category: string): boolean {
  return agent.autoApproveCategories?.includes(category) ?? false;
}
```

### Step 4: Configurar Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function checkAgentRateLimit(
  agentId: string,
  limits: { requests: number; windowMs: number }
) {
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limits.requests, `${limits.windowMs}ms`),
  });

  const { success } = await ratelimit.limit(agentId);
  return success;
}
```

### Step 5: Monitoramento de Agentes

```typescript
// app/api/orchestration/agents/status/route.ts
export async function GET() {
  const agents = Object.values(AGENT_REGISTRY);

  const status = await Promise.all(
    agents.map(async (agent) => {
      const { count: tasksCreated } = await supabase
        .from('marketplace_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', agent.id);

      const { count: tasksApproved } = await supabase
        .from('marketplace_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', agent.id)
        .eq('status', 'approved');

      const { count: tasksCompleted } = await supabase
        .from('marketplace_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', agent.id)
        .eq('status', 'completed');

      return {
        id: agent.id,
        name: agent.name,
        status: 'online',
        stats: {
          tasksCreated,
          tasksApproved,
          tasksCompleted,
          completionRate: tasksCreated > 0
            ? Math.round((tasksCompleted / tasksCreated) * 100)
            : 0,
        },
        timestamp: new Date(),
      };
    })
  );

  return Response.json({ agents: status });
}
```

---

## 🔄 Fluxo de Ativação Passo a Passo

### 1. Deploy Initial

```bash
# Deploy com environment variables
./scripts/deploy-marketplace.sh production

# Verificar agents status
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://marketplace.aios.local/api/orchestration/agents/status
```

### 2. Teste Manual (Agent Amazon)

```bash
# Criar tarefa test
curl -X POST \
  -H "Authorization: Bearer $MARKETPLACE_AMAZON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "marketplace": "amazon",
    "title": "[TEST] Agent Activation Test",
    "category": "optimization",
    "priority": "high",
    "estimatedHours": 2
  }' \
  https://marketplace.aios.local/api/orchestration/tasks

# Response esperado:
# {
#   "id": "uuid",
#   "status": "approved",  // Auto-approved!
#   "created_at": "2026-02-20T17:00:00Z"
# }
```

### 3. Monitorar Todos Agentes

```bash
# Dashboard → /marketplace
# Visualizar status em tempo real

# ou via API
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://marketplace.aios.local/api/orchestration/agents/status | jq
```

### 4. Ativar Processamento Batch

```typescript
// scripts/process-pending-tasks.ts
import { AGENT_REGISTRY } from '@/lib/agent-registry';

async function processPendingTasks() {
  console.log('🤖 Processing pending tasks...');

  // Buscar tarefas pending
  const { data: pendingTasks } = await supabase
    .from('marketplace_tasks')
    .select('*')
    .eq('status', 'pending')
    .limit(50);

  // Aprovar tarefas elegíveis
  for (const task of pendingTasks) {
    const agent = Object.values(AGENT_REGISTRY)
      .find(a => a.id === task.created_by);

    if (!agent) continue;

    if (agent.autoApproveCategories?.includes(task.category)) {
      await supabase
        .from('marketplace_tasks')
        .update({ status: 'approved', approved_at: new Date() })
        .eq('id', task.id);

      console.log(`✅ Approved: ${task.title}`);
    }
  }

  console.log('✅ Batch processing complete');
}

processPendingTasks().catch(console.error);
```

---

## 📊 Agent Performance Metrics

### Dashboard Metrics

```typescript
// Visualizar em /marketplace/agents

interface AgentMetrics {
  taskCreationRate: number;      // tasks/hour
  approvalRate: number;          // approved/created %
  completionRate: number;        // completed/approved %
  avgCompletionTime: number;     // hours
  qualityScore: number;          // 0-100
  lastActivityAt: Date;
}
```

### Health Checks

```bash
# Verificar saúde de cada agente
npm run agent:health-check

# Output:
# ✅ marketplace-amazon: Online (45 tasks, 92% completion)
# ✅ marketplace-shopee: Online (32 tasks, 88% completion)
# ✅ marketplace-mercadolivre: Online (28 tasks, 85% completion)
# ⚠️  marketplace-shein: Warning (0 tasks, no activity 24h)
# ✅ marketplace-tiktokshop: Online (18 tasks, 94% completion)
# ✅ marketplace-kaway: Online (15 tasks, 90% completion)
```

---

## ⚙️ Configuração por Agente

### Amazon

```yaml
agent: marketplace-amazon
name: Amazon Agent
mode: Autonomous
autoApprove:
  - optimization
  - analysis
requireApproval:
  - scaling
rateLimit: 100 requests/hour
priority: high
```

### Shopee

```yaml
agent: marketplace-shopee
name: Shopee Agent
mode: Autonomous
autoApprove:
  - best-practice
requireApproval:
  - scaling
  - optimization
rateLimit: 100 requests/hour
priority: high
```

### MercadoLivre

```yaml
agent: marketplace-mercadolivre
name: MercadoLivre Agent
mode: Autonomous
autoApprove:
  - analysis
requireApproval:
  - optimization
  - scaling
rateLimit: 100 requests/hour
priority: medium
```

### SHEIN

```yaml
agent: marketplace-shein
name: SHEIN Agent
mode: Autonomous
autoApprove:
  - best-practice
requireApproval:
  - optimization
  - scaling
rateLimit: 80 requests/hour
priority: medium
```

### TikTok Shop

```yaml
agent: marketplace-tiktokshop
name: TikTok Shop Agent
mode: Autonomous
autoApprove:
  - best-practice
requireApproval:
  - scaling
rateLimit: 80 requests/hour
priority: medium
```

### Kaway

```yaml
agent: marketplace-kaway
name: Kaway Agent
mode: Autonomous
autoApprove:
  - optimization
requireApproval:
  - scaling
rateLimit: 80 requests/hour
priority: low
```

---

## 🛑 Desativação & Fallback

### Emergency Shutdown

```bash
# Desativar todos agentes
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://marketplace.aios.local/api/orchestration/agents/shutdown

# Fallback para modo manual
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://marketplace.aios.local/api/orchestration/mode/manual
```

### Rate Limit Exceeded

```
Agent excede rate limit → Task enqueued → Retentativa após 1h
```

---

## 📞 Troubleshooting

### Agent Token Invalid

```bash
# Regenerate token
MARKETPLACE_AMAZON_TOKEN=$(openssl rand -hex 32)

# Restart agent
docker restart marketplace-amazon
```

### Agent Not Creating Tasks

```bash
# Check logs
docker logs marketplace-amazon

# Verify token
echo $MARKETPLACE_AMAZON_TOKEN

# Test connection
curl -X POST \
  -H "Authorization: Bearer $MARKETPLACE_AMAZON_TOKEN" \
  https://marketplace.aios.local/api/orchestration/tasks
```

### High Latency

```bash
# Check rate limits
curl https://marketplace.aios.local/api/orchestration/agents/status | jq '.[] | select(.rateLimit)'

# Increase limits if needed
# Update AGENT_REGISTRY.{agent}.rateLimit
```

---

## ✅ Activation Checklist

- [ ] Agent tokens gerados e configurados em `.env`
- [ ] Agent Registry atualizado com tokens
- [ ] API endpoint validado para autonomous mode
- [ ] Rate limiting ativo
- [ ] Cada agente testado com tarefa manual
- [ ] Auto-approval configurado por categoria
- [ ] Monitoramento dashboard funcionando
- [ ] Health check script rodando
- [ ] Logs de auditoria registrando
- [ ] Alerts configurados para agent failures
- [ ] Documentation atualizada
- [ ] Team notificado

---

**Status:** ✅ Pronto para Ativação Autônoma
**Última Atualização:** Fevereiro 20, 2026
**Versão:** 1.0.0
