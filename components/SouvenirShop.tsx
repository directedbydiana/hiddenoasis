"use client";

import { Dices, RotateCcw, Undo2 } from "lucide-react";
import { ACCENTS, ACCENT_IDS, CARD_STYLES, CARD_STYLE_LABELS, type CardDesign, DEFAULT_DESIGN, INKS, INK_IDS, NOTE_MAX, PAPERS, PAPER_IDS, inkPasses } from "@/lib/types";

const label = "flex flex-col gap-1 text-sm font-medium";
const input = "rounded-md border border-black px-3 py-2 font-normal bg-white w-full";

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** A random but cohesive combination; ink is always AA on the chosen paper. */
export function surpriseDesign(current: CardDesign): CardDesign {
  const paper = pickRandom(PAPER_IDS);
  const inks = INK_IDS.filter((i) => inkPasses(i, paper));
  return { ...current, style: pickRandom(CARD_STYLES), paper, ink: pickRandom(inks), accent: pickRandom(ACCENT_IDS) };
}

export function resetDesign(current: CardDesign): CardDesign {
  return { ...DEFAULT_DESIGN, photoAlt: current.photoAlt, note: current.note };
}

export default function SouvenirShop({
  design,
  defaultAlt,
  hasPhoto,
  canUndo,
  onChange,
  onUndo,
}: {
  design: CardDesign;
  defaultAlt: string;
  hasPhoto: boolean;
  canUndo: boolean;
  onChange: (next: CardDesign) => void;
  onUndo: () => void;
}) {
  const set = <K extends keyof CardDesign>(key: K, value: CardDesign[K]) => onChange({ ...design, [key]: value });

  return (
    <fieldset className="flex flex-col gap-4 border-t border-neutral-300 pt-4">
      <legend className="text-sm font-medium pr-2">Card design</legend>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange(surpriseDesign(design))} className="inline-flex items-center gap-1 text-sm rounded-md border border-black px-2 py-1 bg-white">
          <Dices className="w-4 h-4" /> Surprise me
        </button>
        <button type="button" onClick={onUndo} disabled={!canUndo} className="inline-flex items-center gap-1 text-sm rounded-md border border-black px-2 py-1 bg-white disabled:opacity-40">
          <Undo2 className="w-4 h-4" /> Undo
        </button>
        <button type="button" onClick={() => onChange(resetDesign(design))} className="inline-flex items-center gap-1 text-sm rounded-md border border-black px-2 py-1 bg-white">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      <label className={label}>
        Note{" "}
        <span className="font-normal text-neutral-600">
          (one line under your name, {design.note.length}/{NOTE_MAX})
        </span>
        <input className={`${input} font-hand text-xl`} value={design.note} maxLength={NOTE_MAX} placeholder="Say hi at the next meetup." onChange={(e) => set("note", e.target.value)} />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Shape</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Card shape">
          {CARD_STYLES.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={design.style === s} onClick={() => set("style", s)} className={`text-xs rounded-md border px-2.5 py-1.5 ${design.style === s ? "border-black bg-slate-800 text-white" : "border-neutral-400 bg-white"}`}>
              {CARD_STYLE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Paper</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Paper color">
            {PAPER_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={design.paper === id}
                aria-label={PAPERS[id].label}
                title={PAPERS[id].label}
                onClick={() => {
                  const ink = inkPasses(design.ink, id) ? design.ink : INK_IDS.find((i) => inkPasses(i, id)) ?? "black";
                  onChange({ ...design, paper: id, ink });
                }}
                className={`w-8 h-8 rounded-full border-2 ${design.paper === id ? "border-black ring-2 ring-offset-1 ring-black" : "border-neutral-400"}`}
                style={{ background: PAPERS[id].hex }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Ink</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ink color">
            {INK_IDS.map((id) => {
              const ok = inkPasses(id, design.paper);
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={design.ink === id}
                  disabled={!ok}
                  title={ok ? INKS[id].label : `${INKS[id].label} doesn't meet AA contrast on ${PAPERS[design.paper].label}`}
                  onClick={() => set("ink", id)}
                  className={`inline-flex items-center gap-2 text-xs rounded-md border px-2 py-1 bg-white ${design.ink === id ? "border-black ring-2 ring-black" : "border-neutral-400"} disabled:opacity-40`}
                >
                  <span className="w-4 h-4 rounded-full" style={{ background: INKS[id].hex }} />
                  {INKS[id].label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Accent</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent color">
            {ACCENT_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={design.accent === id}
                aria-label={ACCENTS[id].label}
                title={ACCENTS[id].label}
                onClick={() => set("accent", id)}
                className={`w-7 h-7 rounded-full border-2 ${design.accent === id ? "border-black ring-2 ring-offset-1 ring-black" : "border-neutral-400"}`}
                style={{ background: ACCENTS[id].hex }}
              />
            ))}
          </div>
          <span className="text-xs text-neutral-600">Link icons and the Save button.</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={!design.photoTreated} onChange={(e) => set("photoTreated", !e.target.checked)} disabled={!hasPhoto} />
          <span>
            Keep original photo colors
            <span className="block text-xs text-neutral-600">Off by default: photos get a slight warm fade to match the cards.</span>
          </span>
        </label>
        <label className={label}>
          Photo alt text
          <input className={input} value={design.photoAlt} maxLength={120} placeholder={defaultAlt} onChange={(e) => set("photoAlt", e.target.value)} disabled={!hasPhoto} />
          <span className="text-xs font-normal text-neutral-600">For screen readers; defaults to &ldquo;{defaultAlt}&rdquo;.</span>
        </label>
      </div>
    </fieldset>
  );
}
