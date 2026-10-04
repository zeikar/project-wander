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
// Wind itself cannot be seen. What reads as wind is a brush stroke swooping by
// on a curving path — drawn on at the head, lifted at the tail — and, in a
// gale, torn grass tumbling past. Strokes are kept short, curved and slanted,
// so they never pass for a rule under the text or a road on the map. The pace
// is steady: wind that speeds up and slows down read as a fault, and slow
// specks on a mild day as dust on the screen.

interface Streak {
  x: number;
  y: number;
  length: number;
  rise: number; // how far the path climbs or falls over its length
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
  flutter: number;
  drift: number;
}

interface WindKind {
  streaks: (w: number, h: number) => number;
  flecks: (w: number, h: number) => number;
  streakSpeed: [number, number];
  streakWeight: [number, number];
  streakGap: number; // how long a spent stroke waits before the next, in path lengths
  pace: [number, number];
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
    const seg = 0.45; // how much of its path a stroke shows at once

    const streak = (spread: boolean): Streak => {
      const length = Math.min(between(150, 260), width * 0.55);
      return {
        x: dir > 0 ? between(-0.1, 0.75) * width : between(0.25, 1.1) * width,
        y: between(0.08, 0.92) * height,
        length,
        rise: length * between(0.12, 0.3) * (Math.random() < 0.5 ? -1 : 1),
        amp: between(16, 30),
        waves: between(0.55, 0.9),
        phase: Math.random() * Math.PI * 2,
        t: spread ? between(0.2, 1.2) : -Math.random() * kind.streakGap,
        speed: between(...kind.streakSpeed),
        weight: between(...kind.streakWeight),
      };
    };

    const fleck = (anywhere: boolean): Fleck => ({
      x: anywhere ? Math.random() * width : dir > 0 ? -30 : width + 30,
      y: Math.random() * height,
      pace: between(...kind.pace),
      angle: Math.random() * Math.PI * 2,
      spin: between(-0.1, 0.1),
      size: between(...kind.size),
      flutter: Math.random() * Math.PI * 2,
      drift: between(-0.15, 0.25),
    });

    const at = (s: Streak, u: number) => ({
      x: s.x + dir * s.length * u,
      y: s.y + s.rise * u + s.amp * Math.sin(s.phase + u * s.waves * Math.PI * 2),
    });

    // One filled ribbon, pointed at both ends of what shows: a brush set down
    // and lifted, not a line of beads.
    const drawStreak = (s: Streak, alpha: number) => {
      const a = Math.max(0, s.t - seg);
      const b = Math.min(1, s.t);
      if (b - a < 0.02) {
        return;
      }
      const steps = 24;
      const weight = s.weight * Math.min(1, (b - a) / seg);
      const left: { x: number; y: number }[] = [];
      const right: { x: number; y: number }[] = [];
      for (let i = 0; i <= steps; i++) {
        const u = a + ((b - a) * i) / steps;
        const p = at(s, u);
        const q = at(s, Math.min(1, u + 0.01));
        const r = at(s, Math.max(0, u - 0.01));
        const dx = q.x - r.x;
        const dy = q.y - r.y;
        const n = Math.hypot(dx, dy) || 1;
        const half = (weight / 2) * Math.sin((Math.PI * i) / steps);
        left.push({ x: p.x - (dy / n) * half, y: p.y + (dx / n) * half });
        right.push({ x: p.x + (dy / n) * half, y: p.y - (dx / n) * half });
      }
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(left[0]!.x, left[0]!.y);
      for (const p of left) ctx.lineTo(p.x, p.y);
      for (const p of right.reverse()) ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.fill();
    };

    // A torn blade of grass, curling.
    const drawFleck = (f: Fleck) => {
      const z = f.size;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-z * 1.2, 0);
      ctx.quadraticCurveTo(0, z * 0.7, z * 1.2, -z * 0.4);
      ctx.stroke();
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
        const alpha = dark ? kind.alpha.dark : kind.alpha.light;
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = ink;
        ctx.fillStyle = ink;
        ctx.lineCap = "round";

        for (const s of streaks) {
          s.t += s.speed * dt;
          if (s.t - seg > 1) {
            Object.assign(s, streak(false));
          }
          drawStreak(s, alpha);
        }

        ctx.globalAlpha = alpha;
        for (const f of flecks) {
          f.x += dir * f.pace * dt;
          f.y += (Math.sin(clock * 0.06 + f.flutter) * kind.flutter + f.drift) * dt;
          f.angle += f.spin * dt;
          if (f.x < -40 || f.x > width + 40 || f.y < -40 || f.y > height + 40) {
            Object.assign(f, fleck(false));
          }
          drawFleck(f);
        }
      },
    };
  };

// A clear day: now and then one soft stroke, and nothing blown about.
const breeze = windPaint({
  streaks: () => 1,
  flecks: () => 0,
  streakSpeed: [0.007, 0.011],
  streakWeight: [1.6, 2.2],
  streakGap: 3,
  pace: [0, 0],
  size: [0, 0],
  flutter: 0,
  alpha: { light: 0.3, dark: 0.38 },
});

// A gale: strokes swooping by and torn grass tumbling past.
const gale = windPaint({
  streaks: (w, h) => Math.min(6, 1 + Math.floor((w * h) / 200000)),
  flecks: (w, h) => Math.min(24, 6 + Math.floor((w * h) / 60000)),
  streakSpeed: [0.018, 0.026],
  streakWeight: [2.2, 3.4],
  streakGap: 1.2,
  pace: [4.5, 6.5],
  size: [4.5, 7],
  flutter: 1.1,
  alpha: { light: 0.34, dark: 0.44 },
});
