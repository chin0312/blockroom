# BlockRoom

BlockRoom is a wallet-identified, real-time Web3 co-learning and co-working
MVP. Connected users join six-person rooms, communicate through real presence,
chat and WebRTC media, and may submit eligible focus sessions to Monad Testnet.

BlockRoom never invents users, occupancy, messages, sessions, transactions or
NFT ownership. On-chain sessions are wallet-signed **self-attestations**: the
contract checks their format and totals, but it cannot prove that a person was
productive or continuously focused.

## Session lifecycle

1. A new unique session ID is created only after a wallet successfully joins a
   room.
2. The timer advances from Join until Leave, refresh, close or account change.
   Working in another browser tab still counts.
3. A visit under 30 continuous minutes is deleted and contributes nothing.
4. At 30 minutes the visit becomes locally eligible, but no final duration is
   submitted while the session is still running.
5. Leaving freezes the exact interval. The wallet may approve the transaction
   immediately or leave the eligible record pending for Dashboard retry.
6. Rejoining always creates a new ID and a new independent 30-minute threshold.
7. A record becomes confirmed only after a successful transaction receipt.
   The contract rejects duplicate session IDs.

Closing the page, rejecting a wallet request or encountering an RPC failure
does not discard an eligible session. Pending records are stored separately in
the current browser and never affect confirmed statistics.

## What is on-chain

`BlockRoom.sol` stores only:

- submitting wallet address
- unique `bytes32` session ID
- hashed room slug (`bytes32`)
- start and end Unix timestamps
- duration in seconds
- block timestamp when recorded

Video, microphone, screen sharing, chat, avatar, realtime presence and wallet
profile settings remain off-chain. Pending transaction state is also local.
The legacy `blockroom-activity-v2` history remains visible as browser-local
Legacy data and is never silently migrated or counted as confirmed.

## Dashboard accounting

- Total Focus Time is the sum of confirmed contract durations.
- Completed sessions counts confirmed unique session IDs.
- Current Streak uses local calendar days containing confirmed time.
- Sessions crossing local midnight are divided between the affected dates.
- Local date keys are produced from `new Date(unixSeconds * 1000)`; changing the
  device timezone can therefore change how historic intervals are displayed.
- Calendar intensity uses confirmed daily time only: zero, under 30 minutes,
  30–59 minutes, 1–2 hours, 2–4 hours and more than 4 hours.

## Soulbound badges

The combined contract implements two non-transferable ERC-1155 achievements:

- **First Session** (`tokenId 1`): at least one confirmed eligible session.
- **24 Hour Focus** (`tokenId 2`): at least 86,400 cumulative confirmed seconds.

Eligibility is read from contract totals. Each wallet may claim each badge only
once and must approve its own mint transaction. Metadata and BlockRoom artwork
are embedded as on-chain Base64 JSON/SVG data URIs. Transfers and approvals are
rejected because the badges represent achievements, not tradable assets.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to an ignored `.env.local`. Public frontend capabilities:

- `NEXT_PUBLIC_REOWN_PROJECT_ID`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_BLOCKROOM_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_BLOCKROOM_DEPLOYMENT_TX`

Without Supabase, rooms use the labelled `Same-browser tab mode`. Without a
contract address, realtime rooms remain usable but the interface explicitly
shows `Contract not configured` and does not claim any on-chain data.

## Contract development and testing

```bash
npm run contracts:compile
npm run contracts:test
npm run test
```

The production threshold is always 1,800 seconds. Tests simulate timestamps and
never add a shortened threshold to the application.

## Monad Testnet deployment

Deployment requires a separately funded testnet deployer. Keep these values in
the shell or ignored `.env.local`; never expose them to Vercel or Git:

```bash
export MONAD_RPC_URL=https://testnet-rpc.monad.xyz
export MONAD_DEPLOYER_PRIVATE_KEY=0x...
npm run contracts:deploy
```

The Ignition output provides the real contract address and deployment
transaction. Add them to local/Vercel public environment variables only after
deployment succeeds, then rebuild the frontend.

```bash
export MONADSCAN_API_KEY=...
npm run contracts:verify -- 0xREAL_DEPLOYED_ADDRESS
```

Current deployment record:

- Contract address: **TBD — not deployed in this repository**
- Deployment transaction: **TBD — not deployed in this repository**

No placeholder is represented as a real deployment. See
[`docs/contracts.md`](docs/contracts.md) for ABI behavior, one read/write
example and verification notes.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run contracts:test
npm run build
```

### Live Monad QA after deployment

The repository can validate contract and frontend behavior locally, but it
cannot honestly claim a live wallet transaction until a real contract address
is configured. After deployment, use a funded Monad Testnet wallet to verify:

1. Join a room and leave before 30 minutes; no pending or on-chain record is
   created.
2. Rejoin, remain for at least 30 continuous minutes, then leave; confirm the
   frozen final duration and approve the wallet transaction.
3. Reject one eligible transaction and verify that Dashboard retains it for
   retry without changing confirmed totals.
4. Refresh while a transaction hash is pending, then use `Resume receipt` and
   confirm that the same Session ID cannot be submitted twice.
5. Confirm the explorer event, Dashboard total, calendar day and First Session
   eligibility all update only after a successful receipt.
6. Claim First Session once and verify a second claim and wallet-to-wallet
   transfer both revert.
7. Repeat with a second joined visit to confirm that leaving and rejoining
   creates a separate Session ID and threshold.

Keep the production threshold at 1,800 seconds during this QA. Hardhat tests
simulate timestamps for faster automated coverage.

## AI assistance and manual review

AI assisted with contract scaffolding, test generation, frontend integration
and documentation. Product requirements, the 30-minute rule, self-attestation
language, contract architecture, soulbound behavior, visual direction and the
decision not to migrate legacy records were supplied or approved manually.
Contract trust assumptions, transaction states, responsive UI, wallet flow and
the final source diff require human review before any production deployment.

## Product references

- [`docs/project-blueprint.md`](docs/project-blueprint.md) — functional source of truth
- [`docs/contracts.md`](docs/contracts.md) — contract and deployment reference
- [`docs/design-references/elevenlabs/DESIGN.md`](docs/design-references/elevenlabs/DESIGN.md) — approved visual language
