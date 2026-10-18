import { apiClient } from './client';
import { Run, CheckResult, RunStatus } from '../lib/types';
import { MOCK_RUNS } from '../lib/mockData';

const LOCAL_STORAGE_RUNS_KEY = 'nexguard_mock_runs';

function getStoredRuns(): Record<string, Run> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RUNS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse cached runs', e);
  }
  localStorage.setItem(LOCAL_STORAGE_RUNS_KEY, JSON.stringify(MOCK_RUNS));
  return { ...MOCK_RUNS };
}

function saveStoredRuns(runs: Record<string, Run>): void {
  localStorage.setItem(LOCAL_STORAGE_RUNS_KEY, JSON.stringify(runs));
}

export const runsApi = {
  async getAll(): Promise<Run[]> {
    try {
      const response = await apiClient.get<Run[]>('/api/v1/runs');
      return response.data;
    } catch {
      const stored = getStoredRuns();
      return Object.values(stored).sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
    }
  },

  async getById(runId: string): Promise<Run> {
    try {
      const response = await apiClient.get<Run>(`/api/v1/runs/${runId}`);
      return response.data;
    } catch {
      const stored = getStoredRuns();
      const match = stored[runId];
      if (match) return match;
      throw new Error(`Run ${runId} not found`);
    }
  },

  async triggerRun(targetId: string): Promise<Run> {
    try {
      const response = await apiClient.post<Run>('/api/v1/runs', { target_id: targetId });
      return response.data;
    } catch {
      const runId = `run-${Date.now().toString(36)}`;
      const newRun: Run = {
        run_id: runId,
        target_id: targetId,
        owner_id: 'usr-current',
        status: 'running',
        started_at: new Date().toISOString(),
        score: undefined,
        coverage: 0,
        ruleset_version: 'nexguard-rules-v2.8.4',
        app_version: 'v2.14.0-rc',
        check_results: [],
      };

      const stored = getStoredRuns();
      stored[runId] = newRun;
      saveStoredRuns(stored);

      // Simulate asynchronous completion for mock flow
      setTimeout(() => {
        const simulatedChecks: CheckResult[] = [
          {
            check_id: 'SEC-TLS-001',
            category: 'TLS & Certificate Security',
            status: 'PASS',
            weight: 15,
            started_at: new Date().toISOString(),
            duration_ms: 290,
            summary: 'TLS 1.3 negotiated with strong cipher suites and valid certificate chain.',
            expected: 'TLS 1.2+ and certificate valid > 30 days',
            observed: 'TLS 1.3, valid for 65 days',
            evidence: { protocol: 'TLSv1.3', cipher: 'TLS_AES_256_GCM_SHA384', days_remaining: 65 },
            remediation: 'Certificate is healthy and automated renewal is enabled.',
            rule_version: '1.4.0',
          },
          {
            check_id: 'SEC-HDR-001',
            category: 'HTTP Security Headers',
            status: 'PASS',
            weight: 10,
            started_at: new Date().toISOString(),
            duration_ms: 140,
            summary: 'Strict-Transport-Security header present with includeSubDomains.',
            expected: 'max-age >= 31536000; includeSubDomains',
            observed: 'max-age=63072000; includeSubDomains',
            evidence: { header: 'Strict-Transport-Security', max_age: 63072000 },
            rule_version: '2.1.0',
          },
          {
            check_id: 'SEC-HDR-002',
            category: 'HTTP Security Headers',
            status: 'WARNING',
            weight: 10,
            started_at: new Date().toISOString(),
            duration_ms: 130,
            summary: 'Content-Security-Policy contains unsafe-eval directive.',
            expected: 'No unsafe-eval directive',
            observed: "script-src 'self' 'unsafe-eval'",
            evidence: { directive: 'script-src', issue: 'unsafe-eval permitted' },
            remediation: 'Refactor client bundle to eliminate dynamic eval expressions.',
            rule_version: '3.0.2',
          },
          {
            check_id: 'NET-DNS-001',
            category: 'DNS & Origin Routing',
            status: 'PASS',
            weight: 15,
            started_at: new Date().toISOString(),
            duration_ms: 380,
            summary: 'DNS CNAME resolves to CloudFront edge distribution.',
            expected: 'Resolves to protected edge distribution',
            observed: 'Target resolves to AWS CloudFront distribution',
            evidence: { type: 'CNAME', target: 'd3ab91029c.cloudfront.net' },
            rule_version: '1.1.0',
          },
          {
            check_id: 'WAF-EDGE-001',
            category: 'WAF & Edge Protection',
            status: 'PASS',
            weight: 15,
            started_at: new Date().toISOString(),
            duration_ms: 550,
            summary: 'Active WAF blocking synthetic injection probe.',
            expected: 'HTTP 403 Forbidden',
            observed: 'HTTP 403 Forbidden (WAFBlock)',
            evidence: { test_probe: 'SQLI_UNION_SELECT', http_status: 403 },
            rule_version: '2.4.1',
          },
        ];

        const updatedRuns = getStoredRuns();
        if (updatedRuns[runId]) {
          updatedRuns[runId] = {
            ...updatedRuns[runId],
            status: 'completed' as RunStatus,
            completed_at: new Date().toISOString(),
            duration_ms: 28400,
            score: 88,
            coverage: 100,
            check_results: simulatedChecks,
            report_key: `reports/${runId}.json`,
          };
          saveStoredRuns(updatedRuns);
        }
      }, 4000);

      return newRun;
    }
  },

  async cancelRun(runId: string): Promise<Run> {
    try {
      const response = await apiClient.post<Run>(`/api/v1/runs/${runId}/cancel`);
      return response.data;
    } catch {
      const stored = getStoredRuns();
      if (stored[runId]) {
        stored[runId] = {
          ...stored[runId],
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        };
        saveStoredRuns(stored);
        return stored[runId];
      }
      throw new Error(`Run ${runId} not found`);
    }
  },
};
