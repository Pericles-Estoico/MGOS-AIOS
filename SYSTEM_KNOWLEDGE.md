# SYSTEM_KNOWLEDGE.md
> Documento de conhecimento vivo do projeto MGOS-AIOS / SellersOps.
> Atualizado automaticamente a cada sessão de desenvolvimento.
> **Última atualização:** 2026-07-10 (v2)

---

## 1. Identidade do Projeto

| Campo | Valor |
|-------|-------|
| **Nome do projeto** | MGOS-AIOS (SellersOps) |
| **Domínio público** | `www.sellerops.com.br` |
| **Repositório GitHub** | `https://github.com/Pericles-Estoico/MGOS-AIOS` |
| **Branch principal** | `main` |
| **Node.js** | 24.x (Vercel default) |
| **Framework** | Next.js 16 App Router (`next@16.1.6`) |
| **Linguagem** | TypeScript |

---

## 2. Stack Técnico

### Frontend
- **Next.js 16** App Router — todas as páginas no grupo `app/(dashboard)/`
- **Tailwind CSS** — design system utilitário
- **Lucide React** — ícones
- **Recharts** — gráficos (PieChart, ResponsiveContainer)

### Backend / API
- **Next.js Route Handlers** — `app/api/**/*.ts` (server-side)
- **NextAuth.js v4** — autenticação JWT (`lib/auth.ts`)
  - Strategy: JWT (não session DB)
  - `session.user.id` vem de `token.sub`
  - Fallback de TEST_USERS para dev (admin@empresa.com / admin123)

### Banco de dados
- **Supabase PostgreSQL**
  - Project ref: `grxsyhmikuhqmffhipwt`
  - Project name: MGOS-AIOS
  - Org: `phkgeaaxermsqvyoeyxe`
- **Supabase client** criado via `createSupabaseServerClient()` em `lib/supabase.ts`
  - Usa `SUPABASE_SERVICE_ROLE_KEY` (ignora RLS) nas APIs
  - Sem FK em `auth.users` (removida na migration `20260706000001`)

### Deploy
- **Vercel** — projeto `mgos-aios-evqe` na org `pericles-projects-371fcf77`
- **Deploy**: `vercel --prod` → alias automático para `www.sellerops.com.br`
- **Variáveis de ambiente**: gerenciadas no dashboard Vercel (não no `.env` commitado)

---

## 3. Estrutura de Arquivos Principais

```
app/
├── (dashboard)/                 # Páginas autenticadas
│   ├── analytics/page.tsx       # Analytics de portfólio
│   ├── dashboard/page.tsx       # Dashboard principal
│   ├── fluxo-de-caixa/page.tsx  # Fluxo de caixa
│   ├── produtos/
│   │   ├── page.tsx             # Lista de produtos
│   │   ├── novo/page.tsx        # Criar produto
│   │   ├── comparar/page.tsx    # Comparativo de produtos
│   │   ├── import/page.tsx      # Importação CSV
│   │   └── [id]/
│   │       ├── page.tsx         # Detalhe do produto (Gantt + Financeiro)
│   │       ├── etapas/page.tsx  # Gerenciar etapas (com edição de datas reais)
│   │       └── custos/page.tsx  # Lançamentos de custo
│   └── tasks/, team/, marketplace/, qa-reviews/, ...
│
├── api/
│   └── mvp/
│       ├── alerts/route.ts          # GET: alertas do portfólio
│       ├── analytics/route.ts       # GET: top5, emRisco, statusDist, totais
│       ├── cashflow/route.ts        # GET: fluxo de caixa
│       ├── costs/
│       │   ├── route.ts             # GET + POST custos
│       │   └── [id]/route.ts        # DELETE custo
│       ├── products/
│       │   ├── route.ts             # GET (lista) + POST (criar)
│       │   └── [id]/
│       │       ├── route.ts         # GET (detalhe) + PATCH (editar)
│       │       └── duplicate/route.ts # POST: duplicar produto
│       ├── stages/
│       │   └── [id]/route.ts        # PATCH: iniciar/concluir/atualizar etapa
│       └── templates/route.ts       # GET: templates de etapas
│
├── components/
│   ├── layout/
│   │   ├── DashboardShell.tsx   # Shell com sidebar + header + AlertsBell
│   │   └── Sidebar.tsx          # Navegação principal com badges de alertas
│   └── mvp/
│       ├── AlertsBell.tsx       # Sino de alertas (polling 60s)
│       ├── FinanceiroDashboard.tsx # Dashboard financeiro com cálculo de margem
│       └── GanttChart.tsx       # Gráfico de Gantt das etapas
│
lib/
├── auth.ts      # NextAuth config + TEST_USERS fallback
└── supabase.ts  # Supabase client factory

supabase/
└── migrations/  # Histórico de migrations (ordenadas por timestamp)
```

