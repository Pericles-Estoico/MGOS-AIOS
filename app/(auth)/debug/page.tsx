'use client';

import { useState } from 'react';
import { supabase } from '@lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export default function DebugPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testSupabaseAuth = async () => {
    setLoading(true);
    setResult('Testando...');

    try {
      console.log('📝 Testando com:', { email, password });
      console.log('🔌 Supabase client:', supabase);

      const { data, error } = await (supabase as unknown as SupabaseClient).auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setResult(`❌ Erro: ${error.message}\nCódigo: ${error.status}`);
        console.error('Erro completo:', error);
      } else {
        setResult(`✅ Sucesso!\n\nUser:\n${JSON.stringify(data.user, null, 2)}\n\nSession:\n${JSON.stringify(data.session, null, 2)}`);
        console.log('Dados:', data);
      }
    } catch (err) {
      setResult(`⚠️ Exception: ${String(err)}`);
      console.error('Exception:', err);
    }

    setLoading(false);
  };

  const checkSupabaseSetup = async () => {
    setLoading(true);
    setResult('Verificando...');

    try {
      console.log('🔍 Verificando configuração:');
      console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET');

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setResult('❌ Variáveis de ambiente não configuradas!');
        return;
      }

      // Test basic connectivity
      const response = await fetch(`${url}/auth/v1/health`, {
        headers: {
          apikey: key,
        },
      });

      if (response.ok) {
        setResult('✅ Supabase está acessível!\n\nVariáveis configuradas corretamente.');
      } else {
        setResult(`❌ Erro ao conectar: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      setResult(`❌ Erro: ${String(err)}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">🔧 Debug Supabase Auth</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Verificar Configuração</h2>
          <button
            onClick={checkSupabaseSetup}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? 'Verificando...' : 'Verificar Setup'}
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Testar Login</h2>
          <div className="space-y-4 mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
            />
            <button
              onClick={testSupabaseAuth}
              disabled={loading || !email || !password}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              {loading ? 'Testando...' : 'Testar Login'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Resultado</h2>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto text-sm whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 text-gray-400 text-sm">
          <p>💡 Use esta página para debugar problemas de autenticação</p>
          <p>📋 Abra o console do navegador (F12) para ver mais detalhes</p>
        </div>
      </div>
    </div>
  );
}
