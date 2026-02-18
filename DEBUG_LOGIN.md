# 🔍 Debug Guide - Login Issues

## Passo 1: Verificar o Console do Browser

1. Abra `http://localhost:3000/login`
2. Pressione **F12** (DevTools)
3. Vá para a aba **Console**
4. Tente fazer login
5. **Compartilhe os logs que aparecerem** (especialmente erros vermelhos)

## Passo 2: Verificar o Terminal (npm run dev)

Ao clicar em "Entrar", você deve ver logs como:

```
🔑 Iniciando login com: { email: 'admin@example.com' }
🔐 authorize() called with: { email: 'admin@example.com' }
✅ Credenciais válidas, retornando usuário
📝 jwt() callback: { tokenId: ..., userId: '1' }
📋 session() callback: { email: 'admin@example.com', role: 'admin' }
```

**Compartilhe estes logs se não aparecerem ou se houver erro.**

## Passo 3: Verificar Endpoints de Debug

Abra em abas diferentes:

### Aba 1: Verificar configuração
```
http://localhost:3000/api/debug/auth
```
Deve retornar JSON com status "ok" e mostar NEXTAUTH_SECRET configurado.

### Aba 2: Testar token
```
http://localhost:3000/api/auth/session
```
Se já fez login, deve retornar dados da sessão. Se não, deve retornar 401.

### Aba 3: Network - Chrome DevTools
1. Pressione F12
2. Vá para aba **Network**
3. Tente fazer login
4. Procure por requisição POST `/api/auth/callback/credentials`
5. Veja a **response** (resposta) dessa requisição

## Passo 4: Informações que Preciso

Para debugar, me mande:

1. **Console do Browser**: Print ou copie os logs em vermelho
2. **Terminal**: Logs quando tenta fazer login
3. **Network Tab**: Response da requisição `/api/auth/callback/credentials`
4. **Descreva o comportamento**:
   - [ ] Nada acontece ao clicar em "Entrar"
   - [ ] Botão fica "carregando" e depois volta ao normal
   - [ ] Redireciona para outra página (qual?)
   - [ ] Mostra erro na tela
   - [ ] Outro:

## Passo 5: Quick Checklist

Antes de debugar, verifique:

```bash
# 1. Está no diretório certo?
pwd
# Deve ser: /home/finaa/repos/MGOS-AIOS

# 2. Tem node_modules?
ls -la node_modules | head

# 3. .env.local existe e tem valores?
cat .env.local | grep NEXTAUTH

# 4. Porta 3000 está livre?
netstat -tuln | grep 3000

# 5. Tenta rodar: npm run dev
npm run dev
```

---

## Possíveis Problemas & Soluções

### ❌ "authorize() is not a function"
```
Solução: Reiniciar npm run dev após mudanças em app/lib/auth.ts
```

### ❌ "NEXTAUTH_SECRET is not set"
```
Solução: Verificar .env.local
cat .env.local | grep NEXTAUTH_SECRET
```

### ❌ "NextAuth endpoint not found"
```
Solução: Verificar se app/api/auth/[...nextauth]/route.ts existe
ls -la app/api/auth/
```

### ❌ "Redirect loop" (piscando entre login e dashboard)
```
Solução: Problema com middleware.ts - token não é reconhecido
Verifique: grep -n "getToken" middleware.ts
```

### ❌ "Session is null"
```
Solução: SessionProvider não está envolvendo a app
Verifique: cat app/layout.tsx | grep ClientProviders
```

---

**Me envie a informação do Passo 4 para debugarmos! 🔧**
