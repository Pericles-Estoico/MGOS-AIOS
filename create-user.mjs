import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUser() {
  try {
    console.log('🔐 Criando usuário no Supabase...');
    
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: 'pericles@vidadeceo.com.br',
      password: 'Estoico123@',
      email_confirm: true,
      user_metadata: {
        name: 'Pericles',
        role: 'admin'
      }
    });

    if (error) {
      console.error('❌ Erro:', error.message);
      if (error.message.includes('already exists')) {
        console.log('⚠️ Usuário já existe');
        return;
      }
      process.exit(1);
    }

    console.log('✅ Usuário criado!');
    console.log('User ID:', user.user?.id);
    console.log('Email:', user.user?.email);

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

createUser();
