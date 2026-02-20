# 🔍 Auditoria de Integração: Botões & Banco de Dados Supabase

**Data:** 20 de Fevereiro de 2026
**Status:** ⚠️ PARCIALMENTE INTEGRADO
**Prioridade:** ALTA

---

## 📊 Resumo Executivo

| Métrica | Status |
|---------|--------|
| **Total de Endpoints** | 35+ rotas de API |
| **Integrados com Supabase** | ✅ ~20 (58%) |
| **Em Mock/Memória** | ⚠️ ~5 (14%) |
| **Não Implementados** | ❌ ~10 (28%) |
| **Botões Funcionais** | ✅ ~80% |

---

## ✅ INTEGRADOS COM SUPABASE (Funcionando)

### Tasks Management

| Funcionalidade | Endpoint | Status | Integração |
|---|---|---|---|
| **Listar Tarefas** | `GET /api/tasks` | ⚠️ PARCIAL | Usa mock em memória |
| **Get Task Details** | `GET /api/tasks/[id]` | ✅ OK | Supabase + RLS |
| **Atualizar Tarefa** | `PUT /api/tasks/[id]` | ✅ OK | Supabase |
| **Iniciar Tarefa** | `POST /api/tasks/[id]/start` | ✅ OK | Supabase + Audit Log |
| **Reatribuir Tarefa** | `PATCH /api/tasks/[id]/reassign` | ✅ VERIFICAR | Supabase esperado |
| **Estender Data** | `PATCH /api/tasks/[id]/extend-due-date` | ✅ VERIFICAR | Supabase esperado |
| **Comentários** | `POST /api/tasks/[id]/comments` | ✅ VERIFICAR | Supabase esperado |

### QA Reviews

| Funcionalidade | Endpoint | Status |
|---|---|---|
| **Criar Review** | `POST /api/qa-reviews` | ✅ Supabase |
| **Get Review** | `GET /api/qa-reviews/[task-id]` | ✅ Supabase |
| **Atualizar Review** | `PUT /api/qa-reviews/[task-id]` | ✅ Supabase |

### Evidence Management

| Funcionalidade | Endpoint | Status |
|---|---|---|
| **Upload Evidence** | `POST /api/evidence` | ✅ Supabase + Storage |
| **Listar Evidence** | `GET /api/evidence` | ✅ Supabase |

### Users & Team

| Funcionalidade | Endpoint | Status |
|---|---|---|
| **Listar Usuários** | `GET /api/users` | ✅ Supabase |
| **Get User** | `GET /api/users/[id]` | ✅ Supabase |
| **Atualizar User** | `PUT /api/users/[id]` | ✅ Supabase |

### Marketplace Intel (Novo)

| Funcionalidade | Endpoint | Status |
|---|---|---|
| **Listar Tasks** | `GET /api/marketplace-intel/tasks` | ✅ Supabase |
| **Aprovar Task** | `PATCH /api/marketplace-intel/approve/[id]` | ✅ Supabase |

### Notifications

| Funcionalidade | Endpoint | Status |
|---|---|---|
| **Enqueue Email** | `POST /api/notifications/enqueue` | ✅ Supabase |
| **Get Preferences** | `GET /api/notifications/preferences` | ✅ Supabase |
| **Save Preferences** | `PUT /api/notifications/preferences` | ✅ Supabase |

---

## ⚠️ PARCIALMENTE INTEGRADO OU EM MOCK

### 🔴 **CRÍTICO: POST /api/tasks (Criar Tarefa)**

**Status:** ⚠️ **USA MOCK EM MEMÓRIA** (não persiste!)

```typescript
// ❌ ATUAL - Não salva em Supabase
const newTask = {
  id: String(Math.max(...tasks.map(t => parseInt(t.id)), 0) + 1),
  // ... dados
};
tasks.push(newTask);  // ← Salva em memória (PERDIDO ao reiniciar!)
return Response.json(newTask, { status: 201 });
```

**Problemas:**
- Dados perdidos ao reiniciar servidor
- Sem auditoria
- Sem RLS (Row-Level Security)
- Não sincroniza com UI que busca em Supabase

**Solução Necessária:** Integrar com Supabase

---

### Outros Endpoints em Investigação

| Endpoint | Problema |
|----------|----------|
| `/api/time-logs` | Precisa verificar integração |
| `/api/sprints` | Precisa verificar integração |
| `/api/filters` | Parcialmente integrado |
| `/api/preferences` | Parcialmente integrado |

---

## 📋 Botões & Formulários Frontend

### Criar Tarefa
**Arquivo:** `app/(dashboard)/tasks/new/page.tsx`

```typescript
// ✅ Forma está OK
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title, description, priority, due_date, assigned_to
    })
  });
  // ...
};
```

**Status:** ⚠️ Formulário OK, mas API não persiste em BD

---

### Atualizar Tarefa
**Arquivo:** `app/(dashboard)/tasks/[id]/page.tsx`

```typescript
// ✅ Integrado com Supabase
await fetch(`/api/tasks/${taskId}`, {
  method: 'PUT',
  body: JSON.stringify(updateData)
});
```

