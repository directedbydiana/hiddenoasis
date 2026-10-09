import Link from "next/link";
import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { getContact } from "@/lib/store";
import { fullName } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditContactPage({ params }: { params: { slug: string } }) {
  const contact = await getContact(params.slug);
  if (!contact) notFound();

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16">
      <Link href="/admin" className="self-start text-sm text-neutral-700 hover:underline">
        ← Manage contacts
      </Link>
      <h1 className="mt-8 text-3xl font-semibold">Edit {fullName(contact)}</h1>
      <ContactForm initial={contact} mode="edit" />
    </main>
  );
}
