import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import GuestCard from "@/components/GuestCard";
import { getContact } from "@/lib/store";
import { fullName, toPublic } from "@/lib/types";
import { page } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const contact = await getContact(params.slug);
  if (!contact) return { title: "Not found · ShadedOasis" };
  return {
    title: `${fullName(contact)} · ShadedOasis`,
    description: contact.title || undefined,
  };
}

export default async function ContactPage({ params }: Props) {
  const contact = await getContact(params.slug);
  if (!contact) notFound();

  return (
    <main className={`${page} flex flex-col items-center`}>
      <Link href="/" className="focus-ring mb-6 inline-flex items-center gap-1 self-start rounded-md text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Directory
      </Link>
      <GuestCard contact={toPublic(contact)} showAll className="w-full max-w-xl" />
    </main>
  );
}
