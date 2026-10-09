"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Download, ExternalLink, Mail, Pencil, Phone, X } from "lucide-react";
import LinkIcon from "./LinkIcon";
import { AA_TEXT, ensureContrast, mix, readableOn } from "@/lib/color";
import { ACCENTS, INKS, PAPERS, fullName, photoAlt, type CardDesign, type PublicContact } from "@/lib/types";
import { vcardFileName } from "@/lib/vcard";

export interface CardPalette {
  paper: string;
  ink: string;
  inkSoft: string;
  rule: string;
  accent: string;
  onAccent: string;
}

export function paletteFor(d: CardDesign): CardPalette {
  const paper = PAPERS[d.paper].hex;
  const ink = INKS[d.ink].hex;
  const accent = ACCENTS[d.accent].hex;
  return {
    paper,
    ink,
    inkSoft: ensureContrast(mix(ink, paper, 0.3), paper, AA_TEXT, ink),
    rule: mix(ink, paper, 0.75),
    accent,
    onAccent: readableOn(accent),
  };
}

const STYLE_SHAPE: Record<CardDesign["style"], string> = {
  plain: "rounded-xl",
  keytag: "rounded-3xl",
  postcard: "rounded-md",
  luggage: "rounded-r-xl rounded-l-[2.5rem]",
  matchbook: "rounded-b-xl rounded-t-md",
};

// Style-specific trim; decorative only and kept in the margins.
function Decor({ design, p }: { design: CardDesign; p: CardPalette }) {
  switch (design.style) {
    case "keytag":
      return <span aria-hidden className="absolute left-4 bottom-4 w-5 h-5 rounded-full border-[3px]" style={{ borderColor: p.ink }} />;
    case "postcard":
      return <span aria-hidden className="absolute inset-2 rounded-[inherit] border border-dashed pointer-events-none" style={{ borderColor: p.rule }} />;
    case "luggage":
      return <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-[3px]" style={{ borderColor: p.accent }} />;
    case "matchbook":
      return <span aria-hidden className="absolute inset-x-0 top-0 h-2.5 rounded-t-[inherit]" style={{ background: `repeating-linear-gradient(90deg, ${p.ink} 0 3px, ${p.rule} 3px 6px)` }} />;
    default:
      return null;
  }
}

function Photo({ contact, p }: { contact: PublicContact; p: CardPalette }) {
  const initials = `${contact.firstName[0] ?? ""}${contact.lastName[0] ?? ""}`.toUpperCase();
  return (
    <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 border-[#1f1a17] bg-white">
      {contact.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={contact.photoUrl} alt={photoAlt(contact)} className="w-full h-full object-cover" style={contact.design.photoTreated ? { filter: "sepia(0.3) saturate(0.85) contrast(0.95)" } : undefined} />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-semibold text-lg" style={{ color: p.inkSoft }}>
          {initials || "?"}
        </div>
      )}
    </div>
  );
}

type Row = { key: string; icon: React.ReactNode; label: string; detail: string; href: string; external: boolean };

const CARD_ROWS = 4; // link buttons shown on the compact card (plus Email/Call)

