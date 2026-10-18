import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TargetsPage } from './pages/TargetsPage';
import { NewTargetPage } from './pages/NewTargetPage';
import { TargetDetailPage } from './pages/TargetDetailPage';
import { RunDetailPage } from './pages/RunDetailPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="targets" element={<TargetsPage />} />
          <Route path="targets/new" element={<NewTargetPage />} />
          <Route path="targets/:targetId" element={<TargetDetailPage />} />
          <Route path="runs/:runId" element={<RunDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
