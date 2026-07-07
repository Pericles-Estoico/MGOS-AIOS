'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, CalendarX, TrendingUp, X } from 'lucide-react';
import Link from 'next/link';

interface Alert {
  id: string;
  type: 'atraso' | 'sem_data_venda' | 'desvio_custo';
  produto_id: string;
  produto_nome: string;
  mensagem: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  atraso:        { icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-red-500',    bg: 'bg-red-50' },
  sem_data_venda:{ icon: <CalendarX   className="w-3.5 h-3.5" />, color: 'text-orange-500', bg: 'bg-orange-50' },
  desvio_custo:  { icon: <TrendingUp  className="w-3.5 h-3.5" />, color: 'text-amber-500',  bg: 'bg-amber-50' },
};

export default function AlertsBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/mvp/alerts');
        if (!res.ok) return;
        const d = await res.json();
        setAlerts(d.alerts ?? []);
      } catch {
        // silencioso
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const count = alerts.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        aria-label="Alertas"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-[3px]">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Alertas</span>
            <button
              onClick={() => setOpen(false)}
              className="p-0.5 text-zinc-400 hover:text-zinc-600 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {count === 0 ? (
            <div className="px-4 py-6 text-center">
              <Bell className="w-6 h-6 text-zinc-200 mx-auto mb-1.5" />
              <p className="text-xs text-zinc-400">Tudo certo, nenhum alerta.</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-50">
              {alerts.map((alert) => {
                const cfg = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.atraso;
                return (
                  <Link
                    key={alert.id}
                    href={`/produtos/${alert.produto_id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${cfg.color}`}>{cfg.icon}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-800 truncate">{alert.produto_nome}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{alert.mensagem}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {count > 0 && (
            <div className="border-t border-zinc-100 px-4 py-2 text-center">
              <Link
                href="/produtos"
                onClick={() => setOpen(false)}
                className="text-xs text-teal-600 hover:underline"
              >
                Ver todos os produtos →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
