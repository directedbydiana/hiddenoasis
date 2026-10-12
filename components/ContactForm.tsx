"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Camera, Download, Lock, Trash2 } from "lucide-react";
import { deleteContactAction, saveContactAction } from "@/app/admin/actions";
import GuestCard from "./GuestCard";
import { AndroidPreview, IosPreview } from "./PhonePreview";
import { ACCENTS, ACCENT_IDS, Contact, ContactLink, CardDesign, LINK_KINDS, LinkKind, NOTE_MAX, fullName, toPreview } from "@/lib/types";
import { btnDanger, btnGhost, btnPrimary, btnSecondary, card, hint, input, label } from "@/lib/ui";
import { parseContact } from "@/lib/validate";
import { buildVCard, vcardFileName } from "@/lib/vcard";

const MAX_PHOTO_EDGE = 512;

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

// Builds the .vcf in the browser, so no save (or password) is needed to get one.
function downloadVCard(c: Contact) {
  const blob = new Blob([buildVCard(c)], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = vcardFileName(c);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-5 first:border-0 first:pt-0">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function ContactForm({ initial, mode, isAdmin }: { initial: Contact; mode: "new" | "edit"; isAdmin: boolean }) {
  const [state, setState] = useState<FormState>(() => toState(initial));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewTab, setPreviewTab] = useState<"ios" | "android" | "vcf">("ios");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const passwordDialog = useRef<HTMLDialogElement>(null);

  const contact = useMemo(() => toContact(state), [state]);
  const vcard = useMemo(() => previewVCard(contact), [contact]);
  const preview = useMemo(() => toPreview(contact), [contact]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function setDesign<K extends keyof CardDesign>(key: K, value: CardDesign[K]) {
    setState((s) => ({ ...s, design: { ...s.design, [key]: value } }));
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

  function onDownload() {
    setError(null);
    const parsed = parseContact(contact);
    if (!parsed.contact) return setError(parsed.error);
    downloadVCard(parsed.contact);
  }

  function save(pw?: string) {
    startTransition(async () => {
      const result = await saveContactAction(contact, mode === "edit" ? initial.slug : undefined, pw);
      if (!result?.error) return; // redirected
      if (result.needsPassword) {
        setPasswordError(pw === undefined ? null : result.error);
        passwordDialog.current?.showModal();
      } else {
        passwordDialog.current?.close();
        setError(result.error);
      }
    });
  }

  // Native validation has passed by now. Admins save straight away; everyone
  // else is asked for the password first.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (isAdmin) return save();
    setPasswordError(null);
    setPassword("");
    passwordDialog.current?.showModal();
  }

  function onPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save(password);
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deleteContactAction(initial.slug);
      if (result?.error) setError(result.error);
    });
  }

  const defaultAlt = fullName(contact) ? `Photo of ${fullName(contact)}` : "Contact photo";
  const saveLabel = mode === "new" ? "Add to directory" : "Save changes";

  const previews = (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Card preview</span>
        <GuestCard contact={preview} className="w-full" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">After &ldquo;Save contact&rdquo; on their phone</span>
        <div className="flex gap-1 text-sm" role="tablist">
          {(
            [
              ["ios", "iPhone"],
              ["android", "Android"],
              ["vcf", "Raw vCard"],
            ] as const
          ).map(([key, title]) => (
            <button key={key} type="button" role="tab" aria-selected={previewTab === key} onClick={() => setPreviewTab(key)} className={`focus-ring min-h-[40px] rounded-full px-3 text-sm font-medium ${previewTab === key ? "bg-primary text-primary-fg" : "text-muted hover:bg-soft hover:text-ink"}`}>
              {title}
            </button>
          ))}
        </div>
        {previewTab === "ios" && (
          <>
            <IosPreview contact={preview} />
            <p className={hint}>Safari opens this sheet right away. iPhone keeps your link labels, shows the phone as &ldquo;mobile&rdquo; and the email as &ldquo;work&rdquo;, and imports the photo.</p>
          </>
        )}
        {previewTab === "android" && (
          <>
            <AndroidPreview contact={preview} />
            <p className={hint}>Chrome saves the .vcf to Downloads; tapping it opens Contacts. Android&rsquo;s importer drops custom link labels and lists each link as &ldquo;Website&rdquo;, so make sure the URLs themselves are recognizable.</p>
          </>
        )}
        {previewTab === "vcf" && <pre className="min-h-[12rem] overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-line bg-soft p-4 text-xs text-ink">{vcard}</pre>}
      </div>
    </>
  );

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 grid w-full gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
        {/* Phones: preview folds away above the form so the fields come first. */}
        <details className={`${card} lg:hidden open:pb-4`}>
          <summary className="focus-ring min-h-[44px] cursor-pointer select-none rounded-xl px-4 py-3 font-medium">Preview</summary>
          <div className="flex flex-col gap-5 px-4">{previews}</div>
        </details>

        <div className={`${card} flex flex-col gap-5 p-4 sm:p-6`}>
          <Section title="Profile">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                First name
                <input className={input} autoComplete="given-name" value={state.firstName} onChange={(e) => setName("firstName", e.target.value)} />
              </label>
              <label className={label}>
                Last name
                <input className={input} autoComplete="family-name" value={state.lastName} onChange={(e) => setName("lastName", e.target.value)} />
              </label>
            </div>

            <label className={label}>
              Title
              <input className={input} autoComplete="organization-title" placeholder="Software Engineer & Founder" value={state.title} onChange={(e) => set("title", e.target.value)} />
            </label>

            <label className={label}>
              Organizations <span className={hint}>Comma separated</span>
              <input className={input} autoComplete="organization" value={state.orgsText} onChange={(e) => set("orgsText", e.target.value)} />
            </label>

            <label className={label}>
              Page URL <span className={hint}>shadedoasis/{state.slug || "…"}</span>
              <input
                className={input}
                value={state.slug}
                pattern="[a-z0-9-]+"
                required
                autoCapitalize="none"
                autoCorrect="off"
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase());
                }}
              />
            </label>
          </Section>

          <Section title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Email
                <input className={input} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={state.email} onChange={(e) => set("email", e.target.value)} />
              </label>
              <label className={label}>
                Phone
                <input className={input} type="tel" inputMode="tel" autoComplete="tel" placeholder="+1-801-555-0100" value={state.phone} onChange={(e) => set("phone", e.target.value)} />
              </label>
            </div>
          </Section>

          <Section title="Photo">
            <div className="flex items-center gap-4">
              {state.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={state.design.photoAlt || defaultAlt} className="h-20 w-20 rounded-full object-cover ring-1 ring-line" src={`data:${state.photo.mime};base64,${state.photo.base64}`} />
              ) : (
                <div className="h-20 w-20 rounded-full bg-soft ring-1 ring-line" />
              )}
              <div className="flex flex-col items-start gap-2">
                <label className={`${btnSecondary} cursor-pointer`}>
                  <Camera className="h-4 w-4" /> {state.photo ? "Change photo" : "Upload photo"}
                  <input type="file" accept="image/*" onChange={onPhoto} className="sr-only" aria-label="Upload photo" />
                </label>
                {state.photo && (
                  <button type="button" className="focus-ring min-h-[32px] rounded-md text-sm text-danger hover:underline" onClick={() => set("photo", null)}>
                    Remove photo
                  </button>
                )}
              </div>
            </div>
            <label className={label}>
              Photo alt text <span className={hint}>For screen readers; defaults to &ldquo;{defaultAlt}&rdquo;.</span>
              <input className={input} value={state.design.photoAlt} maxLength={120} placeholder={defaultAlt} onChange={(e) => setDesign("photoAlt", e.target.value)} disabled={!state.photo} />
            </label>
          </Section>

          <Section
            title="Links"
            action={
              <button type="button" onClick={addLink} className={btnGhost}>
                + Add link
              </button>
            }
          >
            {state.links.length === 0 && <p className="text-sm text-muted">No links yet. Add your LinkedIn, portfolio, or anything else.</p>}
            {state.links.map((l, i) => (
              <div key={l.id} className="grid grid-cols-2 items-center gap-2 rounded-lg border border-line bg-canvas p-2 sm:grid-cols-[8rem_1fr_1fr_auto]">
                <select className={input} value={l.kind} aria-label="Link type" onChange={(e) => updateLink(i, { kind: e.target.value as LinkKind })}>
                  {LINK_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <input className={input} placeholder="Label, e.g. GitHub" aria-label="Link label" value={l.label} onChange={(e) => updateLink(i, { label: e.target.value })} />
                <input className={`${input} col-span-2 sm:col-span-1`} placeholder="https://…" type="url" inputMode="url" autoCapitalize="none" required aria-label="Link URL" value={l.url} onChange={(e) => updateLink(i, { url: e.target.value })} />
                <div className="col-span-2 flex justify-end gap-1 sm:col-span-1">
                  <button type="button" title="Move up" aria-label="Move link up" onClick={() => moveLink(i, -1)} className="focus-ring rounded-full p-2.5 text-muted hover:bg-soft hover:text-ink">
                    <ArrowUp className="h-5 w-5" />
                  </button>
                  <button type="button" title="Move down" aria-label="Move link down" onClick={() => moveLink(i, 1)} className="focus-ring rounded-full p-2.5 text-muted hover:bg-soft hover:text-ink">
                    <ArrowDown className="h-5 w-5" />
                  </button>
                  <button type="button" title="Remove" aria-label="Remove link" onClick={() => set("links", state.links.filter((_, idx) => idx !== i))} className="focus-ring rounded-full p-2.5 text-danger hover:bg-danger-soft">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </Section>

          <Section title="Card style">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Accent color</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent color">
                {ACCENT_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={state.design.accent === id}
                    aria-label={ACCENTS[id].label}
                    title={ACCENTS[id].label}
                    onClick={() => setDesign("accent", id)}
                    className={`focus-ring h-10 w-10 rounded-full ring-offset-2 ring-offset-surface ${state.design.accent === id ? "ring-2 ring-ink" : "ring-1 ring-line"}`}
                    style={{ background: ACCENTS[id].light }}
                  />
                ))}
              </div>
              <span className={hint}>Used for the banner, link icons, and the Save button. Each color has a matching dark-mode shade.</span>
            </div>
            <label className={label}>
              Tagline{" "}
              <span className={hint}>
                One line under your title · {state.design.note.length}/{NOTE_MAX}
              </span>
              <input className={input} value={state.design.note} maxLength={NOTE_MAX} placeholder="Say hi at the next meetup." onChange={(e) => setDesign("note", e.target.value)} />
            </label>
          </Section>

          {error && (
            <p className="rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          {/* Actions stay reachable while scrolling a long form on a phone. */}
          <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-surface px-4 py-3 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
            <button type="button" onClick={onDownload} className={btnPrimary}>
              <Download className="h-4 w-4" /> Download .vcf
            </button>
            <button type="submit" disabled={pending} className={btnSecondary}>
              {isAdmin ? null : <Lock className="h-4 w-4" />}
              {pending ? "Saving…" : saveLabel}
            </button>
            {!isAdmin && <span className={`${hint} basis-full sm:basis-auto`}>Saving asks for the admin password.</span>}
          </div>

          {mode === "edit" && isAdmin && (
            <div className="border-t border-line pt-4 text-sm">
              {confirmDelete ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span>Delete this contact permanently?</span>
                  <button type="button" disabled={pending} onClick={onDelete} className={btnDanger}>
                    Yes, delete
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className={btnGhost}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="focus-ring min-h-[44px] rounded-md text-danger hover:underline">
                  Delete contact
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop: previews live beside the form. */}
        <div className="hidden min-w-0 flex-col gap-6 lg:flex">{previews}</div>
      </form>

      {/* Outside the main form so the two forms do not nest. */}
      <dialog ref={passwordDialog} className="w-[min(92vw,24rem)] rounded-xl border border-line bg-surface p-0 text-ink shadow-card" aria-labelledby="pw-title">
        <form onSubmit={onPasswordSubmit} className="flex flex-col gap-4 p-6">
          <div>
            <h2 id="pw-title" className="text-lg font-semibold">
              Admin password
            </h2>
            <p className="mt-1 text-sm text-muted">Saving to the shared directory needs the admin password. You can download the .vcf without it.</p>
          </div>
          <label className={label}>
            Password
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
          </label>
          {passwordError && (
            <p className="text-sm text-danger" role="alert">
              {passwordError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => passwordDialog.current?.close()} className={btnGhost}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={btnPrimary}>
              {pending ? "Saving…" : saveLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
