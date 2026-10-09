import { getContact } from "@/lib/store";
import { buildVCard, vcardFileName } from "@/lib/vcard";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const contact = await getContact(params.slug);
  if (!contact) return new Response("Not found", { status: 404 });

  return new Response(buildVCard(contact), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${vcardFileName(contact)}"`,
      "Cache-Control": "no-store",
    },
  });
}
