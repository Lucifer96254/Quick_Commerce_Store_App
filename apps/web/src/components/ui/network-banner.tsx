'use client';

import { WifiOff, Wifi } from 'lucide-react';
import { useUIStore } from '@/lib/store';

export function NetworkBanner() {
  const { isOnline } = useUIStore();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 px-4 py-2 text-center text-sm text-white">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>You&apos;re offline. Some features may not work.</span>
      </div>
    </div>
  );
}
