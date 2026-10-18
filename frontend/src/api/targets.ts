import { apiClient } from './client';
import { Target, TargetCreateInput, TargetUpdateInput, Run } from '../lib/types';
import { INITIAL_TARGETS, MOCK_RUNS } from '../lib/mockData';

// Local storage cache key for targets when operating in standalone/demo mode
const LOCAL_STORAGE_KEY = 'nexguard_mock_targets';

function getStoredTargets(): Target[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse cached targets', e);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_TARGETS));
  return INITIAL_TARGETS;
}

function saveStoredTargets(targets: Target[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(targets));
}

export const targetsApi = {
  async getAll(): Promise<Target[]> {
    try {
      const response = await apiClient.get<Target[]>('/api/v1/targets');
      return response.data;
    } catch {
      // Graceful fallback to mock/local storage if backend is offline
      return getStoredTargets();
    }
  },

  async getById(targetId: string): Promise<Target> {
    try {
      const response = await apiClient.get<Target>(`/api/v1/targets/${targetId}`);
      return response.data;
    } catch {
      const targets = getStoredTargets();
      const match = targets.find((t) => t.target_id === targetId);
      if (match) return match;
      throw new Error(`Target ${targetId} not found`);
    }
  },

  async create(input: TargetCreateInput): Promise<Target> {
    try {
      const response = await apiClient.post<Target>('/api/v1/targets', input);
      return response.data;
    } catch {
      const newTarget: Target = {
        target_id: `tgt-${Date.now().toString(36)}`,
        owner_id: 'usr-current',
        display_name: input.display_name,
        base_url: input.base_url,
        environment: input.environment,
        expected_host: input.expected_host,
        expected_version_marker: input.expected_version_marker,
        origin_url: input.origin_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_run_score: undefined,
        last_run_status: undefined,
        total_runs: 0,
      };
      const targets = [newTarget, ...getStoredTargets()];
      saveStoredTargets(targets);
      return newTarget;
    }
  },

  async update(targetId: string, input: TargetUpdateInput): Promise<Target> {
    try {
      const response = await apiClient.put<Target>(`/api/v1/targets/${targetId}`, input);
      return response.data;
    } catch {
      const targets = getStoredTargets();
      const index = targets.findIndex((t) => t.target_id === targetId);
      if (index === -1) throw new Error(`Target ${targetId} not found`);
      const updated: Target = {
        ...targets[index],
        ...input,
        updated_at: new Date().toISOString(),
      };
      targets[index] = updated;
      saveStoredTargets(targets);
      return updated;
    }
  },

  async delete(targetId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/targets/${targetId}`);
    } catch {
      const targets = getStoredTargets().filter((t) => t.target_id !== targetId);
      saveStoredTargets(targets);
    }
  },

  async getRunsForTarget(targetId: string): Promise<Run[]> {
    try {
      const response = await apiClient.get<Run[]>(`/api/v1/targets/${targetId}/runs`);
      return response.data;
    } catch {
      // Find matching mock runs
      const runs = Object.values(MOCK_RUNS).filter((r) => r.target_id === targetId);
      return runs;
    }
  },
};
