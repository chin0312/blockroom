# BlockRoom Room Stability Report

## Scope and security gate

This sprint changes Room identity, presence reconciliation, capacity enforcement,
responsive participant layout and expanded-mode behavior only. It does not merge
Dashboard histories across chains or redesign the approved interface.

The pre-change security gate confirmed:

- `.env.local` is ignored and not tracked.
- No current disposable test-wallet key appears in Git history or tracked files.
- No private-key-like environment name uses `NEXT_PUBLIC_`.
- No private-key reference exists in `src/` or the browser static output.
- Monad Testnet (10143), Base Sepolia (84532) and Ethereum Sepolia (11155111)
  are the only configured external networks.
- Session and Badge bytecode exists at the configured addresses on all three
  testnets; each Session contract reports 1,800 seconds and each Badge contract
  points to the configured Session contract.
- Test-wallet keys are loaded only inside Node test processes. They are never
  passed as CLI arguments, printed, snapshotted, bundled or committed.

## Confirmed root causes

### Ghosts and stale capacity

**Before:** `membersById` was keyed and rendered by `clientId`. Lobby occupancy
also incremented once per raw Presence payload. Intentional cleanup removed one
session, but there was no canonical wallet layer to decide whether the avatar
should remain or disappear. Local stale records could keep inflating raw counts.

**Why:** a connection session was incorrectly treated as both a person and a
capacity slot.

**After:** raw sessions remain observable, but one canonical participant is
derived per normalized wallet. Explicit leave removes the exact session;
the participant and slot disappear only after the final session is gone. Local
records expire at the documented 90-second timeout.

### Multi-tab and cross-chain duplication

**Before:** separate `clientId` values produced separate avatars and Lobby counts,
even when their wallet addresses matched. Chain metadata was not present in the
Room member payload.

**Why:** identity was connection-based, and Room UI had no deterministic
aggregation selector.

**After:** `participantKey` is the lower-cased wallet address. Session IDs and
chain IDs remain metadata. The newest meaningful visible-session activity chooses
displayed chain/media context; four-second heartbeats cannot make it flicker.

### Incorrect capacity and seventh-person behavior

**Before:** the client sorted raw sessions and sliced six. A second tab could
consume another slot. The candidate was marked joined before later reconciliation,
so its timer could begin briefly. Join-button occupancy came from a separate raw
Lobby count.

**Why:** admission, rendering, Lobby count and timer start did not share one
canonical selector.

**After:** every surface uses the same wallet-grouped capacity model. Supabase
candidates settle before `joined=true`; rejected candidates are untracked and
unsubscribed before any timer starts. Existing-wallet sessions remain admissible
in a full Room. Local fallback serializes admission with Web Locks when available.

Supabase Presence has no atomic capacity transaction. Simultaneous candidates may
briefly coexist as raw provider records, but deterministic ordering admits exactly
six wallet groups and immediately removes the loser after convergence. Strict
network-atomic admission would require a trusted database RPC or coordinator.

### Performance degradation

**Before:** every duplicate/stale raw member could create an avatar and WebRTC
peer. Repeated joins therefore increased visible nodes and peer work. Participant
keys changed with connection IDs, making React remount identity unstable.

**After:** visible tiles use stable wallet keys and are capped at six canonical
participants. Additional same-wallet sessions do not create tiles or capacity.
Peer cleanup follows the selected representative session, leave is idempotent,
and BroadcastChannel, fullscreen, visibility, timer and Presence subscriptions
all have explicit cleanup paths. The Participant Wall is memoized so the
one-second timer does not redraw unchanged tiles. Occupancy and Room channels
reuse one Auth-disabled Supabase Realtime client, eliminating duplicate GoTrue
instances and reducing socket/client churn.

### Mobile layout and fullscreen lag

**Before:** mobile stacked up to six 220px tiles in one internal scroll area;
pinned mode used a wide sticky grid. The fullscreen control was hidden when the
native API was least reliable.

**After:** viewport buckets provide 2-per-page portrait mobile, 3-per-page short
landscape, 4-per-page tablet/short desktop and 6-per-page desktop. Wallet keys keep
positions stable; page index clamps after departure, and arrows/dots/swipe expose
navigation. Native Fullscreen is attempted where supported; otherwise a fixed
in-page expanded mode reuses the same mounted media elements and Room state.

## Final identity and capacity model

