'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface UserPreferences {
  email_task_assigned: boolean;
  email_qa_feedback: boolean;
  email_burndown_warning: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_task_assigned: true,
    email_qa_feedback: true,
    email_burndown_warning: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );

  const fetchPreferences = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/preferences?user_id=${userId}`);

      if (res.ok) {
        const data = await res.json();
        setPreferences((prev) => data.data || prev);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const userSession = await getSession();
      if (!userSession) {
        router.push('/login');
        return;
      }
      setSession(userSession);
      await fetchPreferences(userSession.user?.id || '');
    };
    checkAuth();
  }, [router, fetchPreferences]);

  const handlePreferenceChange = (key: keyof UserPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) {
        throw new Error('Failed to save preferences');
      }

      setMessage({ type: 'success', text: 'Preferências salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao salvar preferências',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">Gerencie suas preferências e configurações</p>
      </div>

      {message && (
        <div
          className={`p-4 border rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-600'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <div className="border rounded-lg bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Perfil</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              disabled
              value={session?.user?.name || ''}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              disabled
              value={session?.user?.email || ''}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Função
            </label>
            <input
              type="text"
              disabled
              value={session?.user?.role || ''}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 capitalize"
            />
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Para alterar seu perfil, entre em contato com um administrador.
          </p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="border rounded-lg bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Preferências de Notificação
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          Escolha quais notificações você deseja receber por email
        </p>

        <div className="space-y-4">
          <PreferenceToggle
            label="Tarefas Atribuídas"
            description="Receber notificação quando uma nova tarefa for atribuída a você"
            checked={preferences.email_task_assigned}
            onChange={() => handlePreferenceChange('email_task_assigned')}
          />

          <PreferenceToggle
            label="Feedback de QA"
            description="Receber notificação quando uma tarefa receber feedback de QA"
            checked={preferences.email_qa_feedback}
            onChange={() => handlePreferenceChange('email_qa_feedback')}
          />

          <PreferenceToggle
            label="Avisos de Burndown"
            description="Receber notificação se o sprint estiver em risco de não ser completado"
            checked={preferences.email_burndown_warning}
            onChange={() => handlePreferenceChange('email_burndown_warning')}
          />
        </div>

        <button
          onClick={handleSavePreferences}
          disabled={saving}
          className="mt-6 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:bg-gray-400 transition-colors"
        >
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </button>
      </div>

      {/* Admin Section */}
      {session?.user?.role === 'admin' && (
        <div className="border rounded-lg bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Administração</h2>

          <div className="space-y-3">
            <Link
              href="/settings/users"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900">Gerenciar Usuários</p>
                <p className="text-sm text-gray-600">
                  Criar, editar ou remover usuários
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>

            <Link
              href="/sprints"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900">Gerenciar Sprints</p>
                <p className="text-sm text-gray-600">
                  Criar e acompanhar sprints
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>

            <Link
              href="/analytics"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900">Dashboard de Análise</p>
                <p className="text-sm text-gray-600">
                  Ver métricas de performance da equipe
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="border rounded-lg bg-teal-50 border-teal-200 p-6">
        <h2 className="text-lg font-bold text-teal-900 mb-4">Precisa de Ajuda?</h2>
        <p className="text-teal-800 text-sm mb-4">
          Se você tiver dúvidas ou problemas, entre em contato com o administrador do sistema.
        </p>
        <div className="space-y-2 text-sm text-teal-800">
          <p>Email: admin@example.com</p>
          <p>Slack: #help-desk</p>
        </div>
      </div>
    </div>
  );
}

interface PreferenceToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: PreferenceToggleProps) {
  return (
    <div className="flex items-start justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`ml-4 w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-teal-500' : 'bg-gray-300'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
