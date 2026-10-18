import React from 'react';
import { Link } from 'react-router-dom';
import { Run } from '../../lib/types';
import { StatusBadge } from '../common/StatusBadge';
import { formatDateTime, formatDuration, getScoreColor } from '../../lib/utils';
import { ChevronRight, Clock, ShieldCheck, Play } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RunHistoryProps {
  runs: Run[];
  onTriggerRun?: () => void;
  isTriggering?: boolean;
  className?: string;
}

export const RunHistory: React.FC<RunHistoryProps> = ({
  runs,
  onTriggerRun,
  isTriggering = false,
  className,
}) => {
  if (runs.length === 0) {
    return (
      <div className={cn('bg-surface rounded-xl border border-dashed border-nx-border p-8 text-center', className)}>
        <ShieldCheck className="w-8 h-8 text-muted mx-auto mb-2" />
        <h4 className="text-sm font-bold text-brand-900">No Validation Runs Recorded</h4>
        <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-4">
          Initiate your first validation sweep to test TLS configuration, origin shielding, security headers, and edge WAF rules.
        </p>
        {onTriggerRun && (
          <button
            type="button"
            onClick={onTriggerRun}
            disabled={isTriggering}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isTriggering ? 'Starting Validation...' : 'Run Validation Now'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('bg-surface rounded-xl border border-nx-border shadow-xs overflow-hidden', className)}>
      <div className="p-4 border-b border-nx-border/60 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-brand-900">Validation Run History</h3>
          <p className="text-xs text-muted">Chronological audit log of all automated and manual runs</p>
        </div>

        {onTriggerRun && (
          <button
            type="button"
            onClick={onTriggerRun}
            disabled={isTriggering}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
          >
            <Play className="w-3 h-3" />
            <span>{isTriggering ? 'Running...' : 'New Run'}</span>
          </button>
        )}
      </div>

      <div className="divide-y divide-nx-border/50">
        {runs.map((run) => (
          <Link
            key={run.run_id}
            to={`/runs/${run.run_id}`}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/80 transition-colors group block"
          >
            <div className="flex items-start sm:items-center gap-3">
              <StatusBadge status={run.status} size="sm" />

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-900 group-hover:text-brand-700 transition-colors">
                    {run.run_id}
                  </span>
                  <span className="text-[11px] font-mono text-muted">
                    ({run.ruleset_version})
                  </span>
                </div>
                <div className="text-xs text-muted flex items-center gap-2 mt-0.5">
                  <span>{formatDateTime(run.started_at)}</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-muted/70" />
                    {formatDuration(run.duration_ms)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-5">
              <div className="flex items-baseline gap-1 text-right">
                <span className="text-xs text-muted">Score:</span>
                {run.score !== undefined ? (
                  <span className={cn('text-base font-bold font-mono', getScoreColor(run.score))}>
                    {run.score}
                    <span className="text-xs text-muted font-normal">/100</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono text-muted">Pending</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted hidden md:inline">
                  {run.check_results.length} checks
                </span>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-brand-700 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