---

## 4. Schema do Banco de Dados (Tabelas MVP)

### `mvp_products`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | ID único |
| `user_id` | uuid | FK para usuário (sem FK auth.users) |
| `nome` | text | Nome do produto |
| `categoria` | text | Categoria (camiseta, calca, etc.) |
| `canal_venda` | text | Canal (Shopee, Mercado Livre, etc.) |
| `quantidade` | int | Quantidade planejada |
| `status` | text | planejado / em_andamento / concluido / cancelado |
| `data_inicio_plan` | date | Data planejada de início |
| `preco_venda` | numeric | Preço de venda estimado |
| `taxa_canal` | numeric | Taxa do canal (%) |
| `prazo_repasse_dias` | int | Prazo de repasse em dias |
| `data_venda_estimada` | date | Data estimada de venda |

### `mvp_stages`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `product_id` | uuid FK | → mvp_products |
| `nome` | text | Nome da etapa |
| `ordem` | int | Ordem de exibição |
| `status` | text | planejada / em_andamento / concluida |
| `data_inicio_plan` / `data_fim_plan` | date | Datas planejadas |
| `data_inicio_real` / `data_fim_real` | date | Datas reais |
| `responsavel_id` | uuid | Quem iniciou a etapa |

### `mvp_costs`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `stage_id` | uuid FK | → mvp_stages |
| `tipo` | text | materia_prima / mao_de_obra / embalagem / frete / marketing / outros |
| `descricao` | text | Descrição livre |
| `valor_planejado` | numeric | Custo planejado |
| `valor_real` | numeric | Custo real lançado |

### `audit_logs`
- Registra mudanças em `mvp_stages`
- Ações: `STATUS_CHANGE`, `DATE_UPDATE`
- Campos: `entity_type`, `entity_id`, `action`, `old_values`, `new_values`, `changed_by`, `changed_at`

---

## 5. Bugs Corrigidos e Lições Aprendidas

### Bug crítico: Next.js 16 — `params` é uma Promise
**Symptoma:** GET `/api/mvp/products/[id]` retornava 404 mesmo com o produto existente.

**Causa raiz:** Next.js 15+ (inclusive 16) mudou `params` para ser uma `Promise`. O padrão antigo:
```typescript
// ERRADO — params.id é undefined (params é uma Promise!)
{ params }: { params: { id: string } }
```

**Correção obrigatória em TODAS as rotas dinâmicas:**
```typescript
// CORRETO
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // usar `id`, nunca `params.id`
}
```

**Arquivos corrigidos em 2026-07-07:**
- `app/api/mvp/products/[id]/route.ts`
- `app/api/mvp/products/[id]/duplicate/route.ts`
- `app/api/mvp/stages/[id]/route.ts`
- `app/api/mvp/costs/[id]/route.ts`

**Atenção:** Ao criar novas rotas dinâmicas, SEMPRE usar o padrão `params: Promise<{ id: string }>`.

---

## 6. Cadastro do Administrador Próprio

### Como cadastrar sua conta de admin (uma única vez)

1. **Acesse o Vercel** → projeto `mgos-aios-evqe` → Settings → Environment Variables
2. **Adicione** `SETUP_TOKEN` com um valor secreto de sua escolha (ex: `minha-senha-super-secreta-2026`)
3. **Faça um redeploy** (ou aguarde o próximo deploy automático)
4. **Acesse** `https://www.sellerops.com.br/setup`
5. **Preencha** o formulário com o Setup Token, seu nome, email e senha
6. **Após criar a conta**, remova a variável `SETUP_TOKEN` do Vercel para fechar o endpoint

