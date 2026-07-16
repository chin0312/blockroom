# BlockRoom Project Blueprint

> Functional source of truth for BlockRoom's product behavior and truthful state.
> The active visual direction is defined by
> `docs/design-references/elevenlabs/DESIGN.md` and the approved product reference.
> Last audited: 2026-07-16.

## 1. Product Definition

BlockRoom is a Web3 co-learning and co-working MVP intended for real human
testing. A connected EVM wallet is the visible identity. People in different
browsers can explicitly join the same room, see genuine presence and media
state, communicate in real time, focus together, and submit eligible
self-attested sessions to the BlockRoom contract on Monad Testnet.

The product is not a course marketplace, social network, wallet portfolio,
crypto exchange, or on-chain proof system. Rooms are neutral focus contexts,
not promises of hosted lessons or pre-existing communities.

### Demo goals

1. Prove that a wallet can act as a login-free identity.
2. Prove that real joined clients can share ephemeral presence, chat, and media.
3. Record the exact final duration of an eligible joined-room session after a
   successful wallet-approved Monad Testnet transaction.
4. Claim one of two non-transferable ERC-1155 achievements when confirmed
   contract totals satisfy its requirement.

### Honesty invariants

- Never invent users, occupancy, messages, sessions, statistics, badges,
  signatures, transactions, courses, or social proof.
- Empty states must remain visibly designed and explicit.
- A wallet is visible only after connection; a member is visible only after
  explicitly joining a room.
- Pending and legacy browser-local records must always be labelled local and
  must never affect confirmed on-chain totals.
- Same-origin fallback must be described as `Same-browser tab mode`.
- An on-chain record is a wallet-signed self-attestation, not blockchain proof
  of presence, focus or productivity.
- Room occupancy always comes from actual current presence state.

## 2. Application Map

### Global shell

- Metadata title: `BlockRoom | Focus together, prove the time`.
- Desktop navigation: Home, What is BlockRoom, Rooms, Dashboard.
- Mobile navigation exposes the same destinations in a collapsible menu.
- Header wallet control provides connection, network context, identity settings,
  avatar selection, address copying, and disconnection.
- Footer repeats the brand, `Rooms`, and `Dashboard` links.
- A skip link targets `#main-content`.
- `/how-it-works` permanently redirects to `/about#how-it-works`.

### Route inventory

| Route | Purpose | Principal content and actions |
|---|---|---|
| `/` | Product entry | Hero proposition, product-state preview, Explore rooms, Connect Wallet, and links to the product model, room directory, and Dashboard |
| `/about` | Combined product explanation | Wallet identity, focus room, and session proof explorer followed by the five-step trust flow |
| `/rooms` | Live room directory | Type filters, twelve destination cards, actual occupancy out of six, room entry links |
| `/rooms/[slug]` | Real-time collaboration space | Room purpose, connect/join gate, member meeting stage, discussions, timer, media controls, fullscreen, and leave/save decision |
| `/dashboard` | Wallet-scoped on-chain record | Confirmed totals, monthly contribution calendar, pending retries, legacy disclosure, session history, and soulbound badges |

## 3. Page Content and States

### Home

Primary proposition:

- Label: `Web3 co-learning, without invented activity`
- Headline: `Focus together. Keep the proof.`
- Supporting copy explains real-time rooms, the 30-minute threshold, and
  wallet-scoped activity.
- Primary action: `Explore rooms`.
- Secondary action: wallet connection or connected identity.

The preview is explanatory UI, not live state. It shows a neutral `00:00`,
`Join to load real presence`, empty Active members and Discussions states, and
an explicit same-browser fallback label when Supabase is unavailable.
The three index destinations are What is BlockRoom, Explore Rooms, and Open
Dashboard.

### What is BlockRoom and How it works

The product-model explorer has three interactive tabs:

1. **Wallet identity**: no username database, address appears only after
   connection, and network context is explicit.
2. **Focus rooms**: Supabase Presence, live status controls, and no fake
   participants.
3. **Session proof**: joined-room time, pending wallet confirmation, confirmed
   contract records, and the self-attested trust limitation.

The How it works stepper contains five interactive steps:

1. Connect identity through Reown AppKit.
2. Choose a room and explicitly publish presence.
3. Accumulate joined-room time automatically.
4. Approve an eligible wallet-scoped Session transaction on leave or retry it later.
5. Claim an eligible soulbound ERC-1155 Badge.

### Rooms

Filters: `All`, `Learning`, `Co-working`, and `Hackathon`.

Each room card displays only:

- Room type.
- Actual live occupancy as `x/6 live`.
- Stable room name and neutral context description.
- Room index and an entry link.

