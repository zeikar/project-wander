// The region a journey crosses, made once from the seed. Everything that can
// happen on it — which scene stands at each node, and what is actually going
// on there — is decided here, so play itself needs no randomness at all.
import { rollRandom } from "./rng";
import { findScene, scenes } from "../content/scenes";
import type { FactId, Region, Scene, Weather } from "../content/types";
import { NODE_ODDS, ROAD_DAYS } from "../content/world";

export interface MapNode {
  id: string;
  layer: number; // 0 = the village, ROAD_DAYS + 1 = the destinations
  index: number;
  kind: "start" | "scene" | "quiet" | "destination";
  sceneId?: string;
  variant?: string;
  destinationId?: string;
}

export interface WorldMap {
  layers: readonly (readonly MapNode[])[];
  next: Readonly<Record<string, readonly string[]>>;
  // The sky over each layer's day, indexed like `layers`.
  weather: readonly Weather[];
}

export function generateMap(seed: number, region: Region): WorldMap {
  let state = seed >>> 0;
  const roll = () => {
    const r = rollRandom(state);
    state = r.nextState;
    return r.value;
  };
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(roll() * items.length)]!;

  const weather: Weather[] = [];
  for (let layer = 0; layer <= ROAD_DAYS + 1; layer++) {
    const r = roll();
    weather.push({
      sky: r < region.skyOdds.rain ? "rain" : r < region.skyOdds.rain + region.skyOdds.fog ? "fog" : "clear",
      wind: roll() < 0.5 ? "behind" : "ahead",
    });
  }

  const layers: MapNode[][] = [[{ id: "0-0", layer: 0, index: 0, kind: "start" }]];

  for (let layer = 1; layer <= ROAD_DAYS; layer++) {
    const width = roll() < 0.5 ? 2 : 3;
    const row: MapNode[] = [];
    for (let index = 0; index < width; index++) {
      // No day offers the same thing twice: no scene beside itself, and one
      // quiet road at most.
      let node: MapNode;
      do {
        node = roadNode(layer, index, weather[layer]!, region, roll, pick);
      } while (row.some((n) => (n.sceneId ?? "quiet") === (node.sceneId ?? "quiet")));
      row.push(node);
    }
    layers.push(row);
  }

  // Every far place's key can be learned somewhere on the map by anyone who
  // stops there, so a miss can always point at a road that held it. Where the
  // roll left none, one road becomes one that does — never the only road
  // holding another far place's key, and never a scene its day already has.
  const road = () => layers.slice(1).flat();
  for (const { needs } of region.destinations) {
    if (road().some((n) => teaches(n, needs))) {
      continue;
    }
    const others = region.destinations.map((d) => d.needs).filter((f) => f !== needs);
    const choices = road()
      .filter((spot) => !others.some((f) => teaches(spot, f) && road().filter((n) => teaches(n, f)).length === 1))
      .flatMap((spot) =>
        regionScenes(region).flatMap((scene) =>
          scene.variants
            .map((variant) => ({ ...spot, kind: "scene" as const, sceneId: scene.id, variant }))
            .filter(
              (node) =>
                teaches(node, needs) &&
                node.variant === variantFor(scene, weather[spot.layer]!, node.variant) &&
                !layers[spot.layer]!.some((n) => n !== spot && n.sceneId === scene.id),
            ),
        ),
      );
    const chosen = pick(choices);
    layers[chosen.layer]![chosen.index] = chosen;
  }

  const shuffled = [...region.destinations];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  layers.push(
    shuffled.map((destination, index) => ({
      id: `${ROAD_DAYS + 1}-${index}`,
      layer: ROAD_DAYS + 1,
      index,
      kind: "destination" as const,
      destinationId: destination.id,
    })),
  );

  const next: Record<string, string[]> = {};
  for (let layer = 0; layer < layers.length - 1; layer++) {
    const from = layers[layer]!;
    const to = layers[layer + 1]!;
    for (const node of from) {
      next[node.id] = [];
    }
    for (const [j, k] of connect(from.length, to.length, roll)) {
      next[from[j]!.id]!.push(to[k]!.id);
    }
  }
  for (const node of layers[layers.length - 1]!) {
    next[node.id] = [];
  }

  return { layers, next, weather };
}

// Whether anyone stopping at this node could learn `fact` there: an option
// that needs nothing known teaches it in what is going on.
function teaches(node: MapNode, fact: FactId): boolean {
  const scene = node.sceneId === undefined ? undefined : findScene(node.sceneId);
  return (
    scene !== undefined &&
    scene.options.some((o) => o.needs === undefined && o.outcomes[node.variant!]!.learn === fact)
  );
}

function regionScenes(region: Region): readonly Scene[] {
  return scenes.filter(
    (s) => region.places.includes(s.id) || (s.species !== undefined && region.species.includes(s.species)),
  );
}

// A scent scene's variant is the day's sky and wind; any other keeps its roll.
function variantFor(scene: Scene, weather: Weather, rolled: string): string {
  if (!scene.byWind) {
    return rolled;
  }
  return weather.sky === "rain" ? scene.byWind.rain : scene.byWind[weather.wind];
}

function roadNode(
  layer: number,
  index: number,
  weather: Weather,
  region: Region,
  roll: () => number,
  pick: <T>(items: readonly T[]) => T,
): MapNode {
  const id = `${layer}-${index}`;
  const r = roll();
  // A scent scene is decided by the day's sky; the roll is still taken so the
  // rest of the map does not shift when a scene gains or loses `byWind`.
  const variantOf = (scene: Scene) => variantFor(scene, weather, pick(scene.variants));
  if (r < NODE_ODDS.animal) {
    // Species first, then its situation, so an animal with more situations is
    // not met more often than the others.
    const animal = pick(region.species);
    const scene = pick(scenes.filter((s) => s.species === animal));
    return { id, layer, index, kind: "scene", sceneId: scene.id, variant: variantOf(scene) };
  }
  if (r < NODE_ODDS.animal + NODE_ODDS.place) {
    const scene = pick(scenes.filter((s) => s.kind === "place" && region.places.includes(s.id)));
    return { id, layer, index, kind: "scene", sceneId: scene.id, variant: variantOf(scene) };
  }
  return { id, layer, index, kind: "quiet" };
}

// Roads between two layers: every node leads on to the two nodes nearest
// across from it, ties settled by the roll, and every node has a way in.
// Roads may cross, as roads do; kept apart, a third of all days would have a
// single road on, and that is no choice at all.
function connect(
  a: number,
  b: number,
  roll: () => number,
): [number, number][] {
  const pos = (i: number, n: number) => (n === 1 ? 0.5 : i / (n - 1));
  const gap = (j: number, k: number) => Math.abs(pos(j, a) - pos(k, b));
  const edges: [number, number][] = [];
  for (let j = 0; j < a; j++) {
    const near = Array.from({ length: b }, (_, k) => ({ k, d: gap(j, k) + roll() * 1e-6 }))
      .sort((x, y) => x.d - y.d)
      .slice(0, 2);
    edges.push(...near.map(({ k }): [number, number] => [j, k]));
  }
  for (let k = 0; k < b; k++) {
    if (!edges.some(([, t]) => t === k)) {
      const j = Array.from({ length: a }, (_, i) => i).reduce((x, y) => (gap(y, k) < gap(x, k) ? y : x));
      edges.push([j, k]);
    }
  }
  // Listed left to right, the way the map draws them.
  return edges.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
}
