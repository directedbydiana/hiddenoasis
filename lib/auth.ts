// Session helpers built on Web Crypto so they run in both the Node runtime
// (server actions) and the Edge runtime (middleware).

export const SESSION_COOKIE = "hiddenoasis_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  arr.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string) {
  const padded =
    s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function secret() {
  return process.env.AUTH_SECRET ?? "";
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && secret().length >= 16);
}

/** Constant-time comparison of two strings via HMAC digests. */
export async function passwordMatches(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !adminConfigured()) return false;
  const key = await hmacKey(secret());
  const a = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(candidate)));
  const b = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(expected)));
  let diff = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function createSessionToken() {
  const payload = JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  const body = b64url(enc.encode(payload));
  const key = await hmacKey(secret());
  const sig = b64url(await crypto.subtle.sign("HMAC", key, enc.encode(body)));
  return `${body}.${sig}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token || !adminConfigured()) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  try {
    const key = await hmacKey(secret());
    const ok = await crypto.subtle.verify("HMAC", key, fromB64url(sig), enc.encode(body));
    if (!ok) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(fromB64url(body))) as {
      exp: number;
    };
    return typeof exp === "number" && exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