When the current actual count reaches six, the card is marked full. The room
remains viewable, but a new client cannot join.

### Room detail before joining

- Displays room type, name, description, and focus intention.
- Without a wallet: prompts `Connect before you join` and uses the Reown wallet
  control.
- With a wallet: offers `Join Room (x/6)`.
- Full room: disables admission and labels the state `Room full`.
- Local fallback: displays the exact same-browser testing notice.
- Realtime connection errors remain visible and do not fabricate fallback data.

### Joined room workspace

- Uses a meeting-first workspace rather than a marketing page.
- Tabs switch between `Active members` and `Discussions`.
- A compact timer displays elapsed joined time and remaining qualification time.
- Browser Fullscreen API expands the existing workspace; it does not reveal
  hidden below-the-fold controls.
- Member view uses a responsive one-to-six tile grid.
- Any tile can be pinned to a 16:9 primary stage with a secondary filmstrip.
- A new screen share is automatically promoted when the user has no explicit pin.
- Each tile displays only the real wallet abbreviation, local avatar choice,
  actual focus status, mute state, camera state, and sharing state.
- Discussions contain current ephemeral messages only. Empty chat has no sample
  messages. Messages are trimmed, limited to 500 characters, and capped to the
  latest 100 in memory.

Spatial controls invoke real browser APIs:

- `Mute / Unmute`: acquires or disables an audio track and publishes mute state.
- `Webcam / Stop Camera`: acquires or stops the local camera video track.
- `Share Screen / Stop sharing`: uses `getDisplayMedia`, publishes sharing state,
  and restores the camera track when sharing stops.
- `Leave Space`: freezes the final interval and opens record-now/record-later choices.

### Leave decision and recording

- Joining successfully starts the qualifying session automatically.
- Time advances while the wallet remains joined, including while the user works
  in another browser tab.
- Explicit leave, refresh, close or account change freezes the continuous visit.
- Under 30 minutes: the local draft is removed and contributes nothing.
- At or above 30 minutes: the frozen record remains pending until wallet
  confirmation and a successful transaction receipt.
- Rejection, RPC failure or closing the page never discards an eligible record;
  Dashboard offers retry.
- Rejoining always creates a new Session ID and independent 30-minute threshold.
- The contract and frontend reject duplicate submission of the same Session ID.

### Dashboard

The Dashboard derives confirmed values from the BlockRoom contract. Pending and
legacy local records are shown separately and never influence confirmed data.

- **Wallet identity**: abbreviated address and current chain.
- **Total Focus Time**: sum of confirmed contract `durationSeconds`.
- **Current Streak**: consecutive local calendar days ending today, or ending
  yesterday when there is no record today.
- **Total Badges Earned**: count of ERC-1155 Badge balances held by the wallet.
- **Contribution calendar**: confirmed intervals split across local midnight;
  intensity tiers are 0, <30m, 30–59m, 1–2h, 2–4h and >4h.
- **Day detail**: selecting a cell reveals exact confirmed duration, number of
  on-chain sessions, room names, confirmation times, and attributed durations.
- **Completed sessions**: latest eight records in reverse completion order.
- **Soulbound badges**: First Session unlocks after one confirmed completion;
  24 Hour Focus unlocks after 86,400 confirmed seconds.

Badge claiming is a real contract transaction through wagmi. A Badge appears as
claimed only after a successful receipt; rejection or revert creates no NFT.

## 4. Room Catalogue

All rooms have a six-member frontend MVP capacity.

| Room | Type | Description | Intention |
|---|---|---|---|
| Learning Room 1 | Learning | Group study session, open to anyone learning together | Bring one clear topic and use the room as a quiet focus anchor. |
| Learning Room 2 | Learning | Group study session, open to anyone learning together | Bring one clear topic and use the room as a quiet focus anchor. |
| Learning Room 3 | Learning | Group study session, open to anyone learning together | Bring one clear topic and use the room as a quiet focus anchor. |
| Learning Room 4 | Learning | Group study session, open to anyone learning together | Bring one clear topic and use the room as a quiet focus anchor. |
| Co-working Space 1 | Co-working | Focus together, work independently, body-double style | Set a task, keep the room open, and work without performative updates. |
| Co-working Space 2 | Co-working | Focus together, work independently, body-double style | Set a task, keep the room open, and work without performative updates. |
| Co-working Space 3 | Co-working | Focus together, work independently, body-double style | Set a task, keep the room open, and work without performative updates. |
| Co-working Space 4 | Co-working | Focus together, work independently, body-double style | Set a task, keep the room open, and work without performative updates. |
| Hackathon Preparation 1 | Hackathon | Prep together for your next hackathon | Use the space for focused planning, building, or submission prep. |
| Hackathon Preparation 2 | Hackathon | Prep together for your next hackathon | Use the space for focused planning, building, or submission prep. |
| Hackathon Preparation 3 | Hackathon | Prep together for your next hackathon | Use the space for focused planning, building, or submission prep. |
| Hackathon Preparation 4 | Hackathon | Prep together for your next hackathon | Use the space for focused planning, building, or submission prep. |

