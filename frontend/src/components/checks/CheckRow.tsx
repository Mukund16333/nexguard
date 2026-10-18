import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { CheckResult } from '../../lib/types';
import { StatusBadge } from '../common/StatusBadge';
import { CheckEvidence } from './CheckEvidence';
import { formatDuration, cn } from '../../lib/utils';

interface CheckRowProps {
  check: CheckResult;
  defaultExpanded?: boolean;
}

export const CheckRow: React.FC<CheckRowProps> = ({ check, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div
      className={cn(
        'border border-nx-border rounded-xl overflow-hidden transition-all duration-150 bg-surface',
        isExpanded ? 'shadow-sm ring-1 ring-brand-700/20' : 'hover:border-neutral-300'
      )}
    >
      {/* Header / Collapsed view */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={toggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpand();
          }
        }}
        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none bg-surface hover:bg-neutral-50/80 transition-colors"
      >
        <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            className="text-muted hover:text-nx-text p-1 mt-0.5 md:mt-0"
            aria-label={isExpanded ? 'Collapse check details' : 'Expand check details'}
            tabIndex={-1}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 transition-transform text-brand-700" />
            ) : (
              <ChevronRight className="w-4 h-4 transition-transform" />
            )}
          </button>

          <StatusBadge status={check.status} size="sm" />

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5 min-w-0 flex-1">
            <span className="font-mono text-xs font-semibold text-brand-900 shrink-0">
              {check.check_id}
            </span>
            <span className="text-sm font-medium text-nx-text truncate">
              {check.summary}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 pl-8 md:pl-0 text-xs text-muted">
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-muted/70" />
            <span>{formatDuration(check.duration_ms)}</span>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-muted">
            wt: {check.weight}
          </span>
        </div>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-3 border-t border-nx-border/60 bg-neutral-50/40 space-y-4">
          {/* Expected vs Observed Grid */}
          {(check.expected || check.observed) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-lg border border-nx-border bg-surface">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1.5">
                  Expected Condition
                </span>
                <p className="text-xs font-mono text-nx-text leading-relaxed break-words">
                  {check.expected || 'Condition satisfied by rule specification'}
                </p>
              </div>

              <div
                className={cn(
                  'p-3.5 rounded-lg border bg-surface',
                  check.status === 'FAIL' || check.status === 'ERROR'
                    ? 'border-status-fail/30 bg-status-fail-bg/20'
                    : check.status === 'WARNING'
                    ? 'border-status-warning/30 bg-status-warning-bg/20'
                    : 'border-nx-border'
                )}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1.5">
                  Observed Telemetry
                </span>
                <p className="text-xs font-mono text-nx-text leading-relaxed break-words">
                  {check.observed || 'No unexpected deviation recorded'}
                </p>
              </div>
            </div>
          )}

          {/* Remediation Block if available */}
          {check.remediation && (
            <div className="p-3.5 rounded-lg border border-brand-700/20 bg-brand-50/60 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs font-semibold text-brand-900 block mb-1">
                  Remediation Guidance
                </span>
                <p className="text-xs text-nx-text leading-relaxed">
                  {check.remediation}
                </p>
              </div>
            </div>
          )}

          {/* Evidence Block */}
          {check.evidence && Object.keys(check.evidence).length > 0 && (
            <div>
              <span className="text-xs font-semibold text-muted block mb-1.5">
                Evaluated Evidence
              </span>
              <CheckEvidence evidence={check.evidence} />
            </div>
          )}

          {/* Rule Metadata */}
          <div className="flex items-center justify-between text-[11px] text-muted pt-2 border-t border-nx-border/40 font-mono">
            <span>Category: {check.category}</span>
            <span>Engine Rule v{check.rule_version}</span>
          </div>
        </div>
      )}
    </div>
  );
};
