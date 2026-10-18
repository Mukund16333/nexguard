import React, { useState, useMemo } from 'react';
import { Search, Filter, Layers, CheckCircle2, AlertTriangle, XCircle, ChevronsUpDown } from 'lucide-react';
import { CheckResult, CheckStatus } from '../../lib/types';
import { CheckRow } from './CheckRow';
import { cn } from '../../lib/utils';

interface CheckListProps {
  checks: CheckResult[];
  className?: string;
}

export const CheckList: React.FC<CheckListProps> = ({ checks, className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandAll, setExpandAll] = useState(false);

  // Group categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    checks.forEach((c) => set.add(c.category));
    return Array.from(set);
  }, [checks]);

  // Filter checks
  const filteredChecks = useMemo(() => {
    return checks.filter((c) => {
      const matchesSearch =
        c.check_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.remediation && c.remediation.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatus === 'ALL' || c.status === selectedStatus;

      const matchesCategory =
        selectedCategory === 'ALL' || c.category === selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [checks, searchQuery, selectedStatus, selectedCategory]);

  // Group filtered checks by category
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, CheckResult[]> = {};
    filteredChecks.forEach((c) => {
      if (!groups[c.category]) {
        groups[c.category] = [];
      }
      groups[c.category].push(c);
    });
    return groups;
  }, [filteredChecks]);

  // Overall status counts
  const counts = useMemo(() => {
    const res = { PASS: 0, WARNING: 0, FAIL: 0, SKIPPED: 0, ERROR: 0 };
    checks.forEach((c) => {
      if (res[c.status] !== undefined) {
        res[c.status]++;
      }
    });
    return res;
  }, [checks]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Controls Bar: Filter, Category, Search, Expand/Collapse */}
      <div className="bg-surface p-4 rounded-xl border border-nx-border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search checks by ID, summary, or remediation guidance..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50/70 border border-nx-border rounded-lg text-sm text-nx-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-surface transition-colors"
            />
          </div>

          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            onClick={() => setExpandAll(!expandAll)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-700/20 shrink-0 self-start md:self-auto"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            <span>{expandAll ? 'Collapse All' : 'Expand All'}</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-nx-border/50 text-xs">
          <span className="text-muted font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>

          <button
            onClick={() => setSelectedStatus('ALL')}
            className={cn(
              'px-2.5 py-1 rounded-md font-mono transition-colors font-medium',
              selectedStatus === 'ALL'
                ? 'bg-brand-900 text-white'
                : 'bg-neutral-100 text-muted hover:bg-neutral-200'
            )}
          >
            ALL ({checks.length})
          </button>

          <button
            onClick={() => setSelectedStatus('FAIL')}
            className={cn(
              'px-2.5 py-1 rounded-md font-mono transition-colors font-medium flex items-center gap-1',
              selectedStatus === 'FAIL'
                ? 'bg-[#B42318] text-white'
                : 'bg-[#FEE4E2] text-[#B42318] hover:bg-[#FCD2D0]'
            )}
          >
            <XCircle className="w-3 h-3" />
            <span>FAIL ({counts.FAIL + counts.ERROR})</span>
          </button>

          <button
            onClick={() => setSelectedStatus('WARNING')}
            className={cn(
              'px-2.5 py-1 rounded-md font-mono transition-colors font-medium flex items-center gap-1',
              selectedStatus === 'WARNING'
                ? 'bg-[#9A6700] text-white'
                : 'bg-[#FEF3D6] text-[#9A6700] hover:bg-[#FEE6AF]'
            )}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>WARNING ({counts.WARNING})</span>
          </button>

          <button
            onClick={() => setSelectedStatus('PASS')}
            className={cn(
              'px-2.5 py-1 rounded-md font-mono transition-colors font-medium flex items-center gap-1',
              selectedStatus === 'PASS'
                ? 'bg-[#18794E] text-white'
                : 'bg-[#E6F4EA] text-[#18794E] hover:bg-[#CCEAD5]'
            )}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>PASS ({counts.PASS})</span>
          </button>

          {/* Category Dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-muted font-medium hidden sm:inline">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-neutral-50 border border-nx-border text-xs rounded-md px-2.5 py-1 text-nx-text focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grouped checks list */}
      {Object.keys(groupedByCategory).length === 0 ? (
        <div className="p-8 text-center bg-surface rounded-xl border border-nx-border text-muted text-sm">
          No security or reliability checks matched your criteria.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([category, items]) => {
            const catPass = items.filter((i) => i.status === 'PASS').length;
            const catWarn = items.filter((i) => i.status === 'WARNING').length;
            const catFail = items.filter((i) => i.status === 'FAIL' || i.status === 'ERROR').length;

            return (
              <section key={category} className="space-y-3" aria-labelledby={`cat-${category}`}>
                <div className="flex items-center justify-between pb-1 border-b border-nx-border/60">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-700" />
                    <h3 id={`cat-${category}`} className="text-sm font-bold text-brand-900 uppercase tracking-wide">
                      {category}
                    </h3>
                  </div>

                  {/* Category Status Counter Badges */}
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {catFail > 0 && (
                      <span className="px-2 py-0.5 rounded bg-[#FEE4E2] text-[#B42318] font-semibold">
                        {catFail} FAIL
                      </span>
                    )}
                    {catWarn > 0 && (
                      <span className="px-2 py-0.5 rounded bg-[#FEF3D6] text-[#9A6700] font-semibold">
                        {catWarn} WARN
                      </span>
                    )}
                    {catPass > 0 && (
                      <span className="px-2 py-0.5 rounded bg-[#E6F4EA] text-[#18794E] font-semibold">
                        {catPass} PASS
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {items.map((check) => (
                    <CheckRow
                      key={check.check_id}
                      check={check}
                      defaultExpanded={expandAll}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
