'use client';

import React, { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return typeof window !== 'undefined' ? !navigator.onLine : false;
}

function getServerSnapshot() {
  return false;
}

export function OfflineBanner() {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isOffline) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-zinc-800 px-4 py-2 text-xs font-semibold text-white shadow-md animate-in slide-in-from-top">
      <WifiOff className="h-4 w-4 text-amber-400" />
      <span>You are currently offline. Changes are saved locally and will sync once reconnected.</span>
    </div>
  );
}
