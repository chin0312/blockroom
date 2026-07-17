import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { keccak256, stringToHex } from "viem";
import { network } from "hardhat";

type StoredSession = {
  owner: `0x${string}`;
  roomId: `0x${string}`;
  startedAt: bigint;
  endedAt: bigint;
  durationSeconds: bigint;
  recordedAt: bigint;
};

describe("BlockRoom v1 contracts", async function () {
  const { viem, networkHelpers } = await network.create();

  async function deployBlockRoom() {
    const sessions = await viem.deployContract("BlockRoomSessions");
    const badges = await viem.deployContract("BlockRoomBadges", [sessions.address]);
    const [owner, other] = await viem.getWalletClients();
    return { sessions, badges, owner, other };
  }

  async function validSession(
    sessions: Awaited<ReturnType<typeof viem.deployContract>>,
    duration = 1_800n,
    suffix = "1",
  ) {
    const endedAt = BigInt(await networkHelpers.time.latest());
    const startedAt = endedAt - duration;
    const sessionId = keccak256(stringToHex(`session-${suffix}`));
    const roomId = keccak256(stringToHex("learning-room-1"));
    await sessions.write.recordSession([
      sessionId,
      roomId,
      startedAt,
      endedAt,
      duration,
    ]);
    return { sessionId, roomId, startedAt, endedAt, duration };
  }

  it("rejects a session under 30 minutes", async function () {
    const { sessions } = await deployBlockRoom();
    const endedAt = BigInt(await networkHelpers.time.latest());
    await viem.assertions.revertWithCustomError(
      sessions.write.recordSession([
        keccak256(stringToHex("short")),
        keccak256(stringToHex("learning-room-1")),
        endedAt - 1_799n,
        endedAt,
        1_799n,
      ]),
      sessions,
      "SessionTooShort",
    );
  });

  it("accepts one eligible session and stores exact totals", async function () {
    const { sessions, owner } = await deployBlockRoom();
    const session = await validSession(sessions, 4_500n, "valid");

    assert.equal(await sessions.read.isSessionRecorded([session.sessionId]), true);
    assert.equal(await sessions.read.totalCompletedSessions([owner.account.address]), 1n);
    assert.equal(await sessions.read.totalCumulativeDuration([owner.account.address]), 4_500n);
    const stored = (await sessions.read.getSession([
      session.sessionId,
    ])) as StoredSession;
    assert.equal(stored.owner.toLowerCase(), owner.account.address.toLowerCase());
    assert.equal(stored.durationSeconds, 4_500n);
  });

  it("rejects duplicate session IDs", async function () {
    const { sessions } = await deployBlockRoom();
    const session = await validSession(sessions, 1_800n, "duplicate");
    await viem.assertions.revertWithCustomError(
      sessions.write.recordSession([
        session.sessionId,
        session.roomId,
        session.startedAt,
        session.endedAt,
        session.duration,
      ]),
      sessions,
      "SessionAlreadyRecorded",
    );
  });

  it("supports multiple sessions and cumulative duration", async function () {
    const { sessions, owner } = await deployBlockRoom();
    await validSession(sessions, 2_700n, "multi-1");
    await validSession(sessions, 4_200n, "multi-2");

    assert.equal(await sessions.read.totalCompletedSessions([owner.account.address]), 2n);
    assert.equal(await sessions.read.totalCumulativeDuration([owner.account.address]), 6_900n);
    const sessionIds = (await sessions.read.getSessionIds([
      owner.account.address,
    ])) as readonly `0x${string}`[];
    assert.equal(sessionIds.length, 2);
  });

  it("rejects inconsistent timestamps and duration", async function () {
    const { sessions } = await deployBlockRoom();
    const endedAt = BigInt(await networkHelpers.time.latest());
    await viem.assertions.revertWithCustomError(
      sessions.write.recordSession([
        keccak256(stringToHex("inconsistent")),
        keccak256(stringToHex("learning-room-1")),
        endedAt - 2_000n,
        endedAt,
        1_800n,
      ]),
      sessions,
      "InconsistentDuration",
    );
  });

  it("rejects zero identifiers and end times beyond the allowed clock drift", async function () {
    const { sessions } = await deployBlockRoom();
    const latest = BigInt(await networkHelpers.time.latest());
    const zeroId = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const sessionId = keccak256(stringToHex("malformed-session"));
    const roomId = keccak256(stringToHex("learning-room-1"));

    await viem.assertions.revertWithCustomError(
      sessions.write.recordSession([zeroId, roomId, latest - 1_800n, latest, 1_800n]),
      sessions,
      "ZeroSessionId",
    );
    await viem.assertions.revertWithCustomError(
      sessions.write.recordSession([sessionId, zeroId, latest - 1_800n, latest, 1_800n]),
      sessions,
      "ZeroRoomId",
    );

    const futureEnd = latest + 600n;
    await viem.assertions.revertWithCustomError(
      sessions.write.recordSession([sessionId, roomId, futureEnd - 1_800n, futureEnd, 1_800n]),
      sessions,
      "EndTimeTooFarInFuture",
    );
  });

  it("gates and mints First Session once from the Session contract", async function () {
    const { sessions, badges, owner } = await deployBlockRoom();
    await viem.assertions.revertWithCustomError(
      badges.write.claimBadge([1n]),
      badges,
      "BadgeNotEligible",
    );
    await validSession(sessions, 1_800n, "first-badge");
    await badges.write.claimBadge([1n]);
    assert.equal(await badges.read.balanceOf([owner.account.address, 1n]), 1n);
    await viem.assertions.revertWithCustomError(
      badges.write.claimBadge([1n]),
      badges,
      "BadgeAlreadyClaimed",
    );
  });

  it("gates 24 Hour Focus until Session totals reach 86,400 seconds", async function () {
    const { sessions, badges, owner } = await deployBlockRoom();
    await validSession(sessions, 86_399n, "almost-24h");
    await viem.assertions.revertWithCustomError(
      badges.write.claimBadge([2n]),
      badges,
      "BadgeNotEligible",
    );
    await validSession(sessions, 1_800n, "over-24h");
    await badges.write.claimBadge([2n]);
    assert.equal(await badges.read.balanceOf([owner.account.address, 2n]), 1n);
  });

  it("rejects transfers because badges are soulbound", async function () {
    const { sessions, badges, owner, other } = await deployBlockRoom();
    await validSession(sessions, 1_800n, "soulbound");
    await badges.write.claimBadge([1n]);
    await viem.assertions.revertWithCustomError(
      badges.write.safeTransferFrom([
        owner.account.address,
        other.account.address,
        1n,
        1n,
        "0x",
      ]),
      badges,
      "Soulbound",
    );
  });

  it("returns embedded metadata for both badges", async function () {
    const { badges } = await deployBlockRoom();
    assert.match(
      (await badges.read.uri([1n])) as string,
      /^data:application\/json;base64,/,
    );
    assert.match(
      (await badges.read.uri([2n])) as string,
      /^data:application\/json;base64,/,
    );
  });
});
