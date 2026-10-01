import { describe, expect, it } from "vitest";
import { scenes } from "../content/scenes";
import { allFacts, species } from "../content/species";
import { destinations, regions } from "../content/world";
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
      if (scene.kind !== "place") {
        expect(text.signKnown, scene.id).toBeTruthy();
      }

      expect(Object.keys(text.variants).sort(), scene.id).toEqual(
        [...scene.variants].sort(),
      );
      for (const variant of scene.variants) {
        const v = text.variants[variant]!;
        if (scene.kind !== "place") {
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
        if (option.closedIn) {
          expect(text.options[option.id]!.closed, `${scene.id}/${option.id}`).toBeTruthy();
        }
        // A misspelt variant key would silently fall back to "*".
        for (const key of Object.keys(text.options[option.id]!.result)) {
          expect([...scene.variants, "*"], `${scene.id}/${option.id}: ${key}`).toContain(key);
        }
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
      expect(strings.species[s.id].more).toBeTruthy();
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
  });

  it("has a name, a village and quiet days for every region, and a way to each one a gate opens", () => {
    const gated = regions.flatMap((r) => (r.gate ? [r.gate.to] : []));
    for (const r of regions) {
      const text = strings.regions[r.id];
      for (const field of [text.name, text.village.name, text.village.description, text.quiet.place, text.quiet.sign]) {
        expect(field, r.id).toBeTruthy();
      }
      expect(text.quiet.lines.length, r.id).toBeGreaterThan(0);
      if (gated.includes(r.id)) {
        expect(text.way, r.id).toBeTruthy();
      }
    }
  });
});

// Against a pretend registry of two, so every branch picks something other
// than the fallback at least once.
describe("detectLocale", () => {
  const two = ["ko", "en"] as const;
  it("prefers a saved choice, then the browser, then the default", () => {
    expect(detectLocale("en", ["ko-KR"], two, "ko")).toBe("en");
    expect(detectLocale(null, ["fr-FR", "en-GB"], two, "ko")).toBe("en");
    expect(detectLocale("nope", ["xx"], two, "ko")).toBe("ko");
    expect(detectLocale(null, [], two, "en")).toBe("en");
  });
});
