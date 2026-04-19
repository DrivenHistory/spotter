"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowRight, Crown, UserPlus, ChevronRight, X, Plus } from "lucide-react";
import { spotter, groups as groupsApi, type SpottedCar, type GroupLeaderboardEntry, type GroupMemberEntry } from "@/lib/api";
import { points, RARITY_POINTS, rarityKey } from "@/lib/rarity";
import { useGroups } from "@/lib/groups-context";
import { useAuth } from "@/lib/auth-context";
import { InviteSheet } from "@/components/groups/InviteSheet";
import { CreateGroupSheet } from "@/components/groups/CreateGroupSheet";
import { PullToRefresh } from "@/components/PullToRefresh";

interface LeaderboardEntry {
  email: string;
  name: string;
  spots: SpottedCar[];
  totalPoints: number;
  totalSpots: number;
  rareFinds: number;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const RANK_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "#FFD70030", text: "#FFD700", border: "#FFD70040" },
  2: { bg: "#C0C0C030", text: "#C0C0C0", border: "#C0C0C040" },
  3: { bg: "#CD7F3230", text: "#CD7F32", border: "#CD7F3240" },
};

export function LeaderboardTab({ refreshKey = 0 }: { refreshKey?: number } = {}) {
  const { myGroups } = useGroups();
  const { user } = useAuth();
  const [allSpots, setAllSpots] = useState<SpottedCar[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showScoring, setShowScoring] = useState(false);
  const [groupRankings, setGroupRankings] = useState<GroupLeaderboardEntry[]>([]);
  const [groupMembers, setGroupMembers] = useState<Record<string, GroupMemberEntry[]>>({});
  const [inviteGroup, setInviteGroup] = useState<typeof myGroups[number]["group"] | null>(null);
  const [selectedMember, setSelectedMember] = useState<{ member: GroupMemberEntry; groupId: string } | null>(null);
  const [memberSpots, setMemberSpots] = useState<SpottedCar[]>([]);
  const [loadingMemberSpots, setLoadingMemberSpots] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupInvite, setNewGroupInvite] = useState<typeof myGroups[number]["group"] | null>(null);

  // Dynamic tabs: All Time | Groups | <per-group tabs>
  const tabs = useMemo(() => {
    const base = ["All Time", "Games"];
    for (const m of myGroups) base.push(m.group.name);
    return base;
  }, [myGroups]);

  // Reset tab if the selected group was removed
  useEffect(() => {
    if (selectedTab >= tabs.length) {
      setSelectedTab(0);
    }
  }, [tabs, selectedTab]);

  useEffect(() => {
    (async () => {
      try {
        const { spots } = await spotter.getFeed();
        setAllSpots(spots);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [refreshKey]);

  // Fetch group leaderboard when Groups tab selected
  useEffect(() => {
    if (selectedTab === 1) {
      (async () => {
        try {
          const { rankings } = await groupsApi.getGroupLeaderboard();
          setGroupRankings(rankings);
        } catch {
          setGroupRankings([]);
        }
      })();
    }
  }, [selectedTab]);

  // Fetch group members when a per-group tab selected
  useEffect(() => {
    if (selectedTab < 2) return;
    const groupIndex = selectedTab - 2;
    if (groupIndex >= myGroups.length) return;
    const groupId = myGroups[groupIndex].group.id;
    if (groupMembers[groupId]) return; // already fetched
    (async () => {
      try {
        const { members } = await groupsApi.getGroupMembers(groupId);
        setGroupMembers((prev) => ({ ...prev, [groupId]: members }));
      } catch {
        setGroupMembers((prev) => ({ ...prev, [groupId]: [] }));
      }
    })();
  }, [selectedTab, myGroups, groupMembers]);

  // All Time leaderboard entries (reused for tab 0)
  const entries = useMemo(() => {
    const filtered = allSpots;
    const grouped = new Map<string, SpottedCar[]>();
    for (const s of filtered) {
      const key = s.spotterEmail.toLowerCase();
      grouped.set(key, [...(grouped.get(key) ?? []), s]);
    }
    const list: LeaderboardEntry[] = Array.from(grouped.entries()).map(([email, spots]) => ({
      email,
      name: spots[0].spotterName || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      spots,
      totalPoints: spots.reduce((s, c) => s + points(c.rarity), 0),
      totalSpots: spots.length,
      rareFinds: spots.filter((c) => ["Rare", "Very Rare", "Extremely Rare"].includes(c.rarity ?? "")).length,
    }));
    list.sort((a, b) => b.totalPoints - a.totalPoints);
    return list;
  }, [allSpots]);

  const initials = (name: string) => {
    const p = name.split(" ");
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const podiumEntries = entries.slice(0, Math.min(entries.length, 3));

  return (
    <PullToRefresh className="h-full overflow-y-auto scrollbar-hide px-5 pb-24" onRefresh={async () => {
      try {
        const { spots } = await spotter.getFeed();
        setAllSpots(spots);
        if (selectedTab === 1) {
          const { rankings } = await groupsApi.getGroupLeaderboard();
          setGroupRankings(rankings);
        }
      } catch { /* ignore */ }
    }}>
      <h1 className="text-[28px] font-bold text-text-primary mb-4">Leaderboard</h1>

      {/* Segment control — scrollable for many tabs */}
      <div className="flex p-1 bg-bg-card rounded-[20px] h-10 mb-4 mt-2 overflow-x-auto scrollbar-hide">
        {tabs.map((label, i) => (
          <button
            key={label}
            onClick={() => setSelectedTab(i)}
            className={`shrink-0 px-4 flex items-center justify-center rounded-[16px] text-[13px] transition-colors ${
              selectedTab === i
                ? "bg-accent-coral text-white font-semibold"
                : "text-text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add group button — only on Groups tab, right-aligned below tabs */}
      {selectedTab === 1 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-accent-coral/15 text-accent-coral active:opacity-70 transition-opacity"
            aria-label="Create group"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
        </div>
      ) : selectedTab === 0 ? (
        /* ── All Time Tab ── */
        entries.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {podiumEntries.length >= 2 && (
              <div className="flex items-end justify-center gap-3 mb-4">
                <PodiumSlot entry={podiumEntries[1]} rank={2} barHeight={60} color="#C0C0C0" avatarSize={48} strokeWidth={2} initials={initials} />
                <PodiumSlot entry={podiumEntries[0]} rank={1} barHeight={80} color="#FFD700" avatarSize={56} strokeWidth={3} initials={initials} showCrown />
                {podiumEntries.length >= 3 ? (
                  <PodiumSlot entry={podiumEntries[2]} rank={3} barHeight={44} color="#CD7F32" avatarSize={44} strokeWidth={2} initials={initials} />
                ) : (
                  <div className="flex-1 max-w-[90px]" />
                )}
              </div>
            )}
            <div className="flex flex-col gap-2 mb-4">
              {entries.map((entry, i) => {
                const rank = i + 1;
                return (
                  <div key={entry.email} className="flex items-center gap-3 px-4 py-3 bg-bg-card rounded-[12px]">
                    <span className={`text-[16px] font-bold w-5 text-center ${rank <= 3 ? "text-accent-coral" : "text-text-muted"}`}>{rank}</span>
                    <div className="w-9 h-9 rounded-full bg-bg-elevated flex items-center justify-center shrink-0">
                      <span className="text-[12px] font-semibold text-text-primary">{initials(entry.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-text-primary truncate">{entry.name}</p>
                      <p className="text-[11px] text-text-muted">{entry.totalSpots} cars spotted</p>
                    </div>
                    <span className="text-[16px] font-bold text-accent-coral">{entry.totalPoints}</span>
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : selectedTab === 1 ? (
        /* ── Groups Tab ── */
        groupRankings.length === 0 ? (
          <EmptyState message="No games yet" sub="Create a game to start competing!" />
        ) : (
          <>
            {groupRankings.length >= 2 && (
              <div className="flex items-end justify-center gap-3 mb-4">
                <PodiumSlotGeneric name={groupRankings[1].group.name} label={groupRankings[1].group.icon} points={groupRankings[1].group.totalPoints} rank={2} barHeight={60} color="#C0C0C0" avatarSize={48} strokeWidth={2} />
                <PodiumSlotGeneric name={groupRankings[0].group.name} label={groupRankings[0].group.icon} points={groupRankings[0].group.totalPoints} rank={1} barHeight={80} color="#FFD700" avatarSize={56} strokeWidth={3} showCrown />
                {groupRankings.length >= 3 ? (
                  <PodiumSlotGeneric name={groupRankings[2].group.name} label={groupRankings[2].group.icon} points={groupRankings[2].group.totalPoints} rank={3} barHeight={44} color="#CD7F32" avatarSize={44} strokeWidth={2} />
                ) : (
                  <div className="flex-1 max-w-[90px]" />
                )}
              </div>
            )}
            <div className="flex flex-col gap-2 mb-4">
              {groupRankings.map((entry) => {
                const rank = entry.rank;
                return (
                  <div key={entry.group.id} className="flex items-center gap-3 px-4 py-3 bg-bg-card rounded-[12px]">
                    <span className={`text-[16px] font-bold w-5 text-center ${rank <= 3 ? "text-accent-coral" : "text-text-muted"}`}>{rank}</span>
                    <div className="w-9 h-9 rounded-full bg-bg-elevated flex items-center justify-center shrink-0 text-[18px]">
                      {entry.group.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-text-primary truncate">{entry.group.name}</p>
                      <p className="text-[11px] text-text-muted">{entry.group.memberCount} members · {entry.group.totalSpots} spots</p>
                    </div>
                    <span className="text-[16px] font-bold text-accent-coral">{entry.group.totalPoints.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : (
        /* ── Per-Group Tab ── */
        (() => {
          const groupIndex = selectedTab - 2;
          const membership = myGroups[groupIndex];
          if (!membership) return <EmptyState />;
          const isCreator = membership.role === "creator";
          const members = groupMembers[membership.group.id];
          if (!members) {
            return (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
              </div>
            );
          }
          if (members.length === 0) return <EmptyState message="No members yet" />;
          const podiumMembers = members.slice(0, Math.min(members.length, 3));

          const handleMemberClick = async (m: GroupMemberEntry) => {
            setSelectedMember({ member: m, groupId: membership.group.id });
            setMemberSpots([]);
            setLoadingMemberSpots(true);
            try {
              const { spots } = await spotter.getFeed();
              const group = membership.group;
              const groupStart = new Date(group.createdAt).getTime();
              const filtered = spots.filter((s) => {
                // Must be this member's spot
                if (s.spotterEmail.toLowerCase() !== m.email.toLowerCase()) return false;
                // Must be after group creation
                if (new Date(s.createdAt).getTime() < groupStart) return false;
                // Apply vehicle filter if group is specific make/model
                if (group.vehicleFilterType === "specific") {
                  if (group.vehicleMake && s.make.toLowerCase() !== group.vehicleMake.toLowerCase()) return false;
                  if (group.vehicleModel && !s.model.toLowerCase().startsWith(group.vehicleModel.toLowerCase())) return false;
                }
                return true;
              });
              filtered.sort((a, b) => points(b.rarity) - points(a.rarity));
              setMemberSpots(filtered);
            } catch {
              setMemberSpots([]);
            } finally {
              setLoadingMemberSpots(false);
            }
          };

          return (
            <>
              {/* Invite button for group creators */}
              {isCreator && (
                <button
                  onClick={() => setInviteGroup(membership.group)}
                  className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-accent-coral rounded-[12px]"
                >
                  <UserPlus size={18} className="text-white" />
                  <span className="text-[14px] font-semibold text-white">Invite Members</span>
                </button>
              )}

              {podiumMembers.length >= 2 && (
                <div className="flex items-end justify-center gap-3 mb-4">
                  <PodiumSlotGeneric name={podiumMembers[1].name} label={initials(podiumMembers[1].name)} points={podiumMembers[1].totalPoints} rank={2} barHeight={60} color="#C0C0C0" avatarSize={48} strokeWidth={2} />
                  <PodiumSlotGeneric name={podiumMembers[0].name} label={initials(podiumMembers[0].name)} points={podiumMembers[0].totalPoints} rank={1} barHeight={80} color="#FFD700" avatarSize={56} strokeWidth={3} showCrown />
                  {podiumMembers.length >= 3 ? (
                    <PodiumSlotGeneric name={podiumMembers[2].name} label={initials(podiumMembers[2].name)} points={podiumMembers[2].totalPoints} rank={3} barHeight={44} color="#CD7F32" avatarSize={44} strokeWidth={2} />
                  ) : (
                    <div className="flex-1 max-w-[90px]" />
                  )}
                </div>
              )}
              <div className="flex flex-col gap-2 mb-4">
                {members.map((m) => {
                  const rank = m.rank;
                  return (
                    <button key={m.email} onClick={() => handleMemberClick(m)} className="flex items-center gap-3 px-4 py-3 bg-bg-card rounded-[12px] w-full text-left">
                      <span className={`text-[16px] font-bold w-5 text-center ${rank <= 3 ? "text-accent-coral" : "text-text-muted"}`}>{rank}</span>
                      <div className="w-9 h-9 rounded-full bg-bg-elevated flex items-center justify-center shrink-0">
                        <span className="text-[12px] font-semibold text-text-primary">{initials(m.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-text-primary truncate">{m.name}</p>
                        <p className="text-[11px] text-text-muted">{m.totalSpots} cars spotted</p>
                      </div>
                      <span className="text-[16px] font-bold text-accent-coral mr-1">{m.totalPoints}</span>
                      <ChevronRight size={16} className="text-text-muted shrink-0" />
                    </button>
                  );
                })}
              </div>
            </>
          );
        })()
      )}

      {/* DrivenHistory promo */}
      <button
        onClick={() => window.open("https://www.drivenhistory.com", "_blank")}
        className="w-full flex items-center gap-3.5 p-4 bg-bg-card rounded-[16px] border border-accent-coral/20"
      >
        <img src="/dh-logo-horizontal.png" alt="DH" className="w-12 h-12 rounded-[12px] object-contain" />
        <div className="flex-1 text-left flex flex-col gap-1">
          <p className="text-[14px] font-semibold text-text-primary">Capture your Car History</p>
          <p className="text-[12px] text-text-secondary">View your garage on DrivenHistory.com</p>
        </div>
        <ArrowRight size={20} className="text-accent-coral shrink-0" />
      </button>

      {/* Create group sheet */}
      <CreateGroupSheet
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(group) => {
          setShowCreateGroup(false);
          setNewGroupInvite(group);
        }}
      />

      {/* Invite sheet for group creators */}
      {inviteGroup && (
        <InviteSheet open={!!inviteGroup} onClose={() => setInviteGroup(null)} group={inviteGroup} />
      )}

      {/* Invite sheet after creating a new group */}
      {newGroupInvite && (
        <InviteSheet open={!!newGroupInvite} onClose={() => setNewGroupInvite(null)} group={newGroupInvite} />
      )}

      {/* Member spots detail sheet */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setSelectedMember(null)}>
          <div className="w-full max-w-md bg-bg-page rounded-t-[24px] p-6 safe-bottom max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border-strong rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center">
                  <span className="text-[13px] font-semibold text-text-primary">{initials(selectedMember.member.name)}</span>
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-text-primary">{selectedMember.member.name}</h3>
                  <p className="text-[12px] text-text-muted">{selectedMember.member.totalPoints} pts · {selectedMember.member.totalSpots} cars</p>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center">
                <X size={18} className="text-text-muted" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingMemberSpots ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
                </div>
              ) : memberSpots.length === 0 ? (
                <p className="text-center text-[14px] text-text-muted py-8">No cars spotted yet</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {memberSpots.map((car) => {
                    const pts = points(car.rarity);
                    return (
                      <div key={car.id} className="flex items-center gap-3 px-3 py-2.5 bg-bg-card rounded-[10px]">
                        {car.imageUrl ? (
                          <img src={car.imageUrl} alt="" className="w-11 h-11 rounded-[8px] object-cover shrink-0" />
                        ) : (
                          <div className="w-11 h-11 rounded-[8px] bg-bg-elevated flex items-center justify-center shrink-0">
                            <span className="text-[18px]">🚗</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-text-primary truncate">
                            {car.year ? `${car.year} ` : ""}{car.make} {car.model}
                          </p>
                          {car.rarity && (
                            <span className={`text-[11px] font-medium text-rarity-${rarityKey(car.rarity)}`}>
                              {car.rarity}
                            </span>
                          )}
                        </div>
                        <span className="text-[15px] font-bold text-accent-coral">{pts} pt{pts === 1 ? "" : "s"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scoring sheet */}
      {showScoring && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowScoring(false)}>
          <div className="w-full max-w-md bg-bg-page rounded-t-[24px] p-6 safe-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border-strong rounded-full mx-auto mb-5" />
            <h3 className="text-xl font-semibold text-text-primary text-center mb-3">How Scoring Works</h3>
            <p className="text-[13px] text-text-secondary text-center mb-5">
              Each car you spot earns points based on its rarity. AI determines rarity when identifying the car.
            </p>
            <div className="space-y-2 mb-6">
              {Object.entries(RARITY_POINTS).map(([name, pts]) => (
                <div key={name} className="flex items-center px-4 py-2.5 bg-bg-card rounded-[10px]">
                  <div className={`w-2 h-2 rounded-full bg-rarity-${name.toLowerCase().replace(/\s+/g, "-")} mr-3`} />
                  <span className="text-[14px] font-medium text-text-primary flex-1">{name}</span>
                  <span className={`text-[14px] font-bold text-rarity-${name.toLowerCase().replace(/\s+/g, "-")}`}>
                    {pts} pt{pts === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowScoring(false)}
              className="w-full py-3.5 bg-accent-coral rounded-[14px] text-white font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </PullToRefresh>
  );
}

function EmptyState({ message = "No spots yet", sub = "Be the first to spot a car!" }: { message?: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <p className="text-4xl mb-3">🏆</p>
      <p className="text-[15px] font-medium text-text-secondary">{message}</p>
      <p className="text-[13px] text-text-muted mt-1">{sub}</p>
    </div>
  );
}

function PodiumSlotGeneric({
  name,
  label,
  points,
  rank,
  barHeight,
  color,
  avatarSize,
  strokeWidth,
  showCrown,
}: {
  name: string;
  label: string;
  points: number;
  rank: number;
  barHeight: number;
  color: string;
  avatarSize: number;
  strokeWidth: number;
  showCrown?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2 max-w-[90px]">
      {showCrown && <Crown size={20} style={{ color }} className="mb-[-4px]" />}
      <div
        className="rounded-full bg-bg-elevated flex items-center justify-center shrink-0"
        style={{ width: avatarSize, height: avatarSize, border: `${strokeWidth}px solid ${color}` }}
      >
        <span className="text-[13px] font-semibold text-text-primary">{label}</span>
      </div>
      <p className="text-[13px] font-semibold text-text-primary truncate max-w-full">{name.split(" ")[0]}</p>
      <p className="text-[11px] text-text-secondary">{points.toLocaleString()} pts</p>
      <div
        className="w-20 rounded-t-[12px] flex items-center justify-center"
        style={{ height: barHeight, backgroundColor: `${color}30` }}
      >
        <span className="text-[20px] font-bold" style={{ color }}>{rank}</span>
      </div>
    </div>
  );
}

function PodiumSlot({
  entry,
  rank,
  barHeight,
  color,
  avatarSize,
  strokeWidth,
  initials,
  showCrown,
}: {
  entry: LeaderboardEntry;
  rank: number;
  barHeight: number;
  color: string;
  avatarSize: number;
  strokeWidth: number;
  initials: (name: string) => string;
  showCrown?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2 max-w-[90px]">
      {showCrown && <Crown size={20} style={{ color }} className="mb-[-4px]" />}
      <div
        className="rounded-full bg-bg-elevated flex items-center justify-center shrink-0"
        style={{ width: avatarSize, height: avatarSize, border: `${strokeWidth}px solid ${color}` }}
      >
        <span className="text-[13px] font-semibold text-text-primary">{initials(entry.name)}</span>
      </div>
      <p className="text-[13px] font-semibold text-text-primary truncate max-w-full">{entry.name.split(" ")[0]}</p>
      <p className="text-[11px] text-text-secondary">{entry.totalPoints.toLocaleString()} pts</p>
      <div
        className="w-20 rounded-t-[12px] flex items-center justify-center"
        style={{ height: barHeight, backgroundColor: `${color}30` }}
      >
        <span className="text-[20px] font-bold" style={{ color }}>{rank}</span>
      </div>
    </div>
  );
}
