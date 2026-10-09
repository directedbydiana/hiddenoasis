import {
  ACCENT_IDS,
  CARD_STYLES,
  CardDesign,
  Contact,
  ContactLink,
  DEFAULT_DESIGN,
  INK_IDS,
  LINK_KINDS,
  LinkKind,
  NOTE_MAX,
  PAPER_IDS,
  inkPasses,
} from "./types";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const RESERVED_SLUGS = new Set(["admin", "api", "_next", "favicon.ico", "new", "edit"]);
const MAX_PHOTO_BASE64 = 600_000; // ~450 KB of image data
const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

type Result = { contact: Contact; error?: undefined } | { contact?: undefined; error: string };

function str(v: unknown, max = 200) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function pick<T extends readonly string[]>(options: T, v: unknown, fallback: T[number]): T[number] {
  return typeof v === "string" && (options as readonly string[]).includes(v) ? v : fallback;
}

function parseLinks(raw: unknown): ContactLink[] | string {
  if (!Array.isArray(raw)) return [];
  if (raw.length > 20) return "Too many links (max 20).";
  const links: ContactLink[] = [];
  for (const item of raw) {
    const kind = str(item?.kind) as LinkKind;
    const url = str(item?.url, 500);
    const label = str(item?.label, 120);
    if (!LINK_KINDS.includes(kind)) return `Unknown link type "${kind}".`;
    if (!/^https?:\/\/\S+$/i.test(url)) return `Link URL must start with http:// or https://: "${url}"`;
    links.push({ id: str(item?.id, 40) || crypto.randomUUID(), kind, label, url });
  }
  return links;
}

export function parseDesign(raw: unknown): CardDesign {
  const d = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const paper = pick(PAPER_IDS, d.paper, DEFAULT_DESIGN.paper);
  let ink = pick(INK_IDS, d.ink, DEFAULT_DESIGN.ink);
  // Guardrail: only AA-passing ink/paper pairs are stored.
  if (!inkPasses(ink, paper)) ink = INK_IDS.find((i) => inkPasses(i, paper)) ?? "black";

  return {
    style: pick(CARD_STYLES, d.style, DEFAULT_DESIGN.style),
    paper,
    ink,
    accent: pick(ACCENT_IDS, d.accent ?? d.fobColor, DEFAULT_DESIGN.accent),
    photoTreated: d.photoTreated !== false,
    photoAlt: str(d.photoAlt, 120),
    note: str(d.note, NOTE_MAX),
  };
}

export function parseContact(raw: unknown): Result {
  if (!raw || typeof raw !== "object") return { error: "Invalid payload." };
  const r = raw as Record<string, unknown>;

  const slug = str(r.slug, 40).toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return { error: "Slug must be 1–40 lowercase letters, numbers, or hyphens." };
  }
  if (RESERVED_SLUGS.has(slug)) return { error: `"${slug}" is a reserved slug.` };

  const firstName = str(r.firstName, 80);
  const lastName = str(r.lastName, 80);
  if (!firstName && !lastName) return { error: "A first or last name is required." };

  const email = str(r.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email looks invalid." };

  const phone = str(r.phone, 40);
  if (phone && !/^[+\d][\d\s().-]{4,}$/.test(phone)) return { error: "Phone looks invalid." };

  const orgs = Array.isArray(r.orgs)
    ? r.orgs.map((o) => str(o, 120)).filter(Boolean).slice(0, 10)
    : [];

  const links = parseLinks(r.links);
  if (typeof links === "string") return { error: links };

  let photo: Contact["photo"] = null;
  if (r.photo && typeof r.photo === "object") {
    const p = r.photo as Record<string, unknown>;
    const mime = p.mime;
    const base64 = typeof p.base64 === "string" ? p.base64.replace(/\s+/g, "") : "";
    if (mime !== "image/jpeg" && mime !== "image/png") return { error: "Photo must be JPEG or PNG." };
    if (base64.length > MAX_PHOTO_BASE64) return { error: "Photo is too large (max ~450 KB)." };
    if (!B64_RE.test(base64)) return { error: "Photo data is not valid base64." };
    photo = { mime, base64 };
  }

  return {
    contact: {
      slug,
      firstName,
      lastName,
      title: str(r.title, 160),
      orgs,
      email,
      phone,
      links,
      photo,
      design: parseDesign(r.design),
      updatedAt: new Date().toISOString(),
    },
  };
}
