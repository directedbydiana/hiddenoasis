import Directory from "@/components/Directory";
import { listContacts } from "@/lib/store";
import { toPublic } from "@/lib/types";
import { page } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const contacts = (await listContacts()).map(toPublic);
  return (
    <main className={page}>
      <Directory contacts={contacts} />
    </main>
  );
}
