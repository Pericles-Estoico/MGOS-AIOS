'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';
import {
  Plus,
  Trash2,
  Loader,
  UserCheck,
  X,
  ChevronDown,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'head' | 'executor' | 'qa';
  department: string | null;
  is_active: boolean;
  created_at: string;
}

const ROLES: { value: User['role']; label: string; description: string }[] = [
  { value: 'admin',    label: 'Administrador', description: 'Acesso total ao sistema' },
  { value: 'head',     label: 'Lider',         description: 'Cria e atribui tarefas' },
  { value: 'executor', label: 'Executor',       description: 'Executa tarefas atribuidas' },
  { value: 'qa',       label: 'QA',            description: 'Revisa e aprova entregas' },
];

const ROLE_COLORS: Record<User['role'], string> = {
  admin:    'bg-purple-50 text-purple-700 border-purple-200',
  head:     'bg-blue-50 text-blue-700 border-blue-200',
  executor: 'bg-zinc-50 text-zinc-700 border-zinc-200',
  qa:       'bg-amber-50 text-amber-700 border-amber-200',
};

const SECTORS = [
  'Marketing',
  'Operacoes',
  'Comercial',
  'Financeiro',
  'Logistica',
  'Atendimento',
  'TI',
  'RH',
  'Juridico',
  'Outro',
];

export default function UsersPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'executor' as User['role'],
    department: '',
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const s = await getSession();
      if (!s) { router.push('/login'); return; }
      if (s.user?.role !== 'admin') { router.push('/dashboard'); return; }
      setSession(s);
      await fetchUsers();
    };
    init();
  }, [router, fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError('Nome e email sao obrigatorios.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao criar usuario.');
      } else {
        setSuccess(`Usuario ${form.name} criado com sucesso!`);
        setForm({ name: '', email: '', role: 'executor', department: '' });
        setShowForm(false);
        await fetchUsers();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch {
      setError('Erro de conexao. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (userId: string, userName: string) => {
    if (!confirm(`Desativar o usuario "${userName}"?`)) return;
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setSuccess(`Usuario ${userName} desativado.`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-40 bg-zinc-200 rounded" />
        <div className="h-10 w-32 bg-zinc-200 rounded" />
        <div className="h-48 bg-zinc-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Gerenciar Colaboradores</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{users.length} usuario{users.length !== 1 ? 's' : ''} ativo{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo usuario
        </button>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          <UserCheck className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900">Adicionar colaborador</h2>
            <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nome completo *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Ana Souza"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="ana@empresa.com"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Funcao</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value as User['role'] }))}
                  className="w-full appearance-none px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Setor</label>
              <div className="relative">
                <select
                  value={form.department}
                  onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
                >
                  <option value="">Selecionar setor...</option>
                  {SECTORS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Roles info */}
            <div className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <span key={r.value} className={`text-[10px] font-medium px-2 py-1 rounded-full border ${ROLE_COLORS[r.value]}`}>
                    {r.label}: {r.description}
                  </span>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {submitting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {submitting ? 'Criando...' : 'Criar colaborador'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-zinc-500 hover:text-zinc-700 text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Colaboradores ativos</h2>
        </div>

        {users.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-zinc-400">Nenhum colaborador cadastrado ainda.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar primeiro colaborador
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {users.map(user => (
              <div key={user.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-zinc-50 transition-colors">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-zinc-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-zinc-900">{user.name}</p>
                    {user.id === session?.user?.id && (
                      <span className="text-[10px] text-zinc-400">(voce)</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                </div>

                {/* Setor */}
                {user.department && (
                  <span className="hidden sm:block text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md flex-shrink-0">
                    {user.department}
                  </span>
                )}

                {/* Role */}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${ROLE_COLORS[user.role]}`}>
                  {ROLES.find(r => r.value === user.role)?.label || user.role}
                </span>

                {/* Delete — not self */}
                {user.id !== session?.user?.id && (
                  <button
                    onClick={() => handleDeactivate(user.id, user.name)}
                    disabled={deletingId === user.id}
                    className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    title="Desativar usuario"
                  >
                    {deletingId === user.id
                      ? <Loader className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 mb-1">Como o acesso funciona</p>
        <p className="text-xs text-amber-700">
          Ao criar um colaborador, o perfil e salvo no sistema. Para que ele acesse o site,
          o email e senha devem ser cadastrados no <strong>Supabase Auth</strong> (painel do banco de dados).
          Entre em contato com o desenvolvedor para ativar o login de novos colaboradores.
        </p>
      </div>
    </div>
  );
}
