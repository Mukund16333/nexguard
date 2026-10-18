import React from 'react';
import { Menu, ShieldCheck, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopBarProps {
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  return (
    <header className="h-16 bg-surface border-b border-nx-border sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-muted hover:text-nx-text hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-700"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#18794E] border border-[#18794E]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#18794E]" />
            <span>Cloud Validator Active</span>
          </div>
          <span className="text-xs text-muted font-mono hidden md:inline">
            TLS &middot; Origin &middot; WAF &middot; DNS
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          to="/targets/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <span>New Target</span>
        </Link>

        <div className="h-4 w-px bg-nx-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <button
            className="p-2 text-muted hover:text-nx-text rounded-md hover:bg-neutral-100 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-500" />
          </button>

          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-8 h-8 rounded-full bg-brand-900 text-white font-medium text-xs flex items-center justify-center font-mono">
              SE
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-brand-900 leading-tight">SecOps Lead</span>
              <span className="text-[11px] text-muted leading-tight">Production Org</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
