import React, { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Shield, Key, Bell, Sliders, CheckCircle2, Save, RefreshCw } from 'lucide-react';
import { Environment } from '../lib/types';
import { cn } from '../lib/utils';

export const SettingsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('nx_sec_live_9a7b8c2d1e4f506172');
  const [copiedKey, setCopiedKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/XXXX');
  const [defaultEnv, setDefaultEnv] = useState<Environment>('prod');
  const [minPassScore, setMinPassScore] = useState(80);
  const [rulesetVersion, setRulesetVersion] = useState('v2.8.4');
  const [showSkippedChecks, setShowSkippedChecks] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    const newKey = `nx_sec_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    setApiKey(newKey);
    localStorage.setItem('nexguard_api_key', newKey);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('nexguard_api_key', apiKey);
    localStorage.setItem('nexguard_min_score', minPassScore.toString());
    localStorage.setItem('nexguard_default_env', defaultEnv);
    localStorage.setItem('nexguard_webhook', webhookUrl);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Validator Settings &amp; Preferences"
        subtitle="Manage validation thresholds, CI/CD webhook triggers, and automated governance rules"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]}
      />

      {savedSuccess && (
        <div className="p-4 rounded-xl border border-status-pass/30 bg-status-pass-bg text-status-pass text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Validator settings and notification policies updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Compliance Thresholds */}
        <div className="bg-surface rounded-xl border border-nx-border p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-nx-border/60">
            <Sliders className="w-4 h-4 text-brand-700" />
            <h3 className="text-sm font-bold text-brand-900 uppercase tracking-wide">
              Evaluation &amp; Governance Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="minScore" className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1.5">
                Minimum Passing Deployment Score
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="minScore"
                  type="number"
                  min="50"
                  max="100"
                  value={minPassScore}
                  onChange={(e) => setMinPassScore(Number(e.target.value))}
                  className="w-24 px-3 py-2 bg-neutral-50/80 border border-nx-border rounded-lg text-sm font-mono text-nx-text focus:outline-none focus:ring-2 focus:ring-brand-700"
                />
                <span className="text-xs text-muted">/100 threshold</span>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Deployments scoring below this threshold are marked as WARNING or FAIL in CI pipeline gates.
              </p>
            </div>

            <div>
              <label htmlFor="defaultEnv" className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1.5">
                Default Target Environment
              </label>
              <select
                id="defaultEnv"
                value={defaultEnv}
                onChange={(e) => setDefaultEnv(e.target.value as Environment)}
                className="w-full px-3 py-2 bg-neutral-50/80 border border-nx-border rounded-lg text-sm font-mono text-nx-text focus:outline-none focus:ring-2 focus:ring-brand-700"
              >
                <option value="prod">Production (prod)</option>
                <option value="staging">Staging (staging)</option>
                <option value="dev">Development (dev)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="rulesetVersion" className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1.5">
              Active Security Ruleset Bundle
            </label>
            <select
              id="rulesetVersion"
              value={rulesetVersion}
              onChange={(e) => setRulesetVersion(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 bg-neutral-50/80 border border-nx-border rounded-lg text-sm font-mono text-nx-text focus:outline-none focus:ring-2 focus:ring-brand-700"
            >
              <option value="v2.8.4">nexguard-rules-v2.8.4 (Recommended / Stable)</option>
              <option value="v2.9.0-rc1">nexguard-rules-v2.9.0-rc1 (Beta / Post-Quantum TLS)</option>
              <option value="v2.7.2">nexguard-rules-v2.7.2 (Legacy LTS)</option>
            </select>
          </div>
        </div>

        {/* API Authentication */}
        <div className="bg-surface rounded-xl border border-nx-border p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-nx-border/60">
            <Key className="w-4 h-4 text-brand-700" />
            <h3 className="text-sm font-bold text-brand-900 uppercase tracking-wide">
              API Client Credentials
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1.5">
              CLI &amp; CI/CD Pipeline API Key
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="flex-1 px-3.5 py-2 bg-neutral-100 border border-nx-border rounded-lg text-xs font-mono text-nx-text select-all focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-3 py-2 bg-surface border border-nx-border hover:bg-neutral-50 rounded-lg text-xs font-medium text-nx-text shadow-xs transition-colors"
                >
                  {copiedKey ? 'Copied' : 'Copy Key'}
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateKey}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface border border-nx-border hover:bg-neutral-50 rounded-lg text-xs font-medium text-muted hover:text-nx-text shadow-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rotate</span>
                </button>
              </div>
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Use in GitHub Actions, GitLab CI, or terminal curl invocations: <code>Authorization: Bearer &lt;KEY&gt;</code>
            </p>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-surface rounded-xl border border-nx-border p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-nx-border/60">
            <Bell className="w-4 h-4 text-brand-700" />
            <h3 className="text-sm font-bold text-brand-900 uppercase tracking-wide">
              Incident Webhook Notifications
            </h3>
          </div>

          <div>
            <label htmlFor="webhookUrl" className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1.5">
              Slack / Microsoft Teams / PagerDuty Webhook URL
            </label>
            <input
              id="webhookUrl"
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full px-3.5 py-2 bg-neutral-50/80 border border-nx-border rounded-lg text-xs font-mono text-nx-text focus:outline-none focus:ring-2 focus:ring-brand-700"
            />
            <p className="mt-1 text-[11px] text-muted">
              Fires when any deployment drops below the defined threshold or encounters a critical check failure.
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
