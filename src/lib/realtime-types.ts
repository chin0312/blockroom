export type MemberFocusStatus = "focusing" | "paused" | "available";

export type RoomMember = {
  clientId: string;
  address: string;
  status: MemberFocusStatus;
  muted: boolean;
  sharing: boolean;
  cameraOn: boolean;
  joinedAt: string;
  updatedAt: string;
};

export type LobbyMember = {
  clientId: string;
  roomSlug: string;
  updatedAt: string;
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
