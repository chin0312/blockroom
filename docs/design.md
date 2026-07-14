# design.md — BlockRoom Alpha

> Following the UI/UX Pro Max methodology (design every page before implementation).
> Derived from the product owner's reference mockup (landing, dashboard, rooms, room detail, on-chain action panel).

---

## Visual Direction

**"A modern digital learning space" — not a crypto exchange.**

The reference mockup reads as: soft lavender background, floating
glass-like cards, an isometric hexagon/cube illustration in the hero
(a gentle nod to "blocks"/on-chain without going cyberpunk), rounded
pill buttons, and generous whitespace. Nothing blinks, nothing screams
"trading terminal." The mood is closer to Notion or Linear than to a
DeFi dashboard.

Three reference points guide every decision:
- **Glassmorphism** — soft transparency and blur, never heavy borders
- **Bento Box layout** — content lives in variously-sized rounded cards
  arranged in a grid, not in dense tables
- **Spatial UI** — generous padding, soft shadows implying elevation,
  nothing flush against the edge of its container

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
- **Numbers as hero content:** stat figures (session counts, check-in
  totals) are set noticeably larger and bolder than their labels — see
  the Dashboard's "3" and the On-Chain Action panel's "3 → 4" — because
  the count *is* the product's proof point and should never be visually
  minor.

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

## Bento Card Patterns

The reference shows several card archetypes, reused consistently rather
than invented per-page:

1. **Stat card** (Dashboard: "Your Identity", "Learning Reputation",
   "Achievements") — icon or avatar top-left, label, one hero number or
   value, small supporting caption/chart beneath.
2. **List-item card** (Rooms sidebar, "Upcoming Sessions") — avatar/icon,
   title + meta line, a single clear action button aligned right.
3. **Feature/room card** (room grid) — illustration or gradient block on
   top, title + description below, small meta tags (learner count,
   topic pill), one full-width primary button pinned at the card's
   bottom edge.
4. **Action card** (On-Chain Action panel) — centered icon, short
   explanatory copy, the before→after number transition, and a single
   full-width primary CTA. Reserved for the one moment in the whole
   app where a real transaction is about to happen — this card pattern
   should not be reused for anything that isn't an actual on-chain write.

Grid rule: cards vary in width/height (2-col hero + 1-col side cards,
3-across room grids) but always align to a consistent gutter — no
card is ever full-bleed with no margin.

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
- **Wallet chip:** address always shown truncated (`0x8F3a...7d4e`),
  paired with a small avatar dot and, where relevant, a green
  network-status dot + "Monad Testnet" label — this exact chip pattern
  is the one and only place wallet identity is displayed, reused
  identically in the navbar across every page.
- **Tags/pills:** small rounded-full badges for topic labels ("Solidity",
  "Web3", "AI") and learner-count meta — low-emphasis, Accent-colored.
- **Icons:** simple line icons inside a soft circular or hexagonal
  tinted background (never bare icons floating without a container) —
  reinforces the "block/hexagon" motif from the hero illustration
  without overusing it.
- **Empty states:** must follow the same card language (glass card,
  centered icon, short copy, one action) — e.g. "No active learning
  rooms yet. Connect your wallet and start your first session." Never
  a bare line of gray text; an empty state is still a designed card.

## Responsive Behavior

- **Desktop (reference default):** landing page is single-column
  centered content up to a max width with the illustration alongside;
  app-shell screens use a fixed left sidebar + fluid content area;
  room grids flow 3-across.
- **Tablet:** sidebar collapses to icon-only or a top bar; room grid
  drops to 2-across; stat cards in the Dashboard bento wrap to 2 per row
  instead of 3.
- **Mobile:** sidebar becomes a bottom nav or slide-out drawer; all
  bento grids collapse to a single column, stacked in the same visual
  order as desktop (identity → reputation → achievements → current room
  → upcoming sessions); the wallet chip shrinks to avatar-only, full
  address available on tap.
