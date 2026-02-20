# 🚀 Marketplace Master — Guia de Deployment

**Data:** Fevereiro 20, 2026
**Status:** ✅ Pronto para Produção
**Versão:** 1.0.0

---

## 📋 Visão Geral

Este guia cobre o deployment do Marketplace Master (@marketplace-master) em três ambientes:

1. **Development** — Máquina local (`localhost:3000`)
2. **Staging** — Servidor de homologação
3. **Production** — Servidor de produção

---

## 🔧 Pré-Requisitos

### Software Necessário

```bash
# Verificar versões
node --version  # >= 18.0.0
npm --version   # >= 8.0.0
git --version   # >= 2.30.0
```

### Variáveis de Ambiente

```bash
# .env.local (Development)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# .env.staging (Staging)
NEXT_PUBLIC_API_URL=https://staging.marketplace.aios.local
NEXTAUTH_URL=https://staging.marketplace.aios.local
NEXTAUTH_SECRET=your-staging-secret

# .env.production (Production)
NEXT_PUBLIC_API_URL=https://marketplace.aios.local
NEXTAUTH_URL=https://marketplace.aios.local
NEXTAUTH_SECRET=your-production-secret
VERCEL_TOKEN=your-vercel-token
SENTRY_DSN=https://...
DATADOG_API_KEY=...
```

### Contas Necessárias

- **Vercel** — Para deployment de frontend
- **Supabase** — Banco de dados (RLS policies configuradas)
- **GitHub** — Repositório (acesso push)
- **Sentry** (opcional) — Error tracking
- **Datadog** (opcional) — Performance monitoring

---

## 🏃 Deployment Rápido

### 1. Development (Local)

```bash
# Clone repository
git clone https://github.com/your-org/MGOS-AIOS.git
cd MGOS-AIOS

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Run development server
npm run dev

# App available at http://localhost:3000
```

### 2. Staging

```bash
# Build
npm run build

# Test build locally
npm run start

# Deploy to Vercel (staging)
./scripts/deploy-marketplace.sh staging

# Access: https://staging.marketplace.aios.local
```

### 3. Production

```bash
# Ensure all tests pass
npm test

# Build
npm run build

# Deploy to production
./scripts/deploy-marketplace.sh production

# Access: https://marketplace.aios.local
```

---

## 📦 Deployment Script (`deploy-marketplace.sh`)

### Uso

```bash
# Development
./scripts/deploy-marketplace.sh development

# Staging
./scripts/deploy-marketplace.sh staging

# Production
./scripts/deploy-marketplace.sh production
```

### O que o script faz

1. ✅ Verifica pré-requisitos (Node, npm, git)
2. ✅ Valida ambiente (dev/staging/prod)
3. ✅ Limpa builds anteriores
4. ✅ Instala dependências
5. ✅ Roda type checking
6. ✅ Executa linter (com auto-fix)
7. ✅ Compila aplicação
8. ✅ Roda testes
9. ✅ Setup monitoramento (Sentry, Datadog)
10. ✅ Deploy (interativo: escolha Vercel/Docker/Self-hosted)
11. ✅ Verifica saúde da aplicação
12. ✅ Rollback automático se falhar

---

## 🌐 Opções de Deployment

### Opção 1: Vercel (Recomendado)

**Vantagens:**
- Zero-config deployment
- Automatic scaling
- Edge functions
- Integração GitHub nativa
- Free tier disponível

**Setup:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod --token $VERCEL_TOKEN
```

**Configuração em `vercel.json`:**

```json
{
  "name": "marketplace-master",
  "version": 2,
  "buildCommand": "npm run build",
  "env": {
    "NEXT_PUBLIC_API_URL": {
      "required": true
    },
    "NEXTAUTH_URL": {
      "required": true
    },
    "NEXTAUTH_SECRET": {
      "required": true
    }
  }
}
```

### Opção 2: Docker

**Vantagens:**
- Portabilidade completa
- Controle fino de ambiente
- Rodável em qualquer servidor

**Setup:**

```bash
# Build image
docker build -t marketplace-master:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://marketplace.aios.local \
  -e NEXTAUTH_URL=https://marketplace.aios.local \
  -e NEXTAUTH_SECRET=your-secret \
  marketplace-master:latest

