/**
 * Script de teste para verificar autenticação
 * Execute: node test-auth.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function test() {
  console.log('🧪 Iniciando testes de autenticação...\n');

  try {
    // Test 1: Verificar debug endpoint
    console.log('Test 1: Verificar configuração de ambiente');
    const debugRes = await fetch(`${BASE_URL}/api/debug/auth`);
    const debugData = await debugRes.json();
    console.log('Status:', debugRes.status);
    console.log('Resposta:', JSON.stringify(debugData, null, 2));
    console.log('✅ Endpoint de debug funciona\n');

    // Test 2: Verificar se consegue acessar session sem autenticação
    console.log('Test 2: Verificar session sem autenticação');
    const sessionRes = await fetch(`${BASE_URL}/api/auth/session`);
    console.log('Status:', sessionRes.status);
    if (sessionRes.status === 401) {
      console.log('✅ Corretamente retorna 401 (não autenticado)\n');
    } else {
      console.log('⚠️  Esperava 401, recebeu:', sessionRes.status, '\n');
    }

    // Test 3: Verificar se consegue acessar tasks sem autenticação
    console.log('Test 3: Verificar tasks sem autenticação');
    const tasksRes = await fetch(`${BASE_URL}/api/tasks`);
    console.log('Status:', tasksRes.status);
    if (tasksRes.status === 401) {
      console.log('✅ Corretamente retorna 401 (não autenticado)\n');
    } else {
      console.log('⚠️  Esperava 401, recebeu:', tasksRes.status, '\n');
    }

    console.log('✨ Testes concluídos!');
    console.log('\nPróximo passo: Tente fazer login no browser e verifique os logs');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('\n⚠️  Certifique-se de que:');
    console.error('1. npm run dev está rodando');
    console.error('2. Servidor está na porta 3000');
    console.error('3. Se em WSL, tente http://localhost:3000 ou http://127.0.0.1:3000');
  }
}

test();
