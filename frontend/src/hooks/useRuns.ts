import { useState, useEffect, useCallback, useRef } from 'react';
import { Run } from '../lib/types';
import { runsApi } from '../api/runs';

export function useRuns(targetId?: string) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runsApi.getAll();
      const filtered = targetId ? data.filter((r) => r.target_id === targetId) : data;
      setRuns(filtered);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch runs');
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const triggerRun = async (tId: string): Promise<Run> => {
    const newRun = await runsApi.triggerRun(tId);
    setRuns((prev) => [newRun, ...prev]);
    return newRun;
  };

  return {
    runs,
    loading,
    error,
    refresh: fetchRuns,
    triggerRun,
  };
}

export function useRunDetail(runId?: string) {
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRun = useCallback(async (isPolling = false) => {
    if (!runId) return;
    if (!isPolling) setLoading(true);
    setError(null);
    try {
      const data = await runsApi.getById(runId);
      setRun(data);
      return data;
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch run details');
      return null;
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchRun(false);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [fetchRun]);

  // Polling logic: poll GET /api/v1/runs/{id} every 2 seconds while status is 'queued' or 'running'
  useEffect(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (run && (run.status === 'queued' || run.status === 'running')) {
      pollTimerRef.current = setInterval(async () => {
        const updated = await fetchRun(true);
        if (updated && updated.status !== 'queued' && updated.status !== 'running') {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        }
      }, 2000);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [run?.status, fetchRun]);

  const cancelRun = async () => {
    if (!runId) return;
    try {
      const updated = await runsApi.cancelRun(runId);
      setRun(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel run');
    }
  };

  return {
    run,
    loading,
    error,
    refresh: () => fetchRun(false),
    cancelRun,
  };
}
