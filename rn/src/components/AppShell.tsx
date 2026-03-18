"use client";

import { useState } from "react";
import { Home, Car, Crosshair, Users, Trophy } from "lucide-react";
import { HomeTab } from "@/components/tabs/HomeTab";
import { CarsTab } from "@/components/tabs/CarsTab";
import { SpotTab } from "@/components/tabs/SpotTab";
import { CommunityTab } from "@/components/tabs/CommunityTab";
import { LeaderboardTab } from "@/components/tabs/LeaderboardTab";
import { ProfileTab } from "@/components/tabs/ProfileTab";

const TABS = [
  { icon: Home, label: "HOME" },
  { icon: Car, label: "CARS" },
  { icon: Crosshair, label: "SPOT" },
  { icon: Users, label: "COMMUNITY" },
  { icon: Trophy, label: "RANKS" },
];

export function AppShell() {
  const [tab, setTab] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="h-dvh flex flex-col bg-bg-page safe-top">
      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {showProfile ? (
          <div className="h-full"><ProfileTab onBack={() => setShowProfile(false)} /></div>
        ) : (
          <>
            <div className={tab === 0 ? "h-full" : "hidden"}><HomeTab onProfile={() => setShowProfile(true)} /></div>
            <div className={tab === 1 ? "h-full" : "hidden"}><CarsTab /></div>
            <div className={tab === 2 ? "h-full" : "hidden"}><SpotTab onSaved={() => setTab(1)} /></div>
            <div className={tab === 3 ? "h-full" : "hidden"}><CommunityTab onProfile={() => setShowProfile(true)} /></div>
            <div className={tab === 4 ? "h-full" : "hidden"}><LeaderboardTab /></div>
          </>
        )}
      </div>

      {/* Custom tab bar */}
      {!showProfile && (
        <div className="relative safe-bottom">
          <div className="mx-5 mb-5 flex items-center bg-bg-elevated border border-border-subtle rounded-[36px] h-[62px] px-1 shadow-[0_-4px_12px_rgba(0,0,0,0.25)]">
            {/* Left tabs */}
            {[0, 1].map((i) => (
              <TabButton key={i} tab={TABS[i]} active={tab === i} onClick={() => setTab(i)} />
            ))}

            {/* Center spacer for SPOT button */}
            <div className="w-[72px] shrink-0" />

            {/* Right tabs */}
            {[3, 4].map((i) => (
              <TabButton key={i} tab={TABS[i]} active={tab === i} onClick={() => setTab(i)} />
            ))}
          </div>

          {/* Raised SPOT button */}
          <button
            onClick={() => setTab(2)}
            className="absolute left-1/2 -translate-x-1/2 bottom-[52px] flex flex-col items-center"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-accent-coral flex items-center justify-center border-[3px] border-bg-page shadow-[0_4px_12px_rgba(232,90,79,0.35)]">
                <Crosshair size={24} className="text-white" />
              </div>
            </div>
            <span
              className={`mt-1 text-[10px] font-semibold tracking-[0.5px] ${
                tab === 2 ? "text-accent-coral" : "text-text-tertiary"
              }`}
            >
              SPOT
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function TabButton({
  tab,
  active,
  onClick,
}: {
  tab: { icon: React.ComponentType<{ size?: number }>; label: string };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 h-[54px] rounded-[26px] transition-colors ${
        active ? "bg-accent-coral text-white" : "text-text-tertiary"
      }`}
    >
      <Icon size={18} />
      <span className={`${tab.label.length > 5 ? "text-[8px]" : "text-[10px]"} tracking-[0.5px] ${active ? "font-semibold" : "font-medium"}`}>
        {tab.label}
      </span>
    </button>
  );
}
