import React from 'react';
import { Link } from 'react-router-dom';
import { useTargets } from '../hooks/useTargets';
import { useRuns } from '../hooks/useRuns';
import { TargetList } from '../components/targets/TargetList';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { Plus } from 'lucide-react';

export const TargetsPage: React.FC = () => {
  const { targets, loading, error, refresh: refreshTargets } = useTargets();
  const { triggerRun } = useRuns();

  const handleRunCheck = async (targetId: string) => {
    await triggerRun(targetId);
    await refreshTargets();
  };

  if (loading && targets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Deployment Targets"
          subtitle="Manage cloud applications, gateways, and edge endpoints"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Targets' }]}
        />
        <LoadingState rows={6} type="card" />
      </div>
    );
  }

  if (error && targets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Deployment Targets"
          subtitle="Manage cloud applications, gateways, and edge endpoints"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Targets' }]}
        />
        <ErrorState
          title="Failed to fetch deployment targets"
          message={error}
          onRetry={refreshTargets}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deployment Targets"
        subtitle="Manage cloud applications, gateways, and edge endpoints under automated inspection"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Targets' }]}
        actions={
          <Link
            to="/targets/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register Target</span>
          </Link>
        }
      />

      <TargetList
        targets={targets}
        onRunCheck={handleRunCheck}
      />
    </div>
  );
};
