'use client';

import { useEffect, useState } from 'react';

type Platform = 'android' | 'ios' | 'desktop' | 'unknown';
type InstallState = 'not-shown' | 'shown' | 'dismissed' | 'installed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallHook {
  canInstall: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  platform: Platform;
  installState: InstallState;
  handleInstall: () => Promise<void>;
  handleDismiss: () => void;
}

const INSTALL_STATE_KEY = 'pwa_install_state';
const VISIT_COUNT_KEY = 'pwa_visit_count';

export function usePWAInstall(): PWAInstallHook {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<InstallState>('not-shown');
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const detectedPlatform: Platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';

    setPlatform(detectedPlatform);

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const savedState = localStorage.getItem(INSTALL_STATE_KEY);
    if (standalone) {
      setInstallState('installed');
      localStorage.setItem(INSTALL_STATE_KEY, 'installed');
      return;
    }

    if (savedState === 'dismissed' || savedState === 'installed') {
      setInstallState(savedState);
      return;
    }

    const visits = Number.parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, visits.toString());

    const onBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
      if (visits >= 2) {
        setInstallState('shown');
      }
    };

    const onAppInstalled = () => {
      setInstallState('installed');
      localStorage.setItem(INSTALL_STATE_KEY, 'installed');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    if (isIOS && visits >= 2) {
      setInstallState('shown');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallState('installed');
      localStorage.setItem(INSTALL_STATE_KEY, 'installed');
    }

    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setInstallState('dismissed');
    localStorage.setItem(INSTALL_STATE_KEY, 'dismissed');
    setDeferredPrompt(null);
  }

  const isIOS = platform === 'ios';
  const canInstall = installState === 'shown' && !isStandalone && (!!deferredPrompt || isIOS);

  return {
    canInstall,
    isIOS,
    isStandalone,
    platform,
    installState,
    handleInstall,
    handleDismiss,
  };
}
