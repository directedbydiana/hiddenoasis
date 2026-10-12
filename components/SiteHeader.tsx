"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Contact, Settings } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Directory" },
  { href: "/new", label: "New card" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="focus-ring flex items-center gap-2 rounded-md font-semibold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-fg">
            <Contact className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden sm:inline">ShadedOasis</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`focus-ring rounded-full px-3 py-2 text-sm font-medium ${active ? "bg-soft text-ink" : "text-muted hover:bg-soft hover:text-ink"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/admin"
            aria-label="Manage contacts"
            title="Manage contacts"
            className={`focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-soft hover:text-ink ${pathname.startsWith("/admin") ? "text-ink" : "text-muted"}`}
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
