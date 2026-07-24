const CACHE_NAME = 'attendx-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install Event - Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore caching errors for dynamic routes during install
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and API calls from cache
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push Event - Show Web Push Notification with Action Buttons
self.addEventListener('push', (event) => {
  let data = {
    title: 'Class Ended',
    body: 'Did you attend your class?',
    timetableEntryId: '',
    date: new Date().toISOString().split('T')[0],
    subjectName: 'Class'
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
  }

  const options = {
    body: data.body || `Log attendance for ${data.subjectName}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      timetableEntryId: data.timetableEntryId,
      date: data.date || new Date().toISOString().split('T')[0],
      url: '/dashboard'
    },
    actions: [
      {
        action: 'present',
        title: '✅ Present',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'absent',
        title: '❌ Absent',
        icon: '/icons/icon-192x192.png'
      }
    ],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || `Class Ended: ${data.subjectName}`, options)
  );
});

// Notification Click Event - Handle Action Buttons & Direct Logging
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const notificationData = notification.data || {};
  const { timetableEntryId, date } = notificationData;

  notification.close();

  if (action === 'present' || action === 'absent') {
    // Single-tap logging directly from Android Notification action button
    event.waitUntil(
      fetch('/api/attendance/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timetableEntryId,
          date: date || new Date().toISOString().split('T')[0],
          status: action
        })
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('Attendance logged via push action:', data);
        })
        .catch((err) => {
          console.error('Failed to log attendance from push action:', err);
        })
    );
  } else {
    // Open application when notification body is tapped
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/dashboard');
        }
      })
    );
  }
});
