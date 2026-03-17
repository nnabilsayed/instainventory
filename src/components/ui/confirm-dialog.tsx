'use client';

import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      onClick={onCancel}
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" />

      <div
        className="relative z-10 w-full space-y-4 rounded-[var(--radius-xl)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)] sm:max-w-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full text-lg',
            variant === 'danger' ? 'bg-[var(--danger-bg)]' : 'bg-[var(--warning-bg)]'
          )}
        >
          {variant === 'danger' ? '🗑' : '⚠️'}
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold text-primary">{title}</h3>
          <p className="leading-relaxed text-sm text-secondary">{message}</p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[44px] flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-transparent text-sm font-medium text-primary transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-medium text-white transition-colors disabled:opacity-50',
              variant === 'danger'
                ? 'bg-[var(--danger-text)] hover:bg-red-700'
                : 'bg-[var(--warning-text)] hover:bg-amber-700'
            )}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
