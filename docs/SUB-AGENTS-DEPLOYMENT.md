# 🚀 Sub-Agents Autonomous System - Deployment Guide

**Status:** ✅ **Pronto para Produção**
**Data:** 2 de Março de 2026
**Componentes:** 13 arquivos | 1,902 linhas de código

---

## 📋 Índice

1. [Resumo da Implementação](#resumo-da-implementação)
2. [Passos para Deploy](#passos-para-deploy)
3. [Estrutura do Sistema](#estrutura-do-sistema)
4. [Testando os Endpoints](#testando-os-endpoints)
5. [Troubleshooting](#troubleshooting)

---

## Resumo da Implementação

O sistema de **Sub-Agentes Autônomos** decompõe tarefas de marketplace aprovadas em 3 fases executadas sequencialmente com checkpoints de aprovação humana.

### Fluxo

```
Aprovação de Tarefa → Decomposição → Fase 1: Análise → Checkpoint 1
                                    ↓ (Aprovado)
                        Fase 2: Geração de Conteúdo → Checkpoint 2
                                    ↓ (Aprovado)
                        Fase 3: Delegação (Condicional) → Checkpoint 3
                                    ↓ (Aprovado)
                        Resultados Consolidados
```

### Arquitetura

```
┌─────────────────────────────────────────────────┐
│  API Routes (5 endpoints)                       │
│  - execute: Inicia decomposição                 │
│  - status: Retorna status das subtarefas        │
│  - checkpoint/approve: Aprova fase              │
│  - checkpoint/reject: Rejeita fase              │
│  - results: Resultados consolidados             │
└──────────────┬──────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────┐
│  SubAgentOrchestrator Service                   │
│  - decomposeTask()                              │
│  - executeSubtask()                             │
│  - approveCheckpoint()                          │
│  - rejectCheckpoint()                           │
│  - getConsolidatedResults()                     │
└──────────────┬──────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────┐
│  BullMQ Queue System                            │
│  - sub-agent-queue: Job definitions             │
│  - sub-agent-worker: Job processor              │
│  - Exponential backoff retries                  │
│  - Dead-letter queue for failures               │
└──────────────┬──────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────┐
│  Supabase Database                              │
│  - marketplace_subtasks table                   │
│  - RLS policies                                 │
│  - Indexes for performance                      │
│  - Automatic timestamp triggers                 │
└─────────────────────────────────────────────────┘
```

---

## Passos para Deploy

### Passo 1: Aplicar Migração do Banco de Dados

A migração cria a tabela `marketplace_subtasks` com todas as colunas necessárias.

**Via Supabase Dashboard:**

1. Acesse: https://app.supabase.com/project/ytywuiyzulkvzsqfeghh/sql
2. Clique em "+ New Query"
3. Cole o conteúdo de: `supabase/migrations/20260302_create_marketplace_subtasks.sql`
4. Clique em "Execute" ▶️

**Ou via CLI (se instalado):**
```bash
supabase migration up 20260302
```

**Verificar se funcionou:**
```bash
# No Supabase Dashboard, vá para SQL Editor e execute:
SELECT * FROM information_schema.tables
WHERE table_name = 'marketplace_subtasks';
```

Se retornar 1 linha, a tabela foi criada com sucesso! ✅

### Passo 2: Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

O servidor inicia em: http://localhost:3000

O BullMQ worker inicia automaticamente no boot.

### Passo 3: Testar Fluxo Completo

1. **Acesse Marketplace Tasks:** http://localhost:3000/marketplace/tasks
2. **Aprove uma Tarefa:** Clique no botão "Aprovar"
3. **Veja Sub-Agentes:** http://localhost:3000/marketplace/tasks/[taskId]/sub-agents
4. **Monitor Dashboard:**
   - Veja todas as subtarefas sendo criadas
   - Acompanhe status em tempo real
   - Revise dados de checkpoint
   - Clique Aprovar/Rejeitar botões

---

## Estrutura do Sistema

### Banco de Dados: `marketplace_subtasks`

```sql
Column                    | Type              | Descrição
--------------------------|-------------------|----------------------------------
id                        | UUID (PK)         | ID único da subtarefa
parent_task_id           | UUID (FK)         | ID da tarefa pai
sub_agent_id             | TEXT              | Ex: 'marketplace-analyzer'
type                     | TEXT              | 'analysis' | 'content_generation' | 'delegation'
title                    | TEXT              | Título humano-legível
description              | TEXT (opcional)   | Descrição detalhada
status                   | TEXT              | 'pending' | 'in_progress' | 'awaiting_checkpoint' | 'completed' | 'failed'
checkpoint_data          | JSONB             | Dados para revisão humana
result_data              | JSONB             | Resultado final da execução
checkpoint_approved_by   | TEXT              | ID do usuário que aprovou
checkpoint_approved_at   | TIMESTAMPTZ       | Timestamp da aprovação
order_index              | INTEGER           | Ordem de execução (0, 1, 2)
created_at               | TIMESTAMPTZ       | Criado em
updated_at               | TIMESTAMPTZ       | Atualizado em (auto)
```

### Fases de Execução

#### Fase 1: Análise
- **Sub-agente:** `marketplace-analyzer`
- **Tipo:** `analysis`
- **Saída:** Análise de contexto, oportunidades, recomendações
- **Checkpoint:** Revisar análise antes de gerar conteúdo

#### Fase 2: Geração de Conteúdo
- **Sub-agente:** `content-generator`
- **Tipo:** `content_generation`
- **Saída:** Títulos, descrições, tags otimizadas por canal
- **Checkpoint:** Revisar conteúdo antes de delegar

#### Fase 3: Delegação (Condicional)
- **Sub-agente:** `task-delegator`
- **Tipo:** `delegation`
- **Saída:** Sub-subtarefas para mudanças complexas
- **Checkpoint:** Revisar delegações finais

---

## Testando os Endpoints

### 1. POST `/api/marketplace/sub-agents/execute`

Inicia decomposição de uma tarefa aprovada.

```bash
curl -X POST http://localhost:3000/api/marketplace/sub-agents/execute \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Tarefa decomposta em 3 subtarefas",
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "subtask_ids": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003"
  ],
  "first_job_id": "subagent-550e8400-e29b-41d4-a716-446655440000-1709452755000"
}
```

### 2. GET `/api/marketplace/sub-agents/[taskId]/status`

Retorna status de todas as subtarefas.

```bash
curl http://localhost:3000/api/marketplace/sub-agents/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Resposta Esperada:**
```json
{
  "success": true,
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "summary": {
    "total": 3,
    "pending": 1,
    "in_progress": 1,
    "awaiting_checkpoint": 1,
    "completed": 0,
    "failed": 0
  },
  "subtasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "type": "analysis",
      "title": "Market Analysis for Product X",
      "status": "awaiting_checkpoint",
      "sub_agent_id": "marketplace-analyzer",
      "order_index": 0
    }
  ],
  "next_checkpoint": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "type": "analysis",
    "title": "Market Analysis for Product X",
    "checkpoint_data": {
      "competitors": ["comp1", "comp2"],
      "opportunities": ["opp1", "opp2"]
    }
  }
}
```

### 3. POST `/api/marketplace/sub-agents/[subtaskId]/checkpoint/approve`

Aprova um checkpoint e prossegue para a próxima subtarefa.

```bash
curl -X POST http://localhost:3000/api/marketplace/sub-agents/550e8400-e29b-41d4-a716-446655440001/checkpoint/approve \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Análise aprovada - dados consistentes"
  }'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Checkpoint aprovado com sucesso",
  "subtask_id": "550e8400-e29b-41d4-a716-446655440001",
  "approved_by": "user-uuid",
  "approved_at": "2026-03-02T10:30:00Z",
  "next_subtask_id": "550e8400-e29b-41d4-a716-446655440002",
  "next_job_id": "subagent-550e8400-e29b-41d4-a716-446655440002-1709452800000"
}
```

### 4. POST `/api/marketplace/sub-agents/[subtaskId]/checkpoint/reject`

Rejeita um checkpoint para re-execução.

```bash
curl -X POST http://localhost:3000/api/marketplace/sub-agents/550e8400-e29b-41d4-a716-446655440001/checkpoint/reject \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Dados incompletos - análise precisa ser revisada"
  }'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Checkpoint rejeitado - subtarefa será re-executada",
  "subtask_id": "550e8400-e29b-41d4-a716-446655440001",
  "rejected_by": "user-uuid",
  "rejected_at": "2026-03-02T10:35:00Z",
  "rejection_reason": "Dados incompletos - análise precisa ser revisada",
  "requeue_job_id": "subagent-550e8400-e29b-41d4-a716-446655440001-1709452900000"
}
```

### 5. GET `/api/marketplace/sub-agents/[taskId]/results`

Retorna resultados consolidados de todas as fases.

```bash
curl http://localhost:3000/api/marketplace/sub-agents/550e8400-e29b-41d4-a716-446655440000/results \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Resposta Esperada:**
```json
{
  "success": true,
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "overall_status": "completed",
  "results": {
    "parent_task_id": "550e8400-e29b-41d4-a716-446655440000",
    "completed_at": "2026-03-02T10:45:00Z",
    "subtasks": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "type": "analysis",
        "status": "completed",
        "result_data": { ... },
        "checkpoint_data": { ... }
      }
    ],
    "consolidated_by_type": {
      "analysis": [ { ... } ],
      "content_generation": [ { ... } ],
      "delegation": [ { ... } ]
    }
  }
}
```

