"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SplashScreen } from "@/components/SplashScreen";
import { AppShell } from "@/components/AppShell";
import { LandingPage } from "@/components/LandingPage";
import { SignInForm } from "@/components/SignInForm";
import { SignUpForm } from "@/components/SignUpForm";
import { IOSAppPrompt } from "@/components/IOSAppPrompt";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [screen, setScreen] = useState<"landing" | "signin" | "signup" | "guest">("landing");

  if (isLoading) return <SplashScreen />;

  const content =
    user || screen === "guest" ? (
      <AppShell onLogin={() => setScreen("signin")} onSignUp={() => setScreen("signup")} />
    ) : screen === "signin" ? (
      <SignInForm onBack={() => setScreen("landing")} onSignUp={() => setScreen("signup")} />
    ) : screen === "signup" ? (
      <SignUpForm onBack={() => setScreen("landing")} onSignIn={() => setScreen("signin")} />
    ) : (
      <LandingPage onSignIn={() => setScreen("signin")} onSignUp={() => setScreen("signup")} onGuest={() => setScreen("guest")} />
    );

  return (
    <>
      {content}
      <IOSAppPrompt />
    </>
  );
}
