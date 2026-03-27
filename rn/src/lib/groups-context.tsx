"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import {
  groups as groupsApi,
  type Group,
  type GroupMembership,
  type GroupInvite,
} from "./api";

interface GroupsCtx {
  myGroups: GroupMembership[];
  pendingInvites: GroupInvite[];
  isLoading: boolean;
  refreshGroups: () => Promise<void>;
  createGroup: (name: string, icon: string, vehicleFilterType?: "all" | "specific", vehicleMake?: string, vehicleModel?: string) => Promise<Group>;
  joinByCode: (code: string) => Promise<{ ok: boolean; groupId?: string; error?: string }>;
  acceptInvite: (inviteId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
}

const GroupsContext = createContext<GroupsCtx | null>(null);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState<GroupMembership[]>([]);
  const [pendingInvites, setPendingInvites] = useState<GroupInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const [groupsRes, invitesRes] = await Promise.allSettled([
        groupsApi.getMyGroups(),
        groupsApi.getMyInvites(),
      ]);
      if (groupsRes.status === "fulfilled") {
        setMyGroups(groupsRes.value.memberships);
      }
      // If API fails, keep existing local groups (don't clear them)
      setPendingInvites(
        invitesRes.status === "fulfilled" ? invitesRes.value.invites : []
      );
    } catch {
      // Keep existing groups, just clear invites
      setPendingInvites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) refreshGroups();
    else {
      setMyGroups([]);
      setPendingInvites([]);
    }
  }, [user, refreshGroups]);

  const createGroup = async (name: string, icon: string, vehicleFilterType?: "all" | "specific", vehicleMake?: string, vehicleModel?: string): Promise<Group> => {
    try {
      const { group } = await groupsApi.create(name, icon, vehicleFilterType, vehicleMake, vehicleModel);
      await refreshGroups();
      return group;
    } catch {
      // Backend not ready — create locally so the UI still works
      const localGroup: Group = {
        id: `local-${Date.now()}`,
        name,
        icon,
        creatorEmail: user?.email ?? "",
        creatorName: user?.name ?? "",
        memberCount: 1,
        totalSpots: 0,
        totalPoints: 0,
        createdAt: new Date().toISOString(),
        vehicleFilterType: vehicleFilterType ?? "all",
        vehicleMake: vehicleMake ?? null,
        vehicleModel: vehicleModel ?? null,
      };
      const membership: GroupMembership = {
        group: localGroup,
        role: "creator",
        joinedAt: localGroup.createdAt,
      };
      setMyGroups((prev) => [...prev, membership]);
      return localGroup;
    }
  };

  const joinByCode = async (code: string) => {
    const result = await groupsApi.joinByCode(code);
    if (result.ok) await refreshGroups();
    return result;
  };

  const acceptInvite = async (inviteId: string) => {
    await groupsApi.acceptInvite(inviteId);
    await refreshGroups();
  };

  const declineInvite = async (inviteId: string) => {
    await groupsApi.declineInvite(inviteId);
    await refreshGroups();
  };

  const leaveGroup = async (groupId: string) => {
    await groupsApi.leave(groupId);
    await refreshGroups();
  };

  const deleteGroup = async (groupId: string) => {
    // Optimistic removal so UI updates immediately
    setMyGroups((prev) => prev.filter((m) => m.group.id !== groupId));
    try {
      await groupsApi.delete(groupId);
      await refreshGroups();
    } catch {
      // API not yet deployed — keep optimistic removal, don't refresh
    }
  };

  return (
    <GroupsContext.Provider
      value={{
        myGroups,
        pendingInvites,
        isLoading,
        refreshGroups,
        createGroup,
        joinByCode,
        acceptInvite,
        declineInvite,
        leaveGroup,
        deleteGroup,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error("useGroups must be inside GroupsProvider");
  return ctx;
}
