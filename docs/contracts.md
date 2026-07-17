# BlockRoom v1 Contract Reference

## Architecture

Every supported chain receives two non-upgradeable contracts:

1. `BlockRoomSessions` records wallet-signed Session self-attestations.
2. `BlockRoomBadges` stores the immutable Session contract address and reads
   confirmed totals directly when checking Badge eligibility.

Neither contract has an owner/admin role, payment path, relayer, upgrade proxy
or privileged mint function.

## Session contract

```solidity
recordSession(
  bytes32 sessionId,
  bytes32 roomId,
  uint64 startedAt,
  uint64 endedAt,
  uint64 durationSeconds
)
```

`msg.sender` becomes the record owner. The contract rejects zero identifiers,
duplicate Session IDs, durations below 1,800 seconds, invalid time order,
duration unequal to `endedAt - startedAt`, and end times more than five minutes
ahead of the current block timestamp.

Reads:

- `totalCompletedSessions(address)`
- `totalCumulativeDuration(address)`
- `isSessionRecorded(bytes32)`
- `getSession(bytes32)`
- `getSessionIds(address)`

The unbounded ID array is acceptable for Public Beta. A larger production
history requires pagination or an indexer.

## Badge contract

Constructor:

```solidity
constructor(address sessionContract)
```

Reads and writes:

- `isBadgeEligible(address,uint256)`
- `hasClaimedBadge(address,uint256)`
- `balanceOf(address,uint256)`
- `claimBadge(uint256)`
- `uri(uint256)`

Token 1 requires one confirmed Session. Token 2 requires 86,400 confirmed
seconds. ERC-1155 transfers and operator approvals revert, making both tokens
non-transferable achievements.

## Trust boundary

The Session contract validates timestamp and duration consistency but cannot
prove that the caller was present, focused, or using the BlockRoom interface.
A wallet can construct a syntactically valid historic interval. Public Beta
records are therefore wallet-signed self-attestations, not proof of
productivity.

## Multi-chain registry

The frontend reads supported networks and per-chain contract addresses only
from `src/config/chains.ts`. Confirmed history and Badge state are always scoped
to the connected chain. No cross-chain aggregation is performed in v1.

Supported deployment names:

| Network | Hardhat name | Chain ID |
|---|---|---:|
| Monad Testnet | `monadTestnet` | 10143 |
| Base Sepolia | `baseSepolia` | 84532 |
| Ethereum Sepolia | `ethereumSepolia` | 11155111 |

## Public Beta deployment record

Deployed and read-verified on 2026-07-17. The same deployer nonce sequence
produced the same contract addresses on all three chains; state remains
chain-specific.

| Network | Session transaction | Badge transaction |
|---|---|---|
| Monad Testnet | [`0x8f6c…bfaf`](https://testnet.monadscan.com/tx/0x8f6caae45b7a1f282b1e5312c2eaba16b56b1f3c2397f8f9a3d917cc2835bfaf) | [`0x91af…96d1`](https://testnet.monadscan.com/tx/0x91af0e72aa69e2704d92d02ed8d1291383c840a0c074c1d4bca13f5cf55396d1) |
| Base Sepolia | [`0xbd15…0170`](https://sepolia.basescan.org/tx/0xbd15942190277ff11ea29a0db2e0a04ad09c0507e58b9ce9c18adcf0ff320170) | [`0x2557…3ec8`](https://sepolia.basescan.org/tx/0x2557d0e6c81dfd3b17751135fdc199edc4f30e2994bd6077f34ca22e23d83ec8) |
| Ethereum Sepolia | [`0x6ea3…ae30`](https://sepolia.etherscan.io/tx/0x6ea3324701170aaa863c54ed3ec5f505076cb31f177d6945bcede13be545ae30) | [`0x6756…c157`](https://sepolia.etherscan.io/tx/0x6756cd1b96e3ec9aa753294e5b4fc909924b057c7a726bc2bef2c367ece7c157) |

Contracts on every supported chain:

- Session: [`0xBE1594148dDD4e7FF3A4ABbF47Be9a9fF2c59092`](https://sepolia.etherscan.io/address/0xBE1594148dDD4e7FF3A4ABbF47Be9a9fF2c59092#code)
- Badge: [`0xD53C628c4859A7460b5F2Ea0885bb4Da2d9fe1d1`](https://sepolia.etherscan.io/address/0xD53C628c4859A7460b5F2Ea0885bb4Da2d9fe1d1#code)

Both contracts are verified on MonadScan, Basescan and Etherscan, as well as
Sourcify. Ethereum Sepolia is additionally verified on Blockscout. Read QA
confirmed deployed bytecode, the 1,800-second threshold, zero initial totals,
the Badge-to-Session immutable link and embedded metadata on all three chains.

## Deployment and verification

1. Run all contract tests.
2. Fund the approved deployer on the target testnet.
3. Load `BLOCKROOM_DEPLOYER_PRIVATE_KEY` from a local secret environment.
4. Run `npx hardhat --network <network> --build-profile production ignition deploy ignition/modules/BlockRoom.ts`.
5. Record the real Session and Badge addresses from Ignition output.
6. Set the matching `NEXT_PUBLIC_*_SESSION_CONTRACT` and
   `NEXT_PUBLIC_*_BADGE_CONTRACT` variables.
7. Verify the Session contract.
8. Verify the Badge contract with the Session address as constructor argument.
9. Rebuild and smoke-test the frontend on that network.

Verification commands:

```bash
npx hardhat --network <network> --build-profile production verify <session-address>
npx hardhat --network <network> --build-profile production verify <badge-address> <session-address>
```

Monad uses a Hardhat custom chain descriptor for Etherscan V2. Base Sepolia and
Ethereum Sepolia use their supported Etherscan-family explorers. Verification
requires an actual API credential and is never reported as complete before the
explorer confirms it.

## Viem examples

```ts
const ids = await publicClient.readContract({
  address: chain.contracts.sessions,
  abi: sessionContractAbi,
  functionName: "getSessionIds",
  args: [walletAddress],
});

const hash = await walletClient.writeContract({
  address: chain.contracts.sessions,
  abi: sessionContractAbi,
  functionName: "recordSession",
  args: [sessionId, roomId, startedAt, endedAt, endedAt - startedAt],
  chain: chain.network,
  account: walletAddress,
});
```

The frontend checks `isSessionRecorded(sessionId)` before writing and marks a
record confirmed only after a successful receipt.

## Events

- `SessionRecorded(owner, sessionId, roomId, startedAt, endedAt, durationSeconds, recordedAt)`
- `BadgeClaimed(owner, badgeId)`

Events are suitable for a future indexer but are not currently used to imply a
backend or cross-chain aggregation layer.
