"use client";

import { useState } from "react";
import { Plus, Info, CircleCheckBig } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { useGroups } from "@/lib/groups-context";
import type { Group } from "@/lib/api";

const ICONS = ["🏎️", "🏁", "⚡", "🔥", "💎"];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (group: Group) => void;
}

export function CreateGroupSheet({ open, onClose, onCreated }: Props) {
  const { createGroup } = useGroups();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Please enter a group name"); return; }
    if (trimmed.length < 2) { setError("Name must be at least 2 characters"); return; }
    setError(null);
    setSubmitting(true);
    try {
      const group = await createGroup(trimmed, icon);
      setName("");
      setIcon(ICONS[0]);
      onCreated(group);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Create a Group">
      <div className="flex flex-col gap-5 pb-8">
        {/* Group Name */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-text-secondary">Group Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            placeholder="e.g. Garage Crew"
            maxLength={30}
            className="w-full h-12 rounded-[12px] bg-bg-elevated border border-border-subtle px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent-coral transition-colors"
          />
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <div className="flex items-center gap-1.5">
            <Info size={14} className="text-text-muted shrink-0" />
            <span className="text-[11px] text-text-muted">Group names are checked for inappropriate content</span>
          </div>
        </div>

        {/* Group Icon */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-text-secondary">Group Icon</label>
          <div className="flex gap-3">
            {ICONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setIcon(emoji)}
                className={`w-12 h-12 rounded-[12px] flex items-center justify-center text-[22px] transition-all ${
                  icon === emoji
                    ? "bg-accent-coral ring-2 ring-accent-coral"
                    : "bg-bg-elevated"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Note */}
        <div className="flex items-center justify-center gap-1.5">
          <CircleCheckBig size={14} className="text-green-500" />
          <span className="text-[12px] text-text-secondary">You&apos;ll be added as the first member</span>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={submitting}
          className="w-full h-[52px] rounded-[14px] bg-accent-coral flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Plus size={20} className="text-white" />
              <span className="text-[16px] font-bold text-white">Create Group</span>
            </>
          )}
        </button>
      </div>
    </BottomSheet>
  );
}
