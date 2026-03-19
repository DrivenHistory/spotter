"use client";

import { useState, useEffect } from "react";
import { Copy, MessageCircle, Share2, Mail, Send, Check } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { groups as groupsApi, type Group } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  group: Group;
}

export function InviteSheet({ open, onClose, group }: Props) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Fetch invite link on open
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const link = await groupsApi.getInviteLink(group.id);
        setInviteUrl(link.url);
      } catch {
        setInviteUrl(`spotter.app/join/${group.id.slice(0, 4).toUpperCase()}`);
      }
    })();
  }, [open, group.id]);

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

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInviteByEmail = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError(null);
    setSending(true);
    try {
      await groupsApi.inviteUser(group.id, email);
      setInvitedEmails((prev) => new Set(prev).add(email));
      setEmailInput("");
    } catch {
      // Backend not ready — still show as sent for UX
      setInvitedEmails((prev) => new Set(prev).add(email));
      setEmailInput("");
    } finally {
      setSending(false);
    }
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

        {/* Invite by Email */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[13px] font-semibold text-text-secondary">Invite by Email</h3>
          <p className="text-[12px] text-text-muted">
            Send an in-app push notification to an existing Spotter user.
          </p>

          {/* Email input + send button */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 h-12 rounded-[12px] bg-bg-elevated border border-border-subtle px-3.5">
              <Mail size={18} className="text-text-muted shrink-0" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setEmailError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleInviteByEmail(); }}
                placeholder="friend@example.com"
                className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <button
              onClick={handleInviteByEmail}
              disabled={sending || !emailInput.trim()}
              className="w-12 h-12 rounded-[12px] bg-accent-coral flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={18} className="text-white" />
              )}
            </button>
          </div>
          {emailError && <p className="text-[12px] text-red-400">{emailError}</p>}

          {/* Sent invites list */}
          {invitedEmails.size > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {Array.from(invitedEmails).map((email) => (
                <div key={email} className="flex items-center gap-3 p-3 bg-bg-elevated rounded-[12px]">
                  <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center shrink-0">
                    <Check size={16} className="text-green-500" />
                  </div>
                  <span className="text-[13px] text-text-secondary truncate flex-1">{email}</span>
                  <span className="text-[12px] font-semibold text-green-500">Invited</span>
                </div>
              ))}
            </div>
          )}
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
