"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";

const navLinks = [
  { href: "/housing", label: "Housing" },
  { href: "/labor", label: "Labor" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="dashboard-nav">
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <Link href="/housing" className="nav-brand-link">
          Signal & Stories
        </Link>
        <div className="nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? "nav-link-active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <UserMenu />
    </nav>
  );
}
