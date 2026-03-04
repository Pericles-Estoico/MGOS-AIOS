#!/usr/bin/env node

/**
 * EXECUTE MIGRATIONS NOW - Direct PostgreSQL connection
 * No more documentation, just DO IT
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

// Extract project ID from URL
const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];

// Build connection string - use db.supabase.co instead of pooler
const connectionString = `postgresql://postgres.${projectRef}:${SERVICE_ROLE_KEY}@${projectRef}.db.supabase.co:5432/postgres`;

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              🚀 EXECUTING MIGRATIONS NOW 🚀                   ║
║                  (Sem mais papo, só ação)                     ║
╚═══════════════════════════════════════════════════════════════╝

📍 Projeto: ${projectRef}
🔌 Conectando ao banco...
`);

// Read migrations file
const migrationsPath = path.join(__dirname, '../MIGRATIONS-ALL.sql');
const sqlContent = fs.readFileSync(migrationsPath, 'utf8');

// Split into statements
const statements = sqlContent
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

console.log(`📊 Total de statements: ${statements.length}`);
console.log(`📄 Arquivo: MIGRATIONS-ALL.sql (3300 linhas)\n`);

// Execute with Pool
const pool = new Pool({ connectionString });

let successCount = 0;
let failCount = 0;
const errors = [];

async function executeStatements() {
  try {
    // Connect
    const client = await pool.connect();
    console.log('✅ Conectado ao Supabase PostgreSQL!\n');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        process.stdout.write(`⏳ [${i + 1}/${statements.length}] `);
        await client.query(statement);
        console.log('✅');
        successCount++;
      } catch (err) {
        console.log(`❌ (${err.message.substring(0, 50)})`);
        failCount++;
        errors.push({
          statementNum: i + 1,
          error: err.message,
          sql: statement.substring(0, 100)
        });
      }
    }

    client.release();

    // Summary
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                      ✅ COMPLETO!                             ║
╚═══════════════════════════════════════════════════════════════╝

📊 RESULTADOS:
   ✅ Sucesso: ${successCount}
   ❌ Falha: ${failCount}
   📁 Total: ${statements.length}

`);

    if (failCount > 0) {
      console.log('⚠️  ERROS:');
      errors.slice(0, 5).forEach(e => {
        console.log(`   [${e.statementNum}] ${e.error}`);
      });
    }

    // Verify
    console.log('\n🔍 VERIFICANDO TABELAS...');
    const result = await pool.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    const tableCount = result.rows[0].table_count;
    console.log(`✅ Tabelas criadas: ${tableCount}`);

    if (tableCount >= 11) {
      console.log('\n🎉 SUCESSO! Banco de dados criado com sucesso!');
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('   1. Criar Storage bucket "evidence"');
      console.log('   2. Setup autenticação (4 test users)');
      console.log('   3. Integrar com Next.js');
      process.exit(0);
    } else {
      console.log(`\n⚠️  Apenas ${tableCount} tabelas foram criadas (esperado 11+)`);
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ ERRO FATAL:', err.message);
    console.error('\n🔧 SOLUÇÃO: Se o erro for de autenticação, tente:');
    console.error('   1. Regenerar as chaves no Supabase');
    console.error('   2. Atualizar .env.local com novas chaves');
    console.error('   3. Executar novamente: node scripts/execute-now.js');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
executeStatements();
