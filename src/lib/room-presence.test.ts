import { describe, expect, it } from "vitest";
import type { RoomMember } from "@/lib/realtime-types";
import {
  clampParticipantPage,
  freshRoomSessions,
  isSessionAdmitted,
  lobbyOccupancy,
  normalizeWalletAddress,
  participantPageSize,
  reconcileRoomParticipants,
  roomCapacityState,
} from "@/lib/room-presence";

const address = (index: number) => `0x${index.toString(16).padStart(40, "0")}`;
const baseTime = Date.parse("2026-07-17T00:00:00.000Z");
const session = (
  wallet: string,
  clientId: string,
  offset = 0,
  updates: Partial<RoomMember> = {},
): RoomMember => {
  const time = new Date(baseTime + offset).toISOString();
  return {
    clientId,
    address: wallet,
    chainId: 10143,
    visible: true,
    status: "focusing",
    muted: true,
    sharing: false,
    cameraOn: false,
    avatar: "violet",
    joinedAt: time,
    activityAt: time,
    updatedAt: time,
    ...updates,
  };
};

describe("Room canonical presence", () => {
  it("normalizes EVM identity case-insensitively", () => {
    expect(normalizeWalletAddress(" 0xAbC ")).toBe("0xabc");
  });

  it("covers A-C: removes only the leaving session and releases final slots", () => {
    let raw = [session(address(1), "a"), session(address(2), "b", 1), session(address(3), "c", 2)];
    expect(roomCapacityState(raw).occupied).toBe(3);
    raw = raw.filter((item) => item.clientId !== "b");
    expect(reconcileRoomParticipants(raw).map((item) => item.address)).toEqual([address(1), address(3)]);
    raw = raw.filter((item) => item.clientId !== "a");
    raw = raw.filter((item) => item.clientId !== "c");
    expect(roomCapacityState(raw)).toMatchObject({ occupied: 0, available: 6, full: false });
  });

  it("covers D-F: admits six unique wallets, rejects seven, then admits a replacement", () => {
    let raw = Array.from({ length: 6 }, (_, index) => session(address(index + 1), `s${index + 1}`, index));
    expect(roomCapacityState(raw)).toMatchObject({ occupied: 6, available: 0, full: true });
    raw.push(session(address(7), "s7", 7));
    expect(isSessionAdmitted(raw, "s7")).toBe(false);
    expect(reconcileRoomParticipants(raw)).toHaveLength(6);
    raw = raw.filter((item) => item.clientId !== "s3");
    expect(isSessionAdmitted(raw, "s7")).toBe(true);
    expect(reconcileRoomParticipants(raw).map((item) => item.address)).not.toContain(address(3));
  });

  it("covers G: remains bounded through twenty replacement cycles", () => {
    const raw = Array.from({ length: 6 }, (_, index) => session(address(index + 1), `initial-${index}`, index));
    for (let cycle = 0; cycle < 20; cycle += 1) {
      raw.shift();
      raw.push(session(address(20 + cycle), `replacement-${cycle}`, 100 + cycle));
      expect(roomCapacityState(raw).occupied).toBe(6);
      expect(reconcileRoomParticipants(raw)).toHaveLength(6);
    }
    expect(raw).toHaveLength(6);
  });

  it("covers H: deterministically resolves simultaneous sixth and seventh joins", () => {
    const firstFive = Array.from({ length: 5 }, (_, index) => session(address(index + 1), `s${index + 1}`, index));
    const candidates = [session(address(6), "six", 10), session(address(7), "seven", 10)];
    const raw = [...firstFive, ...candidates];
    expect([isSessionAdmitted(raw, "six"), isSessionAdmitted(raw, "seven")].filter(Boolean)).toHaveLength(1);
    expect(roomCapacityState(raw).occupied).toBe(6);
  });

  it("covers J-M: groups tabs and chains by wallet until the final session leaves", () => {
    const wallet = address(1).toUpperCase().replace("0X", "0x");
    let raw = [
      session(wallet, "monad", 0, { chainId: 10143 }),
      session(address(1), "base", 1, { chainId: 84532, activityAt: new Date(baseTime + 20).toISOString() }),
    ];
    const participants = reconcileRoomParticipants(raw);
    expect(participants).toHaveLength(1);
    expect(participants[0]).toMatchObject({ sessionCount: 2, chainId: 84532 });
    raw = raw.filter((item) => item.clientId !== "monad");
    expect(reconcileRoomParticipants(raw)).toHaveLength(1);
    raw = raw.filter((item) => item.clientId !== "base");
    expect(reconcileRoomParticipants(raw)).toHaveLength(0);
  });

  it("covers I and S: expires an abnormal disconnect at the documented timeout", () => {
    const stale = session(address(1), "stale", 0, { updatedAt: new Date(baseTime).toISOString() });
    expect(freshRoomSessions([stale], baseTime + 89_999)).toHaveLength(1);
    expect(freshRoomSessions([stale], baseTime + 90_000)).toHaveLength(0);
  });

  it("covers N: heartbeat timestamps do not make chain context flicker", () => {
    const oldActivity = new Date(baseTime).toISOString();
    const newActivity = new Date(baseTime + 100).toISOString();
    const raw = [
      session(address(1), "monad", 0, { chainId: 10143, activityAt: newActivity, updatedAt: newActivity }),
      session(address(1), "base", 1, { chainId: 84532, activityAt: oldActivity, updatedAt: new Date(baseTime + 1000).toISOString() }),
    ];
    expect(reconcileRoomParticipants(raw)[0].chainId).toBe(10143);
  });

  it("covers O: capacity ignores chain distribution", () => {
    const chainIds = [10143, 10143, 84532, 84532, 11155111, 11155111];
    const raw = chainIds.map((chainId, index) => session(address(index + 1), `s${index}`, index, { chainId }));
    expect(roomCapacityState(raw).full).toBe(true);
  });

  it("deduplicates lobby occupancy by wallet rather than connection", () => {
    expect(lobbyOccupancy([
      { clientId: "a", roomSlug: "one", address: address(1), joinedAt: "x", updatedAt: "x" },
      { clientId: "b", roomSlug: "one", address: address(1).toUpperCase(), joinedAt: "x", updatedAt: "x" },
      { clientId: "c", roomSlug: "one", address: address(2), joinedAt: "x", updatedAt: "x" },
    ], ["one"])).toEqual({ one: 2 });
  });
});

describe("responsive participant pagination", () => {
  it("covers P-Q: uses stable viewport buckets and clamps page two after departure", () => {
    expect(participantPageSize(390, 844)).toBe(2);
    expect(participantPageSize(844, 390)).toBe(3);
    expect(participantPageSize(800, 900)).toBe(4);
    expect(participantPageSize(1440, 900)).toBe(6);
    expect(clampParticipantPage(2, 6, 2)).toBe(2);
    expect(clampParticipantPage(2, 4, 2)).toBe(1);
    expect(clampParticipantPage(1, 0, 2)).toBe(0);
  });
});
