'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@lib/supabase';
import { Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Get token from URL (Supabase sends it as 'code' parameter)
  const token = searchParams.get('code');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não correspondem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Validate token exists
      if (!token) {
        setError('Token não fornecido ou expirado. Solicite um novo reset.');
        setLoading(false);
        return;
      }

      // Exchange token for session
      const { data, error: sessionError } = await (supabase as unknown as SupabaseClient).auth.exchangeCodeForSession(
        token
      );

      if (sessionError || !data.session) {
        setError('Token expirado ou inválido. Solicite um novo reset.');
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await (supabase as unknown as SupabaseClient).auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(`Erro ao atualizar senha: ${updateError.message}`);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setPassword('');
      setConfirmPassword('');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(`Erro inesperado: ${String(err)}`);
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-cyan-300 to-teal-400 flex flex-col justify-center items-center p-4">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">Link Inválido</h1>
            <p className="text-center text-gray-600 mb-6">
              O link de reset de senha não foi fornecido ou expirou.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-xl transition-all"
            >
              Voltar para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-cyan-300 to-teal-400 flex flex-col justify-center items-center p-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                {success ? (
                  <CheckCircle2 className="w-10 h-10 text-white" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-white" />
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {success ? 'Senha Atualizada!' : 'Resetar Senha'}
            </h1>
            <p className="text-gray-600">
              {success ? 'Redirecionando para login...' : 'Defina uma nova senha para sua conta'}
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <p className="text-green-600 font-semibold mb-4">✓ Sua senha foi atualizada com sucesso!</p>
              <p className="text-gray-500 text-sm">Você será redirecionado para login em poucos segundos...</p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                  Nova Senha
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400 disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800 mb-2">
                  Confirmar Senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-bold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Atualizando...</span>
                  </>
                ) : (
                  <span>Atualizar Senha</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full text-cyan-600 hover:text-cyan-700 font-semibold py-2 rounded-xl transition-all"
              >
                Voltar para Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
