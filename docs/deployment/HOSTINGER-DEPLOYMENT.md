# 🚀 DEPLOYMENT GUIDE - HOSTINGER VPS

**Domínio:** sellerops.com.br
**VPS:** srv1346992.hstgr.cloud | Ubuntu 24.04 LTS
**IP:** 76.13.237.163
**SSH User:** raiz

---

## ⚡ QUICK START (Copie e cole no VPS)

```bash
#!/bin/bash
set -e

# 1. UPDATE & INSTALL
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs git nginx certbot python3-certbot-nginx

# 2. SETUP PM2
npm install -g pm2

# 3. APP DIRECTORY
mkdir -p /var/www/sellerops
cd /var/www/sellerops

# 4. CLONE & BUILD
git clone https://github.com/seu-usuario/MGOS-AIOS.git .
npm install
npm run build

# 5. START APP
pm2 start "npm run start" --name "sellerops" --instances max
pm2 startup
pm2 save

echo "✅ APP RODANDO EM http://76.13.237.163:3000"
```

---

## 🔗 CONFIGURAR DOMÍNIO (Hostinger Painel)

1. Painel → Domínios → sellerops.com.br
2. DNS Management
3. Adicionar Record A:
   - Name: @ (root)
   - Value: 76.13.237.163
   - TTL: 3600

Repetir para www.sellerops.com.br

---

## 🔐 CONFIGURAR SSL (No VPS)

```bash
cat > /etc/nginx/sites-available/sellerops.com.br << 'NGINX'
server {
    server_name sellerops.com.br www.sellerops.com.br;
    client_max_body_size 50M;
    listen 80;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sellerops.com.br www.sellerops.com.br;

    ssl_certificate /etc/letsencrypt/live/sellerops.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sellerops.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/sellerops.com.br /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# SSL Certificate
certbot --nginx -d sellerops.com.br -d www.sellerops.com.br
```

---

## ✅ VERIFICAR

```bash
pm2 status
curl -I https://sellerops.com.br
```

---

**Status:** 🟢 PRONTO PARA DEPLOYMENT

