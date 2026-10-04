// The day's sky over the whole page, drawn in the guide's own ink: rain as
// fine hatching slanted by the wind, wind as what it carries, and fog as
// paper-coloured haze. Purely decorative — it never covers a control
// (pointer-events: none) and holds still for reduced motion.
import { useEffect, useRef } from "react";
import type { Weather } from "../content/types";
import { useMedia } from "./parts";

export function WeatherSky({ weather }: { weather: Weather | undefined }) {
  if (weather === undefined) {
    return null;
  }
  return (
    <div className={`sky sky--${weather.sky}`} aria-hidden="true" key={`${weather.sky}-${weather.wind}`}>
      {weather.sky === "fog" ? (
        <>
          <div className="mist mist--a" />
          <div className="mist mist--b" />
        </>
      ) : weather.sky === "rain" ? (
        <SkyCanvas paint={rain} wind={weather.wind} />
      ) : (
        <SkyCanvas paint={weather.sky === "gale" ? gale : breeze} wind={weather.wind} />
      )}
    </div>
  );
}

// What a sky draws: told the canvas size, then asked for a frame, `dt` in
// sixtieths of a second (0 for a still picture).
interface Painter {
  resize: (width: number, height: number) => void;
  frame: (dt: number) => void;
}
type Paint = (ctx: CanvasRenderingContext2D, ink: string, dark: boolean, dir: 1 | -1) => Painter;

function SkyCanvas({ paint, wind }: { paint: Paint; wind: Weather["wind"] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const still = useMedia("(prefers-reduced-motion: reduce)");
  const dark = useMedia("(prefers-color-scheme: dark)");

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) {
      return;
    }
    const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim();
    const painter = paint(ctx, ink, dark, wind === "behind" ? 1 : -1);

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      el.width = window.innerWidth * ratio;
      el.height = window.innerHeight * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      painter.resize(window.innerWidth, window.innerHeight);
      painter.frame(0);
    };

    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      // A tab coming back from the background must not fling everything at once.
      const dt = Math.min(3, (now - last) / (1000 / 60));
      last = now;
      painter.frame(dt);
      frame = requestAnimationFrame(step);
    };

    resize();
    if (!still) {
      frame = requestAnimationFrame(step);
    }
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [paint, wind, still, dark]);

  return <canvas ref={canvas} className="strokes" />;
}

const between = (a: number, b: number) => a + Math.random() * (b - a);

// ---- rain: short hatching, leaning with the wind ----------------------------

const rain: Paint = (ctx, ink, dark, dir) => {
  let width = 0;
  let height = 0;
  let drops: { x: number; y: number; length: number; speed: number }[] = [];
  const slant = 0.28 * dir;
  const drop = (anywhere: boolean) => ({
    x: between(-0.1, 1.1) * width,
    y: anywhere ? Math.random() * height : -20 - Math.random() * height * 0.2,
    length: between(10, 24),
    speed: between(7, 12),
  });

  return {
    resize(w, h) {
      width = w;
      height = h;
      drops = Array.from({ length: Math.round((w * h) / 9000) }, () => drop(true));
    },
    frame(dt) {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = ink;
      ctx.lineCap = "round";
      ctx.lineWidth = 1;
      ctx.globalAlpha = dark ? 0.22 : 0.16;
      for (const d of drops) {
        d.y += d.speed * dt;
        d.x += d.speed * slant * dt;
        if (d.y > height + 20) {
          Object.assign(d, drop(false));
        }
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.length * slant, d.y + d.length);
        ctx.stroke();
      }
    },
  };
};

// ---- wind: shown by what it carries -----------------------------------------
// Wind itself cannot be seen. What reads as wind is what rides it — seeds,
// leaves, bits of grass tumbling past — and the strength rising and falling in
// gusts, which everything follows. A few brush strokes travel along curving
// paths, drawn on at the head and lifted at the tail, thin at both ends.

interface Streak {
  x: number;
  y: number;
  length: number;
  amp: number;
  waves: number;
  phase: number;
  t: number; // where the head is along the path, 0..1 and past it
  speed: number;
  weight: number;
}

interface Fleck {
  x: number;
  y: number;
  pace: number;
  angle: number;
  spin: number;
  size: number;
  shape: "seed" | "leaf" | "blade";
  flutter: number;
  drift: number;
}

interface WindKind {
  gust: (clock: number) => number;
  streaks: (w: number, h: number) => number;
  flecks: (w: number, h: number) => number;
  streakLength: [number, number];
  streakSpeed: [number, number];
  streakWeight: [number, number];
  streakGap: number; // how long a spent streak waits before the next, in path lengths
  pace: [number, number];
  shapes: readonly Fleck["shape"][];
  size: [number, number];
  flutter: number;
  alpha: { light: number; dark: number };
}

