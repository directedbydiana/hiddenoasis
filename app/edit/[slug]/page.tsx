import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { hasAdminSession } from "@/lib/session";
import { getContact } from "@/lib/store";
import { fullName } from "@/lib/types";
import { page } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function EditContactPage({ params }: { params: { slug: string } }) {
  const [contact, isAdmin] = await Promise.all([getContact(params.slug), hasAdminSession()]);
  if (!contact) notFound();

  return (
    <main className={page}>
      <h1 className="text-2xl font-semibold">Edit {fullName(contact)}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Adjust the card and download the .vcf. Saving changes to the directory needs the admin password.
      </p>
      <ContactForm initial={contact} mode="edit" isAdmin={isAdmin} />
    </main>
  );
}
