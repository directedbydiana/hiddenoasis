"use client";

import { useEffect, useMemo, useState } from "react";
import type { Palette, SunState } from "@/lib/daylight";

// Deterministic pseudo-random so server and client draw the same stars.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const T = "transition-[opacity,background,transform] duration-[2500ms] ease-linear";

// A layered, cinematic sky: gradient base, sun or moon with bloom, horizon
// glow, drifting haze and clouds, stars at night, a faint anamorphic flare,
// vignette and film grain. Everything blends with the time-of-day palette.
export default function Sky({ palette: p, sun }: { palette: Palette; sun: SunState }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);

  const stars = useMemo(() => {
    const rnd = mulberry32(9);
    return Array.from({ length: 220 }, () => ({ x: rnd() * 100, y: rnd() * 70, r: 0.4 + rnd() * 1.1, d: 2.5 + rnd() * 5, o: 0.35 + rnd() * 0.65 }));
  }, []);

  // Sun rises on the left and sets on the right, staying clear of the sign at
  // noon; the disc fades out once it is well below the horizon.
  const sunX = sun.morning ? 16 + Math.max(0, sun.altitude) * 0.22 : 84 - Math.max(0, sun.altitude) * 0.22;
  const sunY = Math.max(10, Math.min(88, 70 - sun.altitude * 1.1));
  const sunVis = Math.max(0, Math.min(1, (sun.altitude + 8) / 8)) * (1 - p.moon);
  const moonX = 76;
  const moonY = 18;

  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      {/* base gradient */}
      <div className={`absolute inset-0 ${T}`} style={{ background: `linear-gradient(180deg, ${p.top} 0%, ${p.mid} 55%, ${p.bottom} 100%)` }} />

      {/* stars */}
      <svg className={`absolute inset-0 w-full h-full ${T}`} style={{ opacity: p.stars }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.12} fill="#fff" className={reduced ? undefined : "twinkle"} style={{ opacity: s.o, animationDuration: `${s.d}s` }} />
        ))}
      </svg>

      {/* sun with bloom */}
      <div
        className={`absolute w-[70vmin] h-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full ${T}`}
        style={{
          left: `${sunX}%`,
          top: `${sunY}%`,
          opacity: sunVis * p.glowOpacity,
          background: `radial-gradient(circle, ${p.glow} 0%, ${p.glow}99 12%, ${p.glow}33 35%, transparent 70%)`,
          filter: "blur(6px)",
        }}
      />
      <div
        className={`absolute w-[9vmin] h-[9vmin] -translate-x-1/2 -translate-y-1/2 rounded-full ${T}`}
        style={{ left: `${sunX}%`, top: `${sunY}%`, opacity: sunVis * Math.min(1, p.glowOpacity + 0.2), background: "#fff8e6", boxShadow: `0 0 40px 20px ${p.glow}` }}
      />
      {/* anamorphic flare */}
      <div
        className={`absolute h-[2px] w-[80vw] -translate-x-1/2 -translate-y-1/2 ${T}`}
        style={{ left: `${sunX}%`, top: `${sunY}%`, opacity: p.flare * 0.7 * sunVis, background: `linear-gradient(90deg, transparent, ${p.glow}, #ffffff, ${p.glow}, transparent)`, filter: "blur(1.5px)" }}
      />

      {/* moon with soft halo */}
      <div
        className={`absolute w-[46vmin] h-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full ${T}`}
        style={{ left: `${moonX}%`, top: `${moonY}%`, opacity: p.moon * 0.5, background: "radial-gradient(circle, rgba(200,214,255,0.55) 0%, rgba(200,214,255,0.12) 30%, transparent 70%)", filter: "blur(4px)" }}
      />
      <div
        className={`absolute w-[6vmin] h-[6vmin] -translate-x-1/2 -translate-y-1/2 rounded-full ${T}`}
        style={{ left: `${moonX}%`, top: `${moonY}%`, opacity: p.moon, background: "radial-gradient(circle at 38% 35%, #ffffff, #d9deea 60%, #b7bdd1)", boxShadow: "0 0 30px 10px rgba(200,214,255,0.35)" }}
      />

      {/* horizon glow */}
      <div className={`absolute inset-x-0 bottom-0 h-[45%] ${T}`} style={{ opacity: p.glowOpacity * 0.6, background: `linear-gradient(180deg, transparent, ${p.glow}66 70%, ${p.glow}99)` }} />

      {/* drifting clouds and low haze */}
      <div className={`absolute inset-0 ${T}`} style={{ opacity: p.clouds }}>
        <div className={`absolute left-[-20%] top-[14%] w-[70%] h-[22%] rounded-full bg-white/70 blur-3xl ${reduced ? "" : "drift-slow"}`} />
        <div className={`absolute left-[45%] top-[30%] w-[60%] h-[16%] rounded-full bg-white/50 blur-3xl ${reduced ? "" : "drift-slower"}`} />
        <div className={`absolute left-[10%] top-[48%] w-[50%] h-[12%] rounded-full bg-white/40 blur-3xl ${reduced ? "" : "drift-slow"}`} />
      </div>
      <div className={`absolute inset-x-0 bottom-0 h-[40%] ${T}`} style={{ opacity: p.hazeOpacity, background: `linear-gradient(180deg, transparent, ${p.haze})` }} />

      {/* vignette and grain */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.45) 100%)" }} />
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
