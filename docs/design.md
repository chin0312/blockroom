# design.md — BlockRoom Alpha

> Following the UI/UX Pro Max methodology (design every page before implementation).
> Derived from the product owner's reference mockup (landing, dashboard, rooms, room detail, on-chain action panel).

---

## Visual Direction

**"A modern digital learning product" — not a crypto exchange and not a
generic AI landing-page template.**

The reference mockup reads as: soft lavender background, floating
glass-like cards, an isometric hexagon/cube illustration in the hero
(a gentle nod to "blocks"/on-chain without going cyberpunk), rounded
pill buttons, and generous whitespace. Nothing blinks, nothing screams
"trading terminal." The mood is closer to Notion or Linear than to a
DeFi dashboard.

Four reference points guide every decision:
- **Swiss/editorial grid** — a strict responsive grid, asymmetric hierarchy,
  large type, and deliberate negative space instead of centered generic blocks
- **Selective glassmorphism** — reserved for navigation, overlays, and elevated
  controls; ordinary content cards use solid or lightly tinted surfaces
- **Meaningful Bento layout** — every card contains a diagram, state,
  interaction, or useful explanation; never an empty decorative rectangle
- **Product navigation** — Home, What is BlockRoom, How it works, Rooms, and
  Dashboard are distinct routes with active navigation states

The application background and navigation span the browser width. Content may
use an internal readable grid (up to roughly 1680px), but the product must not
look like a narrow mockup floating inside large blank side gutters on wide
screens.

## Color System

Base palette ("Metallic Chic"), used consistently across both marketing
and app-shell screens:

| Role | Hex | Usage |
|---|---|---|
| Primary | `#3D52A0` | Primary buttons, active nav state, headline accent word |
| Secondary | `#7091E6` | Secondary buttons, links, icon fills |
| Accent | `#8697C4` | Tags, secondary icons, chart bars |
| Surface | `#ADBBDA` | Card borders, dividers, subtle fills |
| Background | `#EDE8F5` | Page background |
| Base white | `#FFFFFF` | Card surfaces (semi-transparent over background) |
| Text — primary | `#1A1A2E`-range dark navy | Headlines, key numbers |
| Text — muted | mid-gray-blue | Body copy, captions, helper text |
| Status — connected | green dot | Network/connection indicators only — never fabricated activity counts |

Light mode only for this Alpha (see spec.md → Features Excluded).

## Typography

- **Display / headlines:** bold, tight tracking, dark navy — e.g. "Learn.
  Build. Grow **On-Chain.**" with the accent phrase in Primary color.
  This pattern (plain text + one colored phrase) is the signature
  headline treatment and should be reused sparingly — one colored phrase
  per headline, not a rainbow of accents.
- **Body:** regular weight, muted gray-blue, generous line height for
  readability against the busier card backgrounds.
- **Labels / eyebrows:** small, uppercase or capitalized pill badges
  (e.g. "Web3 Co-learning Space") — used to introduce a section before
  the headline, not as decoration everywhere.
- **Numbers as hero content:** real timer progress and actual session/check-in
  totals are set noticeably larger and bolder than their labels. When no real
  record exists, show a designed empty state instead of an example number.

## Glassmorphism Rules

- Card background: white at partial opacity over the lavender page
  background, with a soft blur applied so the page background reads
  as a gentle haze behind it, not a sharp line.
- Border: a hairline, low-contrast border (derived from Surface
  `#ADBBDA` at low opacity) — enough to define the card edge without
  looking like a hard box.
- Shadow: soft, diffuse, low-opacity drop shadow — implies floating,
  not heavy elevation. Avoid harsh/dark shadows; this isn't Material
  Design's bold elevation system.
- Never stack blur-on-blur more than one layer deep (e.g. a glass card
  inside a glass card) — it reads as muddy rather than airy.
- Do not make every card glass. Solid white, pale lavender, and deep navy
  surfaces provide contrast and prevent the repetitive "AI SaaS template" look.

## Bento Card Patterns

The reference shows several card archetypes, reused consistently rather
than invented per-page:

1. **Stat card** (Dashboard: "Your Identity", "Learning Reputation",
   "Achievements") — icon or avatar top-left, label, one hero number or
   value, small supporting caption/chart beneath.
2. **List-item card** (Rooms sidebar, "Upcoming Sessions") — avatar/icon,
   title + meta line, a single clear action button aligned right.
