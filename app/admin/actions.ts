"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminConfigured, passwordMatches } from "@/lib/auth";
import { endAdminSession, hasAdminSession, startAdminSession } from "@/lib/session";
import { deleteContact, saveContact } from "@/lib/store";
import { parseContact } from "@/lib/validate";

export type ActionResult = { error: string; needsPassword?: boolean } | undefined;

function safeNext(next: string | undefined) {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

// A save is allowed with an existing session, or with the admin password
// sent along with the form (which also starts a session for later saves).
async function authorize(password?: string): Promise<ActionResult> {
  if (await hasAdminSession()) return undefined;
  if (!adminConfigured()) {
    return { error: "Saving is disabled: ADMIN_PASSWORD and AUTH_SECRET are not set on the server." };
  }
  if (password === undefined) return { error: "Enter the admin password to save.", needsPassword: true };
  if (!(await passwordMatches(password))) return { error: "Incorrect password.", needsPassword: true };
  await startAdminSession();
  return undefined;
}

export async function loginAction(password: string, next?: string): Promise<ActionResult> {
  if (!adminConfigured()) {
    return { error: "Admin is not configured. Set ADMIN_PASSWORD and AUTH_SECRET." };
  }
  if (!(await passwordMatches(password))) return { error: "Incorrect password." };
  await startAdminSession();
  redirect(safeNext(next));
}

export async function logoutAction() {
  endAdminSession();
  redirect("/");
}

export async function saveContactAction(
  payload: unknown,
  previousSlug?: string,
  password?: string
): Promise<ActionResult> {
  const parsed = parseContact(payload);
  if (!parsed.contact) return { error: parsed.error };

  const denied = await authorize(password);
  if (denied) return denied;

  try {
    await saveContact(parsed.contact, previousSlug || undefined);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save." };
  }
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/${parsed.contact.slug}`);
  if (previousSlug) revalidatePath(`/${previousSlug}`);
  redirect(`/${parsed.contact.slug}`);
}

export async function deleteContactAction(slug: string): Promise<ActionResult> {
  if (!(await hasAdminSession())) return { error: "Sign in to delete contacts." };
  try {
    await deleteContact(slug);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not delete." };
  }
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/${slug}`);
  redirect("/admin");
}