## 5. Wallet Identity

### Reown configuration

- Reown AppKit is initialized only when `NEXT_PUBLIC_REOWN_PROJECT_ID` exists.
- Wallet-only EIP-155 connection is enabled.
- Native wallet selection and WalletConnect QR sessions remain available.
- Supported chains: Monad Testnet, Ethereum, Base, Arbitrum, Optimism, Polygon.
- Users can open the network picker from the connected network chip.
- Email, socials, swaps, onramp, send, receive, wallet history, and analytics are
  disabled.
- BlockRoom never loads general wallet balances, tokens, unrelated NFTs, or
  payment actions; it reads only its own two Badge balances.

### Platform identity settings

- Identity uses the current connected address and connector name.
- Display address format is the first six and last four characters.
- Six local avatar variants are available: violet, cobalt, mint, ember, silver,
  and midnight.
- Avatar choice is stored per lowercase wallet address and broadcast to the
  joined room presence state.
- Users can copy the full address or disconnect.

## 6. Realtime and Media Architecture

```text
Next.js client
  |-- Reown AppKit + wagmi + viem
  |     wallet connection, chain switching, identity, message signature
  |-- Supabase Presence
  |     joined members, current room state, lobby occupancy
  |-- Supabase Broadcast
  |     ephemeral chat and WebRTC signaling
  |-- WebRTC mesh
  |     microphone plus one outbound camera-or-screen video track
  |-- BroadcastChannel + localStorage fallback
  |     same-origin tab presence, chat, signaling, occupancy
  |-- BlockRoom contract on Monad Testnet
  |     confirmed sessions, cumulative totals, soulbound ERC-1155 badges
  `-- localStorage recovery store
        active visits, pending transactions, legacy records, avatar choice
```

### Supabase mode

- A room channel is `blockroom:<roomSlug>`.
- Presence key is the unique client ID, not the wallet address, so separate
  clients remain separately observable.
- Lobby presence channel `blockroom:lobby` feeds directory occupancy.
- Presence heartbeat updates every four seconds.
- Chat and RTC signaling are ephemeral broadcasts; no database table is used.
- Leaving untracks and unsubscribes room and lobby presence.

### Same-browser fallback

- Enabled only when public Supabase configuration is absent.
- BroadcastChannel name: `blockroom-room:<roomSlug>`.
- Presence snapshot key: `blockroom:presence:<roomSlug>`.
- localStorage events and a two-second directory refresh keep tabs in sync.
- Members older than 90 seconds are treated as stale.
- This mode cannot provide real different-browser or different-device sync and
  must never be presented as Supabase live mode.

### Capacity behavior

- Members are ordered by `joinedAt`; the earliest six are admitted.
- A later client outside the earliest six is removed and receives a room-full
  error.
- This is an honest frontend guard, not an atomic security boundary. Strict
  admission requires trusted backend coordination.

### WebRTC media

- One mesh peer connection is created per other room client.
- Public Google STUN servers are configured.
- Perfect-negotiation collision handling uses deterministic polite/impolite
  peers based on client IDs.
- ICE candidates wait until a remote description exists.
- The outbound audio track is independent from the outbound video track.
- Screen share replaces camera as the outbound video track; ending share restores
  the camera track when available.
- Media tracks and peer connections stop on leave/unmount.
- Production-grade restrictive NAT support requires TURN credentials and is not
  currently implemented.

## 7. State and Data Contracts

### Public room types

```ts
type RoomType = "Learning" | "Co-working" | "Hackathon";

type Room = {
  slug: string;
  name: string;
  type: RoomType;
  description: string;
  intention: string;
  accent: "cobalt" | "periwinkle" | "steel" | "midnight";
  capacity: number;
};
```

### Realtime types

```ts
type MemberFocusStatus = "focusing" | "paused" | "available";

type RoomMember = {
  clientId: string;
  address: string;
  status: MemberFocusStatus;
  muted: boolean;
  sharing: boolean;
  cameraOn: boolean;
  avatar: AvatarVariant;
  joinedAt: string;
  updatedAt: string;
};

type LobbyMember = {
  clientId: string;
  roomSlug: string;
  updatedAt: string;
};

