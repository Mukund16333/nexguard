import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans">
      {/* Fixed 240px Left Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Shell offset by 240px on lg screens */}
      <div className="lg:pl-[240px] flex flex-col flex-1 min-w-0">
        <TopBar onToggleSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1440px] mx-auto w-full">
            <Outlet />
          </div>
        </main>

        <footer className="py-4 px-6 border-t border-nx-border/60 text-center text-xs text-muted">
          NexGuard Security &amp; Reliability Validator &bull; Automated Deployment Governance &bull; WCAG AA Compliant
        </footer>
      </div>
    </div>
  );
};
