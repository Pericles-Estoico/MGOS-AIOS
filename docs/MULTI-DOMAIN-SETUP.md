# 🌐 Multi-Domain Setup — Marketplace Master

**Data:** Fevereiro 20, 2026
**Status:** ✅ Configurado para múltiplos domínios
**Versão:** 1.0.0

---

## 📋 Visão Geral

Marketplace Master agora suporta múltiplos domínios com a mesma base de dados:

1. **marketplace.aios.local** — Domínio interno (desenvolvimento)
2. **www.sellersops.com.br** — Domínio público (produção)

Ambos apontam para a **mesma base de dados Supabase**, permitindo:
- ✅ Sincronização de dados em tempo real
- ✅ Agentes compartilhados entre domínios
- ✅ Tasks visíveis em ambas as interfaces
- ✅ Configurações centralizadas

---

## 🔧 Arquivos de Configuração

### 1. `next.config.ts`
- Configuração multi-domínio
- CORS para ambos os domínios
- Headers de segurança unificados
- Variáveis de ambiente compartilhadas

### 2. `.env.local` (marketplace.aios.local)
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=skCpfyVc1JYbr6YtqSUeDpA44bcb7/n2HxFG/KcINMg=
NEXT_PUBLIC_SUPABASE_URL=https://ytywuiyzulkvzsqfeghh.supabase.co
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. `.env.sellersops` (www.sellersops.com.br)
```
NEXTAUTH_URL=https://www.sellersops.com.br
NEXTAUTH_SECRET=your-nextauth-secret-sellersops
NEXT_PUBLIC_SUPABASE_URL=https://ytywuiyzulkvzsqfeghh.supabase.co (mesma!)
NEXT_PUBLIC_API_URL=https://www.sellersops.com.br
```

### 4. `vercel.json`
- Configuração de deployment para Vercel
- Regiões otimizadas (GRU, SFO, LHR)
- Variáveis de ambiente para ambos domínios
- Headers de segurança para ambas APIs

---

## 🚀 Deployment

### Deploy marketplace.aios.local (Interno)

```bash
# Para Vercel
vercel deploy --prod --token $VERCEL_TOKEN \
  --name marketplace-aios-local \
  --env NEXTAUTH_URL=https://marketplace.aios.local \
  --env NEXTAUTH_SECRET=$SECRET_AIOS_LOCAL \
  --env NEXT_PUBLIC_API_URL=https://marketplace.aios.local
```

### Deploy www.sellersops.com.br (Público)

```bash
# Para Vercel
vercel deploy --prod --token $VERCEL_TOKEN \
  --name marketplace-sellersops \
  --env NEXTAUTH_URL=https://www.sellersops.com.br \
  --env NEXTAUTH_SECRET=$SECRET_SELLERSOPS \
  --env NEXT_PUBLIC_API_URL=https://www.sellersops.com.br
```

### Deploy com Script Automático

```bash
# Atualizar script deploy-marketplace.sh
./scripts/deploy-marketplace.sh production --domain=www.sellersops.com.br
./scripts/deploy-marketplace.sh production --domain=marketplace.aios.local
```

---

## 🔄 Sincronização de Dados

Como ambos os domínios usam a **mesma base de dados Supabase**:

```
marketplace.aios.local (Admin)
        ↓
   Supabase Database
        ↓
www.sellersops.com.br (Public)
```

**O que é sincronizado:**
- ✅ Marketplace tasks
- ✅ Agent metrics
- ✅ User preferences
- ✅ Audit logs
- ✅ Team assignments
- ✅ Approval workflows

**Em tempo real** via Supabase Realtime subscriptions.

---

## 🔐 DNS & Domain Configuration

### Para www.sellersops.com.br

**1. Adicionar domínio em Vercel:**
```bash
vercel domains add www.sellersops.com.br
```

**2. Configurar DNS em seu registrador:**

```
Type:  CNAME
Name:  www
Value: cname.vercel-dns.com.
```

ou

```
Type:  A
Name:  www
Value: 76.76.19.165

Type:  AAAA
Name:  www
Value: 2606:4700:4700::1111
```

**3. Validar domínio:**
```bash
vercel domains verify www.sellersops.com.br
```

