import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "BlockRoom | Focus together, prove the time",
  description:
    "A real-time Web3 co-learning space with wallet presence, joined-room sessions, and honest local activity records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <a className="skip-link" href="#main-content">Skip to content</a>
          <div className="app-shell">
            <SiteHeader />
            <main id="main-content">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
