# 🌐 Marketplace Master — Multi-Domain Setup

**Versão:** 1.0.0
**Status:** ✅ CONFIGURADO PARA AMBOS DOMÍNIOS
**Data:** Fevereiro 20, 2026

---

## 📋 Domínios Suportados

```
┌────────────────────────────────────────────────────────┐
│                   MARKETPLACE MASTER                    │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Domínio 1: marketplace.aios.local                     │
│  ├─ Tipo: INTERNO (Desenvolvimento/Admin)              │
│  ├─ Uso: Dashboard administrativo                      │
│  ├─ Acesso: Admin/Head apenas                          │
│  ├─ Agentes: Manual mode (controlado)                  │
│  └─ Database: Supabase compartilhado                   │
│                                                         │
│  Domínio 2: www.sellersops.com.br                      │
│  ├─ Tipo: PÚBLICO (Produção)                           │
│  ├─ Uso: Marketplace público para sellers              │
│  ├─ Acesso: Admin + Public users                       │
│  ├─ Agentes: Autonomous mode (auto-processing)         │
│  └─ Database: Supabase compartilhado                   │
│                                                         │
│  ✨ Ambos sincronizados em TEMPO REAL!                 │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Deploy marketplace.aios.local (Interno)

```bash
# Desenvolvimento local
npm run dev

# Deploy em staging/produção
./scripts/deploy-marketplace.sh production marketplace.aios.local

# ou com shorthand
./scripts/deploy-marketplace.sh production --domain=marketplace.aios.local
```

### Deploy www.sellersops.com.br (Público)

```bash
# Deploy em produção
./scripts/deploy-marketplace.sh production www.sellersops.com.br

# ou com shorthand
./scripts/deploy-marketplace.sh production --domain=www.sellersops.com.br
```

---

## 📁 Arquivos de Configuração

| Arquivo | Domínio | Propósito |
|---------|---------|-----------|
| `.env.local` | marketplace.aios.local | Configuração local (desenvolvimento) |
| `.env.sellersops` | www.sellersops.com.br | Configuração público/produção |
| `next.config.ts` | Ambos | Configuração Next.js unificada |
| `vercel.json` | Ambos | Configuração Vercel |
| `docs/MULTI-DOMAIN-SETUP.md` | Ambos | Guia detalhado de setup |

---

## 🔄 Sincronização de Dados

```
marketplace.aios.local
        ↓
   (Supabase)
        ↓
www.sellersops.com.br
```

**Sincronizado em tempo real:**
- ✅ Marketplace tasks
- ✅ Agent metrics
- ✅ User preferences
- ✅ Audit logs
- ✅ Approvals
- ✅ Completions

---

## 🔐 Domínio www.sellersops.com.br

### Pré-requisitos

1. **Domínio registrado** em registro de domínios
2. **Vercel project** criado
3. **DNS configurado** apontando para Vercel

### Setup DNS

Adicionar registro em seu registrador de domínios:

```
Type:  CNAME
Name:  www
Value: cname.vercel-dns.com.

ou

Type:  A
Name:  www
Value: 76.76.19.165
```

### Validar em Vercel

```bash
# Adicionar domínio
vercel domains add www.sellersops.com.br

# Verificar
vercel domains status www.sellersops.com.br

# Deploy
vercel deploy --prod
```

---

## 📊 Dashboard Unificado

Ambos domínios sincronizam dados automaticamente:

### Em marketplace.aios.local
```
Admin vê → Tasks criadas em AMBOS domínios
         → Agent metrics consolidadas
         → User activity de ambas interfaces
```

### Em www.sellersops.com.br
```
Public vê → Tasks aprovadas por admin
          → Agent metrics do marketplace
          → Suas próprias submissions
```

---

## 🔧 Variáveis de Ambiente

### marketplace.aios.local
```env
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_SECRET=skCpfyVc1JYbr6YtqSUeDpA44bcb7/n2HxFG/KcINMg=
```

### www.sellersops.com.br
```env
NEXTAUTH_URL=https://www.sellersops.com.br
NEXT_PUBLIC_API_URL=https://www.sellersops.com.br
NEXTAUTH_SECRET=your-sellersops-secret (diferente!)
```

**Nota:** Ambos usam a **mesma Supabase database** — não copicar keys!

---

## 🚀 Deployment Workflow

### Desenvolvimento

```bash
# 1. Testar localmente
npm run dev
# Ir para http://localhost:3000

