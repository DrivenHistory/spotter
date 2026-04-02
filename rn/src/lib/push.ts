import { push as pushApi } from "./api";

// VAPID public key — must match the server's VAPID key pair.
// Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in your environment.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}

/** Register the service worker and subscribe to push notifications.
 *  Safe to call multiple times — no-ops if already subscribed.
 *  Returns true if successfully registered, false otherwise. */
export async function initialisePush(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (!VAPID_PUBLIC_KEY) {
    console.warn("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set — push disabled");
    return false;
  }

  try {
    // Register (or retrieve existing) service worker
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    // Request permission if not already granted
    if (Notification.permission === "denied") return false;
    if (Notification.permission !== "granted") {
      const result = await Notification.requestPermission();
      if (result !== "granted") return false;
    }

    // Subscribe (or retrieve existing subscription)
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
      });
    }

    // Send subscription to server — server stores it against the user
    // and will only push to subscribers who share a Game with the spotter
    await pushApi.registerSubscription(subscription.toJSON());
    return true;
  } catch (err) {
    console.warn("[push] Failed to initialise push notifications:", err);
    return false;
  }
}

/** Unsubscribe from push and tell the server to remove the subscription. */
export async function teardownPush(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!registration) return;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await pushApi.unregisterSubscription(subscription.endpoint);
    await subscription.unsubscribe();
  } catch (err) {
    console.warn("[push] Failed to teardown push notifications:", err);
  }
}
