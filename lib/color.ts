// Small color helpers for WCAG contrast checks and palette mixing.

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: [number, number, number]) {
  return "#" + [r, g, b].map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, "0")).join("");
}

export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Linear mix of two hex colors; t=0 → a, t=1 → b. */
export function mix(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex([ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]);
}

/** Returns `candidate` if it meets `min` contrast against `bg`, else `fallback`. */
export function ensureContrast(candidate: string, bg: string, min: number, fallback: string) {
  return contrast(candidate, bg) >= min ? candidate : fallback;
}

/** Dark or light text for a given background. */
export function readableOn(bg: string) {
  return luminance(bg) > 0.4 ? "#1f1a17" : "#f6efe3";
}

export const AA_TEXT = 4.5;
export const AA_LARGE = 3;
