import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import Avatar from "@/components/Avatar";
import { listContacts, storeDescription } from "@/lib/store";
import { fullName } from "@/lib/types";
import { btnPrimary, btnSecondary, card, page } from "@/lib/ui";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const contacts = await listContacts();

  return (
    <main className={page}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Manage contacts</h1>
          <p className="mt-1 text-sm text-muted">Stored in {storeDescription()}.</p>
        </div>
        <div className="flex items-center gap-2">
          <form action={logoutAction}>
            <button className={btnSecondary}>Sign out</button>
          </form>
          <Link href="/new" className={btnPrimary}>
            <Plus className="h-4 w-4" /> New contact
          </Link>
        </div>
      </div>

      <ul className={`${card} mt-6 divide-y divide-line`}>
        {contacts.length === 0 && <li className="p-6 text-sm text-muted">No contacts yet.</li>}
        {contacts.map((c) => (
          <li key={c.slug} className="flex flex-wrap items-center gap-3 p-3 sm:gap-4 sm:px-4">
            <Avatar src={c.photo ? `/${c.slug}/photo` : null} name={c} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{fullName(c)}</div>
              <div className="truncate text-sm text-muted">
                /{c.slug}
                {c.title ? ` · ${c.title}` : ""}
              </div>
              <div className="text-xs text-muted">
                {c.links.length} link{c.links.length === 1 ? "" : "s"} · updated {new Date(c.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <Link href={`/${c.slug}`} className="focus-ring inline-flex min-h-[44px] items-center gap-1 rounded-full px-3 text-sm font-medium text-muted hover:bg-soft hover:text-ink">
              <ExternalLink className="h-4 w-4" /> View
            </Link>
            <Link href={`/edit/${c.slug}`} className={btnSecondary}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