type RoomMessage = {
  id: string;
  clientId: string;
  address: string;
  body: string;
  sentAt: string;
};

type RtcSignal = {
  senderId: string;
  targetId: string;
  kind: "offer" | "answer" | "ice";
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};
```

### Activity types

```ts
type OnchainSessionDraft = {
  sessionId: Hex;
  walletAddress: Address;
  roomSlug: string;
  roomId: Hex;
  chainId: 10143;
  startedAt: number;
  endedAt?: number;
  durationSeconds: number;
  lastObservedAt: number;
  ownerId: string;
  status: "in-progress" | "eligible" | "awaiting-confirmation" |
    "submitting" | "confirmed" | "rejected" | "failed";
  txHash?: Hex;
};
```

### localStorage ownership

| Key | Contents | Lifetime and scope |
|---|---|---|
| `blockroom:onchain-session-v1:<sessionId>` | One active, pending or reconciled Session | Persistent recovery state; independent keys prevent cross-tab overwrites |
| `blockroom-activity-v2` | Previous local sessions and signed demo receipts | Read-only Legacy data; never affects confirmed totals or Badge eligibility |
| `blockroom:profile:<lowercase-address>` | Selected platform avatar variant | Persistent per wallet in the current browser |
| `blockroom:presence:<roomSlug>` | Same-browser fallback member snapshot | Ephemeral fallback transport with stale cleanup |

Storage events synchronize activity and presence across same-origin tabs. No
server-side profile, persistent chat table, or app-owned user database exists.

## 8. Truth Classification

| Capability | Classification | Source of truth |
|---|---|---|
| Wallet address and chain | Real external state | Connected wallet through Reown/wagmi |
| Wallet signature | Real wallet action | Wallet provider response |
| Supabase room presence | Real ephemeral cross-browser state | Supabase Realtime Presence |
| Live room occupancy | Real ephemeral state | Lobby presence or same-browser fallback snapshot |
| Chat | Real ephemeral state | Supabase Broadcast or BroadcastChannel |
| Microphone, camera, screen | Real browser media | MediaDevices APIs and MediaStream tracks |
| Peer audio/video | Real live browser media | WebRTC mesh |
| Joined-room elapsed time | Real browser-measured state | Continuous Join-to-end client timestamps |
| Pending eligible sessions | Browser-local recovery state | Per-Session localStorage records |
| Completed sessions | Real on-chain state | BlockRoom contract receipt and stored Session |
| Dashboard totals and calendar | Derived on-chain state | Current wallet's confirmed contract records |
| Achievement badges | Real on-chain state | Soulbound ERC-1155 balances and eligibility |
| Same-browser tab mode | Honest fallback | BroadcastChannel and localStorage |
| Proof of focus/productivity | Not implemented | Contract records are explicitly self-attested |
| Persistent chat/history/profile backend | Not implemented | Must not be implied |
| Atomic room admission and TURN | Not implemented | Requires trusted infrastructure |

## 9. Environment Variables

| Variable | Role |
|---|---|
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Enables Reown wallet selection and WalletConnect sessions |
| `NEXT_PUBLIC_APP_URL` | Public application origin used by Reown metadata |
| `NEXT_PUBLIC_SUPABASE_URL` | Enables different-browser Supabase Realtime rooms |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Preferred public Supabase client key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Compatibility fallback for older Supabase projects |
| `NEXT_PUBLIC_BLOCKROOM_CONTRACT_ADDRESS` | Enables confirmed Session reads/writes and Badge claims on Monad Testnet |
| `NEXT_PUBLIC_BLOCKROOM_DEPLOYMENT_TX` | Optional public deployment transaction reference |

`MONAD_DEPLOYER_PRIVATE_KEY` and verifier credentials are deployment-only
secrets. They are never `NEXT_PUBLIC_`, never needed by Vercel, and never
committed.

No service-role key, private wallet key, signing key, or secret belongs in the
client environment or Git history.

## 10. Active Visual Direction

- BlockRoom uses the finalized ElevenLabs Editorial Spatial UI direction.
- `docs/design-references/elevenlabs/DESIGN.md` is the active design-system
  reference; the approved `Generated image 3.png` is the composition reference.
- This blueprint remains authoritative for behavior and truthful state.
- Visual refinements must preserve routes, wallet identity, realtime presence,
  WebRTC media, session recording, contribution history, and badges.
- The visual system uses warm off-white canvas, lightweight editorial serif
  display type, neutral sans-serif UI type, hairline borders, ink pill actions,
  restrained atmospheric color, and quiet spatial motion.
- `prefers-reduced-motion` and `prefers-reduced-transparency` are respected.
- Visible controls have text labels, not color-only status.
- Focus rings remain visible and minimum control targets are 44 pixels.
- Layouts explicitly collapse below 768 pixels without horizontal scrolling.
- Default room workspace fits a normal laptop viewport before fullscreen.

## 11. Source Responsibility Index

### Application routes and providers

| File | Responsibility |
|---|---|
| `src/app/layout.tsx` | Global metadata, providers, shell, skip link, header, footer |
| `src/app/providers.tsx` | Reown AppKit initialization, wagmi, React Query, session context |
| `src/app/page.tsx` | Home proposition and product entry points |
| `src/app/about/page.tsx` | Combined product model and How it works route |
| `src/app/how-it-works/page.tsx` | Permanent redirect to the combined page section |
| `src/app/rooms/page.tsx` | Room-directory route shell |
| `src/app/rooms/[slug]/page.tsx` | Static room lookup, room metadata, joined-space entry |
| `src/app/dashboard/page.tsx` | Dashboard route shell |
| `src/app/globals.css` | Active ElevenLabs Editorial design tokens, responsive layouts, motion and component styling |

### Product components

| File | Responsibility |
|---|---|
| `site-header.tsx` | Navigation, active state, mobile menu, wallet control |
| `site-footer.tsx` | Product footer and destination links |
| `brand.tsx` | BlockRoom brand mark and home link |
| `wallet-control.tsx` | Connection, network picker, connected identity and avatar settings |
| `about-explorer.tsx` | Three-state product model tabs |
| `how-stepper.tsx` | Five-step interactive trust flow |
| `room-directory.tsx` | Room filters, live occupancy and destination cards |
| `room-session-panel.tsx` | Join gate, workspace, timer, chat, controls, fullscreen and leave flow |
| `ActiveMembers.tsx` | Real member grid, media players, pin stage and member state |
| `dashboard-client.tsx` | Confirmed contract statistics, pending retry, legacy disclosure and history composition |
| `ContributionGraph.tsx` | Local-day interval splitting, duration tiers and selected-day detail |
| `BadgeSection.tsx` | Contract eligibility, ERC-1155 claim states and explorer links |
| `session-provider.tsx` | Per-Session recovery persistence and active/pending lifecycle |

### Visual primitives

| File | Responsibility |
|---|---|
| `ambient-module.tsx` | Shared volumetric focus-pod illustration used across the product |
| `room-visual.tsx` | Maps room categories to ambient spatial variants |
| `motion-reveal.tsx` | Reduced-motion-aware entrance reveal |
| `icons.tsx` | Shared semantic icon mapping |

### Realtime, media and domain modules

| File | Responsibility |
|---|---|
| `use-room-realtime.ts` | Supabase/fallback presence, chat, heartbeats, admission and RTC signaling |
| `use-room-occupancy.ts` | Directory occupancy from lobby presence or local snapshots |
| `use-room-media.ts` | Browser media acquisition, WebRTC peers, track replacement and cleanup |
| `rooms.ts` | Room types, twelve room definitions and six-member capacity |
| `realtime-types.ts` | Member, chat, lobby and RTC signal contracts |
| `profile.ts` | Wallet-scoped avatar variants and update events |
| `appkit.ts` | Reown project configuration, supported EVM networks and wagmi adapter |
| `use-blockroom-contract.ts` | Contract reads, chain switching, writes, receipts and reconciliation |
| `session-store.ts` | Pure Session ID, timing, finalization and local-day splitting rules |
| `contracts/BlockRoom.sol` | Confirmed Session ledger and two soulbound ERC-1155 achievements |
| `hardhat.config.ts` | Solidity profiles, Monad Testnet network and verifier configuration |
| `test/BlockRoom.ts` | Session validation, duplicate prevention, totals, Badge eligibility and soulbound tests |

## 12. Refactor Guardrails

The upcoming work is a visual and experience refactor, not a product rewrite.
The following must remain compatible unless the product owner explicitly changes
the functional specification:

- Existing routes and legacy redirect.
- Room slugs, names, capacity, and neutral descriptions.
- Reown wallet-only identity and supported networks.
- Supabase/fallback realtime behavior and truthful transport labels.
- WebRTC media, pinning, screen-share promotion and fullscreen behavior.
- Automatic joined-room timing and the 30-minute on-chain eligibility gate.
- Confirmed-only contribution, streak and Badge derivation rules.
- Public data types, pending recovery keys and read-only legacy storage.
- Empty states and all no-fabrication rules.

Concept imagery may reorganize these capabilities visually, but it may not add
invented users, metrics, messages, balances, Badge ownership, or transactions.
