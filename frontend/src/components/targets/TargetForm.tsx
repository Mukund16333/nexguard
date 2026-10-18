import React, { useState } from 'react';
import { Target, TargetCreateInput, Environment } from '../../lib/types';
import { ShieldCheck, AlertCircle, Globe, Server, Hash, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface TargetFormProps {
  initialData?: Partial<Target>;
  onSubmit: (data: TargetCreateInput) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export const TargetForm: React.FC<TargetFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Register Target',
}) => {
  const [displayName, setDisplayName] = useState(initialData?.display_name || '');
  const [baseUrl, setBaseUrl] = useState(initialData?.base_url || '');
  const [environment, setEnvironment] = useState<Environment>(initialData?.environment || 'prod');
  const [expectedHost, setExpectedHost] = useState(initialData?.expected_host || '');
  const [versionMarker, setVersionMarker] = useState(initialData?.expected_version_marker || '');
  const [originUrl, setOriginUrl] = useState(initialData?.origin_url || '');

  // Form error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill expected host from Base URL if user hasn't explicitly entered one
  const handleBaseUrlChange = (value: string) => {
    setBaseUrl(value);
    try {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        const parsed = new URL(value);
        if (!expectedHost || expectedHost === '') {
          setExpectedHost(parsed.hostname);
        }
      }
    } catch {
      // ignore in-progress typing
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!displayName.trim()) {
      errs.displayName = 'Display Name is required.';
    }

    if (!baseUrl.trim()) {
      errs.baseUrl = 'Base URL is required.';
    } else if (!baseUrl.startsWith('https://')) {
      errs.baseUrl = 'Base URL must start with https:// (HTTPS is strictly required for security validation).';
    } else {
      try {
        new URL(baseUrl);
      } catch {
        errs.baseUrl = 'Please enter a valid URL (e.g., https://api.example.com).';
      }
    }

    if (!expectedHost.trim()) {
      errs.expectedHost = 'Expected Host header is required (e.g., api.example.com).';
    }

    if (originUrl.trim()) {
      try {
        new URL(originUrl);
      } catch {
        errs.originUrl = 'Origin URL must be a valid URL if specified.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      display_name: displayName.trim(),
      base_url: baseUrl.trim(),
      environment,
      expected_host: expectedHost.trim(),
      expected_version_marker: versionMarker.trim() || undefined,
      origin_url: originUrl.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-nx-border p-6 shadow-xs space-y-6">
      {/* Display Name */}
      <div>
        <label htmlFor="displayName" className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1.5">
          Display Name <span className="text-[#B42318]">*</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Production API Gateway, Customer Web Portal"
          className={cn(
            'w-full px-3.5 py-2.5 bg-neutral-50/80 border rounded-lg text-sm text-nx-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-surface transition-colors',
            errors.displayName ? 'border-status-fail focus:ring-status-fail' : 'border-nx-border'
          )}
        />
        {errors.displayName && (
          <p className="mt-1 text-xs text-[#B42318] flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.displayName}</span>
          </p>
        )}
      </div>

      {/* Grid: Base URL + Environment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="baseUrl" className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1.5">
            Base URL (HTTPS required) <span className="text-[#B42318]">*</span>
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="baseUrl"
              type="text"
              value={baseUrl}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
              placeholder="https://api.cloud.nexguard.internal"
              className={cn(
                'w-full pl-9 pr-3.5 py-2.5 bg-neutral-50/80 border rounded-lg text-sm font-mono text-nx-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-surface transition-colors',
                errors.baseUrl ? 'border-status-fail focus:ring-status-fail' : 'border-nx-border'
              )}
            />
          </div>
          {errors.baseUrl ? (
            <p className="mt-1 text-xs text-[#B42318] flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.baseUrl}</span>
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-muted">
              Must be HTTPS. TLS handshakes and HSTS header checks run against this URL.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="environment" className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1.5">
            Environment <span className="text-[#B42318]">*</span>
          </label>
          <select
            id="environment"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as Environment)}
            className="w-full px-3.5 py-2.5 bg-neutral-50/80 border border-nx-border rounded-lg text-sm font-mono text-nx-text focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-surface transition-colors"
          >
            <option value="prod">PROD (Production)</option>
            <option value="staging">STAGING</option>
            <option value="dev">DEV (Development)</option>
          </select>
          <p className="mt-1 text-[11px] text-muted">Strictness thresholds adapt to environment.</p>
        </div>
      </div>

      {/* Grid: Expected Host + Version Marker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="expectedHost" className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1.5">
            Expected Host Header <span className="text-[#B42318]">*</span>
          </label>
          <div className="relative">
            <Server className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="expectedHost"
              type="text"
              value={expectedHost}
              onChange={(e) => setExpectedHost(e.target.value)}
              placeholder="api.cloud.nexguard.internal"
              className={cn(
                'w-full pl-9 pr-3.5 py-2.5 bg-neutral-50/80 border rounded-lg text-sm font-mono text-nx-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-surface transition-colors',
                errors.expectedHost ? 'border-status-fail focus:ring-status-fail' : 'border-nx-border'
              )}
            />
          </div>
          {errors.expectedHost ? (
            <p className="mt-1 text-xs text-[#B42318] flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.expectedHost}</span>
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-muted">
              Used for SNI verification, DNS CNAME alignment, and host spoofing checks.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="versionMarker" className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1.5">
            Expected Version Marker <span className="text-muted font-normal text-[11px] lowercase">(optional)</span>
          </label>
          <div className="relative">
            <Hash className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="versionMarker"
              type="text"
              value={versionMarker}
              onChange={(e) => setVersionMarker(e.target.value)}
              placeholder="e.g. v2.14.0-release or git-commit-sha"
              className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50/80 border border-nx-border rounded-lg text-sm font-mono text-nx-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-surface transition-colors"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Asserts that the /health or version endpoint returns this exact version.
          </p>
        </div>
      </div>

      {/* Origin URL */}
      <div>
        <label htmlFor="originUrl" className="block text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1.5">
          Origin Server URL <span className="text-muted font-normal text-[11px] lowercase">(optional)</span>
        </label>
        <input
          id="originUrl"
          type="text"
          value={originUrl}
          onChange={(e) => setOriginUrl(e.target.value)}
          placeholder="https://origin-prod-east.internal.vpc:8443"
          className={cn(
            'w-full px-3.5 py-2.5 bg-neutral-50/80 border rounded-lg text-sm font-mono text-nx-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-surface transition-colors',
            errors.originUrl ? 'border-status-fail focus:ring-status-fail' : 'border-nx-border'
          )}
        />
        {errors.originUrl ? (
          <p className="mt-1 text-xs text-[#B42318] flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.originUrl}</span>
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-muted">
            Direct origin address to test firewall rules and ensure origin IP is never exposed to public internet.
          </p>
        )}
      </div>

      {/* Form Action Buttons */}
      <div className="pt-4 border-t border-nx-border flex items-center justify-between">
        <Link
          to="/targets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-nx-text transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Targets</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/targets"
            className="px-4 py-2 border border-nx-border bg-surface hover:bg-neutral-50 text-nx-text rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2 disabled:opacity-60"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving Target...' : submitLabel}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
