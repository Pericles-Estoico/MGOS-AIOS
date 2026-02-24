# 🚨 DEBUG MOBILE - URGENTE

**Problema:** Análises e aba marketplace não aparecem no mobile
**Solução:** Seguir estes passos em ordem

---

## ⚡ PASSO 1: Verificar o que está quebrado

### No seu mobile, abra este link:

```
https://www.sellerops.com.br/api/debug/mobile-check
```

### Você vai ver algo como:

```json
{
  "checks": {
    "authentication": {
      "ok": true,
      "user": "seu@email.com",
      "role": "admin"
    },
    "database": {
      "ok": true,
      "error": "Database connected"
    },
    "analysisData": {
      "ok": true,
      "error": "Analyses exist",
      "count": 3
    }
  },
  "allOk": true,
  "nextSteps": ["✅ ALL CHECKS PASSED"]
}
```

---

## 🔍 INTERPRETAR O RESULTADO

### ✅ Se `"allOk": true`
- **Tudo está OK no backend**
- Problema é no FRONTEND (cache, JS)
- **Solução:** Ir para PASSO 2 (Limpar cache completo)

### ❌ Se `"authentication": {"ok": false}`
- **Não está logado**
- **Solução:** Fazer logout e login novamente
  ```
  1. Abrir app
  2. Menu → Logout
  3. Login com suas credenciais
  4. Reabrir marketplace
  ```

### ❌ Se `"database": {"ok": false}`
- **Banco de dados não está conectado**
- **Solução:** Não é problema seu, avisar desenvolvimento
- Copiara resposta: `{"error": "..."}`

### ❌ Se `"analysisData": {"ok": false, "count": 0}`
- **Nenhuma análise foi criada ainda**
- **Solução:** Executar em um computador:
  ```bash
  curl -X POST https://www.sellerops.com.br/api/marketplace/recover/auto-approve
  ```
- Depois reabrir mobile

---

## 🛠️ PASSO 2: Limpar Cache Completo + Force Refresh

### 🍎 iPhone/iPad

**Opção A (mais rápido):**
```
Configurações → Safari → Histórico
→ "Limpar Histórico e Dados de Website"
```

**Opção B (mais completo):**
1. Sair do app completamente
2. Settings → Safari → Advanced → Website Data
3. Encontrar "sellerops.com.br"
4. Swipe left → Delete
5. Reabrir app

**Depois:** Ir para `https://www.sellerops.com.br/marketplace`

---

### 🤖 Android

**Opção A (Chrome):**
```
Chrome → Configurações → Privacidade e segurança
→ "Limpar dados de navegação"
→ Marcar: Cookies e dados armazenados + Imagens e arquivos em cache
→ "Limpar dados"
```

**Opção B (Browser DevTools):**
1. Abrir app
2. Pressionar `F12` (ou Menu → More tools → Developer tools)
3. Aba "Application"
4. Esquerda: "Cache Storage" → Delete tudo
5. Esquerda: "Service Workers" → Unregister
6. Refresh: `Ctrl+Shift+R`

**Depois:** Ir para `https://www.sellerops.com.br/marketplace`

---

## 📱 PASSO 3: Verificar se Apareceu

Depois de limpar cache:

### Você deve ver:

✅ **Header:** "🚀 Marketplace Master (Nexo)"
✅ **Status Cards:** "6 Agentes Ativos", "0 Tarefas Geradas" (ou número > 0)
✅ **Ações Rápidas:** Links para "Pendentes de Aprovação", "Em Execução", "Analytics", "Análises", "📚 Knowledge Base", "Upload Análise"

### Se ainda não vir:

1. Verificar console do navegador (F12 → Console)
2. Procurar por mensagens vermelhas (erros)
3. Screenshot do erro
4. Voltar para PASSO 1 e rodar `/api/debug/mobile-check` novamente

---

## 🚀 PASSO 4: Ativar as Análises (Desktop)

Se debug retornar `"count": 0`:

**No seu computador:**

```bash
curl -X POST https://www.sellerops.com.br/api/marketplace/recover/auto-approve
```

**Esperado:**
```json
{
  "status": "success",
  "approvedCount": 3,
  "tasksCreated": 12
}
```

**Depois:** Reabrir mobile e ir para marketplace

---

## ✅ PASSO 5: Confirmar Tudo Funcionando

No mobile, você deve ver agora:

✅ Dashboard NEXO com status dos agentes
✅ Cards com: "Agentes Ativos", "Tarefas Geradas", "Taxa Sucesso", "Saúde Sistema"
✅ 4 botões: "Phase 2", "Phase 3", "Phase 4", "Análises"
✅ Seção "Canais de Marketplace" com 6 canais
✅ Seção "Ações Rápidas" com 6 links

---

## 🆘 SE AINDA NÃO FUNCIONAR

### Checklist Final:

- [ ] Executei `/api/debug/mobile-check`? (Mostrar resultado)
- [ ] Limpei cache completamente?
- [ ] Fiz logout/login?
- [ ] Esperei 5-10 segundos depois de limpar cache?
- [ ] Recarreguei página com `Ctrl+F5` ou `Cmd+Shift+R`?
- [ ] Tentei em outro navegador?
- [ ] Tentei em modo privado/incógnito?

### Se nada funcionar:

1. Screenshot do `/api/debug/mobile-check` (deve mostrar `"allOk": true`)
2. Screenshot do console de erros (`F12` → Console)
3. Device: iPhone/Android?
4. Navegador: Chrome/Safari/Firefox?
5. Versão do app?

**Enviar essas informações para desenvolvimento debugar!**

---

## 📊 Resumo Rápido (3 minutos)

```
1. Abrir: https://www.sellerops.com.br/api/debug/mobile-check
2. Verificar: "allOk" true ou false?
3. Se true: Limpar cache (Settings → Safari/Chrome → Clear Data)
4. Se false: Avisar qual check falhou
5. Reabrir: https://www.sellerops.com.br/marketplace
6. Deve aparecer dashboard NEXO completo
```

---

**Status:** 🚨 URGENTE - Seguir passos acima
**Última atualização:** 2026-02-24
