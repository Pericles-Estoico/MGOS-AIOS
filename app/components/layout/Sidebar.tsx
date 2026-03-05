'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Search,
  Users,
  Clock,
  BookOpen,
  Settings,
  LogOut,
  Globe,
  MessageCircle,
  Package,
  ChevronRight,
  Bot,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import GlobalSearch from '../global-search';

interface SidebarProps {
  user: Session['user'];
  onClose?: () => void;
}

export default function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [pendingAnalyses, setPendingAnalyses] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('/api/marketplace/analysis?status=pending&limit=1');
        const data = await response.json();
        setPendingAnalyses(data.pendingCount || 0);
      } catch {
        // silencioso
      }
    };

    if (['admin', 'head'].includes(user?.role as string)) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  useEffect(() => {
    const fetchApprovalCount = async () => {
      try {
        const response = await fetch('/api/orchestration/tasks?status=pending&limit=100');
        const data = await response.json();
        setPendingApprovals((data.tasks ?? []).length);
      } catch {
        // silencioso
      }
    };

    fetchApprovalCount();
    const interval = setInterval(fetchApprovalCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const NavLink = ({
    href,
    label,
    icon,
    badge,
  }: {
    href: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={onClose}
        className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors relative ${
          active
            ? 'bg-[#1c1c1c] text-white font-medium'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#141414]'
        }`}
      >
        <span className={`flex-shrink-0 ${active ? 'text-teal-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
          {icon}
        </span>
        <span className="hidden md:inline truncate">{label}</span>
        {badge ? (
          <span className="hidden md:flex ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
        {active && (
          <span className="hidden md:block ml-auto">
            <ChevronRight className="w-3 h-3 text-zinc-500" />
          </span>
        )}
      </Link>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <p className="hidden md:block px-3 pt-4 pb-1 text-[10px] font-semibold tracking-widest text-zinc-600 uppercase">
      {label}
    </p>
  );

  const Divider = () => <div className="h-px bg-zinc-800 my-1 mx-3" />;

  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <aside className="w-14 md:w-60 border-r border-[#1c1c1c] bg-[#0c0c0c] flex flex-col h-screen">
      {/* Logo */}
      <div className="px-3 py-4 border-b border-[#1c1c1c]">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-7 h-7 bg-teal-500 rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          <div className="hidden md:block">
            <span className="text-sm font-semibold text-white">MGOS</span>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[#1c1c1c]">
        <div className="hidden md:block">
          <GlobalSearch />
        </div>
        <div className="md:hidden flex justify-center">
          <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#141414] rounded-md transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-2 space-y-0.5 px-1.5">
        <NavLink href="/dashboard" label="Dashboard" icon={<LayoutDashboard className="w-4 h-4" />} />
        <NavLink href="/tasks" label="Todas as Tarefas" icon={<CheckSquare className="w-4 h-4" />} />
        <NavLink href="/tasks/my-tasks" label="Minhas Tarefas" icon={<ListTodo className="w-4 h-4" />} />
        <NavLink href="/produtos" label="Produtos" icon={<Package className="w-4 h-4" />} />

        {['qa', 'admin', 'head'].includes(user?.role as string) && (
          <>
            <Divider />
            <SectionLabel label="QA" />
            <NavLink href="/qa-reviews" label="Revisoes de QA" icon={<Search className="w-4 h-4" />} />
          </>
        )}

        {user?.role && ['admin', 'head'].includes(user.role) && (
          <>
            <Divider />
            <SectionLabel label="Admin" />
            <NavLink href="/team" label="Dashboard do Time" icon={<Users className="w-4 h-4" />} />
            <NavLink href="/team/time-logs" label="Registros de Tempo" icon={<Clock className="w-4 h-4" />} />
          </>
        )}

        <Divider />
        <SectionLabel label="Marketplace" />
        <NavLink href="/agente-marketplace" label="Agente Master" icon={<Bot className="w-4 h-4" />} />
        <NavLink href="/marketplace" label="Marketplace Master" icon={<ShoppingBag className="w-4 h-4" />} />
        <NavLink href="/marketplace/chat" label="Chat com Nexo" icon={<MessageCircle className="w-4 h-4" />} />
        <NavLink href="/marketplace/analysis" label="Analises" icon={<Layers className="w-4 h-4" />} badge={pendingAnalyses > 0 ? pendingAnalyses : undefined} />
        <NavLink href="/marketplace/aprovar" label="Aprovar Tasks" icon={<CheckSquare className="w-4 h-4" />} badge={pendingApprovals > 0 ? pendingApprovals : undefined} />

        <Divider />
        <NavLink href="/best-practices" label="Melhores Praticas" icon={<BookOpen className="w-4 h-4" />} />
        <NavLink href="/configuracoes" label="Configuracoes" icon={<Settings className="w-4 h-4" />} />
      </nav>

      {/* User footer */}
      <div className="border-t border-[#1c1c1c] p-2">
        <div className="hidden md:flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-[#141414] transition-colors group">
          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-zinc-200">{userInitial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-200 truncate">{user?.name || user?.email}</p>
            <p className="text-[10px] text-zinc-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all rounded"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Mobile: só o avatar com logout */}
        <div className="md:hidden flex flex-col items-center gap-1">
          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
            <span className="text-xs font-semibold text-zinc-200">{userInitial}</span>
          </div>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
