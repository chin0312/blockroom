# BlockRoom Alpha Specification

## Product Overview

BlockRoom is a Web3 co-learning and co-working MVP for real human testing. A
connected wallet is the visible identity. People in separate browsers can join
the same room, see genuine presence and status changes, chat, focus together,
and create a browser-local activity record after 30 minutes of visible room
time.

The product never invents users, occupancy, chat, sessions, statistics, badges,
or on-chain actions. Missing data is shown as a designed empty state.

## Demo Objective

The MVP must prove that:

1. A wallet can be used as a login-free room identity.
2. Real connected people can share ephemeral room state without mock members.
3. Thirty minutes of visible room focus can create a wallet-scoped local record.
4. A real wallet signature can authorize a clearly labelled local demo badge
   without claiming that an NFT or chain transaction occurred.

## Core User Flow

```text
Home
  -> choose a wallet and one of the supported EVM networks
  -> browse rooms
  -> enter a room and explicitly join
  -> see real joined wallets, statuses, and chat
  -> start a 30-minute visible-tab session
  -> hide tab: timer and presence pause
  -> return: timer and presence resume
  -> complete: write a wallet-scoped browser record
  -> Dashboard: contribution cell, totals, streak, badge eligibility
```

## Features Included

| Feature | Required behavior |
|---|---|
| Multi-page shell | Home, What is BlockRoom, How it works, Rooms, Room Detail, and Dashboard remain separate routes |
| Wallet identity | Reown AppKit, wagmi, and viem with native wallet selection and network switching |
| Supported EVM networks | Monad Testnet, Ethereum, Base, Arbitrum, Optimism, and Polygon |
| Real-time rooms | Supabase Presence and Broadcast sync joined wallets, controls, and chat across browsers |
| Honest fallback | Without Supabase environment variables, BroadcastChannel and localStorage support same-origin multi-tab testing and the UI says so |
| Active members | Only connected wallets that explicitly join are shown; leave, disconnect, page close, and stale-client cleanup remove them |
| Spatial controls | Mute, Unmute, Share Screen proof state, and Leave Space publish real state changes |
| Session gate | Focus time advances only while joined on the correct visible room page; completion unlocks at 30 minutes |
| Wallet activity | Completed sessions are stored locally under the connected wallet address; multiple completions per day are allowed |
| Live chat | Messages are sent to current room members in real time and are not filled with examples |
| Contribution graph | Current-month cells are derived only from completed local sessions for the connected wallet |
| Dashboard statistics | Total Focus Time, Current Streak, and Total Badges Earned are derived from that wallet's local state |
| Demo badges | Level 1 unlocks at 1 completion and Level 2 at 5; claiming requests a real message signature and stores a local receipt |

## Room Directory Content

Room cards show a name, type label, description, and live state. They never
show an invented learner or occupancy count.

| Name | Type | Description |
|---|---|---|
| Learning Room 1 | Learning | Group study session, open to anyone learning together |
| Learning Room 2 | Learning | Group study session, open to anyone learning together |
| Co-working Space 1 | Co-working | Focus together, work independently, body-double style |
| Hackathon Preparation | Hackathon | Prep together for your next hackathon |

## State and Honesty Rules

- Supabase channels contain ephemeral presence and chat only. No app-owned
  database table is required.
- A configured project URL and publishable key enable cross-browser rooms.
- The fallback works only across same-origin tabs and must be labelled exactly
  as a local tab testing mode.
- Session records and badge receipts use browser localStorage and are always
  described as local activity.
- A signed badge receipt spends no gas, creates no token, and is not an NFT.
- Hiding or leaving the room pauses eligible time. Elapsed wall-clock time alone
  does not qualify.

## Features Excluded

- Video or audio transport between members
- Screen-stream transport to peers; browser capture is used only to confirm the
  local Proof of Work sharing state
- Persistent server-side chat history or user profiles
- App-owned database tables and custom backend APIs
- Booking or scheduling
- Actual NFT minting, gasless relayers, or unimplemented contract transactions
- Treating browser storage as blockchain proof
- Fabricated social proof, people, activity, or statistics
- Dark mode and localization in this Alpha

## Realtime Architecture

```text
Next.js Client
  |-- Reown AppKit + wagmi: wallet selection, network switching, identity, and signatures
  |-- Supabase Presence: join, update, untrack, sync
  |-- Supabase Broadcast: ephemeral room chat
  |-- BroadcastChannel fallback: same-origin tab presence and chat
  `-- localStorage: wallet-scoped sessions and signed badge receipts
```

Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted only as a compatibility fallback
- `NEXT_PUBLIC_REOWN_PROJECT_ID`
- `NEXT_PUBLIC_APP_URL`