3. **Feature/room card** (room grid) — meaningful abstract room visual,
   title + description, a type pill, explicit "Empty room" state, and a clear
   route action. Never show learner counts.
4. **Action card** (On-Chain Action panel) — centered icon, short
   explanatory copy, the before→after number transition, and a single
   full-width primary CTA. Reserved for the one moment in the whole
   app where a real transaction is about to happen — this card pattern
   should not be reused for anything that isn't an actual on-chain write.

Grid rule: cards vary in width/height but align to a 12-column editorial grid.
Full-width page surfaces are allowed; their internal content maintains
responsive gutters and readable measures.

## Page Architecture

- **Home (`/`)** — concise product proposition, direct actions, and a compact
  preview of the three core ideas. It must not contain every other page.
- **What is BlockRoom (`/about`)** — interactive identity/rooms/proof explorer
  with filled diagrams and explanatory states.
- **How it works (`/how-it-works`)** — interactive step navigation explaining
  wallet, room presence, 30-minute eligibility, local record, then Phase 3 chain.
- **Rooms (`/rooms`)** — filterable directory of four honest empty rooms.
- **Room detail (`/rooms/[slug]`)** — an empty-room workspace with start/stop
  controls, visible elapsed/remaining time, and 30-minute completion gate.
- **Dashboard (`/dashboard`)** — wallet identity, active session, real local
  records, and the on-chain reputation explainer previously shown on Home.

Navigation is persistent, shows the active route, and collapses to an accessible
menu on mobile. Every page has one primary action and a clear next route.

## Interaction and Motion

- Use 180–280ms transitions for hover, press, tabs, filters, and disclosure.
- Motion communicates state changes; avoid floating decoration, endless glow,
  excessive gradients, scroll-jacking, and animation on every card.
- Buttons and cards have distinct hover, active, focus-visible, and disabled
  states. Minimum interactive target is 44×44px.
- The room timer shows progress numerically and visually. It accumulates only
  while the correct room route is mounted and the document is visible.
- Empty rooms are designed states: a clear "Empty room" label, explanation,
  and an action to start a solo focus session — never a blank panel.
- Respect `prefers-reduced-motion` throughout.

## Spacing System

- Base unit: 4px, most gaps land on 8 / 12 / 16 / 24 / 32px steps.
- Card internal padding: generous (~24px) relative to card size — this
  is a big part of why the reference feels calm rather than dense.
- Section spacing (landing page): large vertical rhythm between hero,
  the three-icon value-prop row, and the footer strip — sections should
  breathe, not stack tightly.
- Card corner radius: consistently rounded (large radius, ~16–20px),
  applied uniformly to every card, button, and pill across the app —
  no mixing sharp and rounded corners.

## Component Style

- **Buttons:** fully rounded (pill) for primary actions; primary uses
  solid Primary-color fill with white text, secondary uses an outline
  on transparent/white.
- **Wallet chip:** a connected address is always shown truncated,
  paired with a small avatar dot and, where relevant, a green
  network-status dot + "Monad Testnet" label — this exact chip pattern
  is the one and only place wallet identity is displayed, reused
  identically in the navbar across every page.
- **Tags/pills:** small rounded-full badges for room type and honest state
  labels such as "Learning" and "Empty room" — low-emphasis, Accent-colored.
- **Icons:** simple line icons inside a soft circular or hexagonal
  tinted background (never bare icons floating without a container) —
  reinforces the "block/hexagon" motif from the hero illustration
  without overusing it.
- **Empty states:** must follow the same card language (glass card,
  centered icon, short copy, one action) — e.g. "No active learning
  rooms yet. Connect your wallet and start your first session." Never
  a bare line of gray text; an empty state is still a designed card.

## Responsive Behavior

- **Desktop (reference default):** page surfaces span the viewport while their
  content uses a fluid 12-column grid with responsive gutters; room grids flow
  3- or 4-across depending on available width.
- **Tablet:** sidebar collapses to icon-only or a top bar; room grid
  drops to 2-across; stat cards in the Dashboard bento wrap to 2 per row
  instead of 3.
- **Mobile:** sidebar becomes a bottom nav or slide-out drawer; all
  bento grids collapse to a single column, stacked in the same visual
  order as desktop (identity → reputation → achievements → current room
  → upcoming sessions); the wallet chip shrinks to avatar-only, full
  address available on tap.
