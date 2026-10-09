import type { Contact } from "@/lib/types";

const SIZES = {
  xs: "w-10 h-10 text-sm",
  sm: "w-14 h-14 text-lg",
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
  const cls = `${SIZES[size]} rounded-full border-2 border-[var(--accent,#000)] shadow-md object-cover shrink-0 bg-slate-200 flex items-center justify-center font-semibold text-slate-700 ${className}`;
  if (src) {
    // Photos are served from the contact store, not static assets, so next/image is not used.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={cls} src={src} alt="" />;
  }
  return <div className={cls}>{initials || "?"}</div>;
}
