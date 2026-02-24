# Marketplace Analysis System - Diagnostics & Troubleshooting

**Data:** 2026-02-24
**Status:** 🔍 Investigando "Análise não encontrada"

---

## 🔴 Problema Identificado

Usuário relata: **"Análise não encontrada e as análises retornam esta mensagem"**

### Síntomas

1. ✅ Link do Knowledge Base **existe** no código (marketplace/page.tsx, linha 615-623)
2. ✅ Rota `/marketplace/knowledge-base` compila corretamente
3. ✅ Rota `/api/marketplace/analysis` existe e funciona
4. ❌ Mas tabela `marketplace_plans` está vazia (nenhuma análise salva)
5. ❌ Quando tenta acessar análise: retorna erro 404 "Análise não encontrada"

---

## 🔍 Raiz do Problema

### Cadeia de Falha

```
User → Upload Arquivo
       ↓
POST /api/marketplace/analysis/upload
       ↓
runAnalysisPlanWithContext()
       ↓
callAgent() → OpenAI API
       ↓
❌ ERRO (OpenAI não configurado ou falha de conexão)
       ↓
❌ Análise NUNCA é salva em marketplace_plans
       ↓
❌ GET /marketplace/analysis retorna lista vazia
       ↓
❌ Usuário vê: "Nenhuma entrada no knowledge base ainda"
```

### Possíveis Causas

1. **OpenAI API não configurado**
   - Variável `OPENAI_API_KEY` não definida
   - Chave expirada ou inválida

2. **Erro de conexão com OpenAI**
   - Timeout na chamada
   - Rate limit atingido
   - Servidor OpenAI indisponível

3. **Erro ao chamar `callAgent()`**
   - Função não implementada corretamente
   - Erro de tipo/parsing na resposta

---

## ✅ Diagnóstico

### Endpoint 1: Verificar Estado do Banco

```bash
curl -s http://localhost:3000/api/marketplace/diagnostics/analysis | jq .
```

**Esperado se OK:**
```json
{
  "status": "success",
  "databaseConnected": true,
  "summary": {
    "totalAnalyses": 0,
    "pendingAnalyses": 0,
    "approvedAnalyses": 0
  },
  "recentAnalyses": []
}
```

**Se erro:**
```json
{
  "status": "error",
  "message": "Database connection failed",
  "databaseConnected": false
}
```

### Endpoint 2: Testar Criação Manual

```bash
curl -X POST http://localhost:3000/api/marketplace/test/create-analysis \
  -H "Content-Type: application/json"
```

**Esperado:**
```json
{
  "status": "success",
  "message": "Teste análise criada com sucesso",
  "analysis": {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "title": "Teste - Análise Manual...",
    "status": "pending"
  },
  "testEndpoint": "/api/marketplace/analysis/xxxxxxxx..."
}
```

Se isso funcionar: ✅ Banco está OK, problema está em `runAnalysisPlanWithContext()`

---

## 🛠️ Solução Passo a Passo

### Fase 1: Verificar Configuração

1. **Verificar .env.local**
   ```bash
   # Deve conter:
   OPENAI_API_KEY=sk-... (valid key)
   OPENAI_MODEL=gpt-4-turbo # ou modelo disponível
   ```

2. **Verificar Supabase**
   ```bash
   # Conectar ao database:
   psql "postgresql://postgres:password@db.supabase.co/postgres"

   # Listar tabelas:
   \dt marketplace_*
   ```

3. **Verificar Redis** (para queue jobs)
   ```bash
   # Se Redis não estiver configurado, usar fallback síncrono
   # Verificar em: app/lib/queue/phase1-queue.ts
   ```

### Fase 2: Criar Análise de Teste Manualmente

**Step 1:** Usar endpoint de teste
```bash
curl -X POST http://localhost:3000/api/marketplace/test/create-analysis
```

**Step 2:** Recuperar a análise criada
```bash
curl http://localhost:3000/api/marketplace/analysis/[ID-DA-ANALISE]
```

