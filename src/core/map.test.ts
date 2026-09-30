import { describe, expect, it } from "vitest";
import { findScene } from "../content/scenes";
import { ROAD_DAYS, destinations } from "../content/world";
import { generateMap } from "./map";

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);

describe("generateMap", () => {
  it("makes the same map from the same seed", () => {
    expect(generateMap(42)).toEqual(generateMap(42));
  });

  it("makes different maps from different seeds", () => {
    const shapes = new Set(SEEDS.map((s) => JSON.stringify(generateMap(s))));
    expect(shapes.size).toBeGreaterThan(SEEDS.length * 0.9);
  });

  it.each(SEEDS)("seed %i: a village, road days, and every destination", (seed) => {
    const map = generateMap(seed);
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
      destinations.map((d) => d.id).sort(),
    );
  });

  it.each(SEEDS)("seed %i: every node is reachable and leads on, with no roads crossing", (seed) => {
    const { layers, next } = generateMap(seed);
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
});
