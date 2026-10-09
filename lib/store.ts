import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import seedData from "@/data/contacts.seed.json";
import { DEFAULT_DESIGN, type Contact } from "./types";

const BLOB_STORE = "hiddenoasis";
const BLOB_KEY = "contacts";
const FILE_PATH = path.join(process.cwd(), ".data", "contacts.json");
const READ_TIMEOUT_MS = 6000;
const WRITE_TIMEOUT_MS = 10000;

type Backend = "blobs" | "file";

// Last storage failure, shown on the admin page so a broken backend is visible.
let lastError: string | null = null;

// Netlify Blobs when running on Netlify (or when credentials are supplied),
// otherwise a gitignored JSON file for local development.
export function backend(): Backend {
  const forced = process.env.CONTACTS_STORE;
  if (forced === "blobs" || forced === "file") return forced;
  if (process.env.NETLIFY_BLOBS_CONTEXT) return "blobs";
  if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_BLOBS_TOKEN) return "blobs";
  if (process.env.NETLIFY === "true") return "blobs";
  return "file";
}

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

async function blobStore() {
  const { getStore } = await import("@netlify/blobs");
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (siteID && token) return getStore({ name: BLOB_STORE, siteID, token, consistency: "strong" });
  return getStore({ name: BLOB_STORE, consistency: "strong" });
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

function describe(err: unknown) {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

async function readAll(): Promise<Contact[]> {
  if (backend() === "blobs") {
    try {
      const store = await blobStore();
      const data = (await withTimeout(store.get(BLOB_KEY, { type: "json" }), READ_TIMEOUT_MS, "Netlify Blobs read")) as Contact[] | null;
      lastError = null;
      return normalize(data ?? (seedData as Contact[]));
    } catch (err) {
      // Never let storage take the site down: serve the committed seed.
      lastError = describe(err);
      console.error("[store] Netlify Blobs read failed, serving seed:", lastError);
      return normalize(seedData as Contact[]);
    }
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
    try {
      const store = await blobStore();
      await withTimeout(store.setJSON(BLOB_KEY, contacts), WRITE_TIMEOUT_MS, "Netlify Blobs write");
      lastError = null;
    } catch (err) {
      lastError = describe(err);
      console.error("[store] Netlify Blobs write failed:", lastError);
      throw new Error(`Could not save to Netlify Blobs (${lastError}).`);
    }
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
  const base = backend() === "blobs" ? "Netlify Blobs" : `local file (${path.relative(process.cwd(), FILE_PATH)})`;
  return lastError ? `${base} — unavailable, serving seed data (${lastError})` : base;
}

/** Non-secret facts about the storage backend, for the diagnostics endpoint. */
export async function storageDiagnostics() {
  const started = Date.now();
  let probe = "skipped";
  if (backend() === "blobs") {
    try {
      const store = await blobStore();
      const data = (await withTimeout(store.get(BLOB_KEY, { type: "json" }), READ_TIMEOUT_MS, "Netlify Blobs read")) as Contact[] | null;
      probe = data ? `ok, ${data.length} contact(s) stored` : "ok, store empty (seed in use)";
    } catch (err) {
      probe = `failed: ${describe(err)}`;
    }
  }
  return {
    backend: backend(),
    env: {
      NETLIFY: process.env.NETLIFY ?? null,
      hasBlobsContext: Boolean(process.env.NETLIFY_BLOBS_CONTEXT),
      hasSiteId: Boolean(process.env.NETLIFY_SITE_ID),
      hasBlobsToken: Boolean(process.env.NETLIFY_BLOBS_TOKEN),
      contactsStore: process.env.CONTACTS_STORE ?? null,
      node: process.version,
    },
    probe,
    ms: Date.now() - started,
  };
}
