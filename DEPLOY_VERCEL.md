# 🚀 Deploy em Vercel - Guia Rápido

## Passo 1: Ir para Vercel
1. Acesse https://vercel.com
2. Clique em "Sign Up"
3. Selecione "Continue with GitHub"
4. Autorize Vercel a acessar seus repositórios

## Passo 2: Importar Projeto
1. Após autenticado, clique em "New Project"
2. Encontre e selecione o repositório `MGOS-AIOS`
3. Clique em "Import"

## Passo 3: Configurar Variáveis de Ambiente
Na página de configuração, adicione as variáveis:

```
NEXTAUTH_URL = https://sellerops.com.br
NEXTAUTH_SECRET = sua-chave-secreta-aqui (gere com: openssl rand -base64 32)
DATABASE_URL = sua-url-supabase-aqui (opcional, por enquanto usamos dados fake)
```

## Passo 4: Deploy
1. Clique em "Deploy"
2. Aguarde (cerca de 2-3 minutos)
3. Após terminar, Vercel gerará um domínio temporário como: `mgos-aios.vercel.app`

## Passo 5: Apontar Domínio
1. Na dashboard do Vercel, vá para "Domains"
2. Clique em "Add Custom Domain"
3. Digite: `sellerops.com.br`
4. Vercel vai gerar instruções de DNS

### Configurar DNS na Hostinger
1. Acesse Hostinger painel de controle
2. Vá para "DNS"
3. Remova os nameservers atuais (dns-parking.com)
4. Adicione os nameservers da Vercel:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
5. Aguarde propagação (pode levar 24-48 horas, mas geralmente é rápido)

---

## ✅ Pronto!
Após a propagação DNS, `sellerops.com.br` abrirá sua app em produção! 🎉

### Links Úteis
- Dashboard Vercel: https://vercel.com/dashboard
- Documentação Vercel + Next.js: https://vercel.com/docs
- Vercel CLI (opcional): `npm install -g vercel`
