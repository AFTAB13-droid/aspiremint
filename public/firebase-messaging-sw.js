// Import Firebase Compat scripts for Service Workers
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Vercel friendly: Parse Firebase credentials dynamically from register parameters
// Example query: /firebase-messaging-sw.js?apiKey=xxx&projectId=yyy&messagingSenderId=zzz&appId=aaa
const params = new URLSearchParams(self.location.search);
const apiKey = params.get('apiKey');
const authDomain = params.get('authDomain');
const projectId = params.get('projectId');
const storageBucket = params.get('storageBucket');
const messagingSenderId = params.get('messagingSenderId');
const appId = params.get('appId');

if (apiKey && projectId && messagingSenderId) {
  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Background notifications handler
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background push notification received:', payload);
    
    // Firebase automatically displays notifications if the payload contains a 'notification' object.
    // If we call showNotification manually here, we will get duplicates.
    if (payload.notification) {
      return;
    }

    const notificationTitle = payload.data?.title || "AspireMint Update";
    const notificationOptions = {
      body: payload.data?.body || "",
      icon: payload.data?.icon || '/favicon.svg',
      badge: payload.data?.badge || '/favicon.svg',
      data: {
        click_action: payload.data?.click_action || '/app'
      }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.warn("FCM service worker activated without runtime configuration query parameters.");
}

// Background click handler to focus tab or navigate
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.click_action || '/app';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('/app') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// PWA compliance handlers
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler just to satisfy PWA installability requirements
  // We do not intercept API calls to avoid breaking Next.js hydration and routing
});
