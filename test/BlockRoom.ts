import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { keccak256, stringToHex } from "viem";
import { network } from "hardhat";

describe("BlockRoom", async function () {
  const { viem, networkHelpers } = await network.create();

  async function deployBlockRoom() {
    const contract = await viem.deployContract("BlockRoom");
    const [owner, other] = await viem.getWalletClients();
    return { contract, owner, other };
  }

  async function validSession(
    contract: Awaited<ReturnType<typeof viem.deployContract>>,
    duration = 1_800n,
    suffix = "1",
  ) {
    const endedAt = BigInt(await networkHelpers.time.latest());
    const startedAt = endedAt - duration;
    const sessionId = keccak256(stringToHex(`session-${suffix}`));
    const roomId = keccak256(stringToHex("learning-room-1"));
    await contract.write.recordSession([
      sessionId,
      roomId,
      startedAt,
      endedAt,
      duration,
    ]);
    return { sessionId, roomId, startedAt, endedAt, duration };
  }

  it("rejects a session under 30 minutes", async function () {
    const { contract } = await deployBlockRoom();
    const endedAt = BigInt(await networkHelpers.time.latest());
    await viem.assertions.revertWithCustomError(
      contract.write.recordSession([
        keccak256(stringToHex("short")),
        keccak256(stringToHex("learning-room-1")),
        endedAt - 1_799n,
        endedAt,
        1_799n,
      ]),
      contract,
      "SessionTooShort",
    );
  });

  it("accepts one eligible session and stores exact totals", async function () {
    const { contract, owner } = await deployBlockRoom();
    const session = await validSession(contract, 4_500n, "valid");

    assert.equal(await contract.read.isSessionRecorded([session.sessionId]), true);
    assert.equal(await contract.read.totalCompletedSessions([owner.account.address]), 1n);
    assert.equal(await contract.read.totalCumulativeDuration([owner.account.address]), 4_500n);
    const stored = await contract.read.getSession([session.sessionId]);
    assert.equal(stored.owner.toLowerCase(), owner.account.address.toLowerCase());
    assert.equal(stored.durationSeconds, 4_500n);
  });

  it("rejects duplicate session IDs", async function () {
    const { contract } = await deployBlockRoom();
    const session = await validSession(contract, 1_800n, "duplicate");
    await viem.assertions.revertWithCustomError(
      contract.write.recordSession([
        session.sessionId,
        session.roomId,
        session.startedAt,
        session.endedAt,
        session.duration,
      ]),
      contract,
      "SessionAlreadyRecorded",
    );
  });

  it("supports multiple sessions and cumulative duration", async function () {
    const { contract, owner } = await deployBlockRoom();
    await validSession(contract, 2_700n, "multi-1");
    await validSession(contract, 4_200n, "multi-2");

    assert.equal(await contract.read.totalCompletedSessions([owner.account.address]), 2n);
    assert.equal(await contract.read.totalCumulativeDuration([owner.account.address]), 6_900n);
    assert.equal((await contract.read.getSessionIds([owner.account.address])).length, 2);
  });

  it("rejects inconsistent timestamps and duration", async function () {
    const { contract } = await deployBlockRoom();
    const endedAt = BigInt(await networkHelpers.time.latest());
    await viem.assertions.revertWithCustomError(
      contract.write.recordSession([
        keccak256(stringToHex("inconsistent")),
        keccak256(stringToHex("learning-room-1")),
        endedAt - 2_000n,
        endedAt,
        1_800n,
      ]),
      contract,
      "InconsistentDuration",
    );
  });

  it("rejects zero identifiers and end times beyond the allowed clock drift", async function () {
    const { contract } = await deployBlockRoom();
    const latest = BigInt(await networkHelpers.time.latest());
    const zeroId = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const sessionId = keccak256(stringToHex("malformed-session"));
    const roomId = keccak256(stringToHex("learning-room-1"));

    await viem.assertions.revertWithCustomError(
      contract.write.recordSession([
        zeroId,
        roomId,
        latest - 1_800n,
        latest,
        1_800n,
      ]),
      contract,
      "ZeroSessionId",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.recordSession([
        sessionId,
        zeroId,
        latest - 1_800n,
        latest,
        1_800n,
      ]),
      contract,
      "ZeroRoomId",
    );

    const futureEnd = latest + 600n;
    await viem.assertions.revertWithCustomError(
      contract.write.recordSession([
        sessionId,
        roomId,
        futureEnd - 1_800n,
        futureEnd,
        1_800n,
      ]),
      contract,
      "EndTimeTooFarInFuture",
    );
  });

  it("gates and mints First Session once", async function () {
    const { contract } = await deployBlockRoom();
    await viem.assertions.revertWithCustomError(
      contract.write.claimBadge([1n]),
      contract,
      "BadgeNotEligible",
    );
    await validSession(contract, 1_800n, "first-badge");
    await contract.write.claimBadge([1n]);
    assert.equal(await contract.read.balanceOf([contract.address, 1n]), 0n);
    const [owner] = await viem.getWalletClients();
    assert.equal(await contract.read.balanceOf([owner.account.address, 1n]), 1n);
    await viem.assertions.revertWithCustomError(
      contract.write.claimBadge([1n]),
      contract,
      "BadgeAlreadyClaimed",
    );
  });

  it("gates 24 Hour Focus until 86,400 cumulative seconds", async function () {
    const { contract, owner } = await deployBlockRoom();
    await validSession(contract, 86_399n, "almost-24h");
    await viem.assertions.revertWithCustomError(
      contract.write.claimBadge([2n]),
      contract,
      "BadgeNotEligible",
    );
    await validSession(contract, 1_800n, "over-24h");
    await contract.write.claimBadge([2n]);
    assert.equal(await contract.read.balanceOf([owner.account.address, 2n]), 1n);
  });

  it("rejects transfers because badges are soulbound", async function () {
    const { contract, owner, other } = await deployBlockRoom();
    await validSession(contract, 1_800n, "soulbound");
    await contract.write.claimBadge([1n]);
    await viem.assertions.revertWithCustomError(
      contract.write.safeTransferFrom([
        owner.account.address,
        other.account.address,
        1n,
        1n,
        "0x",
      ]),
      contract,
      "Soulbound",
    );
  });

  it("returns embedded metadata for both badges", async function () {
    const { contract } = await deployBlockRoom();
    assert.match(await contract.read.uri([1n]), /^data:application\/json;base64,/);
    assert.match(await contract.read.uri([2n]), /^data:application\/json;base64,/);
  });
});
