"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Globe, LogOut, Trash2, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { user as userApi } from "@/lib/api";

interface Settings {
  displayName: string | null;
  email: string;
  bio: string | null;
}

export function ProfileTab({ onBack }: { onBack?: () => void }) {
  const { user, logout, deleteAccount } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await userApi.getSettings();
        setSettings(s);
      } catch { /* ignore */ }
    })();
  }, []);

  const displayName = settings?.displayName ?? user?.name ?? "—";
  const initials = (() => {
    const parts = displayName.split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : displayName.slice(0, 2).toUpperCase();
  })();

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-6 pt-2 pb-32">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-5">
        {onBack && (
          <button onClick={onBack} className="text-text-primary">
            <ArrowLeft size={24} />
          </button>
        )}
        <h1 className="text-2xl font-semibold text-text-primary font-display">Profile</h1>
      </div>

      {/* Avatar card */}
      <div className="flex flex-col items-center py-5 bg-bg-card rounded-[16px] border border-border-subtle mb-5">
        <div className="w-[72px] h-[72px] rounded-full bg-accent-coral/15 flex items-center justify-center mb-3">
          <span className="text-2xl font-bold text-accent-coral">{initials}</span>
        </div>
        <p className="text-[18px] font-semibold text-text-primary">{displayName}</p>
        <p className="text-[13px] text-text-muted mt-0.5">{user?.email}</p>
      </div>

      {/* Settings rows */}
      <div className="bg-bg-card rounded-[16px] border border-border-subtle overflow-hidden mb-5">
        <SettingsRow icon={<Pencil size={16} />} label="Edit Profile" onClick={() => setShowEdit(true)} />
        <div className="h-px bg-border-subtle mx-4" />
        <SettingsRow
          icon={<Globe size={16} />}
          label="Open Driven History"
          onClick={() => window.open("https://www.drivenhistory.com", "_blank")}
        />
        <div className="h-px bg-border-subtle mx-4" />
        <SettingsRow
          icon={<LogOut size={16} />}
          label="Sign Out"
          color="text-text-secondary"
          onClick={() => setShowLogoutConfirm(true)}
        />
      </div>

      {/* Powered by DH */}
      <div className="flex items-center justify-center gap-2 mb-5 opacity-50">
        <span className="text-[11px] text-text-muted">Powered by</span>
        <span className="text-[11px] font-bold text-text-secondary tracking-wide">DRIVEN HISTORY</span>
      </div>

      {/* Danger zone */}
      <div className="p-4 bg-bg-card rounded-[16px] border border-danger-red/20">
        <p className="text-[13px] font-semibold text-danger-red mb-3">Danger Zone</p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-3 flex items-center justify-center gap-2 bg-danger-red/10 rounded-[12px] border border-danger-red/30 text-danger-red text-[14px] font-medium"
        >
          <Trash2 size={16} /> Delete Account
        </button>
        <p className="text-[11px] text-text-muted mt-3">
          This will permanently delete your account and all spotted cars. This action cannot be undone.
        </p>
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
  color = "text-text-primary",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5">
      <span className={color}>{icon}</span>
      <span className={`flex-1 text-left text-[15px] font-medium ${color}`}>{label}</span>
      <ChevronRight size={12} className="text-text-tertiary" />
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
        <h3 className="text-xl font-semibold text-text-primary font-display text-center mb-5">Edit Profile</h3>

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
