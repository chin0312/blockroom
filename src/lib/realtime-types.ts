import type { AvatarVariant } from "@/lib/profile";

export type MemberFocusStatus = "focusing" | "paused" | "available";

export type RoomMember = {
  clientId: string;
  address: string;
  chainId?: number;
  visible: boolean;
  status: MemberFocusStatus;
  muted: boolean;
  sharing: boolean;
  cameraOn: boolean;
  avatar: AvatarVariant;
  joinedAt: string;
  activityAt: string;
  updatedAt: string;
};

export type LobbyMember = {
  clientId: string;
  roomSlug: string;
  address: string;
  joinedAt: string;
  updatedAt: string;
};

export type RoomParticipant = RoomMember & {
  /** Canonical Room identity. Never includes a chain or connection id. */
  participantKey: string;
  primarySessionId: string;
  sessionIds: string[];
  sessionCount: number;
};

export type RtcSignal = {
  senderId: string;
  targetId: string;
  kind: "offer" | "answer" | "ice";
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

export type RoomMessage = {
  id: string;
  clientId: string;
  address: string;
  body: string;
  sentAt: string;
};

export type RealtimeMode = "supabase" | "local-tabs";
export type RealtimeStatus = "idle" | "connecting" | "connected" | "error";

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
