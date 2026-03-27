"use client";

import { useEffect, useRef, useState } from "react";
import { Home, Car, Crosshair, Users, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useGroups } from "@/lib/groups-context";
import { spotter, type SpottedCar } from "@/lib/api";
import { HomeTab } from "@/components/tabs/HomeTab";
import { CarsTab } from "@/components/tabs/CarsTab";
import { SpotTab, getPendingSpot, clearPendingSpot } from "@/components/tabs/SpotTab";
import { CommunityTab } from "@/components/tabs/CommunityTab";
import { LeaderboardTab } from "@/components/tabs/LeaderboardTab";
import { ProfileTab } from "@/components/tabs/ProfileTab";

const TABS = [
  { icon: Home, label: "HOME" },
  { icon: Car, label: "CARS" },
  { icon: Crosshair, label: "SPOT" },
  { icon: Users, label: "COMMUNITY" },
  { icon: Trophy, label: "TABLES" },
];

export function AppShell({ onLogin, onSignUp }: { onLogin: () => void; onSignUp: () => void }) {
  const { user } = useAuth();
  const { joinByCode, refreshGroups } = useGroups();
  const [tab, setTab] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastSavedSpot, setLastSavedSpot] = useState<SpottedCar | null>(null);
  const pendingSaveAttempted = useRef(false);
  const pendingInviteAttempted = useRef(false);

  // Auto-join group if a pending invite code is stored (from deep link)
  useEffect(() => {
    if (!user || pendingInviteAttempted.current) return;
    pendingInviteAttempted.current = true;
    try {
      const code = sessionStorage.getItem("dh_pending_invite_code");
      if (!code) return;
      sessionStorage.removeItem("dh_pending_invite_code");
      joinByCode(code).then(() => refreshGroups()).catch(() => {});
    } catch {}
  }, [user, joinByCode, refreshGroups]);

  // Auto-save pending spot after login/signup
  useEffect(() => {
    if (!user || pendingSaveAttempted.current) return;
    pendingSaveAttempted.current = true;
    const pending = getPendingSpot();
    if (!pending) return;
    clearPendingSpot();
    spotter.save({
      make: pending.make,
      model: pending.model,
      year: pending.year,
      type: pending.type,
      confidence: pending.confidence,
      description: pending.description,
      imageUrl: pending.imageUrl,
      marketValue: pending.marketValue,
      rarity: pending.rarity,
      bhp: pending.bhp,
      zeroToSixty: pending.zeroToSixty,
      topSpeed: pending.topSpeed,
    }).then(() => {
      setRefreshKey((k) => k + 1);
      setTab(1);
    }).catch(() => {});
  }, [user]);

  return (
    <div className={`h-dvh flex flex-col bg-bg-page ${tab === 2 ? "" : "safe-top"}`}>
      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {showProfile ? (
          <div className="h-full"><ProfileTab onBack={() => setShowProfile(false)} /></div>
        ) : (
          <>
            <div className={tab === 0 ? "h-full" : "hidden"}><HomeTab onProfile={() => setShowProfile(true)} /></div>
            <div className={tab === 1 ? "h-full" : "hidden"}><CarsTab onLogin={onLogin} active={tab === 1} newSpot={lastSavedSpot} /></div>
            <div className={tab === 2 ? "h-full" : "hidden"}><SpotTab active={tab === 2} onSaved={(spot) => { setLastSavedSpot(spot); setRefreshKey((k) => k + 1); }} onClose={() => setTab(0)} onLogin={onLogin} onSignUp={onSignUp} /></div>
            <div className={tab === 3 ? "h-full" : "hidden"}><CommunityTab onProfile={() => setShowProfile(true)} /></div>
            <div className={tab === 4 ? "h-full" : "hidden"}><LeaderboardTab refreshKey={refreshKey} /></div>
          </>
        )}
      </div>

      {/* Tab bar — hidden in spot camera and profile */}
      {!showProfile && tab !== 2 && (
        <div className="flex items-center justify-around bg-bg-card pt-2" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
          {/* HOME */}
          <TabButton icon={Home} label="HOME" active={tab === 0} onClick={() => setTab(0)} />
          {/* CARS */}
          <TabButton icon={Car} label="CARS" active={tab === 1} onClick={() => setTab(1)} />
          {/* SPOT — center coral circle */}
          <button onClick={() => setTab(2)} className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-accent-coral flex items-center justify-center">
              <Crosshair size={24} className="text-white" />
            </div>
          </button>
          {/* COMMUNITY */}
          <TabButton icon={Users} label="COMMUNITY" active={tab === 3} onClick={() => setTab(3)} small />
          {/* TABLES */}
          <TabButton icon={Trophy} label="TABLES" active={tab === 4} onClick={() => setTab(4)} />
        </div>
      )}
    </div>
  );
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
  small,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  const color = active ? "text-accent-coral" : "text-text-muted";
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 w-[60px]">
      <Icon size={24} className={color} />
      <span className={`${small ? "text-[9px]" : "text-[10px]"} ${color} ${active ? "font-semibold" : "font-normal"}`}>
        {label}
      </span>
    </button>
  );
}
