# MGOS — Produto MVP Tracker: Brownfield Enhancement PRD

**Versão:** 3.0
**Data:** 2026-07-03
**Status:** Aprovado — Pronto para Development
**Agente:** Morgan (PM) via AIOX Brownfield PRD Workflow
**Público:** Tech Leads, @dev, @architect, @sm

---

## Histórico de Versões

| Versão | Data | Descrição | Autor |
|--------|------|-----------|-------|
| 1.0 | 2026-02-23 | PRD inicial — plataforma de marketplace | Morgan |
| 2.0 | 2026-02-23 | Expansão — Epic 2, 3, 4 | Morgan |
| 3.0 | 2026-07-03 | Restart — foco em Produto MVP Tracker | Morgan (AIOX) |

---

## 1. Análise e Contexto do Projeto

### 1.1 Fonte de Análise

Análise IDE-based a partir do repositório `https://github.com/Pericles-Estoico/MGOS-AIOS.git`.

### 1.2 Estado Atual

**MGOS-AIOS** (Marketplace Growth Orchestrated System) é uma plataforma de orquestração de tarefas com IA para operações em marketplaces.

| Aspecto | Estado |
|---------|--------|
| Stack | Next.js 16 + Supabase + NextAuth + Anthropic AI SDK + BullMQ/Redis |
| Deploy | Vercel (produção ativa) |
| Banco | PostgreSQL Supabase — 12 tabelas principais |
| Epics completos | 1, 2, 3 |
| Em planejamento (depriorizados) | Epic 4 (features avançadas) + Epic 5 (produtos/listings) |
| Auth | NextAuth.js 4.x + Supabase Auth |

### 1.3 Tipo de Enhancement

**Restart Estruturado:** Manter infraestrutura existente (auth, roles, audit logs, deploy) e adicionar nova funcionalidade core — o Produto MVP Tracker.

| Tipo | Aplica? |
|------|---------|
| ✅ Nova Feature | Sim — Produto MVP Tracker (Gantt + Custos) |
| ✅ UI/UX | Sim — nova seção no dashboard |
| ⏸️ Marketplace Integrations | Depriorizadas para versão futura |
| ⏸️ Epic 4/5 anteriores | Suspensos — revisão futura |

**Impacto no codebase:** Moderado — novas tabelas, novos componentes, nova seção no dashboard. Sistema existente permanece intacto.

### 1.4 Objetivos

- Permitir rastrear o ciclo completo de produção de uma peça — do insumo ao recebimento da venda
- Dar visibilidade financeira completa: custo por etapa, margem, lucro estimado
- Oferecer Gantt visual com planejado vs real, por produto
- Suportar múltiplas categorias de produto com templates de etapas pré-configurados

### 1.5 Contexto

O negócio é confecção de vestuário para venda em marketplaces. A lacuna atual é a ausência de uma ferramenta que mostre, de forma integrada, quanto custa e quanto tempo leva produzir cada peça — desde a matéria-prima até o dinheiro efetivamente recebido após o prazo de repasse do marketplace.

---

## 2. Requisitos

### 2.1 Requisitos Funcionais

**FR1 — Cadastro de Produto MVP**
Criar um produto com: nome, categoria, canal de venda, data de início planejada, quantidade planejada. Ao selecionar a categoria, etapas padrão são pré-carregadas automaticamente.

**FR2 — Templates de Etapas por Categoria**
Cada categoria possui um conjunto de etapas padrão configuradas. Categorias suportadas: camiseta/blusa, calça/short, vestido/saia, conjunto, moda infantil, jaqueta/agasalho, acessórios. As etapas podem ser adicionadas, removidas ou reordenadas por produto.

**FR3 — Gantt Interativo**
Visualização em Gantt com todas as etapas do produto na linha do tempo. Barras coloridas por status. Linha vermelha "hoje". Tooltip com datas, custo acumulado e responsável. Zoom por semana/mês.

**FR4 — Centro de Custo por Etapa**
Cada etapa aceita múltiplos lançamentos de custo com tipo categorizado: matéria-prima, mão de obra, terceirização, logística, embalagem, marketing, taxas de marketplace. Cada lançamento tem valor planejado (orçamento) e valor real (executado).

**FR5 — Resumo Financeiro por Produto**
Painel com: custo total planejado vs real, preço de venda estimado, taxa do canal, receita líquida, lucro estimado, margem %, prazo de repasse (D+X dias), data estimada de recebimento.

**FR6 — Multi-Categoria**
Sistema suporta múltiplas categorias simultaneamente. Cada categoria tem seu template de etapas independente.

