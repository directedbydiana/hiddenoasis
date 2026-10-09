import { contrast, mix } from "./color";

// Sky for the motel page, blended continuously through the day from the
// viewer's local clock. Cards never change; only the sky does.

export interface Palette {
  top: string;
  mid: string;
  bottom: string;
  glow: string; // bloom around the sun/moon and along the horizon
  glowOpacity: number;
  haze: string; // low drifting haze color
  hazeOpacity: number;
  stars: number; // 0..1
  clouds: number; // 0..1 soft cloud opacity
  flare: number; // 0..1 anamorphic streak
  moon: number; // 0..1 moon instead of sun
  neon: number; // 0..1 glow on the VACANCY sign
}

export interface SunState {
  altitude: number; // degrees above the horizon
  morning: boolean;
}

const RISE = 6.75;
const SET = 19.5;

/** Fixed-hours sun curve from local time. */
export function sunState(date: Date): SunState {
  const h = date.getHours() + date.getMinutes() / 60;
  const dayLen = SET - RISE;
  if (h >= RISE && h <= SET) {
    const f = (h - RISE) / dayLen;
    return { altitude: 62 * Math.sin(Math.PI * f), morning: f < 0.5 };
  }
  const since = h > SET ? h - SET : h + 24 - SET;
  const f = since / (24 - dayLen);
  return { altitude: -38 * Math.sin(Math.PI * f), morning: f >= 0.5 };
}

// Deep cosmic night, midnight-blue pre-dawn, cool clear day, purple twilight.
const NIGHT: Palette = { top: "#070b34", mid: "#141852", bottom: "#2b2f77", glow: "#8fa3ff", glowOpacity: 0.35, haze: "#2b2f77", hazeOpacity: 0.5, stars: 1, clouds: 0.12, flare: 0, moon: 1, neon: 1 };
const PREDAWN: Palette = { top: "#141e30", mid: "#1d2d47", bottom: "#243b55", glow: "#d98a7a", glowOpacity: 0.3, haze: "#3a4a66", hazeOpacity: 0.55, stars: 0.5, clouds: 0.25, flare: 0.1, moon: 0.4, neon: 0.9 };
const SUNRISE: Palette = { top: "#2f4fa8", mid: "#b8658a", bottom: "#f7c59f", glow: "#ffd3a0", glowOpacity: 0.85, haze: "#f7c59f", hazeOpacity: 0.6, stars: 0.08, clouds: 0.45, flare: 0.7, moon: 0, neon: 0.5 };
const DAY: Palette = { top: "#2980b9", mid: "#6dd5fa", bottom: "#ffffff", glow: "#fff7d6", glowOpacity: 0.55, haze: "#ffffff", hazeOpacity: 0.5, stars: 0, clouds: 0.6, flare: 0.15, moon: 0, neon: 0.1 };
const GOLDEN: Palette = { top: "#2f6fb0", mid: "#9fc3e3", bottom: "#f6c27a", glow: "#ffc06a", glowOpacity: 0.8, haze: "#f6c27a", hazeOpacity: 0.55, stars: 0, clouds: 0.5, flare: 0.75, moon: 0, neon: 0.3 };
const TWILIGHT: Palette = { top: "#2f4fa8", mid: "#8a2893", bottom: "#e6007e", glow: "#ff8aa8", glowOpacity: 0.6, haze: "#e6007e", hazeOpacity: 0.45, stars: 0.3, clouds: 0.35, flare: 0.45, moon: 0, neon: 0.85 };
const DUSK: Palette = { top: "#141852", mid: "#5d3b9e", bottom: "#b81488", glow: "#ff6fa0", glowOpacity: 0.35, haze: "#b81488", hazeOpacity: 0.45, stars: 0.6, clouds: 0.25, flare: 0.15, moon: 0.5, neon: 1 };

type Key = { alt: number; p: Palette };
const MORNING_KEYS: Key[] = [
  { alt: -18, p: NIGHT },
  { alt: -9, p: PREDAWN },
  { alt: 0, p: SUNRISE },
  { alt: 12, p: DAY },
];
const EVENING_KEYS: Key[] = [
  { alt: 12, p: DAY },
  { alt: 6, p: GOLDEN },
  { alt: -3, p: TWILIGHT },
  { alt: -10, p: DUSK },
  { alt: -18, p: NIGHT },
];

function blend(a: Palette, b: Palette, t: number): Palette {
  const out = {} as Record<string, string | number>;
  for (const k of Object.keys(a) as (keyof Palette)[]) {
    const va = a[k];
    const vb = b[k];
    out[k] = typeof va === "number" ? va + ((vb as number) - va) * t : mix(va, vb as string, t);
  }
  return out as unknown as Palette;
}

export function paletteFor(sun: SunState): Palette {
  const keys = [...(sun.morning ? MORNING_KEYS : EVENING_KEYS)].sort((x, y) => x.alt - y.alt);
  const alt = sun.altitude;
  if (alt <= keys[0].alt) return keys[0].p;
  if (alt >= keys[keys.length - 1].alt) return keys[keys.length - 1].p;
  for (let i = 0; i < keys.length - 1; i++) {
    const lo = keys[i];
    const hi = keys[i + 1];
    if (alt >= lo.alt && alt <= hi.alt) {
      const t = (alt - lo.alt) / (hi.alt - lo.alt);
      return blend(lo.p, hi.p, t * t * (3 - 2 * t));
    }
  }
  return keys[keys.length - 1].p;
}

/** Chrome text color that reads on the sky where the chrome sits (top and bottom bands). */
export function chromeFor(p: Palette) {
  const dark = "#1f1a17";
  const light = "#f6efe3";
  const pick = (bg: string) => (contrast(dark, bg) >= contrast(light, bg) ? dark : light);
  return { top: pick(p.top), bottom: pick(p.bottom) };
}

export const PINS = {
  predawn: { label: "Pre-dawn", sun: { altitude: -8, morning: true } },
  sunrise: { label: "Sunrise", sun: { altitude: 1, morning: true } },
  midday: { label: "Midday", sun: { altitude: 50, morning: true } },
  golden: { label: "Golden hour", sun: { altitude: 5, morning: false } },
  twilight: { label: "Twilight", sun: { altitude: -3, morning: false } },
  night: { label: "Night", sun: { altitude: -30, morning: false } },
} as const;
export type PinId = keyof typeof PINS;
export const PIN_IDS = Object.keys(PINS) as PinId[];

export function isPin(v: string | null): v is PinId {
  return v !== null && v in PINS;
}
