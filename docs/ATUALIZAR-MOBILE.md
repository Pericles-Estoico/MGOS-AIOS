# 📱 Forçar Atualização no Mobile

**Problema:** Mobile cache antigo (mgos-v1) não foi atualizado
**Solução:** Incrementar versão de cache + limpar no device

---

## 🔄 O que foi feito (Backend)

✅ Service Worker atualizado de `v1` → `v2`
✅ Versão do cache incrementada em:
- `CACHE_NAME = 'mgos-v2'`
- `API_CACHE = 'mgos-api-v2'`

Quando usuário abrir app, Service Worker vai:
1. Detectar nova versão
2. Baixar novos assets
3. Deletar cache antigo (`mgos-v1`)
4. Limpar aplicação com dados novos

---

## 📱 Instruções para Cada Device

### 🍎 iPhone/iPad (Safari)

**Opção 1: Limpar tudo (mais rápido)**
```
Configurações → Safari → Histórico
→ Limpar Histórico e Dados de Website
```

**Opção 2: App específico**
```
Configurações → Safari → Avançado → Dados de Website
→ Encontrar "sellerops.com.br" → Editar → Deletar
```

**Depois:** Reabrir app e fazer login

---

### 🤖 Android (Chrome)

**Opção 1: Via Settings**
```
Chrome → Configurações → Privacidade e segurança
→ Limpar dados de navegação
→ Cookies, dados de sites em cache
→ Limpar dados
```

**Opção 2: Via Força a Atualizar**
```
Chrome → Menu → Mais ferramentas → Apagar dados de navegação
→ Selecionar "Todo o tempo"
→ Todos itens
→ Limpar dados
```

**Depois:** Reabrir app e fazer login

---

### 💻 Mobile Browser (Genérico)

**Force Reload:**
- `Ctrl+Shift+R` (Windows) ou
- `Cmd+Shift+R` (Mac) ou
- `F12` → Application → Service Workers → Unregister

**Limpar Cache:**
1. Abrir DevTools (`F12`)
2. Ir para "Application" tab
3. Na esquerda: "Service Workers"
4. Clicar "Unregister"
5. Na esquerda: "Cache Storage"
6. Deletar todos os caches:
   - `mgos-v1` → Delete
   - `mgos-api-v1` → Delete

**Depois:** Recarregar página (F5)

---

## ✅ Verificar se Atualizou

### No Browser (Desktop ou Mobile)

Abrir DevTools (`F12`):

```
Application → Service Workers
→ Deve mostrar nova versão (mgos-v2)
```

Se ainda mostrar `mgos-v1`:
- ❌ Cache não foi limpo
- ❌ Seguir instruções de limpeza acima

Se mostrar `mgos-v2`:
- ✅ Atualização bem-sucedida!
- ✅ App está com versão nova

---

### No App (Sem DevTools)

Sinais de atualização bem-sucedida:
- ✅ Novo link "📚 Knowledge Base" aparece em "Ações Rápidas"
- ✅ Dashboard NEXO mostra botão "Ativar NEXO"
- ✅ Status dos agentes atualiza em tempo real
- ✅ Análises aparecem corretamente

Sinais de cache antigo:
- ❌ Links/botões ainda não aparecem
- ❌ Dashboard mostra "Carregando..." infinitamente
- ❌ Funcionalidades antigas funcionam, novas não aparecem

---

## 🔧 Troubleshooting

### ❌ "Ainda não aparece depois de limpar cache"

**Passo 1:** Verificar se build foi feito
```bash
npm run build
```

**Passo 2:** Verificar se servidor está rodando
```bash
npm run dev
```

**Passo 3:** Força refresh completo
- Desktop: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
- Mobile: Sair do app → Fechar completamente → Reabrir

### ❌ "Erro ao desregistrar Service Worker"

A versão antiga pode estar travada. Solução:
1. Fechar app/browser completamente
2. Aguardar 10 segundos
3. Reabrir
4. DevTools → Application → Service Workers → Unregister

### ❌ "PWA não atualiza automaticamente"

PWA pode estar em modo offline. Solução:
1. Conectar WiFi forte
2. Sair completamente do app
3. Reconectar (reabrir app)
4. DevTools mostrará nova versão sendo instalada

---

## 📊 Versões de Cache

| Versão | Data | O que muda |
|--------|------|-----------|
| mgos-v1 | < 24/02 | Versão anterior |
| mgos-v2 | 24/02 | ✨ Knowledge Base + NEXO Master + Fallback |
| mgos-v3 | TBD | Phase 2 improvements |

Sempre que houver update, versão vai aumentar.

---

## ⚡ Comando Rápido (Se for Dev)

```bash
# Limpar todos os caches locais (development)
rm -rf .next
npm run build

# Depois no browser:
# DevTools → Application → Clear storage → Clear site data
```

---

## 📝 Resumo

**Para Usuários Finais:**
1. Ir para Configurações → Safari/Chrome
2. Limpar Dados de Website
3. Reabrir app
4. **✅ Pronto!** (leva ~5 segundos)

**Para Developers:**
1. `npm run build` (atualizar build)
2. DevTools `F12` → Application → Clear Storage
3. Refresh página
4. **✅ Pronto!**

---

**Última atualização:** 2026-02-24
**Status:** 🟢 Cache atualizado para v2
