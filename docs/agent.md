# BlockRoom Development Rules

## Core Rules

- Stack: Next.js App Router, TypeScript, Tailwind CSS, RainbowKit, wagmi,
  viem, and Supabase Realtime.
- React context owns wallet-scoped browser activity. Supabase is used only for
  ephemeral Presence and Broadcast channels.
- No fabricated data. Empty, loading, disconnected, and error states are real
  product states, not opportunities to insert examples.
- No implied chain action. A wallet message signature is not a transaction,
  NFT, gas payment, or portable reputation.
- Keep real-time, activity storage, presentation, and wallet responsibilities
  separated into small typed modules.
- Every interval, channel, media stream, and DOM listener must have cleanup.
- A user must explicitly join before being published as present.

## Realtime Rules

- Use one room channel per room slug.
- Presence keys identify a browser client so the same wallet in separate tabs
  is not silently collapsed.
- Publish only address, focus status, mute state, sharing state, and timestamps.
- Remove members on explicit leave and disconnect. Heartbeats remove stale
  local-fallback clients after an unclean close.
- Chat is ephemeral. Do not create fake message history.
- If Supabase is unavailable, state the local-tab fallback limitation in the UI.

## Session Rules

- A session belongs to one normalized wallet address and one room.
- Time advances only while the room component is mounted, the user is joined,
  the session is not paused, and `document.visibilityState` is `visible`.
- `visibilitychange` must immediately publish Paused or Focusing.
- Completion requires at least 1,800 accumulated seconds.
- Multiple eligible records per wallet per day are valid.

## Badge Rules

- Level 1 requires 1 completed session; Level 2 requires 5.
- Eligibility is derived from the connected wallet's local records.
- Claiming uses the wallet's real `signMessage` interaction.
- The saved result is labelled Signed demo badge and stays browser-local.

## Delivery Rules

- Explain each non-trivial implementation block before editing it.
- Read the installed Next.js documentation before using framework behavior that
  may have changed in this version.
- Run lint, production build, responsive browser checks, and real empty-state
  checks before delivery.
- Use small `[AI]` commits and push approved work to the configured remote.
