import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CheckEvidenceProps {
  evidence: Record<string, any>;
  className?: string;
}

export const CheckEvidence: React.FC<CheckEvidenceProps> = ({ evidence, className }) => {
  const [copied, setCopied] = useState(false);
  const formattedJson = JSON.stringify(evidence, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={cn('rounded-lg border border-nx-border bg-neutral-900 text-neutral-100 overflow-hidden', className)}>
      <div className="flex items-center justify-between px-3 py-2 bg-neutral-950 border-b border-neutral-800 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-accent-500" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
            Validated Evidence Output
          </span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-mono transition-colors"
          title="Copy raw JSON evidence"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#18794E]" />
              <span className="text-[#18794E]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="p-3.5 max-h-80 overflow-y-auto">
        <pre className="font-mono text-xs leading-relaxed text-neutral-200 whitespace-pre-wrap break-all">
          {formattedJson}
        </pre>
      </div>
    </div>
  );
};
