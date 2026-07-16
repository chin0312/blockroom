# BlockRoom Contract Reference

## Architecture

`contracts/BlockRoom.sol` combines the session ledger and two ERC-1155 badge
types. It is intentionally non-upgradeable, has no owner/admin role, accepts no
payments and contains no token transfer or relayer system.

### Session writes

```solidity
recordSession(
  bytes32 sessionId,
  bytes32 roomId,
  uint64 startedAt,
  uint64 endedAt,
  uint64 durationSeconds
)
```

`msg.sender` becomes the record owner. The contract rejects duplicate/zero
session IDs, zero room IDs, duration below 1,800 seconds, invalid time order,
duration unequal to `endedAt - startedAt`, and end times more than five minutes
ahead of the current block timestamp. Historic submissions remain possible so
an eligible pending record does not expire.

The tolerance accommodates imperfect client clocks; it is not proof of
presence. A caller can construct a syntactically valid historic interval
without using the BlockRoom UI. This MVP is therefore a wallet-signed,
self-attested record.

### Session reads

- `totalCompletedSessions(address)`
- `totalCumulativeDuration(address)`
- `isSessionRecorded(bytes32)`
- `getSession(bytes32)`
- `getSessionIds(address)`

The unbounded ID array is intentionally simple for the testnet demo. A
production system with substantial history should add pagination or an
indexer.

### Badge reads and writes

- `isBadgeEligible(address,uint256)`
- `hasClaimedBadge(address,uint256)`
- `balanceOf(address,uint256)`
- `claimBadge(uint256)`
- `uri(uint256)`

Token 1 requires one confirmed Session. Token 2 requires 86,400 cumulative
seconds. `_update` permits only mint/burn operations, while `setApprovalForAll`
also reverts, so wallet-to-wallet transfer is impossible.

## Deployment

1. Fund a dedicated deployer with Monad Testnet MON.
2. Export `MONAD_DEPLOYER_PRIVATE_KEY` in the shell or ignored `.env.local`.
3. Run `npm run contracts:test`.
4. Run `npm run contracts:deploy`.
5. Record the real address and transaction hash in the README and deployment
   environment.
6. Set `NEXT_PUBLIC_BLOCKROOM_CONTRACT_ADDRESS` and rebuild the frontend.
7. Run `npm run contracts:verify -- <address>` with a supported verifier/API
   key, or use the Monad explorer's Sourcify workflow.

The repository never writes a private key into a deployment file. Ignition
deployment state is ignored by Git.

## Read and write examples

Using Viem with the exported ABI:

```ts
const total = await publicClient.readContract({
  address: blockRoomAddress,
  abi: blockRoomAbi,
  functionName: "totalCumulativeDuration",
  args: [walletAddress],
});

const hash = await walletClient.writeContract({
  address: blockRoomAddress,
  abi: blockRoomAbi,
  functionName: "recordSession",
  args: [sessionId, roomId, startedAt, endedAt, endedAt - startedAt],
  chain: monadTestnet,
  account: walletAddress,
});
```

The frontend additionally checks `isSessionRecorded(sessionId)` before writing
and waits for a successful transaction receipt before updating confirmed UI.

## Events

- `SessionRecorded(owner, sessionId, roomId, startedAt, endedAt, durationSeconds, recordedAt)`
- `BadgeClaimed(owner, badgeId)`

These events are suitable for a future indexer but are not currently used as a
fake persistence layer or analytics feed.