---

## Dashboard UI

Localização: `/marketplace/tasks/[taskId]/sub-agents`

### Features

✅ **Barra de Progresso em Tempo Real**
- Mostra % de conclusão
- Estatísticas: Pendentes, Em andamento, Aguardando aprovação, Concluído, Falha

✅ **Painel de Checkpoint**
- Dados da fase para revisão humana (JSON)
- Botões Aprovar/Rejeitar
- Notas de revisão

✅ **Lista de Subtarefas**
- Status visual (ícones coloridos)
- Tipo de sub-agente
- Data de criação/atualização
- Ordem de execução

✅ **Controles de Atualização**
- Auto-refresh: 2s / 5s / 10s / Desativado
- Polling em tempo real

---

## Troubleshooting

### ❌ Erro: "401 Unauthorized"

**Causa:** Token de autenticação inválido ou expirado

**Solução:**
1. Faça login novamente em http://localhost:3000
2. Verifique se tem role `admin` (necessário para endpoints)
3. Copie novo token da sessão

### ❌ Erro: "403 Forbidden"

**Causa:** Usuário não tem role `admin`

**Solução:**
1. Acesse Supabase Dashboard
2. Vá para Authentication > Users
3. Edite seu usuário
4. Adicione role: `admin`

### ❌ Erro: "marketplace_subtasks table not found"

