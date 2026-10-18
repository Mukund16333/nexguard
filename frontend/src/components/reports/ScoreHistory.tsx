import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ScoreTrendPoint } from '../../lib/types';
import { Table, LineChart as ChartIcon, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ScoreHistoryProps {
  data: ScoreTrendPoint[];
  title?: string;
  className?: string;
}

export const ScoreHistory: React.FC<ScoreHistoryProps> = ({
  data,
  title = 'Deployment Reliability Trend',
  className,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  if (!data || data.length === 0) {
    return (
      <div className={cn('bg-surface p-6 rounded-xl border border-nx-border text-center text-sm text-muted', className)}>
        No historical run data recorded yet for trend analysis.
      </div>
    );
  }

  return (
    <div className={cn('bg-surface p-5 rounded-xl border border-nx-border shadow-xs', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-nx-border/60 gap-3">
        <div>
          <h3 className="text-base font-bold text-brand-900">{title}</h3>
          <p className="text-xs text-muted">
            Evaluation scores and rule coverage over deployment runs
          </p>
        </div>

        {/* Chart vs Table toggle per design brief requirement: tables always available for exact values */}
        <div className="inline-flex rounded-lg border border-nx-border p-0.5 bg-neutral-100 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all',
              viewMode === 'chart'
                ? 'bg-surface text-brand-900 shadow-xs font-semibold'
                : 'text-muted hover:text-nx-text'
            )}
            aria-pressed={viewMode === 'chart'}
          >
            <ChartIcon className="w-3.5 h-3.5" />
            <span>Trend Chart</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all',
              viewMode === 'table'
                ? 'bg-surface text-brand-900 shadow-xs font-semibold'
                : 'text-muted hover:text-nx-text'
            )}
            aria-pressed={viewMode === 'table'}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Exact Values Table</span>
          </button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="pt-4 h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="date_label"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                ticks={[0, 25, 50, 75, 100]}
              />
              <ReferenceLine y={80} stroke="#18794E" strokeDasharray="3 3" label={{ value: 'Target 80', fill: '#18794E', fontSize: 10, position: 'insideTopRight' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as ScoreTrendPoint;
                    return (
                      <div className="bg-brand-900 text-white p-3 rounded-lg shadow-lg border border-neutral-700 text-xs font-sans space-y-1.5">
                        <div className="font-semibold text-neutral-200 border-b border-neutral-700 pb-1">
                          {label} &bull; {item.environment.toUpperCase()}
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-neutral-300">Score:</span>
                          <span className="font-mono font-bold text-accent-500">{item.score}/100</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-neutral-300">Coverage:</span>
                          <span className="font-mono text-neutral-200">{item.coverage}%</span>
                        </div>
                        {item.target_name && (
                          <div className="text-[11px] text-neutral-400 truncate max-w-[180px]">
                            {item.target_name}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Score"
                stroke="#176B87"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#176B87', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#20B8A6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="pt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-nx-border text-muted font-mono uppercase bg-neutral-50/50">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Env</th>
                <th className="py-2.5 px-3 text-right">Score</th>
                <th className="py-2.5 px-3 text-right">Coverage</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nx-border/50 font-sans">
              {data.map((row) => (
                <tr key={row.run_id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-brand-900">{row.date_label}</td>
                  <td className="py-2.5 px-3 text-nx-text">{row.target_name || 'Production Gateway'}</td>
                  <td className="py-2.5 px-3 font-mono uppercase text-muted">{row.environment}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span className={row.score >= 80 ? 'text-[#18794E]' : row.score >= 60 ? 'text-[#9A6700]' : 'text-[#B42318]'}>
                      {row.score}/100
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-muted">{row.coverage}%</td>
                  <td className="py-2.5 px-3 text-center">
                    {row.score >= 80 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#18794E] font-medium">
                        <CheckCircle2 className="w-3 h-3" /> PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#9A6700] font-medium">
                        <AlertTriangle className="w-3 h-3" /> WARN
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
