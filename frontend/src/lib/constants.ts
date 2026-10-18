import { CheckStatus, Environment, RunStatus } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const STATUS_CONFIG: Record<
  CheckStatus,
  { label: string; textClass: string; bgClass: string; borderClass: string }
> = {
  PASS: {
    label: 'PASS',
    textClass: 'text-status-pass',
    bgClass: 'bg-status-pass-bg',
    borderClass: 'border-status-pass/30',
  },
  WARNING: {
    label: 'WARNING',
    textClass: 'text-status-warning',
    bgClass: 'bg-status-warning-bg',
    borderClass: 'border-status-warning/30',
  },
  FAIL: {
    label: 'FAIL',
    textClass: 'text-status-fail',
    bgClass: 'bg-status-fail-bg',
    borderClass: 'border-status-fail/30',
  },
  SKIPPED: {
    label: 'SKIPPED',
    textClass: 'text-status-skipped',
    bgClass: 'bg-status-skipped-bg',
    borderClass: 'border-status-skipped/30',
  },
  ERROR: {
    label: 'ERROR',
    textClass: 'text-status-fail',
    bgClass: 'bg-status-fail-bg',
    borderClass: 'border-status-fail/30',
  },
};

export const RUN_STATUS_CONFIG: Record<
  RunStatus,
  { label: string; textClass: string; bgClass: string; dotClass: string }
> = {
  queued: {
    label: 'QUEUED',
    textClass: 'text-muted',
    bgClass: 'bg-neutral-100',
    dotClass: 'bg-muted',
  },
  running: {
    label: 'RUNNING',
    textClass: 'text-status-info',
    bgClass: 'bg-status-info-bg',
    dotClass: 'bg-status-info animate-ping',
  },
  completed: {
    label: 'COMPLETED',
    textClass: 'text-status-pass',
    bgClass: 'bg-status-pass-bg',
    dotClass: 'bg-status-pass',
  },
  failed: {
    label: 'FAILED',
    textClass: 'text-status-fail',
    bgClass: 'bg-status-fail-bg',
    dotClass: 'bg-status-fail',
  },
  cancelled: {
    label: 'CANCELLED',
    textClass: 'text-muted',
    bgClass: 'bg-neutral-100',
    dotClass: 'bg-neutral-400',
  },
};

export const ENVIRONMENT_CONFIG: Record<
  Environment,
  { label: string; textClass: string; bgClass: string; borderClass: string }
> = {
  prod: {
    label: 'PROD',
    textClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
  },
  staging: {
    label: 'STAGING',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  dev: {
    label: 'DEV',
    textClass: 'text-neutral-700',
    bgClass: 'bg-neutral-100',
    borderClass: 'border-neutral-200',
  },
};

export const DEFAULT_CHECK_CATEGORIES = [
  'TLS & Certificate Security',
  'HTTP Security Headers',
  'DNS & Origin Routing',
  'WAF & Edge Protection',
  'Cache & Invalidation Behavior',
  'Zero Trust & Access Control',
  'Health Check & Reliability',
];
