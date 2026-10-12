"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Download, ExternalLink, Mail, Pencil, Phone, X } from "lucide-react";
import LinkIcon from "./LinkIcon";
import { mix, readableOn } from "@/lib/color";
import { ACCENTS, fullName, photoAlt, type AccentId, type PublicContact } from "@/lib/types";
import { vcardFileName } from "@/lib/vcard";

/** CSS variables for an accent in both themes; `.accent-scope` picks the active one. */
export function accentVars(id: AccentId): React.CSSProperties {
  const a = ACCENTS[id];
  return {
    "--accent-l": a.light,
    "--accent-d": a.dark,
    "--accent-soft-l": mix(a.light, "#ffffff", 0.35),
    "--accent-soft-d": mix(a.dark, "#1b1f24", 0.35),
    "--on-accent-l": readableOn(a.light),
    "--on-accent-d": readableOn(a.dark),
  } as React.CSSProperties;
}

function Photo({ contact }: { contact: PublicContact }) {
  const initials = `${contact.firstName[0] ?? ""}${contact.lastName[0] ?? ""}`.toUpperCase();
  const cls = "h-[4.5rem] w-[4.5rem] shrink-0 rounded-full ring-4 ring-surface bg-soft object-cover";
  if (contact.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={contact.photoUrl} alt={photoAlt(contact)} className={cls} />;
  }
  return (
    <div className={`${cls} flex items-center justify-center text-xl font-semibold text-muted`} aria-hidden>
      {initials || "?"}
    </div>
  );
}

type Row = { key: string; icon: React.ReactNode; label: string; detail: string; href: string; external: boolean };

const CARD_ROWS = 4; // link buttons shown on the compact card (plus Email/Call)

const pill =
  "focus-ring flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-soft";

function LinkButton({ row, tabIndex }: { row: Row; tabIndex: number }) {
  return (
    <a href={row.href} tabIndex={tabIndex} title={row.detail} {...(row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={pill}>
      <span className="h-4 w-4 shrink-0 text-[var(--accent)] [&>svg]:h-full [&>svg]:w-full">{row.icon}</span>
      <span className="truncate">{row.label}</span>
    </a>
  );
}

// Every link in one list, opened from the card when there are too many to show.
function LinksDialog({ rows, name, dialogRef }: { rows: Row[]; name: string; dialogRef: React.RefObject<HTMLDialogElement> }) {
  return (
    <dialog
      ref={dialogRef}
      aria-label={`All links for ${name}`}
      className="w-[min(92vw,26rem)] max-h-[80vh] rounded-xl border border-line bg-surface p-0 text-ink shadow-card"
      onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="font-semibold">
          {name} · {rows.length} links
        </h3>
        <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close" className="focus-ring rounded-full p-1.5 text-muted hover:bg-soft hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-3">
        {rows.map((r) => (
          <li key={r.key}>
            <a href={r.href} {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="focus-ring flex items-center gap-3 rounded-lg border border-line px-3 py-2 hover:bg-soft">
              <span className="h-5 w-5 shrink-0 text-[var(--accent)] [&>svg]:h-full [&>svg]:w-full">{r.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{r.label}</span>
                <span className="block truncate text-xs text-muted">{r.detail}</span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" />
            </a>
          </li>
        ))}
      </ul>
    </dialog>
  );
}

export interface GuestCardProps {
  contact: PublicContact;
  /** Full page: list every link on the card instead of the compact set. */
  showAll?: boolean;
  className?: string;
}

// One card: a banner in the contact's accent, who they are, the links that
// matter, and a Save Contact button.
export default function GuestCard({ contact, showAll = false, className = "" }: GuestCardProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const name = fullName(contact) || "Unnamed";
  const orgs = contact.orgs.join(" · ");

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
    <article aria-label={name} className={`accent-scope relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card ${className}`} style={accentVars(contact.design.accent)}>
      <div className="h-16 shrink-0" style={{ background: "linear-gradient(120deg, var(--accent), var(--accent-soft))" }} />

      {contact.slug && (
        <div className="absolute right-3 top-3 flex items-center gap-1">
          {!showAll && (
            <Link href={`/${contact.slug}`} aria-label={`Open ${name}'s page`} title="Open page" className="focus-ring rounded-full bg-black/15 p-1.5 text-[var(--on-accent)] hover:bg-black/30">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
          <Link href={`/edit/${contact.slug}`} aria-label={`Edit ${name}`} title="Edit" className="focus-ring rounded-full bg-black/15 p-1.5 text-[var(--on-accent)] hover:bg-black/30">
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 px-5 pb-5">
        <div className="-mt-9">
          <Photo contact={contact} />
        </div>

        <div className="-mt-1">
          <h2 className="text-xl font-semibold leading-tight">{name}</h2>
          {contact.title && <p className="mt-0.5 text-sm text-ink">{contact.title}</p>}
          {orgs && <p className="text-sm text-muted">{orgs}</p>}
          {contact.design.note && <p className="mt-1.5 text-sm italic text-muted">{contact.design.note}</p>}
        </div>

        {contactRows.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {contactRows.map((r) => (
              <LinkButton key={r.key} row={r} tabIndex={0} />
            ))}
          </div>
        )}

        {shownLinks.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {shownLinks.map((r) => (
              <LinkButton key={r.key} row={r} tabIndex={0} />
            ))}
          </div>
        )}

        {hidden > 0 && (
          <button type="button" onClick={() => dialogRef.current?.showModal()} className="focus-ring self-start rounded-md text-sm font-semibold text-primary hover:underline">
            Show all {linkRows.length} links
          </button>
        )}

        {contact.slug && (
          <a
            href={`/${contact.slug}/vcard.vcf`}
            download={vcardFileName({ ...contact, photo: null })}
            className="focus-ring mt-auto flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-sm font-semibold text-[var(--on-accent)] hover:opacity-90"
          >
            <Download className="h-4 w-4" /> Save contact
          </a>
        )}
      </div>

      {hidden > 0 && <LinksDialog rows={linkRows} name={name} dialogRef={dialogRef} />}
    </article>
  );
}
