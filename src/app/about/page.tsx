import { AboutExplorer } from "@/components/about-explorer";
import { HowStepper } from "@/components/how-stepper";

export default function AboutPage() {
  return (
    <div className="page-enter inner-page page-frame">
      <header className="editorial-header">
        <span className="page-code">01 / PRODUCT MODEL</span>
        <div>
          <span className="section-label">What is BlockRoom?</span>
          <h1>A room for focus.<br />A record for effort.</h1>
        </div>
        <p>
          BlockRoom is a public-beta co-learning and
          body-doubling. It shows real collaborators while they are connected
          and records eligible sessions only after explicit wallet approval.
        </p>
      </header>
      <AboutExplorer />
      <section className="combined-how-section" id="how-it-works" aria-labelledby="how-it-works-title">
        <header>
          <span className="page-code">02 / TRUST FLOW</span>
          <div>
            <span className="section-label">How it works</span>
            <h2 id="how-it-works-title">Every state has a source of truth.</h2>
          </div>
          <p>
            Move from wallet identity to a room, keep collaborating while you
            work across tabs, then confirm an eligible self-attested record.
          </p>
        </header>
        <HowStepper />
      </section>
    </div>
  );
}
