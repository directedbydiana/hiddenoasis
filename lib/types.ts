import { contrast, AA_TEXT } from "./color";

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
// Card design: structured settings chosen from a small, pre-matched kit.

export const CARD_STYLES = ["plain", "keytag", "postcard", "luggage", "matchbook"] as const;
export type CardStyle = (typeof CARD_STYLES)[number];
export const CARD_STYLE_LABELS: Record<CardStyle, string> = {
  plain: "Plain card",
  keytag: "Key tag",
  postcard: "Postcard",
  luggage: "Luggage tag",
  matchbook: "Matchbook",
};

export const PAPERS = {
  cream: { label: "Cream", hex: "#f4ead6" },
  bone: { label: "Bone", hex: "#f1efe6" },
  sand: { label: "Sand", hex: "#e8d9b8" },
  butter: { label: "Butter", hex: "#f1e3a8" },
  sage: { label: "Sage", hex: "#d8dcc2" },
  teal: { label: "Teal", hex: "#c9dcd8" },
  sky: { label: "Sky", hex: "#cfdbe6" },
  rose: { label: "Rose", hex: "#e9c9c3" },
  terracotta: { label: "Terracotta", hex: "#e3b9a1" },
  lavender: { label: "Lavender", hex: "#dcd3e3" },
} as const;
export type PaperId = keyof typeof PAPERS;
export const PAPER_IDS = Object.keys(PAPERS) as PaperId[];

export const INKS = {
  black: { label: "Black", hex: "#1f1a17" },
  navy: { label: "Navy", hex: "#1f3b5c" },
  oxblood: { label: "Oxblood", hex: "#5a1f22" },
  forest: { label: "Forest", hex: "#244430" },
} as const;
export type InkId = keyof typeof INKS;
export const INK_IDS = Object.keys(INKS) as InkId[];

export const ACCENTS = {
  red: { label: "Red", hex: "#b5352b" },
  teal: { label: "Teal", hex: "#2d6e6a" },
  navy: { label: "Navy", hex: "#1f3b5c" },
  forest: { label: "Pine", hex: "#2f5a3c" },
  mustard: { label: "Mustard", hex: "#c89a2a" },
  terracotta: { label: "Terracotta", hex: "#c8714f" },
  rose: { label: "Rose", hex: "#c76b7a" },
  black: { label: "Black", hex: "#1f1a17" },
} as const;
export type AccentId = keyof typeof ACCENTS;
export const ACCENT_IDS = Object.keys(ACCENTS) as AccentId[];

export const NOTE_MAX = 90;

export interface CardDesign {
  style: CardStyle;
  paper: PaperId;
  ink: InkId;
  accent: AccentId;
  photoTreated: boolean;
  photoAlt: string;
  /** One short line shown under the title. */
  note: string;
}

export const DEFAULT_DESIGN: CardDesign = {
  style: "plain",
  paper: "cream",
  ink: "black",
  accent: "teal",
  photoTreated: true,
  photoAlt: "",
  note: "",
};

/** True when this ink reads at WCAG AA body-text contrast on this paper. */
export function inkPasses(ink: InkId, paper: PaperId) {
  return contrast(INKS[ink].hex, PAPERS[paper].hex) >= AA_TEXT;
}

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
