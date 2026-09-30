import { describe, expect, it } from "vitest";
import { scenes } from "../content/scenes";
import { allFacts, species } from "../content/species";
import { destinations } from "../content/world";
import { detectLocale, locales, resultText } from ".";

// Every registered locale, checked against the game data itself — so a new
// language, a new scene or a new option all land here without editing it.
describe.each(Object.entries(locales))("locale %s", (_, strings) => {
  it("has every scene, variant and option, and nothing the game lacks", () => {
    expect(Object.keys(strings.scenes).sort()).toEqual(
      scenes.map((s) => s.id).sort(),
    );
    for (const scene of scenes) {
      const text = strings.scenes[scene.id]!;
      for (const field of [text.place, text.sign, text.title, text.description]) {
        expect(field, scene.id).not.toBe("");
      }
      if (scene.kind === "animal") {
        expect(text.signKnown, scene.id).toBeTruthy();
      }

      expect(Object.keys(text.variants).sort(), scene.id).toEqual(
        [...scene.variants].sort(),
      );
      for (const variant of scene.variants) {
        const v = text.variants[variant]!;
        if (scene.kind === "animal") {
          expect(v.tell, `${scene.id}/${variant}`).toBeTruthy();
        }
        if (scene.reads !== undefined) {
          expect(v.reading, `${scene.id}/${variant}`).toBeTruthy();
        }
      }

      expect(Object.keys(text.options).sort(), scene.id).toEqual(
        scene.options.map((o) => o.id).sort(),
      );
      for (const option of scene.options) {
        expect(text.options[option.id]!.label).toBeTruthy();
        for (const variant of scene.variants) {
          expect(
            resultText(strings, scene.id, option.id, variant),
            `${scene.id}/${option.id}/${variant}`,
          ).toBeTruthy();
        }
      }
    }
  });

  it("has every fact, species and destination", () => {
    for (const fact of allFacts) {
      expect(strings.facts[fact], fact).toBeTruthy();
    }
    for (const s of species) {
      expect(strings.species[s.id].name).toBeTruthy();
    }
    expect(Object.keys(strings.destinations).sort()).toEqual(
      destinations.map((d) => d.id).sort(),
    );
    for (const d of destinations) {
      const text = strings.destinations[d.id]!;
      for (const field of [text.name, text.rumor, text.sight, text.missed, text.hint]) {
        expect(field, d.id).toBeTruthy();
      }
    }
    expect(strings.quiet.lines.length).toBeGreaterThan(0);
  });
});

describe("detectLocale", () => {
  it("prefers a saved choice, then the browser, then the default", () => {
    expect(detectLocale("ko", ["en-US"])).toBe("ko");
    expect(detectLocale(null, ["ko-KR"])).toBe("ko");
    expect(detectLocale("nope", ["xx"])).toBe("ko");
  });
});
