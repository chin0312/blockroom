import type { LobbyMember, RoomMember, RoomParticipant } from "@/lib/realtime-types";

export const ROOM_DISCONNECT_TIMEOUT_MS = 90_000;

export function freshRoomSessions(
  sessions: RoomMember[],
  nowMs = Date.now(),
  timeoutMs = ROOM_DISCONNECT_TIMEOUT_MS,
) {
  return sessions.filter(
    (session) => nowMs - timestamp(session.updatedAt) < timeoutMs,
  );
}

export function normalizeWalletAddress(address: string) {
  return typeof address === "string" ? address.trim().toLowerCase() : "";
}

function timestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function validSession(session: RoomMember) {
  return Boolean(session.clientId && normalizeWalletAddress(session.address));
}

function sessionRank(a: RoomMember, b: RoomMember) {
  return timestamp(a.joinedAt) - timestamp(b.joinedAt) ||
    a.clientId.localeCompare(b.clientId);
}

function contextRank(a: RoomMember, b: RoomMember) {
  // Heartbeats only change updatedAt. Chain context therefore stays stable until
  // a meaningful activity update changes activityAt. A focused/visible session
  // wins ties, then the stable connection id prevents flicker.
  return Number(b.visible) - Number(a.visible) ||
    timestamp(b.activityAt) - timestamp(a.activityAt) ||
    timestamp(b.joinedAt) - timestamp(a.joinedAt) ||
    a.clientId.localeCompare(b.clientId);
}

export function groupRoomSessions(sessions: RoomMember[]) {
  const grouped = new Map<string, RoomMember[]>();
  sessions.filter(validSession).forEach((session) => {
    const key = normalizeWalletAddress(session.address);
    grouped.set(key, [...(grouped.get(key) ?? []), session]);
  });
  grouped.forEach((items) => items.sort(sessionRank));
  return grouped;
}

export function reconcileRoomParticipants(
  sessions: RoomMember[],
  capacity = 6,
): RoomParticipant[] {
  const grouped = groupRoomSessions(sessions);
  return Array.from(grouped.entries())
    .map(([participantKey, participantSessions]) => {
      const representative = [...participantSessions].sort(contextRank)[0];
      const firstSession = participantSessions[0];
      return {
        ...representative,
        participantKey,
        primarySessionId: firstSession.clientId,
        address: participantKey,
        joinedAt: firstSession.joinedAt,
        sessionIds: participantSessions.map((session) => session.clientId).sort(),
        sessionCount: participantSessions.length,
      } satisfies RoomParticipant;
    })
    .sort((a, b) =>
      timestamp(a.joinedAt) - timestamp(b.joinedAt) ||
      a.participantKey.localeCompare(b.participantKey),
    )
    .slice(0, capacity);
}

export function roomCapacityState(sessions: RoomMember[], capacity = 6) {
  const participants = reconcileRoomParticipants(sessions, capacity);
  return {
    participants,
    occupied: participants.length,
    available: Math.max(0, capacity - participants.length),
    full: participants.length >= capacity,
  };
}

export function isSessionAdmitted(
  sessions: RoomMember[],
  clientId: string,
  capacity = 6,
) {
  return reconcileRoomParticipants(sessions, capacity)
    .some((participant) => participant.sessionIds.includes(clientId));
}

export function lobbyOccupancy(
  members: LobbyMember[],
  roomSlugs: string[],
) {
  const participants = lobbyParticipants(members, roomSlugs);
  return Object.fromEntries(roomSlugs.map((slug) => [slug, participants[slug].length]));
}

export function lobbyParticipants(
  members: LobbyMember[],
  roomSlugs: string[],
) {
  const addressesByRoom = new Map(roomSlugs.map((slug) => [slug, new Set<string>()]));
  members.forEach((member) => {
    const normalized = normalizeWalletAddress(member.address);
    if (normalized) addressesByRoom.get(member.roomSlug)?.add(normalized);
  });
  return Object.fromEntries(roomSlugs.map((slug) => [
    slug,
    Array.from(addressesByRoom.get(slug) ?? []).sort(),
  ]));
}

export function clampParticipantPage(page: number, count: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(count / Math.max(1, pageSize)));
  return Math.min(Math.max(0, page), pageCount - 1);
}

export function participantPageSize(width: number, height: number) {
  if (width <= 640) return width > height ? 3 : 2;
  if (width <= 900 && height <= 500) return 3;
  if (width <= 900 || height < 650) return 4;
  return 6;
}
