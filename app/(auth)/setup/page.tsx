'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    setup_token: '',
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (form.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setup_token: form.setup_token,
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar administrador.');
        return;
      }

      setDone(true);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-teal-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Administrador criado!</h1>
          <p className="text-sm text-zinc-400 mb-6">
            Sua conta foi cadastrada com sucesso. Remova a variável{' '}
            <code className="bg-zinc-800 text-teal-400 px-1.5 py-0.5 rounded text-xs">SETUP_TOKEN</code>{' '}
            do Vercel depois de fazer login.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl transition-colors"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-500 rounded-xl mb-4">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Configurar administrador</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Crie a conta principal do sistema
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="bg-amber-900/30 border border-amber-700/40 rounded-lg p-3 mb-6">
            <p className="text-xs text-amber-300 leading-relaxed">
              Insira o <strong>Setup Token</strong> configurado na variável de ambiente{' '}
              <code className="bg-amber-900/50 px-1 rounded">SETUP_TOKEN</code> no Vercel.
              Esta página só funciona uma vez enquanto não houver administrador cadastrado.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Setup Token
              </label>
              <input
                name="setup_token"
                type="password"
                value={form.setup_token}
                onChange={handleChange}
                required
                placeholder="Token secreto de configuração"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Seu nome
              </label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Ex: Pericles Correia"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Senha
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Confirmar senha
              </label>
              <input
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={handleChange}
                required
                placeholder="Repita a senha"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/40 rounded-lg p-3">
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar administrador'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
