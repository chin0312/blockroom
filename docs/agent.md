# agent.md — BlockRoom Alpha

> Following the Grill-Me methodology: review before continuing, explain
> before implementing, never let complexity creep in unchecked.
> This document governs how AI-assisted work happens on this project,
> and doubles as the source material for the final README's
> "AI-assisted development process" section.

---

## Coding Conventions

- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + wagmi +
  RainbowKit + viem. No state-management library beyond what wagmi/React
  already provide — this project is too small to need one.
- **No backend.** No API routes, no database client, no server actions
  that touch persistent storage. If a feature seems to need a backend,
  that's a signal it belongs in "Features Excluded" (see spec.md), not
  in this Alpha.
- **One contract, two functions.** `BlockRoomCheckIn.sol` stays exactly
  as scoped: `checkIn()` (write) and `getCheckIns(address)` (read). Any
  temptation to add scoring, thresholds, or badges belongs in the
  Future Expansion list, not in this contract.
- **No fabricated data, anywhere.** Not in components, not in mock JSON,
  not in placeholder text. If real data isn't available yet, the UI
  shows a designed empty state (see design.md → Empty States), never a
  plausible-looking fake number.
- **File-by-file, not project-at-once.** Each implementation step
  touches a small, named set of files. A step that would touch many
  unrelated files is a sign the step is too big and should be split.

## When to Ask Questions

The agent (AI) should pause and ask the product owner before proceeding
when:
- A requirement in spec.md is ambiguous enough that two reasonable
  implementations would look meaningfully different.
- A step would require deploying a contract, spending testnet funds, or
  otherwise taking an action only the human can actually perform (wallet
  signatures cannot be delegated to the AI).
- A design decision in design.md doesn't obviously cover the situation
  at hand (e.g. a component type not shown in the reference mockup).

The agent should **not** ask when the answer is already decided in
spec.md/design.md — re-reading those documents comes before asking.

## Explain Before Implementation

For every non-trivial step, before writing code the agent states:
1. **What** is about to be built (in one or two sentences).
2. **Why** this approach over an obvious alternative (if one exists).
3. **Which files** will be created or changed.

Only after that does implementation happen. This isn't ceremony for its
own sake — it's what makes the final "AI-assisted development process"
writeup possible without having to reconstruct reasoning after the fact.

## Avoid Unnecessary Complexity

- Prefer the library's default/documented pattern over a custom
  abstraction, every time, at this project's size.
- No premature reusable component extraction — if a pattern is only
  used once, it stays inline until a second real usage appears.
- No speculative configuration (feature flags, env-driven toggles) for
  functionality that doesn't exist yet.
- If a proposed solution requires explaining more than the feature
  itself is worth, that's the signal to simplify, not to add more
  explanation.

## Beginner-Friendly Explanations

Every explanation assumes the reader is learning full-stack Web3
development for the first time, not that they already know the
ecosystem. Concretely:
- Name unfamiliar concepts the first time they appear (e.g. "a Client
  Component — one that runs in the browser, not on the server — because
  wallet access needs `window.ethereum`").
- Prefer "why does this exist" over "here is the syntax" — syntax is
  looked up; reasoning is what's being learned here.
- When something breaks, walk through *how* to read the error, not just
  the fix — the goal is the product owner being able to debug the next
  one themselves.

## Documenting AI-Generated Code Changes

Every implementation step is logged (informally, in the chat, and
formally, in the final README) with:
- What was AI-generated versus what the product owner changed by hand.
- Any place the product owner overrode an AI suggestion, and why —
  this is exactly the "human decisions and modifications" the final
  deliverable needs to demonstrate.
- Which parts involved a **real on-chain transaction** (contract
  deployment, `checkIn()` calls) versus everything else, which is
  ordinary frontend code — this distinction is the whole point of the
  demo and should never get blurred together in the writeup.
