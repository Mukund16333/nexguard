import React from 'react';
import { Target, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-nx-border bg-surface p-10 text-center flex flex-col items-center justify-center my-6',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-muted mb-4">
        {icon || <Target className="w-6 h-6 text-brand-700" />}
      </div>
      <h3 className="text-base font-semibold text-brand-900 mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 text-white rounded-md text-sm font-medium hover:bg-brand-800 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 text-white rounded-md text-sm font-medium hover:bg-brand-800 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
