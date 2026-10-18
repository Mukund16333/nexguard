import { useState, useEffect, useCallback } from 'react';
import { Target, TargetCreateInput, TargetUpdateInput } from '../lib/types';
import { targetsApi } from '../api/targets';

export function useTargets() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await targetsApi.getAll();
      setTargets(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch targets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const createTarget = async (input: TargetCreateInput): Promise<Target> => {
    const created = await targetsApi.create(input);
    setTargets((prev) => [created, ...prev]);
    return created;
  };

  const updateTarget = async (targetId: string, input: TargetUpdateInput): Promise<Target> => {
    const updated = await targetsApi.update(targetId, input);
    setTargets((prev) => prev.map((t) => (t.target_id === targetId ? updated : t)));
    return updated;
  };

  const deleteTarget = async (targetId: string): Promise<void> => {
    await targetsApi.delete(targetId);
    setTargets((prev) => prev.filter((t) => t.target_id !== targetId));
  };

  return {
    targets,
    loading,
    error,
    refresh: fetchTargets,
    createTarget,
    updateTarget,
    deleteTarget,
  };
}
