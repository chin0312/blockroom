import { HowStepper } from "@/components/how-stepper";

export default function HowItWorksPage() {
  return (
    <div className="page-enter inner-page page-frame">
      <header className="editorial-header compact-header">
        <span className="page-code">02 / TRUST FLOW</span>
        <div>
          <span className="section-label">How it works</span>
          <h1>Every state has<br />a source of truth.</h1>
        </div>
        <p>
          Move through the five steps. The MVP uses real wallet state and real
          visible-room time, while clearly labelling what is still local.
        </p>
      </header>
      <HowStepper />
    </div>
  );
}
