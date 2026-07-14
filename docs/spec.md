# spec.md — BlockRoom Alpha

> Following the Spec Kit methodology (spec-first, before any implementation).
> This document is intentionally scoped to a **mini demo**, not a production product.

---

## Product Overview

BlockRoom Alpha is a minimal Web3 co-learning demo. It shows how a user's
wallet can act as their identity, how a learning session can be represented
as a UI concept ("rooms"), and how completing a session can be recorded
on-chain as a simple, verifiable check-in.

It is deliberately focused, but it must behave like a demonstrable MVP rather
than a single scrolling concept page. It includes a concise homepage, separate
explanation pages, an interactive room directory and room-detail flow, a local
30-minute presence timer, a dashboard, one wallet connection, and one smart
contract with exactly one write function and one read function. Everything
beyond that is explicitly out of scope (see "Features Excluded").

## User Problem

Existing co-learning / body-doubling platforms (StudyTogether, StudyStream)
prove people study better when they show up together — but none of them
give a learner any portable, verifiable record that they actually did the
work. Attendance and effort disappear the moment the session ends.
BlockRoom explores whether a wallet-based, on-chain check-in could give
that record permanence and portability, without requiring a traditional
account system.

## Demo Objective

Prove — in a small, inspectable way — that:

1. A wallet can serve as a login-free identity.
2. A real transaction on Monad Testnet can represent "I completed a
   learning session."
3. That transaction's result (a growing check-in count) can be read back
   and reflected in the UI.

The demo is judged on **clarity and correctness**, not feature count.

## Target User

A Web3-curious learner who wants proof that their study time is not just
a private habit but a small, ownable record. For this Alpha, the "user"
is effectively the builder themselves demoing the concept to reviewers —
so the experience needs to be self-explanatory to someone seeing it for
the first time.

## Core User Flow

```
Land on the concise homepage
      ↓
Connect wallet (RainbowKit → MetaMask, Monad Testnet)
      ↓
See wallet address + network confirmed as "connected"
      ↓
Navigate between What is BlockRoom, How it works, Rooms, and Dashboard
      ↓
Browse the room directory (type labels + honest "Empty room" states)
      ↓
Open an individual room and start a focus session
      ↓
Accumulate 30 minutes only while that room page is open and visible
      ↓
Complete the session → save an explicitly labelled local demo record
      ↓
Phase 3: wallet transaction → checkIn() → real on-chain count refresh
```

## Features Included

| # | Feature | Notes |
|---|---|---|
| 1 | Multi-page frontend shell | Concise homepage plus separate What is BlockRoom, How it works, Rooms, Room Detail, and Dashboard routes |
| 2 | Wallet connection | RainbowKit + wagmi + viem, Monad Testnet, address + network display |
| 3 | Interactive room prototype | Four room types with filters, navigable room-detail screens, honest empty states, and no fabricated presence data |
| 4 | Local session timer | A room session accumulates time only while its room screen is open and the tab is visible; completion unlocks at 30 minutes |
| 5 | Local demo history | Completed eligible sessions persist in the current browser and appear in Dashboard, clearly labelled as local and not on-chain |
| 6 | Dashboard | Connected identity, active-session status, local session history, and the on-chain reputation explainer/action area |
| 7 | Smart contract | `BlockRoomCheckIn.sol` — `checkIn()` (write), `getCheckIns(address)` (read) |
| 8 | On-chain interaction | Phase 3: an eligible completed session can trigger a real Monad Testnet transaction |
| 9 | Documentation | spec.md, design.md, agent.md, final README with AI-vs-human breakdown |

### Room Card Content

These rooms are honest prototype contexts, not claims that courses or
participants already exist. Each directory card shows its name, type label,
description, and the explicit state **Empty room**. Do **not** display learner,
participant, occupancy, or online counts. Each card links to a real route where
the user can enter the empty room and run their own local focus timer.

| Card name | Type label | Description |
|---|---|---|
| Learning Room 1 | Learning | Group study session — open to anyone learning together |
| Learning Room 2 | Learning | Group study session — open to anyone learning together |
| Co-working Space 1 | Co-working | Focus together, work independently, body-double style |
| Hackathon Preparation | Hackathon | Prep together for your next hackathon |

## Features Excluded

Explicitly **not** built in this Alpha (deferred to future phases):

- Real-time room presence / actual multi-user rooms
- Database of any kind (Supabase or otherwise)
- Treating localStorage records as on-chain proof or reputation
- User profiles beyond a connected wallet address
- Booking / scheduling system
- Video calls
- NFT achievement badges
- Any reputation logic beyond a raw check-in counter
- Dark mode, multi-language (this Alpha is light-mode, English-only by scope decision)
- Any fabricated data: fake online counts, fake bookings, fake social proof

## Local Prototype State

The frontend may use browser `localStorage` for two narrowly scoped pieces of
state before the contract phase:

1. One active room session with its genuinely accumulated visible-room time.
2. Session records created only after that timer reaches 30 minutes.

This is not a backend and must never be presented as blockchain data. Dashboard
labels these entries **Local demo records**. Navigating away from the active
room or hiding the tab pauses accumulation; elapsed wall-clock time alone does
not qualify. A user may complete multiple eligible sessions per day, including
in different rooms.

## Technical Architecture

```
┌─────────────────────────────┐
│      Next.js Frontend        │
│  (TypeScript, Tailwind CSS)  │
│                               │
│ Home → Explain → Rooms →     │
│ Room Timer → Dashboard       │
│                               │
│ localStorage: honest local   │
│ timer + demo record state    │
└──────────────┬────────────────┘
               │ wagmi + viem
               ▼
┌─────────────────────────────┐
│   RainbowKit Connect Modal   │
│   (wallet selection UI)      │
└──────────────┬────────────────┘
               │ JSON-RPC
               ▼
┌─────────────────────────────┐
│       Monad Testnet          │
│                               │
│   BlockRoomCheckIn.sol        │
│   - checkIn()      (write)   │
│   - getCheckIns()  (read)    │
└─────────────────────────────┘
```

No backend server and no database. Before Phase 3, only clearly labelled local
demo session state persists in the browser. The only **portable/verifiable**
persistent state lives on-chain inside the contract's
`mapping(address => uint256)`.

## Smart Contract Purpose

`BlockRoomCheckIn.sol` exists to answer one question, honestly:
*"Did this wallet complete a learning session?"* — represented as an
incrementing counter, publicly readable by anyone, writable only by the
wallet recording its own check-in (no admin/backend can check in on a
user's behalf). This is intentionally the smallest possible unit of
"on-chain reputation": no scoring, no badges, no thresholds yet — just an
honest, tamper-evident count.

## Future Expansion

(Not built now — see the larger "BlockRoom" vision for the full roadmap)

- Real-time rooms backed by Supabase + presence channels
- 1:1 booking system (Calendly-style)
- Video integration (Daily.co / LiveKit)
- Richer on-chain reputation (streaks, milestones, badge eligibility)
- ERC-721 achievement badges on Monad
- Optional profile fields (nickname, avatar, topics, timezone)
