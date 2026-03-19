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
  createGroup: (name: string, icon: string) => Promise<Group>;
  acceptInvite: (inviteId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
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
      setMyGroups(
        groupsRes.status === "fulfilled" ? groupsRes.value.memberships : []
      );
      setPendingInvites(
        invitesRes.status === "fulfilled" ? invitesRes.value.invites : []
      );
    } catch {
      setMyGroups([]);
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

  const createGroup = async (name: string, icon: string): Promise<Group> => {
    const { group } = await groupsApi.create(name, icon);
    await refreshGroups();
    return group;
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

  return (
    <GroupsContext.Provider
      value={{
        myGroups,
        pendingInvites,
        isLoading,
        refreshGroups,
        createGroup,
        acceptInvite,
        declineInvite,
        leaveGroup,
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
