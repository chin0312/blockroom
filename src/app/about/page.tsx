import Link from "next/link";
import { AboutExplorer } from "@/components/about-explorer";
import { Icon } from "@/components/icons";

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
          body-doubling. It separates what is real now from what will become
          verifiable on-chain later.
        </p>
      </header>
      <AboutExplorer />
      <section className="page-next-step">
        <span>Next</span>
        <div><h2>See the full trust flow.</h2><p>From wallet connection to a qualifying session.</p></div>
        <Link className="button button-primary" href="/how-it-works">How it works <Icon name="arrow" size={18} /></Link>
      </section>
    </div>
  );
}
