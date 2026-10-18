import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Target, Settings, Activity, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: Shield,
      end: true,
    },
    {
      to: '/targets',
      label: 'Targets',
      icon: Target,
      end: false,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      end: false,
    },
  ];

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-brand-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 240px Left Nav Sidebar */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-[240px] bg-brand-900 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 border-r border-brand-800',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Primary Navigation"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
          <NavLink to="/" className="flex items-center gap-2.5 group" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center text-brand-900 font-bold shadow-md">
              <Shield className="w-5 h-5 text-brand-900 fill-brand-900/20" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                NexGuard
              </span>
              <span className="text-[10px] tracking-wider uppercase text-neutral-400 font-mono">
                Validator
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="lg:hidden text-neutral-400 hover:text-white p-1 rounded-md focus:outline-none"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-mono">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group select-none',
                    isActive
                      ? 'bg-brand-700 text-white shadow-sm font-semibold'
                      : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-accent-500' : 'text-neutral-400 group-hover:text-neutral-200'
                      )}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom System Status Badge */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="bg-brand-800/80 rounded-lg p-3 text-xs border border-white/5">
            <div className="flex items-center gap-2 mb-1.5">
              <Activity className="w-3.5 h-3.5 text-accent-500 shrink-0 animate-pulse" />
              <span className="font-medium text-neutral-200">System Ready</span>
            </div>
            <div className="text-[11px] text-neutral-400 font-mono">
              Ruleset v2.8.4
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
