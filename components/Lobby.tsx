"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Rolodex from "./Rolodex";
import Sky from "./Sky";
import { PINS, PIN_IDS, chromeFor, isPin, paletteFor, sunState, type PinId } from "@/lib/daylight";
import type { PublicContact } from "@/lib/types";

const PIN_KEY = "hiddenoasis.timePin";
const REFRESH_MS = 3 * 60_000;

function readPin(): PinId | "live" {
  const q = new URLSearchParams(window.location.search).get("time");
  if (isPin(q)) return q;
  try {
    const stored = localStorage.getItem(PIN_KEY);
    if (isPin(stored)) return stored;
  } catch {
    /* storage unavailable */
  }
  return "live";
}

// Roadside motel sign with the neon VACANCY line built in.
function Sign({ neon }: { neon: number }) {
  return (
    <div className="w-[min(92vw,36rem)]">
      <div className="rounded-2xl border-[3px] border-[#1f1a17] bg-[#f6efe3] text-[#1f1a17] shadow-[7px_7px_0_#1f1a17] overflow-hidden">
        <div className="relative px-6 pt-5 pb-3 text-center">
          {/* marquee bulbs */}
          <span aria-hidden className="absolute inset-x-3 top-2 h-1.5 bg-[radial-gradient(circle,#f0c36a_1.5px,transparent_2px)] bg-[length:14px_6px] bg-repeat-x opacity-80" />
          <h1 className="font-sign text-[clamp(1.2rem,4.3vw,2.15rem)] leading-none whitespace-nowrap mt-3">SHADED OASIS</h1>
          <p className="font-script text-[clamp(1.6rem,4vw,2.2rem)] leading-none -mt-1 text-[#b5352b]">motel</p>
        </div>
        <div className="relative border-t-[3px] border-[#1f1a17] bg-[#1f1a17] py-2 text-center">
          <span aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,59,107,0.45),transparent_70%)] transition-opacity duration-[2000ms]" style={{ opacity: neon }} />
          <span className="relative font-sign text-2xl tracking-[0.3em] transition-[color,text-shadow] duration-[2000ms]" style={neonStyle(neon)}>
            VACANCY
          </span>
        </div>
      </div>
      {/* sign post */}
      <div aria-hidden className="mx-auto w-3 h-6 bg-[#1f1a17]" />
    </div>
  );
}

// A wooden table the card file sits on.
function Table() {
  return (
    <div aria-hidden className="relative w-[min(96vw,66rem)] -mt-1">
      <div
        className="h-6 rounded-[5px] border-[3px] border-[#1f1a17]"
        style={{
          background:
            "repeating-linear-gradient(180deg, rgba(0,0,0,0.09) 0 1px, transparent 1px 5px), repeating-linear-gradient(90deg, rgba(255,230,190,0.08) 0 2px, transparent 2px 60px), linear-gradient(180deg, #c48a4d, #a46b35)",
        }}
      />
      <div className="mx-3 h-5 rounded-b-[4px] border-x-[3px] border-b-[3px] border-[#1f1a17] bg-[linear-gradient(180deg,#7a4b2a,#5e3820)] shadow-[7px_7px_0_rgba(0,0,0,0.25)]" />
      <div className="flex justify-between px-12">
        <span className="w-6 h-20 rounded-b-md border-x-[3px] border-b-[3px] border-[#1f1a17] bg-[linear-gradient(90deg,#8c5a2e,#6b4226)]" />
        <span className="w-6 h-20 rounded-b-md border-x-[3px] border-b-[3px] border-[#1f1a17] bg-[linear-gradient(90deg,#8c5a2e,#6b4226)]" />
      </div>
    </div>
  );
}

// The motel: a sign, a rotating card file on a table, and a room whose
// color follows the viewer's local time of day.
export default function Lobby({ contacts }: { contacts: PublicContact[] }) {
  const [now, setNow] = useState(() => new Date(2026, 0, 1, 19, 0)); // server renders dusk
  const [pin, setPin] = useState<PinId | "live">("live");

  useEffect(() => {
    setPin(readPin());
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  function choosePin(next: PinId | "live") {
    setPin(next);
    try {
      if (next === "live") localStorage.removeItem(PIN_KEY);
      else localStorage.setItem(PIN_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }

  const sun = useMemo(() => (pin === "live" ? sunState(now) : PINS[pin].sun), [pin, now]);
  const palette = useMemo(() => paletteFor(sun), [sun]);
  const chrome = chromeFor(palette);

  return (
    <div className="relative isolate min-h-screen flex flex-col" style={{ color: chrome.bottom }}>
      <Sky palette={palette} sun={sun} />
      <header className="flex flex-col items-center pt-8 px-4">
        <Sign neon={palette.neon} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-end px-4 pt-8">
        <div className="w-full max-w-5xl">
          <Rolodex contacts={contacts} />
        </div>
        <Table />
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-10 py-6 text-xs">
        <label className="inline-flex items-center gap-2 opacity-80 hover:opacity-100">
          <span>Time of day</span>
          <select
            value={pin}
            onChange={(e) => choosePin(e.target.value as PinId | "live")}
            className="card-focus rounded-md border-2 border-current bg-transparent px-1.5 py-0.5 text-xs"
            style={{ color: chrome.bottom }}
            aria-label="Time of day shown in the room"
          >
            <option value="live">Live</option>
            {PIN_IDS.map((id) => (
              <option key={id} value={id}>
                {PINS[id].label}
              </option>
            ))}
          </select>
        </label>
        <Link href="/admin" className="card-focus rounded-md border-2 border-current px-3 py-1 opacity-80 hover:opacity-100">
          Manage
        </Link>
      </footer>
    </div>
  );
}

// Neon brightness as a continuous value: faint tubes by day, full glow at night.
function neonStyle(n: number): React.CSSProperties {
  const glow = (a: number) => `rgba(255,59,107,${(a * n).toFixed(2)})`;
  return {
    color: n > 0.4 ? "#ffd9e3" : "#8a5a69",
    textShadow: `0 0 3px rgba(255,255,255,${(0.9 * n).toFixed(2)}), 0 0 8px ${glow(1)}, 0 0 18px ${glow(0.9)}, 0 0 36px ${glow(0.8)}`,
  };
}
