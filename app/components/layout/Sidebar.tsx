'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckSquare,
  ListTodo,
  Search,
  Users,
  Clock,
  BookOpen,
  Settings,
  LogOut,
  Sun,
  Moon,
  Globe,
  MessageCircle,
} from 'lucide-react';
import GlobalSearch from '../global-search';

interface SidebarProps {
  user: Session['user'];
  onClose?: () => void;
}

export default function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [pendingAnalyses, setPendingAnalyses] = useState(0);

  // Fetch pending analyses count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('/api/marketplace/analysis?status=pending&limit=1');
        const data = await response.json();
        setPendingAnalyses(data.pendingCount || 0);
      } catch (error) {
        console.error('Error fetching pending analyses:', error);
      }
    };

    if (['admin', 'head'].includes(user?.role as string)) {
      fetchPendingCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navLink = (href: string, label: string, icon: React.ReactNode, badge?: number) => (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition justify-between ${
        isActive(href)
          ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 font-medium'
          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-shrink-0">{icon}</div>
        <span className="hidden md:inline">{label}</span>
      </div>
      {badge ? (
        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
          {badge}
        </span>
      ) : null}
    </Link>
  );

  return (
    <aside className="w-64 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">MGOS</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gerenciamento de Tarefas</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-900 dark:text-gray-200">{user?.name || user?.email}</p>
          <span className="inline-block mt-2 px-2.5 py-1 text-xs font-semibold bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Global Search */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <GlobalSearch />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navLink('/dashboard', 'Dashboard', <BarChart3 className="w-5 h-5" />)}
        {navLink('/tasks', 'Todas as Tarefas', <CheckSquare className="w-5 h-5" />)}
        {navLink('/tasks/my-tasks', 'Minhas Tarefas', <ListTodo className="w-5 h-5" />)}

        {/* QA only routes */}
        {(['qa', 'admin', 'head'].includes(user?.role as string)) && (
          <>
            <div className="h-px bg-gray-100 dark:bg-gray-700 my-3" />
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">QA</p>
            {navLink('/qa-reviews', 'Revisões de QA', <Search className="w-5 h-5" />)}
          </>
        )}

        {/* Admin/Head only routes */}
        {user?.role && ['admin', 'head'].includes(user.role) && (
          <>
            <div className="h-px bg-gray-100 dark:bg-gray-700 my-3" />
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</p>
            {navLink('/team', 'Dashboard do Time', <Users className="w-5 h-5" />)}
            {navLink('/team/time-logs', 'Registros de Tempo', <Clock className="w-5 h-5" />)}
          </>
        )}

        {/* Marketplace routes (admin/head only) */}
        {user?.role && ['admin', 'head'].includes(user.role) && (
          <>
            <div className="h-px bg-gray-100 dark:bg-gray-700 my-3" />
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marketplace</p>
            {navLink('/marketplace', 'Marketplace Master', <Globe className="w-5 h-5" />)}
            {navLink('/marketplace/chat', 'Chat com Nexo', <MessageCircle className="w-5 h-5" />)}
            {navLink('/marketplace/analysis', 'Análises', <Search className="w-5 h-5" />, pendingAnalyses > 0 ? pendingAnalyses : undefined)}
          </>
        )}

        {/* User routes */}
        <div className="h-px bg-gray-100 dark:bg-gray-700 my-3" />
        {navLink('/best-practices', 'Melhores Práticas', <BookOpen className="w-5 h-5" />)}
        {navLink('/settings', 'Configurações', <Settings className="w-5 h-5" />)}
      </nav>

      {/* Theme Toggle + Logout */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition font-medium text-sm"
          title={theme === 'dark' ? 'Mudar para light mode' : 'Mudar para dark mode'}
        >
          {theme === 'dark' ? (
            <><Sun className="w-4 h-4" /> <span className="hidden md:inline">Claro</span></>
          ) : (
            <><Moon className="w-4 h-4" /> <span className="hidden md:inline">Escuro</span></>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden md:inline">Sair</span>
        </button>
      </div>
    </aside>
  );
}
