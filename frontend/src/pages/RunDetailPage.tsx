import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRunDetail } from '../hooks/useRuns';
import { targetsApi } from '../api/targets';
import { Target } from '../lib/types';
import { RunDetail } from '../components/runs/RunDetail';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { PageHeader } from '../components/common/PageHeader';

export const RunDetailPage: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const { run, loading, error, refresh, cancelRun } = useRunDetail(runId);
  const [target, setTarget] = useState<Target | undefined>(undefined);

  useEffect(() => {
    if (run?.target_id) {
      targetsApi
        .getById(run.target_id)
        .then((t) => setTarget(t))
        .catch(() => {
          // target may not exist or offline
        });
    }
  }, [run?.target_id]);

  if (loading && !run) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Validation Run"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Runs' },
            { label: runId || 'Loading...' },
          ]}
        />
        <LoadingState type="detail" />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Validation Run"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Runs' },
            { label: runId || 'Error' },
          ]}
        />
        <ErrorState
          title="Unable to load validation run"
          message={error || `Validation run "${runId}" could not be located.`}
          onRetry={refresh}
        />
      </div>
    );
  }

  return (
    <RunDetail
      run={run}
      target={target}
      onRefresh={refresh}
      onCancel={cancelRun}
    />
  );
};
