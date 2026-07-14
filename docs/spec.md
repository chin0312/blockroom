# spec.md — BlockRoom Alpha

> Following the Spec Kit methodology (spec-first, before any implementation).
> This document is intentionally scoped to a **mini demo**, not a production product.

---

## Product Overview

BlockRoom Alpha is a minimal Web3 co-learning demo. It shows how a user's
wallet can act as their identity, how a learning session can be represented
as a UI concept ("rooms"), and how completing a session can be recorded
on-chain as a simple, verifiable check-in.

It is deliberately small: one landing page, one wallet connection, one
static room list, and one smart contract with exactly one write function
and one read function. Everything beyond that is explicitly out of scope
for this version (see "Features Excluded").

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
Land on homepage
      ↓
Read what BlockRoom is (hero + how-it-works)
      ↓
Connect wallet (RainbowKit → MetaMask, Monad Testnet)
      ↓
See wallet address + network confirmed as "connected"
      ↓
Browse static room cards (type labels only, no occupancy data)
      ↓
Click "Complete Learning Session"
      ↓
Wallet prompts a transaction → checkIn() is called
      ↓
Transaction confirms → getCheckIns(address) is re-read
      ↓
UI reflects the new, real on-chain count
```

## Features Included

| # | Feature | Notes |
|---|---|---|
| 1 | Landing page | Hero, "what is BlockRoom", how-it-works, on-chain reputation explainer |
| 2 | Wallet connection | RainbowKit + wagmi + viem, Monad Testnet, address + network display |
| 3 | Room prototype | Four static room cards spanning learning, co-working, and hackathon use cases — UI only; show type labels, never user or online counts |
| 4 | Smart contract | `BlockRoomCheckIn.sol` — `checkIn()` (write), `getCheckIns(address)` (read) |
| 5 | On-chain interaction | "Complete Learning Session" button triggers a real Monad Testnet transaction |
| 6 | Documentation | spec.md, design.md, agent.md, final README with AI-vs-human breakdown |

### Static Room Card Content

These cards are honest prototype placeholders, not claims that real rooms,
courses, or participants already exist. Each card shows only its name, type
label, and description. Do **not** display learner, participant, occupancy, or
online counts.

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
- User profiles beyond a connected wallet address
- Booking / scheduling system
- Video calls
- NFT achievement badges
- Any reputation logic beyond a raw check-in counter
- Dark mode, multi-language (this Alpha is light-mode, English-only by scope decision)
- Any fabricated data: fake online counts, fake bookings, fake social proof

## Technical Architecture

```
┌─────────────────────────────┐
│      Next.js Frontend        │
│  (TypeScript, Tailwind CSS)  │
│                               │
│  Landing → Wallet → Rooms    │
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

No backend server, no database. The only persistent state in this Alpha
lives on-chain, inside the contract's `mapping(address => uint256)`.

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
