'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

interface SidebarProps {
  user: Session['user'];
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navLink = (href: string, label: string, icon: string) => (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
        isActive(href)
          ? 'bg-blue-100 text-blue-700 font-medium'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </Link>
  );

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Digital TaskOps</h1>
        <p className="text-sm text-gray-500 mt-1">{user?.name || user?.email}</p>
        <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
          {user?.role}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
        {navLink('/dashboard', 'Dashboard', '📊')}
        {navLink('/tasks', 'Tasks', '✓')}

        {/* Admin/Head only routes */}
        {user?.role && ['admin', 'head'].includes(user.role) && (
          <>
            <div className="h-px bg-gray-200 my-4" />
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Admin</p>
            {navLink('/team', 'Team Dashboard', '👥')}
            {navLink('/team/time-logs', 'Time Logs', '⏱️')}
          </>
        )}

        {/* User routes */}
        <div className="h-px bg-gray-200 my-4" />
        {navLink('/best-practices', 'Best Practices', '📚')}
        {navLink('/settings', 'Settings', '⚙️')}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
          className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
