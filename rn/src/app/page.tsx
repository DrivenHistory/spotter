"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { SplashScreen } from "@/components/SplashScreen";
import { AppShell } from "@/components/AppShell";
import { LandingPage } from "@/components/LandingPage";
import { SignInForm } from "@/components/SignInForm";
import { SignUpForm } from "@/components/SignUpForm";
import { BiometricGate } from "@/components/BiometricGate";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [screen, setScreen] = useState<"landing" | "signin" | "signup" | "guest">("landing");
  const [biometricVerified, setBiometricVerified] = useState(false);

  const onBiometricSuccess = useCallback(() => setBiometricVerified(true), []);

  if (isLoading) return <SplashScreen />;

  // Logged-in user must pass FaceID before seeing any content
  if (user && !biometricVerified) {
    return <BiometricGate onSuccess={onBiometricSuccess} />;
  }

  if (user || screen === "guest") return <AppShell onLogin={() => setScreen("signin")} onSignUp={() => setScreen("signup")} />;

  if (screen === "signin") return <SignInForm onBack={() => setScreen("landing")} onSignUp={() => setScreen("signup")} />;
  if (screen === "signup") return <SignUpForm onBack={() => setScreen("landing")} onSignIn={() => setScreen("signin")} />;
  return <LandingPage onSignIn={() => setScreen("signin")} onSignUp={() => setScreen("signup")} onGuest={() => setScreen("guest")} />;
}
