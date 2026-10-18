import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Play, Globe, Shield, Clock } from 'lucide-react';
import { Target } from '../../lib/types';
import { ENVIRONMENT_CONFIG } from '../../lib/constants';
import { formatRelativeTime, cn } from '../../lib/utils';
import { StatusBadge } from '../common/StatusBadge';

interface TargetCardProps {
  target: Target;
  onRunCheck?: (targetId: string) => Promise<void>;
}

export const TargetCard: React.FC<TargetCardProps> = ({ target, onRunCheck }) => {
  const [isRunning, setIsRunning] = useState(false);
  const envConfig = ENVIRONMENT_CONFIG[target.environment] || ENVIRONMENT_CONFIG.dev;

  const handleValidate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onRunCheck || isRunning) return;
    setIsRunning(true);
    try {
      await onRunCheck(target.target_id);
    } finally {
      setIsRunning(false);
    }
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'text-muted';
    if (score >= 80) return 'text-[#18794E]';
    if (score >= 60) return 'text-[#9A6700]';
    return 'text-[#B42318]';
  };

  return (
    <div className="bg-surface rounded-xl border border-nx-border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top row: Environment badge + Last evaluated */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase border tracking-wider',
              envConfig.bgClass,
              envConfig.textClass,
              envConfig.borderClass
            )}
          >
            {envConfig.label}
          </span>

          <div className="flex items-center gap-1 text-[11px] text-muted font-mono">
            <Clock className="w-3 h-3 text-muted/70" />
            <span>{formatRelativeTime(target.last_run_time || target.updated_at)}</span>
          </div>
        </div>

        {/* Target Name + URL */}
        <Link
          to={`/targets/${target.target_id}`}
          className="block group-hover:text-brand-700 transition-colors"
        >
          <h3 className="text-base font-bold text-brand-900 group-hover:text-brand-700 leading-snug line-clamp-1">
            {target.display_name}
          </h3>
        </Link>

        <a
          href={target.base_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center gap-1.5 text-xs text-muted font-mono hover:text-brand-700 transition-colors truncate"
        >
          <Globe className="w-3.5 h-3.5 shrink-0 text-muted/80" />
          <span className="truncate">{target.base_url}</span>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
        </a>

        {/* Expected Host & Marker Tag */}
        <div className="mt-3.5 pt-3 border-t border-nx-border/50 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted">
            <span>Expected Host:</span>
            <span className="font-mono text-nx-text text-[11px] truncate max-w-[150px]">
              {target.expected_host}
            </span>
          </div>
          {target.expected_version_marker && (
            <div className="flex items-center justify-between text-muted">
              <span>Version Marker:</span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 text-nx-text truncate max-w-[140px]">
                {target.expected_version_marker}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: Score & Action button */}
      <div className="mt-5 pt-4 border-t border-nx-border/60 flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-muted uppercase font-mono tracking-wider">Score:</span>
          {target.last_run_score !== undefined ? (
            <span className={cn('text-xl font-bold font-mono tracking-tight', getScoreColor(target.last_run_score))}>
              {target.last_run_score}
              <span className="text-xs text-muted font-medium">/100</span>
            </span>
          ) : (
            <span className="text-sm font-mono text-muted">Not run</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {target.last_run_status && (
            <StatusBadge status={target.last_run_status} size="sm" showIcon={false} />
          )}

          {onRunCheck && (
            <button
              type="button"
              onClick={handleValidate}
              disabled={isRunning}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 disabled:opacity-60"
              title="Run validation checks"
            >
              <Play className={cn('w-3 h-3', isRunning && 'animate-spin')} />
              <span>{isRunning ? 'Running...' : 'Validate'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
