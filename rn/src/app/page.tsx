"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SplashScreen } from "@/components/SplashScreen";
import { AppShell } from "@/components/AppShell";
import { LandingPage } from "@/components/LandingPage";
import { SignInForm } from "@/components/SignInForm";
import { SignUpForm } from "@/components/SignUpForm";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [screen, setScreen] = useState<"landing" | "signin" | "signup">("landing");

  if (isLoading) return <SplashScreen />;
  if (user) return <AppShell />;

  if (screen === "signin") return <SignInForm onBack={() => setScreen("landing")} onSignUp={() => setScreen("signup")} />;
  if (screen === "signup") return <SignUpForm onBack={() => setScreen("landing")} onSignIn={() => setScreen("signin")} />;
  return <LandingPage onSignIn={() => setScreen("signin")} onSignUp={() => setScreen("signup")} />;
}
