import { Contact, fullName } from "./types";

// Escapes a value for a vCard 3.0 property (RFC 2426).
function esc(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// vCard lines are folded at 75 characters; continuation lines start with a space.
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    out.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function buildVCard(c: Contact): string {
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`N:${esc(c.lastName)};${esc(c.firstName)};;;`);
  lines.push(`FN:${esc(fullName(c))}`);
  if (c.title) lines.push(`TITLE:${esc(c.title)}`);
  if (c.orgs.length) lines.push(`ORG:${c.orgs.map(esc).join("\\, ")}`);
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET;TYPE=WORK:${esc(c.email)}`);
  if (c.phone) lines.push(`TEL;TYPE=CELL:${esc(c.phone)}`);
  c.links.forEach((link, i) => {
    const n = i + 1;
    lines.push(`item${n}.URL:${esc(link.url)}`);
    lines.push(`item${n}.X-ABLabel:${esc(link.label || link.kind)}`);
  });
  if (c.photo) {
    const type = c.photo.mime === "image/png" ? "PNG" : "JPEG";
    lines.push(`PHOTO;ENCODING=b;TYPE=${type}:${c.photo.base64}`);
  }
  lines.push(`REV:${c.updatedAt}`);
  lines.push("END:VCARD");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function vcardFileName(c: Contact) {
  const base = fullName(c).toLowerCase().replace(/[^a-z0-9]+/g, "_") || c.slug;
  return `${base}.vcf`;
}
