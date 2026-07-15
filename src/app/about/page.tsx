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
          BlockRoom is an interactive prototype for co-learning and
          body-doubling. It shows real collaborators while they are connected
          and records only the sessions a wallet explicitly chooses to save.
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
            work across tabs, then choose whether to save an eligible session.
          </p>
        </header>
        <HowStepper />
      </section>
    </div>
  );
}
