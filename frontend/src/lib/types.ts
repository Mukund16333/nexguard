export type CheckStatus = 'PASS' | 'WARNING' | 'FAIL' | 'SKIPPED' | 'ERROR';
export type Environment = 'dev' | 'staging' | 'prod';
export type RunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Target {
  target_id: string;
  owner_id: string;
  display_name: string;
  base_url: string;
  environment: Environment;
  expected_host: string;
  expected_version_marker?: string;
  origin_url?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Computed / UI helper fields
  last_run_score?: number;
  last_run_status?: RunStatus;
  last_run_time?: string;
  total_runs?: number;
}

export interface CheckResult {
  check_id: string;
  category: string;
  status: CheckStatus;
  weight: number;
  started_at: string;
  duration_ms: number;
  summary: string;
  expected?: string;
  observed?: string;
  evidence: Record<string, any>;
  remediation?: string;
  rule_version: string;
}

export interface Run {
  run_id: string;
  target_id: string;
  owner_id: string;
  status: RunStatus;
  started_at: string;
  completed_at?: string;
  score?: number;
  coverage?: number;
  ruleset_version: string;
  app_version: string;
  check_results: CheckResult[];
  report_key?: string;
  duration_ms?: number;
}

export interface TargetCreateInput {
  display_name: string;
  base_url: string;
  environment: Environment;
  expected_host: string;
  expected_version_marker?: string;
  origin_url?: string;
}

export interface TargetUpdateInput {
  display_name?: string;
  base_url?: string;
  environment?: Environment;
  expected_host?: string;
  expected_version_marker?: string;
  origin_url?: string;
}

export interface ScoreTrendPoint {
  run_id: string;
  timestamp: string;
  date_label: string;
  score: number;
  coverage: number;
  environment: Environment;
  target_name?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  refresh_interval_sec: number;
  email_notifications: boolean;
  webhook_url?: string;
  default_environment: Environment;
  show_skipped_checks: boolean;
  api_key_masked: string;
}
