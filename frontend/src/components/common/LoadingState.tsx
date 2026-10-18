import React from 'react';
import { cn } from '../../lib/utils';

interface LoadingStateProps {
  rows?: number;
  className?: string;
  type?: 'card' | 'table' | 'detail';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  rows = 4,
  className,
  type = 'card',
}) => {
  if (type === 'table') {
    return (
      <div className={cn('w-full space-y-3 p-4 bg-surface rounded-xl border border-nx-border animate-pulse', className)}>
        <div className="h-9 bg-neutral-200/60 rounded-md w-full mb-4" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-nx-border/40">
            <div className="w-20 h-6 bg-neutral-200/70 rounded" />
            <div className="flex-1 h-5 bg-neutral-200/50 rounded" />
            <div className="w-24 h-5 bg-neutral-200/60 rounded" />
            <div className="w-16 h-5 bg-neutral-200/50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className={cn('space-y-6 animate-pulse', className)}>
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-neutral-200/80 rounded w-64" />
            <div className="h-4 bg-neutral-200/50 rounded w-96" />
          </div>
          <div className="h-10 bg-neutral-200/70 rounded w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-neutral-200/60 rounded-xl" />
          <div className="h-32 bg-neutral-200/60 rounded-xl" />
          <div className="h-32 bg-neutral-200/60 rounded-xl" />
          <div className="h-32 bg-neutral-200/60 rounded-xl" />
        </div>
        <div className="h-64 bg-neutral-200/50 rounded-xl border border-nx-border" />
      </div>
    );
  }

  // Default card grid skeleton
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-nx-border bg-surface p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="h-5 bg-neutral-200/70 rounded w-36" />
            <div className="h-5 bg-neutral-200/50 rounded w-16" />
          </div>
          <div className="h-4 bg-neutral-200/40 rounded w-48" />
          <div className="pt-4 border-t border-nx-border/50 flex justify-between items-center">
            <div className="h-7 bg-neutral-200/60 rounded w-20" />
            <div className="h-6 bg-neutral-200/50 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};
