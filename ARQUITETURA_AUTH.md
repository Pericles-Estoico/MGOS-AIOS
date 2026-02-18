# 🏗️ Arquitetura de Autenticação - MGOS-AIOS

## Fluxo Completo de Autenticação

```
┌─────────────┐
│   Browser   │
│   (Login)   │
└──────┬──────┘
       │ POST /api/auth/callback/credentials
       ↓
┌──────────────────────────────────┐
│ /api/auth/[...nextauth]/route.ts │
│ (NextAuth Handler)               │
└──────┬───────────────────────────┘
       │
       ↓
┌───────────────────────────────────────┐
│ CredentialsProvider.authorize()       │
│ (app/lib/auth.ts)                     │
│                                       │
│ ✓ Valida email e password             │
│ ✓ Retorna User { id, email, ...role } │
└──────┬────────────────────────────────┘
       │
       ↓
┌───────────────────────────────────────┐
│ JWT Callback                          │
│ jwt({ token, user })                  │
│                                       │
│ ✓ Adiciona id e role ao token        │
│ ✓ Retorna token modificado            │
└──────┬────────────────────────────────┘
       │
       ↓
┌───────────────────────────────────────┐
│ Session Callback                      │
│ session({ session, token })           │
│                                       │
│ ✓ Adiciona id e role à session       │
│ ✓ Retorna session modificada          │
└──────┬────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Browser recebe Session Cookie    │
│ (JWT em cookie seguro)           │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Redirecionado para /dashboard    │
│ (middleware verifica token)      │
└──────────────────────────────────┘
```

---

## Componentes

### 1. **Page: `/app/(auth)/login/page.tsx`**

- ✓ Componente cliente (`'use client'`)
- ✓ Usa `signIn('credentials', {...})` do NextAuth
- ✓ Campos pré-preenchidos: admin@example.com / password
- ✓ Estados: loading, error
- ✓ Redireciona para /dashboard com callbackUrl

### 2. **Auth Config: `/app/lib/auth.ts`**

```typescript
authOptions: NextAuthOptions = {
  providers: [CredentialsProvider(...)],
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) { ... },
    session({ session, token }) { ... }
  }
}
```

**Credenciais de Demo:**
```
Email:    admin@example.com
Senha:    password
Retorno:  User { id: '1', email, name, role: 'admin' }
```

### 3. **Handler: `/app/api/auth/[...nextauth]/route.ts`**

- ✓ Exporta handler do NextAuth
- ✓ Processa: GET, POST, DELETE, etc.

### 4. **Middleware: `/middleware.ts`**

```typescript
// Protege rotas
if (token) && pathname.startsWith('/dashboard') → Permitir
if (!token) && pathname.startsWith('/dashboard') → Redirecionar /login

// Redireciona autenticados away from login
if (token) && pathname === '/login' → Redirecionar /dashboard
```

**Rotas Protegidas:**
- `/dashboard` - Todos autenticados
- `/team` - admin, head
- `/settings` - admin

### 5. **Session: `/app/api/auth/session/route.ts`**

- ✓ Retorna sessão atual
- ✓ Requer autenticação (401 se não autenticado)

### 6. **Debug: `/app/api/debug/auth/route.ts`**

- ✓ Mostra configuração (secret, url, providers)
- ✓ Mostra sessão atual
- ✓ Útil para troubleshooting

### 7. **Providers: `/app/providers-client.tsx`**

```typescript
export function ClientProviders({ children }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

- ✓ Envolvido no root layout
- ✓ Fornece session context para toda a app

### 8. **Types: `/types/next-auth.d.ts`**

```typescript
// Estende tipos padrão do NextAuth para incluir 'role'
Session {
  user: { id, role } & DefaultSession['user']
}
User { id, role }
JWT { id, role }
```

---

## Variáveis de Ambiente

```env
# .env.local (DEV)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-key-32-characters-minimum-for-development-only

# .env (PROD - Vercel)
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=<valor-gerado-seguro>
```

**Geração de Secret seguro:**
```bash
openssl rand -base64 32
```

---

## Fluxo de Sessão

### 1. Login → Cookie JWT

```
signIn('credentials', { email, password, redirect: false })
  ↓
authorize() valida credenciais
  ↓
jwt() callback adiciona id e role
  ↓
Navegador recebe cookie: 'next-auth.session-token'
  ↓
Cookie é enviado em todas as requisições
```

### 2. Requisições Subsequentes → Verificar Sessão

```
getSession() ou getServerSession(authOptions)
  ↓
Lê cookie JWT
  ↓
Valida assinatura
  ↓
Retorna session { user: {...}, expires }
```

### 3. Logout

```
signOut()
  ↓
Cookie é deletado
  ↓
Sessão encerrada
  ↓
Redireciona para /login
```

---

## Segurança

### ✓ Implementado

- ✓ HTTPS em produção (Vercel força)
- ✓ Cookies httpOnly (padrão NextAuth)
- ✓ Cookies Secure (apenas https)
- ✓ CSRF protection (NextAuth automático)
- ✓ JWT assinado (NEXTAUTH_SECRET)
- ✓ Sem senhas em localStorage
- ✓ SameSite=Lax (padrão NextAuth)

### ⚠️ Não Implementado (Adicionar Depois)

- [ ] Password hashing (Demo usa plaintext)
- [ ] Email verification
- [ ] 2FA/MFA
- [ ] OAuth (Google, GitHub, etc.)
- [ ] Rate limiting no login
- [ ] Lockout após tentativas erradas
- [ ] Session invalidation on logout

---

## Debugging

### Logs no Console (Servidor)

```typescript
// app/lib/auth.ts
console.log('🔐 authorize() called with:', { email });
console.log('✅ Credentials valid, returning user');
console.log('📝 jwt() callback:', { tokenId, userId });
console.log('📋 session() callback:', { email, role });
```

### Logs no Browser (Client)

```typescript
// app/(auth)/login/page.tsx
console.log('🔑 Iniciando login');
console.log('📊 SignIn result:', result);
console.log('✅ Login bem-sucedido');
```

### Verificar Cookie

```javascript
// Abrir DevTools → Console
document.cookie
// Deve conter: "next-auth.session-token=..."
```

---

## Testes

### Unit Tests (Ideal)

```typescript
// Testar authorize() function
const user = await authorize({ email, password });
expect(user.id).toBe('1');
expect(user.role).toBe('admin');
```

### Integration Tests (Prático)

```bash
# Testar endpoints sem UI
curl http://localhost:3000/api/debug/auth
curl http://localhost:3000/api/auth/session
```

### Manual Tests (Agora)

1. ✓ Login com credenciais corretas
2. ✓ Redireciona para /dashboard
3. ✓ Acesso a /dashboard funciona
4. ✓ Logout funciona
5. ✓ Cookie é deletado

---

## Próximos Passos

### Curto Prazo
1. ✓ Autenticação Demo funcionando
2. ✓ Dashboard mostrando dados
3. ✓ Middleware protegendo rotas

### Médio Prazo
1. Integrar Supabase (usuários reais)
2. Hash de passwords
3. Email verification
4. OAuth (Google, GitHub)

### Longo Prazo
1. 2FA/MFA
2. SSO corporativo
3. Role-based access control avançado
4. Audit logging

---

## Referências

- [NextAuth.js Docs](https://next-auth.js.org/)
- [NextAuth Credentials Provider](https://next-auth.js.org/providers/credentials)
- [NextAuth Middleware](https://next-auth.js.org/configuration/pages#nextauthjs-middleware)
- [Session & Callbacks](https://next-auth.js.org/configuration/callbacks)

---

*Última atualização: 2026-02-18*