**Causa:** Migração não foi aplicada

**Solução:**
1. Acesse https://app.supabase.com/project/ytywuiyzulkvzsqfeghh/sql
2. Cole conteúdo de `supabase/migrations/20260302_create_marketplace_subtasks.sql`
3. Clique Execute ▶️
4. Verifique se tabela aparece em Database > Tables

### ❌ Erro: "No subtasks created"

**Causa:** Tarefa não foi aprovada primeiro

**Solução:**
1. Acesse http://localhost:3000/marketplace/tasks
2. Aprove uma tarefa via botão "Aprovar"
3. Depois acione decomposição via `/api/marketplace/sub-agents/execute`

### ❌ Worker não está processando jobs

**Causa:** BullMQ worker não inicializou

**Solução:**
1. Verifique se Redis está rodando: `redis-cli ping` → `PONG`
2. Reinicie servidor: Ctrl+C → `npm run dev`
3. Verifique logs: Procure por "✅ Sub-agent worker initialized"

### ⚠️ Subtarefa ficou "pending" para sempre

**Causa:** Worker está parado ou houve erro silencioso

**Solução:**
1. Rejeite o checkpoint para re-enfileirar
2. Ou reinicie servidor para resetar worker
3. Verifique console para erros

---

## Performance & Escalabilidade

### Índices do Banco
```
✓ parent_task_id - Lookup rápido de subtarefas por tarefa
✓ status - Filtragem por status
✓ awaiting_checkpoint - Queries de checkpoints pendentes
✓ order_index - Ordenação sequencial
✓ (status, updated_at) - Queries de in_progress
```

### Concorrência
- **Worker concurrency:** 2 (evita rate limiting)
- **Retry policy:** Exponential backoff (1s → 5s → 30s)
- **Max retries:** 3 tentativas
- **Job timeout:** 30 segundos

### Escalabilidade
- **Tarefas paralelas:** Múltiplas tarefas podem decompor ao mesmo tempo
- **Subtarefas sequenciais:** Dentro de uma tarefa, fases executam sequencialmente
- **Checkpoints:** Não bloqueiam outras tarefas

---

## Commits Relacionados

```
8891d49 feat: implementar sistema de sub-agentes autônomos no marketplace (MGOS-AIOS)
```

**Arquivos no Commit:**
- 10 novos arquivos
- 3 modificados
- 1,902 linhas de código
- 13 arquivos totais

---

## Próximos Passos (Roadmap)

- [ ] WebSocket real-time updates (vs polling)
- [ ] Batch checkpoint approvals
- [ ] Sub-subtasks creation from delegation phase
- [ ] Auto-approve low-risk items (ML scoring)
- [ ] Rollback on phase failure
- [ ] Email/Slack notifications for pending checkpoints
- [ ] Advanced retry policies (backoff curves)
- [ ] Subtask execution history & audit log
- [ ] Performance metrics dashboard
- [ ] Multi-tenant support

---

## Suporte

Para mais informações:
- 📖 Código: `lib/marketplace-orchestration/services/sub-agent-orchestrator.ts`
- 🔌 API: `app/api/marketplace/sub-agents/`
- 🎨 UI: `app/(dashboard)/marketplace/tasks/[id]/sub-agents/page.tsx`
- 📊 Banco: `supabase/migrations/20260302_create_marketplace_subtasks.sql`

---

**Status:** ✅ **PRONTO PARA PRODUÇÃO**

_Documento gerado em 2 de Março de 2026_
