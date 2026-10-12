// Shared class strings so forms and buttons look the same on every page.
// 16px inputs keep iOS from zooming; 44px targets are comfortable to tap.

export const input =
  "focus-ring w-full min-h-[44px] rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink placeholder:text-muted disabled:opacity-50";
export const label = "flex flex-col gap-1.5 text-sm font-medium text-ink";
export const hint = "text-xs font-normal text-muted";

const btn =
  "focus-ring inline-flex items-center justify-center gap-2 min-h-[44px] rounded-full px-4 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none";
export const btnPrimary = `${btn} bg-primary text-primary-fg hover:bg-primary-hover`;
export const btnSecondary = `${btn} border border-line bg-surface text-ink hover:bg-soft`;
export const btnGhost = `${btn} text-primary hover:bg-soft`;
export const btnDanger = `${btn} border border-danger text-danger hover:bg-danger-soft`;
export const iconBtn = "focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-ink";

export const card = "rounded-xl border border-line bg-surface shadow-card";
export const page = "mx-auto w-full max-w-6xl px-4 py-8";
