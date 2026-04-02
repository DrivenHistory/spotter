// Spotter Service Worker — handles Web Push notifications
// Server sends pushes only to subscribers who share a Game with the spotter.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "New Spot!", body: event.data.text() };
  }

  const { title, body, imageUrl, carId, rarity } = payload;

  const options = {
    body: body ?? "A car was just spotted in your Game.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    image: imageUrl ?? undefined,
    tag: carId ?? "spotter-notification",
    renotify: true,
    data: { carId, url: "/" },
    actions: [
      { action: "view", title: "View Spot" },
    ],
    // Vibrate pattern: short buzz for common, escalating for rarer
    vibrate: rarity === "Extremely Rare" ? [200, 100, 200, 100, 400]
            : rarity === "Very Rare"      ? [200, 100, 300]
            : [200],
  };

  event.waitUntil(
    self.registration.showNotification(title ?? "New Spot!", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus an existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