- Canonical participant key: `roomSlug + normalized wallet address`.
- Connection session key: `clientId` generated per tab/device connection.
- Grouping: all active raw sessions with the same case-insensitive EVM address.
- Create participant: first admitted session appears.
- Remove participant: final active session leaves, disconnects or expires.
- Occupy/release slot: exactly the participant creation/removal conditions above.
- Capacity: first six wallet groups ordered by earliest active `joinedAt`, then
  normalized address.
- Seventh unique wallet: not rendered, not joined, no timer; session is untracked.
- Simultaneous joins: deterministic post-convergence reconciliation; limitation
  documented because Supabase Presence is not an atomic admission database.
- Chain context: visible session with greatest `activityAt`, then stable tie-break.
  Heartbeats update only `updatedAt`.
- Reconnect: new session merges into the same wallet group; stale old session may
  coexist without adding an avatar/slot until Presence cleanup.
- Same wallet, tabs/devices/chains: one participant and one slot; individual raw
  sessions leave independently.
- Focus timer: only the earliest active presence session is primary, preventing a
  newly opened duplicate tab from automatically starting another timer.
- Dashboard: confirmed history, totals and Badge eligibility remain contract- and
  chain-specific. No cross-chain historical aggregation was introduced.

## Automated verification

| Scenario | Result | Evidence |
| --- | --- | --- |
| A–C lifecycle/order | Pass | Vitest canonical session removal and capacity assertions |
| D six-person full Room | Pass | Six unique wallet model and dedicated Wallet 1–6 test |
| E seventh rejection | Pass | Wallet 7 rejected in model and live Supabase smoke test |
| F departure/replacement | Pass | Live Supabase slot release and Wallet 7 replacement |
| G 20 replacement cycles | Pass | Bounded raw/canonical stress unit test |
| H simultaneous candidates | Pass (deterministic model) | Exactly one of candidates six/seven admitted |
| I/S abnormal timeout | Pass for local fallback | 90-second boundary unit test; provider timeout remains manual observation |
| J reconnect | Pass at model level | Multiple sessions collapse to one wallet |
| K/L/M multi-tab/cross-chain | Pass | Unit tests plus live two-session retention smoke test |
| N chain switching | Pass at model level | Meaningful activity wins; heartbeat cannot flicker context |
| O cross-chain six wallets | Pass | Six unique wallets across all three supported chain IDs |
| P/Q responsive pagination | Pass | Viewport bucket and page-clamp unit tests |
| R expanded/fullscreen state | Pass at code/regression level | Same component tree; no identity/session remount key |
| T long-running invariants | Partial | 20-cycle deterministic stress passes; extended device memory profile remains manual |

The live smoke test command is `npm run test:room-realtime`. It uses an isolated
topic and removes every channel in `finally`.

## Room Stability Checklist

- [x] Explicit leave targets one connection session.
- [x] Final session removal releases the canonical participant and slot.
- [x] Same-wallet remaining session keeps one participant visible.
- [x] Lobby, counter, rendering and admission use normalized wallet identity.
- [x] Chain switching is metadata-only for Room identity.
- [x] Rejected candidate has no joined state or focus timer.
- [x] Rejected Supabase Presence is untracked and unsubscribed.
- [x] Local fallback stale timeout is 90 seconds.
- [x] Listener, interval, channel and media cleanup paths are bounded.
- [x] Mobile page index clamps after membership changes.
- [x] Expanded mode does not remount video or reset the timer.
- [x] Dashboard and Badge reads remain chain-specific.

## Six-Participant Capacity Checklist

- [x] Wallets 1–6 resolve to six distinct public addresses in Node tests.
- [x] Six unique wallets occupy exactly six slots.
- [x] Wallet 7 is rejected at six.
- [x] Same-wallet extra tab/chain consumes no slot.
- [x] Existing wallet may add a session while the Room is full.
- [x] Departure updates six to five.
- [x] One replacement restores five to six.
- [x] Canonical UI never contains a seventh participant.
- [x] Live Supabase rejected session cleanup was observed.
- [x] Deterministic race selector never settles above six.

## Still requiring manual device validation

These cannot be claimed from a headless, non-extension browser:

1. Camera, microphone and screen-share permissions across two physical browsers.
2. Remote media after pin/unpin with real devices and restrictive NATs; TURN is
   not configured, so some networks may fail despite correct UI lifecycle.
3. iOS Safari in-page expanded mode, address-bar collapse and orientation changes.
4. Android native Fullscreen transitions with six live camera streams.
5. Supabase abnormal process/network termination timeout measurement in the
   production project (expected to follow provider Presence cleanup).
6. Scenario T extended memory/CPU profiling over several hours.

No test requires pasting a key into chat or exposing it to a browser bundle.
