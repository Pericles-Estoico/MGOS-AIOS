'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent, Suspense } from 'react';
import { Loader, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        await new Promise(resolve => setTimeout(resolve, 500));
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        router.push(callbackUrl);
      } else {
        setError('Erro ao fazer login');
        setLoading(false);
      }
    } catch (error) {
      setError('Erro na conexão. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center items-center p-4">
      {/* Main Container */}
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-500 rounded-lg mb-4">
            <span className="text-xl font-bold text-white">M</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MGOS</h1>
          <p className="text-gray-600">Gerenciamento Inteligente de Tarefas</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Card Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Bem-vindo</h2>
            <p className="text-sm text-gray-600 mt-1">Acesse sua conta para continuar</p>
          </div>

          {/* Card Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="default"
              disabled={loading}
              className="w-full mt-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar na Conta'
              )}
            </Button>
          </form>

          {/* Card Footer - Demo Credentials */}
          <div className="px-6 pb-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-3 uppercase">Credenciais de Teste</p>
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Email:</span>
                <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200">
                  teste@teste.com
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Senha:</span>
                <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200">
                  teste123
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          MGOS © 2026 • Sistema Inteligente
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" />}>
      <LoginForm />
    </Suspense>
  );
}
