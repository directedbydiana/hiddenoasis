import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GuestCard from "@/components/GuestCard";
import { getContact } from "@/lib/store";
import { fullName, toPublic } from "@/lib/types";

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
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <Link href="/" className="self-start text-sm hover:underline">
        ← All cards
      </Link>
      <GuestCard contact={toPublic(contact)} showAll className="mt-10 w-full max-w-lg min-h-[23rem]" />
    </div>
  );
}
