import React, { useState, useMemo } from 'react';
import { Target, Environment } from '../../lib/types';
import { TargetCard } from './TargetCard';
import { EmptyState } from '../common/EmptyState';
import { Search, Plus, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface TargetListProps {
  targets: Target[];
  onRunCheck?: (targetId: string) => Promise<void>;
  className?: string;
}

export const TargetList: React.FC<TargetListProps> = ({ targets, onRunCheck, className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnv, setSelectedEnv] = useState<string>('ALL');

  const filteredTargets = useMemo(() => {
    return targets.filter((t) => {
      const matchesSearch =
        t.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.base_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.expected_host.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEnv = selectedEnv === 'ALL' || t.environment === selectedEnv;
      return matchesSearch && matchesEnv;
    });
  }, [targets, searchQuery, selectedEnv]);

  if (targets.length === 0) {
    return (
      <EmptyState
        title="No Deployment Targets Configured"
        description="Register a web application, API gateway, or cloud edge endpoint to evaluate security headers, TLS posture, DNS routing, and WAF rules."
        actionLabel="Register Deployment Target"
        actionHref="/targets/new"
      />
    );
  }

  return (
    <div className={cn('space-y-5', className)}>
      {/* Filtering & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-nx-border shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search targets by name, URL, or host..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50/70 border border-nx-border rounded-lg text-sm text-nx-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-surface transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Env:</span>
          </div>

          <div className="inline-flex rounded-lg border border-nx-border p-0.5 bg-neutral-100 text-xs">
            {['ALL', 'prod', 'staging', 'dev'].map((env) => (
              <button
                key={env}
                onClick={() => setSelectedEnv(env)}
                className={cn(
                  'px-2.5 py-1 rounded-md font-mono font-medium uppercase transition-colors',
                  selectedEnv === env
                    ? 'bg-surface text-brand-900 shadow-xs font-semibold'
                    : 'text-muted hover:text-nx-text'
                )}
              >
                {env}
              </button>
            ))}
          </div>

          <Link
            to="/targets/new"
            className="inline-flex items-center gap-1 px-3 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Target</span>
          </Link>
        </div>
      </div>

      {/* Grid of Target Cards */}
      {filteredTargets.length === 0 ? (
        <div className="p-8 text-center bg-surface rounded-xl border border-nx-border text-muted text-sm">
          No deployment targets match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTargets.map((target) => (
            <TargetCard
              key={target.target_id}
              target={target}
              onRunCheck={onRunCheck}
            />
          ))}
        </div>
      )}
    </div>
  );
};
