const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://www.drivenhistory.com";

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...opts.headers } as Record<string, string>,
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text || `HTTP ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (json.error) message = json.error;
      else if (json.message) message = json.message;
    } catch { /* not JSON, use raw text */ }
    throw new APIError(res.status, message);
  }
  return res.json();
}

// ── Auth ──
export const auth = {
  login: (email: string, password: string) =>
    request<{ ok: boolean }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signup: (email: string, username: string, password: string, confirmPassword: string) =>
    request<{ ok: boolean }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, username, password, confirmPassword }),
    }),
  me: () =>
    request<{ session: { email: string; name: string } | null }>("/api/auth/me"),
  logout: () =>
    request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  deleteAccount: () =>
    request<{ ok: boolean }>("/api/auth/delete-account", { method: "DELETE" }),
  requestMagicLink: (email: string) =>
    request<{ ok: boolean; pollId?: string }>("/api/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  pollMagicLink: (pollId: string) =>
    request<{ status: string }>(`/api/auth/magic-link-status?poll=${pollId}`),
  forgotPassword: (email: string) =>
    request<{ ok: boolean }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};

// ── User settings ──
export const user = {
  getSettings: () =>
    request<{ displayName: string | null; email: string; bio: string | null }>(
      "/api/user/settings"
    ),
  updateSettings: (data: { displayName?: string; bio?: string }) =>
    request<{ ok: boolean }>("/api/user/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ── Groups ──
export interface Group {
  id: string;
  name: string;
  icon: string;
  creatorEmail: string;
  creatorName: string;
  memberCount: number;
  totalSpots: number;
  totalPoints: number;
  createdAt: string;
}

export interface GroupMembership {
  group: Group;
  role: "creator" | "member";
  joinedAt: string;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  groupIcon: string;
  inviterName: string;
  inviterEmail: string;
  createdAt: string;
}

export interface GroupLeaderboardEntry {
  group: Group;
  rank: number;
}

export interface GroupMemberEntry {
  email: string;
  name: string;
  totalPoints: number;
  totalSpots: number;
  rank: number;
}

export interface InviteLink {
  code: string;
  url: string;
}

export interface UserSearchResult {
  email: string;
  displayName: string;
}

export const groups = {
  create: (name: string, icon: string) =>
    request<{ group: Group }>("/api/groups", {
      method: "POST",
      body: JSON.stringify({ name, icon }),
    }),
  getMyGroups: () =>
    request<{ memberships: GroupMembership[] }>("/api/groups/mine"),
  getMyInvites: () =>
    request<{ invites: GroupInvite[] }>("/api/groups/invites"),
  acceptInvite: (inviteId: string) =>
    request<{ ok: boolean }>(`/api/groups/invites/${inviteId}/accept`, {
      method: "POST",
    }),
  declineInvite: (inviteId: string) =>
    request<{ ok: boolean }>(`/api/groups/invites/${inviteId}/decline`, {
      method: "POST",
    }),
  leave: (groupId: string) =>
    request<{ ok: boolean }>(`/api/groups/${groupId}/leave`, {
      method: "POST",
    }),
  getInviteLink: (groupId: string) =>
    request<InviteLink>(`/api/groups/${groupId}/invite-link`, {
      method: "POST",
    }),
  inviteUser: (groupId: string, email: string) =>
    request<{ ok: boolean }>(`/api/groups/${groupId}/invite`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  searchUsers: (query: string) =>
    request<{ users: UserSearchResult[] }>(
      `/api/groups/search-users?q=${encodeURIComponent(query)}`
    ),
  getGroupLeaderboard: () =>
    request<{ rankings: GroupLeaderboardEntry[] }>("/api/groups/leaderboard"),
  getGroupMembers: (groupId: string) =>
    request<{ members: GroupMemberEntry[] }>(
      `/api/groups/${groupId}/members`
    ),
};

// ── Spotter ──
export interface SpottedCar {
  id: string;
  spotterEmail: string;
  spotterName: string;
  make: string;
  model: string;
  year?: string;
  type?: string;
  confidence: number;
  description?: string;
  imageUrl?: string;
  marketValue?: string;
  rarity?: string;
  bhp?: string;
  zeroToSixty?: string;
  topSpeed?: string;
  spottedAt?: string;
  createdAt: string;
}

export interface IdentifyResult {
  make: string;
  model: string;
  year?: string;
  type?: string;
  confidence: number;
  description?: string;
  imageUrl?: string;
  marketValue?: string;
  rarity?: string;
  bhp?: string;
  zeroToSixty?: string;
  topSpeed?: string;
}

export const spotter = {
  identify: async (file: File): Promise<IdentifyResult> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/api/ai/identify`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let message = text || `HTTP ${res.status}`;
      try {
        const json = JSON.parse(text);
        if (json.error) message = json.error;
        else if (json.message) message = json.message;
      } catch { /* not JSON */ }
      throw new APIError(res.status, message);
    }
    return res.json();
  },
  save: (data: Omit<IdentifyResult, "confidence"> & { confidence: number; spottedAt?: string }) =>
    request<SpottedCar>("/api/spotter", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getFeed: () => request<{ spots: SpottedCar[] }>("/api/spotter"),
  getWeekly: () =>
    request<{
      spots: SpottedCar[];
      stats: { totalSpotted: number; uniqueSpotters: number; rareFinds: number };
    }>("/api/spotter/weekly"),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/api/spotter/${id}`, { method: "DELETE" }),
};
