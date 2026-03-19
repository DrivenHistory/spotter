"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck } from "lucide-react";

/**
 * Full-screen gate that requires FaceID / biometric auth before showing the app.
 * Auto-triggers on mount. If biometrics aren't available (e.g. simulator), auto-passes.
 */
export function BiometricGate({ onSuccess }: { onSuccess: () => void }) {
  const [status, setStatus] = useState<"checking" | "prompting" | "failed">("checking");
  const [errorMsg, setErrorMsg] = useState("");

  const authenticate = useCallback(async () => {
    setStatus("prompting");
    setErrorMsg("");

    try {
      // Dynamic import — only loads native plugin at runtime, not during SSG build
      const { NativeBiometric } = await import("@capgo/capacitor-native-biometric");

      // Check if biometrics are available
      const { isAvailable } = await NativeBiometric.isAvailable({ useFallback: true });
      if (!isAvailable) {
        // No biometrics on this device (simulator, old device) — skip gate
        onSuccess();
        return;
      }

      // Prompt for biometric auth
      await NativeBiometric.verifyIdentity({
        reason: "Unlock Spotter",
        title: "Unlock Spotter",
        subtitle: "Verify your identity to continue",
        useFallback: true,
      });

      // Success
      onSuccess();
    } catch (err: unknown) {
      // User cancelled or auth failed
      const message = err instanceof Error ? err.message : "Authentication failed";

      // If it's a "not available" error (e.g. web/simulator), skip
      if (message.includes("not available") || message.includes("not enrolled")) {
        onSuccess();
        return;
      }

      setStatus("failed");
      setErrorMsg(message.includes("cancel") ? "Authentication cancelled" : "Authentication failed");
    }
  }, [onSuccess]);

  // Auto-trigger on mount
  useEffect(() => {
    authenticate();
  }, [authenticate]);

  return (
    <div className="fixed inset-0 z-[9999] bg-bg-page flex flex-col items-center justify-center safe-top safe-bottom">
      {/* App icon */}
      <div className="w-20 h-20 rounded-[20px] bg-accent-coral/10 flex items-center justify-center mb-6">
        <ShieldCheck size={40} className="text-accent-coral" />
      </div>

      <h1 className="text-[24px] font-bold text-text-primary mb-2">Spotter</h1>

      {status === "checking" && (
        <p className="text-[15px] text-text-secondary">Checking security...</p>
      )}

      {status === "prompting" && (
        <div className="flex items-center gap-2 mt-4">
          <div className="w-5 h-5 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
          <p className="text-[14px] text-text-secondary">Authenticating...</p>
        </div>
      )}

      {status === "failed" && (
        <div className="flex flex-col items-center mt-4">
          <p className="text-[14px] text-text-secondary mb-5">{errorMsg}</p>
          <button
            onClick={authenticate}
            className="h-[50px] px-8 bg-accent-coral rounded-full text-white font-semibold text-[16px] active:scale-[0.97] transition-transform"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
