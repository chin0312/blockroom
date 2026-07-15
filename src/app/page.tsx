import Link from "next/link";
import { CrystalHardware } from "@/components/crystal-hardware";
import { Icon } from "@/components/icons";
import { MotionReveal } from "@/components/motion-reveal";
import { WalletControl } from "@/components/wallet-control";

export default function HomePage() {
  return (
    <div className="page-enter home-page">
      <section className="home-hero page-frame">
        <MotionReveal className="home-hero-copy" depth={18}>
          <span className="section-label">Web3 co-learning, without invented activity</span>
          <h1>Focus together.<br />Keep the proof.</h1>
          <p>
            Join a real-time focus room, stay connected for 30 minutes,
            and keep an honest activity record tied to your wallet.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/rooms">
              Explore rooms <Icon name="arrow" size={18} />
            </Link>
            <WalletControl placement="hero" />
          </div>
        </MotionReveal>

        <MotionReveal className="product-preview" delay={0.08} depth={28} ariaLabel="BlockRoom product preview">
          <div className="preview-header">
            <span>ROOM / REALTIME CONTEXT</span>
            <span className="open-pill">Join to load presence</span>
          </div>
          <div className="preview-main">
            <div className="preview-room-map" aria-hidden="true">
              <CrystalHardware variant="room" size="hero" />
            </div>
            <div className="preview-console">
              <span>JOINED ROOM TIME</span>
              <strong>00:00</strong>
              <div className="preview-progress"><i /></div>
              <small>Complete unlocks at 30:00</small>
            </div>
          </div>
          <div className="preview-footer">
            <span><i className="truth-dot" /> Real members only</span>
            <span>Local record after 30:00</span>
          </div>
        </MotionReveal>
      </section>

      <section className="home-index page-frame" aria-label="Explore BlockRoom">
        <Link className="index-card index-card-dark" href="/about">
          <span className="index-number">01</span>
          <div><span>Understand the model</span><h2>What is BlockRoom?</h2></div>
          <CrystalHardware variant="identity" size="nano" />
          <Icon name="arrow" />
        </Link>
        <Link className="index-card" href="/rooms">
          <span className="index-number">02</span>
          <div><span>Join a real context</span><h2>Explore Rooms</h2></div>
          <CrystalHardware variant="room" size="nano" />
          <Icon name="arrow" />
        </Link>
        <Link className="index-card index-card-accent" href="/dashboard">
          <span className="index-number">03</span>
          <div><span>Inspect real state</span><h2>Open Dashboard</h2></div>
          <CrystalHardware variant="proof" size="nano" />
          <Icon name="arrow" />
        </Link>
      </section>
    </div>
  );
}
