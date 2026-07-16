import type { Address, Hex } from "viem";
import {
  BLOCKROOM_CHAIN_ID,
  BLOCKROOM_MIN_SESSION_SECONDS,
  createSessionId,
  roomIdForSlug,
} from "@/contracts/blockroom";

export type OnchainSessionStatus =
  | "in-progress"
  | "eligible"
  | "awaiting-confirmation"
  | "submitting"
  | "confirmed"
  | "rejected"
  | "failed";

export type OnchainSessionDraft = {
  sessionId: Hex;
  walletAddress: Address;
  roomSlug: string;
  roomId: Hex;
  chainId: typeof BLOCKROOM_CHAIN_ID;
  startedAt: number;
  endedAt?: number;
  durationSeconds: number;
  lastObservedAt: number;
  ownerId: string;
  status: OnchainSessionStatus;
  txHash?: Hex;
  error?: string;
  confirmedAt?: string;
};

export type ConfirmedSessionRecord = {
  sessionId: Hex;
  walletAddress: Address;
  roomId: Hex;
  roomSlug: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  recordedAt: number;
};

export function createSessionDraft({
  walletAddress,
  roomSlug,
  ownerId,
  nowSeconds = Math.floor(Date.now() / 1000),
  nonce,
}: {
  walletAddress: Address;
  roomSlug: string;
  ownerId: string;
  nowSeconds?: number;
  nonce?: string;
}): OnchainSessionDraft {
  return {
    sessionId: createSessionId({ walletAddress, roomSlug, nonce }),
    walletAddress: walletAddress.toLowerCase() as Address,
    roomSlug,
    roomId: roomIdForSlug(roomSlug),
    chainId: BLOCKROOM_CHAIN_ID,
    startedAt: nowSeconds,
    durationSeconds: 0,
    lastObservedAt: nowSeconds,
    ownerId,
    status: "in-progress",
  };
}

export function isActiveSession(session: OnchainSessionDraft) {
  return session.status === "in-progress" || session.status === "eligible";
}

export function advanceSession(
  session: OnchainSessionDraft,
  nowSeconds = Math.floor(Date.now() / 1000),
): OnchainSessionDraft {
  if (!isActiveSession(session)) return session;
  const durationSeconds = Math.max(0, nowSeconds - session.startedAt);
  return {
    ...session,
    durationSeconds,
    lastObservedAt: nowSeconds,
    status: durationSeconds >= BLOCKROOM_MIN_SESSION_SECONDS ? "eligible" : "in-progress",
  };
}

export function finalizeSessionDraft(
  session: OnchainSessionDraft,
  nowSeconds = Math.floor(Date.now() / 1000),
): OnchainSessionDraft | null {
  const advanced = advanceSession(session, nowSeconds);
  if (advanced.durationSeconds < BLOCKROOM_MIN_SESSION_SECONDS) return null;
  return {
    ...advanced,
    endedAt: advanced.startedAt + advanced.durationSeconds,
    lastObservedAt: advanced.startedAt + advanced.durationSeconds,
    status: "awaiting-confirmation",
    error: undefined,
  };
}

export function localDateKeyFromUnix(unixSeconds: number) {
  const date = new Date(unixSeconds * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function splitSessionAcrossLocalDays(
  startedAt: number,
  endedAt: number,
): Map<string, number> {
  const result = new Map<string, number>();
  let cursor = startedAt;
  while (cursor < endedAt) {
    const cursorDate = new Date(cursor * 1000);
    const nextMidnight = new Date(
      cursorDate.getFullYear(),
      cursorDate.getMonth(),
      cursorDate.getDate() + 1,
    ).getTime() / 1000;
    const segmentEnd = Math.min(endedAt, Math.floor(nextMidnight));
    const key = localDateKeyFromUnix(cursor);
    result.set(key, (result.get(key) ?? 0) + Math.max(0, segmentEnd - cursor));
    cursor = segmentEnd;
  }
  return result;
}
