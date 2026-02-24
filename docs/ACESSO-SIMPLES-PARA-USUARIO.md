# 📱 Como Acessar o Sistema NEXO (Para Não-Programadores)

**Data de Criação:** 2026-02-24
**Para:** Usuários finais que querem usar o sistema
**Nível:** Iniciante (sem conhecimento técnico necessário)

---

## 🎯 Resumo Rápido

Você tem **2 formas** de acessar o sistema:

### ✅ Forma 1: Online (Mais Fácil) - **RECOMENDADO**
Abrir o navegador e ir para:
```
https://www.sellerops.com.br/marketplace
```
**Pronto! Não precisa fazer nada mais.**

### ✅ Forma 2: Localmente (Desenvolvimento)
Rodar no seu computador (menos comum)

---

## 🌐 FORMA 1: ACESSAR ONLINE (Recomendado)

### Passo 1: Abrir navegador

Qualquer navegador funciona:
- ✅ Chrome
- ✅ Safari (iPhone/iPad)
- ✅ Firefox
- ✅ Edge

### Passo 2: Digitar URL

Na barra de endereço, digitar:

```
https://www.sellerops.com.br/marketplace
```

**OU clique aqui:** [Abrir Marketplace](https://www.sellerops.com.br/marketplace)

### Passo 3: Fazer login

Se não estiver logado, você vai ver tela de login:

```
Email: seu@email.com
Senha: sua_senha
[Entrar]
```

Digite suas credenciais e clique **"Entrar"**.

### Passo 4: Você está dentro! ✅

Você vai ver o dashboard do NEXO com:

```
┌─────────────────────────────────────────┐
│  🚀 NEXO Orchestrator Master            │
│  Agentes Ativos: 6/6                    │
│  Tarefas Geradas: 12                    │
│  Taxa de Sucesso: 45%                   │
└─────────────────────────────────────────┘

[Phase 2 Dashboard] [Phase 3 Execução]
[Phase 4 Otimização] [Análises]

Ações Rápidas:
- 📊 Pendentes de Aprovação
- ⚡ Em Execução
- 📈 Analytics
- 🔍 Análises Estratégicas
- 📚 Knowledge Base
- 📁 Upload Análise
```

---

## 💻 FORMA 2: RODAR LOCALMENTE (Se precisar editar código)

### ⚠️ AVISO: Isso é para programadores!

Se você NÃO é programador, **pule esta seção e use Forma 1 acima.**

Se você for programador e quiser rodar localmente:

### Pré-requisitos (deve ter instalado):
- Node.js v18+ ([baixar aqui](https://nodejs.org/))
- Git ([baixar aqui](https://git-scm.com/))
- Docker (opcional, para banco de dados)

### Passo 1: Clonar projeto

```bash
git clone https://github.com/seu-repo/MGOS-AIOS.git
cd MGOS-AIOS
```

### Passo 2: Instalar dependências

```bash
npm install
```

### Passo 3: Configurar variáveis de ambiente

Criar arquivo `.env.local` na pasta raiz com:

```
NEXTAUTH_SECRET=seu-secret-aqui
NEXTAUTH_URL=http://localhost:3000

SUPABASE_URL=https://seu-supabase-url.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon

DATABASE_URL=postgresql://user:password@localhost:5432/db
```

### Passo 4: Rodar servidor

```bash
npm run dev
```

### Passo 5: Abrir navegador

```
http://localhost:3000/marketplace
```

---

## 📍 PRINCIPAIS SEÇÕES (O que você vai encontrar)

### 🏠 Dashboard Principal
**URL:** `https://www.sellerops.com.br/marketplace`

O que você vê:
- ✅ Status dos 6 agentes especializados
- ✅ Número de tarefas geradas
- ✅ Taxa de sucesso do sistema
- ✅ Saúde do sistema (verde = tudo ok)

### 📊 Phase 2: Dashboard em Tempo Real
**URL:** `https://www.sellerops.com.br/marketplace/orchestration`

O que você vê:
- ✅ Métricas detalhadas por agente
- ✅ Performance em tempo real
- ✅ Alertas se algo der errado

### ⚡ Phase 3: Execução de Tarefas
**URL:** `https://www.sellerops.com.br/marketplace/tasks/execution`

O que você vê:
- ✅ Tarefas em progresso (0-100%)
- ✅ Quem está executando cada tarefa
- ✅ Tempo restante estimado

### 🤖 Phase 4: Otimização com IA
**URL:** `https://www.sellerops.com.br/marketplace/orchestration/optimization`

O que você vê:
- ✅ Recomendações automáticas
- ✅ Predições de performance
- ✅ Sugestões de próximos passos

### 📋 Análises Estratégicas
**URL:** `https://www.sellerops.com.br/marketplace/analysis`

O que você vê:
- ✅ Lista de análises criadas
- ✅ Status de cada análise (Aguardando/Aprovado/Concluído)
- ✅ Botão para gerar novos planos

### 📚 Knowledge Base (Novo!)
**URL:** `https://www.sellerops.com.br/marketplace/knowledge-base`

O que você vê:
- ✅ Upload de arquivos (fotos, PDFs, planilhas)
- ✅ NEXO aprende automaticamente
- ✅ Cria tarefas com base no que aprendeu

---

## 👤 PRIMEIRO ACESSO - LOGIN

### Suas credenciais de teste:

```
Email: pericles@vidadeceo.com.br
Senha: Estoico123@
```

### Fazer login:

1. Ir para `https://www.sellerops.com.br`
2. Clicar em **"Login"** (canto superior direito)
3. Digitar email e senha
4. Clicar **"Entrar"**
5. Você vai ser redirecionado para o Dashboard

---

## 🛠️ OPERAÇÕES COMUNS (Como fazer)

### Como carregar dados para NEXO aprender?

1. Ir para `https://www.sellerops.com.br/marketplace/knowledge-base`
2. Clicar em **"📁 Upload Análise"** (em Ações Rápidas)
3. Selecionar arquivo (PDF, CSV, imagem, documento)
4. Escolher canais (Amazon, Shopee, etc.)
5. Clicar **"🚀 Upload & Análise"**

### Como ver tarefas criadas?

1. Ir para `https://www.sellerops.com.br/marketplace/analysis`
2. Ver lista de análises
3. Clicar em uma análise para ver detalhes
4. Clicar **"✅ Aprovar"** para gerar tarefas

### Como acompanhar execução de tarefas?

1. Ir para `https://www.sellerops.com.br/marketplace/tasks/execution`
2. Ver barra de progresso de cada tarefa (0-100%)
3. Ver agente responsável e tempo restante

### Como ver resultados finais?

1. Ir para `https://www.sellerops.com.br/marketplace/orchestration/optimization`
2. Ver recomendações do sistema
3. Ver impacto das tarefas executadas

---

## 📞 SUPORTE & AJUDA

### Se algo não funcionar:

**Opção 1: Limpar cache do navegador**
- iPhone/iPad: Settings → Safari → Clear History & Data
- Android: Chrome → Settings → Clear browsing data
- Desktop: Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)

**Opção 2: Fazer logout e login de novo**
1. Menu (canto superior direito)
2. Clique em seu nome
3. **"Logout"**
4. Faça login novamente

**Opção 3: Reabrir navegador**
- Feche completamente o navegador
- Abra novamente
- Ir para `https://www.sellerops.com.br/marketplace`

### Se ainda não funcionar:

Abra este link de diagnóstico:
```
https://www.sellerops.com.br/api/debug/mobile-check
```

Você vai ver um relatório técnico. Se disser `"allOk": false`, há um problema que precisa de ajuda técnica.

---

## 🔐 SEGURANÇA

### Dicas importantes:

- ✅ **Nunca compartilhe sua senha** com ninguém
- ✅ **Use HTTPS** (URL começa com `https://`, não `http://`)
- ✅ **Faça logout ao terminar** especialmente em computador compartilhado
- ✅ **Não deixe navegador aberto** com login em máquina pública

---

## 📱 ACESSAR DO CELULAR

### iPhone/iPad:
1. Abrir Safari (não Chrome)
2. Digitar: `https://www.sellerops.com.br/marketplace`
3. Fazer login
4. **Dica:** Adicionar à tela inicial (Share → Add to Home Screen)

### Android:
1. Abrir Chrome
2. Digitar: `https://www.sellerops.com.br/marketplace`
3. Fazer login
4. **Dica:** Instalar como app (Menu → Install app)

---

## ⏰ HORÁRIOS DE FUNCIONAMENTO

O sistema funciona **24 horas por dia, 7 dias por semana**.

Se estiver offline:
- Checar sua conexão de internet
- Tentar novamente em 5 minutos
- Abrir `https://www.sellerops.com.br/api/debug/mobile-check` para diagnosticar

---

## 📊 RESUMO EM 3 LINHAS

1. **Abra:** `https://www.sellerops.com.br/marketplace`
2. **Faça login** com suas credenciais
3. **Use o dashboard NEXO** para gerenciar análises e tarefas

---

## 📚 DOCUMENTAÇÃO ADICIONAL

Se quiser aprender mais (para programadores):

- `docs/QUICK-START-OPERACIONAL.md` - 3 comandos rápidos
- `docs/SIMULACAO-OPERACAO-COMPLETA.md` - Simulação passo-a-passo
- `docs/NEXO-KNOWLEDGE-BASE.md` - Como funciona o Knowledge Base
- `docs/DEBUG-MOBILE-URGENTE.md` - Se o mobile não funcionar

---

## ✅ VOCÊ ESTÁ PRONTO!

Amanhã, basta:

1. **Abrir navegador**
2. **Digitar:** `https://www.sellerops.com.br/marketplace`
3. **Fazer login**
4. **Usar o sistema!**

Nenhum conhecimento técnico necessário. 🎉

---

**Criado em:** 2026-02-24
**Status:** ✅ Pronto para uso
**Próxima revisão:** Quando houver novas features

---

## 🆘 Salvei este documento!

Se não encontrar amanhã:
- Verifique seu histórico do navegador
- Procure por "marketplace" em bookmarks
- Abra `https://www.sellerops.com.br/docs/ACESSO-SIMPLES.md`
- Pergunte ao time técnico

**Boa sorte! 🚀**
