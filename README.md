# BlockRoom

BlockRoom is a wallet-identified, real-time co-learning and co-working MVP.
Connected users can join six-person focus rooms, communicate through live
presence, chat and WebRTC media, then optionally save eligible focus sessions as
wallet-scoped activity in the current browser.

The product never fabricates users, occupancy, messages, sessions, badges or
on-chain state. See [`docs/project-blueprint.md`](docs/project-blueprint.md) for
the complete functional contract.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Public environment variables

Copy `.env.example` to `.env.local` and provide the public configuration needed
for the capabilities you want to test:

- `NEXT_PUBLIC_REOWN_PROJECT_ID`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the compatibility fallback

No private wallet key, service-role key or signing secret belongs in the client
environment.

Without Supabase configuration, rooms use the explicitly labelled
`Same-browser tab mode` fallback.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Active product references

- [`docs/project-blueprint.md`](docs/project-blueprint.md) — functional source of truth
- [`docs/design-references/elevenlabs/DESIGN.md`](docs/design-references/elevenlabs/DESIGN.md) — active visual language