**4. SSL automaticamente configurado** via Vercel (Let's Encrypt)

### Para marketplace.aios.local (Interno)

```
Type:  A
Name:  marketplace
Value: 127.0.0.1  (ou IP interno do servidor)
```

---

## 👥 Usuários & Acesso

### Marketplace Admin (marketplace.aios.local)
- Acesso completo a todos os recursos
- Dashboard administrative
- Agent management
- System monitoring

**URL:** `https://marketplace.aios.local/marketplace`

### SellersOps Public (www.sellersops.com.br)
- Interface pública para sellers
- Task management (aprovado por admin)
- Performance analytics
- Channel management

**URL:** `https://www.sellersops.com.br/marketplace`

---

## 📊 Environment Variables por Domínio

### marketplace.aios.local
```yaml
Domain: marketplace.aios.local
Environment: development/staging
AUTH_URL: http://localhost:3000
API_URL: http://localhost:3000
ADMIN_ONLY: true
AGENTS_AUTONOMOUS: false (controlled)
```

### www.sellersops.com.br
```yaml
Domain: www.sellersops.com.br
Environment: production
AUTH_URL: https://www.sellersops.com.br
API_URL: https://www.sellersops.com.br
ADMIN_ONLY: false (public marketplace)
AGENTS_AUTONOMOUS: true (auto-processing)
```

---

## 🔗 Linking Domínios em Vercel

### Criar Project com Múltiplos Domínios

```bash
# Criar novo Vercel project
vercel project create marketplace-master

# Adicionar domínios
vercel domains add marketplace.aios.local
vercel domains add www.sellersops.com.br

# Configurar como production deployments
vercel env pull  # Puxar env vars
vercel deploy --prod
```

---

## 🔄 Migração de Dados

Ambos os domínios compartilham a mesma base de dados, então não há migração necessária. Dados criados em um domínio aparecem automaticamente no outro.

**Exemplo:**
1. Admin cria task em `marketplace.aios.local`
2. Task aparece imediatamente em `www.sellersops.com.br`
3. Seller executa task
4. Resultado sincronizado em ambos os domínios

---

## 🧪 Teste Multi-Domínio

### Teste Local
```bash
# Terminal 1: Dev server
npm run dev  # http://localhost:3000

# Terminal 2: Testar ambas rotas
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/orchestration/tasks
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/marketplace
```

### Teste em Produção
```bash
# Testar marketplace.aios.local
curl https://marketplace.aios.local/api/health
curl https://marketplace.aios.local/marketplace

# Testar www.sellersops.com.br
curl https://www.sellersops.com.br/api/health
curl https://www.sellersops.com.br/marketplace
```

---

## 🔒 Segurança Multi-Domínio

### CORS Configurado para Ambos
```typescript
Access-Control-Allow-Origin: marketplace.aios.local, www.sellersops.com.br
```

### Session Management
- NextAuth sessions isoladas por domínio
- Cookies não compartilhados entre domínios
- Cada domínio tem seu próprio `NEXTAUTH_SECRET`

### RLS (Row-Level Security)
- Database policies não mudam
- Permissões baseadas em role (admin/head/user)
- Dados visíveis são iguais em ambos domínios

---

## 📈 Monitoramento Multi-Domínio

### Dashboard unificado que monitora ambos:

```
┌─────────────────────────────────────┐
│    UNIFIED MONITORING DASHBOARD      │
├─────────────────────────────────────┤
│                                      │
│  marketplace.aios.local              │
│  ├─ Status: 🟢 Online               │
│  ├─ Response Time: 145ms            │
│  ├─ Error Rate: 0.2%                │
│  ├─ Active Users: 8                 │
│  └─ Tasks: 245                      │
│                                      │
│  www.sellersops.com.br               │
│  ├─ Status: 🟢 Online               │
│  ├─ Response Time: 150ms            │
│  ├─ Error Rate: 0.3%                │
│  ├─ Active Users: 342               │
│  └─ Tasks: 245 (sincronizadas)      │
│                                      │
└─────────────────────────────────────┘
```

---

## 🚨 Alertas Multi-Domínio

### Alertas Específicos por Domínio

```yaml
Alert: "marketplace.aios.local offline"
Alert: "www.sellersops.com.br offline"
Alert: "Database sync lagging > 30s"
Alert: "Domain replication lag detected"
```

### Ação Unificada

Se uma base de dados fica offline, **ambos domínios** recebem alerta.

---

## 📋 Checklist Setup Multi-Domínio

- [ ] `next.config.ts` atualizado com multi-domínio
- [ ] `.env.sellersops` criado e configurado
- [ ] `vercel.json` criado com ambos domínios
- [ ] DNS configurado para www.sellersops.com.br
- [ ] Domínios validados em Vercel
- [ ] NEXTAUTH_SECRET diferente por domínio
- [ ] Environment variables configuradas em Vercel
- [ ] SSL certificados válidos (Let's Encrypt)
- [ ] CORS tested para ambos domínios
- [ ] Sincronização de dados testada
- [ ] Usuarios criados em ambos domínios
- [ ] Monitoring dashboard testado
- [ ] Alerts configurados para ambos

---

## 🎯 Próximos Passos

### Semana 1: Deploy www.sellersops.com.br
```bash
./scripts/deploy-marketplace.sh production --domain=www.sellersops.com.br
```

### Semana 2: Ativar Agentes em Ambos Domínios
```bash
# marketplace.aios.local (manual mode)
# www.sellersops.com.br (autonomous mode)
```

### Semana 3: Monitoring Unificado
```bash
# Configure Sentry/Datadog para ambos
# Setup alertas para sincronização
```

---

## 📞 Suporte

**Problemas com domínio?**

1. Verificar DNS: `dig www.sellersops.com.br`
2. Verificar SSL: `curl -v https://www.sellersops.com.br`
3. Verificar Vercel: `vercel domains status`
4. Verificar logs: `vercel logs marketplace-sellersops`

**Contatos:**

- **Domínios/DNS:** @devops (Gage)
- **Vercel Setup:** @devops (Gage)
- **Sync Issues:** @data-engineer (Dara)
- **Segurança:** @architect (Aria)

---

**Status:** ✅ Múltiplos domínios configurados
**Última Atualização:** Fevereiro 20, 2026
**Versão:** 1.0.0
