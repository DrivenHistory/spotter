"use client";

import { Plus, ChevronRight } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import type { Group, GroupMembership } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  groups: GroupMembership[];
  onSelectGroup: (group: Group) => void;
  onCreateNew: () => void;
}

export function GroupPickerSheet({ open, onClose, groups, onSelectGroup, onCreateNew }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Invite Friends">
      <div className="flex flex-col gap-3 pb-8">
        <p className="text-[13px] text-text-secondary mb-1">
          Choose a group to invite friends to, or create a new one.
        </p>

        {/* Existing groups */}
        {groups.map((m) => (
          <button
            key={m.group.id}
            onClick={() => onSelectGroup(m.group)}
            className="w-full flex items-center gap-3 p-3.5 bg-bg-card rounded-[12px] text-left"
          >
            <div className="w-10 h-10 rounded-[12px] bg-bg-elevated flex items-center justify-center text-[20px] shrink-0">
              {m.group.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-text-primary truncate">{m.group.name}</p>
              <p className="text-[12px] text-text-secondary">{m.group.memberCount} members</p>
            </div>
            <ChevronRight size={20} className="text-text-muted shrink-0" />
          </button>
        ))}

        {/* Create new group option */}
        <button
          onClick={onCreateNew}
          className="w-full flex items-center gap-3 p-3.5 rounded-[12px] border border-dashed border-accent-coral/40 text-left"
        >
          <div className="w-10 h-10 rounded-[12px] bg-accent-coral/10 flex items-center justify-center shrink-0">
            <Plus size={20} className="text-accent-coral" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-accent-coral">Create New Group</p>
            <p className="text-[12px] text-text-secondary">Start a new group and invite friends</p>
          </div>
        </button>
      </div>
    </BottomSheet>
  );
}
