# 🔧 QA Fix Execution Guide

**Created By:** ✅ Quinn (QA Engineer)
**Date:** 2026-02-22
**Status:** Awaiting @dev execution

---

## 📋 Task Queue

5 tasks criadas para @dev fixar. Ordem recomendada de execução:

### **Task #2 - PRIMEIRO (5 min)** 🔴 CRÍTICO
```
Fix TypeScript build error in filters API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Arquivo: app/api/filters/[id]/route.ts:43
Erro:    Type error - Property 'user' does not exist
Impacto: Build quebrado
Status:  🔴 BLOCKING

@dev steps:
1. Abrir app/api/filters/[id]/route.ts
2. Linha 43: Adicionar type guard para session.user
3. Importar tipos corretos
4. Testar: npm run build
```

---

### **Task #3 - SEGUNDO (20 min)** 🟠 HIGH
```
Fix 'any' types in API routes (12+ occurrences)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Arquivos: Múltiplos em app/api/**
Problema: Tipos genéricos 'any' sem type safety
Impacto:  Perda de segurança de tipos

@dev steps:
1. Abrir app/api/reports/generate/route.ts (12 erros)
2. Substituir 'any' por tipos corretos:
   - request: any → NextRequest
   - response: any → Response
   - data: any → Record<string, unknown>
3. Repetir em outros arquivos
4. Testar: npm run lint
```

---

### **Task #4 - TERCEIRO (10 min)** 🟡 MEDIUM
```
Remove unused imports and variables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9 imports não usados
9 variáveis não usadas
Impacto:  Code cleanliness

@dev steps:
1. Remover imports não usados (use ESLint como guia)
2. Remover variáveis não usadas
3. Se alguma for necessária, usar (_) para prefixo
4. Testar: npm run lint
```

---

### **Task #5 - QUARTO (5 min)** 🟡 MEDIUM
```
Fix React Hook useEffect dependencies
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Arquivo: app/(dashboard)/tasks/[id]/page.tsx:145
Problema: 'task' não está em dependency array
Impacto:  Comportamento inesperado

@dev steps:
1. Abrir app/(dashboard)/tasks/[id]/page.tsx
2. Linha 145: Adicionar 'task' à dependency array
3. Testar: npm run lint
```

---

### **Task #6 - QUINTO (5 min)** 🟡 LOW
```
Update ESLint configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Arquivo: eslint.config.mjs
Problema: .eslintignore deprecated
Impacto:  Warning durante lint

@dev steps:
1. Remover ou backup .eslintignore
2. Validar eslint.config.mjs já tem ignores
3. Testar: npm run lint (sem warnings)
```

---

## 🎯 Execution Workflow

```
START
  ↓
[Task #2] Fix Build Error (5 min)
  ↓
  npm run build ✓ MUST PASS
  ↓
[Task #3] Fix 'any' Types (20 min)
  ↓
  npm run lint ✓
  ↓
[Task #4] Remove Unused (10 min)
  ↓
  npm run lint ✓
  ↓
[Task #5] Fix React Hooks (5 min)
  ↓
  npm run lint ✓
  ↓
[Task #6] Update ESLint Config (5 min)
  ↓
  npm run lint ✓ NO WARNINGS
  ↓
[Task #7] QA Re-Audit (30 min) ← Quinn executa
  ↓
npm run build   ✓
npm run lint    ✓
npm test        ✓
Dashboard UI    ✓
  ↓
DECISION: PASS/FAIL/CONCERNS
  ↓
If PASS → Ready to merge ✅
If FAIL → Back to @dev
END
```

---

## ⏱️ Timeline Estimada

| Task | Time | Status |
|------|------|--------|
| #2 Build Error | 5 min | 🔴 BLOCKING |
| #3 Any Types | 20 min | ⏳ Pending |
| #4 Unused | 10 min | ⏳ Pending |
| #5 React Hooks | 5 min | ⏳ Pending |
| #6 ESLint | 5 min | ⏳ Pending |
| **Subtotal** | **45 min** | |
| #7 Re-Audit | 30 min | ⏳ Quinn |
| **TOTAL** | **75 min** | |

---

## ✅ Success Criteria

All tasks completed when:

```
✅ npm run build     → No errors
✅ npm run lint      → No errors, minimal warnings
✅ npm run test      → All tests pass
✅ Dashboard         → All buttons functional
✅ Deploy scripts    → Still working
✅ Monitoring        → Still working
```

---

## 📞 Communication

**@dev should:**
1. Start Task #2 immediately (build blocker)
2. Mark tasks as in_progress when starting
3. Commit fixes with descriptive messages
4. Mark tasks as completed when done
5. Notify Quinn when all 5 tasks are done

**@qa (Quinn) will:**
1. Monitor task progress
2. Run re-audit (Task #7) after all fixes
3. Provide PASS/FAIL/CONCERNS decision
4. Approve or request additional fixes

---

## 🚀 Ready to Start?

@dev - Tasks #2-#6 são suas! 💪

Comece com Task #2 (build error) - é o mais crítico!

Good luck! 🎯
