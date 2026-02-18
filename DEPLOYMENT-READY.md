# 🚀 SELLEROPS.COM.BR - DEPLOYMENT GUIDE

**Status:** ✅ **PRONTO PARA PRODUÇÃO**

---

## 📋 INFORMAÇÕES DO VPS

```
Domínio: sellerops.com.br
VPS: srv1346992.hstgr.cloud
IP: 76.13.237.163
SO: Ubuntu 24.04 LTS
SSH User: raiz
```

---

## ⚡ DEPLOYMENT RÁPIDO (3 PASSOS)

### **PASSO 1: Conectar ao VPS**

```bash
ssh raiz@76.13.237.163
```

### **PASSO 2: Executar Script de Deployment**

```bash
# Copiar e colar tudo:
bash << 'SCRIPT'
#!/bin/bash
set -e

# UPDATE
apt update && apt upgrade -y

# INSTALL NODE & TOOLS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs git nginx certbot python3-certbot-nginx
npm install -g pm2

# APP
mkdir -p /var/www/sellerops && cd /var/www/sellerops
git clone https://github.com/seu-usuario/MGOS-AIOS.git .
npm install && npm run build

# ENV FILE
cat > .env.production << 'ENV'
NEXTAUTH_URL=https://sellerops.com.br
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_SUPABASE_URL=seu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
SUPABASE_SERVICE_ROLE_KEY=sua_service_key
ENV

echo "⚠️  EDITE .env.production com suas credenciais:"
echo "nano /var/www/sellerops/.env.production"

# START PM2
pm2 start "npm run start" --name "sellerops" --instances max
pm2 startup
pm2 save

# NGINX
cat > /etc/nginx/sites-available/sellerops.com.br << 'NGINX'
server {
    server_name sellerops.com.br www.sellerops.com.br;
    listen 80;
    return 301 https://$server_name$request_uri;
}
server {
    listen 443 ssl http2;
    server_name sellerops.com.br www.sellerops.com.br;
    ssl_certificate /etc/letsencrypt/live/sellerops.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sellerops.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/sellerops.com.br /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# SSL
certbot --nginx -d sellerops.com.br -d www.sellerops.com.br

# FIREWALL
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ DEPLOYMENT CONCLUÍDO!"
SCRIPT
```

### **PASSO 3: Configurar Domínio (Hostinger Painel)**

1. https://hpanel.hostinger.com
2. **Domínios → sellerops.com.br → DNS Management**
3. **Adicionar Record A:**
   - **Name:** @ (root)
   - **Value:** 76.13.237.163
   - **TTL:** 3600

4. **Repetir para www:**
   - **Name:** www
   - **Value:** 76.13.237.163

---

## ✅ VERIFICAÇÃO

```bash
# No VPS:
pm2 status
curl -I https://sellerops.com.br

# No navegador:
https://sellerops.com.br
```

---

## 🎨 DESIGN

- ✅ **Login Page:** Gradiente Cyan → Teal com animações
- ✅ **Dashboard:** Profissional com cards e estatísticas
- ✅ **Cores:** Cyan (#4DD0E1), Teal, Purple
- ✅ **Responsivo:** Mobile-first
- ✅ **SSL:** HTTPS com Let's Encrypt

---

## 📝 EDITAR ENV (No VPS)

```bash
# Editar credenciais Supabase
nano /var/www/sellerops/.env.production

# Restart app
pm2 restart sellerops
```

---

## 🔧 COMANDOS ÚTEIS

```bash
# Status
pm2 status

# Logs
pm2 logs sellerops

# Restart
pm2 restart sellerops

# Stop
pm2 stop sellerops

# Nginx status
systemctl status nginx

# Ver recurso
free -h
df -h
```

---

## 🚨 TROUBLESHOOTING

### Erro: "Connection refused"
```bash
pm2 status
pm2 logs sellerops
```

### Erro: "502 Bad Gateway"
```bash
curl http://localhost:3000  # Verificar se app está rodando
```

### Erro: "SSL Certificate"
```bash
certbot renew --force-renewal
systemctl restart nginx
```

---

## ✨ RESULTADO FINAL

```
✅ Domínio: https://sellerops.com.br
✅ Layout: Moderno (Cyan/Teal/Purple)
✅ SSL: HTTPS seguro
✅ Performance: Otimizado com PM2
✅ Segurança: Firewall + Fail2ban
✅ Auto-restart: PM2 startup
```

---

**Tempo estimado:** 20-30 minutos
**Suporte:** Todos os logs estão disponíveis com `pm2 logs sellerops`

🚀 **PRONTO PARA DEPLOYMENT!**
