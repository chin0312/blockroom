import Link from "next/link";
import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Brand />
        <p>BlockRoom v1 Public Beta — focused time, recorded honestly.</p>
        <div className="footer-links">
          <Link href="/rooms">Rooms</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
