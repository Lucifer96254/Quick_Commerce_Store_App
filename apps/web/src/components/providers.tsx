'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { BottomCartBar } from '@/components/ui/bottom-cart-bar';
import { AddressModal } from '@/components/ui/address-modal';
import { NetworkBanner } from '@/components/ui/network-banner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useUIStore } from '@/lib/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const { setOnline } = useUIStore();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NetworkBanner />
        {children}
        <BottomCartBar />
        <AddressModal />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