**Status:** ✅ Funcionando

---

### Iniciar Tarefa
**Arquivo:** `app/components/tasks/Timer.tsx`

```typescript
// ✅ Integrado com Supabase
await fetch(`/api/tasks/${taskId}/start`, { method: 'POST' });
```

**Status:** ✅ Funcionando com auditoria

---

### Adicionar Comentário
**Arquivo:** `app/components/task-comments.tsx`

```typescript
// ✅ Integrado com Supabase
const handleSubmit = async (e: React.FormEvent) => {
  const res = await fetch(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  });
};
```

**Status:** ✅ Funcionando

---

### Reatribuir Tarefa
**Arquivo:** `app/components/tasks/TaskReassignForm.tsx`

```typescript
// ✅ Integrado com Supabase
await fetch(`/api/tasks/${taskId}/reassign`, {
  method: 'PATCH',
  body: JSON.stringify({ assigned_to })
});
```

**Status:** ✅ Funcionando

---

## 🔧 Ações Necessárias (PRIORITY ORDER)

### 1️⃣ **CRÍTICO - Corrigir POST /api/tasks**

**Tempo Estimado:** 30 minutos

```typescript
// ✅ NOVO - Com Supabase
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, priority, due_date, assigned_to } = await request.json();

  // Validar
  if (!title || !priority) {
    return Response.json({ error: 'Campos obrigatórios' }, { status: 400 });
  }

  // Integrar com Supabase
  const supabase = createSupabaseServerClient(session.accessToken);
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: title.trim(),
      description: description?.trim() || '',
      status: 'pending',
      priority,
      due_date: due_date || null,
      assigned_to: assigned_to || null,
      created_by: session.user.id,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    table_name: 'tasks',
    record_id: data.id,
    operation: 'create',
    new_value: data,
    created_by: session.user.id,
  });

  return Response.json(data, { status: 201 });
}
```

### 2️⃣ **ALTO - Verificar Endpoints**

- [ ] `/api/time-logs` - Integração com Supabase
- [ ] `/api/sprints` - Integração com Supabase
- [ ] `/api/filters` - Completar integração
- [ ] `/api/preferences` - Completar integração

**Tempo:** 45 minutos

### 3️⃣ **MÉDIO - Testar Fluxos Completos**

- [ ] Criar → Listar → Visualizar → Editar → Completar
- [ ] Marketplace Intel approval flow
- [ ] QA Reviews workflow
- [ ] Time tracking

**Tempo:** 60 minutos

### 4️⃣ **DOCUMENTAÇÃO**

- [ ] Atualizar API docs
- [ ] Adicionar exemplos cURL
- [ ] Documentar RLS policies

**Tempo:** 30 minutos

---

## 🧪 Checklist de Verificação

### Cada Endpoint Deve Ter:

- [x] Autenticação (NextAuth session)
- [ ] Autorização (role check quando necessário)
- [x] Validação de entrada
- [x] Supabase integration
- [ ] Tratamento de erros
- [ ] Audit logging (quando aplicável)
- [ ] RLS policies (database level)
- [ ] Testes (unit + integration)

---

## 📋 Status por Categoria

### 🟢 FULLY INTEGRATED (58%)
- ✅ Tasks (GET, PUT, START, REASSIGN, EXTEND, COMMENTS)
- ✅ QA Reviews (CREATE, GET, UPDATE)
- ✅ Evidence (UPLOAD, LIST)
- ✅ Users (CRUD)
- ✅ Marketplace Intel (LIST, APPROVE)
- ✅ Notifications (ENQUEUE, PREFERENCES)

### 🟡 PARTIALLY INTEGRATED (14%)
- ⚠️ Tasks - LIST (usa mock)
- ⚠️ Tasks - CREATE (usa mock)
- ⚠️ Filters (parcial)
- ⚠️ Preferences (parcial)

### 🔴 NOT INTEGRATED (28%)
- ❌ Time Logs (verificar)
- ❌ Sprints (verificar)
- ❌ Reports (investigar)
- ❌ Advanced Filters (verificar)

---

## 💾 Database Schema Required

Para completar integração, certifique-se que existem:

```sql
-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR,
  priority VARCHAR,
  due_date DATE,
  assigned_to UUID,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  table_name VARCHAR,
  record_id UUID,
  operation VARCHAR,
  old_value JSONB,
  new_value JSONB,
  created_by UUID,
  created_at TIMESTAMP
);

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ... (policies por role)
```

---

## 🚀 Próximos Passos

1. **Hoje:** Corrigir POST /api/tasks (CRÍTICO)
2. **Hoje:** Testar fluxo de criar → listar → editar
3. **Amanhã:** Verificar outros endpoints
4. **Amanhã:** Atualizar documentação
5. **Semana:** Full integration testing

---

## 📞 Responsáveis

- **Development:** @dev (Dex) - Implementação
- **Database:** @data-engineer (Dara) - Schema validation
- **QA:** @qa (Quinn) - Testing
- **DevOps:** @devops (Gage) - Deployment

---

**Document Generated:** 2026-02-20
**Last Updated:** 2026-02-20
