"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { deleteContactAction, saveContactAction } from "@/app/admin/actions";
import GuestCard from "./GuestCard";
import { AndroidPreview, IosPreview } from "./PhonePreview";
import SouvenirShop from "./SouvenirShop";
import { Contact, ContactLink, CardDesign, LINK_KINDS, LinkKind, fullName, toPreview } from "@/lib/types";
import { buildVCard } from "@/lib/vcard";

const MAX_PHOTO_EDGE = 512;
const input = "rounded-md border border-black px-3 py-2 font-normal bg-white w-full";
const label = "flex flex-col gap-1 text-sm font-medium";

type FormState = Omit<Contact, "orgs"> & { orgsText: string };

function toState(c: Contact): FormState {
  const { orgs, ...rest } = c;
  return { ...rest, orgsText: orgs.join(", ") };
}

function toContact(s: FormState): Contact {
  const { orgsText, ...rest } = s;
  return { ...rest, orgs: orgsText.split(",").map((o) => o.trim()).filter(Boolean) };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Downscales an image file in the browser and returns it as JPEG base64,
// so vCards stay small enough for phones to import comfortably.
async function fileToPhoto(file: File): Promise<Contact["photo"]> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image."));
      el.src = url;
    });
    const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { mime: "image/jpeg", base64: canvas.toDataURL("image/jpeg", 0.85).split(",")[1] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Shortens the embedded photo so the preview stays readable.
function previewVCard(c: Contact) {
  return buildVCard(c).replace(/^(PHOTO[^:]*:)[\s\S]*?(?=\r\nREV:)/m, (_m, p) => `${p}<${c.photo?.base64.length ?? 0} base64 chars>`);
}

export default function ContactForm({ initial, mode }: { initial: Contact; mode: "new" | "edit" }) {
  const [state, setState] = useState<FormState>(() => toState(initial));
  const [history, setHistory] = useState<CardDesign[]>([]);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewTab, setPreviewTab] = useState<"ios" | "android" | "vcf">("ios");

  const contact = useMemo(() => toContact(state), [state]);
  const vcard = useMemo(() => previewVCard(contact), [contact]);
  const preview = useMemo(() => toPreview(contact), [contact]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function setDesign(next: CardDesign) {
    setHistory((h) => [...h.slice(-30), state.design]);
    set("design", next);
  }

  function undoDesign() {
    setHistory((h) => {
      const prev = h[h.length - 1];
      if (prev) set("design", prev);
      return h.slice(0, -1);
    });
  }

  function setName(key: "firstName" | "lastName", value: string) {
    setState((s) => {
      const next = { ...s, [key]: value };
      if (!slugTouched) next.slug = slugify(`${next.firstName}${next.lastName}`);
      return next;
    });
  }

  function updateLink(i: number, patch: Partial<ContactLink>) {
    set("links", state.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function moveLink(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= state.links.length) return;
    const links = [...state.links];
    [links[i], links[j]] = [links[j], links[i]];
    set("links", links);
  }

  function addLink() {
    set("links", [...state.links, { id: crypto.randomUUID(), kind: "website", label: "", url: "" }]);
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      set("photo", await fileToPhoto(file));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveContactAction(contact, mode === "edit" ? initial.slug : undefined);
      if (result?.error) setError(result.error);
    });
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deleteContactAction(initial.slug);
      if (result?.error) setError(result.error);
    });
  }

  const defaultAlt = fullName(contact) ? `Photo of ${fullName(contact)}` : "Contact photo";

  return (
    <form onSubmit={onSubmit} className="mt-6 w-full max-w-7xl grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
      <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-md border border-black shadow-md">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            First name
            <input className={input} value={state.firstName} onChange={(e) => setName("firstName", e.target.value)} />
          </label>
          <label className={label}>
            Last name
            <input className={input} value={state.lastName} onChange={(e) => setName("lastName", e.target.value)} />
          </label>
        </div>

        <label className={label}>
          Slug (page URL: /{state.slug || "…"})
          <input
            className={input}
            value={state.slug}
            pattern="[a-z0-9-]+"
            required
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value.toLowerCase());
            }}
          />
        </label>

        <label className={label}>
          Title
          <input className={input} placeholder="Software Engineer & Founder" value={state.title} onChange={(e) => set("title", e.target.value)} />
        </label>

        <label className={label}>
          Organizations (comma separated)
          <input className={input} value={state.orgsText} onChange={(e) => set("orgsText", e.target.value)} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Email
            <input className={input} type="email" value={state.email} onChange={(e) => set("email", e.target.value)} />
          </label>
          <label className={label}>
            Phone
            <input className={input} type="tel" placeholder="+1-801-555-0100" value={state.phone} onChange={(e) => set("phone", e.target.value)} />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Photo</span>
          <div className="flex items-center gap-4">
            {state.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={state.design.photoAlt || defaultAlt} className="w-20 h-20 rounded-full object-cover border border-black" src={`data:${state.photo.mime};base64,${state.photo.base64}`} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-200 border border-black" />
            )}
            <div className="flex flex-col gap-2 text-sm">
              <input type="file" accept="image/*" onChange={onPhoto} aria-label="Upload photo" />
              {state.photo && (
                <button type="button" className="self-start text-red-700 hover:underline" onClick={() => set("photo", null)}>
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Links</span>
            <button type="button" onClick={addLink} className="text-sm rounded-md border border-black px-2 py-1 bg-white">
              + Add link
            </button>
          </div>
          {state.links.length === 0 && <p className="text-sm text-neutral-600">No links yet.</p>}
          {state.links.map((l, i) => (
            <div key={l.id} className="grid gap-2 sm:grid-cols-[8rem_1fr_1fr_auto] items-center bg-white p-2 rounded-md border border-neutral-400">
              <select className={input} value={l.kind} aria-label="Link type" onChange={(e) => updateLink(i, { kind: e.target.value as LinkKind })}>
                {LINK_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input className={input} placeholder="Short label, e.g. GitHub" aria-label="Link label" value={l.label} onChange={(e) => updateLink(i, { label: e.target.value })} />
              <input className={input} placeholder="https://…" type="url" required aria-label="Link URL" value={l.url} onChange={(e) => updateLink(i, { url: e.target.value })} />
              <div className="flex gap-1 justify-end">
                <button type="button" title="Move up" aria-label="Move link up" onClick={() => moveLink(i, -1)} className="p-1">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button type="button" title="Move down" aria-label="Move link down" onClick={() => moveLink(i, 1)} className="p-1">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button type="button" title="Remove" aria-label="Remove link" onClick={() => set("links", state.links.filter((_, idx) => idx !== i))} className="p-1 text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <SouvenirShop design={state.design} defaultAlt={defaultAlt} hasPhoto={Boolean(state.photo)} canUndo={history.length > 0} onChange={setDesign} onUndo={undoDesign} />

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={pending} className="rounded-md bg-slate-800 text-white px-4 py-2 font-medium disabled:opacity-60">
            {pending ? "Saving…" : mode === "new" ? "Create contact" : "Save changes"}
          </button>
          {mode === "edit" && (
            <a href={`/${initial.slug}/vcard.vcf`} className="text-sm hover:underline" download>
              Download saved .vcf
            </a>
          )}
        </div>

        {mode === "edit" && (
          <div className="mt-4 border-t border-neutral-300 pt-4 text-sm">
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <span>Delete this contact permanently?</span>
                <button type="button" disabled={pending} onClick={onDelete} className="rounded-md bg-red-700 text-white px-3 py-1">
                  Yes, delete
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="hover:underline">
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="text-red-700 hover:underline">
                Delete contact
              </button>
            )}
          </div>
        )}
      </div>

      {/* live card previews, front and back */}
      <div className="flex flex-col gap-5 min-w-0">
        <div className="rounded-md border-2 border-[#1f1a17] bg-[#e4dcc3] p-5 pt-6 pr-7 flex flex-col gap-4 shadow-[6px_6px_0_#1f1a17]">
          <span className="text-sm font-medium">Card preview</span>
          <GuestCard contact={preview} className="w-full max-w-md mx-auto min-h-[23rem]" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">After &ldquo;Save&rdquo; on their phone</span>
          <div className="flex gap-1 text-sm" role="tablist">
            {(
              [
                ["ios", "iPhone"],
                ["android", "Android"],
                ["vcf", "Raw vCard"],
              ] as const
            ).map(([key, title]) => (
              <button key={key} type="button" role="tab" aria-selected={previewTab === key} onClick={() => setPreviewTab(key)} className={`px-3 py-1 rounded-md border border-black ${previewTab === key ? "bg-slate-800 text-white" : "bg-white"}`}>
                {title}
              </button>
            ))}
          </div>
          {previewTab === "ios" && (
            <>
              <IosPreview contact={preview} />
              <p className="text-xs text-neutral-600">Safari opens this sheet right away. iPhone keeps your link labels, shows the phone as &ldquo;mobile&rdquo; and the email as &ldquo;work&rdquo;, and imports the photo.</p>
            </>
          )}
          {previewTab === "android" && (
            <>
              <AndroidPreview contact={preview} />
              <p className="text-xs text-neutral-600">Chrome saves the .vcf to Downloads; tapping it opens Contacts. Android&rsquo;s importer drops custom link labels and lists each link as &ldquo;Website&rdquo;, so make sure the URLs themselves are recognizable.</p>
            </>
          )}
          {previewTab === "vcf" && <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-md border border-black overflow-x-auto whitespace-pre-wrap break-all min-h-[12rem]">{vcard}</pre>}
        </div>
      </div>
    </form>
  );
}
