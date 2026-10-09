import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { emptyContact } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function NewContactPage() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16">
      <Link href="/admin" className="self-start text-sm text-neutral-700 hover:underline">
        ← Manage contacts
      </Link>
      <h1 className="mt-8 text-3xl font-semibold">New contact</h1>
      <ContactForm initial={emptyContact()} mode="new" />
    </main>
  );
}