const windPaint =
  (kind: WindKind): Paint =>
  (ctx, ink, dark, dir) => {
    let width = 0;
    let height = 0;
    let clock = 0;
    let streaks: Streak[] = [];
    let flecks: Fleck[] = [];
    const seg = 0.4; // how much of its path a streak shows at once

    const streak = (spread: boolean): Streak => {
      const length = between(...kind.streakLength);
      return {
        x: dir > 0 ? between(-0.25, 0.7) * width : between(0.3, 1.25) * width,
        y: between(0.05, 0.95) * height,
        length,
        amp: between(5, 14),
        waves: between(0.5, 1.1),
        phase: Math.random() * Math.PI * 2,
        t: spread ? between(-0.2, 1.2) : -Math.random() * kind.streakGap,
        speed: between(...kind.streakSpeed),
        weight: between(...kind.streakWeight),
      };
    };

    const fleck = (anywhere: boolean): Fleck => ({
      x: anywhere ? Math.random() * width : dir > 0 ? -30 : width + 30,
      y: Math.random() * height,
      pace: between(...kind.pace),
      angle: Math.random() * Math.PI * 2,
      spin: between(-0.12, 0.12),
      size: between(...kind.size),
      shape: kind.shapes[Math.floor(Math.random() * kind.shapes.length)]!,
      flutter: Math.random() * Math.PI * 2,
      drift: between(-0.15, 0.25),
    });

    const at = (s: Streak, u: number) => ({
      x: s.x + dir * s.length * u,
      y: s.y + s.amp * Math.sin(s.phase + u * s.waves * Math.PI * 2) + s.length * 0.04 * u,
    });

    const drawStreak = (s: Streak, alpha: number) => {
      const head = Math.min(1, s.t);
      const tail = Math.max(0, s.t - seg);
      if (head <= tail) {
        return;
      }
      const steps = 22;
      let prev = at(s, tail);
      for (let i = 1; i <= steps; i++) {
        const u = tail + ((head - tail) * i) / steps;
        const p = at(s, u);
        // Thin at both ends of what shows, like a brush lifted and set down.
        const along = (u - (s.t - seg)) / seg;
        const swell = Math.sin(Math.PI * Math.min(1, Math.max(0, along)));
        ctx.globalAlpha = alpha * swell;
        ctx.lineWidth = Math.max(0.3, s.weight * swell);
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        prev = p;
      }
    };

    const drawFleck = (f: Fleck) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      ctx.beginPath();
      if (f.shape === "seed") {
        ctx.lineWidth = 0.9;
        ctx.moveTo(-f.size, 0);
        ctx.lineTo(f.size * 0.6, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(f.size * 0.6, 0, Math.max(0.9, f.size * 0.22), 0, Math.PI * 2);
        ctx.fill();
      } else if (f.shape === "leaf") {
        ctx.moveTo(-f.size, 0);
        ctx.quadraticCurveTo(0, -f.size * 0.6, f.size, 0);
        ctx.quadraticCurveTo(0, f.size * 0.6, -f.size, 0);
        ctx.fill();
      } else {
        ctx.lineWidth = 0.9;
        ctx.moveTo(-f.size, 0);
        ctx.quadraticCurveTo(0, f.size * 0.5, f.size * 1.2, -f.size * 0.3);
        ctx.stroke();
      }
      ctx.restore();
    };

    return {
      resize(w, h) {
        width = w;
        height = h;
        streaks = Array.from({ length: kind.streaks(w, h) }, () => streak(true));
        flecks = Array.from({ length: kind.flecks(w, h) }, () => fleck(true));
      },
      frame(dt) {
        clock += dt;
        const g = kind.gust(clock);
        const alpha = dark ? kind.alpha.dark : kind.alpha.light;
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = ink;
        ctx.fillStyle = ink;
        ctx.lineCap = "round";

        for (const s of streaks) {
          s.t += s.speed * g * dt;
          if (s.t - seg > 1) {
            Object.assign(s, streak(false));
          }
          drawStreak(s, alpha * (0.45 + 0.55 * g));
        }

        ctx.globalAlpha = alpha;
        for (const f of flecks) {
          f.x += dir * f.pace * g * dt;
          f.y += (Math.sin(clock * 0.06 + f.flutter) * kind.flutter + f.drift) * dt;
          f.angle += f.spin * (0.4 + g) * dt;
          if (f.x < -40 || f.x > width + 40 || f.y < -40 || f.y > height + 40) {
            Object.assign(f, fleck(false));
          }
          drawFleck(f);
        }
      },
    };
  };

// A clear day: a few seeds drifting, now and then one soft stroke.
const breeze = windPaint({
  gust: (c) => 0.75 + 0.25 * Math.sin(c * 0.012),
  streaks: () => 1,
  flecks: (w, h) => 3 + Math.min(5, Math.floor((w * h) / 250000)),
  streakLength: [180, 300],
  streakSpeed: [0.005, 0.008],
  streakWeight: [1, 1.4],
  streakGap: 3,
  pace: [0.35, 0.7],
  shapes: ["seed"],
  size: [3, 5],
  flutter: 0.35,
  alpha: { light: 0.3, dark: 0.38 },
});

// A gale: the air full of torn grass and leaves, coming in gusts.
const gale = windPaint({
  // Two slow beats multiplied: lulls, then a gust every few seconds.
  gust: (c) => Math.max(0.25, 0.6 + 0.5 * Math.sin(c * 0.021) * Math.sin(c * 0.0083 + 1.3)),
  streaks: (w, h) => Math.min(10, 3 + Math.floor((w * h) / 120000)),
  flecks: (w, h) => Math.min(36, 12 + Math.floor((w * h) / 45000)),
  streakLength: [260, 520],
  streakSpeed: [0.016, 0.028],
  streakWeight: [1.4, 2.2],
  streakGap: 0.8,
  pace: [3.5, 7],
  shapes: ["seed", "leaf", "blade", "blade"],
  size: [2.5, 5.5],
  flutter: 1.1,
  alpha: { light: 0.32, dark: 0.42 },
});
