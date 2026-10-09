import Lobby from "@/components/Lobby";
import { listContacts } from "@/lib/store";
import { toPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const contacts = (await listContacts()).map(toPublic);
  return (
    <main>
      <Lobby contacts={contacts} />
    </main>
  );
}
