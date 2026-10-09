import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import Avatar from "@/components/Avatar";
import { listContacts, storeDescription } from "@/lib/store";
import { fullName } from "@/lib/types";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const contacts = await listContacts();

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-700 hover:underline">
          ← Rolodex
        </Link>
        <form action={logoutAction}>
          <button className="text-sm text-neutral-700 hover:underline">Sign out</button>
        </form>
      </div>

      <div className="mt-8 w-full max-w-3xl flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Manage contacts</h1>
          <p className="text-xs text-neutral-600">Stored in {storeDescription()}.</p>
        </div>
        <Link
          href="/admin/new"
          className="inline-flex items-center gap-1 rounded-md bg-slate-800 text-white px-3 py-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New contact
        </Link>
      </div>

      <ul className="mt-6 w-full max-w-3xl flex flex-col gap-3">
        {contacts.length === 0 && <li className="text-neutral-600">No contacts yet.</li>}
        {contacts.map((c) => (
          <li
            key={c.slug}
            className="flex items-center gap-4 bg-slate-50 p-3 rounded-md border border-black shadow-md"
          >
            <Avatar src={c.photo ? `/${c.slug}/photo` : null} name={c} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{fullName(c)}</div>
              <div className="text-sm text-neutral-700 truncate">
                /{c.slug}
                {c.title ? ` · ${c.title}` : ""}
              </div>
              <div className="text-xs text-neutral-500">
                {c.links.length} link{c.links.length === 1 ? "" : "s"} · updated{" "}
                {new Date(c.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <Link href={`/${c.slug}`} className="text-sm hover:underline">
              View
            </Link>
            <Link
              href={`/admin/edit/${c.slug}`}
              className="inline-flex items-center gap-1 text-sm rounded-md border border-black px-2 py-1 bg-white"
            >
              <Pencil className="w-4 h-4" /> Edit
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
