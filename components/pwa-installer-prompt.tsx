'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Bell, Download, X } from 'lucide-react';

export function PwaInstallerPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleRequestNotification = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted' && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

          if (vapidPublicKey) {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription }),
            });
          }
        } catch (error) {
          console.error('Push subscription failed:', error);
        }
      }
    }
  };

  // Helper conversion for VAPID Key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (isStandalone && notificationPermission === 'granted') {
    return null; // App already installed & notification enabled
  }

  return (
    <div className="bg-slate-900/90 border border-blue-500/30 p-4 rounded-2xl space-y-3 mb-6 relative shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">Android App & Notification Setup</h4>
            <p className="text-xs text-slate-400">Install to Home Screen for reliable class end push alerts.</p>
          </div>
        </div>

        {showPrompt && (
          <button
            onClick={() => setShowPrompt(false)}
            className="text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        {!isStandalone && (
          <button
            onClick={handleInstallClick}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" />
            <span>Install to Home Screen</span>
          </button>
        )}

        {notificationPermission !== 'granted' && (
          <button
            onClick={handleRequestNotification}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 text-xs font-semibold transition"
          >
            <Bell className="w-4 h-4" />
            <span>Enable Push Alerts</span>
          </button>
        )}
      </div>

      {!isStandalone && (
        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
          💡 <strong>Chrome on Android:</strong> Tap Chrome menu <code>⋮</code> → select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.
        </div>
      )}
    </div>
  );
}
