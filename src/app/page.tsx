import Link from "next/link";
import { AmbientModule } from "@/components/ambient-module";
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
            <div><span className="preview-brand-dot" /> BlockRoom</div>
            <span className="preview-timer">00:00</span>
          </div>
          <div className="preview-main">
            <div className="preview-room-stage">
              <div className="preview-room-meta"><strong>Learning Room 1</strong><span><i className="truth-dot" /> 0/6 live</span></div>
              <div className="preview-empty-state">
                <span className="preview-empty-icon"><Icon name="group" size={25} /></span>
                <strong>Empty room</strong>
                <small>Join to load real presence.</small>
              </div>
            </div>
            <div className="preview-side-panel">
              <div className="preview-tabs"><span className="active">Active members</span><span>Discussions</span></div>
              <div className="preview-empty-state compact">
                <Icon name="group" size={25} />
                <strong>No one here yet</strong>
                <small>Real members appear after joining.</small>
              </div>
            </div>
          </div>
          <div className="preview-control-dock" aria-hidden="true">
            <span><Icon name="group" size={17} /></span>
            <span><Icon name="play" size={17} /></span>
            <span><Icon name="dashboard" size={17} /></span>
            <i />
            <span><Icon name="empty" size={17} /></span>
          </div>
          <div className="preview-footer">
            <span>Explanatory preview</span>
            <span>Same-browser tab mode when Supabase is unavailable</span>
          </div>
        </MotionReveal>
      </section>

      <section className="home-index page-frame" aria-label="Explore BlockRoom">
        <Link className="index-card index-card-dark" href="/about">
          <span className="index-number">01</span>
          <div><span>Understand the model</span><h2>What is BlockRoom?</h2></div>
          <AmbientModule variant="identity" size="nano" />
          <Icon name="arrow" />
        </Link>
        <Link className="index-card" href="/rooms">
          <span className="index-number">02</span>
          <div><span>Join a real context</span><h2>Explore Rooms</h2></div>
          <AmbientModule variant="room" size="nano" />
          <Icon name="arrow" />
        </Link>
        <Link className="index-card index-card-accent" href="/dashboard">
          <span className="index-number">03</span>
          <div><span>Inspect real state</span><h2>Open Dashboard</h2></div>
          <AmbientModule variant="proof" size="nano" />
          <Icon name="arrow" />
        </Link>
      </section>
    </div>
  );
}
