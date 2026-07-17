import { keccak256, parseAbi, stringToHex, type Address, type Hex } from "viem";
import type { SupportedChainId } from "@/config/chains";

export const BLOCKROOM_MIN_SESSION_SECONDS = 30 * 60;
export const FIRST_SESSION_BADGE_ID = 1n;
export const FOCUS_24_HOURS_BADGE_ID = 2n;
export const FOCUS_24_HOURS_SECONDS = 86_400;

export const sessionContractAbi = parseAbi([
  "function recordSession(bytes32 sessionId, bytes32 roomId, uint64 startedAt, uint64 endedAt, uint64 durationSeconds)",
  "function isSessionRecorded(bytes32 sessionId) view returns (bool)",
  "function getSession(bytes32 sessionId) view returns ((address owner, bytes32 roomId, uint64 startedAt, uint64 endedAt, uint64 durationSeconds, uint64 recordedAt))",
  "function getSessionIds(address owner) view returns (bytes32[])",
  "function totalCompletedSessions(address owner) view returns (uint256)",
  "function totalCumulativeDuration(address owner) view returns (uint256)",
  "event SessionRecorded(address indexed owner, bytes32 indexed sessionId, bytes32 indexed roomId, uint64 startedAt, uint64 endedAt, uint64 durationSeconds, uint64 recordedAt)",
]);

export const badgeContractAbi = parseAbi([
  "function isBadgeEligible(address owner, uint256 badgeId) view returns (bool)",
  "function hasClaimedBadge(address owner, uint256 badgeId) view returns (bool)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function claimBadge(uint256 badgeId)",
  "function uri(uint256 badgeId) view returns (string)",
  "function sessions() view returns (address)",
  "event BadgeClaimed(address indexed owner, uint256 indexed badgeId)",
]);

export function roomIdForSlug(roomSlug: string): Hex {
  return keccak256(stringToHex(roomSlug));
}

export function createSessionId({
  chainId,
  walletAddress,
  roomSlug,
  nonce = crypto.randomUUID(),
}: {
  chainId: SupportedChainId;
  walletAddress: Address;
  roomSlug: string;
  nonce?: string;
}): Hex {
  return keccak256(
    stringToHex(
      `${chainId}:${walletAddress.toLowerCase()}:${roomSlug}:${nonce}`,
    ),
  );
}
