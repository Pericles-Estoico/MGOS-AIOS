#!/usr/bin/env node
/**
 * Script de Diagnóstico Completo — MGOS-AIOS
 * Verifica estado de: Redis, Migrações, Configuração, Queue
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const envFile = path.join(projectRoot, '.env.local');

// Carregar .env.local
const envContent = fs.readFileSync(envFile, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...rest] = trimmed.split('=');
        env[key] = rest.join('=');
    }
});

console.log('\n🔍 MGOS-AIOS — Diagnóstico Completo do Sistema\n');
console.log('='.repeat(70));

// 1. Verificar Configuração Crítica
console.log('\n✅ VARIÁVEIS CRÍTICAS:\n');
const criticalVars = [
    { key: 'NEXTAUTH_URL', label: 'NextAuth URL' },
    { key: 'NEXTAUTH_SECRET', label: 'NextAuth Secret' },
    { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL' },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase Anon Key' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role' },
    { key: 'OPENAI_API_KEY', label: 'OpenAI API Key' },
];

let criticalOK = true;
criticalVars.forEach(({ key, label }) => {
    const value = env[key];
    if (!value) {
        console.log(`  ❌ ${label} (${key}) — NÃO CONFIGURADA`);
        criticalOK = false;
    } else {
        const masked = value.length > 15 ? `${value.substring(0, 10)}...` : '***';
        console.log(`  ✅ ${label} = ${masked}`);
    }
});

// 2. Verificar Configuração Opcional (Redis Critical)
console.log('\n⚠️  VARIÁVEIS OPCIONAIS (Críticas para Filas):\n');
const optionalVars = [
    { key: 'REDIS_URL', label: 'Redis URL (CRÍTICA)' },
    { key: 'UPSTASH_REDIS_REST_URL', label: 'Upstash Redis REST URL' },
    { key: 'UPSTASH_REDIS_REST_TOKEN', label: 'Upstash Redis REST Token' },
    { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key' },
];

let redisConfigured = false;
optionalVars.forEach(({ key, label }) => {
    const value = env[key];
    if (!value) {
        console.log(`  ❌ ${label} (${key}) — NÃO CONFIGURADA`);
        if (key === 'REDIS_URL') {
            console.log('     ⚠️  BullMQ Queue NÃO FUNCIONARÁ sem Redis!');
        }
    } else {
        console.log(`  ✅ ${label} — configurada`);
        if (key === 'REDIS_URL') redisConfigured = true;
    }
});

// 3. Verificar Arquivos de Sistema
console.log('\n📂 ESTRUTURA DE ARQUIVOS:\n');

const filesToCheck = [
    { path: 'lib/redis-client.ts', label: 'Redis Client' },
    { path: 'lib/queue/sub-agent-queue.ts', label: 'Sub-Agent Queue' },
    { path: 'lib/queue/sub-agent-worker.ts', label: 'Sub-Agent Worker' },
    { path: 'lib/logger.ts', label: 'Logger Utility' },
    { path: 'supabase/migrations/20260302_create_marketplace_subtasks.sql', label: 'Migration File' },
];

filesToCheck.forEach(({ path: filePath, label }) => {
    const fullPath = `${projectRoot}/${filePath}`;
    const exists = fs.existsSync(fullPath);
    console.log(`  ${exists ? '✅' : '❌'} ${label} (${filePath})`);
});

// 4. Diagnóstico de Migrações
console.log('\n💾 STATUS DE MIGRAÇÕES:\n');
const migrationsPath = path.join(projectRoot, 'supabase', 'migrations');
if (fs.existsSync(migrationsPath)) {
    const migrations = fs.readdirSync(migrationsPath).sort();
    console.log(`  📁 Migrações encontradas: ${migrations.length}`);
    migrations.forEach(m => console.log(`     - ${m}`));
    console.log('\n  ⚠️  Status em produção Supabase: DESCONHECIDO');
    console.log('     (Execute: supabase migration list --linked)');
} else {
    console.log('  ❌ Pasta de migrações não encontrada!');
}

// 5. Resumo e Recomendações
console.log('\n' + '='.repeat(70));
console.log('\n📋 RESUMO DO DIAGNÓSTICO:\n');

if (criticalOK && redisConfigured) {
    console.log('✅ SISTEMA PRONTO PARA PRODUÇÃO');
    console.log('   - Todas as variáveis críticas configuradas');
    console.log('   - Redis está configurado');
    console.log('   - Queue e Worker devem funcionar');
} else {
    console.log('❌ SISTEMA NÃO ESTÁ PRONTO PARA PRODUÇÃO\n');
    console.log('🔧 PRÓXIMOS PASSOS:\n');

    if (!redisConfigured) {
        console.log('1. Configurar Redis (CRÍTICO):');
        console.log('   a) Criar Upstash Redis gratuito: https://upstash.com/');
        console.log('   b) Copiar REDIS_URL');
        console.log('   c) Adicionar a .env.local ou Vercel Settings');
        console.log('   d) Rodar npm install (se novos pacotes)');
    }

    if (!criticalOK) {
        console.log('\n2. Configurar Vercel Environment Variables:');
        console.log('   a) Acessar: https://vercel.com → Projeto → Settings');
        console.log('   b) Adicionar cada variável crítica acima');
        console.log('   c) Deploy novo após configurar');
    }

    console.log('\n3. Verificar Migrações do Supabase:');
    console.log('   a) Listar: supabase migration list --linked');
    console.log('   b) Aplicar: supabase migration push');
}

console.log('\n' + '='.repeat(70) + '\n');
