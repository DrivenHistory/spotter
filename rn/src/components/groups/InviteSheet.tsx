"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, MessageCircle, Share2, Search, Send, Check } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { groups as groupsApi, type Group, type UserSearchResult } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  group: Group;
}

export function InviteSheet({ open, onClose, group }: Props) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitedEmails, setInvitedEmails] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch invite link on open
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const link = await groupsApi.getInviteLink(group.id);
        setInviteUrl(link.url);
        setInviteCode(link.code);
      } catch {
        setInviteUrl(`spotter.app/join/${group.id.slice(0, 4).toUpperCase()}`);
        setInviteCode(group.id.slice(0, 4).toUpperCase());
      }
    })();
  }, [open, group.id]);

  // Debounced user search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { users } = await groupsApi.searchUsers(searchQuery);
        setSearchResults(users);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  const handleShare = async (via?: "message") => {
    const url = inviteUrl ?? "";
    const text = `Join my group "${group.name}" on Spotter!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${group.name}`, text, url });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  const handleInviteUser = async (email: string) => {
    try {
      await groupsApi.inviteUser(group.id, email);
      setInvitedEmails((prev) => new Set(prev).add(email));
    } catch { /* failed */ }
  };

  const initials = (name: string) => {
    const parts = name.split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={`Invite to ${group.name}`}>
      <div className="flex flex-col gap-5 pb-8">
        {/* Share Invite Link */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[13px] font-semibold text-text-secondary">Share Invite Link</h3>
          <p className="text-[12px] text-text-muted">
            Share this link with friends. Non-users will get a unique 4-digit code to join after signing up.
          </p>

          {/* Link + Copy */}
          <div className="flex gap-2">
            <div className="flex-1 h-12 rounded-[12px] bg-bg-elevated border border-border-subtle px-3.5 flex items-center">
              <span className="text-[14px] text-text-muted truncate">
                {inviteUrl ?? "Loading..."}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="w-12 h-12 rounded-[12px] bg-accent-coral flex items-center justify-center shrink-0"
            >
              {copied ? (
                <Check size={20} className="text-white" />
              ) : (
                <Copy size={20} className="text-white" />
              )}
            </button>
          </div>

          {/* Share buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleShare("message")}
              className="flex-1 h-11 rounded-[12px] bg-bg-elevated flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} className="text-accent-coral" />
              <span className="text-[13px] font-semibold text-text-primary">Message</span>
            </button>
            <button
              onClick={() => handleShare()}
              className="flex-1 h-11 rounded-[12px] bg-bg-elevated flex items-center justify-center gap-2"
            >
              <Share2 size={18} className="text-accent-coral" />
              <span className="text-[13px] font-semibold text-text-primary">Share</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border-subtle" />

        {/* Invite Existing User */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[13px] font-semibold text-text-secondary">Invite Existing User</h3>
          <p className="text-[12px] text-text-muted">
            Send an in-app push notification to an existing Spotter user.
          </p>

          {/* Search input */}
          <div className="flex items-center gap-2 h-12 rounded-[12px] bg-bg-elevated border border-border-subtle px-3.5">
            <Search size={18} className="text-text-muted shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email"
              className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none"
            />
          </div>

          {/* Search results */}
          {searching && (
            <div className="flex justify-center py-3">
              <div className="w-5 h-5 border-2 border-accent-coral border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {searchResults.map((u) => (
            <div
              key={u.email}
              className="flex items-center gap-3 p-3 bg-bg-elevated rounded-[12px]"
            >
              <div className="w-10 h-10 rounded-full bg-accent-coral flex items-center justify-center shrink-0">
                <span className="text-[13px] font-bold text-white">{initials(u.displayName)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-text-primary truncate">{u.displayName}</p>
                <p className="text-[12px] text-text-secondary truncate">{u.email}</p>
              </div>
              {invitedEmails.has(u.email) ? (
                <div className="w-[72px] h-8 rounded-[8px] bg-green-600/20 flex items-center justify-center gap-1">
                  <Check size={14} className="text-green-500" />
                  <span className="text-[12px] font-semibold text-green-500">Sent</span>
                </div>
              ) : (
                <button
                  onClick={() => handleInviteUser(u.email)}
                  className="w-[72px] h-8 rounded-[8px] bg-accent-coral flex items-center justify-center gap-1"
                >
                  <Send size={14} className="text-white" />
                  <span className="text-[12px] font-semibold text-white">Invite</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Push notification preview */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-text-muted">Push Notification Preview</span>
          <div className="flex items-center gap-3 p-3.5 bg-bg-elevated rounded-[16px] border border-border-subtle">
            <div className="w-9 h-9 rounded-[8px] bg-accent-coral flex items-center justify-center shrink-0">
              <span className="text-[16px] font-bold text-white">S</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text-primary">Spotter</p>
              <p className="text-[12px] text-text-secondary">
                You&apos;ve been invited to join &apos;{group.name}&apos; {group.icon}
              </p>
            </div>
            <span className="text-[11px] text-text-muted shrink-0">now</span>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
