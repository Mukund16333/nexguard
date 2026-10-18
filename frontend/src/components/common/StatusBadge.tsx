import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle, AlertOctagon, Loader2 } from 'lucide-react';
import { CheckStatus, RunStatus } from '../../lib/types';
import { cn } from '../../lib/utils';

export type BadgeStatus = CheckStatus | RunStatus;

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className,
  showIcon = true,
}) => {
  const normalized = status.toUpperCase();

  const getStatusDetails = () => {
    switch (normalized) {
      case 'PASS':
      case 'COMPLETED':
        return {
          label: normalized === 'COMPLETED' ? 'COMPLETED' : 'PASS',
          icon: <CheckCircle2 className="shrink-0" />,
          classes: 'bg-[#E6F4EA] text-[#18794E] border border-[#18794E]/25',
        };
      case 'WARNING':
        return {
          label: 'WARNING',
          icon: <AlertTriangle className="shrink-0" />,
          classes: 'bg-[#FEF3D6] text-[#9A6700] border border-[#9A6700]/25',
        };
      case 'FAIL':
      case 'FAILED':
        return {
          label: normalized === 'FAILED' ? 'FAILED' : 'FAIL',
          icon: <XCircle className="shrink-0" />,
          classes: 'bg-[#FEE4E2] text-[#B42318] border border-[#B42318]/25',
        };
      case 'ERROR':
        return {
          label: 'ERROR',
          icon: <AlertOctagon className="shrink-0" />,
          classes: 'bg-[#FEE4E2] text-[#B42318] border border-[#B42318]/25',
        };
      case 'SKIPPED':
      case 'CANCELLED':
        return {
          label: normalized === 'CANCELLED' ? 'CANCELLED' : 'SKIPPED',
          icon: <MinusCircle className="shrink-0" />,
          classes: 'bg-[#F1F5F9] text-[#526579] border border-[#526579]/25',
        };
      case 'RUNNING':
        return {
          label: 'RUNNING',
          icon: <Loader2 className="shrink-0 animate-spin" />,
          classes: 'bg-[#EFF8FF] text-[#175CD3] border border-[#175CD3]/25',
        };
      case 'QUEUED':
        return {
          label: 'QUEUED',
          icon: <MinusCircle className="shrink-0" />,
          classes: 'bg-[#F1F5F9] text-[#526579] border border-[#526579]/25',
        };
      default:
        return {
          label: normalized,
          icon: <MinusCircle className="shrink-0" />,
          classes: 'bg-[#F1F5F9] text-[#526579] border border-[#526579]/25',
        };
    }
  };

  const { label, icon, classes } = getStatusDetails();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold tracking-wide',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold tracking-wider',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md transition-colors select-none font-mono uppercase',
        sizeClasses[size],
        classes,
        className
      )}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {showIcon && React.cloneElement(icon, { className: cn(iconSizes[size], 'shrink-0') })}
      <span>{label}</span>
    </span>
  );
};