**Step 3:** Se funcionar, o banco está OK

### Fase 3: Debugar Upload Real

Ativar verbose logging em `app/lib/ai/agent-loop.ts`:

```typescript
// Linha ~750
const response = await callAgent({
  // ...
});
console.log('🎯 Agent Response:', {
  status: response.status,
  contentLength: response.content.length,
  firstChars: response.content.substring(0, 100),
});
```

Fazer upload e verificar logs:
```bash
tail -f server.log | grep "🎯 Agent"
```

### Fase 4: Corrigir OpenAI

Se OpenAI não está retornando dados:

**Opção A: Configurar OpenAI**
```bash
# .env.local
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4-turbo
```

**Opção B: Usar mock para teste (desenvolvimento)**
```typescript
// app/lib/ai/agent-loop.ts
if (process.env.NODE_ENV === 'development' && !process.env.OPENAI_API_KEY) {
  // Return mock analysis
  analysisResults[channel] = JSON.stringify({
    summary: 'Mock analysis for testing',
    opportunities: [...],
    phases: [...],
    metrics: [...]
  });
}
```

---

## 📋 Verificação Rápida

Executar em ordem:

```bash
# 1. Verificar banco
curl http://localhost:3000/api/marketplace/diagnostics/analysis

# 2. Criar análise de teste
curl -X POST http://localhost:3000/api/marketplace/test/create-analysis

# 3. Listar análises
curl http://localhost:3000/api/marketplace/analysis

# 4. Recuperar análise específica
curl http://localhost:3000/api/marketplace/analysis/[ID]
```

Se TODOS retornarem sucesso: ✅ Sistema funciona, problema está no upload real (OpenAI)

---

## 🚀 Próximas Ações

### Imediato (Esta Sessão)
1. [ ] Executar diagnóstico com endpoints acima
2. [ ] Confirmar se banco está funcionando
3. [ ] Determinar causa raiz (OpenAI vs outro problema)
4. [ ] Corrigir configuração ou mock

### Curto Prazo
1. [ ] Adicionar melhor logging em `callAgent()`
2. [ ] Implementar retry logic
3. [ ] Adicionar fallback para erros de OpenAI
4. [ ] Remover endpoints de teste depois

### Longo Prazo
1. [ ] Implementar circuit breaker para OpenAI
2. [ ] Adicionar suporte a multiple providers (Anthropic, etc)
3. [ ] Cache de análises geradas
4. [ ] Suporte a análise assíncrona com job queue

---

## 📝 Observações

### Knowledge Base Link

O link **existe e está correto**:
```typescript
// app/(dashboard)/marketplace/page.tsx, linha 615-623
<Link href="/marketplace/knowledge-base" ...>
  <Upload className="w-5 h-5 text-violet-500" />
  <p className="font-semibold">📚 Knowledge Base</p>
  <p className="text-sm">Ensine os agentes</p>
</Link>
```

Se não aparecer na UI:
- Limpar cache do navegador (Ctrl+Shift+Delete)
- Recarregar página (Ctrl+F5)
- Limpar arquivo `.next` e rebuild: `rm -rf .next && npm run build`

### Análise vs Knowledge Base

- **Análise** = Plano estratégico gerado por agentes (tabela: `marketplace_plans`)
- **Knowledge Base** = Arquivos uploadados para agentes aprender (tabela: `knowledge_base`)

São sistemas separados!

---

## 🔗 Documentação Relacionada

- `/docs/NEXO-KNOWLEDGE-BASE.md` - Sistema de Knowledge Base
- `/docs/NEXO-MASTER-DASHBOARD.md` - Dashboard Master
- `app/lib/ai/agent-loop.ts` - Lógica de análise e geração de tarefas
- `app/api/marketplace/analysis/` - Endpoints de análise

---

**Última atualização:** 2026-02-24
**Status:** 🔧 Aguardando execução de diagnósticos
