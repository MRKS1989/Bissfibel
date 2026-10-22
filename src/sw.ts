/// <reference lib="webworker" />
// Service Worker: App offline bereitstellen und den Alarm im Hintergrund prüfen (wo der Browser das erlaubt).
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { alarmPruefen } from './alarm-pruefen';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (string | { url: string; revision: string | null })[] };

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Kartenkacheln sparsam zwischenspeichern (OSM-Nutzungsrichtlinie).
registerRoute(
  ({ url }) => url.origin === 'https://tile.openstreetmap.org',
  new CacheFirst({ cacheName: 'osm-kacheln', plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 7 * 24 * 3600 })] }),
);

const zeigen = (titel: string, text: string, tag: string) =>
  self.registration.showNotification(titel, { body: text, tag, icon: 'icon-192.png', badge: 'icon-192.png' });

// Regelmäßige Prüfung im Hintergrund (Chrome/Android bei installierter App).
self.addEventListener('periodicsync', (e: Event) => {
  const ev = e as ExtendableEvent & { tag: string };
  if (ev.tag === 'bissfibel-alarm') ev.waitUntil(alarmPruefen(zeigen).then(() => undefined));
});

// Für später: echte Push-Nachrichten von einem Server lösen ebenfalls eine Prüfung aus.
self.addEventListener('push', (e) => e.waitUntil(alarmPruefen(zeigen).then(() => undefined)));

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => (cs.length ? cs[0].focus() : self.clients.openWindow('./'))));
});
