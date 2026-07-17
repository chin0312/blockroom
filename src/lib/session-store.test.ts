import { describe, expect, it } from "vitest";
import type { Address } from "viem";
import {
  advanceSession,
  createSessionDraft,
  finalizeSessionDraft,
  splitSessionAcrossLocalDays,
} from "./session-store";
import { defaultChainConfig, supportedChains } from "@/config/chains";

const wallet = "0x0000000000000000000000000000000000000001" as Address;

describe("session store", () => {
  it("creates a unique in-progress session and crosses eligibility at 30 minutes", () => {
    const session = createSessionDraft({
      walletAddress: wallet,
      roomSlug: "learning-room-1",
      chainId: defaultChainConfig.chainId,
      ownerId: "tab-a",
      nowSeconds: 1_000,
      nonce: "one",
    });
    expect(advanceSession(session, 2_799).status).toBe("in-progress");
    const eligible = advanceSession(session, 2_800);
    expect(eligible.status).toBe("eligible");
    expect(eligible.durationSeconds).toBe(1_800);
  });

  it("drops a short visit and freezes one exact eligible record", () => {
    const session = createSessionDraft({
      walletAddress: wallet,
      roomSlug: "learning-room-1",
      chainId: defaultChainConfig.chainId,
      ownerId: "tab-a",
      nowSeconds: 1_000,
      nonce: "two",
    });
    expect(finalizeSessionDraft(session, 2_000)).toBeNull();
    const finalized = finalizeSessionDraft(session, 5_500);
    expect(finalized).toMatchObject({
      startedAt: 1_000,
      endedAt: 5_500,
      durationSeconds: 4_500,
      status: "awaiting-confirmation",
    });
    expect(finalizeSessionDraft(finalized!, 8_000)).toEqual(finalized);
  });

  it("creates different IDs for separate joined visits", () => {
    const first = createSessionDraft({
      walletAddress: wallet,
      roomSlug: "learning-room-1",
      chainId: defaultChainConfig.chainId,
      ownerId: "tab-a",
      nowSeconds: 1_000,
      nonce: "first",
    });
    const second = createSessionDraft({
      walletAddress: wallet,
      roomSlug: "learning-room-1",
      chainId: defaultChainConfig.chainId,
      ownerId: "tab-a",
      nowSeconds: 3_000,
      nonce: "second",
    });
    expect(first.sessionId).not.toBe(second.sessionId);
  });

  it("includes the selected chain in the session identity", () => {
    const first = createSessionDraft({
      walletAddress: wallet,
      roomSlug: "learning-room-1",
      chainId: supportedChains[0].chainId,
      ownerId: "tab-a",
      nowSeconds: 1_000,
      nonce: "same-nonce",
    });
    const second = createSessionDraft({
      walletAddress: wallet,
      roomSlug: "learning-room-1",
      chainId: supportedChains[1].chainId,
      ownerId: "tab-a",
      nowSeconds: 1_000,
      nonce: "same-nonce",
    });
    expect(first.sessionId).not.toBe(second.sessionId);
  });

  it("splits a session across local midnight without losing seconds", () => {
    const startDate = new Date(2026, 6, 16, 23, 30, 0);
    const endDate = new Date(2026, 6, 17, 1, 0, 0);
    const split = splitSessionAcrossLocalDays(
      Math.floor(startDate.getTime() / 1000),
      Math.floor(endDate.getTime() / 1000),
    );
    expect([...split.values()].reduce((sum, value) => sum + value, 0)).toBe(5_400);
    expect(split.size).toBe(2);
  });
});
