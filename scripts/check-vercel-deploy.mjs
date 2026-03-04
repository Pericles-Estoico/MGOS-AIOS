#!/usr/bin/env node

/**
 * Check Vercel deployment status in real-time
 * Usage: node scripts/check-vercel-deploy.mjs
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function checkVercelStatus() {
  console.log('🔍 Verificando status do deploy no Vercel...\n');

  try {
    // Get latest deployment info
    const { stdout } = await execPromise('vercel deploy --prod --confirm', {
      cwd: process.cwd(),
      timeout: 30000,
    });

    console.log('Deploy iniciado:');
    console.log(stdout);
    console.log('\n⏳ Aguardando conclusão...');
    console.log('Você pode monitorar em: https://vercel.com/dashboard\n');

  } catch (error) {
    console.error('❌ Erro ao verificar deploy:\n');

    // Try alternative method - check git logs
    try {
      const { stdout: gitLog } = await execPromise('git log --oneline -1');
      console.log('Último commit:');
      console.log(gitLog);

      console.log('\n📋 Próximas ações:');
      console.log('1. Vá para: https://vercel.com/dashboard');
      console.log('2. Clique no projeto: MGOS-AIOS');
      console.log('3. Procure pelo commit mais recente');
      console.log('4. Aguarde até que o status mude para "Ready" ou "Live"');
      console.log('\n5. Se estiver em progresso, aguarde 2-3 minutos');
      console.log('6. Se falhar, verifique os logs de erro no Vercel');

    } catch (e) {
      console.error('Erro ao obter informações:', e.message);
    }
  }
}

checkVercelStatus().catch(console.error);
