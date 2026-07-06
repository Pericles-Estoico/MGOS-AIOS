'use client';

import { useState, useMemo } from 'react';

interface Stage {
  id: string;
  nome: string;
  status: string;
  data_inicio_plan: string | null;
  data_fim_plan: string | null;
  data_inicio_real: string | null;
  data_fim_real: string | null;
  is_atrasada: boolean;
  responsavel_id: string | null;
}

interface GanttChartProps {
  stages: Stage[];
  costsByStage?: Record<string, number>;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const fmtCur = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function parseD(s: string | null): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function fmtDate(s: string | null): string {
  if (!s) return '—';
  const [y, m, d] = s.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${String(y).slice(2)}`;
}

function getBarColor(stage: Stage): string {
  if (stage.status === 'concluida') return 'bg-green-500';
  if (stage.is_atrasada) return 'bg-red-500';
  if (stage.status === 'em_andamento') return 'bg-blue-500';
  return 'bg-gray-300';
}

function getStatusLabel(stage: Stage): string {
  const labels: Record<string, string> = {
    planejada: 'Planejada', em_andamento: 'Em andamento', concluida: 'Concluída',
  };
  const base = labels[stage.status] ?? stage.status;
  return stage.is_atrasada ? `${base} (atrasada)` : base;
}

export function GanttChart({ stages, costsByStage = {} }: GanttChartProps) {
  const [zoom, setZoom] = useState<'week' | 'month'>('week');
  const [tooltip, setTooltip] = useState<{ stage: Stage; x: number; y: number } | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    const dates = stages
      .flatMap((s) => [s.data_inicio_plan, s.data_fim_plan, s.data_inicio_real, s.data_fim_real])
      .filter(Boolean)
      .map((d) => parseD(d as string)!);

    if (dates.length === 0) {
      return { rangeStart: today, rangeEnd: addDays(today, 30), totalDays: 30 };
    }

    const minD = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxD = new Date(Math.max(...dates.map((d) => d.getTime()), addDays(today, 7).getTime()));
    const total = Math.max(diffDays(minD, maxD), 1);
    return { rangeStart: minD, rangeEnd: maxD, totalDays: total };
  }, [stages, today]);

  function pct(date: Date | null, rs: Date, td: number): number {
    if (!date) return 0;
    return Math.max(0, Math.min(100, (diffDays(rs, date) / td) * 100));
  }

  function barFor(start: string | null, end: string | null) {
    const s = parseD(start);
    const e = parseD(end);
    if (!s || !e) return null;
    const left = pct(s, rangeStart, totalDays);
    const width = Math.max(pct(e, rangeStart, totalDays) - left, 0.4);
    return { left, width };
  }

  const todayPct = pct(today, rangeStart, totalDays);

  const columns = useMemo(() => {
    const cols: { label: string; left: number; width: number }[] = [];

    if (zoom === 'week') {
      const dow = rangeStart.getDay();
      let cur = addDays(rangeStart, dow === 0 ? -6 : 1 - dow);
      while (cur <= rangeEnd) {
        const next = addDays(cur, 7);
        const clamped = new Date(Math.max(cur.getTime(), rangeStart.getTime()));
        const clampEnd = new Date(Math.min(next.getTime(), rangeEnd.getTime()));
        const left = pct(clamped, rangeStart, totalDays);
        const width = pct(clampEnd, rangeStart, totalDays) - left;
        if (width > 0) {
          const label = `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}`;
          cols.push({ label, left, width });
        }
        cur = next;
      }
    } else {
      let year = rangeStart.getFullYear();
      let month = rangeStart.getMonth();
      while (true) {
        const mStart = new Date(year, month, 1);
        const mEnd = new Date(year, month + 1, 1);
        if (mStart >= rangeEnd) break;
        const clamped = new Date(Math.max(mStart.getTime(), rangeStart.getTime()));
        const clampEnd = new Date(Math.min(mEnd.getTime(), rangeEnd.getTime()));
        const left = pct(clamped, rangeStart, totalDays);
        const width = pct(clampEnd, rangeStart, totalDays) - left;
        if (width > 0) {
          cols.push({ label: `${MONTHS[month]} ${year}`, left, width });
        }
        month++;
        if (month === 12) { month = 0; year++; }
      }
    }
    return cols;
  }, [zoom, rangeStart, rangeEnd, totalDays]);

  // Minimum bar area pixel width to keep bars readable
  const numUnits = zoom === 'week' ? Math.ceil(totalDays / 7) : Math.ceil(totalDays / 28);
  const unitPx = zoom === 'week' ? 80 : 120;
  const barAreaMin = Math.max(numUnits * unitPx, 320);

  if (stages.length === 0) {
    return (
      <div className="text-center text-zinc-400 py-12 text-sm">
        Nenhuma etapa cadastrada para exibir no Gantt.
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-zinc-500 font-medium">Zoom:</span>
        {(['week', 'month'] as const).map((z) => (
          <button
            key={z}
            onClick={() => setZoom(z)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              zoom === z
                ? 'bg-teal-600 text-white border-teal-600'
                : 'border-zinc-300 text-zinc-600 hover:border-teal-400 hover:text-teal-600'
            }`}
          >
            {z === 'week' ? 'Semanas' : 'Meses'}
          </button>
        ))}
        <div className="ml-auto hidden sm:flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded-sm bg-gray-300" /> Planejado
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded-sm bg-blue-500" /> Em andamento
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded-sm bg-green-500" /> Concluído
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded-sm bg-red-500" /> Atrasado
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <div style={{ minWidth: 200 + barAreaMin }}>
          {/* Header row */}
          <div className="flex bg-zinc-50 border-b border-zinc-200">
            <div className="w-[200px] shrink-0 px-3 py-2 text-xs font-medium text-zinc-500">
              Etapa
            </div>
            <div
              className="flex-1 relative h-8"
              style={{ minWidth: barAreaMin }}
            >
              {columns.map((col, i) => (
                <div
                  key={i}
                  className="absolute inset-y-0 flex items-center pl-1 border-l border-zinc-200 overflow-hidden"
                  style={{ left: `${col.left}%`, width: `${col.width}%` }}
                >
                  <span className="text-xs text-zinc-500 whitespace-nowrap">{col.label}</span>
                </div>
              ))}
              {/* Today marker in header */}
              {todayPct >= 0 && todayPct <= 100 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                  style={{ left: `${todayPct}%` }}
                />
              )}
            </div>
          </div>

          {/* Stage rows */}
          {stages.map((stage, idx) => {
            const planBar = barFor(stage.data_inicio_plan, stage.data_fim_plan);
            const realBar = barFor(stage.data_inicio_real, stage.data_fim_real);
            const color = getBarColor(stage);
            const cost = costsByStage[stage.id];

            return (
              <div
                key={stage.id}
                className={`flex items-center border-b border-zinc-100 last:border-0 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/40'
                }`}
                style={{ height: 52 }}
              >
                {/* Label */}
                <div className="w-[200px] shrink-0 px-3 text-sm text-zinc-700 truncate pr-4">
                  {stage.nome}
                </div>

                {/* Bar area */}
                <div
                  className="flex-1 relative h-full cursor-default"
                  style={{ minWidth: barAreaMin }}
                  onMouseEnter={(e) => setTooltip({ stage, x: e.clientX, y: e.clientY })}
                  onMouseMove={(e) =>
                    setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null))
                  }
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Column grid lines */}
                  {columns.map((col, i) => (
                    <div
                      key={i}
                      className="absolute inset-y-0 border-l border-zinc-100"
                      style={{ left: `${col.left}%` }}
                    />
                  ))}

                  {/* Today line */}
                  {todayPct >= 0 && todayPct <= 100 && (
                    <div
                      className="absolute inset-y-0 w-0.5 bg-red-400 z-10"
                      style={{ left: `${todayPct}%` }}
                    />
                  )}

                  {/* Plan bar (gray, top half) */}
                  {planBar && (
                    <div
                      className="absolute bg-gray-200 rounded-sm"
                      style={{
                        left: `${planBar.left}%`,
                        width: `${planBar.width}%`,
                        top: 8,
                        height: 14,
                      }}
                    />
                  )}

                  {/* Real bar (colored, bottom half) */}
                  {realBar ? (
                    <div
                      className={`absolute rounded-sm ${color}`}
                      style={{
                        left: `${realBar.left}%`,
                        width: `${realBar.width}%`,
                        bottom: 8,
                        height: 14,
                      }}
                    />
                  ) : (
                    // No real dates yet: show status color on plan bar position
                    planBar &&
                    stage.status !== 'planejada' && (
                      <div
                        className={`absolute rounded-sm ${color} opacity-70`}
                        style={{
                          left: `${planBar.left}%`,
                          width: `${planBar.width}%`,
                          bottom: 8,
                          height: 14,
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white shadow-xl rounded-lg p-3 text-xs border border-zinc-200 w-56 pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <div className="font-semibold text-zinc-800 mb-2 text-sm">{tooltip.stage.nome}</div>
          <div className="space-y-1 text-zinc-600">
            <div className="flex justify-between gap-2">
              <span className="text-zinc-400">Status</span>
              <span className="font-medium text-right">{getStatusLabel(tooltip.stage)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-400">Início plan.</span>
              <span>{fmtDate(tooltip.stage.data_inicio_plan)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-400">Fim plan.</span>
              <span>{fmtDate(tooltip.stage.data_fim_plan)}</span>
            </div>
            {tooltip.stage.data_inicio_real && (
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Início real</span>
                <span>{fmtDate(tooltip.stage.data_inicio_real)}</span>
              </div>
            )}
            {tooltip.stage.data_fim_real && (
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Fim real</span>
                <span>{fmtDate(tooltip.stage.data_fim_real)}</span>
              </div>
            )}
            {costsByStage[tooltip.stage.id] !== undefined && (
              <div className="flex justify-between gap-2 pt-1 border-t border-zinc-100 mt-1">
                <span className="text-zinc-400">Custo real</span>
                <span className="font-medium">{fmtCur.format(costsByStage[tooltip.stage.id])}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
