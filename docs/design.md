# BlockRoom Visual and Interaction System

## Design Read

BlockRoom is a real Web3 collaboration instrument for design-conscious testers.
It uses a cold, premium protocol-module language: not a classroom photograph,
not a trading terminal, and not a generic purple AI landing page.

Design dials:

- Design variance: 7
- Motion intensity: 4
- Visual density: 6 on Room and Dashboard, 4 on marketing pages

## Approved Visual Direction

- Cold off-white field with broad browser-fit gutters
- Floating capsule navigation, maximum 80px high on desktop
- Near-black display type and controls
- One restrained violet signal color
- Translucent silver modules that represent wallet, room, visible time, and proof
- Hairline borders, subtle internal highlights, cool shadows
- Buttons are pills; product surfaces use consistent 18 to 24px radii
- Light mode only for this Alpha

The seven approved generated screens in the product-owner conversation are the
primary visual reference. Existing design tokens may be replaced where they
conflict with those screens.

## Tokens

| Role | Value |
|---|---|
| Canvas | `#F7F7F9` |
| Surface | `rgba(255,255,255,.78)` |
| Ink | `#111111` |
| Muted ink | `#656570` |
| Line | `rgba(17,17,17,.12)` |
| Signal | `#7667F7` |
| Signal soft | `#9B92FF` |
| Success | `#1D9B72` |
| Warning | `#A86619` |

## Product Page Architecture

- Home: concise proposition and room entry points
- What is BlockRoom: interactive identity, room, visible-time, and proof model
- How it works: connected flow from wallet to local record
- Rooms: filterable directory with honest live or empty state
- Room Detail: actual members, session console, spatial controls, and live chat
- Dashboard: contribution calendar, wallet statistics, history, and signed badges

## Real State Design

- Never show placeholder avatars or example messages.
- Empty room: one clear explanation and a wallet/connect or join action.
- Connecting: structural skeleton or inline status, never a generic spinner-only
  page.
- Realtime error: keep local controls usable and explain what did not connect.
- Member cards show the actual truncated wallet, status, mute, and share state.
- Local-tab fallback has a visible neutral notice and is never called live
  cross-browser sync.
- Contribution cells have zero fill at zero completions. Intensity changes only
  from real records.
- Badge actions distinguish Locked, Eligible, Awaiting signature, Signed, and
  Error states.

## Motion and Accessibility

- Use 180 to 280ms transitions for hover, press, tab, and state changes.
- Animate only transform and opacity; state updates may use a short highlight.
- Honor reduced motion and reduced transparency.
- Minimum target size is 44px and focus rings are always visible.
- All controls and status changes have text, not color alone.
- Mobile layouts collapse explicitly below 768px. Room controls remain reachable
  without horizontal scrolling.

## Copy Rules

- Use plain product language. No fake precision, social proof, or poetic filler.
- Use `Local activity`, `Signed demo badge`, and `Same-browser tab mode` where
  relevant.
- Never use `minted NFT`, `on-chain badge`, or `gasless transaction` for the
  signature-only prototype.
- Avoid em dashes in visible interface text.
