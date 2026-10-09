"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  adminConfigured,
  createSessionToken,
  passwordMatches,
  verifySessionToken,
} from "@/lib/auth";
import { deleteContact, saveContact } from "@/lib/store";
import { parseContact } from "@/lib/validate";

export type ActionResult = { error: string } | undefined;

async function requireAdmin() {
  const ok = await verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!ok) redirect("/admin/login");
}

function safeNext(next: string | undefined) {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export async function loginAction(password: string, next?: string): Promise<ActionResult> {
  if (!adminConfigured()) {
    return { error: "Admin is not configured. Set ADMIN_PASSWORD and AUTH_SECRET." };
  }
  if (!(await passwordMatches(password))) return { error: "Incorrect password." };

  cookies().set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect(safeNext(next));
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE);
  redirect("/");
}

export async function saveContactAction(
  payload: unknown,
  previousSlug?: string
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parseContact(payload);
  if (!parsed.contact) return { error: parsed.error };

  try {
    await saveContact(parsed.contact, previousSlug || undefined);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save." };
  }
  revalidatePath("/");
  revalidatePath(`/${parsed.contact.slug}`);
  if (previousSlug) revalidatePath(`/${previousSlug}`);
  redirect("/admin");
}

export async function deleteContactAction(slug: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteContact(slug);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not delete." };
  }
  revalidatePath("/");
  revalidatePath(`/${slug}`);
  redirect("/admin");
}