function LinkButton({ row, p, tabIndex }: { row: Row; p: CardPalette; tabIndex: number }) {
  return (
    <a
      href={row.href}
      tabIndex={tabIndex}
      {...(row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="card-focus flex items-center gap-3 md:gap-2 h-12 md:h-10 px-3 rounded-lg border-2 border-[#1f1a17] bg-white/70 hover:bg-white text-base md:text-sm font-medium shadow-[2px_2px_0_#1f1a17] hover:-translate-y-px transition"
      style={{ color: p.ink }}
    >
      <span className="w-5 h-5 md:w-4 md:h-4 shrink-0 [&>svg]:w-full [&>svg]:h-full" style={{ color: p.accent }}>{row.icon}</span>
      <span className="truncate">{row.label}</span>
    </a>
  );
}

// Every link in one list, opened from the card when there are too many to show.
function LinksDialog({ rows, name, p, dialogRef }: { rows: Row[]; name: string; p: CardPalette; dialogRef: React.RefObject<HTMLDialogElement> }) {
  return (
    <dialog
      ref={dialogRef}
      aria-label={`All links for ${name}`}
      className="w-[min(92vw,26rem)] max-h-[80vh] rounded-xl border-2 border-[#1f1a17] p-0 shadow-[6px_6px_0_#1f1a17] backdrop:bg-black/50"
      style={{ background: p.paper, color: p.ink }}
      onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#1f1a17]">
        <h3 className="font-semibold">
          {name} · {rows.length} links
        </h3>
        <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close" className="card-focus p-1 rounded-md hover:bg-black/10">
          <X className="w-4 h-4" />
        </button>
      </div>
      <ul className="max-h-[60vh] overflow-y-auto p-3 flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.key}>
            <a
              href={r.href}
              {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="card-focus flex items-center gap-3 px-3 py-2 rounded-lg border-2 border-[#1f1a17] bg-white/70 hover:bg-white shadow-[2px_2px_0_#1f1a17]"
              style={{ color: p.ink }}
            >
              <span className="w-5 h-5 shrink-0 [&>svg]:w-full [&>svg]:h-full" style={{ color: p.accent }}>{r.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate">{r.label}</span>
                <span className="block text-xs truncate" style={{ color: p.inkSoft }}>{r.detail}</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" style={{ color: p.inkSoft }} />
            </a>
          </li>
        ))}
      </ul>
    </dialog>
  );
}

export interface GuestCardProps {
  contact: PublicContact;
  /** Controls whether the card's links are tabbable (inactive rolodex cards are not). */
  active?: boolean;
  /** Full page: list every link on the card instead of the compact set. */
  showAll?: boolean;
  className?: string;
}

// One card: who they are, the links that matter, and a Save Contact button.
export default function GuestCard({ contact, active = true, showAll = false, className = "" }: GuestCardProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const d = contact.design;
  const p = paletteFor(d);
  const tab = active ? 0 : -1;
  const name = fullName(contact) || "Unnamed";
  const subtitle = [contact.title, contact.orgs.join(", ")].filter(Boolean).join(" · ");

  const contactRows: Row[] = [];
  if (contact.email) contactRows.push({ key: "email", icon: <Mail />, label: "Email", detail: contact.email, href: `mailto:${contact.email}`, external: false });
  if (contact.phone) contactRows.push({ key: "phone", icon: <Phone />, label: "Call", detail: contact.phone, href: `tel:${contact.phone}`, external: false });
  const linkRows: Row[] = contact.links.map((l) => ({
    key: l.id,
    icon: <LinkIcon kind={l.kind} />,
    label: l.label || l.url.replace(/^https?:\/\//, ""),
    detail: l.url.replace(/^https?:\/\//, ""),
    href: l.url,
    external: true,
  }));
  const shownLinks = showAll ? linkRows : linkRows.slice(0, CARD_ROWS);
  const hidden = linkRows.length - shownLinks.length;

  return (
    <article
      aria-label={name}
      aria-hidden={!active}
      className={`relative ${STYLE_SHAPE[d.style]} border-2 border-[#1f1a17] flex flex-col gap-3 p-5 ${d.style === "luggage" ? "pl-9" : ""} ${className}`}
      style={{ background: p.paper, color: p.ink, boxShadow: "6px 6px 0 #1f1a17" }}
    >
      <Decor design={d} p={p} />

      {contact.slug && (
        <div className="absolute top-3 right-3 flex items-center gap-1">
          {!showAll && (
            <Link href={`/${contact.slug}`} tabIndex={tab} aria-label={`Open ${name}'s page`} className="card-focus p-1 rounded-md hover:bg-black/10" style={{ color: p.inkSoft }}>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          )}
          <Link href={`/admin/edit/${contact.slug}`} tabIndex={tab} aria-label={`Edit ${name}`} className="card-focus p-1 rounded-md hover:bg-black/10" style={{ color: p.inkSoft }}>
            <Pencil className="w-4 h-4" />
          </Link>
        </div>
      )}

      <div className="flex items-center gap-3 md:gap-4 pr-12 md:pr-16">
        <Photo contact={contact} p={p} />
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-semibold leading-tight break-words md:truncate">{name}</h2>
          {subtitle && (
            <p className="text-sm leading-snug line-clamp-2" style={{ color: p.inkSoft }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {d.note && <p className="font-hand text-xl leading-tight -mt-1">{d.note}</p>}

      {contactRows.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {contactRows.map((r) => (
            <LinkButton key={r.key} row={r} p={p} tabIndex={tab} />
          ))}
        </div>
      )}

      {shownLinks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {shownLinks.map((r) => (
            <LinkButton key={r.key} row={r} p={p} tabIndex={tab} />
          ))}
        </div>
      )}

      {hidden > 0 && (
        <button
          type="button"
          tabIndex={tab}
          onClick={() => dialogRef.current?.showModal()}
          className="card-focus self-start text-base md:text-sm font-medium underline underline-offset-4 decoration-2 hover:opacity-80"
          style={{ color: p.ink, textDecorationColor: p.accent }}
        >
          All {linkRows.length} links
        </button>
      )}

      {contact.slug && (
        <a
          href={`/${contact.slug}/vcard.vcf`}
          download={vcardFileName({ ...contact, photo: null })}
          tabIndex={tab}
          className="card-focus mt-auto flex items-center justify-center gap-2 h-12 md:h-11 text-base rounded-lg border-2 border-[#1f1a17] font-semibold shadow-[3px_3px_0_#1f1a17] hover:-translate-y-px transition"
          style={{ background: p.accent, color: p.onAccent }}
        >
          <Download className="w-4 h-4" /> Save contact
        </a>
      )}

      {hidden > 0 && <LinksDialog rows={linkRows} name={name} p={p} dialogRef={dialogRef} />}
    </article>
  );
}
