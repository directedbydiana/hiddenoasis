import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import seedData from "@/data/contacts.seed.json";
import { DEFAULT_DESIGN, type Contact } from "./types";

const BLOB_STORE = "hiddenoasis";
const BLOB_KEY = "contacts";
const FILE_PATH = path.join(process.cwd(), ".data", "contacts.json");

type Backend = "blobs" | "file";

// Netlify Blobs when running on Netlify (or when credentials are supplied),
// otherwise a gitignored JSON file for local development.
function backend(): Backend {
  const forced = process.env.CONTACTS_STORE;
  if (forced === "blobs" || forced === "file") return forced;
  if (process.env.NETLIFY_BLOBS_CONTEXT) return "blobs";
  if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_BLOBS_TOKEN) return "blobs";
  if (process.env.NETLIFY === "true") return "blobs";
  return "file";
}

async function blobStore() {
  const { getStore } = await import("@netlify/blobs");
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (siteID && token) return getStore({ name: BLOB_STORE, siteID, token });
  return getStore(BLOB_STORE);
}

// Fills in fields added after a record was stored (e.g. design).
function normalize(contacts: Contact[]): Contact[] {
  return contacts.map((c) => {
    const stored = ((c as Partial<Contact>).design ?? {}) as Partial<Contact["design"]> & { fobColor?: Contact["design"]["accent"] };
    return {
      ...c,
      links: c.links ?? [],
      orgs: c.orgs ?? [],
      design: {
        style: stored.style ?? DEFAULT_DESIGN.style,
        paper: stored.paper ?? DEFAULT_DESIGN.paper,
        ink: stored.ink ?? DEFAULT_DESIGN.ink,
        accent: stored.accent ?? stored.fobColor ?? DEFAULT_DESIGN.accent,
        photoTreated: stored.photoTreated ?? DEFAULT_DESIGN.photoTreated,
        photoAlt: stored.photoAlt ?? "",
        note: stored.note ?? "",
      },
    };
  });
}

async function readAll(): Promise<Contact[]> {
  if (backend() === "blobs") {
    const store = await blobStore();
    const data = (await store.get(BLOB_KEY, { type: "json" })) as Contact[] | null;
    return normalize(data ?? (seedData as Contact[]));
  }
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return normalize(JSON.parse(raw) as Contact[]);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return normalize(seedData as Contact[]);
    throw err;
  }
}

async function writeAll(contacts: Contact[]) {
  if (backend() === "blobs") {
    const store = await blobStore();
    await store.setJSON(BLOB_KEY, contacts);
    return;
  }
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(contacts, null, 2));
}

function byName(a: Contact, b: Contact) {
  return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
}

export async function listContacts(): Promise<Contact[]> {
  return (await readAll()).sort(byName);
}

export async function getContact(slug: string): Promise<Contact | null> {
  return (await readAll()).find((c) => c.slug === slug) ?? null;
}

/** Inserts or replaces a contact. `previousSlug` handles slug renames. */
export async function saveContact(contact: Contact, previousSlug?: string) {
  const all = await readAll();
  const without = all.filter((c) => c.slug !== contact.slug && c.slug !== previousSlug);
  await writeAll([...without, contact]);
}

export async function deleteContact(slug: string) {
  const all = await readAll();
  await writeAll(all.filter((c) => c.slug !== slug));
}

export function storeDescription() {
  return backend() === "blobs"
    ? "Netlify Blobs"
    : `local file (${path.relative(process.cwd(), FILE_PATH)})`;
}
