# Produto: Digital TaskOps (Marketing / Marketplace / Ecommerce)

## Objetivo
Criar um app interno para gerenciamento de tarefas do time digital (marketing, marketplaces e ecommerce) com:
- comprovação obrigatória de execução (print/link)
- auditoria (quem fez, quando fez, quem aprovou)
- qualidade via QA Gate (aprovação antes de concluir)
- integração com WhatsApp para rotina diária e cobranças automáticas

## Usuários & Papéis
- CEO/Admin: cria squads, regras, templates, vê dashboards
- Head Marketing: cria tarefas/planeja, aprova entregas, cobra execução
- Executor (analista): executa tarefas, envia prova (print/link), comenta
- QA (pode ser o Head ou papel separado): valida evidência e aprova/reprova

## Escopo MVP (obrigatório)
1. Autenticação e RBAC (Admin / Head / Executor / QA)
2. Cadastro de “Frentes” (ex: Conteúdo, Ads, Marketplace, Cadastro de Produto, Relatórios)
3. Tarefas com:
   - título, descrição, checklist, prioridade, responsável, due date + hora
   - status: A Fazer → Fazendo → Enviado p/ QA → Aprovado → Concluído
   - evidências: upload de imagem (print), campo link, comentário
   - timestamps automáticos e audit log
4. QA Gate:
   - Aprovar / Reprovar com motivo
   - Reprovação devolve para “Fazendo”
5. Dashboard MVP:
   - tarefas por status
   - atrasadas
   - pendentes de QA
   - throughput por pessoa
6. WhatsApp (MVP):
   - lembrete diário com tarefas do dia (por usuário)
   - comando simples de resposta (ex: “OK”, “ENVIEI”, “LINK: …”)
   - notificação quando tarefa for aprovada/reprovada

## V1 (depois do MVP)
- Templates de tarefa por frente (biblioteca)
- SLAs e alertas automáticos (ex: 2h antes do prazo)
- Relatórios semanais automáticos no WhatsApp (resumo por frente)
- Upload múltiplo de evidências + histórico
- Integração opcional com ClickUp (espelhamento) — não obrigatório

## Regras de negócio (não-negociáveis)
- Nenhuma tarefa conclui sem evidência (print ou link)
- Toda entrega passa por QA Gate
- Evidência tem data/hora e usuário gravados (auditável)
- Tudo tem responsável e prazo; se não tiver, não cria tarefa

## Métricas de sucesso
- % tarefas concluídas com evidência
- lead time (criada → aprovada)
- % atrasos por frente
- tempo médio em QA
- reincidência de reprovação

## Stack sugerida
- Next.js
- Supabase (Auth + DB + Storage)
- WhatsApp: Meta Cloud API ou Twilio (decidir depois)
- Logs: tabela de audit + storage de evidências

## Entregáveis que o AIOS deve gerar
- PRD completo (v4) em docs/prd.md e shards em docs/prd/
- Epics (MVP e V1)
- Stories detalhadas por epic (critério de aceite + casos de borda)
- Arquitetura inicial (docs/architecture.md + shards)
- Checklist de PM e checklist de QA aplicados ao PRD

## Modelo de Tarefa (MVP)

### Briefing / Pesquisa (Entrada)
- Contexto
- Objetivo / Definição de pronto
- Links de referência (lista)
- Checklist
- Anexos (opcional)

### Evidência (Saída)
- Evidência obrigatória: Upload (imagem/arquivo) OU URL do print
- Comentário do executor
- Timestamp + usuário (auditável)

### QA Gate
- Aprovar / Reprovar
- Motivo obrigatório ao reprovar
- Reprovação volta para "Fazendo"
- Métricas: tempo em QA, reincidência de reprovação

### Auditoria (sempre ativa)
- Log automático: mudanças de status, uploads, aprovações/reprovações
