import React from 'react';
import { Link } from 'react-router-dom';
import { useTargets } from '../hooks/useTargets';
import { useRuns } from '../hooks/useRuns';
import { ScoreHistory } from '../components/reports/ScoreHistory';
import { TargetCard } from '../components/targets/TargetCard';
import { RunHistory } from '../components/runs/RunHistory';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { MOCK_SCORE_HISTORY } from '../lib/mockData';
import { ShieldCheck, Plus, AlertTriangle, Activity, CheckCircle2, ArrowRight } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { targets, loading: targetsLoading, error: targetsError, refresh: refreshTargets } = useTargets();
  const { runs, loading: runsLoading, error: runsError, triggerRun, refresh: refreshRuns } = useRuns();

  const loading = targetsLoading || runsLoading;
  const error = targetsError || runsError;

  // Calculate quick stats
  const totalTargets = targets.length;
  const compliantTargets = targets.filter((t) => (t.last_run_score || 0) >= 80).length;
  const warningTargets = targets.filter(
    (t) => (t.last_run_score || 0) >= 60 && (t.last_run_score || 0) < 80
  ).length;
  const failingTargets = targets.filter(
    (t) => t.last_run_score !== undefined && (t.last_run_score || 0) < 60
  ).length;

  const averageScore = targets.length > 0
    ? Math.round(
        targets.reduce((acc, t) => acc + (t.last_run_score || 0), 0) /
          Math.max(1, targets.filter((t) => t.last_run_score !== undefined).length)
      )
    : 0;

  const handleRunCheck = async (targetId: string) => {
    await triggerRun(targetId);
    await refreshTargets();
    await refreshRuns();
  };

  if (loading && targets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Security & Reliability Dashboard"
          subtitle="Continuous posture validation for cloud deployment configurations"
        />
        <LoadingState rows={3} type="card" />
      </div>
    );
  }

  if (error && targets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Security & Reliability Dashboard"
          subtitle="Continuous posture validation for cloud deployment configurations"
        />
        <ErrorState
          title="Unable to load dashboard telemetry"
          message={error}
          onRetry={() => {
            refreshTargets();
            refreshRuns();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security & Reliability Dashboard"
        subtitle="Continuous validation of TLS, origin routing, security headers, and edge WAF posture"
        actions={
          <Link
            to="/targets/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Target</span>
          </Link>
        }
      />

      {/* Quick Stats Grid */}
      <section aria-labelledby="quick-stats-heading">
        <h2 id="quick-stats-heading" className="sr-only">Platform Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Average Score */}
          <div className="bg-surface rounded-xl border border-nx-border p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
              Average Reliability Score
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold font-mono text-brand-900">{averageScore}</span>
              <span className="text-xs font-medium text-muted">/100</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#18794E]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{compliantTargets} compliant endpoints</span>
            </div>
          </div>

          {/* Active Targets */}
          <div className="bg-surface rounded-xl border border-nx-border p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
              Monitored Targets
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold font-mono text-brand-900">{totalTargets}</span>
              <span className="text-xs font-medium text-muted">endpoints</span>
            </div>
            <div className="mt-3 text-xs text-muted font-mono">
              PROD &middot; STAGING &middot; DEV
            </div>
          </div>

          {/* Warning / Issues */}
          <div className="bg-surface rounded-xl border border-nx-border p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
              Deviations &amp; Warnings
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold font-mono text-[#9A6700]">{warningTargets + failingTargets}</span>
              <span className="text-xs font-medium text-muted">targets affected</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#9A6700]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{failingTargets} critical fail &bull; {warningTargets} warn</span>
            </div>
          </div>

          {/* Total Validation Runs */}
          <div className="bg-surface rounded-xl border border-nx-border p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
              Validation Runs
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold font-mono text-brand-900">{runs.length}</span>
              <span className="text-xs font-medium text-muted">recorded runs</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
              <Activity className="w-3.5 h-3.5 text-accent-500" />
              <span>Policy ruleset v2.8.4</span>
            </div>
          </div>
        </div>
      </section>

      {/* Score Trend History Chart */}
      <section aria-labelledby="trend-heading">
        <ScoreHistory data={MOCK_SCORE_HISTORY} />
      </section>

      {/* Monitored Deployment Targets */}
      <section aria-labelledby="monitored-targets-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="monitored-targets-heading" className="text-lg font-bold text-brand-900">
              Monitored Deployment Targets
            </h2>
            <p className="text-xs text-muted">
              Endpoints continuously assessed for TLS, DNS, WAF, and HTTP security posture
            </p>
          </div>
          <Link
            to="/targets"
            className="text-xs font-semibold text-brand-700 hover:text-brand-900 inline-flex items-center gap-1 transition-colors"
          >
            <span>View All Targets ({targets.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {targets.slice(0, 3).map((target) => (
            <TargetCard
              key={target.target_id}
              target={target}
              onRunCheck={handleRunCheck}
            />
          ))}
        </div>
      </section>

      {/* Recent Validation Runs */}
      <section aria-labelledby="recent-runs-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="recent-runs-heading" className="text-lg font-bold text-brand-900">
              Recent Validation Runs
            </h2>
            <p className="text-xs text-muted">
              Latest execution logs with expandable check evidence and score breakdown
            </p>
          </div>
        </div>

        <RunHistory runs={runs.slice(0, 5)} />
      </section>
    </div>
  );
};
