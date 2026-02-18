# ✅ Testar Autenticação Agora

## 🎯 O que foi corrigido

1. ✅ **Type Extension** - NextAuth agora reconhece propriedade `role`
2. ✅ **Return Types** - `authorize()` retorna tipo correto
3. ✅ **Type Casting** - Callbacks tratam propriedades customizadas corretamente
4. ✅ **Session & JWT** - Fluxo completo de tipos validado

---

## 🚀 Passo 1: Parar e Recomeçar

```bash
# Se npm run dev estava rodando, parar com Ctrl+C

# Limpar cache (importante!)
rm -rf .next

# Instalar dependências novamente (garante tudo limpo)
npm install

# Reiniciar servidor de desenvolvimento
npm run dev
```

Você deve ver algo como:
```
  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000
  - Environment:  development

✓ Ready in 2.3s
```

---

## 🔐 Passo 2: Testar Login

### Opção A: Teste via Browser (Recomendado)

1. Abra: **http://localhost:3000/login**
2. Você verá um formulário com campos pré-preenchidos:
   - Email: `admin@example.com`
   - Senha: `password`
3. **Clique em "Entrar na Conta"**

### Esperado:
- ✅ Botão mostra "Entrando..." com spinner
- ✅ Redireciona para `/dashboard`
- ✅ Mostra "Bem-vindo, Demo User! 👋"
- ✅ Dashboard mostra 4 tarefas

### Se não funcionar:
- Pressione **F12** para abrir DevTools
- Vá para aba **Console**
- Procure por logs vermelhos (erros)
- **Envie print dos erros**

---

## 🧪 Passo 3: Verificar Logs no Terminal

Enquanto tenta fazer login, você deve ver no terminal (onde `npm run dev` está rodando):

```
🔑 Iniciando login com: { email: 'admin@example.com' }
🔐 authorize() called with: { email: 'admin@example.com' }
✅ Credenciais valid, returning user
📝 jwt() callback: { tokenId: '...', userId: '1' }
📋 session() callback: { email: 'admin@example.com', role: 'admin' }
```

Se ver `❌ Credenciais invalid`, significa que a senha está errada (mas não deveria, pois está pré-preenchida).

---

## 🔍 Passo 4: Verificar Network Tab

1. Pressione **F12** → Aba **Network**
2. Tente fazer login
3. Procure por requisição POST com nome contendo `auth` ou `callback`
4. Clique nela e veja a **Response** (resposta)

Deve conter algo como:
```json
{
  "ok": true,
  "status": 200,
  "user": {
    "id": "1",
    "email": "admin@example.com",
    "name": "Demo User",
    "role": "admin"
  }
}
```

---

## 🧬 Passo 5: Validar Dashboard

Se conseguir chegar no dashboard, verifique:

- [ ] Mostra "Bem-vindo, Demo User! 👋"
- [ ] Mostra "Você está logado como **admin**"
- [ ] Mostra 4 cards com stats (Total, Completas, Em Progresso, Pendentes)
- [ ] Mostra tabela com tarefas:
  - Implementar autenticação (Em Progresso)
  - Corrigir bugs (Aprovada)
  - Documentar API (Em Progresso)
  - Integrar Supabase (Pendente)

---

## 📋 Checklist de Teste

Marque conforme testa:

- [ ] `npm run dev` inicia sem erros
- [ ] Login page carrega em http://localhost:3000/login
- [ ] Campos de email/senha estão pré-preenchidos
- [ ] Botão "Entrar na Conta" funciona
- [ ] Redireciona para /dashboard após login
- [ ] Dashboard mostra nome do usuário
- [ ] Dashboard mostra role (admin)
- [ ] Tarefas carregam na tabela
- [ ] Stats mostram números corretos

---

## ❌ Se Ainda Não Funcionar

Compartilhe:

1. **Screenshot** da tela de erro
2. **Logs do terminal** (quando tenta fazer login)
3. **Response da Network Tab** (POST /auth/callback/credentials)
4. **Console do Browser** (F12 → Console)
5. **Descrição do que acontece**:
   - [ ] Nada acontece ao clicar em "Entrar"
   - [ ] Mostra erro na tela
   - [ ] Redirecionamento errado
   - [ ] Outro: ______________

---

## 🔧 Troubleshooting Rápido

### "Module not found" ou erros de tipo
```bash
rm -rf .next node_modules
npm install
npm run build
npm run dev
```

### "Port 3000 in use"
```bash
# Encontrar processo na porta 3000
lsof -i :3000
# Matar o processo (se WSL)
pkill -f "node"
```

### "NEXTAUTH_SECRET not set"
```bash
# Verificar .env.local
cat .env.local | grep NEXTAUTH_SECRET
# Deve ter um valor!
```

---

## ✨ Próximo Passo

Assim que o login funcionar:

1. **Testar fluxo completo**:
   - Sair (se tiver botão)
   - Tentar acessar /dashboard sem login
   - Deve redirecionar para /login

2. **Começar a integrar Supabase** (quando quiser dados persistidos)

---

**Teste agora e me envie o resultado! 🚀**
