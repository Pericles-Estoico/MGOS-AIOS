# SUMÁRIO DE BUGS DE INTEGRAÇÃO - MGOS-AIOS

## Análise Executada
- Data: 2026-02-24
- Escopo: Verificação de 6 categorias de bugs de integração
- Arquivos analisados: 54 imports + API routes + migrations

---

## 1. IMPORT PATH BUGS - CRÍTICO ✅

### Problema
**54 referências** a `@/lib/auth` encontradas no código, mas o arquivo REAL está em `app/lib/auth.ts`

### Root Cause
No `tsconfig.json`:
```json
"paths": {
  "@/*": ["./*"],        // INCORRETO: mapeia @ para root do projeto
  "@lib/*": ["./lib/*"]  // Alias separado existe
}
```

O alias `@/` mapeia para o **root do projeto** (`./*`), não para `app/`.

### Impacto
- **BLOQUEADOR:** 54 imports falhando silenciosamente
- Compilação TypeScript: ✓ Passa (Next.js resolution)
- Runtime: ✓ Funciona (Next.js alias compat layer)
- **Risco:** Se algum bundler ou ferramenta usar tsconfig.json rigorosamente, quebra

### Exemplos encontrados
```typescript
// ERRADO (54 vezes):
import { authOptions } from '@/lib/auth';
// Resoluciona para: /home/finaa/repos/MGOS-AIOS/lib/auth.ts (NÃO EXISTE)

// CORRETO seria:
import { authOptions } from '@/app/lib/auth';
// Resoluciona para: /home/finaa/repos/MGOS-AIOS/app/lib/auth.ts ✓ EXISTE
```

**Arquivos afetados** (5+ arquivos):
- `app/(dashboard)/layout.tsx:2`
- `app/api/tasks/search/route.ts:3`
- `app/api/tasks/presence/route.ts:3`
- `app/api/tasks/[id]/activity/route.ts:3`
- `app/api/tasks/[id]/reassign/route.ts:3`
- (49 mais...)

---

## 2. STATUS VALUES MISMATCH - ALTO ⚠️

### Problema
Código usa status values que **NÃO EXISTEM** no schema Supabase

### Schema Real (Migrations)
```sql
-- Status values definidos em colunas:
-- marketplace_plans.status: 'pending' | 'approved' | 'rejected'
-- tasks.status: (não há CHECK constraint, aceita qualquer valor)
```

### Valores Inválidos Encontrados
```typescript
// INVÁLIDO (usado 15+ vezes):
status: 'pending'              // Em marketplace_plans: OK
status: 'in_progress'          // ❌ Não existe em schema
status: 'submitted'            // ❌ Não existe em schema
status: 'awaiting_approval'    // ❌ Não existe em schema

// Arquivo: app/api/marketplace/tasks/[id]/route.ts
linha 21:    status: 'pending'            ❌
linha 97:    if (task.status === 'pending' && !task.admin_approved)  ❌
linha 99:    } else if (task.status === 'pending' && task.admin_approved)  ❌
linha 127:   status: marketplace_status as 'pending' | 'awaiting_approval' | ...  ❌
linha 208:   in_progress: { status: 'fazendo' }  ❌ Maps to 'fazendo' (não existe)

// Arquivo: app/api/marketplace/diagnostics/route.ts
linha 73:    pending: (tasks || []).filter(t => t.status === 'pending')  ❌
linha 74:    in_progress: (tasks || []).filter(t => t.status === 'in_progress')  ❌
```

### Impacto
- **MEDIUM:** Queries devolvem resultados inesperados
- Filtros por status falham silenciosamente
- Diagnósticos retornam contagens erradas
- Lógica de fluxo de aprovação quebrada

---

## 3. COLUNAS NÃO EXISTENTES - CRÍTICO ✅

### Problema
**33 referências** a colunas que EXISTEM (confirmadas na migração)

### Colunas Consultadas
```sql
-- Todas EXISTEM (confirmado em 20260219_marketplace_intel.sql):
✓ admin_approved       -- EXISTS
✓ source_type         -- EXISTS  
✓ ai_generated_at     -- EXISTS
✓ estimated_hours     -- EXISTS
✓ step_by_step        -- EXISTS
✓ ai_source_url       -- EXISTS
✓ ai_change_type      -- EXISTS
✓ channel             -- EXISTS
```

### Status
**✅ FALSO ALARME** - Todas as colunas existem conforme a migração.

**Exemplo onde são usadas (VÁLIDO):**
```typescript
// app/api/marketplace/tasks/[id]/route.ts:46
const { source_type, admin_approved, estimated_hours, ... } = task;  // ✓ OK

// app/api/marketplace-intel/tasks/route.ts:108
admin_approved: false,  // ✓ OK

// app/api/marketplace-intel/approve/[id]/route.ts:83
.eq('admin_approved', false)  // ✓ OK
```

---

## 4. PRIORITY VALUES - NENHUM ENCONTRADO ✅

### Resultado
`grep -rn "priority.*urgent|priority.*critical"` retornou **0 resultados**

**Status:** ✅ Sem problemas com priority values

---

## 5. VALOR DE STATUS = 'PENDING' E 'IN_PROGRESS' - ANÁLISE DETALHADA

### Padrão encontrado
O código usa dois sistemas de status em paralelo:

#### Sistema 1: marketplace_plans (Correto)
```
'pending' → 'approved' → 'rejected'
```
Schema: `20260222_marketplace_plans.sql` define exatamente isso.

#### Sistema 2: marketplace_tasks + diagnostics (Inconsistente)
```
'pending' → 'in_progress' → (undefined)
```
Usado em:
- `app/api/marketplace/tasks/[id]/route.ts` (8 vezes)
- `app/api/marketplace/diagnostics/route.ts` (6 vezes)

### Problema
Não há correspondência entre:
1. O que o código espera (`pending`, `in_progress`)
2. O que o schema define (não está claro para marketplace_tasks)
3. O que o banco realmente tem

---

## RESUMO FINAL

| Categoria | Severidade | Encontrados | Status |
|-----------|-----------|------------|--------|
| **1. Import Paths (@/lib/auth)** | CRÍTICO | 54 referências | ❌ BUGS |
| **2. Status Values** | ALTO | 15+ referências | ⚠️ CONFLITO |
| **3. Colunas não existentes** | CRÍTICO | 0 (falso alarme) | ✅ OK |
| **4. Priority Values** | - | 0 | ✅ OK |
| **5. TSConfig Alias** | MÉDIO | 1 problema | ⚠️ BUG |

---

## RECOMENDAÇÕES

### Imediato (BLOQUEADOR)
1. **Corrigir tsconfig.json:**
   ```json
   "paths": {
     "@/*": ["./app/*"],  // Aponta para app/, não root
     "@lib/*": ["./app/lib/*"]
   }
   ```

2. **Atualizar 54 imports de `@/lib/auth` para `@/app/lib/auth` ou `app/lib/auth`**

### Curto Prazo
3. **Mapear status values corretos** em marketplace_tasks
   - Decisão: usar `pending/approved/rejected` ou criar novo status type?
   - Documentar em schema

4. **Corrigir app/api/marketplace/diagnostics/route.ts:**
   - Linhas 73-74: status === 'pending' → correto
   - Linhas 73-74: status === 'in_progress' → verificar schema real

### Longo Prazo
5. **Unit tests para validação de imports** (evitar regressão)
6. **TypeScript path validation** no CI/CD
