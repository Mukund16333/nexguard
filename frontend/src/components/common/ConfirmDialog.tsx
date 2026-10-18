import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-[#B42318] hover:bg-[#912018] text-white focus:ring-[#B42318]';
      case 'warning':
        return 'bg-[#9A6700] hover:bg-[#7D5300] text-white focus:ring-[#9A6700]';
      default:
        return 'bg-brand-700 hover:bg-brand-800 text-white focus:ring-brand-700';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="w-full max-w-md bg-surface rounded-xl shadow-xl border border-nx-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-status-fail-bg text-status-fail flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#B42318]" />
            </div>
            <div className="flex-1">
              <h3 id="confirm-dialog-title" className="text-base font-semibold text-brand-900">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-muted hover:text-nx-text p-1 rounded-md transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-nx-border/60">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-nx-border bg-surface hover:bg-neutral-50 text-nx-text rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-nx-border"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                getConfirmButtonClasses()
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
