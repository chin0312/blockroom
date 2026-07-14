import { SessionAction } from "@/components/session-action";
import { WalletControl } from "@/components/wallet-control";

type IconName =
  | "book"
  | "briefcase"
  | "check"
  | "cube"
  | "group"
  | "shield"
  | "spark";

const rooms = [
  {
    name: "Learning Room 1",
    type: "Learning",
    description: "Group study session — open to anyone learning together",
    icon: "book" as IconName,
    tone: "blue",
  },
  {
    name: "Learning Room 2",
    type: "Learning",
    description: "Group study session — open to anyone learning together",
    icon: "group" as IconName,
    tone: "lavender",
  },
  {
    name: "Co-working Space 1",
    type: "Co-working",
    description: "Focus together, work independently, body-double style",
    icon: "briefcase" as IconName,
    tone: "sky",
  },
  {
    name: "Hackathon Preparation",
    type: "Hackathon",
    description: "Prep together for your next hackathon",
    icon: "spark" as IconName,
    tone: "indigo",
  },
];

function LineIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
      </>
    ),
    check: (
      <>
        <path d="M20 11.1V12a8 8 0 1 1-4.7-7.3" />
        <path d="m9 11 3 3L22 4" />
      </>
    ),
    cube: (
      <>
        <path d="m12 2 8 4.5v9L12 20l-8-4.5v-9z" />
        <path d="m4.3 6.7 7.7 4.4 7.7-4.4M12 20v-8.9" />
      </>
    ),
    group: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3-1.4 4.2a5 5 0 0 1-3.2 3.2L3 12l4.4 1.6a5 5 0 0 1 3.2 3.2L12 21l1.4-4.2a5 5 0 0 1 3.2-3.2L21 12l-4.4-1.6a5 5 0 0 1-3.2-3.2z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span className="brand-core" />
    </span>
  );
}

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="floating-cube cube-one" />
      <div className="floating-cube cube-two" />
      <div className="hero-tile hero-tile-main">
        <span className="hero-icon"><LineIcon name="group" /></span>
        <span>Learn together</span>
      </div>
      <div className="hero-tile hero-tile-left">
        <span className="hero-icon"><LineIcon name="book" /></span>
        <span>Join rooms</span>
      </div>
      <div className="hero-tile hero-tile-right">
        <span className="hero-icon"><LineIcon name="shield" /></span>
        <span>Build a record</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="BlockRoom home">
          <BrandMark />
          <span>BlockRoom</span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#about">About</a>
          <a href="#how-it-works">How it works</a>
          <a href="#rooms">Rooms</a>
        </nav>
        <WalletControl />
      </header>

      <main id="main-content">
        <section className="hero-section" id="top">
          <div className="hero-copy">
            <span className="eyebrow">
              <LineIcon name="cube" /> Web3 co-learning space
            </span>
            <h1>
              Learn. Build. Grow <span>on-chain.</span>
            </h1>
            <p className="hero-lede">
              A focused place to learn alongside others, use your wallet as
              your identity, and turn completed sessions into a record you own.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#rooms">
                Enter BlockRoom
              </a>
              <WalletControl placement="hero" />
            </div>
            <p className="prototype-note">
              Alpha prototype · Real wallet connection · No fabricated activity
            </p>
          </div>
          <HeroVisual />
        </section>

        <section className="value-strip" aria-label="BlockRoom principles">
          <article>
            <span className="icon-shell"><LineIcon name="shield" /></span>
            <div><h2>Wallet identity</h2><p>No username or password required.</p></div>
          </article>
          <article>
            <span className="icon-shell"><LineIcon name="group" /></span>
            <div><h2>Learn together</h2><p>Shared focus, without fake presence.</p></div>
          </article>
          <article>
            <span className="icon-shell"><LineIcon name="check" /></span>
            <div><h2>Verifiable effort</h2><p>Real check-ins will live on Monad.</p></div>
          </article>
        </section>

        <section className="section" id="about">
          <div className="section-heading">
            <span className="eyebrow">What is BlockRoom?</span>
            <h2>A calmer way to make learning <span>count.</span></h2>
            <p>
              BlockRoom is a small, inspectable experiment in portable learning
              reputation — not a marketplace, and not a promise of a community
              that does not exist yet.
            </p>
          </div>
          <div className="bento-grid about-grid">
            <article className="glass-card bento-large identity-card">
              <div className="card-icon"><LineIcon name="shield" /></div>
              <span className="card-kicker">Your identity</span>
              <h3>Bring a wallet, not another account.</h3>
              <p>
                Your connected address identifies you without a profile database
                or traditional sign-up flow.
              </p>
              <div className="identity-line">
                <span className="wallet-avatar" aria-hidden="true" />
                <span>Your address appears here after connection</span>
              </div>
            </article>
            <article className="glass-card bento-small">
              <div className="card-icon"><LineIcon name="cube" /></div>
              <span className="card-kicker">The room</span>
              <h3>A simple shared learning context.</h3>
              <p>Room cards show possible use cases, never invented attendance.</p>
            </article>
            <article className="glass-card bento-small accent-card">
              <div className="card-icon"><LineIcon name="check" /></div>
              <span className="card-kicker">The proof</span>
              <h3>One honest on-chain action.</h3>
              <p>A confirmed check-in will be the only persistent record.</p>
            </article>
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="section-heading centered">
            <span className="eyebrow">How it works</span>
            <h2>Three steps, one <span>verifiable result.</span></h2>
          </div>
          <ol className="steps-grid">
            <li className="glass-card step-card">
              <span className="step-number">01</span>
              <div className="card-icon"><LineIcon name="shield" /></div>
              <h3>Connect</h3>
              <p>Use MetaMask on Monad Testnet. Your wallet becomes your identity.</p>
            </li>
            <li className="glass-card step-card">
              <span className="step-number">02</span>
              <div className="card-icon"><LineIcon name="book" /></div>
              <h3>Choose a room</h3>
              <p>Explore prototype spaces for learning, working, and building.</p>
            </li>
            <li className="glass-card step-card">
              <span className="step-number">03</span>
              <div className="card-icon"><LineIcon name="check" /></div>
              <h3>Check in</h3>
              <p>In Phase 3, confirm a real transaction after completing a session.</p>
            </li>
          </ol>
        </section>

        <section className="section rooms-section" id="rooms">
          <div className="section-heading">
            <span className="eyebrow">Prototype rooms</span>
            <h2>Find a space for <span>focused progress.</span></h2>
            <p>
              These cards demonstrate possible room types. They do not represent
              live rooms, scheduled sessions, or current participants.
            </p>
          </div>
          <div className="rooms-grid">
            {rooms.map((room) => (
              <article className="room-card glass-card" key={room.name}>
                <div className={`room-visual room-visual-${room.tone}`}>
                  <span className="room-icon"><LineIcon name={room.icon} /></span>
                  <span className="room-grid-lines" />
                </div>
                <div className="room-content">
                  <span className="type-pill">{room.type}</span>
                  <h3>{room.name}</h3>
                  <p>{room.description}</p>
                  <span className="prototype-label">Static prototype</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section reputation-section" id="reputation">
          <div className="reputation-copy">
            <span className="eyebrow">On-chain reputation</span>
            <h2>Your effort should be <span>portable.</span></h2>
            <p>
              A BlockRoom check-in is designed to be a small, transparent proof
              that your wallet completed a learning session. No scores, badges,
              or inflated claims — just a count backed by Monad Testnet.
            </p>
            <ul className="proof-list">
              <li><LineIcon name="check" /> Written by your own wallet</li>
              <li><LineIcon name="check" /> Publicly readable on-chain</li>
              <li><LineIcon name="check" /> No admin-created activity</li>
            </ul>
          </div>
          <aside className="glass-card action-card" aria-labelledby="action-title">
            <div className="action-icon"><LineIcon name="cube" /></div>
            <span className="card-kicker">Phase 1 preview</span>
            <h3 id="action-title">Complete a learning session</h3>
            <p>
              The contract does not exist yet, so this control cannot write
              on-chain during this phase.
            </p>
            <SessionAction />
          </aside>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand" href="#top" aria-label="Back to top">
          <BrandMark /><span>BlockRoom</span>
        </a>
        <p>Built as an honest Web3 learning prototype on Monad Testnet.</p>
        <a href="#top">Back to top</a>
      </footer>
    </div>
  );
}
