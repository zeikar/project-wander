import { describe, expect, it } from "vitest";
import { findScene } from "../content/scenes";
import { ROAD_DAYS, regions } from "../content/world";
import { generateMap } from "./map";

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);

describe.each(regions)("generateMap in $id", (region) => {
  it("makes the same map from the same seed", () => {
    expect(generateMap(42, region)).toEqual(generateMap(42, region));
  });

  it("makes different maps from different seeds", () => {
    const shapes = new Set(SEEDS.map((s) => JSON.stringify(generateMap(s, region))));
    expect(shapes.size).toBeGreaterThan(SEEDS.length * 0.9);
  });

  it.each(SEEDS)("seed %i: a village, road days, and every destination", (seed) => {
    const map = generateMap(seed, region);
    expect(map.layers).toHaveLength(ROAD_DAYS + 2);
    expect(map.layers[0]!.map((n) => n.kind)).toEqual(["start"]);
    for (const row of map.layers.slice(1, -1)) {
      expect(row.length).toBeGreaterThanOrEqual(2);
      expect(row.length).toBeLessThanOrEqual(3);
      for (const node of row) {
        if (node.kind === "scene") {
          const scene = findScene(node.sceneId!);
          expect(scene).toBeDefined();
          expect(scene!.variants).toContain(node.variant);
        } else {
          expect(node.kind).toBe("quiet");
        }
      }
    }
    expect(map.layers.at(-1)!.map((n) => n.destinationId).sort()).toEqual(
      region.destinations.map((d) => d.id).sort(),
    );
  });

  it.each(SEEDS)("seed %i: every node is reachable and leads on, with no roads crossing", (seed) => {
    const { layers, next } = generateMap(seed, region);
    for (let layer = 0; layer < layers.length - 1; layer++) {
      const from = layers[layer]!;
      const to = layers[layer + 1]!;
      for (const node of from) {
        expect(next[node.id]!.length, node.id).toBeGreaterThan(0);
        for (const target of next[node.id]!) {
          expect(to.map((n) => n.id)).toContain(target);
        }
      }
      for (const node of to) {
        expect(from.some((f) => next[f.id]!.includes(node.id)), node.id).toBe(true);
      }
      const edges = from.flatMap((f) =>
        next[f.id]!.map((t) => [f.index, to.find((n) => n.id === t)!.index] as const),
      );
      for (const [a, b] of edges) {
        for (const [c, d] of edges) {
          expect(a < c && b > d, `${seed}: ${a}->${b} crosses ${c}->${d}`).toBe(false);
        }
      }
    }
  });

  it.each(SEEDS)("seed %i: a sky for every day, and scent scenes follow the wind", (seed) => {
    const map = generateMap(seed, region);
    expect(map.weather).toHaveLength(map.layers.length);
    for (const node of map.layers.flat()) {
      const scene = node.sceneId ? findScene(node.sceneId) : undefined;
      if (!scene?.byWind) {
        continue;
      }
      const w = map.weather[node.layer]!;
      expect(node.variant).toBe(w.sky === "rain" ? scene.byWind.rain : scene.byWind[w.wind]);
    }
  });

  it("brings every sky and both winds over enough journeys", () => {
    const all = SEEDS.flatMap((s) => generateMap(s, region).weather);
    for (const sky of ["clear", "rain", "fog"]) {
      expect(all.some((w) => w.sky === sky), sky).toBe(true);
    }
    for (const wind of ["behind", "ahead"]) {
      expect(all.some((w) => w.wind === wind), wind).toBe(true);
    }
  });

  it("fills the road only from its own species and places, and its odds reach the sky", () => {
    const scenesSeen = SEEDS.flatMap((s) =>
      generateMap(s, region).layers.flat().flatMap((n) => (n.sceneId ? [findScene(n.sceneId)!] : [])),
    );
    for (const scene of scenesSeen) {
      expect(
        region.places.includes(scene.id) || (scene.species && region.species.includes(scene.species)),
        scene.id,
      ).toBe(true);
    }
    const days = SEEDS.flatMap((s) => generateMap(s, region).weather);
    const fog = days.filter((w) => w.sky === "fog").length / days.length;
    expect(Math.abs(fog - region.skyOdds.fog)).toBeLessThan(0.08);
  });
});
