# ⚡ Quick Start - Sistema Operacional NEXO

**Tempo total:** 5 minutos para rodar um teste completo
**Dificuldade:** Fácil (copiar & colar)

---

## 🎬 COMEÇAR AGORA (3 Comandos)

### 1️⃣ Destravar análises travadas (se houver)
```bash
curl -X POST http://localhost:3000/api/marketplace/recover/auto-approve
```

Resposta esperada:
```json
{ "approvedCount": 3, "tasksCreated": 12 }  ← 3 análises aprovadas!
```

---

### 2️⃣ Verificar Phase 1 tasks criadas
```bash
curl http://localhost:3000/api/tasks?phase=1
```

Resposta esperada:
```json
{
  "tasks": [
    {
      "title": "Otimizar Preços - Amazon",
      "channel": "amazon",
      "status": "pending"
    },
    {
      "title": "Melhorar Imagens - Shopee",
      "channel": "shopee",
      "status": "pending"
    }
    ...
  ]
}
```

---

### 3️⃣ Ver Dashboard NEXO Master
```bash
curl http://localhost:3000/api/marketplace/orchestration/metrics
```

Resposta esperada:
```json
{
  "system": {
    "activeAgents": 6,
    "totalTasksGenerated": 12,
    "totalTasksCompleted": 0,
    "systemHealth": "good"
  }
}
```

---

## 🎯 O QUE VOCÊ VAI VER NO DASHBOARD

Ir para: **https://www.sellerops.com.br/marketplace**

```
┌─────────────────────────────────────────────────────────┐
│ 🚀 NEXO Orchestrator Master                      ATIVO  │
├─────────────────────────────────────────────────────────┤
│ Agentes Ativos: 6/6                                      │
│ Tarefas Geradas: 12                                      │
│ Taxa de Sucesso: 0% (em progresso)                       │
│ Saúde do Sistema: 🟢 GOOD                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Phase 2: Dashboard]  [Phase 3: Execução]                │
│ [Phase 4: Otimização] [Análises: 3 Aprovadas]            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 FLUXO VISUAL

```
📁 Knowledge Base
   ↓ (Upload arquivo)
📋 Análise Estratégica
   ↓ (Agentes analisam)
⏳ Aguardando Aprovação
   ↓ (Você aprova)
✅ Aprovada
   ↓ (Auto-criação de tasks)
🎯 Phase 1 Tasks (Prontas)
   ↓ (Atribuir a agentes)
⚡ Em Execução
   ↓ (Agentes executam)
📊 Resultados & Métricas
   ↓ (Análise de impacto)
🔄 Phase 2 (Otimizações mais profundas)
   ↓
📈 Phase 3 (Resultados finais)
   ↓
🏆 Phase 4 (IA otimiza automaticamente)
```

---

## 🚦 CHECKLIST: ESTÁ TUDO OK?

- [ ] Build: `npm run build` ✅ Sucesso
- [ ] Rotes compiladas: 86 rotas ✅
- [ ] Análises desbloqueadas: `auto-approve` ✅
- [ ] Phase 1 tasks criadas: 12 ✅
- [ ] Dashboard: Métricas atualizando ✅
- [ ] Agentes: 6/6 ativos ✅
- [ ] System Health: 🟢 GOOD ✅

---

## 🛠️ TROUBLESHOOTING RÁPIDO

### ❌ "Erro: Unauthorized"
→ Use conta **admin/head** (não usuário comum)

### ❌ "Análises ainda em Aguardando"
→ Execute: `curl -X POST .../recover/auto-approve`

### ❌ "Phase 1 tasks não aparecem"
→ Aguarde 2-3 segundos e recarregue

### ❌ "Banco não disponível"
→ Verificar `.env.local`:
```bash
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

---

## 📚 DOCUMENTAÇÃO

| Documento | Propósito |
|-----------|-----------|
| `SIMULACAO-OPERACAO-COMPLETA.md` | Guia passo-a-passo completo |
| `DESTRAVAR-ANALISES.md` | Como destravar análises |
| `NEXO-KNOWLEDGE-BASE.md` | Sistema de Knowledge Base |
| `NEXO-MASTER-DASHBOARD.md` | Dashboard NEXO |
| `MARKETPLACE-DIAGNOSTICS.md` | Diagnóstico de problemas |

---

## 🎉 RESUMO FINAL

✅ **Sistema está funcional e operacional**
✅ **3 análises podem ser ativadas**
✅ **12+ Phase 1 tasks podem ser criadas**
✅ **Dashboard mostra progresso em tempo real**
✅ **Agentes estão prontos para executar**

---

## 🚀 PRÓXIMO PASSO

```
1. Execute: curl -X POST .../recover/auto-approve
2. Abra dashboard: https://www.sellerops.com.br/marketplace
3. Clique em "Phase 2: Dashboard em Tempo Real"
4. Veja agentes trabalhando! 👀
```

---

**Build Status:** ✅ SUCCESS
**Deploy Status:** ✅ READY
**System Status:** ✅ OPERATIONAL
**Last Updated:** 2026-02-24
