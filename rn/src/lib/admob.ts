import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import {
  AdMob,
  RewardAdPluginEvents,
  type RewardAdOptions,
} from "@capacitor-community/admob";

const REWARDED_AD_IDS = {
  ios: "ca-app-pub-5951830349172589/4206650578",
  android: "ca-app-pub-5951830349172589/9781364704",
} as const;

let initialized = false;
let initPromise: Promise<void> | null = null;

export function isNativeAdSupported(): boolean {
  return Capacitor.isNativePlatform();
}

export async function initializeAdMob(): Promise<void> {
  if (!isNativeAdSupported()) return;
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await AdMob.initialize({ initializeForTesting: false });
      // iOS ATT prompt (no-op on Android / iOS <14).
      try {
        await AdMob.requestTrackingAuthorization();
      } catch {
        // User denial is fine — ads still serve at a lower eCPM.
      }
      initialized = true;
    } catch (err) {
      console.warn("[admob] init failed", err);
    }
  })();

  return initPromise;
}

/**
 * Show a rewarded ad tied to the given email. The reward is granted server-side
 * via SSV (POST to /api/admob-ssv), so this function returns as soon as the
 * reward callback fires client-side — the caller should refetch settings to
 * pull the updated bonus_points.
 *
 * Resolves with true when the user earned the reward, false otherwise.
 */
export async function showRewardedAdForEmail(email: string): Promise<boolean> {
  if (!isNativeAdSupported()) return false;
  await initializeAdMob();

  const platform = Capacitor.getPlatform();
  const adId =
    platform === "ios" ? REWARDED_AD_IDS.ios : REWARDED_AD_IDS.android;

  const options: RewardAdOptions = {
    adId,
    ssv: {
      userId: email,
      customData: JSON.stringify({ email }),
    },
  };

  const handles: PluginListenerHandle[] = [];
  const resultPromise = new Promise<boolean>((resolve) => {
    AdMob.addListener(RewardAdPluginEvents.Rewarded, () => resolve(true))
      .then((h) => handles.push(h));
    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => resolve(false))
      .then((h) => handles.push(h));
    AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => resolve(false))
      .then((h) => handles.push(h));
  });

  try {
    await AdMob.prepareRewardVideoAd(options);
    await AdMob.showRewardVideoAd();
    return await resultPromise;
  } catch (err) {
    console.warn("[admob] show rewarded failed", err);
    return false;
  } finally {
    for (const h of handles) {
      try { await h.remove(); } catch { /* ignore */ }
    }
  }
}
