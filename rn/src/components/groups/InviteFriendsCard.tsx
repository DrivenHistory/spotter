"use client";

import { UsersRound, ChevronRight } from "lucide-react";

export function InviteFriendsCard({ onTap }: { onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3.5 p-4 bg-bg-card rounded-[16px] border border-accent-coral text-left"
    >
      <div className="w-11 h-11 rounded-full bg-accent-coral flex items-center justify-center shrink-0">
        <UsersRound size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-semibold text-text-primary">Invite Friends</p>
        <p className="text-[12px] text-text-secondary">Create a game & compete together</p>
      </div>
      <ChevronRight size={20} className="text-accent-coral shrink-0" />
    </button>
  );
}
