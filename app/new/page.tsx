import ContactForm from "@/components/ContactForm";
import { hasAdminSession } from "@/lib/session";
import { emptyContact } from "@/lib/types";
import { page } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function NewContactPage() {
  const isAdmin = await hasAdminSession();
  return (
    <main className={page}>
      <h1 className="text-2xl font-semibold">New card</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Fill in your details, preview the card, and download the .vcf to share. Adding it to the directory needs the admin password.
      </p>
      <ContactForm initial={emptyContact()} mode="new" isAdmin={isAdmin} />
    </main>
  );
}
