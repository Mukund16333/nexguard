import React from 'react';
import { Run, Target } from '../../lib/types';
import { ScoreCard } from '../common/ScoreCard';
import { StatusBadge } from '../common/StatusBadge';
import { ReportExport } from '../reports/ReportExport';
import { formatDateTime, formatDuration } from '../../lib/utils';
import { Clock, Tag, Cpu, Shield, Calendar, ArrowRight } from 'lucide-react';

interface RunSummaryProps {
  run: Run;
  target?: Target;
}

export const RunSummary: React.FC<RunSummaryProps> = ({ run, target }) => {
  return (
    <div className="space-y-6">
      {/* Top Header Card with Score & Primary Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Score & Coverage Card */}
        <ScoreCard
          score={run.score}
          coverage={run.coverage}
          title="Deployment Score"
          size="lg"
          className="lg:col-span-1"
        />

        {/* Execution Metadata Card */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-nx-border p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-nx-border/60">
              <div className="flex items-center gap-2.5">
                <StatusBadge status={run.status} size="lg" />
                <span className="font-mono text-xs font-semibold text-muted">
                  ID: {run.run_id}
                </span>
              </div>

              {/* Export Buttons */}
              <ReportExport run={run} target={target} />
            </div>

            {/* Target information if available */}
            {target && (
              <div className="mt-4 p-3 rounded-lg bg-neutral-50/70 border border-nx-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="w-4 h-4 text-brand-700 shrink-0" />
                  <span className="text-xs font-bold text-brand-900 truncate">
                    {target.display_name}
                  </span>
                  <span className="text-xs font-mono text-muted truncate">
                    ({target.base_url})
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border uppercase font-medium">
                  {target.environment}
                </span>
              </div>
            )}

            {/* Grid of details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-1 text-xs">
              <div>
                <span className="text-muted block text-[11px] uppercase tracking-wider font-mono">Started</span>
                <span className="font-mono text-nx-text font-medium mt-0.5 block">
                  {formatDateTime(run.started_at)}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[11px] uppercase tracking-wider font-mono">Duration</span>
                <span className="font-mono text-nx-text font-medium mt-0.5 block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted/70" />
                  {formatDuration(run.duration_ms)}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[11px] uppercase tracking-wider font-mono">Ruleset</span>
                <span className="font-mono text-nx-text font-medium mt-0.5 block truncate">
                  {run.ruleset_version}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[11px] uppercase tracking-wider font-mono">App Version</span>
                <span className="font-mono text-nx-text font-medium mt-0.5 block truncate">
                  {run.app_version || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick checks counter tally */}
          <div className="mt-4 pt-3 border-t border-nx-border/50 flex flex-wrap items-center justify-between text-xs text-muted">
            <span className="font-medium">Evaluated Rule Breakdown:</span>
            <div className="flex items-center gap-3 font-mono font-semibold">
              <span className="text-[#18794E]">
                {run.check_results.filter((c) => c.status === 'PASS').length} Pass
              </span>
              <span className="text-[#9A6700]">
                {run.check_results.filter((c) => c.status === 'WARNING').length} Warn
              </span>
              <span className="text-[#B42318]">
                {run.check_results.filter((c) => c.status === 'FAIL' || c.status === 'ERROR').length} Fail
              </span>
              <span className="text-muted">
                {run.check_results.length} Total
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
