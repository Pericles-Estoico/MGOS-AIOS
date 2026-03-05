'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent, Suspense } from 'react';
import { Loader, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('teste@teste.com');
  const [password, setPassword] = useState('teste123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou senha incorretos');
        setLoading(false);
      } else if (result?.ok) {
        setLoading(false);
        await new Promise(resolve => setTimeout(resolve, 300));
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        router.push(callbackUrl);
      } else {
        setError('Erro ao fazer login');
        setLoading(false);
      }
    } catch {
      setError('Erro na conexao. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-teal-500 rounded-lg mb-5">
            <span className="text-base font-bold text-white">M</span>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">MGOS</h1>
          <p className="text-zinc-400 text-sm mt-1">Gerenciamento Inteligente de Tarefas</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Entrar na conta</h2>
            <p className="text-zinc-400 text-sm mt-0.5">Acesse sua conta para continuar</p>
          </div>

          {error && (
            <div className="flex gap-2.5 p-3 mb-4 bg-red-950/50 border border-red-900 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={loading}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 pt-4 border-t border-zinc-800">
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">Credenciais de teste</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Email</span>
                <code className="text-xs font-mono text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                  teste@teste.com
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Senha</span>
                <code className="text-xs font-mono text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                  teste123
                </code>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          MGOS © 2026
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0c0c0c]" />}>
      <LoginForm />
    </Suspense>
  );
}
