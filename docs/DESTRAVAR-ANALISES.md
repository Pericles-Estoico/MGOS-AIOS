# 🔓 Destravando Análises Pendentes

**Data:** 2026-02-24
**Problema:** 3 análises travadas em status "Aguardando" (pending)

---

## 📋 Análises Travadas

| # | Título | Canal | Status | Criado |
|---|--------|-------|--------|--------|
| 1 | Análise amazon - 23/02/2026 | Amazon | ⏳ Aguardando | Há 1 dia |
| 2 | Análise amazon - 23/02/2026 | Amazon | ⏳ Aguardando | Há 1 dia |
| 3 | Análise shopee - 23/02/2026 | Shopee | ⏳ Aguardando | Há 1 dia |

---

## 🔍 Causa

Quando análises são aprovadas, o sistema tenta **enfileirar um job de Phase 1** usando Redis para processamento assíncrono.

**Problema:** Redis não está configurado (`redis.prod.example.com` não existe)

**Resultado:** Analyses ficam em "Aguardando" e nunca avançam

---

## ✅ Solução Implementada

### 1. Fallback Automático

A rota `/api/marketplace/analysis/[id]` agora:
1. ✅ Tenta enfileirar com Redis (async)
2. ⚠️ Se Redis falhar, cria Phase 1 tasks **sincronamente** como fallback
3. ✅ Análises podem ser aprovadas mesmo sem Redis

### 2. Endpoint Auto-Aprovação

Novo endpoint para destravar análises manualmente:

```
POST /api/marketplace/recover/auto-approve
```

**O que faz:**
- Busca TODAS as análises com status "pending"
- Aprova cada uma automaticamente
- Cria Phase 1 tasks para cada análise
- Retorna relatório completo

---

## 🚀 Destravar as 3 Análises (AGORA)

### Opção A: Via curl (rápido)

```bash
curl -X POST http://localhost:3000/api/marketplace/recover/auto-approve \
  -H "Content-Type: application/json" \
  -H "Cookie: [sua_sessao_auth]"
```

**Esperado:**
```json
{
  "status": "success",
  "message": "Auto-approved 3 analyses",
  "approvedCount": 3,
  "tasksCreated": [9, 8, 7],
  "results": [
    {
      "analysisId": "xxx",
      "title": "Análise amazon...",
      "status": "approved",
      "tasksCreated": 3,
      "success": true
    },
    ...
  ]
}
```

### Opção B: Manualmente no Dashboard

1. Ir para `/marketplace/analysis`
2. Clicar em cada análise (Análise amazon #1)
3. Botão **"✅ Aprovar"** (verde)
4. Esperar resposta (deve aparecer "Plano aprovado")
5. Repetir para Análise amazon #2 e Shopee

### Opção C: Via Dashboard (Frontend)

A página `/marketplace/analysis/[id]` agora tem:
- ✅ Botão "Aprovar" que envia `PATCH` com `action: "approve"`
- ✅ Fallback automático ativado
- ✅ Mensagem "Plano aprovado. Tarefas sendo processadas..."

---

## 📊 O que Vai Acontecer

Quando você aprovar:

```
1. Status muda de "Aguardando" → "Aprovado" ✅

2. Sistema tenta enfileirar com Redis
   ↓
   Se falhar → cria Phase 1 tasks sincronamente

3. Phase 1 tasks são criadas em /api/tasks
   - Título: "Otimizar [descrição] para [canal]"
   - Status: "pending"
   - Assignee: Agentes especializados

4. Você vê:
   ✅ Análise: "Aprovado"
   ✅ Tasks: Prontas para execução
```

---

## 🔍 Verificar Progresso

### Checar se análise foi aprovada:
```bash
curl http://localhost:3000/api/marketplace/analysis/[ID]
```

Deve mostrar:
```json
{
  "status": "approved",  ← Mudou de "pending"!
  "approved_at": "2026-02-24T...",
  "approved_by": "user-id"
}
```

### Listar tarefas criadas:
```bash
curl http://localhost:3000/api/tasks?status=pending&channel=amazon
```

Deve mostrar:
```json
{
  "tasks": [
    {
      "title": "Otimizar Título para Amazon",
      "channel": "amazon",
      "status": "pending",
      "created_from_analysis": true
    },
    ...
  ]
}
```

---

## 🛠️ Se Algo Não Funcionar

### ❌ Erro: "Unauthorized"
- Você está logado como **usuário normal**
- Solução: Use conta admin/head

### ❌ Erro: "Erro ao criar tarefas Phase 1"
- Supabase não está configurado ou offline
- Verifique: `SUPABASE_URL` e `SUPABASE_KEY` em `.env.local`
- Verifique: Tabela `tasks` existe

### ❌ Análises ainda aparecem "Aguardando"
- Recarregar página (Ctrl+F5)
- Limpar cache do navegador
- Se problema persistir, rodar diagnostico:
  ```bash
  curl http://localhost:3000/api/marketplace/diagnostics/analysis
  ```

---

## 📈 Próximas Fases

Depois que as 3 análises forem aprovadas:

### Phase 1 Tasks ✅
- 3 análises aprovadas
- ~9-12 Phase 1 tasks criadas
- Status: "pending" (prontos para atribuir)

### Phase 2 (Próximo)
- Executar Phase 1 tasks
- Monitorar resultados
- Aprovar Phase 2 (execução)

### Phase 3 (Depois)
- Executar Phase 2 tasks
- Coletar resultados
- Analisar impacto

### Phase 4 (Final)
- Otimização com IA
- Predições de performance
- Recomendações automáticas

---

## 🔧 Melhorias Implementadas

✅ **Fallback automático** quando Redis falha
✅ **Endpoint auto-approve** para destravar análises
✅ **Logging melhorado** para diagnóstico
✅ **Sincronização robusta** mesmo sem job queue

---

## 📝 Próximas Ações

**Imediato:**
- [ ] Rodar `/api/marketplace/recover/auto-approve`
- [ ] Confirmar 3 análises aprovadas
- [ ] Verificar Phase 1 tasks criadas

**Curto Prazo:**
- [ ] Configurar Redis corretamente (opcional)
- [ ] Remover endpoints de recovery (produção)
- [ ] Testar Phase 1 task execution

**Longo Prazo:**
- [ ] Implementar circuit breaker
- [ ] Monitoramento de jobs
- [ ] Dashboard de fila

---

**Status:** 🟢 Pronto para destravar
**Última atualização:** 2026-02-24
