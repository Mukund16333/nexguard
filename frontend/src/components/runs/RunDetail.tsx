import React from 'react';
import { Run, Target } from '../../lib/types';
import { RunSummary } from './RunSummary';
import { CheckList } from '../checks/CheckList';
import { PageHeader } from '../common/PageHeader';
import { XCircle, RefreshCw } from 'lucide-react';

interface RunDetailProps {
  run: Run;
  target?: Target;
  onRefresh?: () => void;
  onCancel?: () => void;
}

export const RunDetail: React.FC<RunDetailProps> = ({
  run,
  target,
  onRefresh,
  onCancel,
}) => {
  const isRunning = run.status === 'queued' || run.status === 'running';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Validation Run: ${run.run_id}`}
        subtitle={`Executed against ${target?.display_name || run.target_id} (${target?.environment.toUpperCase() || 'PROD'})`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Targets', href: '/targets' },
          ...(target ? [{ label: target.display_name, href: `/targets/${target.target_id}` }] : []),
          { label: run.run_id },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {isRunning && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-status-fail/40 bg-status-fail-bg/50 hover:bg-status-fail-bg text-status-fail text-xs font-semibold rounded-lg transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Run</span>
              </button>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-nx-border bg-surface hover:bg-neutral-50 text-nx-text text-xs font-medium rounded-lg shadow-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-muted" />
                <span>Refresh</span>
              </button>
            )}
          </div>
        }
      />

      {/* Summary section */}
      <RunSummary run={run} target={target} />

      {/* Live Polling Banner if running */}
      {isRunning && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 flex items-center justify-between text-xs text-blue-900 animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-700 animate-ping" />
            <span className="font-medium">
              Checks currently in progress &bull; Auto-refreshing status every 2 seconds
            </span>
          </div>
          <span className="font-mono font-semibold">Live Telemetry</span>
        </div>
      )}

      {/* Checks breakdown section */}
      <section className="space-y-3" aria-labelledby="checks-section-heading">
        <div className="flex items-center justify-between">
          <h2 id="checks-section-heading" className="text-lg font-bold text-brand-900">
            Validated Deployment Checks ({run.check_results.length})
          </h2>
          <span className="text-xs text-muted font-mono">
            {run.check_results.filter((c) => c.status === 'PASS').length} passing of {run.check_results.length} total
          </span>
        </div>

        {run.check_results.length === 0 ? (
          <div className="p-8 text-center bg-surface rounded-xl border border-nx-border text-muted text-sm">
            {isRunning
              ? 'Evaluating cloud endpoint rules, please stand by...'
              : 'No check results were produced by this run.'}
          </div>
        ) : (
          <CheckList checks={run.check_results} />
        )}
      </section>
    </div>
  );
};
