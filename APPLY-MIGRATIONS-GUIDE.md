# 🚀 Aplicar Migrations ao Supabase

Como a API requer autenticação especial, vamos aplicar as migrations **manualmente via Supabase Studio**.

---

## 📋 Passo 1: Abrir Supabase Studio

1. Acesse: https://app.supabase.com/
2. Selecione seu projeto: `grxsyhmikuhqmffhipwt`
3. Clique em **SQL Editor** (menu esquerdo)

---

## 🔧 Passo 2: Executar Migrations em Ordem

Copie e execute cada migration **nesta ordem exata**:

### ✅ Fase 1: Schema Base (3 arquivos)

#### 1️⃣ `01-schema.sql`
```bash
# Copiar arquivo inteiro de: supabase/migrations/01-schema.sql
# Colar no SQL Editor → Clicar "RUN"
```
- Cria: users, tasks, evidence, qa_reviews, audit_logs, time_logs
- Tempo: ~2-3 segundos

#### 2️⃣ `02-rls-policies.sql`
```bash
# Copiar arquivo inteiro de: supabase/migrations/02-rls-policies.sql
# Colar no SQL Editor → Clicar "RUN"
```
- Ativa Row Level Security
- Tempo: ~1-2 segundos

#### 3️⃣ `03-triggers.sql`
```bash
# Copiar arquivo inteiro de: supabase/migrations/03-triggers.sql
# Colar no SQL Editor → Clicar "RUN"
```
- Cria triggers para audit trail
- Tempo: ~1-2 segundos

---

### 📊 Fase 2: Features Marketplace (18 arquivos)

Execute **na ordem** abaixo:

- [ ] `04-seed-data.sql`
- [ ] `20260218_create_comments_realtime.sql`
- [ ] `20260218_create_email_queue.sql`
- [ ] `20260218_create_notification_preferences.sql`
- [ ] `20260218_create_performance_indexes.sql`
- [ ] `20260218_create_qa_reviews.sql`
- [ ] `20260218_create_reassignment_history.sql`
- [ ] `20260218_create_reporting_system.sql`
- [ ] `20260218_create_saved_filters.sql`
- [ ] `20260218_create_search_index.sql`
- [ ] `20260218_create_sprints.sql`
- [ ] `20260219_marketplace_intel.sql`
- [ ] `20260219_marketplace_intel_rls.sql`
- [ ] `20260220_create_email_tables.sql`
- [ ] `20260222_add_role_mapping.sql`
- [ ] `20260222_extend_notification_preferences.sql`
- [ ] `20260222_marketplace_plans.sql`
- [ ] `20260223161331_marketplace_job_executions.sql`
- [ ] `20260223_agent_messages.sql`
- [ ] `20260223_marketplace_channels.sql`

---

### 🔄 Fase 3: Extensões (8 arquivos)

- [ ] `20260224_extend_users_table.sql`
- [ ] `20260225_marketplace_tasks.sql`
- [ ] `20260302_create_marketplace_subtasks.sql`
- [ ] `20260302_fix_tasks_constraints.sql`
- [ ] `20260305_analytics_schema.sql`
- [ ] `20260305_user_profiles_and_audit.sql`

---

## 📂 Como Acessar os Arquivos

```bash
# Pasta com as migrations:
C:\Users\finaa\Documents\GitHub\MGOS-AIOS\supabase\migrations\
```

---

## ✅ Verificar Se Funcionou

Após executar todas as migrations, execute este teste no SQL Editor:

```sql
-- Deve retornar 6 tabelas principais
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deve mostrar usuários de teste criados
SELECT COUNT(*) as user_count FROM public.users;

-- Deve mostrar RLS ativado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

---

## 🚨 Se Algo Der Errado

### Erro: "Permission denied"
- [ ] Verifique se está usando a **Service Role Key** (não a Anon Key)
- [ ] Recheck `.env.local` para credenciais corretas

### Erro: "Column does not exist"
- [ ] Verifique se executou as migrations **na ordem exata**
- [ ] Não pule nenhuma migration

### Erro: "Constraint violation"
- [ ] Uma migration dependia de outra não executada
- [ ] Execute novamente na ordem correta

---

## 📊 Resumo das Tabelas Criadas

| Tabela | Linhas | Propósito |
|--------|--------|----------|
| `users` | ~10 | Perfis de usuário com roles |
| `tasks` | ~100 | Tarefas a executar |
| `evidence` | ~200 | Evidências de conclusão |
| `qa_reviews` | ~50 | Decisões de QA |
| `audit_logs` | ~1000 | Histórico completo |
| `time_logs` | ~200 | Rastreamento de tempo |
| `marketplace_*` | ~500 | Dados de marketplaces |
| `notifications_*` | ~300 | Sistema de notificações |
| `email_*` | ~100 | Fila de emails |

---

## 🎯 Próximas Etapas

Após as migrations:

1. **Criar Storage Bucket** para evidências
2. **Configurar Authentication** (usuarios, roles)
3. **Testar RLS Policies**
4. **Integrar com Next.js**

---

**Tempo Total:** ~15-20 minutos para executar todas as 29 migrations

**Status:** Pronto para começar! 🚀
