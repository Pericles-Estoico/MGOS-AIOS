# 📜 Deploy Script Guide - SellersOps

**Script:** `scripts/deploy.sh`
**Objetivo:** Fazer deploy automático com verificações, backup e rollback
**Status:** ✅ Pronto para usar no VPS Hostinger

---

## 📋 Índice

1. [Setup Inicial](#setup-inicial)
2. [Como Usar](#como-usar)
3. [Monitoramento](#monitoramento)
4. [Troubleshooting](#troubleshooting)
5. [Auto-Deploy com Git Hook](#auto-deploy-com-git-hook)

---

## 🚀 Setup Inicial

### Passo 1: Copiar o script para o VPS

**Opção A - Fazer download direto no VPS:**

```bash
ssh raiz@srv1346992.hstgr.cloud

cd /var/www/sellerops
mkdir -p scripts
curl -o scripts/deploy.sh https://raw.githubusercontent.com/Pericles-Estoico/MGOS-AIOS/main/scripts/deploy.sh
chmod +x scripts/deploy.sh
```

**Opção B - Fazer push do repositório (recomendado):**

Se o script já foi commitado no GitHub:

```bash
ssh raiz@srv1346992.hstgr.cloud

cd /var/www/sellerops
git pull origin main
chmod +x scripts/deploy.sh
```

### Passo 2: Criar diretórios de backup e logs

```bash
ssh raiz@srv1346992.hstgr.cloud

cd /var/www/sellerops
mkdir -p .deploy-logs .backups
chmod 755 .deploy-logs .backups
```

### Passo 3: Testar o script

```bash
ssh raiz@srv1346992.hstgr.cloud

cd /var/www/sellerops
./scripts/deploy.sh

# Você deve ver:
# ✓ Verificações pré-deployment
# ✓ Backup realizado
# ✓ Pull do código
# ✓ Instalação de dependências
# ✓ Compilação
# ✓ Reinício da app
# ✓ Health check
```

---

## 💻 Como Usar

### Deployment Manual

**Executar o script:**

```bash
ssh raiz@srv1346992.hstgr.cloud

cd /var/www/sellerops
./scripts/deploy.sh
```

**Ou, de qualquer lugar:**

```bash
ssh raiz@srv1346992.hstgr.cloud "./var/www/sellerops/scripts/deploy.sh"
```

### O que o script faz:

1. ✅ **Verificações pré-deployment**
   - Git está instalado?
   - Node.js está instalado?
   - PM2 está instalado?
   - Diretório existe?

2. 💾 **Backup automático**
   - Salva `.next`, `node_modules`, `package.json`
   - Armazena em `.backups/` com timestamp

3. 🔄 **Pull, Build e Restart**
   - `git fetch origin main`
   - `git pull origin main`
   - `npm install`
   - `npm run build`
   - `pm2 restart sellerops`

4. 🏥 **Health check**
   - Verifica se o processo PM2 está online
   - Aguarda até 30 segundos

5. ⚠️ **Rollback automático** (se algo der errado)
   - Restaura backup anterior
   - Reinicia a app

6. 📊 **Logs detalhados**
   - Salvo em `.deploy-logs/deploy.log`

---

## 📊 Monitoramento

### Ver status da app

```bash
ssh raiz@srv1346992.hstgr.cloud

# Ver se está rodando
pm2 list

# Ver detalhes
pm2 info sellerops

# Ver logs em tempo real
pm2 logs sellerops

# Últimas 100 linhas
pm2 logs sellerops --lines 100
```

### Ver logs do deployment

```bash
ssh raiz@srv1346992.hstgr.cloud

cd /var/www/sellerops
tail -f .deploy-logs/deploy.log

# Ou ver logs antigos
ls -la .deploy-logs/
cat .deploy-logs/deploy.log
```

### Ver backups

```bash
ssh raiz@srv1346992.hstgr.cloud

cd /var/www/sellerops
ls -la .backups/

# Ver informações do backup
cat .backups/backup-main-abc1234-20260222-150000/BACKUP_INFO.txt
```

---

## 🔧 Troubleshooting

### Erro: "npm: command not found"

**Solução:**

```bash
# Verificar se Node.js está instalado
node --version
npm --version

# Se não estiver, instalar:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
```

### Erro: "git: command not found"

**Solução:**

```bash
apt install -y git
```

### Erro: "pm2: command not found"

**Solução:**

```bash
npm install -g pm2
pm2 startup
pm2 save
```

### Erro: "Permission denied"

**Solução:**

```bash
chmod +x scripts/deploy.sh
chmod -R 755 .deploy-logs .backups
```

### A app não está respondendo após deployment

**Verificar:**

```bash
# Ver status PM2
pm2 status

# Ver se há erros
pm2 logs sellerops --err

# Verificar porta 3000
lsof -i :3000

# Reiniciar manualmente
pm2 restart sellerops
```

### Reverter para versão anterior (rollback manual)

```bash
ssh raiz@srv1346992.hstgr.cloud

cd /var/www/sellerops

# Ver backups disponíveis
ls -la .backups/

# Restaurar um backup
cp -r .backups/backup-main-abc1234-20260222-150000/.next ./
cp -r .backups/backup-main-abc1234-20260222-150000/node_modules ./

# Reiniciar
pm2 restart sellerops
```

---

## 🤖 Auto-Deploy com Git Hook

Para fazer deploy automaticamente toda vez que você faz push para main no GitHub, configure um webhook:

### Opção A: Webhook GitHub (Recomendado)

1. **Criar um token de deploy no VPS:**

```bash
ssh raiz@srv1346992.hstgr.cloud

# Criar um arquivo de controle
echo "webhook-secret-12345" > /var/www/sellerops/.webhook-secret
chmod 600 /var/www/sellerops/.webhook-secret
```

2. **Configurar webhook no GitHub:**
   - Ir para: https://github.com/Pericles-Estoico/MGOS-AIOS/settings/hooks
   - Clicar em "Add webhook"
   - **Payload URL:** `https://www.sellerops.com.br/api/deploy`
   - **Content type:** `application/json`
   - **Secret:** Use o mesmo token acima
   - **Events:** Selecione "Push events"

3. **Criar rota de webhook na app** (ópcionalmente):

```typescript
// app/api/deploy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { exec } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    const body = await request.text();

    // Verificar assinatura do webhook
    const secret = process.env.WEBHOOK_SECRET || '';
    const hash = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (`sha256=${hash}` !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Executar deploy script
    exec('/var/www/sellerops/scripts/deploy.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`Deploy error: ${error.message}`);
        return;
      }
      console.log(`Deploy output: ${stdout}`);
    });

    return NextResponse.json({ status: 'Deploy started' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Opção B: Cron Job (Simples)

Fazer deploy a cada 15 minutos se houver atualizações:

```bash
ssh raiz@srv1346992.hstgr.cloud

# Editar crontab
crontab -e

# Adicionar linha:
*/15 * * * * cd /var/www/sellerops && ./scripts/deploy.sh >> .deploy-logs/cron.log 2>&1
```

---

## 📝 Exemplo de Uso Real

**Cenário:** Você fez uma alteração (tradução do site) e quer fazer deploy

### 1. Commitar e fazer push (seu computador)

```bash
git add .
git commit -m "fix: translate pages to Portuguese"
git push origin main
```

### 2. Deploy no VPS (automaticamente ou manual)

**Se configurou webhook:** Deployment acontece automaticamente em ~5 minutos

**Se for manual:**

```bash
ssh raiz@srv1346992.hstgr.cloud "./var/www/sellerops/scripts/deploy.sh"
```

### 3. Verificar resultado

```bash
# Ver logs do deployment
ssh raiz@srv1346992.hstgr.cloud "tail -50 /var/www/sellerops/.deploy-logs/deploy.log"

# Acessar site
https://www.sellerops.com.br/tasks/new
# Deve estar em PORTUGUÊS agora ✅
```

---

## 🎯 Status Atual

- ✅ Script criado e testado
- ✅ Documentação completa
- ⏳ **Próximo passo:** Fazer upload para o VPS

---

## 📞 Suporte

Se houver problemas:

1. Verificar logs: `tail -f .deploy-logs/deploy.log`
2. Executar verificações manuais
3. Fazer rollback se necessário
4. Contatar desenvolvedor

---

**Last Updated:** 2026-02-22
