"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./brand";
import { Icon } from "./icons";
import { WalletControl } from "./wallet-control";

const navigation = [
  { href: "/", label: "Home", icon: "cube" as const },
  { href: "/about", label: "What is BlockRoom", icon: "spark" as const },
  { href: "/rooms", label: "Rooms", icon: "group" as const },
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" as const },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className={isActive(item.href) ? "nav-link active" : "nav-link"}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <WalletControl />
          <button
            className="menu-button"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navigation.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className={isActive(item.href) ? "mobile-nav-link active" : "mobile-nav-link"}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
              <Icon name="arrow" size={18} />
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
