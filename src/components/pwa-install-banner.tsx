'use client';

import { Bell, Download, Share, Smartphone, WifiOff, X, Zap } from 'lucide-react';

import { usePWAInstall } from '@/hooks/use-pwa-install';
import { cn } from '@/lib/utils';

export function PWAInstallBanner() {
  const { canInstall, isIOS, handleInstall, handleDismiss } = usePWAInstall();

  if (!canInstall) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={handleDismiss} />

      <div
        className={cn(
          'fixed z-50 mx-auto',
          'bottom-[calc(var(--bottom-nav-height)+var(--safe-bottom)+8px)]',
          'inset-x-3 md:inset-x-auto',
          'md:bottom-6 md:end-6 md:w-80'
        )}
      >
        <div className="space-y-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-md)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-navy)]">
                <Smartphone size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Install InstaInventory</p>
                <p className="mt-0.5 text-xs text-secondary">Add to your home screen</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-shrink-0 p-0.5 text-tertiary transition-colors hover:text-primary"
              aria-label="Dismiss install banner"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex gap-3 text-xs text-secondary">
            <span className="flex items-center gap-1">
              <Zap size={12} />
              Faster
            </span>
            <span className="flex items-center gap-1">
              <WifiOff size={12} />
              Works offline
            </span>
            <span className="flex items-center gap-1">
              <Bell size={12} />
              Notifications
            </span>
          </div>

          {isIOS ? (
            <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-hover)] p-3">
              <p className="text-xs font-medium text-primary">To install on iPhone:</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-navy)] text-[10px] font-medium text-white">
                    1
                  </span>
                  <span className="flex items-center gap-1">
                    Tap the
                    <Share size={11} className="mx-0.5 inline" />
                    Share button in Safari
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-navy)] text-[10px] font-medium text-white">
                    2
                  </span>
                  Scroll down and tap <span>&quot;Add to Home Screen&quot;</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-navy)] text-[10px] font-medium text-white">
                    3
                  </span>
                  Tap <span>&quot;Add&quot;</span> in the top right corner
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="mt-1 h-9 w-full rounded-[var(--radius-md)] border border-[var(--border)] text-xs font-medium text-secondary transition-colors hover:bg-[var(--surface)]"
              >
                Got it
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent-navy)] text-sm font-medium text-white transition-colors hover:bg-[var(--accent-navy-hover)]"
              >
                <Download size={14} />
                Install
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="h-10 rounded-[var(--radius-md)] border border-[var(--border)] px-4 text-sm text-secondary transition-colors hover:bg-[var(--surface-hover)]"
              >
                Later
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
