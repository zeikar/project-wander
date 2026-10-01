// The day's sky over the whole page, drawn in the guide's own ink: rain as
// fine hatching slanted by the wind, a few strokes of breeze on a clear day,
// and fog as paper-coloured haze. Purely decorative — it never covers a
// control (pointer-events: none) and goes still for reduced motion.
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
      ) : (
        <Strokes kind={weather.sky === "rain" ? "rain" : "breeze"} wind={weather.wind} />
      )}
    </div>
  );
}

interface Stroke {
  x: number;
  y: number;
  length: number;
  speed: number;
}

function Strokes({ kind, wind }: { kind: "rain" | "breeze"; wind: Weather["wind"] }) {
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
    const dir = wind === "behind" ? 1 : -1;
    let width = 0;
    let height = 0;
    let strokes: Stroke[] = [];

    const make = (anywhere: boolean): Stroke =>
      kind === "rain"
        ? {
            x: Math.random() * width * 1.2 - width * 0.1,
            y: anywhere ? Math.random() * height : -20 - Math.random() * height * 0.2,
            length: 10 + Math.random() * 14,
            speed: 7 + Math.random() * 5,
          }
        : {
            x: anywhere ? Math.random() * width : dir > 0 ? -160 : width + 160,
            y: Math.random() * height,
            length: 60 + Math.random() * 90,
            speed: 0.6 + Math.random() * 0.8,
          };

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      el.width = width * ratio;
      el.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = kind === "rain" ? Math.round((width * height) / 9000) : 5;
      strokes = Array.from({ length: count }, () => make(true));
      if (still) {
        draw();
      }
    };

    // Rain leans with the wind; a breeze is a long, shallow arc.
    const slant = kind === "rain" ? 0.28 * dir : 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = ink;
      ctx.lineCap = "round";
      for (const s of strokes) {
        ctx.globalAlpha = kind === "rain" ? (dark ? 0.22 : 0.16) : dark ? 0.16 : 0.12;
        ctx.lineWidth = kind === "rain" ? 1 : 1.2;
        ctx.beginPath();
        if (kind === "rain") {
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + s.length * slant, s.y + s.length);
        } else {
          ctx.moveTo(s.x, s.y);
          ctx.quadraticCurveTo(s.x + (s.length / 2) * dir, s.y - 8, s.x + s.length * dir, s.y);
        }
        ctx.stroke();
      }
    };

    const step = () => {
      for (const s of strokes) {
        if (kind === "rain") {
          s.y += s.speed;
          s.x += s.speed * slant;
          if (s.y > height + 20) {
            Object.assign(s, make(false));
          }
        } else {
          s.x += s.speed * dir;
          if ((dir > 0 && s.x > width + 160) || (dir < 0 && s.x < -160 - s.length)) {
            Object.assign(s, make(false));
          }
        }
      }
      draw();
      frame = requestAnimationFrame(step);
    };

    let frame = 0;
    resize();
    if (!still) {
      frame = requestAnimationFrame(step);
    }
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [kind, wind, still, dark]);

  return <canvas ref={canvas} className="strokes" />;
}
