import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return format(d, 'MMM d, yyyy HH:mm:ss');
  } catch {
    return isoString;
  }
}

export function formatDateShort(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return format(d, 'MMM d, HH:mm');
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return 'Never';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return isoString;
  }
}

export function formatDuration(durationMs?: number): string {
  if (durationMs === undefined || durationMs === null) return '—';
  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }
  return `${(durationMs / 1000).toFixed(2)} s`;
}

export function getScoreColor(score?: number): string {
  if (score === undefined || score === null) return 'text-muted';
  if (score >= 80) return 'text-status-pass';
  if (score >= 60) return 'text-status-warning';
  return 'text-status-fail';
}

export function getScoreBg(score?: number): string {
  if (score === undefined || score === null) return 'bg-neutral-100 text-muted';
  if (score >= 80) return 'bg-status-pass-bg text-status-pass border-status-pass/30';
  if (score >= 60) return 'bg-status-warning-bg text-status-warning border-status-warning/30';
  return 'bg-status-fail-bg text-status-fail border-status-fail/30';
}

export function downloadJsonFile(filename: string, data: unknown): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadHtmlFile(filename: string, htmlContent: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
