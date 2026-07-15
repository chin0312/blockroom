# BlockRoom Visual Refactor Plan

## Selected Direction

**Concept 03: Ambient Network Atelier**

The selected system presents BlockRoom as a serene shared digital atelier made
from spatial focus zones. It replaces hard crystal chip stacks and industrial
instrument panels with soft volumetric pods, frosted pearl shells, translucent
membranes, diffused lavender light, and grounded ambient motion.

Functional behavior remains governed by `docs/project-blueprint.md`.

## Design Tokens

| Role | Token | Value |
|---|---|---|
| Canvas | `--atelier-canvas` | `#f8f6f2` |
| Canvas cool | `--atelier-canvas-cool` | `#f5f4fa` |
| Pearl surface | `--atelier-pearl` | `rgba(255,255,255,.76)` |
| Frost surface | `--atelier-frost` | `rgba(250,249,253,.62)` |
| Ink | `--atelier-ink` | `#242431` |
| Muted ink | `--atelier-muted` | `#72717d` |
| Lavender | `--atelier-violet` | `#9183e8` |
| Lavender soft | `--atelier-violet-soft` | `#c9c2f3` |
| Lavender mist | `--atelier-mist` | `rgba(153,139,232,.14)` |
| Semantic success | `--atelier-success` | `#4f9b7f` |
| Semantic danger | `--atelier-danger` | `#d9685e` |
| Hairline | `--atelier-line` | `rgba(86,82,111,.11)` |
| Soft radius | `--atelier-radius-sm` | `20px` |
| Panel radius | `--atelier-radius-md` | `30px` |
| Spatial radius | `--atelier-radius-lg` | `44px` |
| Floating shadow | `--atelier-shadow` | layered cool/lavender shadow |

## Shared Component Language

- Navigation is a large floating pearl capsule with an illuminated selected
  destination and a violet wallet action.
- Primary actions use a lavender tactile pill; destructive room leave remains
  coral-red and text-labelled.
- Product panels are luminous pearl membranes with subtle inner rims, not
  conventional bordered cards.
- The shared spatial illustration is an **Ambient Module**: an oval focus pod,
  inset seat, orbital floor, and small satellite zones. Variants alter the pod
  arrangement without changing its material system.
- Connection is expressed through proximity, light, and shared floor planes;
  there are no drawn connector lines, diagonal stripes, or slash overlays.
- Motion is slow and restorative: small vertical drift on illustrations,
  180–280ms control feedback, and no continuous animation under reduced motion.

## Page Mapping

### Home

- A two-column entrance composition: confident proposition and a dominant
  interactive-looking focus pod.
- The explanatory `00:00` preview remains neutral and visibly non-live.
- Three destination links become quiet spatial portals rather than dark/accent
  SaaS cards.

### What is BlockRoom

- Product-model tabs become a vertical set of pearl touch controls.
- The active concept combines editorial copy with a large ambient pod variant.
- How it works uses a soft orbital step rail and one large scene per step.

### Rooms

- Directory cards become destination windows with a large pod scene and compact
  honest metadata.
- Four-column desktop grid, two-column intermediate grid, one-column mobile.
- The visual distinction between Learning, Co-working, and Hackathon comes from
  pod composition, not fabricated room imagery.

### Room

- Before joining: one expansive empty spatial stage with a contained join panel.
- After joining: meeting-first layout remains complete inside a laptop viewport.
- Member media tiles use soft pearl frames and a calm empty-stage treatment.
- Controls form a floating lower capsule; timer remains a small top control.
- Fullscreen, pin, media, chat, leave, qualification, and save/discard behavior
  remain unchanged.

### Dashboard

- Reads as a personal memory surface instead of an admin dashboard.
- Identity and statistics become one calm summary band.
- Calendar remains the visual center; history and badges occupy complementary
  pearl zones.
- Zero activity uses real blank cells and locked badge states with no sample
  records.

## Responsive and Accessibility Rules

- Desktop target: 1440×900 and 1280×720 without horizontal overflow.
- Mobile target: 375×812 with navigation, rooms, calendar, dialogs, and spatial
  controls reachable without horizontal scrolling.
- Joined room defaults to a complete workspace view; fullscreen only enlarges.
- Minimum target size remains 44px and focus-visible treatment uses a violet ring.
- Reduced motion removes ambient drift and transform-heavy reveals.
- Reduced transparency replaces membrane surfaces with opaque pearl.

## Acceptance Criteria

- No reference to the removed hard-edged crystal hardware remains in rendered UI.
- No decorative diagonal lines or slash overlays appear on any surface.
- All routes, room slugs, wallet behavior, real occupancy, Realtime, WebRTC,
  session persistence, calendar derivation, and badge signatures remain intact.
- Honest empty, disconnected, fallback, error, full-room, eligible, signed, and
  rejected states remain visually distinct.
- ESLint, TypeScript, and production build pass.
- Desktop and mobile browser checks cover Home, About, Rooms, one Room detail,
  Dashboard, tabs, filters, and navigation.
