import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load deployment data',
  message = 'The service request encountered an unexpected response or network interruption.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-status-fail/20 bg-status-fail-bg/40 p-6 text-center max-w-xl mx-auto my-8',
        className
      )}
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-[#FEE4E2] text-[#B42318] flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#B42318] mb-1">{title}</h3>
      <p className="text-sm text-muted mb-4 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-nx-border rounded-md text-sm font-medium text-brand-900 hover:bg-neutral-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-1"
        >
          <RefreshCw className="w-4 h-4 text-brand-700" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
};
