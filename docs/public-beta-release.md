# BlockRoom v1 Public Beta Release Checklist

This checklist separates local release readiness from actions that require
real credentials, funded wallets, deployed contracts, or Vercel access.

## Local release gate

- [x] `npm run lint`
- [x] `npx tsc --noEmit`
- [x] `npm run test`
- [x] `npm run contracts:test`
- [x] `npm run build`
- [x] Home, About, Rooms, Room and Dashboard render without application errors
- [x] Desktop, laptop and mobile layouts remain usable
- [x] Reown is configured with only Monad Testnet, Base Sepolia and Ethereum Sepolia
- [x] Undeployed chains show an explicit unavailable state
- [x] Same-browser fallback is labelled honestly when Supabase is absent
- [x] No secret or populated private key is tracked by Git

The browser-only Lit development notices emitted by Reown are not production
errors and do not appear in the optimized build.

## Dependency security review

- A clean `npm ci` succeeds from the committed lockfile.
- The WalletConnect-bundled Viem copy is constrained to patched `ws@8.21.0`;
  the previous high-severity `ws` findings are absent from
  `npm audit --omit=dev`.
- The production audit still reports ten moderate transitive findings: the
  PostCSS version bundled by Next.js and UUID versions bundled by MetaMask.
  npm offers only breaking or invalid major-version changes for these paths.
- BlockRoom never stringifies user-supplied CSS and never calls the affected
  UUID buffer APIs. These findings remain monitored rather than force-fixed.
  Re-run the audit before Production and update the owning framework/wallet
  packages when compatible releases are available.

## Contract deployment gate — repeat per chain

- [x] Approved deployer is funded with the target testnet gas token
- [x] Session contract deployed first
- [x] Badge contract deployed with the real Session address
- [x] Both real addresses recorded in the central chain registry
- [x] Session source verified in the explorer
- [x] Badge source and constructor argument verified in the explorer
- [x] Read `totalCompletedSessions` from the deployed Session contract
- [x] Confirm Badge contract `sessions()` returns the deployed Session address

## Real wallet flow — repeat per chain

- [ ] Connect an approved test wallet
- [ ] Confirm Dashboard displays the connected chain
- [ ] Leave before 30 minutes and confirm no record is retained
- [ ] Rejoin and remain for at least 30 continuous minutes
- [ ] Confirm eligibility appears only after 1,800 seconds
- [ ] Continue beyond 30 minutes and confirm no duplicate is created
- [ ] Leave and verify the final duration freezes exactly once
- [ ] Reject the first wallet request and confirm the Session remains pending
- [ ] Retry from Dashboard and wait for a successful receipt
- [ ] Refresh during a submitted transaction and resume receipt tracking
- [ ] Confirm totals, history and calendar update only after success
- [ ] Confirm duplicate Session ID submission reverts
- [ ] Confirm leaving and rejoining creates a new independent Session
- [ ] Claim First Session once and confirm a second claim reverts
- [ ] Confirm 24 Hour Focus remains locked below 86,400 confirmed seconds
- [ ] Confirm soulbound transfer and approval operations revert
- [ ] Confirm transaction and Badge explorer links use the connected chain

## Realtime and media flow

- [ ] Two different browsers see only genuinely joined members
- [ ] Leaving or closing removes presence
- [ ] Chat messages arrive in both browsers
- [ ] Mute state follows actual microphone state
- [ ] Voice activity reacts only to microphone input
- [ ] Webcam video renders locally and remotely
- [ ] Pinning preserves video aspect ratio
- [ ] Screen share renders locally and remotely
- [ ] Fullscreen controls remain reachable
- [x] Room capacity stops a seventh unique wallet from joining (model + live Supabase smoke)

## Preview deployment gate

- [x] Vercel project is linked
- [x] Preview environment contains the Reown project ID
- [x] Preview environment contains Supabase public values
- [x] The application registry contains only real deployed contract addresses
- [x] `NEXT_PUBLIC_APP_URL` matches the stable Preview origin
- [ ] A real wallet connection confirms the stable Preview origin is accepted by Reown
- [x] Deployment private key is absent from Vercel
- [x] Explorer API key is absent from Vercel
- [x] Preview build completes successfully
- [x] Preview URL opens without Vercel Authentication, runtime or console errors
- [ ] All local and real-wallet checks are repeated against Preview

Stable public Preview:

- <https://blockroom-chin0312-wowwwthemaya.vercel.app>

Release-candidate deployment:

- <https://blockroom-8bmtpdkaz-wowwwthemaya.vercel.app>

Automated Preview QA verified Home, About, all twelve Room catalogue entries,
an unjoined Room, Dashboard zero states, calendar accessibility and the
wallet-only Reown selector. The automated browser has no signing wallet, so
transaction, media and genuine multi-browser presence checks remain explicitly
manual rather than being reported as passed.

## Release decision

Do not recommend Production while any critical contract, wallet, realtime,
media, responsive, security or data-integrity item remains unchecked.
