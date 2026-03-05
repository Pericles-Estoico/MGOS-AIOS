'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import type { Session } from 'next-auth';

interface DashboardShellProps {
  user: Session['user'];
  children: React.ReactNode;
}

// Map pathnames to readable breadcrumb labels
const PATH_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tarefas',
  '/tasks/my-tasks': 'Minhas Tarefas',
  '/tasks/new': 'Nova Tarefa',
  '/produtos': 'Produtos',
  '/qa-reviews': 'Revisoes de QA',
  '/team': 'Time',
  '/team/time-logs': 'Registros de Tempo',
  '/agente-marketplace': 'Agente Master',
  '/marketplace': 'Marketplace',
  '/marketplace/chat': 'Chat com Nexo',
  '/marketplace/analysis': 'Analises',
  '/marketplace/aprovar': 'Aprovar Tasks',
  '/best-practices': 'Melhores Praticas',
  '/configuracoes': 'Configuracoes',
};

function getBreadcrumb(pathname: string): string {
  if (PATH_LABELS[pathname]) return PATH_LABELS[pathname];
  // Try prefix match
  const segments = pathname.split('/').filter(Boolean);
  const root = '/' + segments[0];
  return PATH_LABELS[root] || segments[segments.length - 1] || 'MGOS';
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen bg-zinc-50">
        <div className="w-14 md:w-60 border-r border-zinc-200 bg-[#0c0c0c]" />
        <main className="flex-1" />
      </div>
    );
  }

  const pageTitle = getBreadcrumb(pathname);

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 md:relative md:translate-x-0 transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar user={user} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-12 border-b border-zinc-200 bg-white flex items-center px-4 md:px-6 gap-4 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-md hover:bg-zinc-100 transition-colors text-zinc-500"
            aria-label="Abrir menu"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400 hidden md:inline">MGOS</span>
            <span className="text-zinc-300 hidden md:inline">/</span>
            <span className="font-medium text-zinc-700">{pageTitle}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