**FR7 — Rastreamento de Status por Etapa**
Status: Planejada → Em Andamento → Concluída. Registro de data real e responsável em cada transição. Etapa marcada como Atrasada automaticamente quando prazo passa sem conclusão.

**FR8 — Alertas de Desvio**
Alerta visual quando etapa está atrasada, ou quando custo real supera orçado em mais de 15%.

**FR9 — Comparativo Planejado vs Real**
Visão por produto mostrando: delta de datas (atraso em dias) e delta de custos (desvio em R$ e %) por etapa e total.

**FR10 — Dashboard Geral**
Visão consolidada de todos os produtos ativos: status geral, % concluído, custo acumulado, próxima etapa crítica, data estimada de recebimento. Filtros por categoria, status e canal.

### 2.2 Requisitos Não-Funcionais

**NFR1 — Performance:** Gantt com até 50 etapas renderiza em < 2s.

**NFR2 — Mobile-friendly:** Dashboard geral e lançamento de custos funcionais em mobile (telas ≥ 375px).

**NFR3 — Compatibilidade:** Manter autenticação (NextAuth + Supabase), sistema de roles e audit logs existentes sem modificação.

**NFR4 — Integridade de Dados:** Migrations aplicadas sem impacto no schema existente (tabelas novas isoladas com prefixo `mvp_`).

### 2.3 Requisitos de Compatibilidade

**CR1 — Auth:** Sistema de login existente (NextAuth) não é alterado.
**CR2 — Schema:** Novas tabelas com prefixo `mvp_` não conflitam com tabelas existentes.
**CR3 — UI:** Novo módulo segue design system existente (Tailwind + shadcn/ui + Radix UI).
**CR4 — Deploy:** Pipeline Vercel existente sem modificação.

---

## 3. Interface — Objetivos de Enhancement

### 3.1 Integração com UI Existente

Nova seção **"Produtos"** no menu lateral do dashboard. Segue padrão visual existente: Tailwind + shadcn/ui + Radix UI. Reutiliza componentes de tabela, modal e formulário já existentes.

### 3.2 Telas Novas

| Tela | Descrição |
|------|-----------|
| `/produtos` | Dashboard geral — lista de produtos ativos |
| `/produtos/novo` | Formulário de cadastro com seleção de categoria e etapas |
| `/produtos/[id]` | Detalhe do produto — Gantt + Custos + Resumo Financeiro |
| `/produtos/[id]/etapas` | Gestão de etapas e status |
| `/produtos/[id]/custos` | Lançamento e histórico de custos por etapa |

### 3.3 Consistência Visual

- Componentes shadcn/ui para formulários, cards e tabelas
- Biblioteca Recharts (já instalada) para gráfico financeiro
- Gantt: implementação customizada com Tailwind ou `@dhx/trial-gantt` / `react-gantt-task`
- Cores de status: cinza (planejado), azul (em andamento), verde (concluído), vermelho (atrasado)

---

## 4. Restrições Técnicas e Integração

### 4.1 Stack Existente

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Next.js | 16.1.6 |
| React | React | 19.2.3 |
| UI | shadcn/ui + Radix UI + Tailwind | latest |
| Charts | Recharts | ^3.7.0 |
| Backend | Next.js API Routes | — |
| Auth | NextAuth.js | ^4.24.13 |
| Database | PostgreSQL via Supabase | — |
| ORM | @supabase/supabase-js | ^2.95.3 |
| Deploy | Vercel | — |
| AI | @anthropic-ai/sdk | ^0.78.0 |

### 4.2 Estratégia de Integração

| Camada | Estratégia |
|--------|-----------|
| Database | Novas tabelas com prefixo `mvp_` via Supabase migrations |
| API | Novas rotas em `/api/mvp/` seguindo padrão existente |
| Frontend | Nova seção `/produtos` no App Router |
| Auth | Reutilizar `getServerSession()` existente |

### 4.3 Organização de Código

| Aspecto | Padrão |
|---------|--------|
| Estrutura | App Router (`app/(dashboard)/produtos/`) |
| Componentes | `components/mvp/` |
| API Routes | `app/api/mvp/` |
| Nomenclatura | kebab-case arquivos, PascalCase componentes |
| Imports | Absolutos via `@/` |

### 4.4 Deploy e Operações

| Aspecto | Estratégia |
|---------|-----------|
| Build | Sem alteração no pipeline Vercel |
| Migrations | Via Supabase CLI (`supabase db push`) |
| Config | Sem novas variáveis de ambiente necessárias |
| Monitoramento | Logs existentes (Pino) |

### 4.5 Avaliação de Riscos

