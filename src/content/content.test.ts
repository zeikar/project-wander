import { describe, expect, it } from "vitest";
import { scenes } from "./scenes";
import { allFacts, speciesOfFact } from "./species";
import { destinations } from "./world";

describe("scenes", () => {
  it("give every option an outcome for every variant, and no other", () => {
    for (const scene of scenes) {
      for (const option of scene.options) {
        expect(Object.keys(option.outcomes).sort(), `${scene.id}/${option.id}`).toEqual(
          [...scene.variants].sort(),
        );
      }
    }
  });

  it("have unique option ids within a scene", () => {
    for (const scene of scenes) {
      const ids = scene.options.map((o) => o.id);
      expect(new Set(ids).size, scene.id).toBe(ids.length);
    }
  });

  it("keep an animal's facts to that animal", () => {
    for (const scene of scenes.filter((s) => s.kind === "animal")) {
      expect(scene.species, scene.id).toBeDefined();
      expect(scene.reads, scene.id).toBeDefined();
      const facts = [
        scene.reads!,
        ...scene.options.flatMap((o) => [
          ...(o.needs ? [o.needs] : []),
          ...Object.values(o.outcomes).flatMap((out) => (out.learn ? [out.learn] : [])),
        ]),
      ];
      for (const fact of facts) {
        expect(speciesOfFact(fact), `${scene.id}: ${fact}`).toBe(scene.species);
      }
    }
  });

  it("only offer study options that teach in every variant", () => {
    for (const scene of scenes) {
      for (const option of scene.options.filter((o) => o.study)) {
        for (const outcome of Object.values(option.outcomes)) {
          expect(outcome.learn, `${scene.id}/${option.id}`).toBeDefined();
        }
      }
    }
  });

  // A fact nothing can teach strands every option and destination behind it.
  it("teach every fact somewhere by watching", () => {
    const taught = new Set(
      scenes.flatMap((s) =>
        s.options
          .filter((o) => o.study)
          .flatMap((o) => Object.values(o.outcomes).map((out) => out.learn)),
      ),
    );
    for (const fact of allFacts) {
      expect(taught.has(fact), fact).toBe(true);
    }
    for (const d of destinations) {
      expect(taught.has(d.needs), d.id).toBe(true);
    }
  });

  it("only drive a scene by the wind with variants it has", () => {
    for (const scene of scenes.filter((s) => s.byWind)) {
      for (const variant of Object.values(scene.byWind!)) {
        expect(scene.variants, scene.id).toContain(variant);
      }
    }
  });
});