# Push to registry
docker push your-registry/marketplace-master:latest
```

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
```

### Opção 3: Self-Hosted

**Vantagens:**
- Controle total
- Sem vendor lock-in
- Customização completa

**Setup (Ubuntu/Debian):**

```bash
# Instalar Node
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
cd /opt
sudo git clone https://github.com/your-org/MGOS-AIOS.git
cd MGOS-AIOS

# Install dependencies
sudo npm ci --prefer-offline

# Build
sudo npm run build

# Setup systemd service
sudo tee /etc/systemd/system/marketplace-master.service > /dev/null <<EOF
[Unit]
Description=Marketplace Master Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/MGOS-AIOS
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable service
sudo systemctl enable marketplace-master
sudo systemctl start marketplace-master

# Check status
sudo systemctl status marketplace-master
```

**Configurar Reverse Proxy (Nginx):**

```nginx
server {
    listen 443 ssl http2;
    server_name marketplace.aios.local;

    ssl_certificate /etc/letsencrypt/live/marketplace.aios.local/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/marketplace.aios.local/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
    }
}
```

---

## 🔐 Segurança

### Environment Variables

```bash
# NUNCA commit .env files
echo ".env*" >> .gitignore

# Use GitHub Secrets para CI/CD
# Repository → Settings → Secrets → New repository secret
NEXTAUTH_SECRET=xxx
VERCEL_TOKEN=xxx
SENTRY_DSN=xxx
DATADOG_API_KEY=xxx
```

### CORS & CSP

```typescript
// next.config.js
module.exports = {
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_API_URL
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT'
          }
        ]
      }
    ]
  }
}
```

### Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
});

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

---

## 📊 Monitoramento

### Sentry (Error Tracking)

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Datadog (Performance Monitoring)

```bash
# Install Datadog tracer
npm install dd-trace

# Start app with tracer
DD_TRACE_ENABLED=true npm start
```

### Custom Health Check

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database
    const db = await checkDatabase();

    // Check external services
    const services = await checkExternalServices();

    return Response.json({
      status: 'healthy',
      timestamp: new Date(),
      database: db,
      services
    });
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Marketplace Master

on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        run: |
          npx vercel deploy \
            --prod \
            --token ${{ secrets.VERCEL_TOKEN }}
        if: github.ref == 'refs/heads/main'
```

---

## 🚨 Troubleshooting

### Build Fails

```bash
# Clear cache e reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### Environment Variables Not Loading

```bash
# Verify .env file
cat .env.local

# Check NEXTAUTH setup
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL
```

### Database Connection Issues

```bash
# Test Supabase connection
npm run test:db

# Check RLS policies
npx supabase migration list
```

### Performance Issues

```bash
# Analyze bundle
npm run analyze

# Check Core Web Vitals
npm run lighthouse

# Profile runtime
node --prof app.js
node --prof-process isolate-*.log > profile.txt
```

---

## ✅ Checklist Pré-Deployment

- [ ] Todos os testes passando (`npm test`)
- [ ] Linting sem erros (`npm run lint`)
- [ ] Type checking sem erros (`npm run typecheck`)
- [ ] Build completa com sucesso (`npm run build`)
- [ ] Environment variables configuradas
- [ ] Supabase RLS policies ativas
- [ ] Database migrations aplicadas
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Monitoramento (Sentry/Datadog) setup
- [ ] SSL certificado válido
- [ ] Backup da database realizado
- [ ] Runbook de rollback preparado
- [ ] On-call notificado

---

## 📞 Suporte

**Problemas com deployment?**

1. Verifique logs: `npm run logs`
2. Reinicie serviço: `systemctl restart marketplace-master`
3. Verifique status: `./scripts/deploy-marketplace.sh --health-check`
4. Escalae para @devops (Gage)

**Contatos:**

- **DevOps:** @devops (Gage)
- **Architecture:** @architect (Aria)
- **Development:** @dev (Dex)
- **Data:** @data-engineer (Dara)

---

**Status:** ✅ Pronto para Produção
**Última Atualização:** Fevereiro 20, 2026
**Versão:** 1.0.0
