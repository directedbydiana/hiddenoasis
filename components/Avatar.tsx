import type { Contact } from "@/lib/types";

const SIZES = {
  xs: "w-10 h-10 text-sm",
  sm: "w-12 h-12 text-base",
  lg: "w-28 h-28 text-3xl",
};

export default function Avatar({
  src,
  name,
  size = "sm",
  className = "",
}: {
  src: string | null;
  name: Pick<Contact, "firstName" | "lastName">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initials = `${name.firstName[0] ?? ""}${name.lastName[0] ?? ""}`.toUpperCase();
  const cls = `${SIZES[size]} rounded-full ring-1 ring-line object-cover shrink-0 bg-soft flex items-center justify-center font-semibold text-muted ${className}`;
  if (src) {
    // Photos are served from the contact store, not static assets, so next/image is not used.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={cls} src={src} alt="" />;
  }
  return <div className={cls}>{initials || "?"}</div>;
}
