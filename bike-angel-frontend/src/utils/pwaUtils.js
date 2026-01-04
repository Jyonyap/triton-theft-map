// PWA Utilities
// Handles service worker registration and PWA installation

/**
 * Register the service worker
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('[PWA] Service Worker registered:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] New Service Worker found');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available, prompt user to refresh
            console.log('[PWA] New content available, please refresh');
            showUpdateNotification();
          }
        });
      });
      
      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.log('[PWA] Service Workers not supported');
    return null;
  }
}

/**
 * Show update notification when new version is available
 */
function showUpdateNotification() {
  // You can implement a custom UI notification here
  if (confirm('New version available! Reload to update?')) {
    window.location.reload();
  }
}

/**
 * Check if app is installed as PWA
 */
export function isPWAInstalled() {
  // Check if running in standalone mode
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

/**
 * Prompt user to install PWA
 */
let deferredPrompt = null;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    console.log('[PWA] Install prompt available');
    
    // Show custom install button/banner
    showInstallPrompt();
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
    hideInstallPrompt();
  });
}

/**
 * Trigger the install prompt
 */
export async function promptInstall() {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return false;
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`[PWA] User response: ${outcome}`);
  
  // Clear the deferred prompt
  deferredPrompt = null;
  
  return outcome === 'accepted';
}

/**
 * Show custom install prompt UI
 */
function showInstallPrompt() {
  // Dispatch custom event that components can listen to
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
}

/**
 * Hide custom install prompt UI
 */
function hideInstallPrompt() {
  // Dispatch custom event that components can listen to
  window.dispatchEvent(new CustomEvent('pwa-install-completed'));
}

/**
 * Check if device is online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Setup online/offline event listeners
 */
export function setupOnlineOfflineListeners(onOnline, onOffline) {
  window.addEventListener('online', () => {
    console.log('[PWA] Back online');
    if (onOnline) onOnline();
  });
  
  window.addEventListener('offline', () => {
    console.log('[PWA] Gone offline');
    if (onOffline) onOffline();
  });
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

/**
 * Show a local notification
 */
export function showNotification(title, options = {}) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return notification;
  }
  return null;
}

/**
 * Get app version from manifest
 */
export async function getAppVersion() {
  try {
    const response = await fetch('/manifest.json');
    const manifest = await response.json();
    return manifest.version || '1.0.0';
  } catch (error) {
    console.error('[PWA] Failed to get app version:', error);
    return '1.0.0';
  }
}