| Risco | Nível | Mitigação |
|-------|-------|-----------|
| Conflito de schema | Baixo | Prefixo `mvp_` em todas as tabelas |
| Performance do Gantt | Médio | Virtualização, lazy load, zoom limitado |
| Complexidade da UI | Médio | Gantt simples primeiro, evoluir iterativamente |
| Dívida técnica existente | Baixo | Módulo novo isolado, não toca código legado |

---

## 5. Estrutura de Epic e Stories

**Decisão:** Epic único — feature coesa e sequencial. Stories ordenadas para minimizar risco ao sistema existente e maximizar valor entregue a cada iteração.

---

## Epic 1 — Produto MVP Tracker

**Goal:** Gestores acompanham o ciclo completo de produção de confecção — do insumo ao recebimento — com Gantt visual e centro de custo por etapa.

**Integration Requirements:** Autenticação, roles e audit logs existentes reutilizados sem modificação. Novas tabelas isoladas com prefixo `mvp_`.

---

### Story 1.1 — Schema do Banco de Dados

*Como desenvolvedor, quero criar as tabelas do MVP Tracker no Supabase, para que o sistema tenha estrutura para armazenar produtos, etapas e custos.*

**Acceptance Criteria:**
1. Tabela `mvp_products` criada: id, user_id, nome, categoria, canal_venda, quantidade, data_inicio_plan, status, created_at
2. Tabela `mvp_stages` criada: id, product_id, nome, ordem, data_inicio_plan, data_fim_plan, data_inicio_real, data_fim_real, status, responsavel_id
3. Tabela `mvp_costs` criada: id, stage_id, tipo, descricao, valor_planejado, valor_real, data_lancamento, created_by
4. Tabela `mvp_category_templates` criada: id, categoria, stages em JSONB
5. RLS policies aplicadas em todas as tabelas (usuário acessa apenas seus produtos)
6. Seed com templates padrão para 7 categorias (camiseta, calça, vestido, conjunto, moda infantil, jaqueta, acessório)
7. Migration aplicada sem erros; schema existente intacto

**Integration Verification:**
- IV1: Tabelas existentes não foram alteradas (verificar via `supabase db diff`)
- IV2: Auth existente funciona após migration
- IV3: RLS impede acesso cross-user nos testes

---

### Story 1.2 — Cadastro de Produto e Templates de Categoria

*Como gestor, quero cadastrar um produto e ter as etapas pré-preenchidas pela categoria selecionada, para não precisar criar tudo do zero.*

**Acceptance Criteria:**
1. Rota `/produtos/novo` com formulário funcional
2. Campos: nome, categoria (dropdown), canal de venda, quantidade, data de início planejada
3. Ao selecionar categoria, etapas padrão carregam com datas sugeridas sequenciais
4. Etapas editáveis antes de salvar: reordenar, adicionar, remover
5. Produto salvo aparece em `/produtos` na listagem geral
6. Validação: campos obrigatórios, feedback de erro claro

**Integration Verification:**
- IV1: Formulário usa autenticação existente (user_id do produto = usuário logado)
- IV2: Listagem de tarefas existente não impactada
- IV3: Navegação do dashboard existente funciona normalmente

---

### Story 1.3 — Gestão de Etapas e Status

*Como operador, quero avançar o status de cada etapa, para que o time saiba o que está em andamento e o que foi concluído.*

**Acceptance Criteria:**
1. Página `/produtos/[id]/etapas` lista todas as etapas com status visual
2. Botões de transição: Iniciar (Planejada → Em Andamento), Concluir (Em Andamento → Concluída)
3. Ao concluir: registra data real e usuário responsável
4. Etapa marcada automaticamente como Atrasada quando data_fim_plan passa sem conclusão (job ou verificação no carregamento)
5. Histórico de transições visível por etapa
6. Status geral do produto calculado automaticamente (% etapas concluídas)

**Integration Verification:**
- IV1: Sistema de roles existente respeitado
- IV2: Audit logs existentes registram as transições de status
- IV3: Lista de 50 etapas carrega em < 1s

---

### Story 1.4 — Lançamento de Custos por Etapa

*Como financeiro, quero lançar custos planejados e reais em cada etapa, para ter um centro de custo completo por produto.*

**Acceptance Criteria:**
1. Página `/produtos/[id]/custos` com lançamentos agrupados por etapa
2. Tipos de custo: matéria-prima, mão de obra, terceirização, logística, embalagem, marketing, taxas marketplace
3. Cada lançamento: tipo, descrição, valor planejado, valor real, data
4. Totais automáticos por etapa (planejado vs real) e por produto (total acumulado)
5. Badge de alerta vermelho quando custo real > planejado em mais de 15%
6. Histórico de lançamentos com data e responsável

