import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  updateAvailable: boolean;
  error: Error | null;
}

/**
 * Hook to register and manage Service Worker
 * Handles updates and offline notifications
 */
export function useServiceWorker(): ServiceWorkerState {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    isRegistered: false,
    updateAvailable: false,
    error: null,
  });

  useEffect(() => {
    if (!state.isSupported) return;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('Service Worker registered successfully:', registration);
        setState((prev) => ({ ...prev, isRegistered: true }));

        // Check for updates periodically (every hour)
        const checkForUpdates = setInterval(() => {
          registration.update().catch((error) => {
            console.error('Error checking for SW updates:', error);
          });
        }, 60 * 60 * 1000);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              setState((prev) => ({ ...prev, updateAvailable: true }));
              console.log('New Service Worker version available');
            }
          });
        });

        return () => clearInterval(checkForUpdates);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Service Worker registration failed:', err);
        setState((prev) => ({ ...prev, error: err }));
      }
    };

    registerServiceWorker();
  }, [state.isSupported]);

  return state;
}
