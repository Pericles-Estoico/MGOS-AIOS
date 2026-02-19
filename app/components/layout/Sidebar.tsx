'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
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
} from 'lucide-react';
import GlobalSearch from '../global-search';

interface SidebarProps {
  user: Session['user'];
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navLink = (href: string, label: string, icon: React.ReactNode) => (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
        isActive(href)
          ? 'bg-teal-50 text-teal-600 font-medium'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <span>{label}</span>
    </Link>
  );

  return (
    <aside className="w-64 border-r border-gray-100 bg-white flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">MGOS</h1>
            <p className="text-xs text-gray-500">Task Management</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-900">{user?.name || user?.email}</p>
          <span className="inline-block mt-2 px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-600 rounded-full">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Global Search */}
      <div className="px-4 py-3 border-b border-gray-100">
        <GlobalSearch />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navLink('/dashboard', 'Dashboard', <BarChart3 className="w-5 h-5" />)}
        {navLink('/tasks', 'All Tasks', <CheckSquare className="w-5 h-5" />)}
        {navLink('/tasks/my-tasks', 'My Tasks', <ListTodo className="w-5 h-5" />)}

        {/* QA only routes */}
        {user?.role === 'qa' && (
          <>
            <div className="h-px bg-gray-100 my-3" />
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">QA</p>
            {navLink('/qa-reviews', 'QA Reviews', <Search className="w-5 h-5" />)}
          </>
        )}

        {/* Admin/Head only routes */}
        {user?.role && ['admin', 'head'].includes(user.role) && (
          <>
            <div className="h-px bg-gray-100 my-3" />
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</p>
            {navLink('/team', 'Team Dashboard', <Users className="w-5 h-5" />)}
            {navLink('/team/time-logs', 'Time Logs', <Clock className="w-5 h-5" />)}
          </>
        )}

        {/* User routes */}
        <div className="h-px bg-gray-100 my-3" />
        {navLink('/best-practices', 'Best Practices', <BookOpen className="w-5 h-5" />)}
        {navLink('/settings', 'Settings', <Settings className="w-5 h-5" />)}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
