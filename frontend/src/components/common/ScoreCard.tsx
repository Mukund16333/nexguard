import React from 'react';
import { cn } from '../../lib/utils';
import { ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

interface ScoreCardProps {
  score?: number;
  coverage?: number;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  coverage = 100,
  title = 'Reliability & Security Score',
  size = 'md',
  className,
}) => {
  const hasScore = score !== undefined && score !== null;

  const getScoreTheme = (s?: number) => {
    if (s === undefined || s === null) {
      return {
        text: 'text-muted',
        border: 'border-nx-border',
        bg: 'bg-neutral-50',
        badgeBg: 'bg-neutral-200 text-muted',
        statusLabel: 'Pending evaluation',
        icon: <AlertCircle className="w-4 h-4 text-muted" />,
      };
    }
    if (s >= 80) {
      return {
        text: 'text-[#18794E]',
        border: 'border-[#18794E]/25',
        bg: 'bg-[#F4FBF7]',
        badgeBg: 'bg-[#E6F4EA] text-[#18794E]',
        statusLabel: 'Deployment compliant',
        icon: <ShieldCheck className="w-4 h-4 text-[#18794E]" />,
      };
    }
    if (s >= 60) {
      return {
        text: 'text-[#9A6700]',
        border: 'border-[#9A6700]/25',
        bg: 'bg-[#FFFDF5]',
        badgeBg: 'bg-[#FEF3D6] text-[#9A6700]',
        statusLabel: 'Warnings detected',
        icon: <AlertTriangle className="w-4 h-4 text-[#9A6700]" />,
      };
    }
    return {
      text: 'text-[#B42318]',
      border: 'border-[#B42318]/25',
      bg: 'bg-[#FEF7F7]',
      badgeBg: 'bg-[#FEE4E2] text-[#B42318]',
      statusLabel: 'Action required',
      icon: <AlertCircle className="w-4 h-4 text-[#B42318]" />,
    };
  };

  const theme = getScoreTheme(score);

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-5 shadow-sm transition-all',
        theme.border,
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b border-nx-border/60">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {title}
        </h4>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
          {theme.icon}
          <span>{theme.statusLabel}</span>
        </div>
      </div>

      <div className="pt-4 flex items-baseline gap-2">
        {hasScore ? (
          <>
            <span
              className={cn(
                'font-mono font-bold tracking-tight',
                size === 'lg' ? 'text-5xl' : size === 'sm' ? 'text-3xl' : 'text-4xl',
                theme.text
              )}
            >
              {score}
            </span>
            <span className="text-sm font-medium text-muted">/100</span>
          </>
        ) : (
          <span className="text-3xl font-mono font-semibold text-muted">—</span>
        )}
      </div>

      {/* Never show score without coverage context per specification */}
      <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-nx-border/40">
        <span className="text-muted">Rule Coverage</span>
        <span className="font-mono font-semibold text-nx-text">
          {hasScore ? `${Math.round(coverage)}% evaluated` : 'Pending execution'}
        </span>
      </div>

      {/* Visual progress bar */}
      <div className="mt-2 w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            score && score >= 80 ? 'bg-[#18794E]' : score && score >= 60 ? 'bg-[#9A6700]' : 'bg-[#B42318]'
          )}
          style={{ width: `${hasScore ? Math.min(100, Math.max(0, score || 0)) : 0}%` }}
        />
      </div>
    </div>
  );
};