**Integration Verification:**
- IV1: Lançamentos associados ao usuário logado via `created_by`
- IV2: RLS impede acesso a custos de outros usuários
- IV3: Schema existente não impactado

---

### Story 1.5 — Gantt Interativo

*Como gestor, quero visualizar o ciclo do produto em um Gantt, para enxergar planejado vs real na linha do tempo de forma visual.*

**Acceptance Criteria:**
1. Gantt disponível em `/produtos/[id]` como seção principal
2. Cada linha = uma etapa. Colunas = dias/semanas na linha do tempo
3. Barra cinza = planejado; cores por status: azul (em andamento), verde (concluído), vermelho (atrasado)
4. Linha vermelha vertical marcando data de hoje
5. Tooltip ao passar o mouse: datas planejadas/reais, custo acumulado da etapa, responsável, status
6. Zoom: visão semanal e mensal
7. Renderiza em < 2s com até 50 etapas
8. Scroll horizontal em mobile

**Integration Verification:**
- IV1: Dados do Gantt vêm apenas das tabelas `mvp_*`, sem queries ao schema legado
- IV2: Design system existente (Tailwind + shadcn/ui) aplicado
- IV3: Nenhuma dependência nova de tamanho > 100KB sem aprovação do @architect

---

### Story 1.6 — Dashboard Financeiro por Produto

*Como gestor, quero ver o resumo financeiro completo de um produto, para saber custo total, margem e quando o dinheiro entra.*

**Acceptance Criteria:**
1. Painel financeiro em `/produtos/[id]` com: custo total planejado, custo total real, desvio (R$ e %)
2. Campo editável: preço de venda estimado por unidade
3. Campo editável: taxa do canal em % (comissão + encargos)
4. Cálculo automático: receita bruta, receita líquida (após taxa), custo total, lucro estimado, margem %
5. Campo editável: prazo de repasse do canal em dias (D+X)
6. Data estimada de recebimento = data venda estimada + D+X dias
7. Gráfico de barras (Recharts): custo por tipo de despesa (pizza ou barras empilhadas)

**Integration Verification:**
- IV1: Recharts já instalado — não adicionar nova dependência de charts
- IV2: Página carrega em < 2s
- IV3: Cálculos validados com margem típica de confecção (custo ~40-60% do preço)

---

### Story 1.7 — Dashboard Geral de Produtos

*Como gestor, quero ver todos os produtos em um painel único, para ter visão completa do portfólio de produção.*

**Acceptance Criteria:**
1. Rota `/produtos` com cards ou tabela de todos os produtos do usuário logado
2. Por produto: nome, categoria, canal, status geral, % concluído, custo acumulado, data estimada de recebimento
3. Badge de alerta: vermelho (atrasado), laranja (acima do orçamento)
4. Filtros: por categoria, status (planejado / em produção / concluído / atrasado), canal de venda
5. Ordenação: por data de início, custo acumulado, % concluído
6. Acesso rápido ao Gantt e ao dashboard financeiro de cada produto
7. Estado vazio com CTA claro para criar primeiro produto

**Integration Verification:**
- IV1: Menu lateral existente recebe novo item "Produtos" sem quebrar itens existentes
- IV2: Usuário vê apenas seus próprios produtos (RLS)
- IV3: Dashboard de tarefas existente continua funcional e sem regressões

---

## 6. Fora do Escopo (MVP v3.0)

| Item | Motivo |
|------|--------|
| Integração com APIs de marketplaces | Complexidade prematura — v4.0 |
| Epic 4 — Notificações avançadas | Suspenso — revisar após MVP Tracker |
| Epic 5 — Produtos/Listings (versão anterior) | Substituído por esta nova abordagem |
| Relatórios PDF/CSV | Pós-MVP — Story 1.8 futura |
| Comparativo entre produtos | Pós-MVP — Story 1.9 futura |
| Previsão de fluxo de caixa consolidado | Pós-MVP — Story 1.10 futura |
| BullMQ/Redis (Stories 4.1-4.2) | Avaliar necessidade real antes de implementar |

---

## 7. Próximos Passos

| Passo | Agente | Comando |
|-------|--------|---------|
| Criar story files individuais | @sm | `*create-next-story` |
| Validar cada story (checklist 10 pontos) | @po | `*validate-story-draft` |
| Revisar decisão de biblioteca Gantt | @architect | — |
| Revisar DDL das tabelas `mvp_*` | @data-engineer | — |
| Iniciar implementação | @dev | Story 1.1 primeiro |

---

*PRD gerado por Morgan (AIOX PM Agent) — MGOS Brownfield Enhancement v3.0*
*Story-Driven Development: 7 stories prontas para criação pelo @sm*