### Como funciona a autenticação em produção

- `NODE_ENV=production` → TEST_USERS (admin@empresa.com etc.) são **desativados automaticamente**
- Apenas usuários criados no **Supabase Auth** conseguem fazer login
- Cada usuário tem `user_metadata.role` definindo seu nível de acesso: `admin`, `head`, `executor`, `qa`, `viewer`

### Gerenciar usuários adicionais

Após criar o admin inicial, novos usuários podem ser criados em:
- **Supabase Dashboard** → Auth → Users → Invite User

---

## 7. Regras de Deploy

### Fluxo padrão
```bash
# 1. Build local para verificar erros
npm run build

# 2. Commit
git add <arquivos>
git commit -m "tipo: descrição [Epic X.Y]"

# 3. Push GitHub
git push origin main

# 4. Deploy Vercel
vercel --prod

# 5. Alias (se necessário)
vercel alias <deployment-url> www.sellerops.com.br
```

### Variáveis de ambiente obrigatórias (Vercel)
| Variável | Descrição |
|----------|-----------|
| `NEXTAUTH_SECRET` | Segredo JWT do NextAuth |
| `NEXTAUTH_URL` | URL base (`https://www.sellerops.com.br`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (nunca exposta ao cliente) |

### IMPORTANTE — o que NÃO commitar
- `.env` — contém segredos reais
- `supabase/.temp/` — gerado pelo CLI localmente
- `.next/` — build local

---

## 8. Epics e Stories Implementadas

### Epic 1 — MVP Tracker (CONCLUÍDO)
- 1.1 Schema do banco + migrations
- 1.2 API de produtos (CRUD)
- 1.3 Lista de produtos com filtros
- 1.4 Criar produto com templates de etapas
- 1.5 Detalhe do produto com Gantt
- 1.6 Gerenciar etapas (iniciar/concluir)
- 1.7 Lançamentos de custo
- 1.8 Dashboard financeiro (FinanceiroDashboard)
- 1.9 Comparativo de produtos
- 1.10 Fluxo de caixa

### Epic 2 — Funcionalidades Avançadas (CONCLUÍDO)
- 2.1 Sistema de alertas (AlertsBell + `/api/mvp/alerts`)
- 2.2 Edição de datas reais nas etapas (ação `atualizar`)
- 2.3 Duplicar produto (`/api/mvp/products/[id]/duplicate`)
- 2.4 Analytics de portfólio (`/api/mvp/analytics` + página `/analytics`)

---

## 9. Referências Rápidas

### URLs de produção
- App: `https://www.sellerops.com.br`
- Supabase Dashboard: `https://supabase.com/dashboard/project/grxsyhmikuhqmffhipwt`
- Vercel Dashboard: `https://vercel.com/pericles-projects-371fcf77/mgos-aios-evqe`
- GitHub: `https://github.com/Pericles-Estoico/MGOS-AIOS`

### Comandos úteis
```bash
# Ver logs de produção
vercel logs www.sellerops.com.br --output raw | tail -50

# Listar deployments
vercel ls --prod

# Status local
npm run dev         # dev server na porta 3000
npm run build       # build de produção
npm run lint        # linting
npm run typecheck   # type check sem build
```

---

## 10. Histórico de Migrations Supabase

| Arquivo | Descrição |
|---------|-----------|
| `20260225_marketplace_tasks.sql` | Tasks do marketplace |
| `20260302000001_create_marketplace_subtasks.sql` | Subtasks |
| `20260302000002_fix_tasks_constraints.sql` | Fix constraints |
| `20260305000001_analytics_schema.sql` | Schema analytics |
| `20260305000002_products_listings_analyses.sql` | Listings e análises |
| `20260305000003_tasks_marketplace.sql` | Tasks marketplace v2 |
| `20260305000004_user_profiles_and_audit.sql` | Perfis e audit logs |
| `20260705000001_mvp_tracker_schema.sql` | Schema completo MVP |
| `20260705000002_mvp_financial_columns.sql` | Colunas financeiras |
| `20260706000001_drop_mvp_user_fk.sql` | Remove FK auth.users |

---

*Mantido pela equipe MGOS / Claude Code. Atualizar após cada sessão relevante de desenvolvimento.*
