import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { targetsApi } from '../api/targets';
import { Target, Run } from '../lib/types';
import { useRuns } from '../hooks/useRuns';
import { PageHeader } from '../components/common/PageHeader';
import { ScoreCard } from '../components/common/ScoreCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { RunHistory } from '../components/runs/RunHistory';
import { CheckList } from '../components/checks/CheckList';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { ENVIRONMENT_CONFIG } from '../lib/constants';
import { formatDateTime, cn } from '../lib/utils';
import { Globe, Server, Hash, Shield, Play, Trash2, ExternalLink, Calendar, RefreshCw } from 'lucide-react';

export const TargetDetailPage: React.FC = () => {
  const { targetId } = useParams<{ targetId: string }>();
  const navigate = useNavigate();

  const [target, setTarget] = useState<Target | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const { runs, refresh: refreshRuns, triggerRun } = useRuns(targetId);

  const fetchTarget = async () => {
    if (!targetId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await targetsApi.getById(targetId);
      setTarget(data);
    } catch (err: any) {
      setError(err?.message || 'Target not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTarget();
  }, [targetId]);

  const handleTriggerRun = async () => {
    if (!targetId || isTriggering) return;
    setIsTriggering(true);
    try {
      const newRun = await triggerRun(targetId);
      await fetchTarget();
      await refreshRuns();
      // Navigate to the newly triggered run detail page
      navigate(`/runs/${newRun.run_id}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleDeleteTarget = async () => {
    if (!targetId) return;
    setIsDeleting(true);
    try {
      await targetsApi.delete(targetId);
      navigate('/targets');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete target');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Target Details"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Targets', href: '/targets' }, { label: 'Loading...' }]}
        />
        <LoadingState type="detail" />
      </div>
    );
  }

  if (error || !target) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Target Details"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Targets', href: '/targets' }, { label: 'Error' }]}
        />
        <ErrorState
          title="Unable to load target details"
          message={error || 'The requested target does not exist.'}
          onRetry={fetchTarget}
        />
      </div>
    );
  }

  const envConfig = ENVIRONMENT_CONFIG[target.environment] || ENVIRONMENT_CONFIG.dev;
  const latestRun = runs[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={target.display_name}
        subtitle={target.base_url}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Targets', href: '/targets' },
          { label: target.display_name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerRun}
              disabled={isTriggering}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
            >
              <Play className={cn('w-3.5 h-3.5', isTriggering && 'animate-spin')} />
              <span>{isTriggering ? 'Starting Run...' : 'Run Validation'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="p-2 border border-nx-border bg-surface hover:bg-status-fail-bg hover:text-status-fail hover:border-status-fail/30 rounded-lg text-muted transition-colors"
              title="Delete Target"
              aria-label="Delete target"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Target Details Grid & Latest Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ScoreCard
          score={latestRun?.score ?? target.last_run_score}
          coverage={latestRun?.coverage ?? 100}
          title="Current Compliance Score"
          size="lg"
          className="lg:col-span-1"
        />

        {/* Configuration Profile */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-nx-border p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-nx-border/60">
              <span className="text-xs font-bold text-brand-900 uppercase tracking-wide">
                Target Configuration Profile
              </span>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase border tracking-wider',
                  envConfig.bgClass,
                  envConfig.textClass,
                  envConfig.borderClass
                )}
              >
                {envConfig.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted block text-[11px] uppercase tracking-wider font-mono">
                  Base URL
                </span>
                <a
                  href={target.base_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-brand-700 hover:underline flex items-center gap-1 truncate"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{target.base_url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>

              <div className="space-y-1">
                <span className="text-muted block text-[11px] uppercase tracking-wider font-mono">
                  Expected Host
                </span>
                <span className="font-mono text-nx-text flex items-center gap-1 truncate">
                  <Server className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="truncate">{target.expected_host}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-muted block text-[11px] uppercase tracking-wider font-mono">
                  Version Marker
                </span>
                <span className="font-mono text-nx-text flex items-center gap-1 truncate">
                  <Hash className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span>{target.expected_version_marker || 'None specified'}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-muted block text-[11px] uppercase tracking-wider font-mono">
                  Origin Server URL
                </span>
                <span className="font-mono text-nx-text truncate block">
                  {target.origin_url || 'Protected behind Edge Ingress'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-nx-border/50 flex items-center justify-between text-xs text-muted font-mono">
            <span>Created {formatDateTime(target.created_at)}</span>
            <span>ID: {target.target_id}</span>
          </div>
        </div>
      </div>

      {/* Latest Evaluation Breakdown if runs exist */}
      {latestRun && latestRun.check_results.length > 0 && (
        <section aria-labelledby="latest-checks-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="latest-checks-heading" className="text-base font-bold text-brand-900">
                Latest Evaluation Checks ({latestRun.run_id})
              </h2>
              <p className="text-xs text-muted">
                Run completed {formatDateTime(latestRun.completed_at || latestRun.started_at)}
              </p>
            </div>
            <Link
              to={`/runs/${latestRun.run_id}`}
              className="text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
            >
              View Full Run Detail &rarr;
            </Link>
          </div>

          <CheckList checks={latestRun.check_results} />
        </section>
      )}

      {/* Run History List */}
      <section aria-labelledby="target-history-heading">
        <RunHistory
          runs={runs}
          onTriggerRun={handleTriggerRun}
          isTriggering={isTriggering}
        />
      </section>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={`Delete Target "${target.display_name}"?`}
        message="This action will delete the deployment target and historical validation results associated with it. This action cannot be undone."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Target'}
        cancelLabel="Keep Target"
        variant="danger"
        onConfirm={handleDeleteTarget}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
