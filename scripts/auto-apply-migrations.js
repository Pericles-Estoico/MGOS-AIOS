#!/usr/bin/env node

/**
 * Auto-apply migrations - opens Supabase and prepares copy-paste
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const migrationsPath = path.resolve(__dirname, '../MIGRATIONS-ALL.sql');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         🚀 AUTO MIGRATIONS - SUPER FÁCIL 🚀                  ║
╚═══════════════════════════════════════════════════════════════╝

📍 Projeto: grxsyhmikuhqmffhipwt
📂 Arquivo: MIGRATIONS-ALL.sql

`);

// Step 1: Copy file to clipboard
console.log('📋 STEP 1: Copiar migrations para clipboard...');
const sqlContent = fs.readFileSync(migrationsPath, 'utf8');

// Copy to clipboard using different methods based on OS
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

let clipboardCommand;
if (isWindows) {
  // Windows: use clip
  const tempFile = path.join(__dirname, '../.temp-migrations.sql');
  fs.writeFileSync(tempFile, sqlContent);
  clipboardCommand = `type "${tempFile}" | clip`;
} else if (isMac) {
  // Mac: use pbcopy
  clipboardCommand = `echo "${sqlContent}" | pbcopy`;
} else {
  // Linux: use xclip
  clipboardCommand = `echo "${sqlContent}" | xclip -selection clipboard`;
}

exec(clipboardCommand, (error) => {
  if (error) {
    console.warn('⚠️  Não consegui copiar automaticamente. Vou mostrar como fazer:\n');
  } else {
    console.log('✅ MIGRATIONS copiadas para clipboard!\n');
  }

  // Step 2: Open browser
  console.log('🌐 STEP 2: Abrindo Supabase Studio...\n');
  const sqlEditorUrl = `${SUPABASE_URL}/dashboard/sql`;

  let openCommand;
  if (isWindows) {
    openCommand = `start "" "${sqlEditorUrl}"`;
  } else if (isMac) {
    openCommand = `open "${sqlEditorUrl}"`;
  } else {
    openCommand = `xdg-open "${sqlEditorUrl}"`;
  }

  exec(openCommand);

  // Step 3: Show instructions
  setTimeout(() => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    📋 INSTRUÇÕES VISUAIS                      ║
╚═══════════════════════════════════════════════════════════════╝

OPÇÃO A: Se a cópia automática funcionou
─────────────────────────────────────────────────────────────

1. Supabase Studio deve estar aberto agora
2. Clique no editor SQL (à direita)
3. Cole: Ctrl+V
4. Clique botão azul: RUN
5. Aguarde 2-3 minutos
6. ✅ Pronto!

─────────────────────────────────────────────────────────────

OPÇÃO B: Se não funcionou (copy manual)
─────────────────────────────────────────────────────────────

1. Abra arquivo: MIGRATIONS-ALL.sql (na raiz do projeto)
2. Selecione tudo: Ctrl+A
3. Copie: Ctrl+C
4. Vá para Supabase Studio (já deve estar aberto)
5. Cole: Ctrl+V
6. Clique: RUN
7. Aguarde: 2-3 minutos
8. ✅ Pronto!

─────────────────────────────────────────────────────────────

📊 ESTATÍSTICAS:
• 29 migrations
• 3300 linhas de SQL
• 15+ tabelas
• Tempo: 2-3 minutos

─────────────────────────────────────────────────────────────

✅ VERIFICAÇÃO (depois de rodar):

Copie e execute no SQL Editor:

  SELECT COUNT(*) as tables
  FROM information_schema.tables
  WHERE table_schema = 'public';

Deve retornar: 15+

─────────────────────────────────────────────────────────────

🔗 URL Supabase:
${sqlEditorUrl}

─────────────────────────────────────────────────────────────

Você consegue! Bora! 🚀
`);
  }, 1000);
});
