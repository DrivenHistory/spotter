"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Globe, LogOut, Trash2, ChevronRight, Check, X, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useGroups } from "@/lib/groups-context";
import { user as userApi, spotter, type Group } from "@/lib/api";
import { points } from "@/lib/rarity";
import { InviteSheet } from "@/components/groups/InviteSheet";

interface Settings {
  displayName: string | null;
  email: string;
  bio: string | null;
}

export function ProfileTab({ onBack }: { onBack?: () => void }) {
  const { user, logout, deleteAccount } = useAuth();
  const { myGroups, pendingInvites, acceptInvite, declineInvite, leaveGroup } = useGroups();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<string | null>(null);
  const [inviteGroup, setInviteGroup] = useState<Group | null>(null);
  const [stats, setStats] = useState<{ spotted: number; pts: number; rank: number | null }>({ spotted: 0, pts: 0, rank: null });

  useEffect(() => {
    (async () => {
      try {
        const s = await userApi.getSettings();
        setSettings(s);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { spots } = await spotter.getFeed();
        // Compute all-time points per spotter for ranking
        const pointsBySpotter: Record<string, number> = {};
        for (const s of spots) {
          const key = s.spotterEmail.toLowerCase();
          pointsBySpotter[key] = (pointsBySpotter[key] ?? 0) + points(s.rarity);
        }
        const sorted = Object.entries(pointsBySpotter).sort((a, b) => b[1] - a[1]);
        const myEmail = user.email.toLowerCase();
        const rankIndex = sorted.findIndex(([email]) => email === myEmail);
        const mySpots = spots.filter((s) => s.spotterEmail.toLowerCase() === myEmail);
        const totalPts = mySpots.reduce((s, c) => s + points(c.rarity), 0);
        setStats({ spotted: mySpots.length, pts: totalPts, rank: rankIndex >= 0 ? rankIndex + 1 : null });
      } catch { /* ignore */ }
    })();
  }, [user]);

  const displayName = settings?.displayName ?? user?.name ?? "—";
  const initials = (() => {
    const parts = displayName.split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : displayName.slice(0, 2).toUpperCase();
  })();

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-5 pb-24">
      {/* Header with back button */}
      {onBack && (
        <button onClick={onBack} className="text-text-primary mb-4">
          <ArrowLeft size={24} />
        </button>
      )}

      {/* Avatar + info */}
      <div className="flex flex-col items-center gap-3 mb-5">
        <div className="w-20 h-20 rounded-full bg-accent-coral flex items-center justify-center">
          <span className="text-[28px] font-bold text-white">{initials}</span>
        </div>
        <p className="text-[22px] font-bold text-text-primary">{displayName}</p>
        <p className="text-[14px] text-text-secondary">{user?.email}</p>

        {/* Stats row */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[20px] font-bold text-text-primary">{stats.spotted}</span>
            <span className="text-[12px] text-text-secondary">Spotted</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[20px] font-bold text-accent-coral">{stats.pts}</span>
            <span className="text-[12px] text-text-secondary">Points</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[20px] font-bold text-[#FFD700]">{stats.rank ? `#${stats.rank}` : "—"}</span>
            <span className="text-[12px] text-text-secondary">Rank</span>
          </div>
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[18px] font-semibold text-text-primary">Pending Invites</h3>
            <span className="w-6 h-6 rounded-full bg-accent-coral flex items-center justify-center text-[12px] font-bold text-white">
              {pendingInvites.length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-3.5 bg-bg-card rounded-[12px]">
                <div className="w-10 h-10 rounded-[12px] bg-bg-elevated flex items-center justify-center text-[20px] shrink-0">
                  {inv.groupIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text-primary truncate">{inv.groupName}</p>
                  <p className="text-[12px] text-text-secondary">Invited by {inv.inviterName}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptInvite(inv.id).catch(() => {})}
                    className="w-9 h-9 rounded-[8px] bg-accent-coral flex items-center justify-center"
                  >
                    <Check size={18} className="text-white" />
                  </button>
                  <button
                    onClick={() => declineInvite(inv.id).catch(() => {})}
                    className="w-9 h-9 rounded-[8px] bg-bg-elevated flex items-center justify-center"
                  >
                    <X size={18} className="text-text-muted" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group Memberships */}
      {myGroups.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[18px] font-semibold text-text-primary mb-3">Group Memberships</h3>
          <div className="flex flex-col gap-3">
            {myGroups.map((m) => (
              <div key={m.group.id} className="flex items-center gap-3 p-3.5 bg-bg-card rounded-[12px]">
                <div className="w-10 h-10 rounded-[12px] bg-bg-elevated flex items-center justify-center text-[20px] shrink-0">
                  {m.group.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text-primary truncate">{m.group.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-text-secondary">{m.group.memberCount} members</span>
                    <span className="text-[12px] text-text-muted">·</span>
                    <span className={`text-[12px] font-semibold ${m.role === "creator" ? "text-accent-coral" : "text-text-secondary"}`}>
                      {m.role === "creator" ? "Creator" : "Member"}
                    </span>
                  </div>
                </div>
                {m.role === "creator" ? (
                  <button
                    onClick={() => setInviteGroup(m.group)}
                    className="w-9 h-9 rounded-[8px] bg-bg-elevated flex items-center justify-center"
                  >
                    <UserPlus size={18} className="text-accent-coral" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLeaveConfirm(m.group.id)}
                    className="w-9 h-9 rounded-[8px] bg-danger-red/10 flex items-center justify-center"
                  >
                    <LogOut size={16} className="text-danger-red" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings card */}
      <div className="bg-bg-card rounded-[16px] overflow-hidden mb-5">
        <SettingsRow icon={<Pencil size={20} />} label="Edit Profile" onClick={() => setShowEdit(true)} />
        <div className="h-px bg-[#27272A]" />
        <SettingsRow icon={<Globe size={20} />} label="Open Driven History" onClick={() => window.open("https://www.drivenhistory.com", "_blank")} />
        <div className="h-px bg-[#27272A]" />
        <SettingsRow icon={<LogOut size={20} />} label="Sign Out" onClick={() => setShowLogoutConfirm(true)} />
      </div>

      {/* Danger zone */}
      <div className="bg-bg-card rounded-[16px] border border-danger-red/20 overflow-hidden mb-5">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <Trash2 size={20} className="text-danger-red" />
            <span className="text-[15px] text-danger-red">Delete Account</span>
          </div>
          <ChevronRight size={20} className="text-danger-red/50" />
        </button>
      </div>

      {/* Powered by DH */}
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-[11px] text-text-muted">Powered by</span>
        <img src="/dh-logo-horizontal.png" alt="Driven History" className="w-[120px] h-[50px] object-contain opacity-50" />
      </div>

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <ConfirmModal
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmLabel="Sign Out"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={async () => { await logout(); setShowLogoutConfirm(false); }}
        />
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Account"
          message="This will permanently delete your account and all data. This cannot be undone."
          confirmLabel="Delete"
          danger
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={async () => { await deleteAccount(); setShowDeleteConfirm(false); }}
        />
      )}

      {/* Leave group confirm */}
      {showLeaveConfirm && (
        <ConfirmModal
          title="Leave Group"
          message="Are you sure you want to leave this group? You'll need a new invite to rejoin."
          confirmLabel="Leave"
          danger
          onCancel={() => setShowLeaveConfirm(null)}
          onConfirm={async () => { await leaveGroup(showLeaveConfirm).catch(() => {}); setShowLeaveConfirm(null); }}
        />
      )}

      {/* Invite to group sheet */}
      {inviteGroup && (
        <InviteSheet
          open={!!inviteGroup}
          onClose={() => setInviteGroup(null)}
          group={inviteGroup}
        />
      )}

      {/* Edit profile sheet */}
      {showEdit && (
        <EditProfileSheet
          settings={settings}
          onClose={() => setShowEdit(false)}
          onSaved={(s) => { setSettings(s); setShowEdit(false); }}
        />
      )}
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="text-text-secondary">{icon}</span>
        <span className="text-[15px] text-text-primary">{label}</span>
      </div>
      <ChevronRight size={20} className="text-text-muted" />
    </button>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-8" onClick={onCancel}>
      <div className="w-full max-w-sm bg-bg-elevated rounded-[20px] p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-[14px] text-text-secondary mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-[12px] border border-border-subtle text-text-secondary font-medium">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-[12px] font-semibold text-white ${danger ? "bg-danger-red" : "bg-accent-coral"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditProfileSheet({
  settings,
  onClose,
  onSaved,
}: {
  settings: Settings | null;
  onClose: () => void;
  onSaved: (s: Settings) => void;
}) {
  const [displayName, setDisplayName] = useState(settings?.displayName ?? "");
  const [bio, setBio] = useState(settings?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await userApi.updateSettings({ displayName, bio });
      onSaved({ displayName, email: settings?.email ?? "", bio });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md bg-bg-page rounded-t-[24px] p-6 safe-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-border-strong rounded-full mx-auto mb-5" />
        <h3 className="text-xl font-semibold text-text-primary text-center mb-5">Edit Profile</h3>

        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-3.5 bg-bg-card border border-border-subtle rounded-[12px] text-text-primary text-[15px] outline-none focus:border-accent-coral transition-colors"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-3.5 bg-bg-card border border-border-subtle rounded-[12px] text-text-primary text-[15px] outline-none focus:border-accent-coral transition-colors resize-none"
            />
          </div>
        </div>

        {error && <p className="text-danger-red text-sm text-center mb-3">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3.5 bg-accent-coral rounded-[14px] text-white font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