# 2. Testar com ambos domínios
curl http://localhost:3000/api/health
curl http://localhost:3000/marketplace
```

### Staging

```bash
# 1. Deploy marketplace.aios.local
./scripts/deploy-marketplace.sh staging marketplace.aios.local

# 2. Testar em staging
curl https://marketplace.aios.local/api/health
```

### Produção

```bash
# 1. Deploy marketplace.aios.local
./scripts/deploy-marketplace.sh production marketplace.aios.local

# 2. Deploy www.sellersops.com.br
./scripts/deploy-marketplace.sh production www.sellersops.com.br

# 3. Validar ambos
curl https://marketplace.aios.local/api/health
curl https://www.sellersops.com.br/api/health
```

---

## 🔒 Segurança Multi-Domínio

### NextAuth Sessions
- Isoladas por domínio
- Cookies não compartilhados
- Secrets diferentes por domínio

### Database Access
- Supabase RLS policies ativas
- Permissões por role (admin/user)
- Dados sincronizados mas isolados por permissão

### CORS
- Configurado para ambos domínios
- Headers de segurança unificados

---

## 📈 Monitoramento

### Dashboards
- `/admin/monitoring/dashboard` — Ambos domínios
- `/admin/monitoring/agents` — Status consolidado
- `/admin/monitoring/real-time` — Live updates

### Alertas
- Alerta se um domínio fica offline
- Alerta se sincronização está lagging
- Notificações no Slack

---

## 🧪 Teste Multi-Domínio

### Teste Local
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Teste ambas rotas
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/orchestration/tasks

# Teste UI
# marketplace.aios.local (admin)
# www.sellersops.com.br (public)
```

### Teste Produção
```bash
# marketplace.aios.local
curl https://marketplace.aios.local/api/health

# www.sellersops.com.br
curl https://www.sellersops.com.br/api/health

# Ambos devem responder HTTP 200
```

---

## 🆘 Troubleshooting

### Domain not resolving
```bash
# Verificar DNS
dig www.sellersops.com.br
nslookup www.sellersops.com.br

# Verificar Vercel
vercel domains status www.sellersops.com.br
```

### SSL certificate issue
```bash
# Vercel gera automaticamente via Let's Encrypt
# Se não funcionar:
vercel domains remove www.sellersops.com.br
vercel domains add www.sellersops.com.br
```

### Sync issues
```bash
# Verificar Supabase connection
curl $NEXT_PUBLIC_SUPABASE_URL/auth/v1/health

# Verificar realtime
psql $DATABASE_URL -c "SELECT 1"
```

### Agent not creating tasks
```bash
# Testar agent token
curl -X POST https://www.sellersops.com.br/api/orchestration/tasks \
  -H "Authorization: Bearer $MARKETPLACE_AMAZON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"marketplace":"amazon","title":"Test"}'
```

---

## 📚 Documentação Completa

Veja `docs/MULTI-DOMAIN-SETUP.md` para:
- Migração de dados (se necessário)
- Configuração avançada
- Troubleshooting detalhado
- Checklists
- Diagrama de sincronização

---

## ✅ Checklist Setup

- [ ] `next.config.ts` atualizado
- [ ] `.env.sellersops` criado
- [ ] `vercel.json` criado
- [ ] DNS configurado em registrador
- [ ] Domínios validados em Vercel
- [ ] SSL funcionando (HTTPS)
- [ ] Environment vars em Vercel
- [ ] Ambos domínios respondendo
- [ ] Sincronização testada
- [ ] Agentes ativados
- [ ] Monitoring ativo
- [ ] Team notificado

---

## 🎯 Próximas Ações

```
✅ Configuração multi-domínio completa
 ↓
2️⃣ Deploy marketplace.aios.local
 ↓
3️⃣ Deploy www.sellersops.com.br
 ↓
4️⃣ Validar sincronização
 ↓
5️⃣ Ativar agentes em ambos
 ↓
6️⃣ Production GO LIVE
```

---

## 📞 Suporte

**Perguntas?**

- **Domínios/DNS:** @devops (Gage)
- **Vercel Setup:** @devops (Gage)
- **Sincronização:** @data-engineer (Dara)
- **Geral:** @aios-master (Orion)

---

**Status:** ✅ PRONTO PARA DEPLOYMENT
**Versão:** 1.0.0
**Última Atualização:** Fevereiro 20, 2026
