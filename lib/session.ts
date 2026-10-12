import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, verifySessionToken } from "./auth";

/** True when the current request carries a valid admin session cookie. */
export async function hasAdminSession() {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

export async function startAdminSession() {
  cookies().set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function endAdminSession() {
  cookies().delete(SESSION_COOKIE);
}
