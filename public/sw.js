// Zwei Herzen ♡ — offline support. Caches only this app's own files.
// Never touches other origins (e.g. the encrypted message relay).
const CACHE = "zh-v5";
const SHELL = ["/", "/theme-init.js", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== "zh-meta").map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // App pages: network first, fall back to the cached app when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put(url.pathname, copy));
          return res;
        })
        .catch(() => caches.match(url.pathname).then((hit) => hit || caches.match("/"))),
    );
    return;
  }

  // Versioned bundles and icons: cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/art/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});

// ---- Message notifications ----
// The server can't read messages (end-to-end encrypted), so a push only means "something arrived".
self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      let kind = "msg";
      try {
        kind = (event.data && event.data.json().t) || "msg";
      } catch (e) {
        // empty or old-style ping: a message
      }
      if (kind === "remind") {
        // Already in the app: no need to remind.
        if (wins.some((w) => w.visibilityState === "visible")) return;
        await self.registration.showNotification("Zeit für Deutsch! 🇩🇪", {
          body: "5 minutes today keeps your streak alive 🔥 Berlin is waiting for you two ❤️",
          tag: "zh-remind",
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          data: { url: "/" },
        });
        return;
      }
      // The chat is open on screen: no need to buzz.
      if (wins.some((w) => w.visibilityState === "visible" && new URL(w.url).pathname.startsWith("/messages"))) return;
      let name = "";
      try {
        const hit = await (await caches.open("zh-meta")).match("/__zh-meta");
        if (hit) name = String((await hit.json()).name || "");
      } catch (e) {
        // no saved name
      }
      await self.registration.showNotification(name ? `${name} 💌` : "Zwei Herzen ♡", {
        body: name ? `New message from ${name}` : "You have a new message 💌",
        tag: "zh-chat",
        renotify: true,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url: "/messages" },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/messages";
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const win = wins.find((w) => new URL(w.url).origin === self.location.origin);
      if (win) {
        await win.focus();
        if ("navigate" in win) await win.navigate(url).catch(() => {});
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
