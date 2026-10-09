import { getContact } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const contact = await getContact(params.slug);
  if (!contact?.photo) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(contact.photo.base64, "base64"), {
    headers: {
      "Content-Type": contact.photo.mime,
      "Cache-Control": "public, max-age=60",
    },
  });
}
