import { storageDiagnostics } from "@/lib/store";

export const dynamic = "force-dynamic";

// Non-secret storage diagnostics: which backend is active, whether the
// Netlify Blobs context is present, and whether a timed read succeeds.
export async function GET() {
  const info = await storageDiagnostics();
  return Response.json(info, { headers: { "Cache-Control": "no-store" } });
}
