# 🧪 Queue System Testing & Recovery Scripts

Scripts para testar e recuperar o sistema de fila de análises de marketplace.

## 📋 Requisitos

- `bash`
- `curl`
- `jq` (para parsing JSON)

## 🚀 Quick Start

### 1. Test Queue System (antes de recovery)

```bash
bash scripts/test-queue-recovery.sh prod
```

Verifica:
- ✅ Conectividade com a app
- ✅ API respondendo
- ✅ Recovery endpoint disponível
- ✅ Banco de dados conectado

**Saída esperada:**
```
✅ All tests passed!

Next steps to recover marketplace analyses:
  1. Make sure you're logged in as admin
  2. Run: curl -X POST https://www.sellerops.com.br/api/admin/marketplace/recovery ...
```

### 2. Listar Análises Travadas

```bash
bash scripts/recover-analyses.sh list
```

Retorna:
```json
{
  "status": "success",
  "message": "Found 24 stuck analyses",
  "stuckCount": 24,
  "ageHours": 24,
  "analyses": [...]
}
```

### 3. Reprocessar TODAS as Análises Travadas

```bash
bash scripts/recover-analyses.sh reprocess-all
```

Pede confirmação e então:
- Enfileira todos os análises travados
- Cria Phase 1 tasks automaticamente
- Leva 15-30 minutos

### 4. Reprocessar Análises Específicas

```bash
bash scripts/recover-analyses.sh reprocess plan-id-1 plan-id-2 plan-id-3
```

## 🌍 Ambientes

### Produção (Vercel)
```bash
bash scripts/test-queue-recovery.sh prod
ENVIRONMENT=prod bash scripts/recover-analyses.sh list
```

### Staging
```bash
bash scripts/test-queue-recovery.sh staging
ENVIRONMENT=staging bash scripts/recover-analyses.sh list
```

### Desenvolvimento Local
```bash
bash scripts/test-queue-recovery.sh dev
ENVIRONMENT=dev bash scripts/recover-analyses.sh list
```

## 📊 Exemplo: Recuperação Completa

```bash
# 1. Verificar testes
bash scripts/test-queue-recovery.sh prod

# 2. Ver quantas análises estão travadas
bash scripts/recover-analyses.sh list

# 3. Iniciar recovery de todas
bash scripts/recover-analyses.sh reprocess-all

# 4. Monitorar progresso
# → Abra: https://vercel.com/dashboard
# → Procure por "🔄 Processing job" e "✅ Job completed"

# 5. Confirmar sucesso
bash scripts/recover-analyses.sh list
# Deve mostrar: "stuckCount": 0
```

## 🔍 O Que Cada Script Faz

### `test-queue-recovery.sh`

**Testa a saúde do sistema:**

1. **Basic Connectivity** - Verifica se a app está respondendo
2. **API Health Check** - Testa endpoint básico `/api/tasks`
3. **List Stuck Analyses** - Testa endpoint de recovery
4. **Marketplace Analysis** - Verifica módulo de análises
5. **Database Connectivity** - Testa conexão com banco

**Status codes esperados:**
- ✅ 2xx/3xx = Sucesso
- ❌ 4xx/5xx = Falha

### `recover-analyses.sh`

**Gerencia recuperação de análises:**

```
Actions:
  list              → Lista análises travadas
  reprocess-all     → Reprocessa TODAS (com confirmação)
  reprocess <ids>   → Reprocessa específicas
```

## 🐛 Troubleshooting

### HTTP 405 no Recovery Endpoint

**Problema:** `POST /api/admin/marketplace/recovery` retorna 405

**Causas possíveis:**
1. Vercel build ainda em andamento
2. Novo código não foi deployado
3. Arquivo de rota foi deletado

**Solução:**
```bash
# Aguardar ~5-10 minutos para Vercel terminar o build
# Verificar: https://vercel.com/dashboard → Deployments → Logs

# Ou, se for dev local:
npm run build
npm run start
```

### Timeout na Requisição

**Problema:** Script fica pendurado ou timeout

**Solução:**
- Aumentar timeout em prod (já está em 15s)
- Verificar conectividade de rede
- Verificar Vercel status: https://vercel-status.com

### Authentication Error (401/403)

**Problema:** `Unauthorized` ou `Forbidden`

**Causas:**
1. User não está autenticado
2. User não é admin
3. Session expirou

**Solução:**
```bash
# Recovery endpoint requer autenticação de admin
# Login primeiro:
curl -X POST https://www.sellerops.com.br/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com", "password":"senha"}'

# Após login, cookies serão salvos e próximas requisições funcionarão
```

## 📈 Monitorar Progresso

### Via Vercel Dashboard

1. Abra: https://vercel.com/dashboard
2. Clique em **MGOS-AIOS**
3. Vá para **Deployments** → latest → **Logs**
4. Procure por:
   ```
   🔄 Processing job xxx...
   ✅ Job completed: 5 tasks created
   ```

### Via Logs em Tempo Real

Se for dev local:
```bash
npm run dev
# Procure no console:
# ✅ Queue system initialized on server
# 🔄 Processing job ...
# ✅ Job completed: ...
```

### Verificar Banco de Dados

```sql
-- Listar análises que já têm Phase 1 tasks criadas
SELECT id, status, phase1_tasks_created, created_at
FROM marketplace_plans
WHERE status = 'approved'
ORDER BY created_at DESC
LIMIT 10;

-- Contar quantas ainda estão travadas
SELECT COUNT(*) as stuck_count
FROM marketplace_plans
WHERE status = 'approved'
AND phase1_tasks_created = false;
```

## 🔄 Retry Logic

Ambos os scripts implementam retry automático:

- **test-queue-recovery.sh**: Sem retry (testes rápidos)
- **recover-analyses.sh**: Até 3 tentativas, 5s de espera entre elas

Para aumentar tentativas:

```bash
# Editar scripts/recover-analyses.sh
MAX_RETRIES=5  # aumentar de 3 para 5
RETRY_DELAY=10 # aumentar de 5s para 10s
```

## 📝 Exemplos Avançados

### Recovery com logging

```bash
bash scripts/recover-analyses.sh reprocess-all > recovery.log 2>&1
tail -f recovery.log
```

### Reprocessar análises de um cliente específico

```bash
# 1. Encontrar plan IDs
bash scripts/recover-analyses.sh list | grep -i "customer-name"

# 2. Reprocessar específicas
bash scripts/recover-analyses.sh reprocess plan-123 plan-124 plan-125
```

### Verificar status em loop

```bash
while true; do
  echo "Checking at $(date)"
  bash scripts/recover-analyses.sh list | jq '.stuckCount'
  echo "---"
  sleep 60  # Verificar a cada minuto
done
```

## 🔒 Segurança

- Scripts usam credenciais via session cookies (NextAuth)
- Recovery endpoint é admin-only
- Sem credenciais hardcoded em scripts
- URLs são HTTPS em produção

## 📚 Referências

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Vercel Deployment](https://vercel.com/docs)

## 🆘 Suporte

Se scripts não funcionarem:

1. Verifique `bash` version: `bash --version` (precisa 4.0+)
2. Verifique `jq` instalado: `which jq`
3. Verifique conectividade: `curl -I https://www.sellerops.com.br`
4. Verifique Vercel: https://vercel.com/dashboard

---

**Última atualização:** 2026-02-24
**Status:** Production Ready ✅
