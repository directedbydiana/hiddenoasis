"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import GuestCard from "./GuestCard";
import { btnPrimary, card } from "@/lib/ui";
import { fullName, type PublicContact } from "@/lib/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function indexLetter(c: PublicContact) {
  const ch = (c.lastName || c.firstName)[0]?.toUpperCase() ?? "";
  return LETTERS.includes(ch) ? ch : "#";
}

function matches(c: PublicContact, q: string) {
  if (!q) return true;
  const hay = [fullName(c), c.title, c.orgs.join(" "), c.email, c.slug].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

// Searchable, filterable grid of contact cards.
export default function Directory({ contacts }: { contacts: PublicContact[] }) {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState<string | null>(null);

  const available = useMemo(() => new Set(contacts.map(indexLetter)), [contacts]);
  const visible = useMemo(
    () => contacts.filter((c) => matches(c, query) && (letter === null || indexLetter(c) === letter)),
    [contacts, query, letter]
  );

  const chip = (active: boolean, disabled = false) =>
    `focus-ring h-8 min-w-8 rounded-full px-2.5 text-xs font-semibold transition ${
      active ? "bg-primary text-primary-fg" : disabled ? "text-muted opacity-40" : "bg-surface text-muted border border-line hover:bg-soft hover:text-ink"
    }`;

  return (
    <section aria-label="Contacts" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Directory</h1>
          <p className="mt-1 text-sm text-muted">
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}. Open a card to save it to your phone.
          </p>
        </div>
        <Link href="/new" className={btnPrimary}>
          <Plus className="h-4 w-4" /> New card
        </Link>
      </div>

      <div className={`${card} flex flex-col gap-3 p-3 sm:p-4`}>
        <label className="focus-ring flex min-h-[44px] items-center gap-2 rounded-lg border border-line bg-canvas px-3 focus-within:border-primary">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, title, company, or email" className="w-full bg-transparent text-base text-ink placeholder:text-muted focus:outline-none" aria-label="Search contacts" />
        </label>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by last name">
          <button type="button" onClick={() => setLetter(null)} aria-pressed={letter === null} className={chip(letter === null)}>
            All
          </button>
          {LETTERS.map((l) => {
            const has = available.has(l);
            return (
              <button key={l} type="button" disabled={!has} onClick={() => setLetter(letter === l ? null : l)} aria-pressed={letter === l} aria-label={has ? `Show ${l}` : `No contacts under ${l}`} className={chip(letter === l, !has)}>
                {l}
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={`${card} p-8 text-center text-sm text-muted`}>
          {contacts.length === 0 ? "No contacts yet." : "No one matches that search."}
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {visible.map((c) => (
            <li key={c.slug} className="flex">
              <GuestCard contact={c} className="w-full" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
