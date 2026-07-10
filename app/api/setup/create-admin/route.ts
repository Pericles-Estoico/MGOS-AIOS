import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@lib/supabase';

export async function POST(request: NextRequest) {
  const setupToken = process.env.SETUP_TOKEN;

  // Endpoint bloqueado se SETUP_TOKEN não estiver configurado
  if (!setupToken) {
    return Response.json(
      { error: 'SETUP_TOKEN não configurado nas variáveis de ambiente.' },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { setup_token, email, password, name } = body ?? {};

  if (setup_token !== setupToken) {
    return Response.json({ error: 'Token de setup inválido.' }, { status: 401 });
  }

  if (!email || !password || !name) {
    return Response.json({ error: 'email, password e name são obrigatórios.' }, { status: 422 });
  }

  if (password.length < 8) {
    return Response.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 422 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: 'Supabase não configurado.' }, { status: 503 });
  }

  // Verifica se já existe um admin cadastrado via Supabase Auth
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const alreadyHasAdmin = (existingUsers?.users ?? []).some(
    (u) => u.user_metadata?.role === 'admin'
  );

  if (alreadyHasAdmin) {
    return Response.json(
      { error: 'Já existe um administrador cadastrado. Use o painel do Supabase para gerenciar usuários.' },
      { status: 409 }
    );
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role: 'admin',
    },
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    ok: true,
    message: `Administrador "${name}" (${email}) criado com sucesso.`,
    userId: data.user?.id,
  }, { status: 201 });
}
