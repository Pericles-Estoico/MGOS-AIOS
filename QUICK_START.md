# 🚀 Quick Start - MGOS-AIOS

## Fluxo Rápido para Usar o App

### 1️⃣ Iniciar o Desenvolvimento

```bash
npm run dev
# Acesse: http://localhost:3000
```

### 2️⃣ Fazer Login

Na página de login, use as credenciais de teste:

```
Email:    admin@example.com
Senha:    password
```

(Credenciais estão pré-preenchidas na página de login)

### 3️⃣ Dashboard Funcional

Após login, você será redirecionado para `/dashboard` com:
- ✅ Bem-vindo personalizado com seu nome
- ✅ Estatísticas de tarefas (Total, Completas, Em Progresso, Pendentes)
- ✅ Lista das suas tarefas atribuídas
- ✅ Quick actions para criar tarefas e acessar analytics

### 4️⃣ Fluxo de Navegação

```
Login (/login)
   ↓
Dashboard (/dashboard) ← Página inicial protegida
   ├→ Minhas Tasks (tabela com seus tasks)
   ├→ Ver todas (link para /tasks)
   └→ Quick Actions
       ├→ Criar Task (/tasks/new)
       ├→ Analytics (/analytics) - admin apenas
       └→ Gerenciar Equipe (/settings/users) - admin apenas
```

## 🔐 Autenticação

### Como Funciona

1. **NextAuth.js** gerencia autenticação via JWT
2. **Middleware** protege rotas (`/dashboard`, `/team`, `/settings`)
3. **Sessão** persiste em cookies JWT (24 horas)
4. **Logout automático** após 24 horas

### Variáveis de Ambiente

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-key-32-characters-minimum-for-development-only
```

(Já configuradas em `.env.local`)

## 📊 Dados de Teste

### Tarefas Disponíveis

Atribuídas ao seu usuário (`admin`):
1. ✅ **Implementar autenticação** - Em Progresso (alta prioridade)
2. ✅ **Corrigir bugs de performance** - Aprovada (alta prioridade)
3. ✅ **Documentar API** - Em Progresso (média prioridade)
4. ✅ **Integrar Supabase** - Pendente (alta prioridade)

### API de Tasks

**Endpoint:** `GET /api/tasks`

**Query Params:**
```
?assigned_to=1        # Filtrar por usuário
&limit=20             # Limite de resultados
&sort_by=updated_at   # Ordenar por campo
```

**Exemplo:**
```bash
curl -H "Cookie: [session-cookie]" \
  "http://localhost:3000/api/tasks?assigned_to=1&limit=5&sort_by=updated_at"
```

## 🧪 Endpoints de Debug

### Verificar Autenticação
```
GET /api/auth/session
```
Retorna dados da sessão atual (requer autenticação)

### Verificar Configuração
```
GET /api/debug/auth
```
Mostra variáveis de ambiente e status da configuração

## 🔄 Próximos Passos

### Quando quiser banco de dados real:

1. **Criar Supabase**
   - Conta em https://supabase.com
   - Criar novo projeto
   - Copiar URL e keys

2. **Conectar ao App**
   ```env
   SUPABASE_URL=sua-url
   SUPABASE_ANON_KEY=sua-chave
   ```

3. **Migrar dados fake para real**
   - Criar tabela `tasks`
   - Atualizar endpoints de API

## ⚠️ Limitações Atuais

- ✋ Dados são **fake** (não persiste após reload)
- ✋ Usuários are **hardcoded** (não pode criar novos)
- ✋ Sem banco de dados real

## 💡 Para Debug

### Logs no Console

O app log detalhados:
```
🔑 Iniciando login com: { email }
📊 SignIn result: { ok, error, status }
✅ Login bem-sucedido, redirecionando...
📝 jwt() callback: { tokenId, userId }
📋 session() callback: { email, role }
```

### Ver Requisições de API

Abra DevTools (F12) → Network para ver:
- POST `/api/auth/callback/credentials` - Login
- GET `/api/auth/session` - Verificar sessão
- GET `/api/tasks` - Buscar tarefas

---

## 🎯 TL;DR

```bash
# 1. Iniciar
npm run dev

# 2. Abrir browser
open http://localhost:3000

# 3. Login
Email: admin@example.com
Senha: password

# 4. Usar dashboard
# Tudo funciona! Tasks, stats, navegação
```

**Pronto para usar! 🚀**
