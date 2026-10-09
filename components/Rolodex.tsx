"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import FillerCard, { FILLER_KINDS, type FillerKind } from "./FillerCard";
import GuestCard from "./GuestCard";
import { ACCENTS, fullName, type PublicContact } from "@/lib/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const STEP_DEG = 18;
const VISIBLE = 3; // real cards shown on each side of the active one
const CARD_H = "h-[23rem]";
const CHIP = "bg-[#f6efe3] text-[#1f1a17] border-2 border-[#1f1a17] shadow-[3px_3px_0_#1f1a17]";

function indexLetter(c: PublicContact) {
  const ch = (c.lastName || c.firstName)[0]?.toUpperCase() ?? "";
  return LETTERS.includes(ch) ? ch : "#";
}

function matches(c: PublicContact, q: string) {
  if (!q) return true;
  const hay = [fullName(c), c.title, c.orgs.join(" "), c.email, c.slug].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

function useMedia(query: string, initial = false) {
  const [on, setOn] = useState(initial);
  useEffect(() => {
    const m = window.matchMedia(query);
    const update = () => setOn(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, [query]);
  return on;
}

// Position on the cylinder for a card `k` steps from the active one.
function arc(k: number, reduced: boolean) {
  if (reduced || k === 0) return "translateY(-50%)";
  // Cards behind fan upward so their tops peek out; cards ahead tuck below.
  const lift = k < 0 ? k * 76 : k * 34;
  return `translateY(-50%) rotateX(${-k * STEP_DEG}deg) translateY(${lift}px)`;
}

// Decorative fillers sit at half-steps between real cards. Deterministic by
// slot so the file looks the same on every visit.
const FILLER_SLOTS = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5];
const FILLER_SHAPES: Record<FillerKind, string> = {
  blank: "inset-x-2 top-0 h-[21rem] rotate-[1.5deg]",
  lined: "inset-x-4 top-0 h-[22rem] -rotate-[1deg]",
  ticket: "left-10 right-24 top-1 h-[9rem] -rotate-[2deg]",
  receipt: "left-[55%] right-6 top-0 h-[18rem] rotate-[3deg]",
  hanger: "left-[10%] right-[55%] top-2 h-[15rem] -rotate-[3deg]",
};

export default function Rolodex({ contacts }: { contacts: PublicContact[] }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const desktop = useMedia("(min-width: 768px)", true);
  const wheelAcc = useRef(0);
  const drag = useRef<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const visible = useMemo(() => contacts.filter((c) => matches(c, query)), [contacts, query]);
  const available = useMemo(() => new Set(contacts.map(indexLetter)), [contacts]);
  const count = visible.length;
  const active = visible[index] ?? null;

  useEffect(() => setIndex(0), [query]);

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(Math.max(0, Math.min(count - 1, next)));
    },
    [count]
  );

  function jumpTo(letter: string) {
    const i = visible.findIndex((c) => indexLetter(c) === letter);
    if (i < 0) return;
    if (desktop) go(i);
    else listRef.current?.children[i]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  function onKey(e: React.KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        go(index + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        go(index - 1);
        break;
      case "Home":
        e.preventDefault();
        go(0);
        break;
      case "End":
        e.preventDefault();
        go(count - 1);
        break;
      default:
        if (/^[a-z]$/i.test(e.key)) jumpTo(e.key.toUpperCase());
    }
  }

  function onWheel(e: React.WheelEvent) {
    wheelAcc.current += e.deltaY;
    if (Math.abs(wheelAcc.current) > 70) {
      go(index + (wheelAcc.current > 0 ? 1 : -1));
      wheelAcc.current = 0;
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button, a, input")) return;
    drag.current = e.clientY;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (drag.current === null) return;
    const dy = e.clientY - drag.current;
    if (Math.abs(dy) > 48) {
      go(index + (dy > 0 ? -1 : 1));
      drag.current = e.clientY;
    }
  }

  const searchBar = (
    <label className={`relative flex items-center gap-2 w-full max-w-sm mx-auto rounded-lg px-3 py-2 ${CHIP} focus-within:outline focus-within:outline-[3px] focus-within:outline-[var(--neon)] focus-within:outline-offset-2`}>
      <Search className="w-4 h-4 shrink-0" aria-hidden />
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-full bg-transparent text-base md:text-sm placeholder:text-[#7a6f66] focus:outline-none" aria-label="Search contacts" />
    </label>
  );

  const activeLetter = active ? indexLetter(active) : null;
  const activeAccent = active ? ACCENTS[active.design.accent].hex : null;

  const tabs = (
    <nav aria-label="Alphabetical index" className={desktop ? "flex flex-col gap-[2px] pb-4" : "flex gap-1.5 overflow-x-auto px-1 py-2"}>
      {LETTERS.map((l) => {
        const has = available.has(l);
        const isActive = l === activeLetter && activeAccent;
        return (
          <button
            key={l}
            type="button"
            disabled={!has}
            aria-current={isActive ? "true" : undefined}
            onClick={() => jumpTo(l)}
            aria-label={has ? `Jump to ${l}` : `No contacts under ${l}`}
            style={isActive ? { background: activeAccent, color: "#f6efe3" } : undefined}
            className={`fob font-type leading-none rounded-md border-2 border-[#1f1a17] ${desktop ? "w-7 h-[1.02rem] text-[10px]" : "w-9 h-9 text-sm shrink-0"} ${
              has ? "bg-[#f6efe3] text-[#1f1a17] shadow-[2px_2px_0_#1f1a17] hover:-translate-y-px" : "border-transparent bg-transparent text-current opacity-30"
            }`}
          >
            {l}
          </button>
        );
      })}
    </nav>
  );

  const empty = <div className={`rounded-lg p-6 text-center text-sm max-w-sm mx-auto ${CHIP}`}>No one matches &ldquo;{query}&rdquo;.</div>;

  if (!desktop) {
    // Phones: a readable stack that scrolls with the page, letters pinned on top.
    return (
      <section aria-label="Contacts" className="flex flex-col gap-3 w-full">
        <div className="sticky top-0 z-20 -mx-4 px-4 pt-2 pb-1 flex flex-col gap-2 backdrop-blur-sm">
          {searchBar}
          <div className="-mx-4 px-3">{tabs}</div>
        </div>
        {count === 0 ? (
          empty
        ) : (
          <ul ref={listRef} className="flex flex-col gap-8 px-1 pt-2 pb-6 pr-3">
            {visible.map((c) => (
              <li key={c.slug} className="scroll-mt-28">
                <GuestCard contact={c} className="w-full" />
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section aria-label="Contacts" className="w-full flex flex-col gap-5">
      {searchBar}
      <div className="flex items-end gap-5 justify-center">
        <div
          role="group"
          aria-roledescription="rolodex"
          aria-label={active ? `Card ${index + 1} of ${count}: ${fullName(active)}` : "Contacts"}
          tabIndex={0}
          onKeyDown={onKey}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          className="card-focus relative w-[34rem] max-w-full h-[30rem] select-none touch-none rounded-lg"
          style={{ perspective: "1400px" }}
        >
          {/* stand: arms from the knobs down to a base plate on the table */}
          <div aria-hidden className="absolute -left-4 top-1/2 bottom-0 w-3 border-x-2 border-[#1f1a17] bg-[#4a4a4e]" />
          <div aria-hidden className="absolute -right-4 top-1/2 bottom-0 w-3 border-x-2 border-[#1f1a17] bg-[#4a4a4e]" />
          <div aria-hidden className="absolute -inset-x-8 bottom-0 h-3.5 rounded-sm border-2 border-[#1f1a17] bg-[#2f2f31] shadow-[4px_4px_0_rgba(0,0,0,0.35)]" />
          {/* rails and knobs of the card file */}
          <div aria-hidden className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 rounded-full border-2 border-[#1f1a17] bg-[#8d8a86]" />
          <div aria-hidden className="absolute -left-7 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border-2 border-[#1f1a17] bg-[#2f2f31] shadow-[3px_3px_0_#1f1a17]" />
          <div aria-hidden className="absolute -right-7 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border-2 border-[#1f1a17] bg-[#2f2f31] shadow-[3px_3px_0_#1f1a17]" />

          {count === 0 && <div className="absolute inset-0 flex items-center justify-center">{empty}</div>}

          {/* Each card is its own flattened layer, so z-index decides stacking and
              tilted neighbours never cover the active card. Fillers sit at the
              half-steps behind the real cards. */}
          <div className="absolute inset-x-8 top-1/2 h-0">
            {count > 0 &&
              !reduced &&
              FILLER_SLOTS.map((k) => {
                const slot = index + k; // stable identity per position in the file
                const kind = FILLER_KINDS[((Math.round(slot * 2) % FILLER_KINDS.length) + FILLER_KINDS.length) % FILLER_KINDS.length];
                return (
                  <div
                    key={`f${k}`}
                    className={`rolodex-card absolute inset-x-0 ${CARD_H}`}
                    style={{ transform: arc(k, reduced), opacity: Math.max(0.2, 0.9 - Math.abs(k) * 0.22), zIndex: 100 - Math.round(Math.abs(k) * 2), pointerEvents: "none" }}
                  >
                    <FillerCard kind={kind} className={`absolute ${FILLER_SHAPES[kind]}`} />
                  </div>
                );
              })}
            {visible.map((c, i) => {
              const k = i - index;
              if (Math.abs(k) > VISIBLE) return null;
              const isActive = k === 0;
              const opacity = reduced ? (isActive ? 1 : 0) : Math.max(0.15, 1 - Math.abs(k) * 0.22);
              return (
                <div key={c.slug} className={`rolodex-card absolute inset-x-0 ${CARD_H}`} style={{ transform: arc(k, reduced), opacity, zIndex: 100 - Math.round(Math.abs(k) * 2), pointerEvents: isActive ? "auto" : "none" }}>
                  <GuestCard contact={c} active={isActive} className="w-full h-full" />
                </div>
              );
            })}
          </div>
        </div>
        {tabs}
      </div>

      {count > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous card" className={`card-focus p-1.5 rounded-md ${CHIP} disabled:opacity-40 disabled:shadow-none`}>
            <ChevronUp className="w-4 h-4" />
          </button>
          <span aria-live="polite" className="font-type tabular-nums">
            {index + 1} / {count}
          </span>
          <button type="button" onClick={() => go(index + 1)} disabled={index === count - 1} aria-label="Next card" className={`card-focus p-1.5 rounded-md ${CHIP} disabled:opacity-40 disabled:shadow-none`}>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
