"use client";

import { useEffect, useState } from "react";
import { Check, X, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { spotter, user as userApi, type SpottedCar } from "@/lib/api";
import { points } from "@/lib/rarity";
import { relativeTime } from "@/lib/time";
import { CarDetailView } from "@/components/CarDetailView";
import { InviteFriendsCard } from "@/components/groups/InviteFriendsCard";
import { CreateGroupSheet } from "@/components/groups/CreateGroupSheet";
import { InviteSheet } from "@/components/groups/InviteSheet";
import { GroupPickerSheet } from "@/components/groups/GroupPickerSheet";
import { useGroups } from "@/lib/groups-context";
import type { Group } from "@/lib/api";

export function HomeTab({ onProfile }: { onProfile?: () => void }) {
  const { user } = useAuth();
  const { myGroups, pendingInvites, acceptInvite, declineInvite } = useGroups();
  const [feed, setFeed] = useState<SpottedCar[]>([]);
  const [weeklySpots, setWeeklySpots] = useState<SpottedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbDisplayName, setDbDisplayName] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<SpottedCar | null>(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [inviteGroup, setInviteGroup] = useState<Group | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [feedRes, weeklyRes] = await Promise.all([
          spotter.getFeed(),
          spotter.getWeekly(),
        ]);
        setFeed(feedRes.spots);
        setWeeklySpots(weeklyRes.spots);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const s = await userApi.getSettings();
        if (s.displayName) setDbDisplayName(s.displayName);
      } catch { /* ignore */ }
    })();
  }, [user]);

  const firstName = (dbDisplayName ?? user?.name ?? "Spotter").split(" ")[0];
  const initials = (() => {
    const name = dbDisplayName ?? user?.name ?? "S";
    const parts = name.split(" ");
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  })();

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";

  if (selectedCar) {
    return <CarDetailView car={selectedCar} onBack={() => setSelectedCar(null)} />;
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-5 pb-24">
      {/* Header with profile avatar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex flex-col gap-1">
          <span className="text-[14px] text-text-secondary">{timeGreeting}</span>
          <span className="text-[28px] font-bold text-text-primary">{firstName} 👋</span>
        </div>
        <button onClick={onProfile} className="w-10 h-10 rounded-full bg-accent-coral flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-white">{initials}</span>
        </button>
      </div>

      {/* Latest Spots carousel */}
      {weeklySpots.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-semibold text-text-primary">Latest Spots</h2>
            <span className="text-[14px] text-accent-coral">See All</span>
          </div>
          {/* Carousel breaks out of px-5 to scroll edge-to-edge */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5">
            {weeklySpots.slice(0, 10).map((car) => (
              <WeeklyCard key={car.id} car={car} onTap={() => setSelectedCar(car)} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Invites OR Invite Friends card */}
      {user && pendingInvites.length > 0 ? (
        <div className="mb-5 p-4 bg-accent-coral/10 border border-accent-coral/30 rounded-[16px]">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={18} className="text-accent-coral" />
            <h2 className="text-[16px] font-semibold text-text-primary">
              {pendingInvites.length === 1 ? "You have a group invite!" : `You have ${pendingInvites.length} group invites!`}
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-3 bg-bg-card rounded-[12px]">
                <div className="w-9 h-9 rounded-[10px] bg-bg-elevated flex items-center justify-center text-[18px] shrink-0">
                  {inv.groupIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text-primary truncate">{inv.groupName}</p>
                  <p className="text-[11px] text-text-secondary">from {inv.inviterName}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptInvite(inv.id).catch(() => {})}
                    className="h-8 px-3 rounded-[8px] bg-accent-coral flex items-center gap-1"
                  >
                    <Check size={14} className="text-white" />
                    <span className="text-[12px] font-semibold text-white">Join</span>
                  </button>
                  <button
                    onClick={() => declineInvite(inv.id).catch(() => {})}
                    className="w-8 h-8 rounded-[8px] bg-bg-elevated flex items-center justify-center"
                  >
                    <X size={14} className="text-text-muted" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : user ? (
        <div className="mb-5">
          <InviteFriendsCard onTap={() => {
            if (myGroups.length > 0) setShowGroupPicker(true);
            else setShowCreateGroup(true);
          }} />
        </div>
      ) : null}

      {/* Community Spots */}
      <h2 className="text-[18px] font-semibold text-text-primary mb-2">Community Spots</h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {feed.map((car) => (
            <SpotRow key={car.id} car={car} onTap={() => setSelectedCar(car)} />
          ))}
        </div>
      )}

      {/* Group sheets */}
      <GroupPickerSheet
        open={showGroupPicker}
        onClose={() => setShowGroupPicker(false)}
        groups={myGroups}
        onSelectGroup={(group) => {
          setShowGroupPicker(false);
          setInviteGroup(group);
        }}
        onCreateNew={() => {
          setShowGroupPicker(false);
          setShowCreateGroup(true);
        }}
      />
      <CreateGroupSheet
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(group) => {
          setShowCreateGroup(false);
          setInviteGroup(group);
        }}
      />
      {inviteGroup && (
        <InviteSheet
          open={!!inviteGroup}
          onClose={() => setInviteGroup(null)}
          group={inviteGroup}
        />
      )}
    </div>
  );
}

function WeeklyCard({ car, onTap }: { car: SpottedCar; onTap: () => void }) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  const rarityLabel = car.rarity ? `${car.rarity} · ${points(car.rarity)} pts` : null;
  const rarityColor = car.rarity ? `text-rarity-${car.rarity.toLowerCase().replace(/\s+/g, "-")}` : "";
  return (
    <button onClick={onTap} className="shrink-0 w-[150px] rounded-[16px] bg-bg-card overflow-hidden flex flex-col text-left">
      {car.imageUrl ? (
        <img src={car.imageUrl} alt={displayName} className="w-full h-[100px] object-cover shrink-0" />
      ) : (
        <div className="w-full h-[100px] bg-bg-elevated flex items-center justify-center text-text-tertiary text-xs shrink-0">No photo</div>
      )}
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <p className="text-[13px] font-semibold text-text-primary truncate">{displayName}</p>
        {rarityLabel && <span className={`text-[11px] ${rarityColor}`}>{rarityLabel}</span>}
      </div>
    </button>
  );
}

function SpotRow({ car, onTap }: { car: SpottedCar; onTap: () => void }) {
  const displayName = [car.year, car.make, car.model].filter(Boolean).join(" ");
  return (
    <button onClick={onTap} className="flex items-center gap-3 p-3 bg-bg-card rounded-[12px] w-full text-left">
      {car.imageUrl ? (
        <img src={car.imageUrl} alt="" className="w-14 h-14 rounded-[8px] object-cover shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-[8px] bg-bg-elevated shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-text-primary truncate">{displayName}</p>
        <p className="text-[12px] text-text-secondary mt-0.5">Spotted by {car.spotterName || car.spotterEmail.split("@")[0]} · {relativeTime(car.createdAt)}</p>
      </div>
    </button>
  );
}
