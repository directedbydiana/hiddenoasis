export const LINK_KINDS = [
  "website",
  "github",
  "linkedin",
  "twitter",
  "instagram",
  "youtube",
  "facebook",
  "other",
] as const;

export type LinkKind = (typeof LINK_KINDS)[number];

export interface ContactLink {
  id: string;
  kind: LinkKind;
  label: string;
  url: string;
}

export interface ContactPhoto {
  mime: "image/jpeg" | "image/png";
  base64: string;
}

// ---------------------------------------------------------------------------
// Card design. Each accent has a light-mode and a dark-mode value so the
// banner and Save button stay readable on either background.

export const ACCENTS = {
  blue: { label: "Blue", light: "#0a66c2", dark: "#70b5f9" },
  teal: { label: "Teal", light: "#0e7c86", dark: "#5fd3dd" },
  green: { label: "Green", light: "#1b7f3b", dark: "#6fd38a" },
  purple: { label: "Purple", light: "#6b3fd1", dark: "#b59cff" },
  rose: { label: "Rose", light: "#c0315c", dark: "#f58fb0" },
  orange: { label: "Orange", light: "#c2410c", dark: "#fb923c" },
  slate: { label: "Slate", light: "#475569", dark: "#a3b1c6" },
  black: { label: "Black", light: "#191919", dark: "#e9edf0" },
} as const;
export type AccentId = keyof typeof ACCENTS;
export const ACCENT_IDS = Object.keys(ACCENTS) as AccentId[];
const DEFAULT_ACCENT: AccentId = "blue";

// Accent ids from the first version of the site, mapped to the current set.
const LEGACY_ACCENTS: Record<string, AccentId> = {
  red: "rose",
  navy: "blue",
  forest: "green",
  mustard: "orange",
  terracotta: "orange",
};

export function coerceAccent(v: unknown, fallback: AccentId = DEFAULT_ACCENT): AccentId {
  if (typeof v !== "string") return fallback;
  if (v in ACCENTS) return v as AccentId;
  return LEGACY_ACCENTS[v] ?? fallback;
}

export const NOTE_MAX = 90;

export interface CardDesign {
  accent: AccentId;
  photoAlt: string;
  /** One short line shown under the title. */
  note: string;
}

export const DEFAULT_DESIGN: CardDesign = {
  accent: DEFAULT_ACCENT,
  photoAlt: "",
  note: "",
};

// ---------------------------------------------------------------------------

export interface Contact {
  slug: string;
  firstName: string;
  lastName: string;
  title: string;
  orgs: string[];
  email: string;
  phone: string;
  links: ContactLink[];
  photo: ContactPhoto | null;
  design: CardDesign;
  updatedAt: string;
}

// What the browser receives: same as Contact but the photo is a URL (or a
// data URL for unsaved previews) instead of inline base64.
export interface PublicContact extends Omit<Contact, "photo"> {
  photoUrl: string | null;
}

export function toPublic(c: Contact): PublicContact {
  const { photo, ...rest } = c;
  return { ...rest, photoUrl: photo ? `/${c.slug}/photo` : null };
}

export function toPreview(c: Contact): PublicContact {
  const { photo, ...rest } = c;
  return {
    ...rest,
    photoUrl: photo ? `data:${photo.mime};base64,${photo.base64}` : null,
  };
}

export function fullName(c: Pick<Contact, "firstName" | "lastName">) {
  return [c.firstName, c.lastName].filter(Boolean).join(" ");
}

export function photoAlt(c: Pick<Contact, "firstName" | "lastName" | "design">) {
  return c.design.photoAlt || (fullName(c) ? `Photo of ${fullName(c)}` : "Contact photo");
}

export function emptyContact(): Contact {
  return {
    slug: "",
    firstName: "",
    lastName: "",
    title: "",
    orgs: [],
    email: "",
    phone: "",
    links: [],
    photo: null,
    design: { ...DEFAULT_DESIGN },
    updatedAt: new Date().toISOString(),
  };
}
